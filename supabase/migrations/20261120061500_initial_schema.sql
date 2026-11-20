DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'document_type'
  ) THEN
    CREATE TYPE public.document_type AS ENUM ('exam', 'answer_key', 'assignment', 'course');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'validation_status'
  ) THEN
    CREATE TYPE public.validation_status AS ENUM ('pending', 'verified', 'disputed', 'rejected');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'availability_status'
  ) THEN
    CREATE TYPE public.availability_status AS ENUM ('available', 'unavailable');
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public' AND t.typname = 'report_status'
  ) THEN
    CREATE TYPE public.report_status AS ENUM ('open', 'reviewing', 'resolved', 'dismissed');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  university text NOT NULL DEFAULT '',
  programme text NOT NULL DEFAULT '',
  level text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  description text NOT NULL DEFAULT '',
  icon_key text NOT NULL DEFAULT 'book',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.academic_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  file_name text NOT NULL,
  file_path text NOT NULL UNIQUE,
  mime_type text NOT NULL,
  file_size_bytes bigint NOT NULL CHECK (file_size_bytes > 0 AND file_size_bytes <= 10485760),
  subject_id uuid NOT NULL REFERENCES public.subjects (id) ON DELETE RESTRICT,
  level text NOT NULL,
  academic_year text NOT NULL,
  session text NOT NULL DEFAULT 'Session normale',
  establishment text NOT NULL,
  programme text NOT NULL DEFAULT '',
  contributor_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE RESTRICT,
  contributor_display_name text NOT NULL,
  page_count integer CHECK (page_count IS NULL OR page_count > 0),
  download_count bigint NOT NULL DEFAULT 0 CHECK (download_count >= 0),
  type public.document_type NOT NULL,
  availability_status public.availability_status NOT NULL DEFAULT 'available',
  validation_status public.validation_status NOT NULL DEFAULT 'pending',
  validated_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  validated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (
    (validation_status = 'verified' AND validated_at IS NOT NULL)
    OR validation_status <> 'verified'
  )
);

CREATE TABLE IF NOT EXISTS public.document_favorites (
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  document_id uuid NOT NULL REFERENCES public.academic_documents (id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, document_id)
);

