# BudgetPace

Zaim連携の家計管理アプリ。目標予算に対する支出ペースを管理・分析します。

## 機能

- **ダッシュボード**: 今月の支出状況を一目で確認
- **ペース分析**: 「今のペースだと月末に○○円」の予測表示
- **カテゴリ別予算**: カテゴリごとに月の予算目標を設定
- **進捗トラッキング**: 目標に対して何%使ったか可視化
- **アラート**: 予算オーバーペースの警告
- **明細表示**: 支出明細一覧（Zaim連携または手動入力）

## 技術スタック

- Expo (React Native)
- TypeScript
- expo-router (ファイルベースルーティング)
- AsyncStorage (ローカルデータ保存)
- react-native-chart-kit (グラフ)
- lucide-react-native (アイコン)

## セットアップ

```bash
# インストール
npm install

# 開発サーバー起動
npm start

# iOS
npm run ios

# Android
npm run android
```

## Zaim API連携

現在はモックデータで動作します。Zaim APIと連携するには：

1. [Zaim Developer](https://dev.zaim.net/) でアプリを登録
2. Consumer Key/Secret を取得
3. 設定画面から連携

## ビルド

```bash
# EAS Build (クラウド)
eas build --platform ios --profile production

# TestFlight アップロード
fastlane beta
```

## ライセンス

© 2025 ManyConnection LLC
