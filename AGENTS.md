# Brass Wings の開発ルール

このリポジトリ全体に適用する。開発タスクでは [.agents/skills/brass-wings-development/SKILL.md](.agents/skills/brass-wings-development/SKILL.md) を使用する。起動・セットアップ用の `start_skill` が提供されている環境では最初に使用する。検証環境の準備と既知の制約は [DEVELOPMENT.md](DEVELOPMENT.md) を参照する。

- 指定機能の入口、既存の実装、保存データ、テストを調べてから設計・実装する。軽微な判断と不具合の再修正は自律的に進め、ゲームの方向性を変える判断はユーザーに確認する。
- ゲーム本体の編集元は `Brass_Wings_Homeward (5).html`。ゲームの実行に必要なコードと素材はこの単体HTMLに収める。
- 修正後に自動テストを実行し、Chromiumのスクリーンショットと操作結果を確認する。問題を修正した場合は影響する検証を繰り返す。
- 検証済みの編集元から `BrassWings-preview.html` を作成し、利用者が取得できるファイルを毎回納品する。
- 作業ブランチで開発し、検証後にコミット・PushしてPull Requestを提出する。mainへの直接変更は禁止する。マージにはユーザーの明示的な承認を要する。
- 完了報告には変更内容、自動テスト結果、ビジュアル検証結果、HTML取得方法、PRのURL、残存不具合・未検証事項を記載する。
