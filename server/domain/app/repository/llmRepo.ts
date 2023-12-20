import type { AppModel } from '$/commonTypesWithClient/appModels';
import { OPENAI_KEY } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { z } from 'zod';
import type { LocalGitFile, LocalGitModel } from './localGitRepo';

const llm = new ChatOpenAI({
  modelName: 'gpt-4-1106-preview',
  temperature: 0,
  openAIApiKey: OPENAI_KEY,
}).bind({ response_format: { type: 'json_object' } });

export type GitDiffModel = { diffs: LocalGitFile[]; newMessage: string; localGit: LocalGitModel };

export const llmRepo = {
  initApp: async (app: AppModel, localGit: LocalGitModel): Promise<GitDiffModel | null> => {
    const res = await llm
      .invoke([
        [
          'system',
          'あなたはWebアプリの開発者です。ユーザーの指示に従ってウェブサービスを完成させてください。',
        ],
        [
          'human',
          `以下のJSONはfrourioとNext.jsを利用したTypeScriptの基本的なウェブアプリケーションです。
これを以下の要件で書き変えてください。

- アプリ名は「${app.name}」
- アプリ名から推測されるウェブサービスを実装する
- 変更したファイルのみをJSONに含める
- Prismaを利用してアプリの状態をデータベースに保存する
- '$'から始まるtsファイルはCIで生成しているため変更不要
- prismaのmigration.sqlは出力不要
- 新しいファイルを生成してもよい
- output tokensに収まらない場合はhasNextfilesにtrueを設定すること
- messageには変更内容のコミットメッセージを日本語で記述

\`\`\`json
  ${JSON.stringify(
    { message: localGit.message, files: localGit.files, hasNextFiles: false },
    null,
    2
  )}
  \`\`\`
  `,
        ],
      ])
      .then(({ content }) => {
        customAssert(typeof content === 'string', '不正リクエスト防御');

        if (!existsSync('logs')) mkdirSync('logs');
        writeFileSync(`logs/${app.displayId}.json`, content, 'utf8');

        return z
          .object({
            message: z.string(),
            files: z.array(z.object({ source: z.string(), content: z.string() })),
            hasNextFiles: z.boolean().optional(),
          })
          .parse(JSON.parse(content));
      })
      .catch(() => null);

    return res === null ? null : { diffs: res.files, newMessage: res.message, localGit };
  },
};
