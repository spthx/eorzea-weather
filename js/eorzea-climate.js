const CLIMATE_MESSAGES = Object.freeze({
  dry: ["乾熱ルート進行中。直射日光と路面の照り返しを避けてください。", "汗が目立たなくても水分は失われます。移動前に補給してください。", "日陰を安置として、屋外移動を短い区間に分けてください。", "風があっても乾燥時は脱水に気づきにくいため注意が必要です。"],
  humid: ["湿熱ルート進行中。汗が蒸発しにくく、体内の熱が逃げにくい状態です。", "日陰でも湿熱デバフは残ります。冷房のある場所で休憩してください。", "喉が渇く前の水分補給と、塩分を含む休憩を優先してください。", "気温だけでなく高い湿度が暑熱換算値を押し上げています。"],
  still: ["無風により体表の熱が逃げにくい状態です。送風または冷房を確保してください。", "排熱を助ける風がありません。屋外滞在時間を短くしてください。", "無風デバフ発生中。扇風機は補助、室温が高い場合は冷房を優先してください。"],
  wind: ["風は暑熱換算値を軽減しますが、強風による飛来物や転倒にも注意してください。", "風の軽減が有効です。ただし日射と水分消費は継続しています。", "風向・風速の変化で体感が変わります。安全な屋内を退避先に設定してください。"],
  cold: ["寒冷ルート進行中。風が強い場合は体感温度がさらに低下します。", "路面凍結や降雪の有無を確認し、防寒装備を優先してください。", "観測気温が低温帯に入っています。長時間の屋外行動を避けてください。"],
  comfort: ["大きな暑熱・寒冷補正はありません。通常ルートとして判定しています。", "観測値は比較的穏やかですが、日射や急な天候変化には注意してください。", "現在は低強度です。気温・湿度の更新でルートが変わる可能性があります。"]
});

function summerProfileForWeather(station) {
  const { temperature: t, humidity: h, windSpeed: w } = station;
  const rain = Number.isFinite(station.precipitation1h)
    ? station.precipitation1h
    : (Number.isFinite(station.precipitation10m) ? station.precipitation10m * 6 : null);
  if (!Number.isFinite(t) || t < 25) return { active: false };

  const humidityBonus = Number.isFinite(h) ? Math.max(-1.2, Math.min(2.8, (h - 60) * .07)) : 0;
  const windRelief = Number.isFinite(w) ? Math.max(0, w - 2) * .18 : 0;
  const score = Math.round((t + humidityBonus - windRelief) * 10) / 10;
  const wet = Number.isFinite(h) && h >= 65;
  const route = wet ? "wet" : "dry";
  const routeLabel = wet ? "湿潤ルート" : (Number.isFinite(h) ? "乾熱ルート" : "気温優先ルート");

  if (Number.isFinite(rain) && rain >= 10 && Number.isFinite(w) && w >= 6) {
    return { active: true, score, humidityBonus, windRelief, route: "storm", routeLabel: "雷雨ルート", stageLabel: "豪雨＋強風の割込条件", rangeLabel: "雨10mm以上・風6m/s以上", lore: EORZEA_LORE.heritageFound };
  }
  if (Number.isFinite(rain) && rain >= 3) {
    return { active: true, score, humidityBonus, windRelief, route: "wet", routeLabel: "降水ルート", stageLabel: "まとまった雨の割込条件", rangeLabel: "雨3mm以上", lore: EORZEA_LORE.kozamaKa };
  }

  const stages = wet ? [
    { max: 27, lore: EORZEA_LORE.yakTel, stageLabel: "湿潤I", rangeLabel: "27.0未満" },
    { max: 29, lore: EORZEA_LORE.tulliyollal, stageLabel: "湿潤II", rangeLabel: "27.0–28.9" },
    { max: 31, lore: EORZEA_LORE.kozamaKa, stageLabel: "湿潤III", rangeLabel: "29.0–30.9" },
    { max: 37, lore: EORZEA_LORE.thavnair, stageLabel: "湿潤IV", rangeLabel: "31.0–36.9" },
    { max: Infinity, lore: EORZEA_LORE.pyros, stageLabel: "属性限界", rangeLabel: "37.0以上" }
  ] : [
    { max: 27, lore: EORZEA_LORE.laNoscea, stageLabel: "乾燥I", rangeLabel: "27.0未満" },
    { max: 29, lore: EORZEA_LORE.uldah, stageLabel: "乾燥II", rangeLabel: "27.0–28.9" },
    { max: 31, lore: EORZEA_LORE.shaaloni, stageLabel: "乾燥III", rangeLabel: "29.0–30.9" },
    { max: 33, lore: EORZEA_LORE.southernThanalan, stageLabel: "乾燥IV", rangeLabel: "31.0–32.9" },
    { max: 35, lore: EORZEA_LORE.amhAraeng, stageLabel: "乾燥V", rangeLabel: "33.0–34.9" },
    { max: Infinity, lore: EORZEA_LORE.pyros, stageLabel: "属性限界", rangeLabel: "35.0以上" }
  ];
  const selected = stages.find(stage => score < stage.max) || stages[stages.length - 1];
  return { active: true, score, humidityBonus, windRelief, route, routeLabel, ...selected };
}

