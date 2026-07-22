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
  targetCastName: document.getElementById("target-cast-name"),
  targetCastValue: document.getElementById("target-cast-value"),
  targetCastBar: document.getElementById("target-cast-bar"),
  statusEffects: document.getElementById("status-effects"),
  limitGauge: document.getElementById("limit-gauge"),
  eorzeaTime: document.getElementById("eorzea-time"),
  weatherPartyList: document.getElementById("weather-party-list"),
  currentCard: document.getElementById("current-card"),


  comparisonGrid: document.getElementById("comparison-grid"),
  battleVerdict: document.getElementById("battle-verdict"),
  rankingList: document.getElementById("ranking-list"),
  rankingNote: document.getElementById("ranking-note"),
  allStationsList: document.getElementById("all-stations-list"),
  stationSummary: document.getElementById("station-summary"),
  errorPanel: document.getElementById("error-panel"),
  shareDutyName: document.getElementById("share-duty-name"),
  shareDutyTier: document.getElementById("share-duty-tier"),
  shareDutyScore: document.getElementById("share-duty-score"),
  shareDutyDetail: document.getElementById("share-duty-detail"),
  shareDutyButton: document.getElementById("share-duty-button"),
  shareDutyFeedback: document.getElementById("share-duty-feedback"),
  dutyIntro: document.getElementById("duty-intro"),
  dutyIntroStatus: document.getElementById("duty-intro-status"),
  dutyIntroTemp: document.getElementById("duty-intro-temp"),
  dutyIntroClass: document.getElementById("duty-intro-class"),
  dutyIntroEnemy: document.getElementById("duty-intro-enemy")
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

function setDutyWallpaper(nextWallpaper) {
  if (!UI.climateWallpaper || !nextWallpaper || UI.climateWallpaper.getAttribute("src") === nextWallpaper) return;
  UI.climateWallpaper.classList.add("is-switching");
  const reveal = () => requestAnimationFrame(() => UI.climateWallpaper.classList.remove("is-switching"));
  window.setTimeout(() => {
    UI.climateWallpaper.addEventListener("load", reveal, { once: true });
    UI.climateWallpaper.src = nextWallpaper;
    if (UI.climateWallpaper.complete) reveal();
  }, 180);
}
function heatDayClassForTemperature(temperature) {
  if (!Number.isFinite(temperature)) return "暑熱判定中";
  if (temperature >= 40) return "酷暑日級";
  if (temperature >= 35) return "猛暑日級";
  if (temperature >= 30) return "真夏日級";
  return "暑熱級";
}

function playDutyIntro(station) {
  if (!UI.dutyIntro || UI.dutyIntro.dataset.played === "true") return;
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    UI.dutyIntro.hidden = true;
    UI.dutyIntro.dataset.played = "true";
    return;
  }
  const duty = station?.analysis?.battleDuty;
  const temperature = station?.temperature;
  UI.dutyIntroTemp.textContent = Number.isFinite(temperature) ? temperature.toFixed(1) : "--.-";
  UI.dutyIntroClass.textContent = heatDayClassForTemperature(temperature);
  UI.dutyIntroEnemy.textContent = duty ? `${duty.name}級` : "観測データ確認完了";
  UI.dutyIntroStatus.textContent = "CURRENT TEMPERATURE LOCKED";
  UI.dutyIntro.dataset.played = "true";
  requestAnimationFrame(() => requestAnimationFrame(() => UI.dutyIntro.classList.add("is-resolved")));
  window.setTimeout(() => UI.dutyIntro.classList.add("is-finished"), 1550);
  window.setTimeout(() => { UI.dutyIntro.hidden = true; }, 1950);
}

function dismissDutyIntro() {
  if (!UI.dutyIntro) return;
  UI.dutyIntro.classList.add("is-finished");
  window.setTimeout(() => { UI.dutyIntro.hidden = true; }, 350);
}

