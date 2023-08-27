import { OPENAIAPI, TWITTER_PASSWORD, TWITTER_USERNAME } from '$/service/envValues';
import { OpenAI } from 'langchain';
import { ConversationChain } from 'langchain/chains';
import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import { stringify } from 'querystring';
import { getNews } from './newsapiRepository';
import { fetchWeatherData } from './weatherrepository';

let browser: Browser | null = null;
let context: BrowserContext | null = null;
let page: Page | null = null;

const getLoggedInPage = async () => {
  if (page?.isClosed() === false) return page;

  browser = await chromium.launch({ headless: false });
  context = await browser.newContext({ locale: 'ja-JP' });
  page = await context.newPage();

  await page.goto(origin);
  await page.getByTestId('loginButton').click();
  await page.locator('input[autocomplete="username"]').fill(TWITTER_USERNAME);
  await page.getByText('次へ').click();
  await page.locator('input[name="password"]').fill(TWITTER_PASSWORD);
  await page.getByTestId('LoginForm_Login_Button').click();
  await page.getByTestId('SideNav_NewTweet_Button').waitFor();

  return page;
};

const Tweet = async (contents: string) => {
  const page = await getLoggedInPage();

  await page.goto(`${origin}/home`);

  const tweetTextBox = await page.getByRole('textbox', { name: 'Tweet text' });
  await tweetTextBox.click();

  const content = contents;

  await tweetTextBox.fill(content);

  await page.getByTestId('tweetButtonInline').click();

  return content;
};

export const langchainAPI = async () => {
  console.log('AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA');
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
  const TweetContent = stringify(res1.response);

  console.log('TweetContent', TweetContent);
  if (TweetContent.length <= 140) {
    Tweet(TweetContent);
  }
  return res1.response;
};
