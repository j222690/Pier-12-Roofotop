import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface BusinessSettings {
  prices: { male: number; female: number };
  /** Preços de entrada por dia da semana (0=Dom..6=Sab). Se null, usa prices global */
  dailyPrices: Record<number, { male: number; female: number } | null>;
  maxCapacity: number;
  openWinePrice: number;
  sparklingBonusThreshold: number;
  businessHours: Record<number, { open: string; close: string } | null>;
}

const DEFAULTS: BusinessSettings = {
  prices: { male: 45, female: 25 },
  dailyPrices: { 0: null, 1: null, 2: null, 3: null, 4: null, 5: null, 6: null },
  maxCapacity: 70,
  openWinePrice: 75,
  sparklingBonusThreshold: 10,
  businessHours: {
    0: null, 1: null, 2: null,
    3: { open: "18:00", close: "23:00" },
    4: { open: "18:00", close: "23:00" },
    5: { open: "18:00", close: "23:00" },
    6: { open: "18:00", close: "23:00" },
  },
};

async function fetchFromDB(): Promise<BusinessSettings> {
  try {
    const { data, error } = await supabase
      .from("business_settings")
      .select("setting_key, setting_value");
    if (error || !data || data.length === 0) return DEFAULTS;
    const map: Record<string, unknown> = {};
    data.forEach((row) => { map[row.setting_key] = row.setting_value; });
    return {
      prices: (map.prices as BusinessSettings["prices"]) ?? DEFAULTS.prices,
      dailyPrices: (map.daily_prices as BusinessSettings["dailyPrices"]) ?? DEFAULTS.dailyPrices,
      maxCapacity: (map.max_capacity as number) ?? DEFAULTS.maxCapacity,
      openWinePrice: (map.open_wine_price as number) ?? DEFAULTS.openWinePrice,
      sparklingBonusThreshold: (map.sparkling_bonus_threshold as number) ?? DEFAULTS.sparklingBonusThreshold,
      businessHours: (map.business_hours as BusinessSettings["businessHours"]) ?? DEFAULTS.businessHours,
    };
  } catch {
    return DEFAULTS;
  }
}

export function useBusinessSettings() {
  const [settings, setSettings] = useState<BusinessSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFromDB().then((s) => { setSettings(s); setLoading(false); });
  }, []);

  const update = async (key: string, value: unknown): Promise<boolean> => {
    const { error } = await supabase
      .from("business_settings")
      .upsert({ setting_key: key, setting_value: value as never }, { onConflict: "setting_key" });

    if (error) {
      console.error(`[useBusinessSettings] Erro ao salvar "${key}":`, error.message);
      toast.error(`Erro ao salvar: ${error.message}`);
      return false;
    }

    // Atualiza estado local imediatamente
    const keyMap: Record<string, keyof BusinessSettings> = {
      prices: "prices",
      daily_prices: "dailyPrices",
      max_capacity: "maxCapacity",
      open_wine_price: "openWinePrice",
      sparkling_bonus_threshold: "sparklingBonusThreshold",
      business_hours: "businessHours",
    };
    const stateKey = keyMap[key];
    if (stateKey) {
      setSettings((prev) => ({ ...prev, [stateKey]: value }));
    }

    return true;
  };

  const refetch = async () => {
    setLoading(true);
    const fresh = await fetchFromDB();
    setSettings(fresh);
    setLoading(false);
  };

  return { settings, loading, refetch, update };
}
