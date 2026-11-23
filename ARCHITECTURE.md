# BRASSWings 開発マップ

ゲームの編集元は `src/`。下表で対象を決め、例えば `rg -n 'function advance' src/flight` で入口を探す。

| 場所 | 責務と入口 |
| --- | --- |
| src/index.template.html、styles/main.css | DOM と縦・横・PCのレイアウト |
| src/core | state が共有状態を用意し、start の titleScreen と frame が起動・更新する |
| src/flight | controls・gestures は入力、advance は飛行物理、hitObject は衝突、deckAssist は離着艦 |
| src/combat | enemies の moveEnemy は敵AI、patrol の fight は局地戦・射撃・拠点解放 |
| src/world | coordinates・outposts・settlements・affiliations・decks は世界座標・地域・拠点・所属、terrain は地形復号と地表判定、streaming の buildWorld / updateWorld は周辺区画を更新。coasts・sea・rivers は水域、railway・towns は交通と街、landmarks は遺構形状と接触 |
| src/render | frame の draw が画面を合成。surface は WebGL バッファ、scenery は景物、railway は鉄道、aircraft・sprites・spray は機体・効果 |
| src/ui | screens の titleScreen / startFlight が画面遷移、atlas・minimap は地図、journal は探訪記録の表示 |
| src/systems | save.js の localStorage 読み込みと saveAdventure が進行・発見を永続化。audio.js が音声を制御 |
| src/data | 地形・海岸・水系・鉄道・都市などのデータ。識別子とファイル名が対応する。通常は開かない |
| tools/relief | 測量・地形再生成用。通常ビルドには不要。再生成時は build.py、bake-rail.cjs の順でデータを更新する |

## ビルドと検証

`node scripts/build.js` は Node.js 標準機能だけで CSS と JS をテンプレートに埋め込み、直下の BrassWings-preview.html と互換名 Brass_Wings_Homeward (5).html を生成する。両方とも追跡対象。配布には preview を使用する。

JS は src/script-order.json の順で元と同じ classic script に連結する。各ファイルのトップレベル宣言と初期化はスコープを共有する。個別に module 化したり、ファイルを名前順に並べたりすると初期化順が変わる。

Chromium と Playwright の準備は DEVELOPMENT.md の「再現方法」。ビルド後に `CHROMIUM_PATH=/usr/bin/chromium node tests/smoke.cjs` で飛行・戦闘、同じ環境で tests/visual.cjs で画面と入力を確認する。関連する tests/ の地形・拠点・探訪などの検証も実行する。

調査例は `rg -n -g '!**/data/**' 'saveAdventure' src/`。巨大データに一致があり得る場合は `rg -l` でファイル名だけ取得する。生成物と過去資料はコード検索の対象外とし、個別の検証記録は必要時だけ開く。

生成物の更新漏れと結合後の構文は `node tests/build.cjs` で検出できる。資料と旧ブランチの整理候補は [docs/source-audit.md](docs/source-audit.md) に記録している。

町村飛行場・本拠地・航空基地・空母の座標、サービス、所属とセーブ仕様は [冒険の拠点台帳](docs/adventure-registry.md) を参照。
