import type { AppModel } from '$/commonTypesWithClient/appModels';
import { OPENAI_KEY } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { z } from 'zod';
import type { GHStepModel } from '../model/githubModels';
import type { LocalGitFile, LocalGitModel } from './localGitRepo';

const llm = new ChatOpenAI({
  modelName: 'gpt-4-1106-preview',
  temperature: 0,
  openAIApiKey: OPENAI_KEY,
}).bind({ response_format: { type: 'json_object' } });

export type GitDiffModel = {
  diffs: LocalGitFile[];
  deletedFiles: string[];
  newMessage: string;
};

export const llmRepo = {
  initApp: async (app: AppModel, localGit: LocalGitModel): Promise<GitDiffModel | null> => {
    const input = JSON.stringify(
      { message: localGit.message, hasNextFiles: false, files: localGit.files, deletedFiles: [] },
      null,
      2
    );
    const res = await llm
      .invoke([
        [
          'system',
          'あなたはWebアプリの開発者です。ユーザーの指示に従ってウェブサービスを完成させてください。',
        ],
        [
          'human',
          `以下のJSONはfrourioとNext.jsを利用したTypeScriptの基本的なウェブアプリケーションです。
\`\`\`json
${input}
\`\`\`

これを以下の要件で書き変えてください。

- アプリ名は「${app.name}」
- アプリ名から推測されるウェブサービスを実装する
- 変更あるいは追加したファイルのみをfilesに含める
- Prismaを利用してアプリの状態をデータベースに保存する
- '$'から始まるtsファイルはCIで生成しているため変更不要
- prismaのmigration.sqlは出力不要
- 新しいファイルを生成してもよい
- output tokensに収まらない場合はhasNextfilesにtrueを設定すること
- messageには変更内容のコミットメッセージを日本語で記述
- package.jsonのnameとdependencies以外を変更してはいけない
- package.jsonのdependenciesを変更するときはモジュールの削除をしてはいけない
- 削除するファイルはfilesに含めず、deletedFilesにファイルパスの配列を指定すること

ステップ・バイ・ステップで考えてください。
返答は冒頭のJSONと同じフォーマットにしなければなりません。
`,
        ],
      ])
      .then(({ content }) => {
        customAssert(typeof content === 'string', '不正リクエスト防御');

        if (!existsSync('logs/init')) mkdirSync('logs/init', { recursive: true });
        writeFileSync(`logs/init/${app.displayId}-input.json`, input, 'utf8');
        writeFileSync(`logs/init/${app.displayId}-output.json`, content, 'utf8');

        return z
          .object({
            message: z.string(),
            files: z.array(z.object({ source: z.string(), content: z.string() })),
            hasNextFiles: z.boolean().optional(),
            deletedFiles: z.array(z.string()),
          })
          .parse(JSON.parse(content));
      })
      .catch((e) => {
        console.log(e.message);
        return null;
      });

    return res === null
      ? null
      : { diffs: res.files, deletedFiles: res.deletedFiles, newMessage: res.message };
  },
  retryApp: async (
    app: AppModel,
    localGit: LocalGitModel,
    failedStep: GHStepModel
  ): Promise<GitDiffModel | null> => {
    const input = JSON.stringify(
      { message: localGit.message, hasNextFiles: false, files: localGit.files, deletedFiles: [] },
      null,
      2
    );
    const res = await llm
      .invoke([
        [
          'system',
          'あなたはWebアプリの開発者です。ユーザーの指示に従ってウェブサービスを完成させてください。',
        ],
        [
          'human',
          `以下のJSONはfrourioとNext.jsを利用したTypeScriptの基本的なウェブアプリケーションです。
\`\`\`json
${input}
\`\`\`

GitHub ActionsのCIで以下のエラーが発生したのでこれを修正してください。
\`\`\`txt
${failedStep.log}
\`\`\`

修正する際、以下の要件を守ってください。

- アプリ名は「${app.name}」
- アプリ名から推測されるウェブサービスを実装する
- 変更あるいは追加したファイルのみをfilesに含める
- Prismaを利用してアプリの状態をデータベースに保存する
- '$'から始まるtsファイルはCIで生成しているため変更不要
- prismaのmigration.sqlは出力不要
- 新しいファイルを生成してもよい
- output tokensに収まらない場合はhasNextfilesにtrueを設定すること
- messageには変更内容のコミットメッセージを日本語で記述
- package.jsonのnameとdependencies以外を変更してはいけない
- package.jsonのdependenciesを変更するときはモジュールの削除をしてはいけない
- 削除するファイルはfilesに含めず、deletedFilesにファイルパスの配列を指定すること

ステップ・バイ・ステップで考えてください。
返答は冒頭のJSONと同じフォーマットにしなければなりません。
`,
        ],
      ])
      .then(({ content }) => {
        customAssert(typeof content === 'string', '不正リクエスト防御');

        if (!existsSync('logs/retry')) mkdirSync('logs/retry');
        writeFileSync(`logs/retry/${app.displayId}-input.json`, input, 'utf8');
        writeFileSync(`logs/retry/${app.displayId}-output.json`, content, 'utf8');

        return z
          .object({
            message: z.string(),
            files: z.array(z.object({ source: z.string(), content: z.string() })),
            hasNextFiles: z.boolean().optional(),
            deletedFiles: z.array(z.string()),
          })
          .parse(JSON.parse(content));
      })
      .catch((e) => {
        console.log(e.message);
        return null;
      });

    return res === null
      ? null
      : { diffs: res.files, deletedFiles: res.deletedFiles, newMessage: res.message };
  },
};
