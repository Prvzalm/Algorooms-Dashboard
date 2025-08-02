export function toHHmm(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const ampm = value.trim().toUpperCase();
    if (ampm.endsWith("AM") || ampm.endsWith("PM")) {
      const [time, meridian] = ampm.split(" ");
      let [h, m] = time.split(":").map((t) => parseInt(t, 10));
      if (meridian === "PM" && h < 12) h += 12;
      if (meridian === "AM" && h === 12) h = 0;
      return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
    }
    return value;
  }
  if (value instanceof Date) {
    const h = value.getHours();
    const m = value.getMinutes();
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
  }
  return "";
}
