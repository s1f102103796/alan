import type { AppModel } from '$/commonTypesWithClient/appModels';
import { OPENAI_KEY } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import OpenAI from 'openai';
import type { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { codeBlocks } from './prompts';

const openai = new OpenAI({
  apiKey: OPENAI_KEY,
});

export const invokeOrThrow = async <T extends z.AnyZodObject>(
  app: AppModel,
  prompt: string,
  validator: T,
  additionalPrompts: { role: 'system' | 'user'; content: string }[],
  count = 3
): Promise<z.infer<T>> => {
  const jsonSchema = zodToJsonSchema(validator);
  const logDir = `logs/${app.displayId}/${Date.now()}`;
  const input = `${prompt}

ステップ・バイ・ステップで考えましょう。
返答は必ず以下のJSON schemas通りにしてください。
${codeBlocks.valToJson(jsonSchema)}
`;

  if (!existsSync(logDir)) mkdirSync(logDir, { recursive: true });
  writeFileSync(`${logDir}/input.txt`, input, 'utf8');

  return await openai.chat.completions
    .create({
      model: 'gpt-4-1106-preview',
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content:
            'あなたはTypeScriptのフルスタックエンジニアとしてウェブサービスを開発してください。',
        },
        { role: 'user', content: input },
        ...additionalPrompts,
      ],
    })
    .then((response) => {
      const content = response.choices[0]?.message.content;
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
