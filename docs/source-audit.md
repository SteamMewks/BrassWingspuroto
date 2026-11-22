# 資料・ブランチの整理候補

基点は PR #14 マージ後の d46e6752e7a8544d4bfecc85887b26936f2de5ab。ゲームの開発入口は ARCHITECTURE.md。以下の資料は今回すべて保存する。

| 区分 | 対象 | 判断と削除時の影響 |
| --- | --- | --- |
| 現行の参照資料 | continental-registry.md、continental-outposts.png、world-area-streaming.md、mystery/README.md | 拠点配置、区画管理、遺構と探訪の仕様確認に使う |
| 開発履歴 | industrial-render、relief、tributary、watersheds、terrain、landscape、railway、copper-pass、continental、world-area、mystery 配下の比較図・計測記録 | 描画・性能の比較条件や旧画面を再現するために保存。現行仕様との相違があり得る |
| 重複の整理候補 | common-airbases.jpg と continental-airfields.jpg | 旧8基地と大陸拡張後の基地で役割が重なる。旧画像を消すと DEVELOPMENT.md の履歴リンクが切れる |
| 重複の整理候補 | operation-layouts.jpg と mystery/layouts.jpg | 端末別レイアウトを示すが、作戦と探訪で対象画面が異なる。削除すると当時の画面検証を失う |
| 一時ファイル | docs/ の追跡対象に明確な一時出力は見つからなかった | 比較用の before 画像も履歴として保存する |

ブランチ先端の main への到達性を git merge-base で確認した。次の11本は main に統合済みで、作業終了を所有者が確認した後の削除候補。削除すると旧ブランチ名での参照が失われる。

- brass-wings-stability、codex/common-airbases、codex/world-area-streaming
- continental-ocean、copper-pass、development-workflow、feat/mystery-coasts
- industrial-railways、natural-landscapes、watershed-relief、world-100km

continental-tributaries と industrial-render の先端はこの main の祖先ではない。履歴に同名の作業があっても統合済みとは判定せず、保留する。
