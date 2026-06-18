export function normalizeNigerianPhone(value: FormDataEntryValue | string | null | undefined) {
  const digits = String(value ?? "").replace(/\D/g, "");
  if (!digits) return null;

  if (/^0[789]\d{9}$/.test(digits)) return `234${digits.slice(1)}`;
  if (/^[789]\d{9}$/.test(digits)) return `234${digits}`;
  if (/^234[789]\d{9}$/.test(digits)) return digits;

  return null;
}

export function nigerianPhoneVariants(normalizedPhone: string) {
  const normalized = normalizeNigerianPhone(normalizedPhone);
  if (!normalized) return [];

  const national = `0${normalized.slice(3)}`;
  return [normalized, `+${normalized}`, national];
}
