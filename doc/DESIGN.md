# LLM Interview - 設計仕様書

## プロジェクト概要
**プロジェクト名**: llm-interview  
**概要**: フラッシュカード形式のLLM面接対策アプリケーション（PC/スマートフォン対応）  
**フレームワーク**: Remix (React Router v7) + TypeScript  
**データ管理**: 
- 質問データ: JSONファイル
- ユーザー学習データ: ローカルストレージ

## アーキテクチャ

### 技術スタック
- **フロントエンド**: Remix, React, TypeScript
- **スタイリング**: Tailwind CSS
- **データ永続化**: localStorage API
- **ビルドツール**: Vite

### ディレクトリ構造
```
llm-interview/
├── app/
│   ├── routes/           # ページコンポーネント
│   ├── components/       # 共通コンポーネント
│   ├── types/           # TypeScript型定義
│   ├── utils/           # ユーティリティ関数
│   ├── hooks/           # カスタムフック
│   └── data/            # JSONデータ
├── public/
└── doc/                 # 設計ドキュメント
    ├── DESIGN.md        # 本ファイル（概要・アーキテクチャ）
    ├── UI-SPEC.md       # @doc/UI-SPEC.md
    ├── DATA-SPEC.md     # @doc/DATA-SPEC.md
    └── FEATURE.md       # @doc/FEATURE.md
```

## データ永続化戦略
- 自動保存: 各アクション後に即座に保存
- データ圧縮: 大量データ時はLZ-string使用検討
- バージョニング: データ構造変更時の移行処理

## パフォーマンス最適化

### 1. 遅延読み込み
- ルートベースのコード分割
- 画像の遅延読み込み

### 2. キャッシュ戦略
- 質問データのメモリキャッシュ
- Service Workerによるオフライン対応

### 3. 最適化目標
- First Contentful Paint: < 1.5s
- Time to Interactive: < 3.0s
- Lighthouse Score: > 90

## 詳細仕様

### UI/UX仕様
詳細な画面レイアウト、コンポーネント設計、インタラクション仕様については以下を参照：
@doc/UI-SPEC.md

### データ仕様
データモデル、状態管理、API設計については以下を参照：
@doc/DATA-SPEC.md

### 機能仕様
ヒント機能、SM-2アルゴリズム、学習セッション管理については以下を参照：
@doc/FEATURE.md

## セキュリティ考慮事項

### 1. データ保護
- ローカルストレージの暗号化は不要（個人学習データのため）
- XSS対策: React標準のエスケープ処理