function loreForWeather(station, summerProfile = summerProfileForWeather(station)) {
  const { temperature: t, humidity: h, windSpeed: w } = station;
  const rain = Number.isFinite(station.precipitation1h)
    ? station.precipitation1h
    : (Number.isFinite(station.precipitation10m) ? station.precipitation10m * 6 : null);
  if (!Number.isFinite(t)) return null;
  // 夏の観測値でも多くの地域名が登場するよう、5℃を起点に5℃刻みで基本地域を決める。
  // 25℃以上は湿度と風を補正した暑熱換算値を約2ポイント刻みで分岐する。
  if (t <= -5) return EORZEA_LORE.pagos;
  if (t < 5) return EORZEA_LORE.garlemald;
  if (t < 10) return EORZEA_LORE.ishgard;
  if (t < 15) return EORZEA_LORE.coerthas;
  if (t < 20 && Number.isFinite(w) && w >= 4) return EORZEA_LORE.orqopacha;
  if (t < 20) return EORZEA_LORE.labyrinthos;
  if (Number.isFinite(rain) && rain >= 10 && Number.isFinite(w) && w >= 6) return EORZEA_LORE.heritageFound;
  if (Number.isFinite(rain) && rain >= 3 && t >= 20) return EORZEA_LORE.kozamaKa;
  if (t < 25 && Number.isFinite(h) && h >= 68) return EORZEA_LORE.blackShroud;
  if (t < 25) return EORZEA_LORE.laNoscea;
  return summerProfile.lore;
}

function temperatureStepLabel(temperature) {
  if (!Number.isFinite(temperature)) return "観測値なし";
  if (temperature < 5) return "5℃未満";
  const lower = 5 + Math.floor((temperature - 5) / 5) * 5;
  return `${lower}–${lower + 4.9}℃帯`;
}

