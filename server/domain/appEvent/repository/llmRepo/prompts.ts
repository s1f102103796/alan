import type { AppModel } from '$/commonTypesWithClient/appModels';
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

'$'から始まるtsファイルはCIで生成しているため変更不要です。
messageには修正内容のコミットメッセージを日本語で記述してください。`,
};

export const prompts = {
  initSchema: (
    app: AppModel
  ) => `${app.similarName}によく似たウェブサービスをTypeScriptで開発するための詳細なschema.prismaを作成してください。
Prismaのフォーマットやリレーションの記述が正しいかをよく確認してください。
サーバーエンジニアがあなたのschema.prismaを使って開発を行うため、テーブル名やカラム名には長くても良いので人間が理解しやすい命名を心掛けてください。
schema.prismaにはdatasourceとgeneratorとenumを含めず、modelのみを使用してください。
認証にSupabase Authを利用するのでパスワードを保存する必要はありません。
Supabase Authと連携できるように、必ずUser modelに id/email/name のみを必須カラムとして含めてください。
Userのidにauto_incrementは不要です。`,

  initApiDef: (app: AppModel, schema: LocalGitFile) => `以下は${
    app.similarName
  }によく似たウェブサービスをTypeScriptで開発するためのschema.prismaです。
${codeBlocks.fromText(schema.content, 'prisma')}

このSchemaをもとに、REST APIを設計しOpenAPI 3.0をJSON形式で出力してください。
サービスのユースケースを十分に考慮し、必要なエンドポイントを網羅するように努力してください。
認証認可が必要なエンドポイントは 'private/' 以下に定義してください。
認証不要の公開エンドポイントは 'public/' 以下に定義してください。
認証にSupabase Authを利用しており、自動的に行われるため今回は考慮する必要がありません。`,

  initClient: (
    app: AppModel,
    localGit: LocalGitModel,
    newApiFiles: LocalGitFile[]
  ) => `開発中のウェブサービスに大きな仕様変更が発生しました。Todoアプリだったものを${
    app.similarName
  }によく似たサービスに変えなければなりません。
以下は元のTodoアプリのNext.jsです。
${codeBlocks.valToJson(filterClientCode(localGit))}

バックエンドエンジニアが新しいREST client/src/apiディレクトリに以下の通り作成しました。
${codeBlocks.valToJson(newApiFiles)}

このAPI定義はclient/src/utils/apiClient.tsでimportしており、あなたはこれをフルに活用してclientディレクトリ以下を書き換えてください。
新たに必要なnpmパッケージは自動的にpackage.jsonに追加される仕組みがあるので自由に使うことができます。
\n${chunks.codePostFix(localGit)}\n`,

  initServer: (
    app: AppModel,
    localGit: LocalGitModel,
    newApiFiles: LocalGitFile[]
  ) => `開発中のウェブサービスに大きな仕様変更が発生しました。Todoアプリだったものを${
    app.similarName
  }によく似たサービスに変えなければなりません。
以下は元のfrourioのバックエンドです。
${codeBlocks.valToJson(filterServerCode(localGit))}

バックエンドエンジニアが新しいREST APIをaspidaでserver/apiディレクトリに以下の通り作成しました。
${codeBlocks.valToJson(newApiFiles)}

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
