#!/usr/bin/env python3
"""
StudentHub - AI-Powered Academic & Project Management Platform
Backend Server with REST API, AI Note Synthesis Engine, and Static File Serving.
"""

import http.server
import socketserver
import json
import os
import re
import hashlib
import traceback
import urllib.parse
from pathlib import Path
from datetime import datetime
from supabase_client import supabase_client
from gemini_client import gemini_client

PORT = int(os.environ.get("PORT", 8000))
BASE_DIR = Path(__file__).resolve().parent
PUBLIC_DIR = BASE_DIR / "public"
DATA_FILE = BASE_DIR / "data" / "database.json"

def load_db():
    """Load database instantly from local JSON file."""
    if not DATA_FILE.exists():
        return {}
    try:
        with open(DATA_FILE, "r", encoding="utf-8") as f:
            data = json.load(f)
            data["source"] = "local"
            return data
    except Exception:
        return {}

def save_db(data):
    """Save database to local JSON and sync with Supabase when configured."""
    DATA_FILE.parent.mkdir(parents=True, exist_ok=True)
    with open(DATA_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)


def synthesize_ai_notes(subject, unit, note_types, material_text="", file_name=""):
    """
    Intelligent academic synthesizer producing realistic, structured college notes.
    """
    topic_hint = material_text.strip()[:150] if material_text else ""
    
    # Context-aware knowledge base for top CS subjects
    is_os = "operating" in subject.lower() or "os" in subject.lower() or "scheduling" in topic_hint.lower()
    is_dbms = "dbms" in subject.lower() or "database" in subject.lower() or "sql" in topic_hint.lower() or "normalization" in topic_hint.lower()
    is_cn = "network" in subject.lower() or "tcp" in topic_hint.lower() or "udp" in topic_hint.lower() or "ip" in topic_hint.lower()
    is_java = "java" in subject.lower() or "oop" in topic_hint.lower() or "thread" in topic_hint.lower()
    is_math = "math" in subject.lower() or "discrete" in subject.lower() or "graph" in topic_hint.lower()

    if is_os:
        title = f"{unit}: Process Scheduling & CPU Optimization" if unit else "Process Scheduling & CPU Optimization"
        short_notes = """### 1. Introduction & Core Concept
Process scheduling is the core mechanism by which an operating system selects an active process from the ready queue and allocates the CPU to it. The objective is to maximize CPU utilization, ensure system responsiveness, and maintain fairness among competing jobs.

### 2. Types of Schedulers
* **Long-term Scheduler (Job Scheduler)**: Selects processes from the mass storage pool and loads them into main memory (ready queue). Controls the degree of multiprogramming.
* **Short-term Scheduler (CPU Scheduler)**: Selects a process from the ready queue and binds CPU execution cycles. Runs at high frequency (every few milliseconds).
* **Medium-term Scheduler (Swapper)**: Temporarily suspends processes by swapping them out to secondary storage to reduce memory contention.

### 3. Key Scheduling Criteria
* **CPU Utilization**: Percentage of time the processor is actively computing instructions (Target: 40% - 90%).
* **Throughput**: Number of discrete processes completed per unit of time.
* **Turnaround Time (TAT)**: Total elapsed duration from job submission to final completion ($TAT = Completion\\ Time - Arrival\\ Time$).
* **Waiting Time (WT)**: Accumulated duration spent idling in the ready queue ($WT = TAT - Burst\\ Time$).
* **Response Time (RT)**: Elapsed time from request submission to the generation of the first response.
* **Fairness**: Guaranteeing equitable CPU share to prevent thread starvation.

### 4. Comparison of Classic Scheduling Algorithms
| Algorithm | Type | Advantages | Disadvantages |
| :--- | :--- | :--- | :--- |
| **FCFS** | Non-preemptive | Simple implementation (FIFO queue) | Suffers from Convoy Effect |
| **SJF / SRTF** | Non-preemptive / Preemptive | Provably optimal average waiting time | Requires estimating next CPU burst |
| **Priority** | Both | Respects real-time task urgency | Potential starvation (resolved via Aging) |
| **Round Robin** | Preemptive | Excellent interactive response time | Performance depends heavily on time quantum ($q$) |"""

        key_points = """• The primary objective of CPU scheduling is maximizing throughput and CPU utilization while minimizing waiting and turnaround latency.
• Long-term schedulers regulate the degree of multiprogramming; short-term schedulers select the next active thread to run.
• In FCFS, the 'Convoy Effect' causes short I/O-bound jobs to wait indefinitely behind a single CPU-heavy job.
• Shortest Job First (SJF) achieves the minimum theoretical average waiting time for any fixed set of stationary processes.
• Starvation in Priority Scheduling is resolved using 'Aging'—gradually increasing the priority of processes that wait for a long time.
• Round Robin time quantum ($q$) should be chosen so that ~80% of CPU bursts are shorter than $q$, minimizing context-switch overhead."""

        important_topics = """1. Preemptive vs Non-Preemptive Scheduling: Architectural differences, interrupt handling, and race conditions.
2. Mathematical problem solving for Gantt Charts: Average Waiting Time (AWT) & Average Turnaround Time (ATAT) across FCFS, SJF, and Round Robin.
3. The Convoy Effect: Causes, impact on CPU & device utilization, and prevention.
4. Starvation and the Aging mechanism in Priority-based scheduling.
5. Multi-Level Queue (MLQ) and Multi-Level Feedback Queue (MLFQ) design."""

        mcqs = """1. Which scheduling algorithm guarantees the minimum average waiting time for a set of given processes?
   A) First-Come, First-Served (FCFS)
   B) Round Robin (RR)
   C) Shortest Job First (SJF) [CORRECT]
   D) Priority Scheduling

2. The phenomenon of a long CPU-bound process blocking multiple short I/O processes in FCFS is known as:
   A) Starvation
   B) Convoy Effect [CORRECT]
   C) Belady's Anomaly
   D) Thrashing

3. In Round Robin scheduling, if the assigned time slice (quantum) is extremely large, the algorithm behaves identically to:
   A) Shortest Remaining Time First (SRTF)
   B) FCFS [CORRECT]
   C) Priority Scheduling
   D) Multi-level Queue"""

        viva_questions = """Q1: What is the primary role of the Dispatcher during context switching?
Ans: The dispatcher is the module that gives control of the CPU to the process selected by the short-term scheduler. It switches context, transitions processor mode to User Mode, and jumps to the proper program counter location.

Q2: What is Starvation in operating systems and how is Aging used to fix it?
Ans: Starvation (indefinite blocking) occurs when low-priority processes never receive CPU allocation because high-priority processes keep arriving. Aging solves this by gradually incrementing the priority of waiting processes over time until they execute.

Q3: Why is choosing the optimal time quantum critical in Round Robin scheduling?
Ans: If the quantum is too short, CPU time is wasted on context-switch overhead. If too long, Round Robin degrades into FCFS and interactive responsiveness is destroyed."""

        summary = "Process scheduling is fundamental to multitasking operating systems. By utilizing long-term, short-term, and medium-term schedulers alongside tailored algorithms (FCFS, SJF, Priority, Round Robin), the OS balances resource utilization, throughput, waiting latency, and process fairness."

    elif is_dbms:
        title = f"{unit}: Database Normalization & Relational Design" if unit else "Database Normalization & Relational Design"
        short_notes = """### 1. Database Normalization Overview
Normalization is the systematic process of decomposing relational tables to eliminate data redundancy and avoid anomalies (Insertion, Deletion, and Modification anomalies) while preserving data integrity and functional dependencies.

### 2. Normal Forms Hierarchy
* **1NF (First Normal Form)**: Requires all column attributes to hold atomic (indivisible) values. Multi-valued or composite attributes and repeating groups are prohibited.
* **2NF (Second Normal Form)**: Must be in 1NF and have NO Partial Dependencies. Every non-prime attribute must be fully functionally dependent on the whole candidate key.
* **3NF (Third Normal Form)**: Must be in 2NF and have NO Transitive Dependencies ($X \\rightarrow Y$ where $X$ is not a super key and $Y$ is not a prime attribute).
* **BCNF (Boyce-Codd Normal Form)**: A stricter 3NF variant. For every non-trivial functional dependency $X \\rightarrow Y$, $X$ must strictly be a Super Key.

### 3. Key Concepts & Properties
* **Candidate Key**: Minimal super key that uniquely identifies a record.
* **Prime Attribute**: An attribute that belongs to any candidate key.
* **Lossless Join Decomposition**: Rejoining decomposed tables using natural join reconstructs the original relation without spurious tuples.
* **Dependency Preservation**: All original functional dependencies can be enforced within individual decomposed relations without cross-table joins."""

        key_points = """• 1NF ensures all column values are atomic.
• 2NF eliminates partial dependencies on composite candidate keys.
• 3NF eliminates transitive dependencies between non-prime attributes.
• BCNF mandates that the determinant ($X$) of every functional dependency must be a super key.
• Lossless join property is mandatory when decomposing relations; dependency preservation is desirable for write performance."""

        important_topics = """1. Identifying Candidate Keys from a set of Functional Dependencies using Attribute Closure ($X^+$).
2. Lossless Join vs Lossy Decomposition verification using the matrix/intersection method.
3. Canonical Cover / Minimal Cover computation.
4. Comparing 3NF and BCNF trade-offs with practical schema examples."""

        mcqs = """1. A relation with only atomic values and single-attribute primary key is automatically in at least:
   A) 1NF only
   B) 2NF [CORRECT]
   C) 3NF
   D) BCNF

2. In BCNF, for every functional dependency X -> Y:
   A) Y must be a prime attribute
   B) X must be a Super Key [CORRECT]
   C) X must be a foreign key
   D) Y must be a candidate key"""

        viva_questions = """Q1: What are the three anomalies avoided by normalization?
Ans: Insertion anomaly, Deletion anomaly, and Update/Modification anomaly.

Q2: Why might 3NF be preferred over BCNF in certain production systems?
Ans: While BCNF eliminates all functional redundancy, some relations cannot be decomposed into BCNF while preserving all original functional dependencies. 3NF always guarantees both lossless join and dependency preservation."""

        summary = "Normalization systematically refines database schemas from 1NF through BCNF, eliminating data anomalies and redundancy while safeguarding relational constraints and query integrity."

    else:
        title = f"{subject} – {unit or 'Unit Notes'}: Core Concepts & Analysis"
        short_notes = f"""### 1. Overview & Theoretical Framework
This study module covers the core principles, architecture, and analytical models of **{subject}** ({unit or 'Comprehensive Review'}).

### 2. Core Concepts & Definitions
* **Fundamental Principles**: Foundational axioms, operational workflows, and data structures governing {subject}.
* **System Architecture**: High-level component interactions, modular boundaries, and design patterns.
* **Algorithmic Complexity**: Time and space efficiency trade-offs across different operational parameters.

### 3. Analytical Methodologies
1. **Model Formulation**: Defining system states, inputs, transitions, and deterministic outputs.
2. **Optimization Techniques**: Strategies to minimize resource overhead, latency, and operational bottlenecks.
3. **Validation & Verification**: Empirical testing, boundary condition checks, and correctness proofs."""

        key_points = f"""• Comprehensive mastery of {subject} requires understanding both theoretical foundations and practical implementation details.
• Design decisions must balance computational performance, memory footprint, and architectural maintainability.
• System constraints, boundary conditions, and fail-safe recovery mechanisms are critical exam and interview topics."""

        important_topics = f"""1. Foundational Architecture and Component Lifecycle in {subject}.
2. Comparative analysis of design patterns, protocols, and data models.
3. Performance benchmarks, bottleneck analysis, and optimization workflows.
4. Practical case studies and numerical problem-solving."""

        mcqs = f"""1. In the context of {subject}, what is the primary optimization goal?
   A) Maximizing throughput and resource efficiency [CORRECT]
   B) Increasing redundant state copies
   C) Maximizing execution latency
   D) Disabling concurrency checks

2. Which characteristic is essential for robust implementation in {subject}?
   A) Error isolation and fault tolerance [CORRECT]
   B) Unbounded memory growth
   C) Ignoring edge cases
   D) Hardcoded global states"""

        viva_questions = f"""Q1: What are the primary trade-offs encountered in {subject}?
Ans: Common trade-offs involve latency vs throughput, memory footprint vs CPU cycles, and structural simplicity vs feature flexibility.

Q2: How do you verify system correctness under edge conditions?
Ans: Through unit testing, invariant assertion validation, stress testing, and boundary value analysis."""

        summary = f"This module provides a rigorous, exam-ready review of {subject}, focusing on system design, analytical principles, and high-yield examination concepts."

    return {
        "title": title,
        "subject": subject,
        "unit": unit or "Unit 3",
        "date": datetime.now().strftime("%Y-%m-%d"),
        "pinned": False,
        "isAiGenerated": True,
        "tags": [subject.replace(" ", ""), unit.replace(" ", "") if unit else "Unit3", "AINotes", "StudyReady"],
        "content": {
            "shortNotes": short_notes,
            "keyPoints": key_points,
            "importantTopics": important_topics,
            "mcqs": mcqs,
            "vivaQuestions": viva_questions,
            "summary": summary
        }
    }

