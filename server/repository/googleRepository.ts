import { OpenAI } from 'langchain';
import { initializeAgentExecutor } from 'langchain/agents';
import { SerpAPI } from 'langchain/tools';
const dotenv = require('dotenv');
dotenv.config();

export const runAgent = async () => {
  const llm = new OpenAI({ temperature: 0 });

  const tools = [new SerpAPI()];

  const executor = await initializeAgentExecutor(tools, llm, 'zero-shot-react-description', true);

  // first web検索
  const firstPrompt = '世界で2番目に大きい美術館を教えてください';
  const firstRes = await executor.call({ input: firstPrompt });
  console.log('User1', firstPrompt);
  console.log('Agent1', firstRes.output);
};

runAgent();
