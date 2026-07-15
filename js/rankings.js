function enrichStations(stations) {
  return stations.map(station => {
    const analysis = Number.isFinite(station.temperature) ? analyzeClimate(station) : null;
    const humidScore = Number.isFinite(station.temperature) && Number.isFinite(station.humidity)
      ? Math.round((station.temperature + Math.max(0, station.humidity - 50) * .08) * 10) / 10
      : null;
    return { ...station, analysis, humidScore };
  });
}

function createRankings(stations) {
  return {
    temperature: stations.filter(item => Number.isFinite(item.temperature)).sort((a, b) => b.temperature - a.temperature),
    humid: stations.filter(item => Number.isFinite(item.humidScore)).sort((a, b) => b.humidScore - a.humidScore),
    threat: stations.filter(item => item.analysis).sort((a, b) => b.analysis.threat - a.analysis.threat || b.temperature - a.temperature)
  };
}

function rankOf(ranking, stationId) {
  const index = ranking.findIndex(item => item.id === stationId);
  return index >= 0 ? index + 1 : null;
}

function featuredRanking(ranking, targetId) {
  const top = ranking.slice(0, CONFIG.rankingLimit);
  for (const id of [targetId, CONFIG.kumagayaStationId]) {
    const item = ranking.find(entry => entry.id === id);
    if (item && !top.some(entry => entry.id === id)) top.push(item);
  }
  return top;
}
