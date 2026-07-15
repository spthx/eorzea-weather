# 灼熱デバフ討滅戦 — エオルゼア気候観測局

現在地に最も近い気象庁アメダス観測地点の気温・湿度・風・降水を取得し、FFXIV公式の地域紹介を根拠に「今の暑さはエオルゼアで言うと何級か」を演出する非公式ファンサイトです。

公開URL: https://spthx.github.io/eorzea-weather/

## 主な機能

- 現在地に近いアメダス観測地点を端末内で選択
- 現在地側、宮崎市、熊谷市を同一観測時刻で比較
- 全国気温・独自湿熱値・独自ギミック強度ランキング
- 気温、湿度、風、降水を使ったエオルゼア地域換算
- 15地域の公式設定と独自換算モデルを分離表示する「気候フィールド図鑑」
- エオルゼア時間、ターゲット詠唱バー、ステータス効果、LIMITゲージ風の気候HUD
- 現在地・宮崎・熊谷・設定資料で構成するLIGHT PARTY風リスト
- クエストジャーナル風の設定監査導線

## 位置情報とデータ

ブラウザの位置情報は、端末内で最寄りの観測地点を選ぶためだけに使用します。緯度・経度を保存せず、本サイト独自のサーバーにも送信しません。表示値は現在地そのものではなく、気象庁アメダス観測地点の観測値です。

## FF14設定の扱い

公式本文・公式画像から確認できる地域設定と、本サイト独自の℃境界・湿度補正・ギミック強度を明確に分離しています。FFXIVに公式の摂氏換算表が存在するという意味ではありません。

主な公式資料:

- [新生エオルゼア 都市と地域](https://jp.finalfantasyxiv.com/a_realm_reborn/world/locations)
- [漆黒のヴィランズ 新エリア](https://jp.finalfantasyxiv.com/shadowbringers/story/)
- [暁月のフィナーレ 新たな冒険の舞台](https://jp.finalfantasyxiv.com/endwalker/patch_6_0)
- [黄金のレガシー WORLD](https://jp.finalfantasyxiv.com/dawntrail/world/)
- [4.36パッチノート — エウレカ：パゴス](https://jp.finalfantasyxiv.com/lodestone/topics/detail/1389ba65ad08e5baab22d03f7eb0892bd042be37/)
- [4.45パッチノート — エウレカ：ピューロス](https://jp.finalfantasyxiv.com/lodestone/topics/detail/cc68719ec764e6577d5a9495908148b60618b6ae)

## ローカル確認

```powershell
python -m http.server 4173
```

`http://127.0.0.1:4173/` を開きます。

## 権利表記

本サイトは非公式・非営利のファンサイトです。画像はFFXIVファンキット素材を使用しています。

- 気象データ: [気象庁](https://www.jma.go.jp/)
- 画像: [FFXIVファンキット](https://jp.finalfantasyxiv.com/lodestone/special/fankit/twitter_kit/)
- [ファイナルファンタジーXIV 著作物利用条件](https://support.jp.square-enix.com/rule.php?id=5381&la=0&tag=authc)
- © SQUARE ENIX

FINAL FANTASY is a registered trademark of Square Enix Holdings Co., Ltd.
