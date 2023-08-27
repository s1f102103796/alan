import { OPENAIAPI } from '$/service/envValues';
import axios from 'axios';
import { OpenAI } from 'langchain';
import { ConversationChain } from 'langchain/chains';

export async function fetchWeatherData() {
  try {
    const url =
      'https://api.open-meteo.com/v1/forecast?latitude=52.52&longitude=13.41&hourly=temperature_2m,precipitation_probability,precipitation&daily=temperature_2m_max,temperature_2m_min&timezone=Asia%2FTokyo&forecast_days=1';
    const response = await axios.get(url);
    const data = response.data;
    console.log(data);
    return data;
  } catch (error) {
    console.error('Error fetching weather data:', error);
  }
}

export const runWeatherAPI = async () => {
  const llm = new OpenAI({
    openAIApiKey: OPENAIAPI,
    temperature: 0.9,
    modelName: 'gpt-4',
  });
  const dora = `
今日どのように行動したらいいかドラえもんになって解説してください。
`;

  const chain = new ConversationChain({ llm });

  const weather = await fetchWeatherData();
  const input1 = `${JSON.stringify(weather)}は最新の天気情報です。${dora}`;
  const res1 = await chain.call({ input: input1 });
  return res1.response;
};
