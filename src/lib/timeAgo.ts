/**
 * Formats an ISO timestamp as a short relative-time string, e.g. "3m ago".
 * Used anywhere we show "last active" / "last seen" for live (DB-backed) data.
 */
export function timeAgo(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const sec = Math.floor(diffMs / 1000);

  if (sec < 5) return "just now";
  if (sec < 60) return `${sec}s ago`;

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;

  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;

  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;

  const mon = Math.floor(day / 30);
  if (mon < 12) return `${mon}mo ago`;

  const yr = Math.floor(mon / 12);
  return `${yr}y ago`;
}