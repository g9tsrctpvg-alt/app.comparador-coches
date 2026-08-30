export function formatEur(value: number): string {
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatNumber(value: number, decimals = 1): string {
  return new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(value);
}

export function formatSigned(value: number, decimals = 1): string {
  const formatted = formatNumber(Math.abs(value), decimals);
  if (value > 0) return `+${formatted}`;
  if (value < 0) return `−${formatted}`;
  return formatted;
}

/** `AAAA-MM-DD` a `DD/MM/AAAA` (product/0030, requisito 5.2). La fecha ya
 * llega validada por `restoreDecisionLog` o recién puesta por `useDecisions`
 * — sin `Intl.DateTimeFormat`, que exige parsear a `Date` y reintroducir la
 * zona horaria para un formato que aquí es una simple recolocación de tres
 * campos ya separados por guiones. */
export function formatDate(iso: string): string {
  const [year, month, day] = iso.split('-');
  return `${day}/${month}/${year}`;
}
