# Astryxの適用範囲

参照したプロジェクト: https://github.com/meta/astryx

2026年11月10日に公開READMEと、導入した0.7.11のCLIドキュメントでAPIを確認した。AstryxはReact 19以上を前提とするUIシステムで、コンポーネント、テーマのCSS変数、操作やアクセシビリティの規約を提供する。FFXIVの画像や気象データを提供するライブラリではない。

## 実装

- 実際に使う部品: Theme、Button、Typeahead、SegmentedControl、Switch、Banner、Badge、Toast、InternationalizationProvider。
- 地点検索はTypeaheadのSearchSourceを利用する。地名の完全一致と前方一致を優先し、複数語と全角空白にも対応する。
- 日本語カタログを読み込み、検索結果や通知のアクセシブルな名前も日本語にする。
- 設定は即時反映。保存失敗時は成功扱いにしない。保存解除の通知には「元に戻す」を置く。
- 暗色・金・青緑のテーマを既存のFFXIVアートに合わせ、データの文字は動かさない。

既存のブラウザ用JavaScriptとReactの操作部品は、eorzea:state / eorzea:actionイベントで接続する。気象庁への通信や位置情報の処理は既存側で一元管理し、React側では重複取得しない。React部品を読み込めない場合は従来の操作欄を表示する。

## ビルドと権利表記

`npm ci` のあと `npm run build` でUIとCloudflare用の配布フォルダを生成する。UIの配布物はassets/uiにあり、GitHub Pagesでも同じファイルを利用する。

利用バージョンはpackage-lock.jsonで固定する。配布する依存コードのライセンスはassets/ui/vendor-licenses.txtとastryx.js.LEGAL.txtに同梱する。AstryxはMIT License、Copyright Meta Platforms, Inc. and affiliates。

## 今後の確認

Astryxは現在ベータ版。更新時はCLIの該当コンポーネント資料を確認し、検索のキーボード操作、スマホの候補表示、通知の取り消し、縮小モーションを再確認する。
