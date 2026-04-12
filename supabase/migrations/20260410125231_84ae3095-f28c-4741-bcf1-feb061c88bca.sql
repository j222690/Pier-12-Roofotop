
-- ============================================
-- RESERVATIONS TABLE
-- ============================================
CREATE TABLE public.reservations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reservation_name TEXT NOT NULL,
  reservation_date DATE NOT NULL,
  reservation_time TEXT NOT NULL,
  guests JSONB NOT NULL DEFAULT '[]'::jsonb,
  guest_count INTEGER NOT NULL DEFAULT 1,
  total_price NUMERIC(10,2) NOT NULL DEFAULT 0,
  phone TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'confirmed',
  open_wine_opt_in BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.reservations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create reservations"
ON public.reservations FOR INSERT
WITH CHECK (true);

CREATE POLICY "Anyone can view reservations"
ON public.reservations FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update reservations"
ON public.reservations FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete reservations"
ON public.reservations FOR DELETE
TO authenticated
USING (true);

-- ============================================
-- BUSINESS SETTINGS TABLE
-- ============================================
CREATE TABLE public.business_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_key TEXT NOT NULL UNIQUE,
  setting_value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view settings"
ON public.business_settings FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can update settings"
ON public.business_settings FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can insert settings"
ON public.business_settings FOR INSERT
TO authenticated
WITH CHECK (true);

-- Insert default settings
INSERT INTO public.business_settings (setting_key, setting_value) VALUES
  ('business_hours', '{"0":null,"1":null,"2":null,"3":{"open":"18:00","close":"23:00"},"4":{"open":"18:00","close":"23:00"},"5":{"open":"18:00","close":"23:00"},"6":{"open":"18:00","close":"23:00"}}'::jsonb),
  ('prices', '{"male":45,"female":25}'::jsonb),
  ('max_capacity', '70'::jsonb),
  ('capacity_hours', '{"start":"18:00","end":"23:00"}'::jsonb),
  ('open_wine_price', '75'::jsonb),
  ('sparkling_bonus_threshold', '10'::jsonb);

-- ============================================
-- CUSTOM EVENTS TABLE
-- ============================================
CREATE TABLE public.custom_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  event_name TEXT NOT NULL,
  event_label TEXT NOT NULL,
  description TEXT,
  start_time TEXT,
  special_price NUMERIC(10,2),
  has_opt_in BOOLEAN NOT NULL DEFAULT false,
  opt_in_label TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active events"
ON public.custom_events FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage events"
ON public.custom_events FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Authenticated users can update events"
ON public.custom_events FOR UPDATE
TO authenticated
USING (true);

CREATE POLICY "Authenticated users can delete events"
ON public.custom_events FOR DELETE
TO authenticated
USING (true);

-- Insert default events
INSERT INTO public.custom_events (day_of_week, event_name, event_label, description, start_time, has_opt_in) VALUES
  (3, 'OPEN FOOD', '🍽️ Open Food', 'Hoje é dia de Open Food! O prato do dia será escolhido pelo restaurante.', '19:30', false),
  (4, 'OPEN VINHO', '🍷 Open Wine', 'Hoje é dia de Open Wine! O vinho do dia será escolhido pelo restaurante.', '18:00', true);

-- ============================================
-- BUSINESS CLOSURES TABLE
-- ============================================
CREATE TABLE public.business_closures (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  closure_date DATE NOT NULL,
  reason TEXT NOT NULL DEFAULT 'Evento fechado',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.business_closures ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view closures"
ON public.business_closures FOR SELECT
USING (true);

CREATE POLICY "Authenticated users can manage closures"
ON public.business_closures FOR ALL
TO authenticated
USING (true)
WITH CHECK (true);

-- ============================================
-- TIMESTAMP TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_reservations_updated_at
  BEFORE UPDATE ON public.reservations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_business_settings_updated_at
  BEFORE UPDATE ON public.business_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_custom_events_updated_at
  BEFORE UPDATE ON public.custom_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
