const UI = {
  observationTime: document.getElementById("observation-time"),
  refreshButton: document.getElementById("refresh-button"),
  locationButton: document.getElementById("location-button"),
  judgementHeading: document.getElementById("judgement-heading"),
  climateWallpaper: document.getElementById("climate-wallpaper"),
  judgement: document.getElementById("primary-judgement"),
  difficulty: document.getElementById("difficulty-badge"),
  threatScore: document.getElementById("threat-score"),
  threatBar: document.getElementById("threat-bar"),
  currentCard: document.getElementById("current-card"),
  loreCard: document.getElementById("lore-card"),
  loreAtlasGrid: document.getElementById("lore-atlas-grid"),
  comparisonGrid: document.getElementById("comparison-grid"),
  battleVerdict: document.getElementById("battle-verdict"),
  rankingList: document.getElementById("ranking-list"),
  rankingNote: document.getElementById("ranking-note"),
  allStationsList: document.getElementById("all-stations-list"),
  stationSummary: document.getElementById("station-summary"),
  errorPanel: document.getElementById("error-panel")
};

const JOB_ART = [
  "assets/fankit/job-paladin.png", "assets/fankit/job-darkknight.png", "assets/fankit/job-blackmage.png",
  "assets/fankit/job-04.png", "assets/fankit/job-05.png", "assets/fankit/job-06.png", "assets/fankit/job-07.png",
  "assets/fankit/job-08.png", "assets/fankit/job-09.png", "assets/fankit/job-10.png", "assets/fankit/job-11.png", "assets/fankit/job-12.png"
];

function jobArtForClimate(category) {
  return ({ dry: JOB_ART[2], still: JOB_ART[2], humid: JOB_ART[4], cold: JOB_ART[1], wind: JOB_ART[6], comfort: JOB_ART[0] })[category] || JOB_ART[3];
}

function setLoading(active) {
  UI.refreshButton.disabled = active;
  UI.locationButton.disabled = active;
  UI.refreshButton.setAttribute("aria-busy", String(active));
}

function setObservation(snapshot) {
  const cacheText = snapshot.isCached ? " / 前回取得データ" : " / LIVE";
  UI.observationTime.textContent = `観測時刻 ${formatObservationTime(snapshot.latestTime)}${cacheText}`;
}

function renderJudgement(station) {
  const a = station.analysis;
  document.body.className = bodyClimateClass(a);
  document.documentElement.style.setProperty("--heat-opacity", String(Math.min(.58, a.threat / 170)));
  const nextWallpaper = a.wallpaper || "assets/wallpapers/heavens.jpg";
  if (!UI.climateWallpaper.src.endsWith(nextWallpaper)) UI.climateWallpaper.src = nextWallpaper;
  const locationName = [station.prefecture, station.municipality || station.stationName].filter(Boolean).join("・") || station.stationName;
  UI.judgementHeading.textContent = "灼熱デバフ討滅戦";
  UI.difficulty.textContent = `演出難易度：${a.difficulty}`;
  UI.difficulty.dataset.level = a.difficulty;
  UI.threatScore.textContent = a.threat;
  requestAnimationFrame(() => { UI.threatBar.style.width = `${a.threat}%`; });
  UI.judgement.innerHTML = `
    <p class="judgement-location">${safeText(locationName)} ／ 観測地点 ${safeText(station.stationName)}</p>
    <p class="judgement-overline">YOUR REAL-WORLD HEAT IS...</p>
    <div class="judgement-temp-line"><div class="judgement-temp">${Number.isFinite(station.temperature) ? station.temperature.toFixed(1) : "--"}<small>℃</small></div><span class="judgement-humidity">湿度 ${formatInteger(station.humidity, "％")}</span></div>
    <h3 class="judgement-area">${safeText(a.area)}</h3>
    <p class="judgement-type">${safeText(a.climate)}</p>
    <div class="judgement-provenance"><span>${safeText(a.basisType)}</span><a href="#lore-heading">公式根拠と推察を確認</a></div>
    <div class="judgement-tags"><span>${safeText(a.attribute)}</span><span>${safeText(a.wind)}</span><span>${safeText(a.precipitation)}</span></div>
    <p class="judgement-comment">${safeText(a.comment)}</p>`;
  renderLoreAudit(station);
}

