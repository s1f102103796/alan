import axios from 'axios';
import { ConversationChain } from 'langchain/chains';
import { OpenAI } from 'langchain/llms/openai';
import { NEWSAPI, OPENAIAPI } from '../service/envValues';

const apiUrl = 'https://newsapi.org/v2/top-headlines';
const params = {
  country: 'jp',
  apiKey: NEWSAPI,
  sortBy: 'publishedAt',
  pagesize: 5,
  category: 'entertainment',
};
interface Article {
  title: string;
  description: string;
}
const getNews = async () => {
  const response = await axios.get(apiUrl, { params });
  const articles = response.data.articles;

  let newsString = '';
  articles.forEach((articles: Article, index: number) => {
    newsString += `Article ${index + 1}:`;
    newsString += `Title: ${articles.title}`;
    newsString += `Description: ${articles.description}`;
  });
  return newsString;
};

const dora = `
ニュースを見てドラえもんのように解説してください。
`;

export const runNewsAPI_LANGCHAIN = async () => {
  const llm = new OpenAI({
    openAIApiKey: OPENAIAPI,
    temperature: 0.9,
  });

  const chain = new ConversationChain({ llm });

  const news = await getNews();
  const input1 = `${JSON.stringify(news)}は最新のトップニュースです。${dora}`;
  const res1 = await chain.call({ input: input1 });
  return res1;
};
