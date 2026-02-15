-- Workout App — Supabase Schema
-- Run this in Supabase SQL Editor after creating your project.

-- 1. Users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  preferences JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Workout plans
CREATE TABLE IF NOT EXISTS workout_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  week_number INTEGER NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  created_by TEXT NOT NULL DEFAULT 'ai',
  conversation_id TEXT,
  exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_plans_user_id ON workout_plans(user_id);

-- 3. Workout sessions
CREATE TABLE IF NOT EXISTS workout_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  plan_id TEXT,
  date TEXT NOT NULL,
  start_time TEXT NOT NULL,
  end_time TEXT,
  completed BOOLEAN NOT NULL DEFAULT false,
  logged_exercises JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_workout_sessions_user_id ON workout_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_workout_sessions_date ON workout_sessions(date);

-- 4. Conversations
CREATE TABLE IF NOT EXISTS conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_conversations_user_id ON conversations(user_id);

-- 5. Chat messages
CREATE TABLE IF NOT EXISTS chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  extracted_exercises JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_conversation_id ON chat_messages(conversation_id);

-- 6. Auto-update updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables
CREATE TRIGGER set_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workout_plans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON workout_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER set_updated_at BEFORE UPDATE ON chat_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Prevent users from changing their own role via the API
CREATE OR REPLACE FUNCTION prevent_role_change()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND current_setting('role') NOT IN ('postgres', 'service_role') THEN
    RAISE EXCEPTION 'Role changes are not allowed through the API';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER guard_role_change BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION prevent_role_change();

-- 7. Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users: can only access own row
CREATE POLICY users_select ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY users_insert ON users FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid() = id);

-- Workout plans: can only access own plans
CREATE POLICY plans_select ON workout_plans FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY plans_insert ON workout_plans FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY plans_update ON workout_plans FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY plans_delete ON workout_plans FOR DELETE USING (auth.uid() = user_id);

-- Workout sessions: can only access own sessions
CREATE POLICY sessions_select ON workout_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY sessions_insert ON workout_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY sessions_update ON workout_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY sessions_delete ON workout_sessions FOR DELETE USING (auth.uid() = user_id);

-- Conversations: can only access own conversations
CREATE POLICY convos_select ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY convos_insert ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY convos_update ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY convos_delete ON conversations FOR DELETE USING (auth.uid() = user_id);

-- Chat messages: can only access messages in own conversations
CREATE POLICY msgs_select ON chat_messages FOR SELECT
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = chat_messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY msgs_insert ON chat_messages FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = chat_messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY msgs_update ON chat_messages FOR UPDATE
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = chat_messages.conversation_id AND conversations.user_id = auth.uid()));
CREATE POLICY msgs_delete ON chat_messages FOR DELETE
  USING (EXISTS (SELECT 1 FROM conversations WHERE conversations.id = chat_messages.conversation_id AND conversations.user_id = auth.uid()));