function renderJudgement(station) {
  const a = station.analysis;
  const duty = a.battleDuty;
  document.body.className = bodyClimateClass(a);
  document.documentElement.style.setProperty("--heat-opacity", String(Math.min(.58, a.threat / 170)));
  const nextWallpaper = duty.wallpaper || a.wallpaper || "assets/wallpapers/heavens.jpg";
  document.body.dataset.dutyEra = duty.eraCode || "unknown";
  setDutyWallpaper(nextWallpaper);
  const prefectureName = station.prefecture || station.stationName || "観測地点";
  const municipalityName = station.municipality || station.stationName || "所在地情報なし";
  const distanceText = Number.isFinite(station.distanceKm) ? `現在地から約${station.distanceKm.toFixed(1)}km` : station.rememberedLocation ? "端末に記憶した最寄り観測地点" : "基準観測地点";
  const stationDetail = `${station.prefecture || "所在地情報なし"} ${municipalityName} ／ アメダス観測地点 ${station.stationName} ／ ${distanceText}`;
  UI.judgementHeading.textContent = heatDayClassForTemperature(station.temperature) + "：酷炎天迎撃戦";
  UI.difficulty.textContent = duty.tier + " / " + duty.code;
  UI.difficulty.dataset.level = a.difficulty;
  UI.threatScore.textContent = a.threat;
  requestAnimationFrame(() => { UI.threatBar.style.width = `${a.threat}%`; });
  UI.targetCastName.textContent = a.climate.replace("（独自判定）", "");
  UI.targetCastValue.textContent = `${a.threat}%`;
  requestAnimationFrame(() => { UI.targetCastBar.style.width = `${Math.max(8, a.threat)}%`; });
  [...UI.limitGauge.children].forEach((segment, index) => {
    const fill = Math.max(0, Math.min(100, (a.threat - index * 33.34) * 3));
    segment.style.setProperty("--gauge-fill", `${fill}%`);
  });
  UI.judgement.innerHTML = `
    <div class="judgement-location">
      <button class="observation-toggle" type="button" aria-expanded="false" aria-controls="observation-detail" aria-label="${safeText(prefectureName)}の詳しい観測地点を表示"><span>${safeText(prefectureName)}</span><i aria-hidden="true">⌄</i><small>観測地点を表示</small></button>
      <div id="observation-detail" class="observation-detail" hidden><span>${safeText(stationDetail)}</span></div>
    </div>
    <p class="judgement-overline">YOUR HEAT DUTY IS...</p>
    <div class="judgement-temp-line"><div class="judgement-temp">${Number.isFinite(station.temperature) ? station.temperature.toFixed(1) : "--"}<small>℃</small></div><span class="judgement-humidity">湿度 ${formatInteger(station.humidity, "％")}</span></div>
    <h3 class="judgement-area">${safeText(duty.name)}<small>級</small></h3>
    <p class="judgement-field-reference">HEAT BAND：${safeText(duty.range || "31.0℃未満")}</p>
    <p class="judgement-type">${safeText(a.climate)}</p>
    <div class="judgement-provenance"><span>${safeText(duty.tier)}</span><span class="era-badge">${safeText(duty.era || "実装時代不明")}</span>${duty.sourceUrl ? `<a href="${duty.sourceUrl}" target="_blank" rel="noopener">${safeText(duty.sourceTitle)} ↗</a>` : `<span>独自判定</span>`}</div>
    <div class="judgement-tags"><span>${safeText(a.attribute)}</span><span>${safeText(a.wind)}</span><span>${safeText(a.precipitation)}</span></div>
    <p class="judgement-comment">${safeText(a.comment)}</p>`;
  const observationToggle = UI.judgement.querySelector(".observation-toggle");
  const observationDetail = UI.judgement.querySelector(".observation-detail");
  observationToggle?.addEventListener("click", () => {
    const expanded = observationToggle.getAttribute("aria-expanded") === "true";
    observationToggle.setAttribute("aria-expanded", String(!expanded));
    observationToggle.classList.toggle("is-open", !expanded);
    observationDetail.hidden = expanded;
    observationToggle.querySelector("small").textContent = expanded ? "観測地点を表示" : "詳細を閉じる";
  });
  renderShareDuty(station);
  renderStatusEffects(station);

}

function renderShareDuty(station) {
  if (!UI.shareDutyButton || !station.analysis?.battleDuty) return;
  const duty = station.analysis.battleDuty;
  const temp = Number.isFinite(station.temperature) ? station.temperature.toFixed(1) : "--";
  UI.shareDutyName.textContent = duty.name + "級";
  UI.shareDutyTier.textContent = heatDayClassForTemperature(station.temperature) + " / " + duty.tier;
  UI.shareDutyScore.textContent = temp + "℃";
  UI.shareDutyDetail.textContent = duty.briefing;
  UI.shareDutyButton.onclick = async () => {
    const url = location.origin + location.pathname;
    const text = "現在地に近い観測値は" + temp + "℃、" + heatDayClassForTemperature(station.temperature) + "・" + duty.name + "級。あなたの暑さはどの炎属性ボス級？ #酷炎天迎撃戦 #FF14";
    try {
      if (navigator.share) {
        await navigator.share({ title: "酷炎天迎撃戦", text, url });
        UI.shareDutyFeedback.textContent = "パーティ募集リンクを共有しました。";
      } else {
        await navigator.clipboard.writeText(text + " " + url);
        UI.shareDutyFeedback.textContent = "共有文とリンクをコピーしました。";
      }
    } catch (error) {
      if (error?.name !== "AbortError") UI.shareDutyFeedback.textContent = "共有できませんでした。URLをコピーしてお使いください。";
    }
  };
}

