import { OPENAIAPI } from '$/service/envValues';
import { OpenAI } from 'langchain';
import { ConversationChain } from 'langchain/chains';
import { getNews } from './newsapiRepository';
import { fetchWeatherData } from './weatherrepository';

export const langchainAPI = async (values: { [key: number]: boolean }) => {
  const llm = new OpenAI({
    openAIApiKey: OPENAIAPI,
    temperature: 0.9,
    modelName: 'gpt-4',
  });
  const dora = `
この情報を元に今日どのように行動したらいいかドラえもんになってのび太君に教えるように教えて。もし情報がなかったら「どら焼き大好き」だけ返してください。
`;
  let news = '';
  if (values[0] === true) {
    news = await getNews();
  }
  let weather = '';
  if (values[1] === true) {
    weather = await fetchWeatherData();
  }
  const chain = new ConversationChain({ llm });
  const input1 = `${JSON.stringify(news)}${JSON.stringify(weather)}は最新の情報です。${dora}`;
  const res1 = await chain.call({ input: input1 });
  return res1.response;
};
