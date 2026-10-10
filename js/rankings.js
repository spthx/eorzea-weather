function enrichStations(stations) {
  return stations.map(station => ({ ...station, scene: describeWeather(station) }));
}
function createRankings(stations) {
  const temperature = stations.filter(s => Number.isFinite(s.temperature)).sort((a, b) => b.temperature - a.temperature || a.id.localeCompare(b.id));
  return {
    temperature,
    cold: [...temperature].sort((a, b) => a.temperature - b.temperature || a.id.localeCompare(b.id)),
    rain: stations.filter(s => Number.isFinite(s.precipitation1h)).sort((a, b) => b.precipitation1h - a.precipitation1h || a.id.localeCompare(b.id)),
    wind: stations.filter(s => Number.isFinite(s.windSpeed)).sort((a, b) => b.windSpeed - a.windSpeed || a.id.localeCompare(b.id))
  };
}