function renderStatusEffects(station) {
  const a = station.analysis;
  const effects = [
    { icon: station.temperature >= 28 ? "♨" : station.temperature <= 5 ? "❄" : "✦", label: station.temperature >= 28 ? "灼熱" : station.temperature <= 5 ? "寒冷" : "平常", value: formatValue(station.temperature, "℃"), type: station.temperature >= 28 || station.temperature <= 5 ? "debuff" : "buff" },
    { icon: "◆", label: a.attribute.replace(/属性.*/, "属性"), value: formatInteger(station.humidity, "％"), type: Number.isFinite(station.humidity) && station.humidity >= 70 ? "debuff" : "buff" },
    { icon: "≋", label: a.wind, value: formatValue(station.windSpeed, "m/s"), type: Number.isFinite(station.windSpeed) && station.windSpeed >= 6 ? "debuff" : "buff" },
    { icon: "☂", label: a.precipitation, value: Number.isFinite(station.precipitation1h) ? `${station.precipitation1h.toFixed(1)}mm` : "LIVE", type: Number.isFinite(station.precipitation1h) && station.precipitation1h > 0 ? "debuff" : "buff" }
  ];
  UI.statusEffects.innerHTML = effects.map(effect => `<article class="status-effect ${effect.type}"><i>${effect.icon}</i><span>${safeText(effect.label)}</span><b>${safeText(effect.value)}</b></article>`).join("");
}

function renderWeatherParty(current, nationalTop, kumagaya) {
  const members = [
    { role: "T", name: "YOU / CURRENT", station: current, art: JOB_ART[0] },
    { role: "H", name: "NATIONAL TOP", station: nationalTop, art: JOB_ART[4] },
    { role: "D", name: "KUMAGAYA", station: kumagaya, art: JOB_ART[2] },
    { role: "D", name: "DUTY ARCHIVE", station: current, art: JOB_ART[7], archive: true }
  ];
  UI.weatherPartyList.innerHTML = members.map(member => {
    const hp = member.archive ? 100 : Math.max(8, 100 - member.station.analysis.threat);
    const mp = member.archive ? 100 : (Number.isFinite(member.station.humidity) ? Math.min(100, member.station.humidity) : 0);
    const detail = member.archive ? `${HEAT_DUTIES.length - 1} HEAT BANDS / 0.5℃ STEPS` : `${member.station.temperature.toFixed(1)}℃ / ${member.station.analysis.battleDuty.name}`;
    return `<article class="party-member ${member === members[0] ? "is-you" : ""}">
      <span class="party-role role-${member.role.toLowerCase()}">${member.role}</span><img src="${member.art}" alt=""><div class="party-member-info"><strong>${safeText(member.name)}</strong><small>${safeText(detail)}</small><div class="party-bars"><i style="--party-hp:${hp}%"></i><b style="--party-mp:${mp}%"></b></div></div><em>${hp}%</em>
    </article>`;
  }).join("");
}

function updateEorzeaTime() {
  if (!UI.eorzeaTime) return;
  const eorzeaSeconds = Math.floor(Date.now() / 1000 * (3600 / 175)) % 86400;
  const hours = Math.floor(eorzeaSeconds / 3600);
  const minutes = Math.floor((eorzeaSeconds % 3600) / 60);
  UI.eorzeaTime.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
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
  const distance = usedLocation && Number.isFinite(station.distanceKm) ? `現在地から約${station.distanceKm.toFixed(0)}km` : "位置情報未使用：全国最高気温地点を仮表示中";
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
  const badge = role === "YOU" ? "現在地側" : "暑さ基準";
  const roleArt = role === "YOU" ? JOB_ART[7] : JOB_ART[2];
  return `<article class="comparison-card ${role === "YOU" ? "featured" : ""}" data-rank="${tempRank || "–"}">
    <img class="combatant-avatar" src="${roleArt}" alt="FFXIVファンキットのジョブ・ピクセルアート">
    <div class="combatant-label"><span>${role}</span><b>${badge}</b></div>
    <h3 class="combatant-place">${safeText(station.prefecture || "現在地周辺")}・${safeText(station.municipality || station.stationName)}<small>観測地点 ${safeText(station.stationName)} / 全国${tempRank || "–"}位</small></h3>
    <p class="combatant-temp">${Number.isFinite(station.temperature) ? station.temperature.toFixed(1) : "--"}<small>℃</small></p>
    <p class="combatant-climate">${safeText((a?.battleDuty?.name || "判定不能") + "級")}<br>${safeText(a?.climate || "データ不足")}</p>
    <div class="mini-stats"><span>湿度<b>${formatInteger(station.humidity,"％")}</b></span><span>風速<b>${formatValue(station.windSpeed,"m/s")}</b></span><span>独自強度<b>${a?.threat ?? "--"}</b></span><span>演出難易度<b>${a?.difficulty || "--"}</b></span></div>
  </article>`;
}

