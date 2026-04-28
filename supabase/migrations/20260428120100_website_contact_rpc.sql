-- Public RPC the marketing site calls with the anon key.
-- SECURITY DEFINER lets it write to website.contact_messages even though the
-- anon role can't see the schema. The function itself validates input.

CREATE OR REPLACE FUNCTION public.submit_contact_message(
  p_name         text,
  p_email        text,
  p_organization text,
  p_audience     text,
  p_message      text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, website, pg_temp
AS $$
DECLARE
  v_id uuid;
  v_user uuid := auth.uid();
BEGIN
  IF p_email IS NULL OR p_message IS NULL THEN
    RAISE EXCEPTION 'email and message are required';
  END IF;

  IF length(p_message) > 5000 THEN
    RAISE EXCEPTION 'message too long';
  END IF;

  INSERT INTO website.contact_messages (name, email, organization, audience, message, user_id)
  VALUES (
    nullif(trim(p_name), ''),
    lower(trim(p_email)),
    nullif(trim(p_organization), ''),
    nullif(trim(p_audience), ''),
    trim(p_message),
    v_user
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.submit_contact_message(text, text, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.submit_contact_message(text, text, text, text, text) TO anon, authenticated;

COMMENT ON FUNCTION public.submit_contact_message IS 'Public RPC for the aiwizn.com /contact form — writes into website.contact_messages.';
