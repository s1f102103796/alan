import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { LocalGitFile, LocalGitModel } from '$/domain/app/repository/localGitRepo';
import { OPENAI_KEY } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { exec } from 'child_process';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';

const llm = new ChatOpenAI({
  modelName: 'gpt-4-1106-preview',
  temperature: 0,
  openAIApiKey: OPENAI_KEY,
}).bind({ response_format: { type: 'json_object' } });

export type GitDiffModel = {
  diffs: LocalGitFile[];
  deletedFiles: string[];
  newMessage: string;
  localGit: LocalGitModel;
};

const prismaHeader = `datasource db {
  provider = "postgresql"
  url      = env("API_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

`;

const invokeOrThrow = async <T extends z.AnyZodObject>(
  app: AppModel,
  prompt: string,
  validator: T,
  additionalPrompts: ['ai' | 'human', string][],
  count = 3
): Promise<z.infer<T>> => {
  const jsonSchema = zodToJsonSchema(validator);
  const logDir = `logs/${app.displayId}`;
  const now = Date.now();
  const input = `${prompt}

ステップ・バイ・ステップで考えましょう。
返答は以下のJSON schemasに従ってください。
\`\`\`json
${JSON.stringify(jsonSchema, null, 2)}
\`\`\`
`;

  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  writeFileSync(`${logDir}/${now}-input.json`, input, 'utf8');

  return await llm
    .invoke([
      [
        'system',
        'あなたはTypeScriptのフルスタックエンジニアとしてウェブサービスを開発してください。',
      ],
      ['human', input],
      ...additionalPrompts,
    ])
    .then(({ content }) => {
      customAssert(typeof content === 'string', '不正リクエスト防御');
      writeFileSync(`${logDir}/${now}-output.json`, content, 'utf8');

      return validator.parse(JSON.parse(content));
    })
    .catch((e) => {
      writeFileSync(`${logDir}/${now}-error-${count}.json`, e.message, 'utf8');

      if (count === 0) throw e;

      return invokeOrThrow(app, prompt, validator, additionalPrompts, count - 1);
    });
};

export const llmRepo = {
  initSchema: async (app: AppModel, localGit: LocalGitModel): Promise<GitDiffModel> => {
    const prompt = `${app.name}によく似たウェブサービスをTypeScriptで開発するための詳細なschema.prismaを作成してください。
Prismaのフォーマットやリレーションの記述が正しいかをよく確認してください。
サーバーエンジニアがあなたのschema.prismaを使って開発を行うため、テーブル名やカラム名には長くても良いので人間が理解しやすい命名を心掛けてください。
schema.prismaにはdatasourceとgeneratorとenumを含めず、modelのみを使用してください。
`;

    let result = await invokeOrThrow(app, prompt, z.object({ prismaSchema: z.string() }), []);

    for (let i = 0; i < 3; i += 1) {
      const filePath = join(tmpdir(), `${app.displayId}-${Date.now()}-schema.prisma`);
      writeFileSync(filePath, `${prismaHeader}${result.prismaSchema}`, 'utf8');
      const { stderr } = await promisify(exec)(`npx prisma format --schema ${filePath}`);
      const content = readFileSync(filePath, 'utf8');
      unlinkSync(filePath);

      if (!stderr.includes('Error')) {
        return {
          diffs: [{ source: 'server/prisma/schema.prisma', content }],
          deletedFiles: [],
          newMessage: 'DBスキーマの定義',
          localGit,
        };
      }

      result = await invokeOrThrow(app, prompt, z.object({ prismaSchema: z.string() }), [
        ['ai', result.prismaSchema],
        ['human', `以下のエラーを修正してください。\n${stderr}`],
      ]);
    }

    throw new Error('schema.prismaを正しく生成できませんでした。');
  },
};
