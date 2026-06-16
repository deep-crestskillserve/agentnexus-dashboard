-- ============================================================
-- Sync auth.users to public.users on new user sign up
-- ============================================================

-- Function to insert a new user into public.users when a new auth user is created
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert into public.users, using the auth user's id as the primary key
  INSERT INTO public.users (
    id,
    name,
    role,
    display_name,
    email,
    phone,
    providers,
    created_at,
    updated_at
  ) VALUES (
    NEW.id,
    COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NEW.email
    ),
    NEW.role,
    COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email),
    NEW.email,
    NEW.phone,
    -- Extract providers from raw_app_meta_data if available, else empty string
    COALESCE((NEW.raw_app_meta_data->>'providers')::text, ''),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- in case the user already exists (e.g., migrated)
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

-- Trigger on auth.users for insert
CREATE TRIGGER sync_auth_user_to_public_trigger
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.sync_auth_user_to_public();

-- Also, we might want to update on changes to email, etc. But for simplicity, we can do update trigger as well.
-- Let's create an update trigger to keep email and name in sync.
CREATE OR REPLACE FUNCTION public.sync_auth_user_to_public_update()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.users
  SET
    name = COALESCE(
      NULLIF(NEW.raw_user_meta_data->>'full_name', ''),
      NULLIF(NEW.raw_user_meta_data->>'name', ''),
      NEW.email
    ),
    role = NEW.role,
    display_name = COALESCE(NULLIF(NEW.raw_user_meta_data->>'preferred_username', ''), NULLIF(NEW.raw_user_meta_data->>'name', ''), NEW.email),
    email = NEW.email,
    phone = NEW.phone,
    providers = COALESCE((NEW.raw_app_meta_data->>'providers')::text, ''),
    updated_at = NOW()
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$
LANGUAGE plpgsql
SECURITY DEFINER;

CREATE TRIGGER sync_auth_user_to_public_update_trigger
AFTER UPDATE ON auth.users
FOR EACH ROW
WHEN (OLD.email IS DISTINCT FROM NEW.email OR OLD.raw_user_meta_data IS DISTINCT FROM NEW.raw_user_meta_data OR OLD.role IS DISTINCT FROM NEW.role OR OLD.phone IS DISTINCT FROM NEW.phone OR OLD.raw_app_meta_data IS DISTINCT FROM NEW.raw_app_meta_data)
EXECUTE FUNCTION public.sync_auth_user_to_public_update();