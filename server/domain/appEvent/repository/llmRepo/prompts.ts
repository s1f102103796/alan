import type { ActiveAppModel, AppModel, InitAppModel } from '$/commonTypesWithClient/appModels';
import type { GHStepModel } from '$/domain/app/model/githubModels';
import type { LocalGitFile, LocalGitModel } from '$/domain/app/repository/localGitRepo';

export const codeBlocks = {
  fromText: (text: string, ext: string) => `\`\`\`${ext}\n${text}\n\`\`\``,
  valToJson: (val: Record<string, unknown> | Record<string, unknown>[]) =>
    `\`\`\`json\n${JSON.stringify(val, null, 2)}\n\`\`\``,
};

const filterClientCode = (localGit: LocalGitModel) =>
  localGit.files.filter((file) => file.source.startsWith('client/src/'));

const filterServerCode = (localGit: LocalGitModel) =>
  localGit.files.filter(
    (file) => file.source.startsWith('server/domain') || file.source.startsWith('server/api/')
  );

const chunks = {
  codePostFix: (
    localGit: LocalGitModel
  ) => `変更あるいは新たに作成したファイルのみをfilesに含めてください。
削除するファイルはfilesに含めず、deletedFilesにファイルパスの配列を指定すること。
以下は過去に削除されたファイルのリストです。
必要に応じてこのリストにあるファイルをfilesに復元することができます。
${codeBlocks.valToJson(localGit.deletedFiles)}

リアルタイム通信が必要な場合はWebSocketの代わりにHTTPポーリングを利用してください。
ポーリングする場合の時間間隔は機能の性質に応じて0.5秒～5秒の範囲で指定してください。
'$'から始まるtsファイルはCIで生成しているため変更不要です。
messageには修正内容のコミットメッセージを日本語で記述してください。`,
};

export const prompts = {
  initTaskList: (
    app: AppModel
  ) => `${app.similarName}によく似たウェブサービスを開発するための機能要件をリストアップしてください。
項目ごとに簡潔なタイトルと詳細な内容を書いてください。
開発環境とCI/CDとユーザー認証機能とプロフィール機能とセキュリティ対策とレスポンスデザインは完備されているためリストに含める必要はありません。
エンジニアが実装すべき順番にソートしてください。`,

  initSchema: (app: InitAppModel | ActiveAppModel) => `${
    app.similarName
  }によく似たウェブサービスをTypeScriptで開発します。
最初のタスクとして以下のJSONに書かれたタスクを実装するためのschema.prismaを作成してください。
\`\`\`json
${JSON.stringify({ title: app.taskList?.[0]?.title, content: app.taskList?.[0]?.content })}
\`\`\`
Prismaのリレーションの記述が正しいかをよく確認してください。
サーバーエンジニアがあなたのschema.prismaを使って開発を行うため、テーブル名やカラム名には長くても良いので人間が理解しやすい命名を心掛けてください。
schema.prismaにはdatasourceとgeneratorとenumを含めず、modelのみを使用してください。
認証にSupabase Authを利用するのでパスワードを保存する必要はありません。
Supabase Authと連携できるように、必ずUser modelに id/email/name のみを必須カラムとして含めてください。
Userのidにauto_incrementは不要です。`,

  initApiDef: (app: InitAppModel | ActiveAppModel, schema: LocalGitFile) => `以下は${
    app.similarName
  }によく似たウェブサービスをTypeScriptで開発するためのschema.prismaです。
${codeBlocks.fromText(schema.content, 'prisma')}

最初のタスクとして以下のJSONに書かれたタスクを実装するためのREST APIを設計しOpenAPI 3.0をJSON形式で出力してください。
\`\`\`json
${JSON.stringify({ title: app.taskList?.[0]?.title, content: app.taskList?.[0]?.content })}
\`\`\`

認証認可が必要なエンドポイントは 'private/' 以下に定義してください。
認証不要の公開エンドポイントは 'public/' 以下に定義してください。
認証にSupabase Authを利用しており、自動的に行われるため今回は考慮する必要がありません。`,

  initClient: (
    app: InitAppModel | ActiveAppModel,
    localGit: LocalGitModel,
    newApiFiles: LocalGitFile[]
  ) => `${app.similarName}によく似たウェブサービスをTypeScriptで開発します。
以下はNext.jsのテンプレートです。
${codeBlocks.valToJson(filterClientCode(localGit))}

バックエンドエンジニアが新しいREST client/src/apiディレクトリに以下の通り作成しました。
${codeBlocks.valToJson(newApiFiles)}

最初のタスクとして以下のJSONに書かれたタスクを実装してください。
\`\`\`json
${JSON.stringify({ title: app.taskList?.[0]?.title, content: app.taskList?.[0]?.content })}
\`\`\`

このAPI定義はclient/src/utils/apiClient.tsでimportしており、あなたはこれをフルに活用してclientディレクトリ以下を書き換えてください。
新たに必要なnpmパッケージは自動的にpackage.jsonに追加される仕組みがあるので自由に使うことができます。
\n${chunks.codePostFix(localGit)}\n`,

  initServer: (
    app: InitAppModel | ActiveAppModel,
    localGit: LocalGitModel,
    newApiFiles: LocalGitFile[]
  ) => `${app.similarName}によく似たウェブサービスをTypeScriptで開発します。
以下はfrourioのテンプレートです。
${codeBlocks.valToJson(filterServerCode(localGit))}

バックエンドエンジニアが新しいREST APIをaspidaでserver/apiディレクトリに以下の通り作成しました。
${codeBlocks.valToJson(newApiFiles)}

最初のタスクとして以下のJSONに書かれたタスクを実装してください。
\`\`\`json
${JSON.stringify({ title: app.taskList?.[0]?.title, content: app.taskList?.[0]?.content })}
\`\`\`

バックエンドフレームワークはfrourioなのでaspidaの定義をもとにserver/apiディレクトリの配下にcontroller.tsを作成する必要があります。
新たに必要なnpmパッケージは自動的にpackage.jsonに追加される仕組みがあるので自由に使うことができます。
\n${chunks.codePostFix(localGit)}\n`,

  fixClient: (app: AppModel, localGit: LocalGitModel, failedStep: GHStepModel) => `${
    app.similarName
  }によく似たサービスのフロントエンドを開発中にエラーが発生しました。
以下はNext.jsのソースコードです。
${codeBlocks.valToJson(filterClientCode(localGit))}

GitHub ActionsのCIで以下のエラーが発生したのでこれを修正してください。
${codeBlocks.fromText(failedStep.log, 'txt')}\n\n${chunks.codePostFix(localGit)}\n`,

  fixServer: (app: AppModel, localGit: LocalGitModel, failedStep: GHStepModel) => `${
    app.similarName
  }によく似たサービスのバックエンドを開発中にエラーが発生しました。
以下はfrourioのソースコードです。
${codeBlocks.valToJson(filterServerCode(localGit))}

GitHub ActionsのCIで以下のエラーが発生したのでこれを修正してください。
${codeBlocks.fromText(failedStep.log, 'txt')}\n\n${chunks.codePostFix(localGit)}\n`,
};
