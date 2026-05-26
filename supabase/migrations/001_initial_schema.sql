-- ============================================================
-- WM Client Portal — Supabase Schema + RLS
-- Copy ALL of this and paste into Supabase SQL Editor
-- File: supabase/migrations/001_initial_schema.sql
-- ============================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('manager', 'account_manager', 'client');
CREATE TYPE client_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE report_type AS ENUM ('seo', 'website_update', 'analytics', 'audit', 'other');
CREATE TYPE request_status AS ENUM ('pending', 'approved', 'rejected');

-- ============================================================
-- USERS TABLE (extends Supabase auth.users)
-- ============================================================
CREATE TABLE public.users (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  email       TEXT NOT NULL UNIQUE,
  role        user_role NOT NULL DEFAULT 'client',
  avatar_url  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- CLIENTS TABLE
-- ============================================================
CREATE TABLE public.clients (
  id                        UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_name              TEXT NOT NULL,
  contact_person            TEXT NOT NULL,
  email                     TEXT NOT NULL,
  phone                     TEXT,
  website                   TEXT,
  assigned_account_manager  UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_by                UUID NOT NULL REFERENCES public.users(id),
  status                    client_status NOT NULL DEFAULT 'active',
  notes                     TEXT,
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- REPORTS TABLE
-- ============================================================
CREATE TABLE public.reports (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  uploaded_by  UUID NOT NULL REFERENCES public.users(id),
  report_type  report_type NOT NULL,
  title        TEXT NOT NULL,
  description  TEXT,
  file_url     TEXT NOT NULL,
  file_name    TEXT NOT NULL,
  file_size    BIGINT,
  mime_type    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- COMMENTS TABLE
-- ============================================================
CREATE TABLE public.comments (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  report_id  UUID NOT NULL REFERENCES public.reports(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- MESSAGES TABLE (Direct messages / Chat)
-- ============================================================
CREATE TABLE public.messages (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sender_id   UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  attachment  TEXT,             -- Supabase storage URL
  is_read     BOOLEAN NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_sender   ON public.messages(sender_id);
CREATE INDEX idx_messages_receiver ON public.messages(receiver_id);
CREATE INDEX idx_messages_thread   ON public.messages(
  LEAST(sender_id, receiver_id),
  GREATEST(sender_id, receiver_id),
  created_at DESC
);

-- ============================================================
-- DELETE REQUESTS TABLE
-- ============================================================
CREATE TABLE public.delete_requests (
  id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  client_id    UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL REFERENCES public.users(id),
  reason       TEXT,
  status       request_status NOT NULL DEFAULT 'pending',
  approved_by  UUID REFERENCES public.users(id),
  reviewed_at  TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- NOTIFICATIONS TABLE
-- ============================================================
CREATE TABLE public.notifications (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_notifications_user ON public.notifications(user_id, is_read, created_at DESC);

-- ============================================================
-- ACTIVITY LOGS TABLE
-- ============================================================
CREATE TABLE public.activity_logs (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  action     TEXT NOT NULL,
  entity     TEXT,             -- e.g. 'report', 'client'
  entity_id  UUID,
  metadata   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_activity_logs_user ON public.activity_logs(user_id, created_at DESC);

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_users_updated_at    BEFORE UPDATE ON public.users    FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_clients_updated_at  BEFORE UPDATE ON public.clients  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_reports_updated_at  BEFORE UPDATE ON public.reports  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ============================================================
-- AUTO-CREATE USER PROFILE ON SIGNUP
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, full_name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Unknown'),
    NEW.email,
    COALESCE((NEW.raw_user_meta_data->>'role')::user_role, 'client')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE public.users          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.delete_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs  ENABLE ROW LEVEL SECURITY;

-- Helper function: get current user role
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS user_role LANGUAGE sql STABLE SECURITY DEFINER AS $$
  SELECT role FROM public.users WHERE id = auth.uid();
$$;

-- ---- USERS ----
CREATE POLICY "users_select_self"   ON public.users FOR SELECT USING (id = auth.uid() OR get_my_role() IN ('manager', 'account_manager'));
CREATE POLICY "users_update_self"   ON public.users FOR UPDATE USING (id = auth.uid());
CREATE POLICY "users_manager_all"   ON public.users FOR ALL USING (get_my_role() = 'manager');

-- ---- CLIENTS ----
CREATE POLICY "clients_manager_all" ON public.clients FOR ALL USING (get_my_role() = 'manager');
CREATE POLICY "clients_am_select"   ON public.clients FOR SELECT USING (
  get_my_role() = 'account_manager' AND assigned_account_manager = auth.uid()
);
CREATE POLICY "clients_am_insert"   ON public.clients FOR INSERT WITH CHECK (get_my_role() = 'account_manager');
CREATE POLICY "clients_am_update"   ON public.clients FOR UPDATE USING (
  get_my_role() = 'account_manager' AND assigned_account_manager = auth.uid()
);
-- Clients can only view their own record (matched by email to auth user)
CREATE POLICY "clients_client_self" ON public.clients FOR SELECT USING (
  get_my_role() = 'client' AND email = (SELECT email FROM public.users WHERE id = auth.uid())
);

-- ---- REPORTS ----
CREATE POLICY "reports_manager_all" ON public.reports FOR ALL USING (get_my_role() = 'manager');
CREATE POLICY "reports_am_own_clients" ON public.reports FOR ALL USING (
  get_my_role() = 'account_manager' AND
  client_id IN (SELECT id FROM public.clients WHERE assigned_account_manager = auth.uid())
);
CREATE POLICY "reports_client_view" ON public.reports FOR SELECT USING (
  get_my_role() = 'client' AND
  client_id IN (SELECT id FROM public.clients WHERE email = (SELECT email FROM public.users WHERE id = auth.uid()))
);

-- ---- COMMENTS ----
CREATE POLICY "comments_view"   ON public.comments FOR SELECT USING (
  report_id IN (SELECT id FROM public.reports) -- inherits report-level access via app
);
CREATE POLICY "comments_insert" ON public.comments FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "comments_delete" ON public.comments FOR DELETE USING (
  user_id = auth.uid() OR get_my_role() = 'manager'
);

-- ---- MESSAGES ----
CREATE POLICY "messages_select" ON public.messages FOR SELECT USING (
  sender_id = auth.uid() OR receiver_id = auth.uid()
);
CREATE POLICY "messages_insert" ON public.messages FOR INSERT WITH CHECK (sender_id = auth.uid());
CREATE POLICY "messages_update" ON public.messages FOR UPDATE USING (receiver_id = auth.uid()); -- for is_read
CREATE POLICY "messages_manager" ON public.messages FOR SELECT USING (get_my_role() = 'manager');

-- ---- DELETE REQUESTS ----
CREATE POLICY "dr_manager_all"    ON public.delete_requests FOR ALL USING (get_my_role() = 'manager');
CREATE POLICY "dr_am_own"         ON public.delete_requests FOR SELECT USING (requested_by = auth.uid());
CREATE POLICY "dr_am_insert"      ON public.delete_requests FOR INSERT WITH CHECK (
  get_my_role() = 'account_manager' AND requested_by = auth.uid()
);

-- ---- NOTIFICATIONS ----
CREATE POLICY "notif_own" ON public.notifications FOR ALL USING (user_id = auth.uid());

-- ---- ACTIVITY LOGS ----
CREATE POLICY "logs_manager_all" ON public.activity_logs FOR SELECT USING (get_my_role() = 'manager');
CREATE POLICY "logs_insert"      ON public.activity_logs FOR INSERT WITH CHECK (TRUE);

-- ============================================================
-- STORAGE BUCKETS
-- ============================================================
INSERT INTO storage.buckets (id, name, public) VALUES
  ('reports',     'reports',     FALSE),
  ('attachments', 'attachments', FALSE),
  ('avatars',     'avatars',     TRUE);

-- Storage policies
CREATE POLICY "reports_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'reports' AND auth.role() = 'authenticated'
);
CREATE POLICY "reports_view" ON storage.objects FOR SELECT USING (
  bucket_id = 'reports' AND auth.role() = 'authenticated'
);
CREATE POLICY "attachments_rw" ON storage.objects FOR ALL USING (
  bucket_id = 'attachments' AND auth.role() = 'authenticated'
);
CREATE POLICY "avatars_public" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);