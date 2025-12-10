-- CMS Page Theme Overrides Migration
-- Adds theme override support to pages table
-- Allows per-page theme configuration, widget variants, and color customization

-- Create the update_updated_at_timestamp helper function if it doesn't exist
CREATE OR REPLACE FUNCTION public.update_updated_at_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at and updated_by columns to pages table if they don't exist
ALTER TABLE public.pages
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW(),
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add theme_overrides column to pages table if it doesn't exist
DO $add_theme_overrides$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'pages'
      AND column_name = 'theme_overrides'
  ) THEN
    ALTER TABLE public.pages
    ADD COLUMN theme_overrides JSONB DEFAULT '{}'::jsonb;
    
    CREATE INDEX idx_pages_theme_overrides ON public.pages USING GIN (theme_overrides);
    
    COMMENT ON COLUMN public.pages.theme_overrides IS 'Theme overrides for the page including mode, variant, widget variants, and color customization';
  END IF;
END
$add_theme_overrides$;

-- Set default for updated_at on update
DROP TRIGGER IF EXISTS pages_updated_at ON public.pages;
CREATE TRIGGER pages_updated_at
  BEFORE UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_timestamp();

-- Create helper function to validate theme overrides JSON structure
CREATE OR REPLACE FUNCTION public.validate_theme_overrides(overrides JSONB)
RETURNS BOOLEAN AS $$
BEGIN
  -- Validate that overrides is a valid object with expected keys
  IF overrides IS NULL OR overrides = '{}'::jsonb THEN
    RETURN TRUE;
  END IF;
  
  -- Check that themeMode is 'light' or 'dark' if present
  IF overrides->'themeMode' IS NOT NULL THEN
    IF NOT (overrides->>'themeMode' IN ('light', 'dark')) THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Check that themeVariant is a valid string if present
  IF overrides->'themeVariant' IS NOT NULL THEN
    IF NOT (overrides->>'themeVariant' ~ '^[a-z0-9_-]+$') THEN
      RETURN FALSE;
    END IF;
  END IF;
  
  -- Additional validations can be added here
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add constraint to validate theme_overrides
ALTER TABLE public.pages
  DROP CONSTRAINT IF EXISTS pages_theme_overrides_valid;

ALTER TABLE public.pages
  ADD CONSTRAINT pages_theme_overrides_valid
  CHECK (public.validate_theme_overrides(theme_overrides));

-- Create audit log for theme override changes
CREATE TABLE IF NOT EXISTS public.page_theme_override_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id UUID REFERENCES public.pages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  old_overrides JSONB,
  new_overrides JSONB,
  change_description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_page_theme_override_audit_page_id ON public.page_theme_override_audit(page_id);
CREATE INDEX IF NOT EXISTS idx_page_theme_override_audit_user_id ON public.page_theme_override_audit(user_id);
CREATE INDEX IF NOT EXISTS idx_page_theme_override_audit_created_at ON public.page_theme_override_audit(created_at);

COMMENT ON TABLE public.page_theme_override_audit IS 'Audit log for page theme override changes';

-- Create trigger to log theme override changes
CREATE OR REPLACE FUNCTION public.audit_theme_override_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF (NEW.theme_overrides IS DISTINCT FROM OLD.theme_overrides) THEN
    INSERT INTO public.page_theme_override_audit (
      page_id,
      user_id,
      old_overrides,
      new_overrides,
      change_description
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.theme_overrides,
      NEW.theme_overrides,
      'Theme overrides updated'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS page_theme_override_audit_trigger ON public.pages;

CREATE TRIGGER page_theme_override_audit_trigger
  AFTER UPDATE ON public.pages
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_theme_override_changes();

-- Grant permissions on audit table
GRANT SELECT, INSERT ON public.page_theme_override_audit TO authenticated;

-- Enable RLS on audit table
ALTER TABLE public.page_theme_override_audit ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for audit table (admin-only access)
CREATE POLICY "admin_can_view_theme_override_audit"
  ON public.page_theme_override_audit
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "service_role_access_theme_override_audit"
  ON public.page_theme_override_audit
  FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
