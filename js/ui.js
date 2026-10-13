const UI = Object.fromEntries(["current-weather","location-button","refresh-button","location-status","weather-error","scene-wallpaper","station-select","comparison-grid","ranking-list","ranking-note","ranking-time","share-button","share-summary","share-feedback","typhoon-status","typhoon-list","typhoon-refresh","journey-temperature","journey-value","journey-result","eorzea-time"].map(id => [id, document.getElementById(id)]));

function localDate(value) {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit", hour12: false }).format(date) : "時刻不明";
}

function stationLabel(station) {
  return [station.prefecture, station.stationName].filter(Boolean).join("・");
}

function setLoading(active) {
  UI["refresh-button"].disabled = active;
  UI["location-button"].disabled = active;
  UI["station-select"].disabled = active;
  document.getElementById("station-search").disabled = active;
  UI["refresh-button"].textContent = active ? "更新中…" : "観測値を更新";
}

function showError(message) {
  UI["weather-error"].hidden = !message;
  UI["weather-error"].textContent = message || "";
}

function renderCurrent(station, mode, snapshot) {
  const scene = station.scene;
  document.body.dataset.weatherTone = scene.tone;
  if (UI["scene-wallpaper"].getAttribute("src") !== scene.wallpaper) UI["scene-wallpaper"].src = scene.wallpaper;
  document.getElementById("showcase-art").src = scene.wallpaper;
  document.getElementById("world-art").src = scene.wallpaper;
  const locationText = mode === "live" ? "現在地に最も近い、気温を観測している地点です。"
    : mode === "remembered" ? "この端末に保存した現在地付近の観測地点です。"
    : mode === "manual" ? "選択した観測地点の天気を表示しています。"
    : station.id === CONFIG.defaultStationId ? "現在地は未設定です。東京の観測値を表示しています。"
    : "現在地は未設定です。取得できた観測地点を仮表示しています。";
  UI["location-status"].textContent = locationText;
  UI["location-button"].textContent = mode === "live" || mode === "remembered" ? "現在地を更新" : "現在地の天気を見る";
  const distance = Number.isFinite(station.distanceKm) ? " ／ 現在地から約" + station.distanceKm.toFixed(1) + "km" : "";
  const age = Date.now() - Date.parse(snapshot.latestTime);
  const stale = snapshot.isCached || age > 3 * 3600000;
  const metrics = [
    ["湿度", formatInteger(station.humidity, "％")],
    ["風速", formatValue(station.windSpeed, "m/s")],
    ["1時間の降水量", formatValue(station.precipitation1h, "mm")],
    ["積雪の深さ", formatInteger(station.snowDepth, "cm")]
  ];
  UI["current-weather"].innerHTML =
    '<details class="station-details"><summary>' + safeText(station.prefecture || station.stationName) + '</summary><p>' + safeText(station.municipality || "") + '<br>アメダス観測地点：' + safeText(station.stationName + distance) + '</p></details>' +
    '<p class="observation-stamp">' + safeText(formatObservationTime(snapshot.latestTime)) + ' 観測（日本時間）' + (stale ? ' ／ 過去の観測値' : '') + '</p>' +
    '<div class="temperature-row"><div class="temperature">' + station.temperature.toFixed(1) + '<small>℃</small></div><span class="thermal-label">' + safeText(scene.label) + '</span></div>' +
    '<div class="scene-enter"><h2 class="scene-name">' + safeText(scene.title) + '</h2><p class="scene-description">' + safeText(scene.description) + '</p></div>' +
    '<div class="scene-meta"><span>このたとえの気温帯：' + safeText(scene.range) + '</span><a href="' + safeText(scene.sourceUrl) + '" target="_blank" rel="noopener">' + safeText(scene.sourceTitle) + ' ↗</a></div>' +
    '<dl class="weather-metrics">' + metrics.map(pair => '<div><dt>' + pair[0] + '</dt><dd>' + safeText(pair[1]) + '</dd></div>').join("") + '</dl>' +
    '<p class="condition-line">' + safeText(observedConditions(station)) + '</p>';
  UI["share-summary"].textContent = stationLabel(station) + "は" + station.temperature.toFixed(1) + "℃。「" + scene.title + "」";
  UI["share-button"].disabled = false;
  UI["station-select"].value = station.id;
}