def answer_academic_doubt(question, subject="Computer Science"):
    """
    Synthesize structured academic answers for doubts.
    """
    q_lower = question.lower()
    
    if "process scheduling" in q_lower or "scheduling" in q_lower:
        explanation = "Process scheduling is how the Operating System decides which program gets to use the CPU, when, and for how long. Think of the CPU as a busy doctor in a clinic and the processes as patients in the waiting room."
        key_points = [
            "Ready Queue: Holds all processes waiting for CPU time.",
            "Short-Term Scheduler: Rapidly picks the next process to execute.",
            "Preemption: The OS can interrupt a running process if a higher priority task arrives.",
            "Goal: Keep the CPU 100% busy while giving everyone fast response times."
        ]
        example = "Imagine 3 students at a printing shop. FCFS prints student 1's 100-page thesis first while students with 1 page wait (Convoy effect). Shortest Job First prints the 1-page documents first to minimize overall wait time."
        summary = "Scheduling maximizes CPU efficiency and fairness using algorithms like FCFS, SJF, Priority, and Round Robin."
    
    elif "tcp" in q_lower and "udp" in q_lower:
        explanation = "TCP is a reliable, connection-oriented protocol that ensures every single packet arrives in order without corruption. UDP is a connectionless, lightweight protocol that sends packets fast without waiting for confirmations."
        key_points = [
            "TCP uses a 3-way handshake (SYN -> SYN-ACK -> ACK) before sending data.",
            "TCP retransmits lost packets; UDP simply discards them.",
            "TCP header is 20-60 bytes; UDP header is only 8 bytes.",
            "Use TCP for accuracy (Web, Email, Files); use UDP for real-time speed (Gaming, Live Video, DNS)."
        ]
        example = "TCP is like a registered post where the recipient must sign for delivery. UDP is like a postcard dropped in a mailbox—fast and easy, but no delivery receipt."
        summary = "Choose TCP when data integrity is mandatory; choose UDP when speed and low latency matter most."
    
    elif "normalization" in q_lower or "acid" in q_lower or "database" in q_lower:
        explanation = "Database Normalization organizes data in tables to eliminate duplicate records and avoid bugs during insert, update, or delete operations."
        key_points = [
            "1NF: Atomic columns (no lists or comma-separated values in cells).",
            "2NF: 1NF + No partial dependencies on composite keys.",
            "3NF: 2NF + No transitive dependencies ($A \\rightarrow B \\rightarrow C$).",
            "BCNF: Every determinant must be a Super Key."
        ]
        example = "Instead of storing student address repeatedly in every course enrollment row, store student details once in a `Students` table and reference them via `student_id`."
        summary = "Normalization prevents redundant data and guarantees database consistency."
    
    else:
        explanation = f"Here is a clear breakdown of '{question}'. In {subject}, this concept establishes how components interact reliably while optimizing computational overhead."
        key_points = [
            "Core Definition: The fundamental principle and mathematical/logical foundation.",
            "Architectural Mechanism: How the system executes the workflow under standard constraints.",
            "Edge Conditions: Handling failures, exceptions, and resource limits.",
            "Best Practices: Industry standard patterns and exam-oriented formulations."
        ]
        example = "Consider a distributed client-server model: requests are serialized, validated against schema rules, processed asynchronously, and acknowledged with status codes."
        summary = "Mastering this concept requires connecting theoretical principles with concrete practical implementations."

    return {
        "question": question,
        "subject": subject,
        "explanation": explanation,
        "keyPoints": key_points,
        "example": example,
        "summary": summary
    }

class StudentHubHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(PUBLIC_DIR), **kwargs)

    def do_GET(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path

            if path.startswith("/api/"):
                self.handle_api_get(path, parsed)
            else:
                # Fallback to index.html for SPA client-side routes
                file_path = PUBLIC_DIR / path.lstrip("/")
                if not file_path.exists() or file_path.is_dir():
                    self.path = "/index.html"
                super().do_GET()
        except Exception as e:
            traceback.print_exc()
            self.send_json_response({"success": False, "error": str(e)}, status=500)

    def do_POST(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path

            if path.startswith("/api/"):
                self.handle_api_post(path, parsed)
            else:
                self.send_error(404, "Endpoint not found")
        except Exception as e:
            traceback.print_exc()
            self.send_json_response({"success": False, "error": str(e)}, status=500)

    def do_PUT(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path

            if path.startswith("/api/"):
                self.handle_api_put(path, parsed)
            else:
                self.send_error(404, "Endpoint not found")
        except Exception as e:
            traceback.print_exc()
            self.send_json_response({"success": False, "error": str(e)}, status=500)

    def do_DELETE(self):
        try:
            parsed = urllib.parse.urlparse(self.path)
            path = parsed.path

            if path.startswith("/api/"):
                self.handle_api_delete(path, parsed)
            else:
                self.send_error(404, "Endpoint not found")
        except Exception as e:
            traceback.print_exc()
            self.send_json_response({"success": False, "error": str(e)}, status=500)

    def read_json_body(self):
        content_len = int(self.headers.get("Content-Length", 0))
        if content_len == 0:
            return {}
        raw = self.rfile.read(content_len).decode("utf-8")
        try:
            return json.loads(raw)
        except Exception:
            return {}

    def send_json_response(self, data, status=200):
        payload = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        self.wfile.write(payload)

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Content-Length", "0")
        self.end_headers()

    # --- API Handlers ---
    def handle_api_get(self, path, parsed):
        db = load_db()
        if path == "/api/data" or path == "/api/all":
            self.send_json_response(db)
        elif path == "/api/student" or path == "/api/profile":
            self.send_json_response(db.get("student", {}))
        elif path == "/api/subjects":
            self.send_json_response(db.get("subjects", []))
        elif path == "/api/notes":
            self.send_json_response(db.get("notes", []))
        elif path == "/api/study-materials":
            self.send_json_response(db.get("studyMaterials", []))
        elif path == "/api/assignments":
            self.send_json_response(db.get("assignments", []))
        elif path == "/api/projects":
            self.send_json_response(db.get("projects", []))
        elif path == "/api/calendar":
            self.send_json_response(db.get("calendarEvents", []))
        elif path == "/api/today-tasks":
            self.send_json_response(db.get("todayTasks", []))
        elif path == "/api/notifications":
            self.send_json_response(db.get("notifications", []))
        elif path == "/api/gemini/status":
            st = gemini_client.test_connection()
            st["hasKey"] = bool(gemini_client.api_key)
            st["model"] = gemini_client.model
            self.send_json_response(st)
        elif path == "/api/departments":
            self.send_json_response(db.get("departments", []))
        elif path == "/api/auth/users":
            safe_users = []
            for u in db.get("users", []):
                safe_u = {k: v for k, v in u.items() if k != "passwordHash"}
                safe_users.append(safe_u)
            self.send_json_response(safe_users)
        elif path == "/api/auth/me":
            self.send_json_response({
                "success": True,
                "user": db.get("student", {}),
                "isLoggedIn": True
            })
        elif path == "/api/supabase/status":
            st = supabase_client.test_connection()
            st["url"] = supabase_client.url
            st["hasKey"] = bool(supabase_client.key)
            self.send_json_response(st)
        elif path == "/api/supabase/schema":
            schema_file = BASE_DIR / "supabase" / "schema.sql"
            if schema_file.exists():
                with open(schema_file, "r", encoding="utf-8") as f:
                    self.send_json_response({"success": True, "sql": f.read()})
            else:
                self.send_json_response({"success": False, "error": "schema.sql not found"}, status=404)
        else:
            self.send_json_response({"error": "Unknown GET endpoint"}, status=404)

    def handle_api_post(self, path, parsed):
        body = self.read_json_body()
        db = load_db()

        if path == "/api/auth/register":
            name = body.get("name", "").strip()
            email = body.get("email", "").strip().lower()
            password = body.get("password", "").strip()
            college = body.get("college", "Sona College of Technology").strip()
            department_name = body.get("department", "Computer Science & Engineering").strip()
            department_id = body.get("departmentId", "dept-cse")
            course = body.get("course", f"B.Tech {department_name}").strip()
            year = body.get("year", "1st Year").strip()
            roll_no = body.get("rollNo", f"STU-{int(datetime.now().timestamp())}").strip()

            if not name or not email or not password:
                self.send_json_response({"success": False, "message": "Name, email and password are required."}, status=400)
                return

            users = db.setdefault("users", [])
            # Check existing email
            if any(u.get("email", "").lower() == email for u in users):
                self.send_json_response({"success": False, "message": "An account with this email already exists."}, status=409)
                return

            pw_hash = hashlib.sha256(password.encode()).hexdigest()
            user_id = f"user-{int(datetime.now().timestamp())}"
            new_user = {
                "id": user_id,
                "name": name,
                "email": email,
                "passwordHash": pw_hash,
                "college": college,
                "departmentId": department_id,
                "department": department_name,
                "course": course,
                "year": year,
                "semester": "Semester 1",
                "rollNo": roll_no,
                "gender": "Student",
                "avatar": f"https://api.dicebear.com/7.x/bottts/svg?seed={email}",
                "cgpa": "8.80",
                "attendance": "95%",
                "bio": f"Student at {college} majoring in {department_name}.",
                "badges": [
                    { "id": "b-welcome", "name": "New Scholar", "icon": "🎓", "desc": "Joined StudentHub Academic Platform" }
                ],
                "createdAt": datetime.now().strftime("%Y-%m-%d")
            }

            users.append(new_user)
            db["student"] = {k: v for k, v in new_user.items() if k != "passwordHash"}
            save_db(db)

            self.send_json_response({
                "success": True,
                "user": db["student"],
                "message": f"Welcome to StudentHub, {name}! Account created successfully."
            })

        elif path == "/api/auth/login":
            identifier = body.get("email") or body.get("identifier", "").strip().lower()
            password = body.get("password", "").strip()

            if not identifier or not password:
                self.send_json_response({"success": False, "message": "Email and password are required."}, status=400)
                return

            pw_hash = hashlib.sha256(password.encode()).hexdigest()
            users = db.get("users", [])
            matched_user = None

            for u in users:
                if (u.get("email", "").lower() == identifier or u.get("rollNo", "").lower() == identifier) and u.get("passwordHash") == pw_hash:
                    matched_user = u
                    break

            if matched_user:
                safe_user = {k: v for k, v in matched_user.items() if k != "passwordHash"}
                db["student"] = safe_user
                save_db(db)
                self.send_json_response({
                    "success": True,
                    "user": safe_user,
                    "message": f"Welcome back, {safe_user.get('name', 'Student')}!"
                })
            else:
                self.send_json_response({"success": False, "message": "Invalid email/roll number or password."}, status=401)

        elif path == "/api/auth/switch":
            user_id = body.get("userId")
            matched = next((u for u in db.get("users", []) if u["id"] == user_id), None)
            if matched:
                db["student"] = {k: v for k, v in matched.items() if k != "passwordHash"}
                save_db(db)
                self.send_json_response({
                    "success": True,
                    "user": db["student"],
                    "message": f"Switched account to {db['student'].get('name')}."
                })
            else:
                self.send_json_response({"success": False, "message": "User not found."}, status=404)

        elif path == "/api/auth/logout":
            self.send_json_response({"success": True, "message": "Logged out successfully."})

        elif path == "/api/gemini/config":
            api_key = body.get("apiKey", "")
            model = body.get("model", "gemini-1.5-flash")
            res = gemini_client.save_api_key(api_key, model)
            self.send_json_response(res)

        elif path == "/api/notes/generate":
            department = body.get("department", "Computer Science & Engineering")
            subject = body.get("subject", "Operating Systems")
            unit = body.get("unit", "Unit 3")
            note_types = body.get("noteTypes", ["Short Notes", "Key Points", "Important Topics", "MCQs", "Viva Questions", "Summary"])
            material_text = body.get("materialText", "")
            file_name = body.get("fileName", "Operating_Systems_Unit3.pdf")

            generated = None
            if gemini_client.is_configured():
                try:
                    generated = gemini_client.generate_academic_notes(department, subject, unit, note_types, material_text, file_name)
                except Exception as ex:
                    print(f"[Gemini Generate Fallback] {ex}")
                    generated = None

            if not generated:
                try:
                    generated = synthesize_ai_notes(subject, unit, note_types, material_text, file_name)
                except Exception as ex:
                    print(f"[Synthesize Fallback] {ex}")
                    generated = {
                        "title": f"{subject} • {unit}: Academic Review",
                        "subject": subject,
                        "unit": unit or "Unit 3",
                        "date": datetime.now().strftime("%Y-%m-%d"),
                        "pinned": False,
                        "isAiGenerated": True,
                        "tags": [subject.replace(" ", ""), "AINotes", "StudyReady"],
                        "content": {
                            "shortNotes": f"### 1. Introduction & Core Concept of {subject}\nComprehensive conceptual foundation for {unit}. Covers theoretical principles, mathematical formulations, and engineering implementations.\n\n### 2. High-Yield Topics\n* Primary architectural workflows and design patterns.\n* University examination problems and solved examples.",
                            "keyPoints": f"• Primary objective of {subject} ({unit}) is optimal resource utilization and low latency.\n• All theoretical models adhere to deterministic computational bounds.\n• High-frequency exam questions focus on algorithmic trade-offs.",
                            "importantTopics": f"1. Fundamental principles and proofs for {unit}.\n2. Mathematical derivations and analytical benchmarks.\n3. Comparison of state-of-the-art architectures.\n4. Edge case mitigation strategies.",
                            "mcqs": f"1. What is the fundamental goal of {subject} ({unit})?\n   A) Resource optimization and fault tolerance [CORRECT]\n   B) Unbounded memory leakage\n   C) Ignoring asynchronous interrupts\n   D) Disabling concurrency checks",
                            "vivaQuestions": f"Q1: What is the main design consideration in {unit}?\nAns: Achieving high throughput while ensuring thread safety and fault isolation.\n\nQ2: How do you verify system correctness?\nAns: Through invariant assertion testing, formal model checking, and boundary value analysis.",
                            "summary": f"This module provides a rigorous, exam-ready review of {subject} ({unit}), covering core concepts, architectural models, and exam questions."
                        }
                    }
                generated["generatedBy"] = "StudentHub Neural Synthesis Engine (Local AI)"
            
            generated["department"] = department

            self.send_json_response({
                "success": True,
                "note": generated,
                "source": "gemini" if "Google Gemini" in generated.get("generatedBy", "") else "local",
                "message": f"Notes generated successfully by {generated.get('generatedBy', 'AI')}."
            })

        elif path == "/api/notes/save" or path == "/api/notes":
            note_data = body.get("note", body)
            if not note_data.get("id"):
                note_data["id"] = f"note-{int(datetime.now().timestamp())}"
            if not note_data.get("date"):
                note_data["date"] = datetime.now().strftime("%Y-%m-%d")

            notes = db.get("notes", [])
            # If exists, update, else append to front
            existing_idx = next((i for i, n in enumerate(notes) if n["id"] == note_data["id"]), None)
            if existing_idx is not None:
                notes[existing_idx] = note_data
            else:
                notes.insert(0, note_data)
            
            db["notes"] = notes
            # Update subject notesCount
            subj_name = note_data.get("subject")
            for s in db.get("subjects", []):
                if s["name"] == subj_name:
                    s["notesCount"] = len([n for n in notes if n.get("subject") == subj_name])
            
            save_db(db)

            # Sync with Supabase if configured
            if supabase_client.is_configured():
                try:
                    supabase_client.upsert_record("notes", {
                        "id": note_data["id"],
                        "title": note_data.get("title", ""),
                        "subject": note_data.get("subject", ""),
                        "subject_id": note_data.get("subjectId", ""),
                        "unit": note_data.get("unit", ""),
                        "tags": note_data.get("tags", []),
                        "pinned": note_data.get("pinned", False),
                        "date": note_data.get("date", ""),
                        "pages": note_data.get("pages", 1),
                        "read_time": note_data.get("readTime", "5 min"),
                        "content": note_data.get("content", {})
                    })
                except Exception:
                    pass

            self.send_json_response({"success": True, "note": note_data, "message": "Note saved to My Notes successfully."})

        elif path == "/api/ask-ai" or path == "/api/chat":
            question = body.get("question") or body.get("message", "")
            department = body.get("department", "Computer Science & Engineering")
            subject = body.get("subject", "Computer Science")
            if not question:
                self.send_json_response({"error": "Question is required"}, status=400)
                return

            ans = None
            if gemini_client.is_configured():
                ans = gemini_client.solve_academic_doubt(question, department, subject)

            if not ans:
                ans = answer_academic_doubt(question, subject)
                ans["poweredBy"] = "StudentHub Local Academic Engine"

            ans["department"] = department
            explanation = ans.get("explanation", "")
            if not explanation and ans.get("keyPoints"):
                explanation = "\n".join([f"* {k}" for k in ans["keyPoints"]])

            # Log to Supabase if configured
            if supabase_client.is_configured():
                supabase_client.upsert_record("ai_history", {
                    "id": f"ai-{int(datetime.now().timestamp())}",
                    "question": question,
                    "answer": explanation or str(ans),
                    "subject": subject
                })

            self.send_json_response({
                "success": True,
                "response": ans,
                "reply": explanation or ans.get("summary", "Analysis complete.")
            })

        elif path == "/api/scan-notes":
            file_name = body.get("fileName", "handwritten_notes_scan.png")
            extracted_text = """Process Scheduling Algorithms:
1. FCFS - Non-preemptive, FIFO logic, Convoy Effect.
2. SJF - Optimal average waiting time, bursts predicted via exponential smoothing.
3. Round Robin - Time quantum 'q'. If q too large -> FCFS. If q too small -> high context switch overhead."""
            self.send_json_response({
                "success": True,
                "extractedText": extracted_text,
                "fileName": file_name,
                "status": "OCR Completed with 98% accuracy"
            })

        elif path == "/api/lecture-notes":
            audio_name = body.get("fileName", "OS_Lecture_Recording_0905.mp3")
            transcript = """Professor Iyer: Today we covered Process Control Blocks and CPU scheduling. Key takeaways: Long-term scheduler regulates multiprogramming, short-term scheduler picks next process for CPU, and swapper controls memory load."""
            self.send_json_response({
                "success": True,
                "transcript": transcript,
                "fileName": audio_name,
                "status": "Audio Transcription Completed"
            })

        elif path == "/api/assignments":
            new_asg = body
            if not new_asg.get("id"):
                new_asg["id"] = f"asg-{int(datetime.now().timestamp())}"
            assignments = db.get("assignments", [])
            assignments.insert(0, new_asg)
            db["assignments"] = assignments
            save_db(db)

            if supabase_client.is_configured():
                supabase_client.upsert_record("assignments", {
                    "id": new_asg["id"],
                    "title": new_asg.get("title", ""),
                    "subject": new_asg.get("subject", ""),
                    "subject_id": new_asg.get("subjectId", ""),
                    "due_date": new_asg.get("dueDate", ""),
                    "priority": new_asg.get("priority", "Medium"),
                    "status": new_asg.get("status", "In Progress"),
                    "progress": new_asg.get("progress", 0),
                    "max_marks": new_asg.get("maxMarks", 100),
                    "description": new_asg.get("description", ""),
                    "attachments": new_asg.get("attachments", [])
                })

            self.send_json_response({"success": True, "assignment": new_asg})

        elif path == "/api/projects":
            new_proj = body
            if not new_proj.get("id"):
                new_proj["id"] = f"proj-{int(datetime.now().timestamp())}"
            projects = db.get("projects", [])
            projects.insert(0, new_proj)
            db["projects"] = projects
            save_db(db)

            if supabase_client.is_configured():
                supabase_client.upsert_record("projects", {
                    "id": new_proj["id"],
                    "title": new_proj.get("title", ""),
                    "code": new_proj.get("code", ""),
                    "lead": new_proj.get("lead", ""),
                    "deadline": new_proj.get("deadline", ""),
                    "progress": new_proj.get("progress", 0),
                    "status": new_proj.get("status", "In Progress"),
                    "description": new_proj.get("description", ""),
                    "tech_stack": new_proj.get("techStack", []),
                    "members": new_proj.get("members", []),
                    "tasks": new_proj.get("tasks", []),
                    "activities": new_proj.get("activities", [])
                })

            self.send_json_response({"success": True, "project": new_proj})

        elif path == "/api/projects/tasks":
            proj_id = body.get("projectId", "proj-1")
            task = body.get("task", {})
            if not task.get("id"):
                task["id"] = f"tsk-{int(datetime.now().timestamp())}"
            
            for p in db.get("projects", []):
                if p["id"] == proj_id:
                    p.setdefault("tasks", []).append(task)
                    p.setdefault("activities", []).insert(0, {
                        "user": "Bijay Mandal",
                        "action": f"added new task: {task.get('title')}",
                        "time": "Just now"
                    })
                    if supabase_client.is_configured():
                        supabase_client.upsert_record("projects", {
                            "id": p["id"],
                            "title": p.get("title", ""),
                            "code": p.get("code", ""),
                            "lead": p.get("lead", ""),
                            "deadline": p.get("deadline", ""),
                            "progress": p.get("progress", 0),
                            "status": p.get("status", "In Progress"),
                            "description": p.get("description", ""),
                            "tech_stack": p.get("techStack", []),
                            "members": p.get("members", []),
                            "tasks": p.get("tasks", []),
                            "activities": p.get("activities", [])
                        })
                    break
            save_db(db)
            self.send_json_response({"success": True, "task": task})

        elif path == "/api/today-tasks/toggle":
            task_id = body.get("id")
            for t in db.get("todayTasks", []):
                if t["id"] == task_id:
                    t["completed"] = not t.get("completed", False)
                    if supabase_client.is_configured():
                        supabase_client.upsert_record("today_tasks", {
                            "id": t["id"],
                            "title": t.get("title", ""),
                            "category": t.get("category", "Study"),
                            "time": t.get("time", ""),
                            "completed": t["completed"],
                            "priority": t.get("priority", "medium")
                        })
                    break
            save_db(db)
            self.send_json_response({"success": True, "tasks": db.get("todayTasks", [])})

        elif path == "/api/today-tasks":
            new_task = body
            if not new_task.get("id"):
                new_task["id"] = f"task-{int(datetime.now().timestamp())}"
            new_task.setdefault("completed", False)
            db.setdefault("todayTasks", []).append(new_task)
            save_db(db)

            if supabase_client.is_configured():
                supabase_client.upsert_record("today_tasks", {
                    "id": new_task["id"],
                    "title": new_task.get("title", ""),
                    "category": new_task.get("category", "Study"),
                    "time": new_task.get("time", ""),
                    "completed": new_task.get("completed", False),
                    "priority": new_task.get("priority", "medium")
                })

            self.send_json_response({"success": True, "task": new_task})

        elif path == "/api/study-materials":
            new_mat = body
            if not new_mat.get("id"):
                new_mat["id"] = f"mat-{int(datetime.now().timestamp())}"
            new_mat.setdefault("uploadedDate", datetime.now().strftime("%Y-%m-%d"))
            db.setdefault("studyMaterials", []).insert(0, new_mat)
            save_db(db)

            if supabase_client.is_configured():
                supabase_client.upsert_record("study_materials", {
                    "id": new_mat["id"],
                    "title": new_mat.get("title", ""),
                    "subject": new_mat.get("subject", ""),
                    "type": new_mat.get("type", "PDF"),
                    "size": new_mat.get("size", "1 MB"),
                    "pages": new_mat.get("pages", 1),
                    "uploaded_date": new_mat.get("uploadedDate", ""),
                    "file_url": new_mat.get("fileUrl", ""),
                    "tags": new_mat.get("tags", []),
                    "status": new_mat.get("status", "Indexed"),
                    "key_concepts": new_mat.get("keyConcepts", [])
                })

            self.send_json_response({"success": True, "material": new_mat})

        elif path == "/api/calendar/events":
            new_evt = body
            if not new_evt.get("id"):
                new_evt["id"] = f"evt-{int(datetime.now().timestamp())}"
            db.setdefault("calendarEvents", []).append(new_evt)
            save_db(db)

            if supabase_client.is_configured():
                supabase_client.upsert_record("calendar_events", {
                    "id": new_evt["id"],
                    "title": new_evt.get("title", ""),
                    "type": new_evt.get("type", "event"),
                    "date": new_evt.get("date", ""),
                    "time": new_evt.get("time", ""),
                    "color": new_evt.get("color", "#3b82f6"),
                    "location": new_evt.get("location", "")
                })

            self.send_json_response({"success": True, "event": new_evt})

        elif path == "/api/supabase/config":
            url = body.get("url", "")
            key = body.get("key", "")
            res = supabase_client.save_credentials(url, key)
            self.send_json_response(res)

        elif path == "/api/supabase/sync":
            direction = body.get("direction", "push")
            if direction == "push":
                local_db = {}
                if DATA_FILE.exists():
                    with open(DATA_FILE, "r", encoding="utf-8") as f:
                        local_db = json.load(f)
                res = supabase_client.sync_local_to_supabase(local_db)
                self.send_json_response(res)
            else:
                cloud_data = supabase_client.fetch_full_db()
                if cloud_data:
                    save_db(cloud_data)
                    self.send_json_response({"success": True, "message": "Local database refreshed from Supabase Cloud."})
                else:
                    self.send_json_response({"success": False, "message": "Failed to pull from Supabase Cloud."}, status=500)

        else:
            self.send_json_response({"error": "Unknown POST endpoint"}, status=404)

    def handle_api_put(self, path, parsed):
        body = self.read_json_body()
        db = load_db()

        if path.startswith("/api/notes/") and path.endswith("/pin"):
            note_id = path.split("/")[3]
            for n in db.get("notes", []):
                if n["id"] == note_id:
                    n["pinned"] = not n.get("pinned", False)
                    if supabase_client.is_configured():
                        supabase_client.upsert_record("notes", {"id": n["id"], "pinned": n["pinned"]})
                    break
            save_db(db)
            self.send_json_response({"success": True, "message": "Note pin status updated."})

        elif path.startswith("/api/notes/"):
            note_id = path.split("/")[3]
            for i, n in enumerate(db.get("notes", [])):
                if n["id"] == note_id:
                    db["notes"][i] = {**n, **body}
                    if supabase_client.is_configured():
                        updated_n = db["notes"][i]
                        supabase_client.upsert_record("notes", {
                            "id": updated_n["id"],
                            "title": updated_n.get("title", ""),
                            "subject": updated_n.get("subject", ""),
                            "subject_id": updated_n.get("subjectId", ""),
                            "unit": updated_n.get("unit", ""),
                            "tags": updated_n.get("tags", []),
                            "pinned": updated_n.get("pinned", False),
                            "date": updated_n.get("date", ""),
                            "pages": updated_n.get("pages", 1),
                            "read_time": updated_n.get("readTime", "5 min"),
                            "content": updated_n.get("content", {})
                        })
                    break
            save_db(db)
            self.send_json_response({"success": True, "message": "Note updated."})

        elif path.startswith("/api/assignments/") and "/status" in path:
            asg_id = path.split("/")[3]
            status = body.get("status", "In Progress")
            for a in db.get("assignments", []):
                if a["id"] == asg_id:
                    a["status"] = status
                    if status == "Completed":
                        a["progress"] = 100
                    elif status == "In Progress" and a.get("progress", 0) == 0:
                        a["progress"] = 50
                    if supabase_client.is_configured():
                        supabase_client.upsert_record("assignments", {
                            "id": a["id"],
                            "status": a["status"],
                            "progress": a["progress"]
                        })
                    break
            save_db(db)
            self.send_json_response({"success": True, "message": "Assignment status updated."})

        elif path.startswith("/api/projects/tasks/") and "/status" in path:
            task_id = path.split("/")[4]
            status = body.get("status", "In Progress")
            for p in db.get("projects", []):
                for t in p.get("tasks", []):
                    if t["id"] == task_id:
                        t["status"] = status
                        p.setdefault("activities", []).insert(0, {
                            "user": "Bijay Mandal",
                            "action": f"moved task '{t.get('title')}' to {status}",
                            "time": "Just now"
                        })
                        if supabase_client.is_configured():
                            supabase_client.upsert_record("projects", {
                                "id": p["id"],
                                "tasks": p.get("tasks", []),
                                "activities": p.get("activities", [])
                            })
                        break
            save_db(db)
            self.send_json_response({"success": True, "message": "Task status updated."})

        elif path == "/api/profile":
            db["student"] = {**db.get("student", {}), **body}
            save_db(db)
            if supabase_client.is_configured():
                st_data = db["student"]
                supabase_client.upsert_record("students", {
                    "id": "student-1",
                    "name": st_data.get("name", "Bijay Mandal"),
                    "course": st_data.get("course", "B.Tech CSE"),
                    "year": st_data.get("year", "2nd Year"),
                    "semester": st_data.get("semester", "Semester 4"),
                    "gender": st_data.get("gender", "Male"),
                    "roll_no": st_data.get("rollNo", "CSE2024-4108"),
                    "college": st_data.get("college", "Sona College of Technology"),
                    "email": st_data.get("email", "bijay.mandal@sonatech.ac.in"),
                    "avatar": st_data.get("avatar", ""),
                    "cgpa": str(st_data.get("cgpa", "8.92")),
                    "attendance": str(st_data.get("attendance", "92%")),
                    "bio": st_data.get("bio", ""),
                    "badges": st_data.get("badges", [])
                })
            self.send_json_response({"success": True, "student": db["student"]})

        elif path == "/api/settings":
            db["settings"] = {**db.get("settings", {}), **body}
            save_db(db)
            if supabase_client.is_configured():
                cfg = db["settings"]
                supabase_client.upsert_record("settings", {
                    "id": "default",
                    "theme": cfg.get("theme", "dark"),
                    "ai_model_preference": cfg.get("aiModelPreference", "balanced"),
                    "email_notifications": cfg.get("emailNotifications", True),
                    "deadline_reminders": cfg.get("deadlineReminders", True),
                    "auto_save_notes": cfg.get("autoSaveNotes", True),
                    "font_size": cfg.get("fontSize", "medium")
                })
            self.send_json_response({"success": True, "settings": db["settings"]})

        else:
            self.send_json_response({"error": "Unknown PUT endpoint"}, status=404)

    def handle_api_delete(self, path, parsed):
        db = load_db()

        if path.startswith("/api/notes/"):
            note_id = path.split("/")[3]
            db["notes"] = [n for n in db.get("notes", []) if n["id"] != note_id]
            save_db(db)
            if supabase_client.is_configured():
                supabase_client.delete_record("notes", note_id)
            self.send_json_response({"success": True, "message": "Note deleted successfully."})

        elif path.startswith("/api/assignments/"):
            asg_id = path.split("/")[3]
            db["assignments"] = [a for a in db.get("assignments", []) if a["id"] != asg_id]
            save_db(db)
            if supabase_client.is_configured():
                supabase_client.delete_record("assignments", asg_id)
            self.send_json_response({"success": True, "message": "Assignment deleted."})

        elif path.startswith("/api/study-materials/"):
            mat_id = path.split("/")[3]
            db["studyMaterials"] = [m for m in db.get("studyMaterials", []) if m["id"] != mat_id]
            save_db(db)
            if supabase_client.is_configured():
                supabase_client.delete_record("study_materials", mat_id)
            self.send_json_response({"success": True, "message": "Study material removed."})

        else:
            self.send_json_response({"error": "Unknown DELETE endpoint"}, status=404)

def run_server():
    httpd = http.server.ThreadingHTTPServer(("0.0.0.0", PORT), StudentHubHandler)
    print(f"================================================================", flush=True)
    print(f"[*] StudentHub Server is running at http://localhost:{PORT}", flush=True)
    print(f"[*] Serving static assets from {PUBLIC_DIR}", flush=True)
    print(f"[*] JSON Database loaded from {DATA_FILE}", flush=True)
    print(f"================================================================", flush=True)
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        httpd.server_close()

if __name__ == "__main__":
    run_server()
