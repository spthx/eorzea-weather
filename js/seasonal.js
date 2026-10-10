const WEATHER_BANDS = Object.freeze([
  { max: -15, range: "−15℃未満", title: "極シヴァの冷気", label: "厳しい寒さ", tone: "frost", lore: "pagos", description: "氷神の一戦を思わせる、凍てつく空気。", sourceTitle: "極シヴァ討滅戦／2.4パッチノート", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/83a4937d0ac418022b0d980f06ed68e47e0aab2c/" },
  { max: -5, range: "−15℃以上・−5℃未満", title: "パゴスの氷雪", label: "氷点下の寒さ", tone: "frost", lore: "pagos", description: "氷雪の地を旅するような、深い寒さ。" },
  { max: 0, range: "−5℃以上・0℃未満", title: "ガレマルドの冬", label: "氷点下", tone: "frost", lore: "garlemald", description: "北の寒冷地帯を思い浮かべる、身の引き締まる空気。" },
  { max: 5, range: "0℃以上・5℃未満", title: "イシュガルドの冷気", label: "寒い", tone: "cold", lore: "ishgard", description: "皇都の石畳を歩くような、冷たい空気。" },
  { max: 10, range: "5℃以上・10℃未満", title: "クルザスの朝", label: "肌寒い", tone: "cold", lore: "coerthas", description: "高地の朝を思わせる肌寒さ。上着を選びたくなる気温。" },
  { max: 15, range: "10℃以上・15℃未満", title: "オルコ・パチャの涼風", label: "涼しい", tone: "cool", lore: "orqopacha", description: "山々の景色に重ねたくなる、ひんやりした空気。" },
  { max: 20, range: "15℃以上・20℃未満", title: "黒衣森の木陰", label: "穏やかな気温", tone: "mild", lore: "blackShroud", description: "森の小道をゆっくり歩くような、穏やかな気温。" },
  { max: 25, range: "20℃以上・25℃未満", title: "ラノシアの海風", label: "暖かい", tone: "mild", lore: "laNoscea", description: "港や海辺の景色が似合う、暖かい空気。" },
  { max: 28, range: "25℃以上・28℃未満", title: "ウルダハの陽気", label: "暑さを感じる気温", tone: "warm", lore: "uldah", description: "砂の都のにぎわいを思わせる、熱を帯びた空気。" },
  { max: 31, range: "28℃以上・31℃未満", title: "サベネア島の熱気", label: "暑い", tone: "warm", lore: "thavnair", description: "南の島に重ねたくなる暑さ。湿度や風もあわせて確認を。" }
]);

function describeWeather(station) {
  const t = station.temperature;
  if (!Number.isFinite(t)) return { title: "気温の観測なし", label: "欠測", tone: "mild", range: "判定できません", description: "この地点の気温を取得できませんでした。", wallpaper: DUTY_WALLPAPERS.endwalker };
  if (t >= 31) {
    const duty = HEAT_DUTIES.find(entry => t < entry.max) || HEAT_DUTIES[HEAT_DUTIES.length - 1];
    return { title: `${duty.name}級の暑さ`, label: t >= 40 ? "酷暑日級" : t >= 35 ? "猛暑日級" : "真夏日級", tone: t >= 38 ? "extreme" : "heat", range: duty.range, description: t >= 41 ? "暑さのたとえは、ついに武器職人の鍛冶場へ。" : "炎を扱う者たちの戦いに重ねたくなる、強い熱気。", wallpaper: duty.wallpaper, sourceTitle: duty.sourceTitle, sourceUrl: duty.sourceUrl };
  }
  const band = WEATHER_BANDS.find(entry => t < entry.max);
  const lore = EORZEA_LORE[band.lore];
  const era = { "A REALM REBORN": "arr", HEAVENSWARD: "heavensward", STORMBLOOD: "stormblood", SHADOWBRINGERS: "shadowbringers", ENDWALKER: "endwalker", DAWNTRAIL: "dawntrail" }[lore.era];
  return { ...band, wallpaper: t < -15 ? DUTY_WALLPAPERS.arr : DUTY_WALLPAPERS[era], sourceTitle: band.sourceTitle || lore.sourceTitle, sourceUrl: band.sourceUrl || lore.sourceUrl };
}

function observedConditions(station) {
  const parts = [];
  if (Number.isFinite(station.precipitation1h)) parts.push(station.precipitation1h > 0 ? `1時間に${station.precipitation1h.toFixed(1)}mmの降水` : "直近1時間の降水なし");
  if (Number.isFinite(station.snowDepth) && station.snowDepth > 0) parts.push(`積雪${Math.round(station.snowDepth)}cm`);
  if (Number.isFinite(station.windSpeed)) parts.push(station.windSpeed === 0 ? "風は静穏" : `風速${station.windSpeed.toFixed(1)}m/s`);
  return parts.length ? parts.join(" ／ ") : "雨や風の観測値はありません。";
}
