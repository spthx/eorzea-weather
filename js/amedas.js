async function fetchWithTimeout(url, options = {}, timeoutMs = 12000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response;
  } finally {
    clearTimeout(timer);
  }
}

async function fetchAmedasSnapshot() {
  try {
    const latestResponse = await fetchWithTimeout(CONFIG.latestTimeUrl, { cache: "no-store" });
    const latestTime = (await latestResponse.text()).trim();
    const stamp = toJmaStamp(latestTime);
    const [mapResponse, stationResponse] = await Promise.all([
      fetchWithTimeout(`${CONFIG.mapDataBaseUrl}/${stamp}.json`, { cache: "no-store" }),
      fetchWithTimeout(CONFIG.stationTableUrl, { cache: "force-cache" })
    ]);
    const snapshot = {
      latestTime,
      readings: await mapResponse.json(),
      stations: await stationResponse.json(),
      cachedAt: new Date().toISOString(),
      isCached: false
    };
    try { localStorage.setItem(CONFIG.cacheKey, JSON.stringify(snapshot)); } catch (_) {}
    return snapshot;
  } catch (error) {
    try {
      const cached = JSON.parse(localStorage.getItem(CONFIG.cacheKey));
      if (cached?.latestTime && cached?.readings && cached?.stations) return { ...cached, isCached: true };
    } catch (_) {}
    throw new Error("最新のアメダス観測値を取得できませんでした。", { cause: error });
  }
}

function normalizeStations(snapshot) {
  return Object.entries(snapshot.readings).map(([id, reading]) => {
    const station = snapshot.stations[id];
    if (!station) return null;
    const meta = AMEDAS_LOCATION_METADATA[id] || {};
    return {
      id,
      stationName: station.kjName || meta.point || id,
      prefecture: meta.prefecture || "",
      municipality: meta.location || "",
      point: meta.point || station.kjName || id,
      coordinates: stationCoordinates(station),
      temperature: readAmedasValue(reading, "temp"),
      humidity: readAmedasValue(reading, "humidity"),
      windSpeed: readAmedasValue(reading, "wind"),
      windDirection: readAmedasValue(reading, "windDirection"),
      precipitation10m: readAmedasValue(reading, "precipitation10m"),
      precipitation1h: readAmedasValue(reading, "precipitation1h"),
      snowDepth: readAmedasValue(reading, "snow"),
      observationTime: snapshot.latestTime,
      distanceKm: null
    };
  }).filter(Boolean);
}
