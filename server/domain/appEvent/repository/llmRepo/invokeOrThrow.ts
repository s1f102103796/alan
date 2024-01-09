import type { AppModel } from '$/commonTypesWithClient/appModels';
import { toJST } from '$/service/dayjs';
import { IS_LOCALHOST, OPENAI_KEY } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { putTextToS3 } from '$/service/s3Client';
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
  additionalPrompts: ['ai' | 'human', string][],
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

  return await llm
    .invoke([
      [
        'system',
        'あなたはTypeScriptのフルスタックエンジニアとしてウェブサービスを開発してください。',
      ],
      ['human', input],
      ...additionalPrompts,
    ])
    .then(async ({ content }) => {
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
