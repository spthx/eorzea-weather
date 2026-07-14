function toJmaStamp(latestTime) {
  const match = String(latestTime).trim().match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})/);
  if (!match) throw new Error("観測時刻の形式を確認できませんでした。");
  return match.slice(1).join("");
}

function formatObservationTime(latestTime) {
  const match = String(latestTime).trim().match(/(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/);
  return match ? `${match[1]}/${match[2]}/${match[3]} ${match[4]}:${match[5]}` : "時刻不明";
}

function readAmedasValue(reading, key) {
  const field = reading?.[key];
  if (!Array.isArray(field) || !Number.isFinite(field[0])) return null;
  const quality = field[1];
  if (Number.isFinite(quality) && quality >= 8) return null;
  return Number(field[0]);
}

function stationCoordinates(station) {
  if (!Array.isArray(station?.lat) || !Array.isArray(station?.lon)) return null;
  const lat = Number(station.lat[0]) + Number(station.lat[1]) / 60;
  const lon = Number(station.lon[0]) + Number(station.lon[1]) / 60;
  return Number.isFinite(lat) && Number.isFinite(lon) ? { lat, lon } : null;
}

function distanceKm(a, b) {
  if (!a || !b) return Infinity;
  const rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad;
  const dLon = (b.lon - a.lon) * rad;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatValue(value, unit, digits = 1) {
  return Number.isFinite(value) ? `${value.toFixed(digits)}${unit}` : "観測なし";
}

function formatInteger(value, unit) {
  return Number.isFinite(value) ? `${Math.round(value)}${unit}` : "観測なし";
}

function windDirectionLabel(value) {
  if (!Number.isFinite(value)) return "観測なし";
  const labels = ["北", "北北東", "北東", "東北東", "東", "東南東", "南東", "南南東", "南", "南南西", "南西", "西南西", "西", "西北西", "北西", "北北西"];
  return labels[Math.round(value / 2) % 16] || "静穏";
}

function safeText(value) {
  return String(value ?? "").replace(/[&<>'"]/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[char]));
}

function deterministicIndex(seed, length) {
  let hash = 0;
  for (const char of String(seed)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return Math.abs(hash) % length;
}
