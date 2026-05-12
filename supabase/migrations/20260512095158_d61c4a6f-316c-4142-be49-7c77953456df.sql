
CREATE TABLE public.contact_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  device TEXT NOT NULL,
  issues TEXT[] NOT NULL DEFAULT '{}',
  urgency TEXT NOT NULL DEFAULT 'standard',
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  address TEXT,
  description TEXT,
  courier BOOLEAN NOT NULL DEFAULT false,
  replacement BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'new',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a booking request (public form)
CREATE POLICY "Anyone can insert submissions"
  ON public.contact_submissions
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 1 AND 100
    AND length(email) BETWEEN 3 AND 255
    AND length(phone) BETWEEN 3 AND 50
    AND length(coalesce(description, '')) <= 2000
  );

-- No SELECT policy: submissions are private, visible only via service role (backend dashboard)