function renderStationOptions(stations) {
  const groups = new Map();
  const query = document.getElementById("station-search").value.trim().toLocaleLowerCase("ja");
  const matches = stations.filter(s => Number.isFinite(s.temperature) && (!query || [s.stationName, s.prefecture, s.municipality].join(" ").toLocaleLowerCase("ja").includes(query)));
  matches.forEach(station => {
    const key = station.prefecture || "その他の観測地点";
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(station);
  });
  UI["station-select"].innerHTML = '<option value="">' + (matches.length ? "観測地点を選んでください" : "該当する地点がありません") + '</option>' + [...groups].map(([prefecture, list]) =>
    '<optgroup label="' + safeText(prefecture) + '">' + list.sort((a, b) => a.stationName.localeCompare(b.stationName, "ja")).map(s => '<option value="' + safeText(s.id) + '">' + safeText(s.stationName) + '</option>').join("") + '</optgroup>'
  ).join("");
  document.getElementById("station-search-status").textContent = matches.length + "地点" + (query ? "が見つかりました。" : "から選べます。");
  if (appState.current && matches.some(s => s.id === appState.current.id)) UI["station-select"].value = appState.current.id;
}

function renderComparison(current, rankings) {
  const cards = [
    ["表示中の地点", current],
    ["全国で最も気温が高い地点", rankings.temperature[0]],
    ["全国で最も気温が低い地点", rankings.cold[0]]
  ];
  UI["comparison-grid"].innerHTML = cards.filter(pair => pair[1]).map(([label, s]) =>
    '<article class="place-card"><img class="place-art" src="' + safeText(s.scene.wallpaper) + '" alt="" loading="lazy"><span>' + label + '</span><h3>' + safeText(stationLabel(s)) + '</h3><p class="place-temp">' + s.temperature.toFixed(1) + '<small>℃</small></p><p>' + safeText(s.scene.title) + '</p><p>湿度 ' + formatInteger(s.humidity, "％") + ' ／ 風速 ' + formatValue(s.windSpeed, "m/s") + '</p></article>'
  ).join("");
}

function renderRanking(kind, rankings, selectedId, snapshot) {
  const fields = { temperature: "temperature", cold: "temperature", rain: "precipitation1h", wind: "windSpeed" };
  const units = { temperature: "℃", cold: "℃", rain: "mm", wind: "m/s" };
  const notes = { temperature: "同じ観測時刻の気温が高い順です。日最高気温の順位ではありません。", cold: "同じ観測時刻の気温が低い順です。日最低気温の順位ではありません。", rain: "直近1時間の降水量が多い順です。観測がある地点だけを表示します。", wind: "観測時刻の風速が強い順です。最大瞬間風速ではありません。" };
  const ranking = rankings[kind];
  const field = fields[kind];
  UI["ranking-time"].textContent = localDate(snapshot.latestTime) + " 観測（日本時間）";
  UI["ranking-note"].textContent = notes[kind] + " 同じ値は同順位です。";
  const entries = ranking.slice(0, CONFIG.rankingLimit);
  const current = ranking.find(s => s.id === selectedId);
  if (current && !entries.includes(current)) entries.push(current);
  UI["ranking-list"].innerHTML = entries.length ? entries.map((s, index) => {
    const rank = ranking.findIndex(item => item[field] === s[field]) + 1;
    return '<li class="rank-row' + (s.id === selectedId ? ' is-current' : '') + '"><span class="rank-number"><img class="rank-job" src="assets/fankit/' + FANKIT_JOBS[index % FANKIT_JOBS.length] + '" alt="" loading="lazy">' + rank + '</span><div class="rank-place"><strong>' + safeText(stationLabel(s)) + (s.id === selectedId ? '（表示中）' : '') + '</strong><small>' + safeText(s.scene.title) + '</small></div><span class="rank-value">' + s[field].toFixed(1) + '<small>' + units[kind] + '</small></span></li>';
  }).join("") : '<li class="notice">この項目の観測値を取得できませんでした。</li>';
}

