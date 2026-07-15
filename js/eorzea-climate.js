const CLIMATE_MESSAGES = Object.freeze({
  dry: ["日陰だけが安置です", "水分ゲージの残量を確認してください", "地面からの反射ダメージが発生しています", "これは黒魔道士の攻撃ではありません", "サゴリー砂漠の予行演習です"],
  humid: ["日陰へ移動してもデバフが解除されません", "汗の蒸発が阻害されています", "エアコンがメインヒーラーです", "湿熱DoTがスタックしています", "回復より先に水分補給してください"],
  still: ["空気が動いていません", "排熱フェーズに失敗しています", "扇風機のリキャストを確認してください", "無風デバフが付与されました", "散開しても涼しくなりません"],
  wind: ["ノックバック耐性を確認してください", "洗濯物救出戦が始まります", "海風の軽減バフが有効です", "屋外家具の撤去フェーズです", "風向ギミックに注意してください"],
  cold: ["属性値が不足しています", "足元の凍結に注意してください", "チョコボの羽まで凍りそうです", "暖房が安置です", "クルザス式の防寒装備を推奨します"],
  comfort: ["バフ環境です。ゆっくり攻略できます", "黒衣森は本日も平常運転です", "休息日和。無理なレベル上げは不要です"]
});

function loreForWeather(station) {
  const { temperature: t, humidity: h, windSpeed: w } = station;
  const rain = Number.isFinite(station.precipitation1h)
    ? station.precipitation1h
    : (Number.isFinite(station.precipitation10m) ? station.precipitation10m * 6 : null);
  if (!Number.isFinite(t)) return null;
  if (t <= -5) return EORZEA_LORE.pagos;
  if (t <= 5) return EORZEA_LORE.garlemald;
  if (t <= 12) return EORZEA_LORE.coerthas;
  if (t <= 18 && Number.isFinite(w) && w >= 4) return EORZEA_LORE.orqopacha;
  if (t <= 18) return EORZEA_LORE.labyrinthos;
  if (Number.isFinite(rain) && rain >= 10 && Number.isFinite(w) && w >= 6) return EORZEA_LORE.heritageFound;
  if (Number.isFinite(rain) && rain >= 3 && t >= 20) return EORZEA_LORE.kozamaKa;
  if (t <= 23 && Number.isFinite(h) && h >= 68) return EORZEA_LORE.blackShroud;
  if (t <= 27 && Number.isFinite(h) && h >= 78) return EORZEA_LORE.yakTel;
  if (t <= 27) return EORZEA_LORE.laNoscea;
  if (Number.isFinite(h) && h >= 70) return EORZEA_LORE.thavnair;
  if (t >= 37 && (!Number.isFinite(h) || h < 55)) return EORZEA_LORE.amhAraeng;
  if (Number.isFinite(h) && h < 45) return EORZEA_LORE.shaaloni;
  if (t >= 32) return EORZEA_LORE.southernThanalan;
  return EORZEA_LORE.laNoscea;
}

function conversionReason(station, lore) {
  if (!lore || !Number.isFinite(station.temperature)) return "観測値が足りないため換算できません。";
  const t = station.temperature.toFixed(1);
  const h = Number.isFinite(station.humidity) ? `${Math.round(station.humidity)}％` : "観測なし";
  if (lore === EORZEA_LORE.thavnair) return `${t}℃・湿度${h}の湿った暑さを、公式に「高温多湿」とされる島へ重ねました。`;
  if (lore === EORZEA_LORE.shaaloni) return `${t}℃・湿度${h}の乾いた暑さを、降雨の少ない乾燥地帯へ重ねました。`;
  if (lore === EORZEA_LORE.garlemald) return `${t}℃の寒さを、公式に寒冷地帯とされる地域へ重ねました。`;
  if (lore === EORZEA_LORE.pagos) return `${t}℃の厳しい寒さを、公式に「氷雪の地」とされるフィールドへ重ねました。`;
  if (lore === EORZEA_LORE.amhAraeng) return `${t}℃の極端な暑さを、公式紹介画像に見える強い砂漠景観へ重ねました。`;
  if (lore === EORZEA_LORE.kozamaKa) return `${t}℃・湿度${h}と観測中の降水を、河川と大瀑布を抱く密林地帯へ重ねました。`;
  if (lore === EORZEA_LORE.yakTel) return `${t}℃・湿度${h}の蒸した環境を、樹冠が日光を遮る深い森の低地へ重ねました。`;
  if (lore === EORZEA_LORE.heritageFound) return `強い降水と風の組み合わせを、分厚い雷雲に覆われる地域へ演出的に重ねました。雷そのものを観測した判定ではありません。`;
  if (lore === EORZEA_LORE.orqopacha) return `${t}℃・風速${Number.isFinite(station.windSpeed) ? station.windSpeed.toFixed(1) : "観測なし"}m/sを、最高峰を擁する山岳地帯へ重ねました。`;
  if (lore === EORZEA_LORE.labyrinthos) return `${t}℃・湿度${h}の安定した環境を、エーテル学的に調整された地下空間へ重ねました。`;
  return `${t}℃・湿度${h}を、公式の地域名と紹介景観から本サイト独自に対応づけました。`;
}

