# Next frourio starter

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
$ npm i --prefix raspi-client
$ npm i --prefix raspi-server
$ npx playwright install-deps
```

### 環境変数ファイルの作成

```sh
$ cp client/.env.example client/.env
$ cp server/.env.example server/.env
$ cp raspi-client/.env.example raspi-client/.env
$ cp raspi-server/.env.example raspi-server/.env
$ cp docker/dev/.env.example docker/dev/.env
$ cp server/prisma/.env.example server/prisma/.env
```

server/.env に Twitter のログイン情報を記述

### ミドルウェアのセットアップ

```sh
$ docker compose up -d
```

### 開発サーバー起動

VSCode のターミナルを二つ開いて以下のコマンドを一つずつに入力する

```sh
$ npm run dev:client
```

```sh
$ npm run dev:server
```

Playwright を一度でも起動すると node-dev の再起動が動かなくなるため notios が使えない

Playwright 起動以降は server 配下のコードを書き換えるたびに npm run dev:server をやり直す

Web ブラウザで http://localhost:3000 を開く

閉じるときは `Ctrl + C` を 2 回連続で入力

### raspi 開発サーバー起動

```sh
$ npm run dev:raspi-client
```

```sh
$ npm run dev:raspi-server
```

### データのやり取り

複数のデバイスで server と raspi-server のデータのやり取りをするときは.env ファイルの localhost を IP アドレスに変更する

自分の IP アドレスは Poweshell などで以下のコマンドで調べることができる

```sh
$ ipconfig
```

https://zenn.dev/solufa/articles/accessing-wsl2-from-mobile

この記事を参考にして同じ Wifi 環境で外部からアクセスできるようにする

立ち上げる port 番号は client => 3000, sever => 31577, raspi-client => 3001, raspi-server => 31578

#### Firebase Emulator

http://localhost:4000/auth

#### MinIO Console

http://localhost:9001/

#### PostgreSQL UI

```sh
$ cd server
$ npx prisma studio
```
