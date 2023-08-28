import { OPENAIAPI } from '$/service/envValues';
import { OpenAI } from 'langchain';
import { initializeAgentExecutor } from 'langchain/agents';
import { SerpAPI } from 'langchain/tools';

export const searchinweb = async () => {
  const llm = new OpenAI({
    openAIApiKey: OPENAIAPI,
    temperature: 0,
    modelName: 'gpt-4',
  });

  const tools = [new SerpAPI()];

  const executor = await initializeAgentExecutor(tools, llm, 'zero-shot-react-description', true);

  // first web検索
  const Prompt = 'e.target.value'; //質問入力
  const Response = await executor.call({ input: Prompt });
  console.log('User1', Prompt);
  console.log('Agent1', Response);
};
