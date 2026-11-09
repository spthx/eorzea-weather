const DISPLAY_PREFS_KEY = "eorzea-weather:display:v1";
let displayPreferences = { largeText: false, autoRefresh: false };
try {
  const stored = JSON.parse(localStorage.getItem(DISPLAY_PREFS_KEY));
  if (stored && typeof stored === "object") displayPreferences = { largeText: stored.largeText === true, autoRefresh: stored.autoRefresh === true };
} catch (_) {}
document.documentElement.dataset.textSize = displayPreferences.largeText ? "large" : "standard";

function publishAstryxState() {
  if (typeof appState === "undefined") return;
  const favoriteIds = readFavorites();
  document.dispatchEvent(new CustomEvent("eorzea:state", { detail: {
    current: appState.current,
    stations: appState.stations.filter(s => Number.isFinite(s.temperature)),
    favorites: favoriteIds.map(id => appState.stations.find(s => s.id === id) || { id, stationName: "観測地点 " + id, temperature: null }),
    favoriteIds,
    busy: appState.busy,
    rankingKind: appState.rankingKind,
    observedAt: appState.snapshot?.latestTime || null,
    isCached: appState.snapshot?.isCached || false,
    error: document.getElementById("weather-error").textContent,
    motion: document.documentElement.dataset.motion === "full",
    reducedMotion: motionPreference.matches,
    preferences: { ...displayPreferences }
  } }));
}

document.addEventListener("eorzea:ui-ready", publishAstryxState);
document.addEventListener("eorzea:action", async event => {
  const { type, payload = {}, respond } = event.detail || {};
  const reply = result => { if (typeof respond === "function") respond(result); };
  try {
    if (type === "select") {
      if (appState.busy || !stationById(payload.id)) return reply({ ok: false, message: "更新が終わってから地点を選んでください。" });
      selectWeatherStation(payload.id);
    } else if (type === "refresh") {
      if (appState.busy) return reply({ ok: false, message: "観測値を更新中です。" });
      await Promise.all([loadWeather(), loadTyphoons()]);
    } else if (type === "locate") {
      await locateAndRender();
    } else if (type === "favorite-add" || type === "favorite-remove" || type === "favorite-restore") {
      const previous = readFavorites();
      let next = [...previous];
      if (type === "favorite-add") {
        if (!stationById(payload.id)) return reply({ ok: false, message: "保存する観測地点を選んでください。" });
        if (next.includes(payload.id)) return reply({ ok: false, message: "この地点は保存済みです。" });
        if (next.length >= 4) return reply({ ok: false, message: "保存できるのは4地点までです。" });
        next.push(payload.id);
      } else if (type === "favorite-remove") next = next.filter(id => id !== payload.id);
      else next = Array.isArray(payload.ids) ? [...new Set(payload.ids.filter(id => typeof id === "string" && /^\d{5}$/.test(id)))].slice(0, 4) : previous;
      if (!writeFavorites(next)) return reply({ ok: false, message: "このブラウザでは保存できませんでした。" });
      renderFavorites();
      publishAstryxState();
      return reply({ ok: true, previous, message: type === "favorite-add" ? "観測地点を保存しました。" : type === "favorite-restore" ? "保存地点を元に戻しました。" : "保存を解除しました。" });
    } else if (type === "ranking") {
      if (!["temperature", "cold", "rain", "wind"].includes(payload.kind)) return reply({ ok: false });
      appState.rankingKind = payload.kind;
      document.querySelectorAll("[data-ranking]").forEach(button => button.setAttribute("aria-pressed", String(button.dataset.ranking === payload.kind)));
      if (appState.rankings) renderRanking(payload.kind, appState.rankings, appState.current.id, appState.snapshot);
    } else if (type === "motion") {
      motionEnabled = payload.enabled === true;
      try { localStorage.setItem("eorzea-weather:motion", motionEnabled ? "full" : "still"); } catch (_) {}
      applyMotionPreference();
    } else if (type === "preferences") {
      const next = { largeText: payload.largeText === true, autoRefresh: payload.autoRefresh === true };
      try { localStorage.setItem(DISPLAY_PREFS_KEY, JSON.stringify(next)); }
      catch (_) { return reply({ ok: false, message: "表示設定を保存できませんでした。" }); }
      displayPreferences = next;
      document.documentElement.dataset.textSize = next.largeText ? "large" : "standard";
    } else return reply({ ok: false, message: "操作を確認できませんでした。" });
    publishAstryxState();
    reply({ ok: true });
  } catch (_) { reply({ ok: false, message: "操作を完了できませんでした。もう一度お試しください。" }); }
});

setInterval(() => {
  if (displayPreferences.autoRefresh && !document.hidden && !appState.busy) {
    loadWeather();
    loadTyphoons();
  }
}, 10 * 60 * 1000);
