-- ==============================================================================
-- StudentHub - AI-Powered Academic & Project Management Platform
-- Supabase PostgreSQL Schema & Initial Data Migration
-- ==============================================================================

-- Enable UUID extension if needed
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. STUDENTS / PROFILE TABLE
CREATE TABLE IF NOT EXISTS students (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    course TEXT NOT NULL,
    year TEXT NOT NULL,
    semester TEXT NOT NULL,
    gender TEXT,
    roll_no TEXT,
    college TEXT,
    email TEXT,
    avatar TEXT,
    cgpa TEXT,
    attendance TEXT,
    bio TEXT,
    badges JSONB DEFAULT '[]'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. SUBJECTS TABLE
CREATE TABLE IF NOT EXISTS subjects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    code TEXT NOT NULL,
    color TEXT DEFAULT '#3b82f6',
    icon TEXT DEFAULT 'book',
    credits INTEGER DEFAULT 3,
    faculty TEXT,
    notes_count INTEGER DEFAULT 0,
    assignments_count INTEGER DEFAULT 0,
    progress INTEGER DEFAULT 0,
    units JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 3. NOTES TABLE
CREATE TABLE IF NOT EXISTS notes (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_id TEXT,
    unit TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    pinned BOOLEAN DEFAULT FALSE,
    date TEXT,
    pages INTEGER DEFAULT 1,
    read_time TEXT DEFAULT '5 min',
    content JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. ASSIGNMENTS TABLE
CREATE TABLE IF NOT EXISTS assignments (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    subject_id TEXT,
    due_date TEXT NOT NULL,
    priority TEXT DEFAULT 'Medium',
    status TEXT DEFAULT 'In Progress',
    progress INTEGER DEFAULT 0,
    max_marks INTEGER DEFAULT 100,
    description TEXT,
    attachments JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 5. PROJECTS TABLE
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    code TEXT,
    lead TEXT,
    deadline TEXT,
    progress INTEGER DEFAULT 0,
    status TEXT DEFAULT 'In Progress',
    description TEXT,
    tech_stack JSONB DEFAULT '[]'::jsonb,
    members JSONB DEFAULT '[]'::jsonb,
    tasks JSONB DEFAULT '[]'::jsonb,
    activities JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 6. STUDY MATERIALS VAULT TABLE
CREATE TABLE IF NOT EXISTS study_materials (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    subject TEXT NOT NULL,
    type TEXT DEFAULT 'PDF',
    size TEXT,
    pages INTEGER DEFAULT 1,
    uploaded_date TEXT,
    file_url TEXT,
    tags JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'Indexed',
    key_concepts JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 7. CALENDAR EVENTS TABLE
CREATE TABLE IF NOT EXISTS calendar_events (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT DEFAULT 'event',
    date TEXT NOT NULL,
    time TEXT,
    color TEXT DEFAULT '#3b82f6',
    location TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 8. TODAY TASKS TABLE
CREATE TABLE IF NOT EXISTS today_tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT DEFAULT 'Study',
    time TEXT,
    completed BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 9. SETTINGS TABLE
CREATE TABLE IF NOT EXISTS settings (
    id TEXT PRIMARY KEY DEFAULT 'default',
    theme TEXT DEFAULT 'dark',
    ai_model_preference TEXT DEFAULT 'balanced',
    email_notifications BOOLEAN DEFAULT TRUE,
    deadline_reminders BOOLEAN DEFAULT TRUE,
    auto_save_notes BOOLEAN DEFAULT TRUE,
    font_size TEXT DEFAULT 'medium',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 10. AI HISTORY & DOUBTS LOG
CREATE TABLE IF NOT EXISTS ai_history (
    id TEXT PRIMARY KEY,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    subject TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Enable Row Level Security (RLS) & Allow public read/write for demo platform
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_materials ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE today_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_history ENABLE ROW LEVEL SECURITY;

-- Create Open Access Policies for Anon / Authenticated keys
CREATE POLICY "Allow public full access on students" ON students FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on subjects" ON subjects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on assignments" ON assignments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on projects" ON projects FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on study_materials" ON study_materials FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on calendar_events" ON calendar_events FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on today_tasks" ON today_tasks FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on settings" ON settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public full access on ai_history" ON ai_history FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- INITIAL SEED DATA: Bijay Mandal (B.Tech CSE, Sona College of Technology)
-- ==============================================================================

INSERT INTO students (id, name, course, year, semester, gender, roll_no, college, email, avatar, cgpa, attendance, bio, badges)
VALUES (
    'student-1',
    'Bijay Mandal',
    'B.Tech Computer Science & Engineering',
    '2nd Year',
    'Semester 4',
    'Male',
    'CSE2024-4108',
    'Sona College of Technology',
    'bijay.mandal@sonatech.ac.in',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
    '8.92',
    '92%',
    'Passionate 2nd Year Computer Science student at Sona College of Technology focusing on Operating Systems, Data Structures, DBMS, and AI. Always curious to learn and build scalable projects.',
    '[{"id": "b1", "name": "AI Power User", "icon": "✨", "desc": "Generated over 25+ AI study notes"}, {"id": "b2", "name": "Consistent Learner", "icon": "🔥", "desc": "14-day continuous study streak"}, {"id": "b3", "name": "Deadline Master", "icon": "🎯", "desc": "Submitted 100% assignments on time"}, {"id": "b4", "name": "Project Lead", "icon": "🚀", "desc": "Leading Smart Campus Management System"}]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    college = EXCLUDED.college,
    course = EXCLUDED.course,
    year = EXCLUDED.year,
    semester = EXCLUDED.semester;

INSERT INTO subjects (id, name, code, color, icon, credits, faculty, notes_count, assignments_count, progress, units)
VALUES 
(
    'sub-os', 'Operating Systems', 'CS-301', '#3b82f6', 'cpu', 4, 'Dr. Ramesh Iyer', 12, 2, 78,
    '[{"id": 1, "name": "Introduction & System Structures", "status": "Completed"}, {"id": 2, "name": "Process Management & Threads", "status": "Completed"}, {"id": 3, "name": "CPU Scheduling & Synchronization", "status": "In Progress"}, {"id": 4, "name": "Deadlocks & Memory Management", "status": "Pending"}, {"id": 5, "name": "Storage Management & File Systems", "status": "Pending"}]'::jsonb
),
(
    'sub-dbms', 'DBMS', 'CS-302', '#8b5cf6', 'database', 4, 'Prof. Sunita Rao', 10, 1, 82,
    '[{"id": 1, "name": "ER Model & Relational Algebra", "status": "Completed"}, {"id": 2, "name": "SQL & Advanced Queries", "status": "Completed"}, {"id": 3, "name": "Normalization & Functional Dependencies", "status": "Completed"}, {"id": 4, "name": "Transaction Processing & Concurrency", "status": "In Progress"}, {"id": 5, "name": "NoSQL & Distributed Databases", "status": "Pending"}]'::jsonb
),
(
    'sub-cn', 'Computer Networks', 'CS-303', '#10b981', 'network', 4, 'Dr. Arvind Nair', 8, 1, 65,
    '[{"id": 1, "name": "Network Models & Physical Layer", "status": "Completed"}, {"id": 2, "name": "Data Link Layer & Error Control", "status": "Completed"}, {"id": 3, "name": "Network Layer & Routing Protocols", "status": "In Progress"}, {"id": 4, "name": "Transport Layer (TCP/UDP) & Congestion", "status": "In Progress"}, {"id": 5, "name": "Application Layer & Security", "status": "Pending"}]'::jsonb
),
(
    'sub-java', 'Java Programming', 'CS-304', '#f59e0b', 'code-xml', 3, 'Prof. Manoj Verma', 7, 1, 88,
    '[{"id": 1, "name": "OOP Concepts & Java Fundamentals", "status": "Completed"}, {"id": 2, "name": "Inheritance, Interfaces & Packages", "status": "Completed"}, {"id": 3, "name": "Exception Handling & Multithreading", "status": "Completed"}, {"id": 4, "name": "Java Collections Framework & Streams", "status": "In Progress"}, {"id": 5, "name": "GUI with JavaFX & JDBC Connectivity", "status": "In Progress"}]'::jsonb
),
(
    'sub-math', 'Discrete Mathematics', 'MA-305', '#ec4899', 'sigma', 4, 'Dr. Geeta Pillai', 5, 1, 55,
    '[{"id": 1, "name": "Set Theory & Mathematical Logic", "status": "Completed"}, {"id": 2, "name": "Relations & Functions", "status": "Completed"}, {"id": 3, "name": "Combinatorics & Generating Functions", "status": "In Progress"}, {"id": 4, "name": "Graph Theory & Trees", "status": "Pending"}, {"id": 5, "name": "Algebraic Structures & Group Theory", "status": "Pending"}]'::jsonb
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO settings (id, theme, ai_model_preference, email_notifications, deadline_reminders, auto_save_notes, font_size)
VALUES ('default', 'dark', 'balanced', true, true, true, 'medium')
ON CONFLICT (id) DO NOTHING;
