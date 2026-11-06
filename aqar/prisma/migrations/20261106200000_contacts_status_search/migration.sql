
BEGIN;

ALTER TABLE public.contacts
ADD COLUMN IF NOT EXISTS is_active BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS contacts_is_active_idx
ON public.contacts (is_active);

-- Arabic search normalization.
CREATE OR REPLACE FUNCTION public.aqar_normalize_contact_name(
  input_name TEXT
)
RETURNS TEXT
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

-- Convert Arabic/Persian digits to English digits,
-- then remove formatting characters.
CREATE OR REPLACE FUNCTION public.aqar_normalize_phone(
  input_phone TEXT
)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
STRICT
PARALLEL SAFE
AS $$
  SELECT regexp_replace(
    translate(
      input_phone,
      '٠١٢٣٤٥٦٧٨٩۰۱۲۳۴۵۶۷۸۹',
      '01234567890123456789'
    ),
    '[^0-9+]',
    '',
    'g'
  );
$$;

-- Stop safely if existing phone numbers collide
-- after normalization. Never merge real contacts.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM public.contacts
    GROUP BY public.aqar_normalize_phone(phone)
    HAVING COUNT(*) > 1
  ) THEN
    RAISE EXCEPTION
      'Duplicate contact phone numbers after normalization. Review existing data.';
  END IF;
END;
$$;

CREATE UNIQUE INDEX contacts_phone_normalized_key
ON public.contacts (
  public.aqar_normalize_phone(phone)
);

COMMIT;