function conversionReason(station, lore, summerProfile) {
  if (!lore || !Number.isFinite(station.temperature)) return "観測値が足りないため換算できません。";
  const t = station.temperature.toFixed(1);
  const h = Number.isFinite(station.humidity) ? `${Math.round(station.humidity)}％` : "観測なし";
  if (summerProfile?.active) {
    const humidityText = summerProfile.humidityBonus >= 0
      ? `＋ 湿度補正${summerProfile.humidityBonus.toFixed(1)}`
      : `－ 乾燥補正${Math.abs(summerProfile.humidityBonus).toFixed(1)}`;
    return `気温${t}℃ ${humidityText} － 風の軽減${summerProfile.windRelief.toFixed(1)} ＝ 暑熱換算${summerProfile.score.toFixed(1)}。${summerProfile.routeLabel}の「${summerProfile.stageLabel}（${summerProfile.rangeLabel}）」に入り、${lore.name}を選択しました。`;
  }
  const wind = Number.isFinite(station.windSpeed) ? `${station.windSpeed.toFixed(1)}m/s` : "観測なし";
  if (lore === EORZEA_LORE.garlemald) return `${t}℃は5℃未満の寒冷帯です。寒冷地帯と公式に明記されたガレマルドを選択しました。`;
  if (lore === EORZEA_LORE.ishgard) return `${t}℃を5℃刻みの寒冷側第1段階として、北方の皇都イシュガルドへ重ねました。`;
  if (lore === EORZEA_LORE.pagos) return `${t}℃の厳しい寒さを、公式に「氷雪の地」とされるフィールドへ重ねました。`;
  if (lore === EORZEA_LORE.coerthas) return `${t}℃は10.0–14.9℃帯です。雪と高地の景観を持つクルザス中央高地を選択しました。`;
  if (lore === EORZEA_LORE.orqopacha) return `${t}℃は15.0–19.9℃帯、風速${wind}は4m/s以上です。高地かつ強風の分岐としてオルコ・パチャを選択しました。`;
  if (lore === EORZEA_LORE.labyrinthos) return `${t}℃は15.0–19.9℃帯、風速${wind}は4m/s未満です。環境が調整されたラヴィリンソスを選択しました。`;
  if (lore === EORZEA_LORE.blackShroud) return `${t}℃は20.0–24.9℃帯、湿度${h}は68％以上です。湿潤な森林分岐として黒衣森を選択しました。`;
  if (lore === EORZEA_LORE.heritageFound) return `1時間雨量10mm以上かつ風速6m/s以上の割込条件です。雷雲に覆われるヘリテージファウンドを選択しました。`;
  if (lore === EORZEA_LORE.kozamaKa) return `1時間雨量3mm以上の割込条件です。河川と大瀑布を抱くコザマル・カを選択しました。`;
  if (lore === EORZEA_LORE.laNoscea) return `${t}℃は20.0–24.9℃帯、湿度${h}は森林分岐の68％未満です。海洋地域ラノシアを選択しました。`;
  return `${t}℃・湿度${h}・風速${wind}から判定条件を満たす地域を選択しました。`;
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

const DUTY_WALLPAPERS = Object.freeze({
  arr: "assets/wallpapers/a-realm-reborn.jpg",
  heavensward: "assets/wallpapers/heavensward-01.jpg",
  stormblood: "assets/wallpapers/stormblood-fankit.jpg",
  shadowbringers: "assets/wallpapers/shadowbringers-01.jpg",
  endwalker: "assets/wallpapers/endwalker-04.jpg",
  dawntrail: "assets/wallpapers/dawntrail-fankit.jpg"
});

const HEAT_DUTIES = Object.freeze([
  Object.freeze({ max: 31, name: "赤熱のブッシュファイア", tier: "火属性予兆", code: "BUSHFIRE", era: "新生エオルゼア", eraCode: "arr", wallpaper: DUTY_WALLPAPERS.arr, sourceTitle: "魔獣領域 ハラタリ修練所", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/98319325b98/", briefing: "31℃未満でも赤熱のブッシュファイア級。日陰を選び、早めに水分を補給してください。" }),
  Object.freeze({ max: 31.5, range: "31.0–31.4℃", name: "赤熱のブッシュファイア", tier: "ダンジョン", code: "BUSHFIRE", era: "新生エオルゼア", eraCode: "arr", wallpaper: DUTY_WALLPAPERS.arr, sourceTitle: "魔獣領域 ハラタリ修練所", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/98319325b98/", briefing: "31℃台前半、ハラタリの赤熱のブッシュファイア級。屋外行動を短く区切ってください。" }),
  Object.freeze({ max: 32, range: "31.5–31.9℃", name: "イフリート", tier: "討伐戦", code: "HELLFIRE", era: "新生エオルゼア", eraCode: "arr", wallpaper: DUTY_WALLPAPERS.arr, sourceTitle: "イフリート討伐戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/c3e6020e9e6/", briefing: "31℃台後半、焔神イフリートの『地獄の火炎』級。直射日光を避けてください。" }),
  Object.freeze({ max: 32.5, range: "32.0–32.4℃", name: "究極の焔神イフリート", tier: "極", code: "EXTREME IFRIT", era: "新生エオルゼア", eraCode: "arr", wallpaper: DUTY_WALLPAPERS.arr, sourceTitle: "極イフリート討滅戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/6af1a94ccca/", briefing: "32℃台前半、究極の力に覚醒した焔神級。水分と塩分を整えてください。" }),
  Object.freeze({ max: 33, range: "32.5–32.9℃", name: "インフェルノ", tier: "ダンジョン", code: "INFERNO", era: "紅蓮のリベレーター", eraCode: "stormblood", wallpaper: DUTY_WALLPAPERS.stormblood, sourceTitle: "巨砲要塞 カストルム・アバニア", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/070a1dc3c34e11d49e5ee169f002b1a4ba6849a1", briefing: "32℃台後半、カストルム・アバニアのインフェルノ級。冷房下で休憩してください。" }),
  Object.freeze({ max: 33.5, range: "33.0–33.4℃", name: "鬼神ズルワーン", tier: "討滅戦", code: "ZURVAN", era: "蒼天のイシュガルド", eraCode: "heavensward", wallpaper: DUTY_WALLPAPERS.heavensward, sourceTitle: "鬼神ズルワーン討滅戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/8ff3c52798c/", briefing: "33℃台前半、炎と氷が交錯する鬼神ズルワーン級。屋外の滞在時間を削ってください。" }),
  Object.freeze({ max: 34, range: "33.5–33.9℃", name: "魔人ベリアス", tier: "アライアンス", code: "BELIAS", era: "紅蓮のリベレーター", eraCode: "stormblood", wallpaper: DUTY_WALLPAPERS.stormblood, sourceTitle: "封じられた聖塔 リドルアナ", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/390fb10fd68/", briefing: "33℃台後半、ファイジャを操る魔人ベリアス級。冷房下で定期的に休憩してください。" }),
  Object.freeze({ max: 34.5, range: "34.0–34.4℃", name: "朱雀", tier: "征魂戦", code: "SUZAKU", era: "紅蓮のリベレーター", eraCode: "stormblood", wallpaper: DUTY_WALLPAPERS.stormblood, sourceTitle: "朱雀征魂戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/ea0f6440546/", briefing: "34℃台前半、情念の炎を燃え上がらせる朱雀級。無理な連戦を避けてください。" }),
  Object.freeze({ max: 35, range: "34.5–34.9℃", name: "極・朱雀", tier: "極", code: "EXTREME SUZAKU", era: "紅蓮のリベレーター", eraCode: "stormblood", wallpaper: DUTY_WALLPAPERS.stormblood, sourceTitle: "極朱雀征魂戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/628e9a05d34/", briefing: "34℃台後半、溶岩たぎる灼熱の虚を舞う極朱雀級。日射を避けて退避してください。" }),
  Object.freeze({ max: 35.5, range: "35.0–35.4℃", name: "ペンテシレイア", tier: "エウレカ", code: "PYROS NM", era: "紅蓮のリベレーター", eraCode: "stormblood", wallpaper: DUTY_WALLPAPERS.stormblood, sourceTitle: "禁断の地 エウレカ：ピューロス編", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/cc68719ec764e6577d5a9495908148b60618b6ae", briefing: "35℃台前半、消えることなき種火を宿すペンテシレイア級。屋外活動を再判断してください。" }),
  Object.freeze({ max: 36, range: "35.5–35.9℃", name: "ラクタパクシャ", tier: "レイド", code: "IFRIT × GARUDA", era: "漆黒のヴィランズ", eraCode: "shadowbringers", wallpaper: DUTY_WALLPAPERS.shadowbringers, sourceTitle: "希望の園エデン：共鳴編2", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/cdc9ff33eff/", briefing: "35℃台後半、焔神と嵐神が一体化した炎風級。涼しい場所へ移動してください。" }),
  Object.freeze({ max: 36.5, range: "36.0–36.4℃", name: "日神アーゼマ", tier: "アライアンス", code: "AZEYMA", era: "暁月のフィナーレ", eraCode: "endwalker", wallpaper: DUTY_WALLPAPERS.endwalker, sourceTitle: "輝ける神域 アグライア", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/b85ab23e734c5f65640c8bea29bc104fa5823a6f", briefing: "36℃台前半、紅炎と陽炎を従える日神アーゼマ級。屋外攻略を中止してください。" }),
  Object.freeze({ max: 37, range: "36.5–36.9℃", name: "商神ナルザル", tier: "アライアンス", code: "NALD'THAL", era: "暁月のフィナーレ", eraCode: "endwalker", wallpaper: DUTY_WALLPAPERS.endwalker, sourceTitle: "輝ける神域 アグライア", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/b85ab23e734c5f65640c8bea29bc104fa5823a6f", briefing: "36℃台後半、炎天の浄火を放つ商神ナルザル級。安全な屋内へ退避してください。" }),
  Object.freeze({ max: 37.5, range: "37.0–37.4℃", name: "ヴァリガルマンダ", tier: "討滅戦", code: "TURAL VIDRAAL", era: "黄金のレガシー", eraCode: "dawntrail", wallpaper: DUTY_WALLPAPERS.dawntrail, sourceTitle: "ヴァリガルマンダ討滅戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/2fc80be63e2/", briefing: "37℃台前半、火・氷・雷を振るう『生ける天災』級。不要不急の外出を避けてください。" }),
  Object.freeze({ max: 38, range: "37.5–37.9℃", name: "火の妖異ルビカンテ", tier: "討滅戦", code: "RUBICANTE", era: "暁月のフィナーレ", eraCode: "endwalker", wallpaper: DUTY_WALLPAPERS.endwalker, sourceTitle: "ルビカンテ討滅戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/247e132e8ae819b6e141b55c4d8545dc0cb2517f/", briefing: "37℃台後半、異界の火を操るルビカンテ級。屋外に留まらないでください。" }),
  Object.freeze({ max: 38.5, range: "38.0–38.4℃", name: "極・火の妖異ルビカンテ", tier: "極", code: "EXTREME RUBICANTE", era: "暁月のフィナーレ", eraCode: "endwalker", wallpaper: DUTY_WALLPAPERS.endwalker, sourceTitle: "極ルビカンテ討滅戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/0eb5dd38d5a/", briefing: "38℃台前半、天竜のエーテルをさらに喰らった極ルビカンテ級。冷房のある場所で待機してください。" }),
  Object.freeze({ max: 39, range: "38.5–38.9℃", name: "零式・フェネクス", tier: "零式", code: "SAVAGE PHOINIX", era: "暁月のフィナーレ", eraCode: "endwalker", wallpaper: DUTY_WALLPAPERS.endwalker, sourceTitle: "万魔殿パンデモニウム零式：辺獄編3", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/a0917729fae/", briefing: "38℃台後半、煉獄の炎が荒れる零式フェネクス級。冷却を最優先してください。" }),
  Object.freeze({ max: 39.5, range: "39.0–39.4℃", name: "フェニックス", tier: "レイド", code: "PHOENIX", era: "新生エオルゼア", eraCode: "arr", wallpaper: DUTY_WALLPAPERS.arr, sourceTitle: "大迷宮バハムート：真成編3", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/83a4937d0ac418022b0d980f06ed68e47e0aab2c/", briefing: "39℃台前半、転生の炎を宿すフェニックス級。直ちに涼しい場所へ移動してください。" }),
  Object.freeze({ max: 40, range: "39.5–39.9℃", name: "バハムート・プライム", tier: "レイド", code: "TERAFLARE", era: "新生エオルゼア", eraCode: "arr", wallpaper: DUTY_WALLPAPERS.arr, sourceTitle: "大迷宮バハムート：真成編4", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/83a4937d0ac418022b0d980f06ed68e47e0aab2c/", briefing: "39℃台後半、テラフレアを放つバハムート・プライム級。屋外行動を中止してください。" }),
  Object.freeze({ max: 40.5, range: "40.0–40.4℃", name: "零式・ヘファイストス", tier: "零式4層", code: "ABYSSOS SAVAGE", era: "暁月のフィナーレ", eraCode: "endwalker", wallpaper: DUTY_WALLPAPERS.endwalker, sourceTitle: "万魔殿パンデモニウム零式：煉獄編4", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/415152e3e5d/", briefing: "40℃台前半、生命神秘研究棟の零式ヘファイストス級。屋外行動を中止し、安全な屋内へ退避してください。" }),
  Object.freeze({ max: 41, range: "40.5–40.9℃", name: "絶・龍神バハムート", tier: "絶", code: "UNENDING COIL", era: "紅蓮のリベレーター", eraCode: "stormblood", wallpaper: DUTY_WALLPAPERS.stormblood, sourceTitle: "絶バハムート討滅戦", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/1a863f1ea3b/", briefing: "40℃台後半、絶望の詩で蘇る龍神バハムート級。直ちに冷房下へ退避してください。" }),
  Object.freeze({ max: Infinity, range: "41.0℃+", name: "ゲロルト", tier: "究極の武器職人", code: "RELIC FORGE", era: "紅蓮のリベレーター", eraCode: "stormblood", wallpaper: DUTY_WALLPAPERS.stormblood, sourceTitle: "禁断の地 エウレカ：ピューロス編", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/cc68719ec764e6577d5a9495908148b60618b6ae", briefing: "41℃以上、戦闘コンテンツの尺度を超えたゲロルト級。暑さを武器に鍛え直す前に、直ちに冷房下へ退避してください。" })
]);
function battleDutyForWeather(station, summerProfile) {
  const observed = Number.isFinite(station.temperature) ? station.temperature : 0;
  const heatScore = summerProfile?.active ? summerProfile.score : observed;
  const duty = HEAT_DUTIES.find(entry => heatScore < entry.max) || HEAT_DUTIES[HEAT_DUTIES.length - 1];
  return { ...duty, heatScore, isOriginal: !duty.sourceUrl };
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
  const summerProfile = summerProfileForWeather(station);
  const lore = loreForWeather(station, summerProfile);
  const area = lore ? `${lore.name}級` : "観測値不足";
  const climate = compositeClimate(station);
  const attribute = humidityAttribute(station.humidity);
  const wind = windEffect(station.temperature, station.humidity, station.windSpeed, station.precipitation1h);
  const precipitation = precipitationEffect(station.temperature, station.humidity, station.precipitation1h, station.precipitation10m);
  const threat = calculateThreat(station);
  const difficulty = difficultyForThreat(threat);
  const battleDuty = battleDutyForWeather(station, summerProfile);
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
    battleDuty,
    comment,
    category,
    officialTrait: lore?.officialTrait || "公式資料との照合対象がありません。",
    basisType: lore?.basisType || "判定不能",
    sourceTitle: lore?.sourceTitle || "",
    sourceUrl: lore?.sourceUrl || "",
    wallpaper: lore?.wallpaper || "assets/wallpapers/heavens.jpg",
    conversionReason: conversionReason(station, lore, summerProfile),
    loreTags: lore?.tags || [],
    loreEra: lore?.era || "",
    loreRegion: lore?.region || "",
    temperatureStep: temperatureStepLabel(station.temperature),
    decisionBand: summerProfile.active ? `暑熱換算 ${summerProfile.score.toFixed(1)} / ${summerProfile.routeLabel}` : temperatureStepLabel(station.temperature),
    summerProfile: summerProfile.active ? summerProfile : null,
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
