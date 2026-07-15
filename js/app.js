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

function renderApp() {
  const current = decorateCurrent(appState.current);
  const kumagaya = stationById(CONFIG.kumagayaStationId);
  const nationalTop = appState.rankings.temperature[0];
  if (!current || !kumagaya || !nationalTop) throw new Error("比較に必要な観測地点が欠測しています。");
  setObservation(appState.snapshot);
  renderJudgement(current);
  renderCurrentCard(current, appState.usedLocation);
  renderComparison(current, kumagaya, appState.rankings);
  renderWeatherParty(current, nationalTop, kumagaya);
  renderRanking(appState.rankingKind, appState.rankings, current.id);
  renderAllStations(appState.rankings);
}

async function loadWeather({ locate = false } = {}) {
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
    if (locate) await locateAndRender();
  } catch (error) {
    console.error(error);
    showError(`${error.message || "観測値を取得できませんでした。"} 時間をおいて再度更新してください。`);
  } finally {
    setLoading(false);
  }
}

async function locateAndRender() {
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
    clearError();
    renderApp();
  } catch (error) {
    appState.usedLocation = false;
    showError("位置情報を利用できなかったため、全国最高気温の観測地点を仮表示しています。位置情報を許可しなくても、比較とランキングは利用できます。");
  } finally {
    UI.locationButton.disabled = false;
    UI.locationButton.textContent = "現在地で再判定";
  }
}

UI.refreshButton.addEventListener("click", () => loadWeather({ locate: appState.usedLocation }));
UI.locationButton.addEventListener("click", locateAndRender);
document.querySelectorAll("[data-ranking]").forEach(button => button.addEventListener("click", () => {
  appState.rankingKind = button.dataset.ranking;
  document.querySelectorAll("[data-ranking]").forEach(tab => tab.setAttribute("aria-selected", String(tab === button)));
  if (appState.rankings && appState.current) renderRanking(appState.rankingKind, appState.rankings, appState.current.id);
}));

document.querySelectorAll("[data-lore-era]").forEach(button => button.addEventListener("click", () => {
  document.querySelectorAll("[data-lore-era]").forEach(item => item.classList.toggle("is-active", item === button));
  renderLoreAtlas(button.dataset.loreEra);
}));

document.documentElement.classList.add("motion-ready");
if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: .01, rootMargin: "0px 0px -8% 0px" });
  document.querySelectorAll(".reveal-section").forEach(section => revealObserver.observe(section));
} else {
  document.querySelectorAll(".reveal-section").forEach(section => section.classList.add("is-visible"));
}

renderLoreAtlas();
updateEorzeaTime();
setInterval(updateEorzeaTime, 1000);
loadWeather({ locate: true });
