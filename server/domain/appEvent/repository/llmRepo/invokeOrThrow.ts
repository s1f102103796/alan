import type { AppModel } from '$/commonTypesWithClient/appModels';
import { toJST } from '$/service/dayjs';
import { IS_LOCALHOST } from '$/service/envValues';
import { openai } from '$/service/openai';
import { customAssert } from '$/service/returnStatus';
import { putTextToS3 } from '$/service/s3Client';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import type { z } from 'zod';
import zodToJsonSchema from 'zod-to-json-schema';
import { codeBlocks } from './prompts';

const saveLog = async (dir: string, name: string, body: string) => {
  if (IS_LOCALHOST) {
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });

    writeFileSync(`${dir}/${name}`, body, 'utf8');
  } else {
    await putTextToS3(`${dir}/${name}`, body).catch((e) => {
      console.log('log saving error:', e.message, `${dir}/${name}`);
    });
  }
};

export const invokeOrThrow = async <T extends z.AnyZodObject>(
  app: AppModel,
  prompt: string,
  validator: T,
  additionalPrompts: ['assistant' | 'user', string][],
  count = 3
): Promise<z.infer<T>> => {
  const jsonSchema = zodToJsonSchema(validator);
  const now = Date.now();
  const logDir = `logs/${app.displayId}/${toJST(now).format('YYYY/MM/DD/HH')}/${Date.now()}`;
  const input = `${prompt}

ステップ・バイ・ステップで考えましょう。
返答は必ず以下のJSON schemas通りにしてください。
${codeBlocks.valToJson(jsonSchema)}
`;

  await saveLog(logDir, 'input.txt', input);

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
        ...additionalPrompts.map(([role, content]) => ({ role, content })),
      ],
    })
    .then(async (response) => {
      const content = response.choices[0]?.message.content;
      customAssert(typeof content === 'string', '不正リクエスト防御');
      await saveLog(logDir, 'output.json', content);

      return validator.parse(JSON.parse(content));
    })
    .catch(async (e) => {
      await saveLog(logDir, `error-${count}.txt`, e.message);

      if (count === 0) throw e;

      return invokeOrThrow(app, prompt, validator, additionalPrompts, count - 1);
    });
};