CREATE TABLE IF NOT EXISTS public.app_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  title text NOT NULL,
  message text NOT NULL,
  related_document_id uuid REFERENCES public.academic_documents (id) ON DELETE SET NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.document_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.academic_documents (id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.profiles (id) ON DELETE CASCADE,
  reason text NOT NULL CHECK (
    reason IN ('incorrect_document', 'unreadable_content', 'wrong_format', 'wrong_answer_key', 'other')
  ),
  comment text NOT NULL DEFAULT '',
  status public.report_status NOT NULL DEFAULT 'open',
  reviewed_by uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.download_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id uuid NOT NULL REFERENCES public.academic_documents (id) ON DELETE CASCADE,
  user_id uuid REFERENCES public.profiles (id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS academic_documents_subject_idx
  ON public.academic_documents (subject_id);
CREATE INDEX IF NOT EXISTS academic_documents_title_idx
  ON public.academic_documents (title);
CREATE INDEX IF NOT EXISTS academic_documents_publication_idx
  ON public.academic_documents (validation_status, availability_status, created_at DESC);
CREATE INDEX IF NOT EXISTS academic_documents_contributor_idx
  ON public.academic_documents (contributor_id, created_at DESC);
CREATE INDEX IF NOT EXISTS app_notifications_user_created_idx
  ON public.app_notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS document_reports_status_created_idx
  ON public.document_reports (status, created_at DESC);
CREATE INDEX IF NOT EXISTS document_reports_reporter_created_idx
  ON public.document_reports (reporter_id, created_at DESC);
CREATE INDEX IF NOT EXISTS download_events_document_created_idx
  ON public.download_events (document_id, created_at DESC);
CREATE INDEX IF NOT EXISTS download_events_user_created_idx
  ON public.download_events (user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SET search_path = ''
AS $$
  SELECT coalesce((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin', false);
$$;

CREATE OR REPLACE FUNCTION public.create_profile_for_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, first_name, last_name)
  VALUES (
    NEW.id,
    coalesce(NEW.raw_user_meta_data ->> 'first_name', ''),
    coalesce(NEW.raw_user_meta_data ->> 'last_name', '')
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_document_download_count()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.academic_documents
  SET download_count = download_count + 1
  WHERE id = NEW.document_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS profiles_set_updated_at ON public.profiles;
CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS academic_documents_set_updated_at ON public.academic_documents;
CREATE TRIGGER academic_documents_set_updated_at
  BEFORE UPDATE ON public.academic_documents
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS document_reports_set_updated_at ON public.document_reports;
CREATE TRIGGER document_reports_set_updated_at
  BEFORE UPDATE ON public.document_reports
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS auth_user_create_profile ON auth.users;
CREATE TRIGGER auth_user_create_profile
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.create_profile_for_new_user();

DROP TRIGGER IF EXISTS download_events_increment_count ON public.download_events;
CREATE TRIGGER download_events_increment_count
  AFTER INSERT ON public.download_events
  FOR EACH ROW EXECUTE FUNCTION public.increment_document_download_count();

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.academic_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.app_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.download_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS profiles_select_self_or_admin ON public.profiles;
CREATE POLICY profiles_select_self_or_admin ON public.profiles
  FOR SELECT TO authenticated
  USING (id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS profiles_update_self ON public.profiles;
CREATE POLICY profiles_update_self ON public.profiles
  FOR UPDATE TO authenticated
  USING (id = (SELECT auth.uid()))
  WITH CHECK (id = (SELECT auth.uid()));

DROP POLICY IF EXISTS subjects_read_all ON public.subjects;
CREATE POLICY subjects_read_all ON public.subjects
  FOR SELECT TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS subjects_admin_insert ON public.subjects;
CREATE POLICY subjects_admin_insert ON public.subjects
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS subjects_admin_update ON public.subjects;
CREATE POLICY subjects_admin_update ON public.subjects
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS subjects_admin_delete ON public.subjects;
CREATE POLICY subjects_admin_delete ON public.subjects
  FOR DELETE TO authenticated
  USING ((SELECT public.is_admin()));

DROP POLICY IF EXISTS academic_documents_read_published_or_own ON public.academic_documents;
CREATE POLICY academic_documents_read_published_or_own ON public.academic_documents
  FOR SELECT TO anon, authenticated
  USING (
    validation_status = 'verified'
    OR contributor_id = (SELECT auth.uid())
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS academic_documents_insert_own ON public.academic_documents;
CREATE POLICY academic_documents_insert_own ON public.academic_documents
  FOR INSERT TO authenticated
  WITH CHECK (contributor_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS academic_documents_update_own_pending_or_admin ON public.academic_documents;
CREATE POLICY academic_documents_update_own_pending_or_admin ON public.academic_documents
  FOR UPDATE TO authenticated
  USING (
    (contributor_id = (SELECT auth.uid()) AND validation_status IN ('pending', 'disputed'))
    OR (SELECT public.is_admin())
  )
  WITH CHECK (
    (contributor_id = (SELECT auth.uid()) AND validation_status IN ('pending', 'disputed'))
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS academic_documents_delete_own_pending_or_admin ON public.academic_documents;
CREATE POLICY academic_documents_delete_own_pending_or_admin ON public.academic_documents
  FOR DELETE TO authenticated
  USING (
    (contributor_id = (SELECT auth.uid()) AND validation_status = 'pending')
    OR (SELECT public.is_admin())
  );

DROP POLICY IF EXISTS document_favorites_select_own ON public.document_favorites;
CREATE POLICY document_favorites_select_own ON public.document_favorites
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS document_favorites_insert_own ON public.document_favorites;
CREATE POLICY document_favorites_insert_own ON public.document_favorites
  FOR INSERT TO authenticated
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS document_favorites_delete_own ON public.document_favorites;
CREATE POLICY document_favorites_delete_own ON public.document_favorites
  FOR DELETE TO authenticated
  USING (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS app_notifications_select_own_or_admin ON public.app_notifications;
CREATE POLICY app_notifications_select_own_or_admin ON public.app_notifications
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS app_notifications_update_own ON public.app_notifications;
CREATE POLICY app_notifications_update_own ON public.app_notifications
  FOR UPDATE TO authenticated
  USING (user_id = (SELECT auth.uid()))
  WITH CHECK (user_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS app_notifications_admin_insert ON public.app_notifications;
CREATE POLICY app_notifications_admin_insert ON public.app_notifications
  FOR INSERT TO authenticated
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS document_reports_insert_own ON public.document_reports;
CREATE POLICY document_reports_insert_own ON public.document_reports
  FOR INSERT TO authenticated
  WITH CHECK (reporter_id = (SELECT auth.uid()));

DROP POLICY IF EXISTS document_reports_select_own_or_admin ON public.document_reports;
CREATE POLICY document_reports_select_own_or_admin ON public.document_reports
  FOR SELECT TO authenticated
  USING (reporter_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS document_reports_admin_update ON public.document_reports;
CREATE POLICY document_reports_admin_update ON public.document_reports
  FOR UPDATE TO authenticated
  USING ((SELECT public.is_admin()))
  WITH CHECK ((SELECT public.is_admin()));

DROP POLICY IF EXISTS download_events_select_own_or_admin ON public.download_events;
CREATE POLICY download_events_select_own_or_admin ON public.download_events
  FOR SELECT TO authenticated
  USING (user_id = (SELECT auth.uid()) OR (SELECT public.is_admin()));

DROP POLICY IF EXISTS download_events_insert_own ON public.download_events;
CREATE POLICY download_events_insert_own ON public.download_events
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = (SELECT auth.uid())
    AND EXISTS (
      SELECT 1
      FROM public.academic_documents d
      WHERE d.id = document_id
        AND d.validation_status = 'verified'
        AND d.availability_status = 'available'
    )
  );

GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.subjects TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.subjects TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.academic_documents TO authenticated;
GRANT SELECT ON public.academic_documents TO anon;
GRANT SELECT, INSERT, DELETE ON public.document_favorites TO authenticated;
GRANT SELECT, INSERT ON public.app_notifications TO authenticated;
GRANT UPDATE (read_at) ON public.app_notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.document_reports TO authenticated;
GRANT SELECT, INSERT ON public.download_events TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.create_profile_for_new_user() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.increment_document_download_count() FROM PUBLIC;

INSERT INTO public.subjects (name, description, icon_key)
VALUES
  ('Réseaux', 'Protocoles, architectures, routage et services réseau.', 'network'),
  ('Programmation', 'Algorithmique, structures de données et développement logiciel.', 'code'),
  ('Bases de données', 'Modélisation, SQL, transactions et administration.', 'database'),
  ('Mathématiques', 'Analyse, algèbre, probabilités et statistiques.', 'math')
ON CONFLICT (name) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('academic-documents', 'academic-documents', false, 10485760)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS academic_documents_storage_read ON storage.objects;
CREATE POLICY academic_documents_storage_read ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (
    bucket_id = 'academic-documents'
    AND EXISTS (
      SELECT 1
      FROM public.academic_documents d
      WHERE d.file_path = name
        AND (
          d.validation_status = 'verified'
          OR d.contributor_id = (SELECT auth.uid())
          OR (SELECT public.is_admin())
        )
    )
  );

DROP POLICY IF EXISTS academic_documents_storage_insert_own ON storage.objects;
CREATE POLICY academic_documents_storage_insert_own ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'academic-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS academic_documents_storage_update_own ON storage.objects;
CREATE POLICY academic_documents_storage_update_own ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'academic-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  )
  WITH CHECK (
    bucket_id = 'academic-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );

DROP POLICY IF EXISTS academic_documents_storage_delete_own ON storage.objects;
CREATE POLICY academic_documents_storage_delete_own ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'academic-documents'
    AND (storage.foldername(name))[1] = (SELECT auth.uid())::text
  );
