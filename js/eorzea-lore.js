const EORZEA_LORE = Object.freeze({
  pagos: Object.freeze({
    id: "pagos", name: "エウレカ：パゴス帯", era: "STORMBLOOD", region: "禁断の地 エウレカ",
    officialTrait: "公式パッチノートで「氷雪の地」と表現される、禁断の地 エウレカの寒冷フィールド。",
    basisType: "公式本文", sourceTitle: "4.36パッチノート", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/1389ba65ad08e5baab22d03f7eb0892bd042be37/",
    wallpaper: "assets/wallpapers/heavensward-01.jpg", tags: ["氷雪", "極寒", "探索型コンテンツ"],
    model: { temperature: -6, humidity: 65, rain: 1, wind: 4 }
  }),
  garlemald: Object.freeze({
    id: "garlemald", name: "ガレマルド", era: "ENDWALKER", region: "イルサバード大陸北部",
    officialTrait: "イルサバード大陸北部に広がる「寒冷地帯」と公式本文に明記された地域。",
    basisType: "公式本文", sourceTitle: "暁月のフィナーレ 新たな冒険の舞台", sourceUrl: "https://jp.finalfantasyxiv.com/endwalker/patch_6_0",
    wallpaper: "assets/wallpapers/endwalker-04.jpg", tags: ["寒冷地帯", "北部", "廃墟"],
    model: { temperature: 1, humidity: 55, rain: 0, wind: 5 }
  }),
  ishgard: Object.freeze({
    id: "ishgard", name: "皇都イシュガルド", era: "HEAVENSWARD", region: "クルザス中央高地",
    officialTrait: "ドラゴン族との戦いを続ける皇都。剣と槍を掲げる騎士の国として公式に紹介されている。",
    basisType: "公式本文", sourceTitle: "蒼天のイシュガルド 公式サイト", sourceUrl: "https://jp.finalfantasyxiv.com/heavensward/",
    wallpaper: "assets/wallpapers/heavensward-01.jpg", tags: ["皇都", "騎士の国", "北方"],
    model: { temperature: 7, humidity: 66, rain: 1, wind: 4 }
  }),
  coerthas: Object.freeze({
    id: "coerthas", name: "クルザス中央高地", era: "HEAVENSWARD", region: "アルデナード北部",
    officialTrait: "北方のクルザスに属する地域。雪と高地の景観は公式紹介画像をもとに照合。",
    basisType: "公式画像からの景観推定", sourceTitle: "蒼天のイシュガルド ストーリー", sourceUrl: "https://jp.finalfantasyxiv.com/heavensward/sp/story/",
    wallpaper: "assets/wallpapers/heavensward-01.jpg", tags: ["雪景観", "高地", "北方"],
    model: { temperature: 8, humidity: 62, rain: 1, wind: 5 }
  }),
  orqopacha: Object.freeze({
    id: "orqopacha", name: "オルコ・パチャ", era: "DAWNTRAIL", region: "ヨカ・トラル",
    officialTrait: "ヨカ・トラルの山岳地帯。トラル大陸最高峰とされる霊峰ウォーコー・ゾーモーがそびえる。",
    basisType: "公式本文", sourceTitle: "黄金のレガシー WORLD", sourceUrl: "https://jp.finalfantasyxiv.com/dawntrail/world/",
    wallpaper: "assets/wallpapers/heavens.jpg", tags: ["山岳", "最高峰", "高地"],
    model: { temperature: 15, humidity: 50, rain: 0, wind: 6 }
  }),
  labyrinthos: Object.freeze({
    id: "labyrinthos", name: "ラヴィリンソス", era: "ENDWALKER", region: "オールド・シャーレアン地下",
    officialTrait: "文献や資料を保管する巨大地下空間で、エーテル学的に環境が調整されている。",
    basisType: "公式本文", sourceTitle: "暁月のフィナーレ 新たな冒険の舞台", sourceUrl: "https://jp.finalfantasyxiv.com/endwalker/patch_6_0",
    wallpaper: "assets/wallpapers/endwalker-04.jpg", tags: ["地下空間", "環境調整", "安定"],
    model: { temperature: 21, humidity: 52, rain: 0, wind: 2 }
  }),
  blackShroud: Object.freeze({
    id: "black-shroud", name: "黒衣森", era: "A REALM REBORN", region: "アルデナード東部",
    officialTrait: "グリダニアが領する、うっ蒼とした森林地帯。無数の運河と水車をもつ土地として紹介される。",
    basisType: "公式本文", sourceTitle: "新生エオルゼア 都市と地域", sourceUrl: "https://jp.finalfantasyxiv.com/a_realm_reborn/world/locations",
    wallpaper: "assets/wallpapers/endwalker-04.jpg", tags: ["森林", "運河", "木陰"],
    model: { temperature: 20, humidity: 70, rain: 1, wind: 2 }
  }),
  laNoscea: Object.freeze({
    id: "la-noscea", name: "ラノシア", era: "A REALM REBORN", region: "バイルブランド島南部",
    officialTrait: "リムサ・ロミンサが領する海洋地域。湾、小島、岩礁に囲まれた海辺の環境。",
    basisType: "公式本文", sourceTitle: "新生エオルゼア 都市と地域", sourceUrl: "https://jp.finalfantasyxiv.com/a_realm_reborn/world/locations",
    wallpaper: "assets/wallpapers/endwalker-01.jpg", tags: ["海洋", "海風", "島嶼"],
    model: { temperature: 25, humidity: 65, rain: 0, wind: 4 }
  }),
  tulliyollal: Object.freeze({
    id: "tulliyollal", name: "トライヨラ", era: "DAWNTRAIL", region: "ヨカ・トラル",
    officialTrait: "トラル大陸を統治する連王国の王都。多様な民が集う新大陸側の冒険拠点として扱われる。",
    basisType: "公式地域名＋都市設定", sourceTitle: "黄金のレガシー WORLD", sourceUrl: "https://jp.finalfantasyxiv.com/dawntrail/world/",
    wallpaper: "assets/wallpapers/heavens.jpg", tags: ["王都", "新大陸", "多民族都市"],
    model: { temperature: 27, humidity: 74, rain: 1, wind: 3 }
  }),
  kozamaKa: Object.freeze({
    id: "kozama-ka", name: "コザマル・カ", era: "DAWNTRAIL", region: "ヨカ・トラル南部",
    officialTrait: "密林地帯を大小の河川が流れ、大瀑布を作る水量豊かなフィールド。",
    basisType: "公式本文", sourceTitle: "黄金のレガシー WORLD", sourceUrl: "https://jp.finalfantasyxiv.com/dawntrail/world/",
    wallpaper: "assets/wallpapers/mist.jpg", tags: ["密林", "河川", "大瀑布"],
    model: { temperature: 27, humidity: 82, rain: 8, wind: 3 }
  }),
  yakTel: Object.freeze({
    id: "yak-tel", name: "ヤクテル樹海", era: "DAWNTRAIL", region: "ヨカ・トラル南東部",
    officialTrait: "山脈を越えた先の深い森。低地は樹冠に阻まれて太陽光が届かず、天然の井戸セノーテが点在する。",
    basisType: "公式本文", sourceTitle: "黄金のレガシー WORLD", sourceUrl: "https://jp.finalfantasyxiv.com/dawntrail/world/",
    wallpaper: "assets/wallpapers/mist.jpg", tags: ["深い森", "日照遮断", "セノーテ"],
    model: { temperature: 25, humidity: 84, rain: 2, wind: 1 }
  }),
  thavnair: Object.freeze({
    id: "thavnair", name: "サベネア島", era: "ENDWALKER", region: "豊穣海南東",
    officialTrait: "公式本文で「高温多湿」と明記され、海岸から離れると鬱蒼とした密林が広がる島。",
    basisType: "公式本文", sourceTitle: "暁月のフィナーレ 新たな冒険の舞台", sourceUrl: "https://jp.finalfantasyxiv.com/endwalker/patch_6_0",
    wallpaper: "assets/wallpapers/endwalker-01.jpg", tags: ["高温多湿", "密林", "近東"],
    model: { temperature: 31, humidity: 79, rain: 1, wind: 2 }
  }),
  heritageFound: Object.freeze({
    id: "heritage-found", name: "ヘリテージファウンド", era: "DAWNTRAIL", region: "アレクサンドリア領",
    officialTrait: "異常なほど雷気に満たされ、分厚い雷雲で陽光がほとんど差し込まない地域。",
    basisType: "公式本文", sourceTitle: "黄金のレガシー WORLD", sourceUrl: "https://jp.finalfantasyxiv.com/dawntrail/world/",
    wallpaper: "assets/wallpapers/eternity.jpg", tags: ["雷気", "雷雲", "日照遮断"],
    model: { temperature: 24, humidity: 78, rain: 12, wind: 7 }
  }),
  shaaloni: Object.freeze({
    id: "shaaloni", name: "シャーローニ荒野", era: "DAWNTRAIL", region: "トラル大陸中央部",
    officialTrait: "降雨量が少なく荒涼とした土地が続く乾燥地帯。湖の周囲だけは草木が茂る。",
    basisType: "公式本文", sourceTitle: "黄金のレガシー WORLD", sourceUrl: "https://jp.finalfantasyxiv.com/dawntrail/world/",
    wallpaper: "assets/wallpapers/heavens.jpg", tags: ["乾燥地帯", "少雨", "荒野"],
    model: { temperature: 32, humidity: 31, rain: 0, wind: 5 }
  }),
  uldah: Object.freeze({
    id: "uldah", name: "砂の都ウルダハ", era: "A REALM REBORN", region: "ザナラーン",
    officialTrait: "荒涼とした砂漠地帯ザナラーンの中央に築かれた交易都市。都市と周辺地域の対比を暑熱演出に採用。",
    basisType: "公式本文", sourceTitle: "新生エオルゼア 都市と地域", sourceUrl: "https://jp.finalfantasyxiv.com/a_realm_reborn/world/locations",
    wallpaper: "assets/wallpapers/shadowbringers-01.jpg", tags: ["砂の都", "交易都市", "ザナラーン"],
    model: { temperature: 32, humidity: 52, rain: 0, wind: 2 }
  }),
  southernThanalan: Object.freeze({
    id: "southern-thanalan", name: "南ザナラーン", era: "A REALM REBORN", region: "アルデナード南部",
    officialTrait: "ザナラーンは公式に「荒涼とした砂漠地帯」と紹介される。サゴリー砂漠を含む南部を暑熱候補に採用。",
    basisType: "公式本文＋地域対応", sourceTitle: "新生エオルゼア 都市と地域", sourceUrl: "https://jp.finalfantasyxiv.com/a_realm_reborn/world/locations",
    wallpaper: "assets/wallpapers/shadowbringers-01.jpg", tags: ["砂漠", "荒涼", "日射"],
    model: { temperature: 34, humidity: 43, rain: 0, wind: 3 }
  }),
  amhAraeng: Object.freeze({
    id: "amh-araeng", name: "アム・アレーン", era: "SHADOWBRINGERS", region: "第一世界・ノルヴラント",
    officialTrait: "第一世界ノルヴラントの地域。強い砂漠景観は公式紹介画像をもとにした連想。",
    basisType: "公式画像からの景観推定", sourceTitle: "漆黒のヴィランズ 新エリア", sourceUrl: "https://jp.finalfantasyxiv.com/shadowbringers/story/",
    wallpaper: "assets/wallpapers/shadowbringers-01.jpg", tags: ["砂漠景観", "光の氾濫", "極暑候補"],
    model: { temperature: 39, humidity: 25, rain: 0, wind: 3 }
  }),
  pyros: Object.freeze({
    id: "pyros", name: "エウレカ：ピューロス帯", era: "STORMBLOOD", region: "禁断の地 エウレカ",
    officialTrait: "公式パッチノートで「氷炎の地」と表現される、属性の力が乱れた特殊フィールド。単純な灼熱地域ではない。",
    basisType: "公式本文", sourceTitle: "4.45パッチノート", sourceUrl: "https://jp.finalfantasyxiv.com/lodestone/topics/detail/cc68719ec764e6577d5a9495908148b60618b6ae",
    wallpaper: "assets/wallpapers/eternity.jpg", tags: ["氷炎", "属性乱流", "特殊環境"],
    model: { temperature: 36, humidity: 45, rain: 0, wind: 6 }
  })
});

const EORZEA_LORE_LIST = Object.freeze(Object.values(EORZEA_LORE));
