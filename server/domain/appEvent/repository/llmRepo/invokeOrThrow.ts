import type { AppModel } from '$/commonTypesWithClient/appModels';
import { OPENAI_KEY } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import type { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { codeBlocks } from './prompts';

const llm = new ChatOpenAI({
  modelName: 'gpt-4-1106-preview',
  temperature: 0,
  openAIApiKey: OPENAI_KEY,
}).bind({ response_format: { type: 'json_object' } });

export const invokeOrThrow = async <T extends z.AnyZodObject>(
  app: AppModel,
  prompt: string,
  validator: T,
  additionalPrompts: ['ai' | 'human', string][],
  count = 3
): Promise<z.infer<T>> => {
  const jsonSchema = zodToJsonSchema(validator);
  const logDir = `logs/${app.displayId}/${Date.now()}`;
  const input = `${prompt}

ステップ・バイ・ステップで考えましょう。
返答は以下のJSON schemasに従ってください。
${codeBlocks.valToJson(jsonSchema)}
`;

  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  writeFileSync(`${logDir}/input.txt`, input, 'utf8');

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
      writeFileSync(`${logDir}/output.json`, content, 'utf8');

      return validator.parse(JSON.parse(content));
    })
    .catch((e) => {
      writeFileSync(`${logDir}/error-${count}.txt`, e.message, 'utf8');

      if (count === 0) throw e;

      return invokeOrThrow(app, prompt, validator, additionalPrompts, count - 1);
    });
};