function renderComparison(current, kumagaya, rankings) {
  UI.comparisonGrid.innerHTML = [comparisonCard(current, "YOU", rankings), comparisonCard(kumagaya, "KUMAGAYA", rankings)].join("");
  const fighters = [current, kumagaya];
  const fireWinner = fighters.filter(x => Number.isFinite(x.temperature)).sort((a,b) => b.temperature - a.temperature)[0];
  const humidWinner = fighters.filter(x => Number.isFinite(x.humidScore)).sort((a,b) => b.humidScore - a.humidScore)[0];
  const threatWinner = [...fighters].sort((a,b) => b.analysis.threat - a.analysis.threat)[0];
  const curVsKumagaya = current.temperature - kumagaya.temperature;
  const diffText = Math.abs(curVsKumagaya) < .05 ? "現在地側と熊谷は同温" : `${curVsKumagaya > 0 ? "現在地側" : "熊谷"}が${Math.abs(curVsKumagaya).toFixed(1)}℃高い`;
  UI.battleVerdict.innerHTML = `<strong>総合判定：${safeText(threatWinner.prefecture || threatWinner.stationName)}が環境ギミック首位</strong>火属性火力は${safeText(fireWinner.prefecture || fireWinner.stationName)}、湿熱DoTは${safeText(humidWinner?.prefecture || "比較不能")}。${safeText(diffText)}。気温だけでなく、湿度・風・降水を加えた独自演出で評価しています。`;
}

function rankingMeta(kind, item) {
  if (kind === "humid") return { value: item.humidScore.toFixed(1), unit: "独自湿熱値", note: `${formatValue(item.temperature,"℃")} / ${formatInteger(item.humidity,"％")}` };
  if (kind === "threat") return { value: item.analysis.threat, unit: `演出${item.analysis.difficulty}`, note: `${formatValue(item.temperature,"℃")} / ${item.analysis.climate}` };
  return { value: item.temperature.toFixed(1), unit: "℃", note: `${formatInteger(item.humidity,"％")} / ${item.analysis.battleDuty.name}` };
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
    const markers = [item.id === targetId ? "is-target" : "", item.id === CONFIG.kumagayaStationId ? "is-kumagaya" : ""].join(" ");
    return `<article class="rank-card ${markers}"><span class="rank-number">${rank}</span><img class="rank-job-art" src="${JOB_ART[index % JOB_ART.length]}" alt=""><div class="rank-info"><strong>${safeText(item.prefecture || "所在地情報なし")}・${safeText(item.municipality || item.stationName)}</strong><small>観測地点 ${safeText(item.stationName)} / ${safeText(meta.note)}</small></div><div class="rank-value">${safeText(meta.value)}<small>${safeText(meta.unit)}</small></div></article>`;
  }).join("");
}

function renderAllStations(rankings) {
  const ranking = rankings.temperature;
  const kumagayaRank = rankOf(ranking, CONFIG.kumagayaStationId);
  const hotter = kumagayaRank ? kumagayaRank - 1 : 0;
  UI.stationSummary.textContent = `${ranking.length}地点 / 熊谷${kumagayaRank || "–"}位 / 熊谷超え${hotter}地点`;
  UI.allStationsList.innerHTML = ranking.map((item, index) => `<article class="all-station-row"><em>${index + 1}</em><span><b>${safeText(item.prefecture || "所在地情報なし")}・${safeText(item.municipality || item.stationName)}</b><small>${safeText(item.stationName)} / ${safeText(item.analysis.battleDuty.name)}級</small></span><strong>${item.temperature.toFixed(1)}℃</strong></article>`).join("");
}

function showError(message) {
  UI.errorPanel.hidden = false;
  UI.errorPanel.textContent = message;
}

function clearError() { UI.errorPanel.hidden = true; UI.errorPanel.textContent = ""; }
