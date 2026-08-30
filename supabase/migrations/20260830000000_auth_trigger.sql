CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (
    new.id,
    COALESCE(
      NULLIF(new.raw_user_meta_data->>'full_name', ''),
      NULLIF(new.raw_user_meta_data->>'name', ''),
      split_part(COALESCE(new.email, ''), '@', 1),
      ''
    )
  )
  ON CONFLICT (id) DO UPDATE
    SET display_name = CASE
      WHEN public.profiles.display_name = '' THEN EXCLUDED.display_name
      ELSE public.profiles.display_name
    END,
    updated_at = NOW();
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
