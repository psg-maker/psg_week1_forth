export const RECORD_TIMEZONE = "Asia/Seoul" as const;

export function kstDate(isoString: string): string {
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    throw new TypeError("fetched_at must be a valid ISO-8601 date-time");
  }

  const parts = new Intl.DateTimeFormat("en", {
    timeZone: RECORD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const byType = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${byType.year}-${byType.month}-${byType.day}`;
}

export function formatKst(isoString: string | null): string {
  if (!isoString) return "없음";
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return "잘못된 시각";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: RECORD_TIMEZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
