ALTER TABLE public.reservations 
  ADD COLUMN IF NOT EXISTS checked_in BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP WITH TIME ZONE;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can insert settings' AND tablename = 'business_settings') THEN
    CREATE POLICY "Anyone can insert settings" ON public.business_settings FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update settings' AND tablename = 'business_settings') THEN
    CREATE POLICY "Anyone can update settings" ON public.business_settings FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can manage events' AND tablename = 'custom_events') THEN
    CREATE POLICY "Anyone can manage events" ON public.custom_events FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update events' AND tablename = 'custom_events') THEN
    CREATE POLICY "Anyone can update events" ON public.custom_events FOR UPDATE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete events' AND tablename = 'custom_events') THEN
    CREATE POLICY "Anyone can delete events" ON public.custom_events FOR DELETE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can manage closures' AND tablename = 'business_closures') THEN
    CREATE POLICY "Anyone can manage closures" ON public.business_closures FOR INSERT WITH CHECK (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can delete closures' AND tablename = 'business_closures') THEN
    CREATE POLICY "Anyone can delete closures" ON public.business_closures FOR DELETE USING (true);
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Anyone can update reservations' AND tablename = 'reservations') THEN
    CREATE POLICY "Anyone can update reservations" ON public.reservations FOR UPDATE USING (true);
  END IF;
END $$;