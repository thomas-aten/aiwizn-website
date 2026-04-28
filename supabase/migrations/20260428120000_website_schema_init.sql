-- aiwizn.com marketing site — isolated namespace.
-- Does not touch the existing aiwizn schema or its on_auth_user_created trigger.

CREATE SCHEMA IF NOT EXISTS website;
COMMENT ON SCHEMA website IS 'aiwizn.com public marketing site — contact form, leads, site-only data.';

GRANT USAGE ON SCHEMA website TO anon, authenticated, service_role;

-- Contact form submissions from the public site.
CREATE TABLE IF NOT EXISTS website.contact_messages (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at   timestamptz NOT NULL DEFAULT now(),
  name         text,
  email        text NOT NULL CHECK (email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'),
  organization text,
  audience     text CHECK (audience IS NULL OR audience IN ('hospital','school','investor','clinician','other')),
  message      text NOT NULL CHECK (length(message) BETWEEN 1 AND 5000),
  user_id      uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  source       text DEFAULT 'aiwizn.com',
  handled      boolean NOT NULL DEFAULT false,
  handled_at   timestamptz,
  handled_by   uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

COMMENT ON TABLE website.contact_messages IS 'Submissions from the /contact form on aiwizn.com.';

CREATE INDEX IF NOT EXISTS contact_messages_created_at_idx
  ON website.contact_messages (created_at DESC);
CREATE INDEX IF NOT EXISTS contact_messages_handled_idx
  ON website.contact_messages (handled, created_at DESC);

ALTER TABLE website.contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contact_messages_insert_public ON website.contact_messages;
CREATE POLICY contact_messages_insert_public
  ON website.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS contact_messages_select_service_only ON website.contact_messages;
CREATE POLICY contact_messages_select_service_only
  ON website.contact_messages
  FOR SELECT
  TO service_role
  USING (true);

GRANT INSERT ON website.contact_messages TO anon, authenticated;
GRANT SELECT, UPDATE ON website.contact_messages TO service_role;
