# 酷炎天迎撃戦

現在地に最も近い気象庁アメダス観測地点の気温・湿度・風・降水を取得し、「今の暑さはFFXIVのどの炎属性ボス級か」を演出する非公式ファンサイトです。

公開URL: https://spthx.github.io/eorzea-weather/

## 主な機能

- 現在地に近いアメダス観測地点を端末内で選択
- 31.0℃から41.0℃以上まで、0.5℃刻みで炎属性ボス級を判定
- 40.0℃以上を「酷暑日級」、41.0℃以上をゲロルト級として演出
- 観測値の確定後、気温・暑さ区分・ボス級を約2秒で表示する突入演出
- 現在地側と熊谷市を同一観測時刻で比較
- 全国気温・独自湿熱値・独自ギミック強度ランキング
- 判定コンテンツの実装時期に合わせた公式画像・ファンキット背景
- エオルゼア時間、ターゲット詠唱バー、ステータス効果、LIMITゲージ風の気候HUD
- 現在地・全国最高気温地点・熊谷・ボス判定表で構成するLIGHT PARTY風リスト

## 位置情報とデータ

ブラウザの位置情報は、端末内で最寄りの観測地点を選ぶためだけに使用します。緯度・経度を保存せず、本サイト独自のサーバーにも送信しません。初回の許可後は観測地点IDだけを `localStorage` に保存し、次回から位置情報の再確認を省略します。「現在地を更新」を押したときだけ再取得します。

表示値は現在地そのものではなく、選ばれた気象庁アメダス観測地点の観測値です。

## FF14コンテンツの扱い

敵名、コンテンツ名、実装時期の確認にはFFXIV公式データベースまたは公式パッチノートを使用しています。現実の気温と各ボスを結ぶ0.5℃境界、炎属性ボス級、環境ギミック強度は本サイト独自の演出です。

「酷暑日」は気象庁が定めた「日最高気温40℃以上の日」の名称です。本サイトの「酷暑日級」は現在の観測気温が40℃以上になった場合の演出表現であり、気象庁の統計区分そのものではありません。

主な公式資料:

- [気象庁 — 最高気温が40℃以上の日の名称を「酷暑日」に決定](https://www.jma.go.jp/jma/press/2604/17a/40degree_name.html)
- [魔獣領域 ハラタリ修練所](https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/98319325b98/)
- [万魔殿パンデモニウム零式：煉獄編4](https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/415152e3e5d/)
- [絶バハムート討滅戦](https://jp.finalfantasyxiv.com/lodestone/playguide/db/duty/1a863f1ea3b/)
- [禁断の地 エウレカ：ピューロス編／ゲロルト](https://jp.finalfantasyxiv.com/lodestone/topics/detail/cc68719ec764e6577d5a9495908148b60618b6ae)

## 判定背景

判定されたコンテンツの実装拡張に合わせて、新生／蒼天／紅蓮／漆黒／暁月／黄金の公式画像またはFFXIVファンキット画像へ背景を切り替えます。紅蓮・黄金の画像は公式ファンキットのSNS用ヘッダー、新生画像は新生エオルゼア公式サイト掲載画像です。

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