function loreCandidates(station, selectedLore) {
  const observed = {
    temperature: station.temperature,
    humidity: station.humidity,
    rain: Number.isFinite(station.precipitation1h)
      ? station.precipitation1h
      : (Number.isFinite(station.precipitation10m) ? station.precipitation10m * 6 : null),
    wind: station.windSpeed
  };
  const weights = { temperature: .52, humidity: .25, rain: .13, wind: .10 };
  const tolerances = { temperature: 18, humidity: 55, rain: 25, wind: 12 };
  return EORZEA_LORE_LIST.map(lore => {
    let score = 0;
    let usedWeight = 0;
    Object.keys(weights).forEach(key => {
      if (!Number.isFinite(observed[key])) return;
      const closeness = Math.max(0, 1 - Math.abs(observed[key] - lore.model[key]) / tolerances[key]);
      score += closeness * weights[key];
      usedWeight += weights[key];
    });
    const normalized = usedWeight ? score / usedWeight : 0;
    const selectedBoost = lore === selectedLore ? .16 : 0;
    return { lore, score: Math.min(99, Math.round((normalized + selectedBoost) * 100)) };
  }).sort((a, b) => b.score - a.score).slice(0, 3);
}

function humidityAttribute(humidity) {
  if (!Number.isFinite(humidity)) return "湿度属性：観測なし";
  if (humidity < 30) return "極乾燥・乾熱属性IV";
  if (humidity < 40) return "乾燥・乾熱属性II";
  if (humidity < 60) return "標準属性";
  if (humidity < 75) return "多湿・湿熱属性II";
  if (humidity < 85) return "高湿度・湿熱属性III";
  return "飽和寸前・湿熱属性IV";
}

function windEffect(temperature, humidity, windSpeed, precipitation1h) {
  if (!Number.isFinite(windSpeed)) return "風補正：観測なし";
  if (Number.isFinite(precipitation1h) && precipitation1h > 0 && windSpeed >= 6) return "暴風雨フェーズ";
  if (temperature <= 0 && windSpeed >= 6) return "吹雪級ノックバック";
  if (temperature >= 25 && humidity < 40 && windSpeed >= 6) return "砂塵天候";
  if (temperature >= 30 && windSpeed < 1) return "排熱不能・無風デバフ";
  if (windSpeed < 1) return "無風デバフ";
  if (windSpeed < 3) return "微風";
  if (windSpeed < 6) return "疾風の軽減バフ";
  if (windSpeed < 10) return "ノックバック注意";
  return "強風ギミック発生中";
}

function precipitationEffect(temperature, humidity, precipitation1h, precipitation10m) {
  const rain = Number.isFinite(precipitation1h) ? precipitation1h : (Number.isFinite(precipitation10m) ? precipitation10m * 6 : null);
  if (!Number.isFinite(rain)) return "降水：観測なし";
  if (rain <= 0) return "降水なし";
  if (temperature <= 5) return rain >= 10 ? "寒冷降水・豪雨フェーズ" : "寒冷降水フェーズ";
  if (temperature >= 28 && humidity >= 75) return "熱帯スコール";
  if (rain < 2) return "小雨";
  if (rain < 10) return "雨天フェーズ";
  if (rain < 30) return "豪雨フェーズ";
  return "全体攻撃級豪雨";
}