function renderLoreAudit(station) {
  const a = station.analysis;
  const source = a.sourceUrl
    ? `<a class="lore-source-link" href="${a.sourceUrl}" target="_blank" rel="noopener">${safeText(a.sourceTitle)} ↗</a>`
    : "";
  const candidates = (a.candidates || []).map((entry, index) => `<article class="lore-candidate ${index === 0 ? "is-primary" : ""}">
    <span>${index === 0 ? "MAIN ROUTE" : `ALT ${index}`}</span>
    <strong>${safeText(entry.lore.name)}</strong>
    <small>${safeText(entry.lore.tags.slice(0, 2).join(" / "))}</small>
    <div><i style="width:${entry.score}%"></i></div><em>演出適合 ${entry.score}%</em>
  </article>`).join("");
  UI.loreCard.innerHTML = `
    <div class="lore-card-head">
      <div><p>LORE REFERENCE</p><h3>${safeText(a.areaName)}</h3></div>
      <span class="lore-checked">SETTING CHECKED</span>
    </div>
    <div class="lore-evidence official-evidence"><span>公式資料で確認</span><p>${safeText(a.officialTrait)}</p>${source}</div>
    <div class="lore-route" aria-hidden="true"><i></i><b>現実の観測値と照合</b><i></i></div>
    <div class="lore-evidence inference-evidence"><span>今回の推察</span><p>${safeText(a.conversionReason)}</p></div>
    <div class="lore-candidate-head"><span>候補航路</span><p>気温・湿度・降水・風を、独自モデルで全地域と照合</p></div>
    <div class="lore-candidates">${candidates}</div>
    <p class="lore-boundary"><strong>本サイト独自：</strong> 現実の℃境界、湿度補正、「級」の表記、ギミック強度、演出難易度。FF14に公式の摂氏換算表があるという意味ではありません。</p>`;
}

function loreEraLabel(era) {
  return ({
    "A REALM REBORN": "新生エオルゼア", HEAVENSWARD: "蒼天のイシュガルド", STORMBLOOD: "紅蓮のリベレーター",
    SHADOWBRINGERS: "漆黒のヴィランズ", ENDWALKER: "暁月のフィナーレ", DAWNTRAIL: "黄金のレガシー"
  })[era] || era;
}

function renderLoreAtlas(era = "ALL") {
  if (!UI.loreAtlasGrid) return;
  const loreList = era === "ALL" ? EORZEA_LORE_LIST : EORZEA_LORE_LIST.filter(lore => lore.era === era);
  UI.loreAtlasGrid.innerHTML = loreList.map((lore, index) => `<article class="lore-atlas-card" style="--card-delay:${index * 45}ms">
    <div class="lore-atlas-art"><img src="${lore.wallpaper}" alt=""><span></span><b>${safeText(lore.era)}</b></div>
    <div class="lore-atlas-copy">
      <p>${safeText(loreEraLabel(lore.era))}</p>
      <h4>${safeText(lore.name)}</h4>
      <small class="lore-atlas-region">${safeText(lore.region)}</small>
      <div class="lore-atlas-tags">${lore.tags.map(tag => `<span>${safeText(tag)}</span>`).join("")}</div>
      <p class="lore-atlas-trait">${safeText(lore.officialTrait)}</p>
      <div class="lore-atlas-model"><span>独自換算モデル</span><b>${lore.model.temperature}℃</b><b>湿度${lore.model.humidity}％</b><b>風${lore.model.wind}m/s</b></div>
      <a href="${lore.sourceUrl}" target="_blank" rel="noopener">${safeText(lore.sourceTitle)} ↗</a>
    </div>
  </article>`).join("");
}

function weatherGlyph(station) {
  if (Number.isFinite(station.precipitation1h) && station.precipitation1h >= 10) return "☂";
  if (station.temperature <= 5) return "❄";
  if (Number.isFinite(station.windSpeed) && station.windSpeed >= 6) return "≋";
  if (station.temperature >= 30) return "☀";
  return "✦";
}