function renderJourney(temperature) {
  const scene = describeWeather({ temperature });
  const journeyArt = document.getElementById("journey-art");
  if (journeyArt.getAttribute("src") !== scene.wallpaper) journeyArt.src = scene.wallpaper;
  UI["journey-value"].textContent = temperature.toFixed(1) + "℃";
  UI["journey-result"].innerHTML = '<h3>' + safeText(scene.title) + '</h3><p>' + safeText(scene.description) + '</p><p>気温帯：' + safeText(scene.range) + ' ／ これはプレビューです。</p><a href="' + safeText(scene.sourceUrl) + '" target="_blank" rel="noopener">出典：' + safeText(scene.sourceTitle) + ' ↗</a>';
}

function typhoonValue(value, unit) {
  return value !== null && value !== undefined && value !== "" && value !== "-" && Number.isFinite(Number(value)) ? safeText(value) + '<small>' + unit + '</small>' : "発表なし";
}

function renderTyphoons(data) {
  const failed = data.items.filter(item => !item.available).length;
  UI["typhoon-status"].textContent = localDate(data.fetchedAt) + " 取得（日本時間） ／ 気象庁の掲載情報 " + data.items.length + "件" + (failed ? " ／ " + failed + "件の詳細を取得できませんでした。" : "");
  if (!data.items.length) {
    UI["typhoon-list"].innerHTML = '<p class="notice">取得した気象庁の一覧には、台風・熱帯低気圧が掲載されていません。</p>';
    return;
  }
  UI["typhoon-list"].innerHTML = data.items.map(item => {
    if (!item.available) return '<article class="typhoon-card"><h3>' + safeText(item.title) + '</h3><p>詳細を取得できませんでした。公式の進路図をご確認ください。</p><p class="issue">一覧の発表時刻：' + safeText(localDate(item.issuedAt)) + '</p></article>';
    const c = item.current;
    const motion = c.speed?.note?.jp
      ? safeText((c.course ? c.course + "へ" : "") + c.speed.note.jp)
      : safeText(c.course || "方向不明") + "へ " + typhoonValue(c.speed?.["km/h"], "km/h");
    const intensity = [c.category?.jp, c.scale && c.scale !== "-" ? c.scale : "", c.intensity && c.intensity !== "-" ? c.intensity : ""].filter(Boolean).join(" ／ ");
    const old = Date.now() - Date.parse(item.issuedAt) > 12 * 3600000;
    const forecast = item.forecasts.map(f => '<li><time>' + safeText(localDate(f.validtime?.JST)) + ' 予報</time>' + safeText(f.location || "位置情報なし") + ' ／ ' + safeText(f.category?.jp || "") + '<br>中心気圧 ' + typhoonValue(f.pressure, "hPa") + ' ／ 最大風速 ' + typhoonValue(f.maximumWind?.sustained?.["m/s"], "m/s") + '</li>').join("");
    return '<article class="typhoon-card"><h3>' + safeText(item.title) + '</h3><span class="intensity">' + safeText(intensity || "勢力の発表なし") + '</span><p>' + safeText(c.location || "位置情報なし") + ' ／ ' + motion + '</p><dl class="typhoon-stats"><div><dt>中心気圧</dt><dd>' + typhoonValue(c.pressure, "hPa") + '</dd></div><div><dt>最大風速</dt><dd>' + typhoonValue(c.maximumWind?.sustained?.["m/s"], "m/s") + '</dd></div><div><dt>最大瞬間風速</dt><dd>' + typhoonValue(c.maximumWind?.gust?.["m/s"], "m/s") + '</dd></div></dl><p class="issue">実況：' + safeText(localDate(c.validtime.JST)) + ' ／ 発表：' + safeText(localDate(item.issuedAt)) + '（日本時間）</p>' + (old ? '<p class="stale">発表から12時間以上経過しています。最新情報を気象庁で確認してください。</p>' : '') + (forecast ? '<details><summary>今後の予報を見る</summary><ul class="forecast-list">' + forecast + '</ul></details>' : '') + '</article>';
  }).join("");
}

function updateEorzeaTime() {
  const seconds = Math.floor(Date.now() / 1000 * (3600 / 175)) % 86400;
  UI["eorzea-time"].textContent = String(Math.floor(seconds / 3600)).padStart(2, "0") + ":" + String(Math.floor((seconds % 3600) / 60)).padStart(2, "0");
}