function compositeClimate(station) {
  const { temperature: t, humidity: h, windSpeed: w, precipitation1h: p } = station;
  if (!Number.isFinite(t)) return "気温のみでも判定できません";
  if (t <= 0 && Number.isFinite(w) && w >= 6) return "極寒・強風型（独自判定）";
  if (t <= 5 && Number.isFinite(p) && p > 0) return "寒冷・降水型（独自判定）";
  if (t <= 5 && Number.isFinite(h) && h < 50) return "乾燥・寒冷型（独自判定）";
  if (t >= 25 && Number.isFinite(h) && h < 40 && Number.isFinite(w) && w >= 6) return "乾熱・砂塵型（独自判定）";
  if (t >= 30 && Number.isFinite(w) && w < 1) return "無風・灼熱型（独自判定）";
  if (t >= 27 && Number.isFinite(h) && h >= 70) return "高温・湿熱型（独自判定）";
  if (t >= 32 && Number.isFinite(h) && h < 40) return "極乾燥・乾熱型（独自判定）";
  if (t >= 18 && t <= 25 && Number.isFinite(h) && h >= 40 && h <= 65 && Number.isFinite(w) && w >= 1 && w <= 5) return "快適フィールド（独自判定）";
  if (!Number.isFinite(h)) return "気温のみの暫定判定";
  return t >= 28 ? "高温フィールド" : t <= 5 ? "寒冷フィールド" : "平常フィールド";
}

function calculateThreat(station) {
  const { temperature: t, humidity: h, windSpeed: w, precipitation1h: p } = station;
  let score = 0;
  if (Number.isFinite(t)) {
    score += Math.max(0, t - 20) * 3;
    score += Math.max(0, 5 - t) * 2;
  }
  if (Number.isFinite(t) && t >= 25 && Number.isFinite(h)) score += Math.max(0, h - 50) * .4;
  if (Number.isFinite(t) && t >= 30 && Number.isFinite(w) && w < 1) score += 10;
  if (Number.isFinite(w) && w >= 10) score += 10;
  if (Number.isFinite(p) && p >= 30) score += 10;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function difficultyForThreat(score) {
  if (score < 20) return "制限解除";
  if (score < 40) return "ノーマル";
  if (score < 60) return "極";
  if (score < 80) return "零式";
  return "絶";
}

function messageCategory(station, climate) {
  if (climate.includes("湿熱")) return "humid";
  if (climate.includes("乾熱") || climate.includes("砂塵")) return "dry";
  if (climate.includes("無風")) return "still";
  if (climate.includes("寒冷") || climate.includes("極寒")) return "cold";
  if (climate.includes("快適")) return "comfort";
  if (Number.isFinite(station.windSpeed) && station.windSpeed >= 6) return "wind";
  return station.temperature >= 28 ? "dry" : "comfort";
}

function analyzeClimate(station) {
  const lore = loreForWeather(station);
  const area = lore ? `${lore.name}級` : "観測値不足";
  const climate = compositeClimate(station);
  const attribute = humidityAttribute(station.humidity);
  const wind = windEffect(station.temperature, station.humidity, station.windSpeed, station.precipitation1h);
  const precipitation = precipitationEffect(station.temperature, station.humidity, station.precipitation1h, station.precipitation10m);
  const threat = calculateThreat(station);
  const difficulty = difficultyForThreat(threat);
  const category = messageCategory(station, climate);
  const messages = CLIMATE_MESSAGES[category];
  const comment = messages[deterministicIndex(`${station.id}:${station.observationTime}:${climate}`, messages.length)];
  const candidates = loreCandidates(station, lore);
  return {
    area,
    areaName: lore?.name || "観測値不足",
    climate,
    attribute,
    wind,
    precipitation,
    threat,
    difficulty,
    comment,
    category,
    officialTrait: lore?.officialTrait || "公式資料との照合対象がありません。",
    basisType: lore?.basisType || "判定不能",
    sourceTitle: lore?.sourceTitle || "",
    sourceUrl: lore?.sourceUrl || "",
    wallpaper: lore?.wallpaper || "assets/wallpapers/heavens.jpg",
    conversionReason: conversionReason(station, lore),
    loreTags: lore?.tags || [],
    loreEra: lore?.era || "",
    loreRegion: lore?.region || "",
    candidates
  };
}

function bodyClimateClass(analysis) {
  if (analysis.threat >= 80) return "climate-extreme";
  if (analysis.category === "humid") return "climate-humid";
  if (analysis.category === "cold") return "climate-cold";
  if (analysis.category === "comfort") return "climate-comfort";
  return "climate-heat";
}
