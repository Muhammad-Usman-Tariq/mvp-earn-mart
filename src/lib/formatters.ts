/**
 * Formats a currency amount in Pakistani Rupees (PKR).
 * 
 * @param amount - The numeric amount to format.
 * @param isPaisa - If true (default), amount is in paisa (1 PKR = 100 paisa).
 * @returns Formatted currency string, e.g. "PKR 3,499"
 */
export function formatPKR(amount: number | null | undefined, isPaisa: boolean = true): string {
  if (amount == null || isNaN(amount)) return 'PKR 0';
  const rupees = isPaisa ? Math.round(amount) / 100 : amount;
  return `PKR ${rupees.toLocaleString('en-PK', { maximumFractionDigits: 2 })}`;
}

/**
 * Formats a raw number into localized PKR format without prefix.
 */
export function formatNumberPK(amount: number | null | undefined, isPaisa: boolean = true): string {
  if (amount == null || isNaN(amount)) return '0';
  const rupees = isPaisa ? Math.round(amount) / 100 : amount;
  return rupees.toLocaleString('en-PK', { maximumFractionDigits: 2 });
}
