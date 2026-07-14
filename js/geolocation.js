function requestCurrentPosition() {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) return reject(new Error("この端末では位置情報を利用できません。"));
    navigator.geolocation.getCurrentPosition(resolve, reject, CONFIG.geolocation);
  });
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
