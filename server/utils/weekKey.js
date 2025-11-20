// server/utils/weekKey.js

export function currentWeekKey() {
  const now = new Date();
  const d = new Date(now);
  const day = d.getDay();
  d.setDate(d.getDate() - day);
  d.setHours(20, 0, 0, 0);

  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
    2,
    "0"
  )}-${String(d.getDate()).padStart(2, "0")}-20:00`;
}
