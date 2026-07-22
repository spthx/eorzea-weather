const CONFIG = Object.freeze({
  kumagayaStationId: "43056",
  latestTimeUrl: "https://www.jma.go.jp/bosai/amedas/data/latest_time.txt",
  stationTableUrl: "https://www.jma.go.jp/bosai/amedas/const/amedastable.json",
  mapDataBaseUrl: "https://www.jma.go.jp/bosai/amedas/data/map",
  rankingLimit: 10,
  cacheKey: "eorzea-weather:last-good-snapshot:v1",
  locationStationKey: "eorzea-weather:nearest-station:v1",
  locationDecisionKey: "eorzea-weather:location-decision:v1",
  geolocation: {
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 300000
  }
});