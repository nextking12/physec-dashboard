export function toTitle(value) {
  return value
    .toLowerCase()
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export function formatTimestamp(value) {
  if (!value) return "Unknown time";
  return new Date(value).toLocaleString();
}
