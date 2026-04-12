// Default fallback values (overridden by business_settings from DB)
export const DEFAULT_BUSINESS_HOURS: Record<number, { open: string; close: string } | null> = {
  0: null, 1: null, 2: null,
  3: { open: "18:00", close: "23:00" },
  4: { open: "18:00", close: "23:00" },
  5: { open: "18:00", close: "23:00" },
  6: { open: "18:00", close: "23:00" },
};

// Kept for backward compat — prefer useBusinessSettings hook
export const BUSINESS_HOURS = DEFAULT_BUSINESS_HOURS;
export const MAX_CAPACITY = 70;
export const CAPACITY_START = "18:00";
export const CAPACITY_END = "23:00";
export const PRICES = { male: 45, female: 25 } as const;
export const OPEN_WINE_PRICE = 75;

export type GuestGender = "male" | "female";
export type GuestAgeCategory = "adult" | "child_free" | "child_half";

export interface Guest {
  id: number;
  gender: GuestGender;
  ageCategory: GuestAgeCategory;
  isBirthday?: boolean;
}

export interface SpecialEvent {
  name: string;
  label: string;
  description: string;
  hasOpenWineOption?: boolean;
  startTime?: string;
}

export function getGuestPrice(
  guest: Guest,
  isOpenWine: boolean,
  openWineOptIn: boolean,
  prices: { male: number; female: number } = PRICES,
  openWinePrice = OPEN_WINE_PRICE
): number {
  if (guest.isBirthday) return 0;
  if (guest.ageCategory === "child_free") return 0;
  const basePrice = isOpenWine && openWineOptIn ? openWinePrice : prices[guest.gender];
  if (guest.ageCategory === "child_half") return basePrice / 2;
  return basePrice;
}

export function getAvailableTimeSlots(
  dayOfWeek: number,
  businessHours: Record<number, { open: string; close: string } | null> = DEFAULT_BUSINESS_HOURS
): string[] {
  const hours = businessHours[dayOfWeek];
  if (!hours) return [];
  const slots: string[] = [];
  const [openH, openM] = hours.open.split(":").map(Number);
  const closeHour = parseInt(hours.close.split(":")[0]);
  let h = openH, m = openM;
  while (h < closeHour || (h === closeHour && m === 0)) {
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    m += 30;
    if (m >= 60) { m = 0; h++; }
  }
  return slots;
}

export function isDateAvailable(
  date: Date,
  businessHours: Record<number, { open: string; close: string } | null> = DEFAULT_BUSINESS_HOURS
): boolean {
  return businessHours[date.getDay()] !== null;
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export function getDayName(dayOfWeek: number): string {
  return ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"][dayOfWeek];
}
