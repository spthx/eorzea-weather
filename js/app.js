const appState = { snapshot: null, stations: [], rankings: null, current: null, mode: "default", rankingKind: "temperature", busy: false };

function stationById(id) {
  return appState.stations.find(station => station.id === id && Number.isFinite(station.temperature)) || null;
}

function renderApp() {
  if (!appState.current) return;
  renderCurrent(appState.current, appState.mode, appState.snapshot);
  renderComparison(appState.current, appState.rankings);
  renderRanking(appState.rankingKind, appState.rankings, appState.current.id, appState.snapshot);
  renderFavorites();
}

function selectWeatherStation(id) {
  const station = stationById(id);
  if (!station || appState.busy) return;
  appState.current = station;
  appState.mode = "manual";
  rememberLocationStation(station, "manual");
  document.getElementById("station-search").value = "";
  renderStationOptions(appState.stations);
  renderApp();
}

async function loadWeather({ initial = false } = {}) {
  if (appState.busy) return;
  appState.busy = true;
  setLoading(true);
  showError("");
  try {
    const snapshot = await fetchAmedasSnapshot();
    const stations = enrichStations(normalizeStations(snapshot));
    const rankings = createRankings(stations);
    if (!rankings.temperature.length) throw new Error("気温の観測値が見つかりませんでした。");
    const previousId = appState.current?.id;
    appState.snapshot = snapshot;
    appState.stations = stations;
    appState.rankings = rankings;
    const saved = readRememberedSelection();
    const chosen = stationById(previousId) || stationById(saved?.stationId);
    if (chosen) {
      appState.current = { ...chosen, ...(previousId === chosen.id && Number.isFinite(appState.current?.distanceKm) ? { distanceKm: appState.current.distanceKm } : {}) };
      if (!previousId) appState.mode = saved.mode;
    } else {
      appState.current = stationById(CONFIG.defaultStationId) || rankings.temperature[0];
      appState.mode = "default";
    }
    renderStationOptions(stations);
    renderApp();
    if (snapshot.isCached || Date.now() - Date.parse(snapshot.latestTime) > 3 * 3600000) showError("過去の観測値を表示しています。観測時刻をご確認ください。最新情報は気象庁でも確認できます。");
    if (initial && !chosen && !saved && !automaticLocationDisabled()) await locateAndRender(true);
  } catch (error) {
    showError((error.message || "観測値を取得できませんでした。") + " 時間をおいて「観測値を更新」を押してください。");
  } finally {
    appState.busy = false;
    setLoading(false);
    UI["station-select"].disabled = !appState.current;
    UI["location-button"].disabled = !appState.stations.length;
  }
}

async function locateAndRender(automatic = false) {
  if (!appState.stations.length || (!automatic && appState.busy)) return;
  if (!automatic) { appState.busy = true; setLoading(true); }
  UI["location-button"].disabled = true;
  UI["station-select"].disabled = true;
  UI["location-status"].textContent = "端末内で最寄りの観測地点を探しています…";
  try {
    const position = await requestCurrentPosition();
    const nearest = nearestStation(position, appState.stations);
    if (!nearest) throw new Error("近くの観測地点を取得できませんでした。");
    appState.current = nearest;
    appState.mode = "live";
    rememberLocationStation(nearest);
    renderApp();
  } catch (error) {
    if (error.code === 1) rememberLocationDenied();
    UI["location-status"].textContent = "位置情報を利用できませんでした。下の一覧から観測地点を選べます。";
  } finally {
    if (!automatic) { appState.busy = false; setLoading(false); }
    UI["location-button"].disabled = false;
    UI["station-select"].disabled = false;
  }
}

let typhoonBusy = false;
async function loadTyphoons() {
  if (typhoonBusy) return;
  typhoonBusy = true;
  UI["typhoon-refresh"].disabled = true;
  UI["typhoon-status"].textContent = "気象庁の台風情報を確認しています…";
  try { renderTyphoons(await fetchTyphoons()); }
  catch (_) {
    UI["typhoon-status"].textContent = "台風情報を取得できませんでした。";
    UI["typhoon-list"].innerHTML = '<p class="notice error">台風がないことを意味する表示ではありません。下のリンクから気象庁の最新情報をご確認ください。</p>';
  } finally {
    typhoonBusy = false;
    UI["typhoon-refresh"].disabled = false;
  }
}

UI["refresh-button"].addEventListener("click", () => loadWeather());
UI["location-button"].addEventListener("click", () => locateAndRender());
UI["station-select"].addEventListener("change", event => {
  selectWeatherStation(event.target.value);
});
document.getElementById("station-search").addEventListener("input", () => renderStationOptions(appState.stations));
UI["typhoon-refresh"].addEventListener("click", loadTyphoons);
document.querySelectorAll("[data-ranking]").forEach(button => button.addEventListener("click", () => {
  appState.rankingKind = button.dataset.ranking;
  document.querySelectorAll("[data-ranking]").forEach(tab => tab.setAttribute("aria-pressed", String(tab === button)));
  if (appState.rankings) renderRanking(appState.rankingKind, appState.rankings, appState.current.id, appState.snapshot);
}));
UI["journey-temperature"].addEventListener("input", event => renderJourney(Number(event.target.value)));
document.querySelectorAll("[data-temperature]").forEach(button => button.addEventListener("click", () => {
  UI["journey-temperature"].value = button.dataset.temperature;
  renderJourney(Number(button.dataset.temperature));
}));
UI["share-button"].addEventListener("click", async () => {
  const station = appState.current;
  if (!station) return;
  const text = stationLabel(station) + "は" + station.temperature.toFixed(1) + "℃。今日は「" + station.scene.title + "」。 #エオルゼア天気帳 #FF14";
  const url = "https://spthx.github.io/eorzea-weather/";
  try {
    if (navigator.share) await navigator.share({ title: "エオルゼア天気帳", text, url });
    else await navigator.clipboard.writeText(text + " " + url);
    UI["share-feedback"].textContent = navigator.share ? "共有しました。" : "共有文とリンクをコピーしました。";
  } catch (error) {
    if (error.name !== "AbortError") UI["share-feedback"].textContent = "共有できませんでした。ブラウザのアドレスをコピーしてお使いください。";
  }
});
renderJourney(20);
updateEorzeaTime();
setInterval(updateEorzeaTime, 1000);
loadWeather({ initial: true });
loadTyphoons();
