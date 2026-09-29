const appState = {
  snapshot: null,
  stations: [],
  rankings: null,
  current: null,
  usedLocation: false,
  rankingKind: "temperature"
};

function stationById(id) {
  return appState.stations.find(item => item.id === id) || null;
}

function decorateCurrent(station) {
  if (!station) return null;
  return { ...station, temperatureRank: rankOf(appState.rankings.temperature, station.id) };
}

function setLocationButtonState() {
  UI.locationButton.textContent = appState.usedLocation ? "現在地を更新" : "現在地を登録";
}

function renderApp() {
  const current = decorateCurrent(appState.current);
  const kumagaya = stationById(CONFIG.kumagayaStationId);
  const nationalTop = appState.rankings.temperature[0];
  if (!current || !kumagaya || !nationalTop) throw new Error("比較に必要な観測地点が欠測しています。");
  setObservation(appState.snapshot);
  renderJudgement(current, appState.usedLocation);
  renderCurrentCard(current, appState.usedLocation);
  renderComparison(current, kumagaya, appState.rankings, appState.usedLocation);
  renderWeatherParty(current, nationalTop, kumagaya, appState.usedLocation);
  renderRanking(appState.rankingKind, appState.rankings, current.id);
  renderAllStations(appState.rankings);
  setLocationButtonState();
}

function useRememberedStation() {
  const stationId = readRememberedStationId();
  if (!stationId) return false;
  const remembered = stationById(stationId);
  if (!remembered) {
    clearRememberedLocationStation();
    return false;
  }
  appState.current = { ...remembered, rememberedLocation: true };
  appState.usedLocation = true;
  renderApp();
  return true;
}

async function loadWeather({ locationMode = "auto" } = {}) {
  setLoading(true);
  clearError();
  try {
    appState.snapshot = await fetchAmedasSnapshot();
    appState.stations = enrichStations(normalizeStations(appState.snapshot));
    appState.rankings = createRankings(appState.stations);
    appState.current = stationById(appState.current?.id) || appState.rankings.temperature[0];
    appState.usedLocation = false;
    renderApp();
    if (appState.snapshot.isCached) showError("最新データへ接続できなかったため、前回正常に取得した観測値を表示しています。観測時刻をご確認ください。");
    if (locationMode === "remembered") useRememberedStation();
    if (locationMode === "auto") {
      const restored = useRememberedStation();
      if (!restored && !automaticLocationDisabled()) await locateAndRender({ automatic: true });
    }
    playDutyIntro(decorateCurrent(appState.current));
  } catch (error) {
    console.error(error);
    showError(`${error.message || "観測値を取得できませんでした。"} 時間をおいて再度更新してください。`);
    dismissDutyIntro();
  } finally {
    setLoading(false);
    setLocationButtonState();
  }
}

async function locateAndRender({ automatic = false } = {}) {
  if (!appState.stations.length) return;
  UI.locationButton.disabled = true;
  UI.locationButton.textContent = "端末内で探索中…";
  try {
    const position = await requestCurrentPosition();
    const nearest = nearestStation(position, appState.stations);
    if (!nearest) throw new Error("最寄りの有効観測地点が見つかりませんでした。");
    appState.current = appState.stations.find(item => item.id === nearest.id) || nearest;
    appState.current = { ...appState.current, distanceKm: nearest.distanceKm };
    appState.usedLocation = true;
    rememberLocationStation(appState.current);
    clearError();
    renderApp();
  } catch (error) {
    appState.usedLocation = false;
    if (error?.code === 1) rememberLocationDenied();
    if (!automatic || error?.code === 1) showError("位置情報を利用できなかったため、全国最高気温の観測地点を仮表示しています。許可しなくても比較とランキングは利用できます。");
  } finally {
    UI.locationButton.disabled = false;
    setLocationButtonState();
  }
}

UI.refreshButton.addEventListener("click", () => loadWeather({ locationMode: "remembered" }));
UI.locationButton.addEventListener("click", () => locateAndRender({ automatic: false }));
document.querySelectorAll("[data-ranking]").forEach(button => button.addEventListener("click", () => {
  appState.rankingKind = button.dataset.ranking;
  document.querySelectorAll("[data-ranking]").forEach(tab => tab.setAttribute("aria-selected", String(tab === button)));
  if (appState.rankings && appState.current) renderRanking(appState.rankingKind, appState.rankings, appState.current.id);
}));

updateEorzeaTime();
setInterval(updateEorzeaTime, 1000);
loadWeather({ locationMode: "auto" });
