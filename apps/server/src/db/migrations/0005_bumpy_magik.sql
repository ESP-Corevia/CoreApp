

CREATE OR REPLACE FUNCTION fill_user_name()
RETURNS trigger AS $$
BEGIN
  IF (NEW.name IS NULL OR trim(NEW.name) = '') THEN
    NEW.name :=
      coalesce(NEW.first_name, '') ||
      CASE
        WHEN coalesce(NEW.first_name,'') <> '' AND coalesce(NEW.last_name,'') <> '' THEN ' '
        ELSE ''
      END ||
      coalesce(NEW.last_name, '');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_fill_user_name ON "users";
CREATE TRIGGER trg_fill_user_name
  BEFORE INSERT OR UPDATE OF first_name, last_name, name
  ON "users"
  FOR EACH ROW
  EXECUTE FUNCTION fill_user_name();
