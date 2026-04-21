# TemplateMCP 仕様書

## 概要

このプロジェクトは、AI（MCP）と人間（Web UI）が同じデータベース（SQLite）を共有し、それぞれの役割で操作を行うアプリケーションのテンプレートです。

## データベース仕様

### Person
- `id` (Int, Primary Key): 自動生成
- `name` (String): 人物の名前

### FavoriteFood
- `id` (Int, Primary Key): 自動生成
- `name` (String): 料理名
- `personId` (Int, Foreign Key): `Person` への参照

## MCP ツール仕様

### `greet_and_suggest_all`

- **目的**: 全員への挨拶とメニュー提案
- **動作**: データベースから全 `Person` とそれに関連する `FavoriteFood` を取得し、一人ひとりに向けたパーソナライズされたメッセージを生成して返します。

## 管理画面仕様

- **Dashboard**: 登録済みの人物と好物の一覧を表示
- **Add Form**: 新しい人物とその好物を同時に登録（Next.js Server Actions）

## 拡張ポイント

- **gRPC対応**: `mcp-server` のトランスポートを gRPC に変更することで、ネットワーク越しの利用が可能になります。
- **認証**: `admin-ui` に Auth.js 等を導入することで、管理者の制限が可能です。
- **DB拡張**: `prisma/schema.prisma` にモデルを追加することで、容易に機能を拡張できます。
