-- Daily Task Manager Database Schema

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Create custom types
CREATE TYPE task_type_enum AS ENUM ('HABIT', 'DAILY_TASK', 'TODO', 'LONG_TERM');
CREATE TYPE habit_type_enum AS ENUM ('GOOD', 'BAD');
CREATE TYPE recurrence_type_enum AS ENUM (
    'DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 
    'EVERY_X_DAYS', 'EVERY_X_WEEKS', 'EVERY_X_MONTHS',
    'WEEKLY_ON_DAYS', 'MONTHLY_ON_DAYS'
);
CREATE TYPE time_range_type_enum AS ENUM ('DAYS', 'WEEKS', 'MONTHS');

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    preferred_language VARCHAR(10) DEFAULT 'en',
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tasks table (unified for all task types)
CREATE TABLE tasks (
    id VARCHAR(50) PRIMARY KEY, -- timestamp + random for compatibility
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    task_type task_type_enum NOT NULL,
    importance INTEGER CHECK (importance BETWEEN 1 AND 5) DEFAULT 1,
    is_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- HABIT specific fields
    habit_type habit_type_enum,
    threshold_count INTEGER,
    time_range_value INTEGER,
    time_range_type time_range_type_enum,
    last_completion_time TIMESTAMP WITH TIME ZONE,
    
    -- DAILY_TASK specific fields
    target_date TIMESTAMP WITH TIME ZONE,
    is_recurring BOOLEAN DEFAULT TRUE,
    recurrence_type recurrence_type_enum,
    recurrence_interval INTEGER,
    recurrence_day_of_week INTEGER, -- 0=Sunday, 1=Monday...6=Saturday
    recurrence_day_of_month INTEGER, -- 1-31, -1=last day of month
    current_consecutive_completed INTEGER DEFAULT 0,
    current_consecutive_missed INTEGER DEFAULT 0,
    max_consecutive_completed INTEGER DEFAULT 0,
    last_reset_date TIMESTAMP WITH TIME ZONE,
    
    -- TODO specific fields
    due_date TIMESTAMP WITH TIME ZONE,
    is_overdue BOOLEAN DEFAULT FALSE,
    
    -- LONG_TERM specific fields
    progress DECIMAL(3,2) DEFAULT 0.00 CHECK (progress BETWEEN 0 AND 1),
    show_progress BOOLEAN DEFAULT TRUE,
    target_completion_date TIMESTAMP WITH TIME ZONE
);

-- Task notes (small goals)
CREATE TABLE task_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    is_completed BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Completion history for daily tasks
CREATE TABLE completion_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completion_date DATE NOT NULL,
    is_completed BOOLEAN NOT NULL,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Habit completion log
CREATE TABLE habit_completions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Milestones for long-term tasks
CREATE TABLE milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id VARCHAR(50) NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    is_completed BOOLEAN DEFAULT FALSE,
    completion_date TIMESTAMP WITH TIME ZONE,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Translation support (future)
CREATE TABLE translations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resource_type VARCHAR(50) NOT NULL, -- 'task', 'milestone', 'note'
    resource_id VARCHAR(50) NOT NULL,
    field_name VARCHAR(50) NOT NULL, -- 'title', 'description'
    language_code VARCHAR(10) NOT NULL,
    translated_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_tasks_user_id ON tasks(user_id);
CREATE INDEX idx_tasks_type ON tasks(task_type);
CREATE INDEX idx_tasks_due_date ON tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_task_notes_task_id ON task_notes(task_id);
CREATE INDEX idx_completion_history_task_id ON completion_history(task_id);
CREATE INDEX idx_completion_history_date ON completion_history(completion_date);
CREATE INDEX idx_habit_completions_task_id ON habit_completions(task_id);
CREATE INDEX idx_habit_completions_date ON habit_completions(completed_at);
CREATE INDEX idx_milestones_task_id ON milestones(task_id);
CREATE INDEX idx_translations_resource ON translations(resource_type, resource_id);
CREATE INDEX idx_translations_lang ON translations(language_code);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