function renderCurrentCard(station, usedLocation) {
  const locationText = station.prefecture ? `${station.prefecture}・${station.municipality || station.stationName}` : station.stationName;
  const distance = usedLocation && Number.isFinite(station.distanceKm) ? `現在地から約${station.distanceKm.toFixed(0)}km` : "位置情報未使用：宮崎市を表示中";
  UI.currentCard.innerHTML = `
    <img class="current-job-art" src="${jobArtForClimate(station.analysis.category)}" alt="FFXIVファンキットのジョブ・ピクセルアート">
    <div class="station-head">
      <p class="station-kicker">NEAREST AMEDAS STATION</p>
      <h3 class="station-title">${safeText(locationText)}<br><small>観測地点：${safeText(station.stationName)}</small></h3>
      <p class="station-distance">⌖ ${safeText(distance)}</p>
    </div>
    <div class="status-core"><div class="main-temp">${Number.isFinite(station.temperature) ? station.temperature.toFixed(1) : "--"}<small>℃</small></div><div class="weather-glyph" aria-hidden="true">${weatherGlyph(station)}</div></div>
    <div class="stat-grid">
      <div class="stat"><span>湿度 / HUMIDITY</span><strong>${formatInteger(station.humidity, "％")}</strong></div>
      <div class="stat"><span>風 / WIND</span><strong>${formatValue(station.windSpeed, "m/s")} ${safeText(windDirectionLabel(station.windDirection))}</strong></div>
      <div class="stat"><span>1時間降水 / RAIN</span><strong>${formatValue(station.precipitation1h, "mm")}</strong></div>
      <div class="stat"><span>全国気温順位 / RANK</span><strong>${station.temperatureRank ? `${station.temperatureRank}位` : "対象外"}</strong></div>
    </div>
    <p class="status-source">この値は現在地そのものではなく、選ばれたアメダス観測地点の観測値です。湿度などが欠測の場合は0にせず「観測なし」と表示します。</p>`;
}

function comparisonCard(station, role, ranking) {
  const a = station.analysis;
  const tempRank = rankOf(ranking.temperature, station.id);
  const badge = role === "YOU" ? "現在地側" : role === "MIYAZAKI" ? "県庁所在地" : "暑さ基準";
  const roleArt = role === "YOU" ? JOB_ART[7] : role === "MIYAZAKI" ? JOB_ART[4] : JOB_ART[2];
  return `<article class="comparison-card ${role === "YOU" ? "featured" : ""}" data-rank="${tempRank || "–"}">
    <img class="combatant-avatar" src="${roleArt}" alt="FFXIVファンキットのジョブ・ピクセルアート">
    <div class="combatant-label"><span>${role}</span><b>${badge}</b></div>
    <h3 class="combatant-place">${safeText(station.prefecture || "現在地周辺")}・${safeText(station.municipality || station.stationName)}<small>観測地点 ${safeText(station.stationName)} / 全国${tempRank || "–"}位</small></h3>
    <p class="combatant-temp">${Number.isFinite(station.temperature) ? station.temperature.toFixed(1) : "--"}<small>℃</small></p>
    <p class="combatant-climate">${safeText(a?.area || "判定不能")}<br>${safeText(a?.climate || "データ不足")}</p>
    <div class="mini-stats"><span>湿度<b>${formatInteger(station.humidity,"％")}</b></span><span>風速<b>${formatValue(station.windSpeed,"m/s")}</b></span><span>独自強度<b>${a?.threat ?? "--"}</b></span><span>演出難易度<b>${a?.difficulty || "--"}</b></span></div>
  </article>`;
}

