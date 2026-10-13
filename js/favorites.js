const FAVORITES_KEY = "eorzea-weather:favorites:v1";
function readFavorites() {
  try {
    const ids = JSON.parse(localStorage.getItem(FAVORITES_KEY));
    return Array.isArray(ids) ? [...new Set(ids.filter(id => typeof id === "string" && /^\d{5}$/.test(id)))].slice(0, 4) : [];
  } catch (_) { return []; }
}
function writeFavorites(ids) {
  try { localStorage.setItem(FAVORITES_KEY, JSON.stringify(ids)); return true; }
  catch (_) { return false; }
}
function renderFavorites() {
  const ids = readFavorites();
  const container = document.getElementById("favorite-list");
  const add = document.getElementById("favorite-add");
  add.disabled = !appState.current || ids.includes(appState.current.id) || ids.length >= 4;
  add.textContent = appState.current && ids.includes(appState.current.id) ? "この地点は保存済み" : ids.length >= 4 ? "4地点を保存中" : "表示中の地点を保存";
  if (!ids.length) { container.innerHTML = '<p class="section-note">自宅や旅先を保存すると、最新の観測値を並べて表示します。</p>'; return; }
  container.innerHTML = ids.map((id, index) => {
    const station = appState.stations.find(s => s.id === id);
    const label = station ? stationLabel(station) : "観測地点 " + id;
    const hasTemperature = Number.isFinite(station?.temperature);
    return '<article class="favorite-card"><img class="favorite-job" src="assets/fankit/' + FANKIT_JOBS[index] + '" alt=""><div><h3>' + safeText(label) + '</h3><p>' + (hasTemperature ? station.temperature.toFixed(1) + '℃ ／ ' + safeText(station.scene.title) : '現在の気温は観測なし') + '</p><small>湿度 ' + formatInteger(station?.humidity, '％') + ' ／ 風速 ' + formatValue(station?.windSpeed, 'm/s') + '</small></div><div class="favorite-actions"><button type="button" data-open-station="' + id + '"' + (hasTemperature ? '' : ' disabled') + '>ここを見る</button><button type="button" data-remove-favorite="' + id + '" aria-label="' + safeText(label) + 'を保存地点から外す">外す</button></div></article>';
  }).join("");
}
document.getElementById("favorite-add").addEventListener("click", () => {
  const ids = readFavorites();
  if (!appState.current || ids.includes(appState.current.id) || ids.length >= 4) return;
  ids.push(appState.current.id);
  document.getElementById("favorite-status").textContent = writeFavorites(ids) ? stationLabel(appState.current) + "を保存しました。" : "このブラウザでは保存できませんでした。";
  renderFavorites();
});
document.getElementById("favorite-list").addEventListener("click", event => {
  const remove = event.target.closest("[data-remove-favorite]");
  if (remove) {
    document.getElementById("favorite-status").textContent = writeFavorites(readFavorites().filter(id => id !== remove.dataset.removeFavorite)) ? "保存地点から外しました。" : "保存地点を変更できませんでした。";
    renderFavorites();
    return;
  }
  const open = event.target.closest("[data-open-station]");
  if (open) {
    selectWeatherStation(open.dataset.openStation);
    document.getElementById("weather").scrollIntoView({ behavior: document.documentElement.dataset.motion === "still" ? "auto" : "smooth" });
  }
});
