import { OPENAIAPI } from '$/service/envValues';
import { OpenAI } from 'langchain';
import { ConversationChain } from 'langchain/chains';
import { getNews } from './newsapiRepository';
import { fetchWeatherData } from './weatherrepository';

export const langchainAPI = async () => {
  const llm = new OpenAI({
    openAIApiKey: OPENAIAPI,
    temperature: 0.9,
    modelName: 'gpt-4',
  });
  const dora = `
この情報を元に今日どのように行動したらいいかドラえもんになってのび太君に教えるように教えて。
`;
  let news = '';
  const newsonoff = 1;
  if (newsonoff === 1) {
    news = await getNews();
  }
  let weather = '';
  let weatheronoff = 1;
  weatheronoff = 1;
  if (weatheronoff === 1) {
    weather = await fetchWeatherData();
  }
  const chain = new ConversationChain({ llm });
  const input1 = `${JSON.stringify(news)}${JSON.stringify(weather)}は最新の情報です。${dora}`;
  const res1 = await chain.call({ input: input1 });
  return res1.response;
};
