# Deus Creatio

フロントエンドは src ディレクトリの [Next.js](https://nextjs.org/) 、バックエンドは server ディレクトリの [frourio](https://frourio.com/) で構築された TypeScript で一気通貫開発が可能なモノレポサービス

最新のコミットによるデモ - https://solufa.github.io/next-frourio-starter/

## 開発手順

### Node.js のインストール

ローカルマシンに直接インストールする

https://nodejs.org/ja/ の左ボタン、LTS をダウンロードしてインストール

### リポジトリのクローンと npm モジュールのインストール

ルートとフロントとバックエンドそれぞれに package.json があるので 3 回インストールが必要

```sh
$ npm i
$ npm i --prefix client
$ npm i --prefix server
```

### 環境変数ファイルの作成

```sh
$ cp client/.env.example client/.env
$ cp server/.env.example server/.env
$ cp docker/dev/.env.example docker/dev/.env
```

`server/.env` の以下の環境変数を変更する

```sh
FIREBASE_SERVER_KEY={"type": "service_account", "project_id": "xxxx", ...}
OPENAI_KEY=OpenAIのAPIキー
GITHUB_OWNER=GitHubのユーザー名（例：hoge）
GITHUB_TEMPLATE=deus-template
GITHUB_TOKEN=GitHubのトークン
GITHUB_WEBHOOK_SECRET=Webhookを検証するための任意のランダム文字列
RAILWAY_TOKEN=Railwaysのトークン
DISPLAY_ID_PREFIX=作成されるレポのプレフィックスを設定（例：deus-hoge）
BASE_DOMAIN=作成されるレポのドメインを設定（例：deus-hoge.com）
```

以下のリンクから各トークンを取得する

- [Firebase Service Account Key](https://firebase.google.com/docs/admin/setup#initialize_the_sdk_in_non-google_environments)
- [OpenAI API Key](https://platform.openai.com/api-keys)
- [Railway Token](https://docs.railway.app/guides/public-api#creating-a-token)
- [GitHub Token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-personal-access-token-classic)
  - `Classic`のトークンを生成する
  - 権限は`repo`と`workflow`にチェックを入れる

### テンプレートの作成

[deus-template](https://github.com/deus-app/deus-template)をフォークまたはクローンして、`GITHUB_TEMPLATE`で指定したリポジトリ名に作成する

### ミドルウェアのセットアップ

```sh
$ docker compose up -d
```

### 開発サーバー起動

次回以降は以下のコマンドだけで開発できる

```sh
$ npm run notios
```

Web ブラウザで http://localhost:3000 を開く

閉じるときは `Ctrl + C` を 2 回連続で入力

### データのやり取り

複数のデバイスで server のデータのやり取りをするときは.env ファイルの localhost を IP アドレスに変更する

自分の IP アドレスは Poweshell などで以下のコマンドで調べることができる

```sh
$ ipconfig
```

https://zenn.dev/solufa/articles/accessing-wsl2-from-mobile

この記事を参考にして同じ Wifi 環境で外部からアクセスできるようにする

立ち上げる port 番号は client => 3000, sever => 31577

#### Firebase Emulator

http://localhost:4000/auth

#### MinIO Console

http://localhost:9001/

#### PostgreSQL UI

```sh
$ cd server
$ npx prisma studio
```
