function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("この端末では位置情報を利用できません。"));
    navigator.geolocation.getCurrentPosition(resolve, reject, CONFIG.geolocation);
  });
}

function rememberLocationStation(station) {
  if (!station?.id) return;
  try {
    localStorage.setItem(CONFIG.locationStationKey, JSON.stringify({ stationId: station.id, savedAt: Date.now() }));
    localStorage.setItem(CONFIG.locationDecisionKey, "granted");
  } catch (_) {}
}

function readRememberedStationId() {
  try {
    const saved = JSON.parse(localStorage.getItem(CONFIG.locationStationKey));
    return typeof saved?.stationId === "string" ? saved.stationId : null;
  } catch (_) {
    return null;
  }
}

function clearRememberedLocationStation() {
  try { localStorage.removeItem(CONFIG.locationStationKey); } catch (_) {}
}

function rememberLocationDenied() {
  try { localStorage.setItem(CONFIG.locationDecisionKey, "denied"); } catch (_) {}
}

function automaticLocationDisabled() {
  try { return localStorage.getItem(CONFIG.locationDecisionKey) === "denied"; } catch (_) { return false; }
}

function nearestStation(position, stations) {
  const here = { lat: position.coords.latitude, lon: position.coords.longitude };
  const candidates = stations
    .filter(item => Number.isFinite(item.temperature) && item.coordinates)
    .map(item => ({ ...item, distanceKm: distanceKm(here, item.coordinates) }));
  const withHumidity = candidates.filter(item => Number.isFinite(item.humidity)).sort((a, b) => a.distanceKm - b.distanceKm);
  const withTemperature = candidates.sort((a, b) => a.distanceKm - b.distanceKm);
  return withHumidity[0] || withTemperature[0] || null;
}