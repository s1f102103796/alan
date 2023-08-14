import 'dotenv/config';
import type { ChatCompletionRequestMessage } from 'openai';
import { Configuration, OpenAIApi } from 'openai';
import 'ts-node/register';

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

export const func = async (AAA: string) => {
  try {
    const TODO_NAME = AAA;
    const getTask = () => {
      return TODO_NAME;
    };
    const functions = {
      getTask,
    } as const;

    const prompt: ChatCompletionRequestMessage = {
      role: 'user',
      content: `${TODO_NAME}の技術を向上するために人が中々思いつかないTodoリストの内容を1つ10文字以内で具体的に教えてください 「」の中に答えを入れてください`,
    };
    const res = await openai.createChatCompletion({
      model: 'gpt-4-0613',
      messages: [prompt],
      function_call: 'auto',
      functions: [
        {
          name: 'getTask',
          description: 'タスクの内容を理解する',
          parameters: {
            type: 'object',
            properties: {
              task: {
                type: 'string',
                description: '新しく作成したタスク',
              },
            },
            required: ['task'],
          },
        },
      ],
    });

    const message = res.data.choices[0].message;
    // console.log('message', message);
    const functionCall = message?.function_call;

    if (functionCall) {
      // const args = JSON.parse(functionCall.arguments || '{}');
      const args = JSON.parse(functionCall.arguments ?? '{}');
      // console.log(args);

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // const functionRes = functions[functionCall.name!](args.name);
      const functionRes = functions[functionCall.name](args.name);

      // 関数の結果をもとに再度質問
      const res2 = await openai.createChatCompletion({
        model: 'gpt-4-0613',
        messages: [
          prompt,
          message,
          {
            role: 'function',
            content: functionRes,
            name: functionCall.name,
          },
        ],
      });
      // console.log('answer2', res2.data.choices[0].message);
      // messageContent = res2.data.choices[0].message;
      // Taskname = res2.data.choices[0].message;
      const contentResult = res2.data?.choices[0]?.message?.content;
      console.log(contentResult);
      return contentResult;
    }
  } catch (e) {
    console.error(e);
  }
};