function renderComparison(current, miyazaki, kumagaya, rankings) {
  UI.comparisonGrid.innerHTML = [comparisonCard(current, "YOU", rankings), comparisonCard(miyazaki, "MIYAZAKI", rankings), comparisonCard(kumagaya, "KUMAGAYA", rankings)].join("");
  const fighters = [current, miyazaki, kumagaya];
  const fireWinner = fighters.filter(x => Number.isFinite(x.temperature)).sort((a,b) => b.temperature - a.temperature)[0];
  const humidWinner = fighters.filter(x => Number.isFinite(x.humidScore)).sort((a,b) => b.humidScore - a.humidScore)[0];
  const threatWinner = [...fighters].sort((a,b) => b.analysis.threat - a.analysis.threat)[0];
  const curVsMiyazaki = current.temperature - miyazaki.temperature;
  const diffText = Math.abs(curVsMiyazaki) < .05 ? "現在地側と宮崎市は同温" : `${curVsMiyazaki > 0 ? "現在地側" : "宮崎市"}が${Math.abs(curVsMiyazaki).toFixed(1)}℃高い`;
  UI.battleVerdict.innerHTML = `<strong>総合判定：${safeText(threatWinner.prefecture || threatWinner.stationName)}が環境ギミック首位</strong>火属性火力は${safeText(fireWinner.prefecture || fireWinner.stationName)}、湿熱DoTは${safeText(humidWinner?.prefecture || "比較不能")}。${safeText(diffText)}。気温だけでなく、湿度・風・降水を加えた独自演出で評価しています。`;
}

function rankingMeta(kind, item) {
  if (kind === "humid") return { value: item.humidScore.toFixed(1), unit: "独自湿熱値", note: `${formatValue(item.temperature,"℃")} / ${formatInteger(item.humidity,"％")}` };
  if (kind === "threat") return { value: item.analysis.threat, unit: `演出${item.analysis.difficulty}`, note: `${formatValue(item.temperature,"℃")} / ${item.analysis.climate}` };
  return { value: item.temperature.toFixed(1), unit: "℃", note: `${formatInteger(item.humidity,"％")} / ${item.analysis.area}` };
}

function renderRanking(kind, rankings, targetId) {
  const ranking = rankings[kind];
  const featured = featuredRanking(ranking, targetId);
  const notes = {
    temperature: "全国の有効観測地点を、同一観測時刻の気温順で表示します。",
    humid: "気温と湿度が揃う地点のみ。気温＋湿度補正によるサイト独自の湿熱値です。",
    threat: "気温・湿度・風・降水から算出した演出専用値。公的・医学的指標ではありません。"
  };
  UI.rankingNote.textContent = notes[kind];
  UI.rankingList.innerHTML = featured.map((item, index) => {
    const rank = rankOf(ranking, item.id);
    const meta = rankingMeta(kind, item);
    const markers = [item.id === targetId ? "is-target" : "", item.id === CONFIG.miyazakiStationId ? "is-miyazaki" : "", item.id === CONFIG.kumagayaStationId ? "is-kumagaya" : ""].join(" ");
    return `<article class="rank-card ${markers}"><span class="rank-number">${rank}</span><img class="rank-job-art" src="${JOB_ART[index % JOB_ART.length]}" alt=""><div class="rank-info"><strong>${safeText(item.prefecture || "所在地情報なし")}・${safeText(item.municipality || item.stationName)}</strong><small>観測地点 ${safeText(item.stationName)} / ${safeText(meta.note)}</small></div><div class="rank-value">${safeText(meta.value)}<small>${safeText(meta.unit)}</small></div></article>`;
  }).join("");
}

function renderAllStations(rankings) {
  const ranking = rankings.temperature;
  const kumagayaRank = rankOf(ranking, CONFIG.kumagayaStationId);
  const hotter = kumagayaRank ? kumagayaRank - 1 : 0;
  UI.stationSummary.textContent = `${ranking.length}地点 / 熊谷${kumagayaRank || "–"}位 / 熊谷超え${hotter}地点`;
  UI.allStationsList.innerHTML = ranking.map((item, index) => `<article class="all-station-row"><em>${index + 1}</em><span><b>${safeText(item.prefecture || "所在地情報なし")}・${safeText(item.municipality || item.stationName)}</b><small>${safeText(item.stationName)} / ${safeText(item.analysis.area)}</small></span><strong>${item.temperature.toFixed(1)}℃</strong></article>`).join("");
}

function showError(message) {
  UI.errorPanel.hidden = false;
  UI.errorPanel.textContent = message;
}

function clearError() { UI.errorPanel.hidden = true; UI.errorPanel.textContent = ""; }
