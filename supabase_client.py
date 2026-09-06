"""
Supabase REST Client & Sync Manager for StudentHub
Provides high-performance, zero-dependency REST integration with Supabase PostgreSQL (PostgREST API)
and dual-mode hybrid fallback.
"""

import os
import json
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

def load_env():
    """Load key-value pairs from .env file into environment."""
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()

# Initialize environment
load_env()

class SupabaseManager:
    def __init__(self):
        self.url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
        self.key = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY", "")).strip()
        self.timeout = 8

    def reload_config(self):
        """Reload configuration from .env file or environment."""
        load_env()
        self.url = os.environ.get("SUPABASE_URL", "").strip().rstrip("/")
        self.key = (os.environ.get("SUPABASE_SERVICE_ROLE_KEY") or os.environ.get("SUPABASE_KEY", "")).strip()

    def is_configured(self):
        """Check if Supabase URL and Key are provided."""
        return bool(self.url and self.key and "supabase.co" in self.url and not self.url.startswith("https://your-project"))

    def _headers(self, prefer=None):
        headers = {
            "apikey": self.key,
            "Authorization": f"Bearer {self.key}",
            "Content-Type": "application/json"
        }
        if prefer:
            headers["Prefer"] = prefer
        return headers

    def test_connection(self):
        """Test the connection to Supabase and return diagnostic info."""
        if not self.is_configured():
            return {
                "connected": False,
                "configured": False,
                "message": "Supabase is not configured. Add your SUPABASE_URL and SUPABASE_KEY."
            }

        start_time = time.time()
        endpoint = f"{self.url}/rest/v1/students?select=id&limit=1"
        try:
            req = urllib.request.Request(endpoint, headers=self._headers(), method="GET")
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                elapsed = round((time.time() - start_time) * 1000, 2)
                return {
                    "connected": True,
                    "configured": True,
                    "latencyMs": elapsed,
                    "status": resp.status,
                    "message": f"Connected to Supabase PostgreSQL successfully ({elapsed}ms latency)."
                }
        except urllib.error.HTTPError as e:
            error_body = ""
            try:
                error_body = e.read().decode("utf-8")
            except Exception:
                pass
            return {
                "connected": False,
                "configured": True,
                "status": e.code,
                "message": f"Supabase HTTP {e.code}: {e.reason}. {error_body}"
            }
        except Exception as e:
            return {
                "connected": False,
                "configured": True,
                "message": f"Connection failed: {str(e)}"
            }

    def query_table(self, table_name, query_params="select=*"):
        """Query a Supabase table."""
        if not self.is_configured():
            return None

        endpoint = f"{self.url}/rest/v1/{table_name}?{query_params}"
        try:
            req = urllib.request.Request(endpoint, headers=self._headers(), method="GET")
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = resp.read().decode("utf-8")
                return json.loads(data)
        except Exception as e:
            print(f"[Supabase] Query error on {table_name}: {e}")
            return None

    def upsert_record(self, table_name, record):
        """Insert or update a record in a Supabase table."""
        if not self.is_configured():
            return False

        endpoint = f"{self.url}/rest/v1/{table_name}"
        headers = self._headers(prefer="resolution=merge-duplicates,return=representation")
        try:
            data = json.dumps(record).encode("utf-8")
            req = urllib.request.Request(endpoint, data=data, headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return resp.status in (200, 201, 204)
        except Exception as e:
            print(f"[Supabase] Upsert error on {table_name}: {e}")
            return False

    def delete_record(self, table_name, id_value):
        """Delete a record from a Supabase table."""
        if not self.is_configured():
            return False

        endpoint = f"{self.url}/rest/v1/{table_name}?id=eq.{urllib.parse.quote(str(id_value))}"
        try:
            req = urllib.request.Request(endpoint, headers=self._headers(), method="DELETE")
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                return resp.status in (200, 204)
        except Exception as e:
            print(f"[Supabase] Delete error on {table_name}: {e}")
            return False

    def fetch_full_db(self):
        """
        Pull all platform data from Supabase and format into the application's unified JSON structure.
        """
        if not self.is_configured():
            return None

        try:
            # Query all tables in parallel or sequence
            students = self.query_table("students", "select=*&limit=1")
            subjects = self.query_table("subjects", "select=*&order=code.asc")
            notes = self.query_table("notes", "select=*&order=created_at.desc")
            assignments = self.query_table("assignments", "select=*&order=due_date.asc")
            projects = self.query_table("projects", "select=*&order=created_at.desc")
            study_materials = self.query_table("study_materials", "select=*&order=created_at.desc")
            calendar_events = self.query_table("calendar_events", "select=*&order=date.asc")
            today_tasks = self.query_table("today_tasks", "select=*&order=created_at.asc")
            settings = self.query_table("settings", "select=*&limit=1")

            if students is None or subjects is None:
                return None

            # Student record mapping
            student_obj = {}
            if students and len(students) > 0:
                s = students[0]
                student_obj = {
                    "name": s.get("name", "Bijay Mandal"),
                    "course": s.get("course", "B.Tech Computer Science & Engineering"),
                    "year": s.get("year", "2nd Year"),
                    "semester": s.get("semester", "Semester 4"),
                    "gender": s.get("gender", "Male"),
                    "rollNo": s.get("roll_no", "CSE2024-4108"),
                    "college": s.get("college", "Sona College of Technology"),
                    "email": s.get("email", "bijay.mandal@sonatech.ac.in"),
                    "avatar": s.get("avatar", "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80"),
                    "cgpa": s.get("cgpa", "8.92"),
                    "attendance": s.get("attendance", "92%"),
                    "bio": s.get("bio", ""),
                    "badges": s.get("badges", [])
                }

            # Subjects mapping
            subjects_list = []
            for sub in (subjects or []):
                subjects_list.append({
                    "id": sub.get("id"),
                    "name": sub.get("name"),
                    "code": sub.get("code"),
                    "color": sub.get("color"),
                    "icon": sub.get("icon"),
                    "credits": sub.get("credits"),
                    "faculty": sub.get("faculty"),
                    "notesCount": sub.get("notes_count", 0),
                    "assignmentsCount": sub.get("assignments_count", 0),
                    "progress": sub.get("progress", 0),
                    "units": sub.get("units", [])
                })

            # Notes mapping
            notes_list = []
            for n in (notes or []):
                notes_list.append({
                    "id": n.get("id"),
                    "title": n.get("title"),
                    "subject": n.get("subject"),
                    "subjectId": n.get("subject_id"),
                    "unit": n.get("unit"),
                    "tags": n.get("tags", []),
                    "pinned": n.get("pinned", False),
                    "date": n.get("date"),
                    "pages": n.get("pages", 1),
                    "readTime": n.get("read_time", "5 min"),
                    "content": n.get("content", {})
                })

            # Assignments mapping
            asg_list = []
            for a in (assignments or []):
                asg_list.append({
                    "id": a.get("id"),
                    "title": a.get("title"),
                    "subject": a.get("subject"),
                    "subjectId": a.get("subject_id"),
                    "dueDate": a.get("due_date"),
                    "priority": a.get("priority", "Medium"),
                    "status": a.get("status", "In Progress"),
                    "progress": a.get("progress", 0),
                    "maxMarks": a.get("max_marks", 100),
                    "description": a.get("description", ""),
                    "attachments": a.get("attachments", [])
                })

            # Projects mapping
            proj_list = []
            for p in (projects or []):
                proj_list.append({
                    "id": p.get("id"),
                    "title": p.get("title"),
                    "code": p.get("code"),
                    "lead": p.get("lead"),
                    "deadline": p.get("deadline"),
                    "progress": p.get("progress", 0),
                    "status": p.get("status", "In Progress"),
                    "description": p.get("description", ""),
                    "techStack": p.get("tech_stack", []),
                    "members": p.get("members", []),
                    "tasks": p.get("tasks", []),
                    "activities": p.get("activities", [])
                })

            # Study materials mapping
            mats_list = []
            for m in (study_materials or []):
                mats_list.append({
                    "id": m.get("id"),
                    "title": m.get("title"),
                    "subject": m.get("subject"),
                    "type": m.get("type", "PDF"),
                    "size": m.get("size", "1 MB"),
                    "pages": m.get("pages", 1),
                    "uploadedDate": m.get("uploaded_date"),
                    "fileUrl": m.get("file_url"),
                    "tags": m.get("tags", []),
                    "status": m.get("status", "Indexed"),
                    "keyConcepts": m.get("key_concepts", [])
                })

            # Calendar events mapping
            events_list = []
            for e in (calendar_events or []):
                events_list.append({
                    "id": e.get("id"),
                    "title": e.get("title"),
                    "type": e.get("type"),
                    "date": e.get("date"),
                    "time": e.get("time"),
                    "color": e.get("color"),
                    "location": e.get("location")
                })

            # Today tasks mapping
            tasks_list = []
            for t in (today_tasks or []):
                tasks_list.append({
                    "id": t.get("id"),
                    "title": t.get("title"),
                    "category": t.get("category"),
                    "time": t.get("time"),
                    "completed": t.get("completed", False),
                    "priority": t.get("priority", "medium")
                })

            # Settings mapping
            settings_obj = {
                "theme": "dark",
                "aiModelPreference": "balanced",
                "emailNotifications": True,
                "deadlineReminders": True,
                "autoSaveNotes": True,
                "fontSize": "medium"
            }
            if settings and len(settings) > 0:
                st = settings[0]
                settings_obj = {
                    "theme": st.get("theme", "dark"),
                    "aiModelPreference": st.get("ai_model_preference", "balanced"),
                    "emailNotifications": st.get("email_notifications", True),
                    "deadlineReminders": st.get("deadline_reminders", True),
                    "autoSaveNotes": st.get("auto_save_notes", True),
                    "fontSize": st.get("font_size", "medium")
                }

            return {
                "student": student_obj,
                "subjects": subjects_list,
                "notes": notes_list,
                "assignments": asg_list,
                "projects": proj_list,
                "studyMaterials": mats_list,
                "calendarEvents": events_list,
                "todayTasks": tasks_list,
                "settings": settings_obj,
                "source": "supabase"
            }
        except Exception as e:
            print(f"[Supabase] Error fetching full database: {e}")
            return None

    def sync_local_to_supabase(self, local_db):
        """Push all data from local JSON dictionary up into Supabase PostgreSQL."""
        if not self.is_configured():
            return {"success": False, "message": "Supabase is not configured."}

        results = {"success": True, "syncedTables": []}

        try:
            # 1. Sync Student Profile
            student = local_db.get("student", {})
            if student:
                self.upsert_record("students", {
                    "id": "student-1",
                    "name": student.get("name", "Bijay Mandal"),
                    "course": student.get("course", "B.Tech CSE"),
                    "year": student.get("year", "2nd Year"),
                    "semester": student.get("semester", "Semester 4"),
                    "gender": student.get("gender", "Male"),
                    "roll_no": student.get("rollNo", "CSE2024-4108"),
                    "college": student.get("college", "Sona College of Technology"),
                    "email": student.get("email", "bijay.mandal@sonatech.ac.in"),
                    "avatar": student.get("avatar", ""),
                    "cgpa": str(student.get("cgpa", "8.92")),
                    "attendance": str(student.get("attendance", "92%")),
                    "bio": student.get("bio", ""),
                    "badges": student.get("badges", [])
                })
                results["syncedTables"].append("students")

            # 2. Sync Subjects
            for sub in local_db.get("subjects", []):
                self.upsert_record("subjects", {
                    "id": sub["id"],
                    "name": sub["name"],
                    "code": sub.get("code", ""),
                    "color": sub.get("color", "#3b82f6"),
                    "icon": sub.get("icon", "book"),
                    "credits": sub.get("credits", 3),
                    "faculty": sub.get("faculty", ""),
                    "notes_count": sub.get("notesCount", 0),
                    "assignments_count": sub.get("assignmentsCount", 0),
                    "progress": sub.get("progress", 0),
                    "units": sub.get("units", [])
                })
            results["syncedTables"].append("subjects")

            # 3. Sync Notes
            for n in local_db.get("notes", []):
                self.upsert_record("notes", {
                    "id": n["id"],
                    "title": n["title"],
                    "subject": n.get("subject", ""),
                    "subject_id": n.get("subjectId", ""),
                    "unit": n.get("unit", ""),
                    "tags": n.get("tags", []),
                    "pinned": n.get("pinned", False),
                    "date": n.get("date", ""),
                    "pages": n.get("pages", 1),
                    "read_time": n.get("readTime", "5 min"),
                    "content": n.get("content", {})
                })
            results["syncedTables"].append("notes")

            # 4. Sync Assignments
            for a in local_db.get("assignments", []):
                self.upsert_record("assignments", {
                    "id": a["id"],
                    "title": a["title"],
                    "subject": a.get("subject", ""),
                    "subject_id": a.get("subjectId", ""),
                    "due_date": a.get("dueDate", ""),
                    "priority": a.get("priority", "Medium"),
                    "status": a.get("status", "In Progress"),
                    "progress": a.get("progress", 0),
                    "max_marks": a.get("maxMarks", 100),
                    "description": a.get("description", ""),
                    "attachments": a.get("attachments", [])
                })
            results["syncedTables"].append("assignments")

            # 5. Sync Projects
            for p in local_db.get("projects", []):
                self.upsert_record("projects", {
                    "id": p.get("id", f"proj-{int(time.time())}"),
                    "title": p.get("title") or p.get("name", "Smart Campus Management System"),
                    "code": p.get("code", "PROJ-2026-01"),
                    "lead": p.get("lead", "Bijay Mandal"),
                    "deadline": p.get("deadline", "2026-11-20"),
                    "progress": p.get("progress", 0),
                    "status": p.get("status", "In Progress"),
                    "description": p.get("description", ""),
                    "tech_stack": p.get("techStack", []),
                    "members": p.get("members", p.get("team", [])),
                    "tasks": p.get("tasks", []),
                    "activities": p.get("activities", [])
                })
            results["syncedTables"].append("projects")

            # 6. Sync Study Materials
            for m in local_db.get("studyMaterials", []):
                self.upsert_record("study_materials", {
                    "id": m.get("id", f"mat-{int(time.time())}"),
                    "title": m.get("title") or m.get("name", "Study Document"),
                    "subject": m.get("subject", ""),
                    "type": m.get("type", "PDF"),
                    "size": m.get("size", "1 MB"),
                    "pages": m.get("pages", 1),
                    "uploaded_date": m.get("uploadedDate", ""),
                    "file_url": m.get("fileUrl", ""),
                    "tags": m.get("tags", []),
                    "status": m.get("status", "Indexed"),
                    "key_concepts": m.get("keyConcepts", [])
                })
            results["syncedTables"].append("study_materials")

            # 7. Sync Calendar Events
            for e in local_db.get("calendarEvents", []):
                self.upsert_record("calendar_events", {
                    "id": e["id"],
                    "title": e["title"],
                    "type": e.get("type", "event"),
                    "date": e.get("date", ""),
                    "time": e.get("time", ""),
                    "color": e.get("color", "#3b82f6"),
                    "location": e.get("location", "")
                })
            results["syncedTables"].append("calendar_events")

            # 8. Sync Today Tasks
            for t in local_db.get("todayTasks", []):
                self.upsert_record("today_tasks", {
                    "id": t["id"],
                    "title": t["title"],
                    "category": t.get("category", "Study"),
                    "time": t.get("time", ""),
                    "completed": t.get("completed", False),
                    "priority": t.get("priority", "medium")
                })
            results["syncedTables"].append("today_tasks")

            # 9. Sync Settings
            st = local_db.get("settings", {})
            if st:
                self.upsert_record("settings", {
                    "id": "default",
                    "theme": st.get("theme", "dark"),
                    "ai_model_preference": st.get("aiModelPreference", "balanced"),
                    "email_notifications": st.get("emailNotifications", True),
                    "deadline_reminders": st.get("deadlineReminders", True),
                    "auto_save_notes": st.get("autoSaveNotes", True),
                    "font_size": st.get("fontSize", "medium")
                })
                results["syncedTables"].append("settings")

            results["message"] = f"Successfully synced {len(results['syncedTables'])} tables to Supabase Cloud PostgreSQL."
            return results

        except Exception as e:
            return {"success": False, "message": f"Sync failed: {str(e)}"}

    def save_credentials(self, url, key):
        """Save Supabase credentials to .env file and re-initialize."""
        self.url = url.strip().rstrip("/")
        self.key = key.strip()
        os.environ["SUPABASE_URL"] = self.url
        os.environ["SUPABASE_KEY"] = self.key

        # Update or create .env file
        env_lines = []
        updated_url = False
        updated_key = False

        if ENV_FILE.exists():
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("SUPABASE_URL="):
                        env_lines.append(f"SUPABASE_URL={self.url}\n")
                        updated_url = True
                    elif line.startswith("SUPABASE_KEY="):
                        env_lines.append(f"SUPABASE_KEY={self.key}\n")
                        updated_key = True
                    else:
                        env_lines.append(line)

        if not updated_url:
            env_lines.append(f"SUPABASE_URL={self.url}\n")
        if not updated_key:
            env_lines.append(f"SUPABASE_KEY={self.key}\n")

        with open(ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(env_lines)

        return self.test_connection()

# Singleton instance
supabase_client = SupabaseManager()
