import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { LocalGitFile, LocalGitModel } from '$/domain/app/repository/localGitRepo';
import { customAssert } from '$/service/returnStatus';
import SwaggerParser from '@apidevtools/swagger-parser';
import { exec } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { z } from 'zod';
import { invokeOrThrow } from './invokeOrThrow';

export type GitDiffModel = {
  diffs: LocalGitFile[];
  deletedFiles: string[];
  newMessage: string;
};

export const sources = {
  schema: 'server/prisma/schema.prisma',
  openapi: 'server/openapi.json',
};

export const llmRepo = {
  initSchema: async (app: AppModel): Promise<GitDiffModel> => {
    const prismaHeader = `datasource db {
  provider = "postgresql"
  url      = env("API_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

`;
    const prompt = `${app.name}によく似たウェブサービスをTypeScriptで開発するための詳細なschema.prismaを作成してください。
Prismaのフォーマットやリレーションの記述が正しいかをよく確認してください。
サーバーエンジニアがあなたのschema.prismaを使って開発を行うため、テーブル名やカラム名には長くても良いので人間が理解しやすい命名を心掛けてください。
schema.prismaにはdatasourceとgeneratorとenumを含めず、modelのみを使用してください。
認証にSupabase Authを利用するのでパスワードを保存する必要はありません。
Supabase Authと連携できるように、必ずUser modelに id/email/name のカラムを含めてください。
Userのidにauto_incrementは不要です。`;

    const validator = z.object({ prismaSchema: z.string() });
    let result = await invokeOrThrow(app, prompt, validator, []);

    for (let i = 0; i < 3; i += 1) {
      if (!/model User ?{[^}]+?( id )[^}]+?( email )[^}]+?( name )/.test(result.prismaSchema)) {
        result = await invokeOrThrow(app, prompt, validator, [
          ['ai', result.prismaSchema],
          ['human', 'User modelに指定のカラムが含まれていません。修正してください。'],
        ]);
        continue;
      }

      const filePath = join(tmpdir(), `${app.displayId}-${Date.now()}-schema.prisma`);
      writeFileSync(filePath, `${prismaHeader}${result.prismaSchema}`, 'utf8');
      const { stderr } = await promisify(exec)(`npx prisma format --schema ${filePath}`);
      const content = readFileSync(filePath, 'utf8');
      unlinkSync(filePath);

      if (!stderr.includes('Error')) {
        return {
          diffs: [{ source: sources.schema, content }],
          deletedFiles: [],
          newMessage: 'DBスキーマの定義',
        };
      }

      result = await invokeOrThrow(app, prompt, validator, [
        ['ai', result.prismaSchema],
        ['human', `以下のエラーを修正してください。\n${stderr}`],
      ]);
    }

    throw new Error('schema.prismaを正しく生成できませんでした。');
  },
  initApiDef: async (app: AppModel, localGit: LocalGitModel): Promise<GitDiffModel> => {
    const schema = localGit.files.find((file) => file.source === sources.schema);
    customAssert(schema, 'エラーならロジック修正必須');

    const prompt = `以下は${app.name}によく似たウェブサービスをTypeScriptで開発するためのschema.prismaです。
\`\`\`prisma
${schema.content}
\`\`\`
このSchemaをもとに、REST APIを設計しOpenAPI 3.0をJSON形式で出力してください。
サービスのユースケースを十分に考慮し、必要なエンドポイントを網羅するように努力してください。
認証認可が必要なエンドポイントは 'api/private/' 以下に定義してください。
認証不要の公開エンドポイントは 'api/public/' 以下に定義してください。
認証にSupabase Authを利用しており、自動的に行われるため今回は考慮する必要がありません。`;

    const validator = z.object({}).passthrough();
    let result = await invokeOrThrow(app, prompt, validator, []);

    for (let i = 0; i < 3; i += 1) {
      const filePath = join(tmpdir(), `${app.displayId}-${Date.now()}-openapi.json`);
      const content = JSON.stringify(result, null, 2);
      writeFileSync(filePath, content, 'utf8');
      const err = await SwaggerParser.validate(filePath)
        .then(() => null)
        .catch((e) => e.message as string);
      unlinkSync(filePath);

      if (err === null) {
        return {
          diffs: [{ source: sources.openapi, content }],
          deletedFiles: [],
          newMessage: 'REST APIエンドポイントの定義',
        };
      }

      result = await invokeOrThrow(app, prompt, validator, [
        ['ai', content],
        ['human', `以下のエラーを修正してください。\n${err}`],
      ]);
    }

    throw new Error('openapi.jsonを正しく生成できませんでした。');
  },
  initClient: async (
    app: AppModel,
    localGit: LocalGitModel,
    newApiFiles: LocalGitFile[]
  ): Promise<GitDiffModel> => {
    const prompt = `開発中のウェブサービスに大きな仕様変更が発生しました。Todoアプリだったものを${
      app.name
    }によく似たサービスに変えなければなりません。
以下は元のTodoアプリのフロントエンドです。
\`\`\`json
${JSON.stringify(
  localGit.files.filter(
    (file) =>
      file.source.startsWith('client/') ||
      /^server\/api\/.+\/(index\.ts|\$api\.ts)$/.test(file.source)
  ),
  null,
  2
)}
\`\`\`

バックエンドエンジニアが新しいREST APIをaspidaでserver/apiディレクトリに以下の通り作成しました。
\`\`\`json
${JSON.stringify(newApiFiles, null, 2)}
\`\`\`

このAPI定義はclient/src/utils/apiClient.tsでimportしており、あなたはこれをフルに活用してclientディレクトリ以下を書き換えてください。
新たに必要なnpmパッケージは自動的にpackage.jsonに追加される仕組みがあるので自由に使うことができます。
削除するファイルはfilesに含めず、deletedFilesにファイルパスの配列を指定すること。
変更あるいは追加したファイルのみをfilesに含めてください。
'$'から始まるtsファイルはCIで生成しているため変更不要です。
新しいファイルを生成してもよいです。
messageには変更内容のコミットメッセージを日本語で記述してください。
`;

    const validator = z.object({
      message: z.string(),
      files: z.array(z.object({ source: z.string(), content: z.string() })),
      deletedFiles: z.array(z.string()),
    });
    const result = await invokeOrThrow(app, prompt, validator, []);
    const deletedApis = localGit.files.filter(
      (file) =>
        file.source.startsWith('server/api') &&
        newApiFiles.every((api) => api.source !== file.source)
    );

    return {
      newMessage: result.message,
      diffs: [
        ...result.files.filter(
          (file) => file.source.startsWith('client/') && !['package.json'].includes(file.source)
        ),
        ...newApiFiles,
      ],
      deletedFiles: [
        ...result.deletedFiles.filter(
          (file) => file.startsWith('client/') && !['package.json'].includes(file)
        ),
        ...deletedApis.map((a) => a.source),
      ],
    };
  },
};
