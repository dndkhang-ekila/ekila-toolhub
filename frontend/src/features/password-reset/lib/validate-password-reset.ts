export function isValidEmail(value: string): boolean {
  return value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isUsableResetToken(value: string): boolean {
  return value.length > 0 && value.length <= 2048 && !/\s/.test(value);
}
