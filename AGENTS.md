# Brass Wings の開発ルール

このリポジトリ全体に適用する。開発タスクでは [.agents/skills/brass-wings-development/SKILL.md](.agents/skills/brass-wings-development/SKILL.md) を使用する。起動・セットアップ用の `start_skill` が提供されている環境では最初に使用する。検証環境の準備と既知の制約は [DEVELOPMENT.md](DEVELOPMENT.md) を参照する。

- 指定機能の入口、既存の実装、保存データ、テストを調べてから設計・実装する。軽微な判断と不具合の再修正は自律的に進め、ゲームの方向性を変える判断はユーザーに確認する。
- 最初に ARCHITECTURE.md とディレクトリ構成から対象機能を決める。ゲームの編集元は src/ のみ。識別子を rg で検索し、必要なモジュールと行だけを開く。
- src/data/ の巨大な生成データ、配布HTML、過去の docs/ は通常のコード調査から除外する。同じファイルの全文再読を避け、diff は対象のパス・範囲に限定する。
- 修正後に自動テストを実行し、Chromiumのスクリーンショットと操作結果を確認する。問題を修正した場合は影響する検証を繰り返す。
- node scripts/build.js で互換HTMLと配布用HTMLを生成してから検証し、 `BrassWings-preview.html` を利用者が取得できる形で納品する。
- 作業ブランチで開発し、検証後にコミット・PushしてPull Requestを提出する。mainへの直接変更は禁止する。マージにはユーザーの明示的な承認を要する。
- 完了報告には変更内容、自動テスト結果、ビジュアル検証結果、HTML取得方法、PRのURL、残存不具合・未検証事項を記載する。
- 報告は結果の要約と失敗箇所に絞り、HTML全文や大量のログは貼らない。
