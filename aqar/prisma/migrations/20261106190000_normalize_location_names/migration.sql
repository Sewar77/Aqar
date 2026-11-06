
-- Normalize Arabic location names consistently.
-- Examples:
-- إيدون = ايدون
-- الرَّمثا = الرمثا
-- كفر  أسد = كفر أسد

CREATE OR REPLACE FUNCTION public.aqar_normalize_location_name(
  input_name text
)
RETURNS text
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT btrim(
    translate(
      regexp_replace(
        regexp_replace(
          lower(btrim(input_name)),
          '[ًٌٍَُِّْٰـ]',
          '',
          'g'
        ),
        '[[:space:]]+',
        ' ',
        'g'
      ),
      'أإآٱىؤئ',
      'اااايوي'
    )
  );
$$;

-- Safety check: NEVER merge or delete real locations.
-- If normalized duplicates already exist, stop migration.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.locations
    GROUP BY public.aqar_normalize_location_name(name_ar)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Existing normalized duplicate locations. Review manually before migration.';
  END IF;
END;
$$;

-- Protect against concurrent requests creating duplicates.
CREATE UNIQUE INDEX locations_name_ar_normalized_key
ON public.locations (
  public.aqar_normalize_location_name(name_ar)
);
