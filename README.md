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
