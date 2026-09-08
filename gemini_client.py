"""
Google Gemini AI Client for StudentHub Academic Platform
Direct REST integration supporting Gemini 1.5 Flash, 1.5 Pro, and 2.0 Flash
with multi-department academic intelligence and automatic fallbacks.
"""

import os
import json
import time
import urllib.request
import urllib.error
import urllib.parse
from pathlib import Path
from datetime import datetime

BASE_DIR = Path(__file__).resolve().parent
ENV_FILE = BASE_DIR / ".env"

def load_env():
    if ENV_FILE.exists():
        with open(ENV_FILE, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ[k.strip()] = v.strip()

load_env()

class GeminiClient:
    def __init__(self):
        self.api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash").strip()
        self.timeout = 15

    def reload_config(self):
        load_env()
        self.api_key = os.environ.get("GEMINI_API_KEY", "").strip()
        self.model = os.environ.get("GEMINI_MODEL", "gemini-1.5-flash").strip()

    def is_configured(self):
        return bool(self.api_key and len(self.api_key) > 15 and not self.api_key.startswith("your-gemini"))

    def save_api_key(self, api_key, model=None):
        self.api_key = api_key.strip()
        if model:
            self.model = model.strip()
        os.environ["GEMINI_API_KEY"] = self.api_key
        os.environ["GEMINI_MODEL"] = self.model

        # Update .env file
        env_lines = []
        updated_key = False
        updated_model = False

        if ENV_FILE.exists():
            with open(ENV_FILE, "r", encoding="utf-8") as f:
                for line in f:
                    if line.startswith("GEMINI_API_KEY="):
                        env_lines.append(f"GEMINI_API_KEY={self.api_key}\n")
                        updated_key = True
                    elif line.startswith("GEMINI_MODEL="):
                        env_lines.append(f"GEMINI_MODEL={self.model}\n")
                        updated_model = True
                    else:
                        env_lines.append(line)

        if not updated_key:
            env_lines.append(f"GEMINI_API_KEY={self.api_key}\n")
        if not updated_model:
            env_lines.append(f"GEMINI_MODEL={self.model}\n")

        with open(ENV_FILE, "w", encoding="utf-8") as f:
            f.writelines(env_lines)

        return self.test_connection()

    def test_connection(self):
        if not self.is_configured():
            return {
                "connected": False,
                "configured": False,
                "message": "Gemini API Key is not set. Add your key in Settings or .env to activate live Gemini AI."
            }

        start_time = time.time()
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        payload = {
            "contents": [{
                "parts": [{"text": "Hello, respond with ONLY the word 'CONNECTED' to confirm API status."}]
            }],
            "generationConfig": {
                "temperature": 0.1,
                "maxOutputTokens": 10
            }
        }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(payload).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                latency = round((time.time() - start_time) * 1000, 2)
                return {
                    "connected": True,
                    "configured": True,
                    "model": self.model,
                    "latencyMs": latency,
                    "status": resp.status,
                    "message": f"Successfully connected to Google Gemini ({self.model}) in {latency}ms."
                }
        except urllib.error.HTTPError as e:
            error_msg = ""
            try:
                error_msg = e.read().decode("utf-8")
            except Exception:
                pass
            return {
                "connected": False,
                "configured": True,
                "status": e.code,
                "message": f"Gemini API Error ({e.code}): {error_msg or e.reason}"
            }
        except Exception as e:
            return {
                "connected": False,
                "configured": True,
                "message": f"Gemini Connection Failed: {str(e)}"
            }

    def generate_content(self, prompt, system_instruction=None, json_mode=False):
        if not self.is_configured():
            return None

        url = f"https://generativelanguage.googleapis.com/v1beta/models/{self.model}:generateContent?key={self.api_key}"
        
        body = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.4,
                "topP": 0.95,
                "maxOutputTokens": 4096
            }
        }

        if json_mode:
            body["generationConfig"]["responseMimeType"] = "application/json"

        if system_instruction:
            body["systemInstruction"] = {
                "parts": [{"text": system_instruction}]
            }

        try:
            req = urllib.request.Request(
                url,
                data=json.dumps(body).encode("utf-8"),
                headers={"Content-Type": "application/json"},
                method="POST"
            )
            with urllib.request.urlopen(req, timeout=self.timeout) as resp:
                res_data = json.loads(resp.read().decode("utf-8"))
                candidates = res_data.get("candidates", [])
                if candidates and "content" in candidates[0]:
                    parts = candidates[0]["content"].get("parts", [])
                    if parts and "text" in parts[0]:
                        return parts[0]["text"]
            return None
        except Exception as e:
            print(f"[Gemini API Error] {e}")
            return None

    def generate_academic_notes(self, department, subject, unit, note_types, material_text="", file_name=""):
        if self.is_configured():
            system_prompt = (
                "You are an expert college professor and academic mentor across all university departments "
                f"(Computer Science, AI & DS, ECE, EEE, Mechanical, Civil, IT, Biotechnology, Management/MBA). "
                "Your task is to generate comprehensive, exam-ready, structured academic study notes in strict JSON format. "
                "Ensure rich technical depth, accurate formulas, clear bullet points, real-world examples, and examination insights."
            )

            user_prompt = f"""Generate structured academic study notes for:
Department: {department}
Subject: {subject}
Unit / Chapter: {unit or 'General Module'}
Requested Sections: {', '.join(note_types)}
Reference Material / Topic Context: {material_text if material_text else 'Generate comprehensive syllabus-aligned notes for this subject and unit.'}
Source File Name: {file_name if file_name else 'Lecture_Material.pdf'}

Output MUST be a JSON object with this EXACT structure:
{{
  "title": "Concise Descriptive Title for Unit/Topic",
  "subject": "{subject}",
  "unit": "{unit or 'Unit 3'}",
  "tags": ["{subject.replace(' ', '')}", "{department.replace(' ', '')}", "AINotes", "GeminiPro"],
  "content": {{
    "shortNotes": "Markdown text with headers, bullet points, core concepts, theoretical framework and clear explanations",
    "keyPoints": "Markdown text with high-yield exam bullet points and critical formulas/axioms",
    "importantTopics": "Markdown list of the top 4-5 high-priority university examination topics",
    "mcqs": "4-5 multiple choice questions with options A, B, C, D and [CORRECT] indicator",
    "vivaQuestions": "3-4 viva voce / interview questions with concise, high-impact answers",
    "summary": "1-2 paragraphs of executive summary synthesizing the entire unit"
  }}
}}
"""
            raw_json = self.generate_content(user_prompt, system_instruction=system_prompt, json_mode=True)
            if raw_json:
                try:
                    parsed = json.loads(raw_json)
                    parsed["date"] = datetime.now().strftime("%Y-%m-%d")
                    parsed["pinned"] = False
                    parsed["isAiGenerated"] = True
                    parsed["generatedBy"] = f"Google Gemini ({self.model})"
                    parsed["department"] = department
                    return parsed
                except Exception as e:
                    print(f"[Gemini Parse Error] {e}")

        # Seamless Fallback to Multi-Department Local Synthesis Engine
        return None

    def solve_academic_doubt(self, question, department="Computer Science & Engineering", subject="Computer Science"):
        if self.is_configured():
            system_prompt = (
                "You are an elite academic AI tutor for university students across all engineering and management departments. "
                "Provide clear, pedagogical, intuitive yet rigorous explanations. "
                "Structure your output in clear JSON with explanation, keyPoints (array of strings), example, and summary."
            )
            user_prompt = f"""A student from the {department} department asks this academic question in '{subject}':
Question: "{question}"

Please provide a structured academic response in JSON format with:
{{
  "question": "{question}",
  "subject": "{subject}",
  "department": "{department}",
  "explanation": "Clear, detailed pedagogical explanation with markdown formatting, diagrams in ASCII/Mermaid or formulas where relevant.",
  "keyPoints": [
    "Key takeaway point 1",
    "Key takeaway point 2",
    "Key takeaway point 3",
    "Key takeaway point 4"
  ],
  "example": "Intuitive real-world analogy or concrete engineering calculation/code sample.",
  "summary": "Crisp 1-2 sentence core conclusion."
}}
"""
            raw_json = self.generate_content(user_prompt, system_instruction=system_prompt, json_mode=True)
            if raw_json:
                try:
                    res = json.loads(raw_json)
                    res["poweredBy"] = f"Google Gemini ({self.model})"
                    return res
                except Exception as e:
                    print(f"[Gemini Doubt Parse Error] {e}")

        return None

# Singleton instance
gemini_client = GeminiClient()
