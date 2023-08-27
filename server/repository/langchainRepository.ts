import type { DolanModel } from '$/commonTypesWithClient/models';
import { OPENAIAPI, TWITTER_PASSWORD, TWITTER_USERNAME } from '$/service/envValues';
import { userIdParser } from '$/service/idParsers';
import { prismaClient } from '$/service/prismaClient';
import type { Dolan } from '@prisma/client';
import { OpenAI } from 'langchain';
import { ConversationChain } from 'langchain/chains';
import type { Browser, BrowserContext, Page } from 'playwright';
import { chromium } from 'playwright';
import { stringify } from 'querystring';
import { fetchGourmetData } from './gourmetRepository';
import { getNews } from './newsapiRepository';
import { fetchWeatherData } from './weatherrepository';

export const toDolanModel = (prismaClient: Dolan): DolanModel => ({
  id: userIdParser.parse(prismaClient.id),
  message: prismaClient.message,
});

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

export const langchainAPI = async (id: string, values: { [key: number]: boolean }) => {
  const llm = new OpenAI({
    openAIApiKey: OPENAIAPI,
    temperature: 0.9,
    modelName: 'gpt-4',
  });
  const dora = `
この情報を元に今日どのように行動したらいいかドラえもんになってのび太君に100文字くらいで教えるように教えて。もし情報がなかったら「どら焼き大好き」だけ返してください。
`;
  // ドラえもんは次のような言葉を話します。
  // 「のび太、また宿題忘れたの？」
  // 「だめだよ、そんな道具を使うとトラブルになるよ。」
  // 「タケコプターを使う時は気をつけてね。」
  // 「どら焼き、まだあるかな？」
  // 「のび太、タイムマシンで遊んじゃダメだよ。」
  // 「また、4次元ポケットから何か出してほしいの？」
  // 「のび太、しずかちゃんとの約束、忘れてない？」
  // 「ジャイアンには、ちゃんと断る勇気を持たなきゃ。」
  // 「そのボタン、押さないで！大変なことになるから。」
  // 「セワシくんにメッセージが来てるよ。」
  // 「のび太、今度の道具は特に注意して使ってね。」
  // 「ミニドラも、あんまり無理させちゃだめだよ。」
  // 「またスネ夫とケンカしたの？」
  // 「のび太、最近どんな夢を見た？」
  // 「ほら、アイスメーカーでアイスを作るか？」
  // 「のび太、早くしないとデキビリスが来ちゃうよ。」
  // 「そうそう、新しい道具を持ってきたんだ。見る？」
  // 「のび太、今日の天気予報知りたい？」
  // 「のび太、お風呂入る前に、どら焼き食べても大丈夫？」
  // 「今日は何か特別な予定があるのかな？」

  let news = '';
  if (values[0] === true) {
    news = await getNews();
  }
  let weather = '';
  if (values[1] === true) {
    weather = await fetchWeatherData();
  }
  let gourmet = '';
  if (values[2] === true) {
    gourmet = await fetchGourmetData();
  }

  const chain = new ConversationChain({ llm });
  const input1 = `${JSON.stringify(news)}${JSON.stringify(weather)}${JSON.stringify(
    gourmet
  )}は最新の情報です。${dora}`;
  const res1 = await chain.call({ input: input1 });
  const TweetContent = stringify(res1.response);

  console.log('TweetContent', TweetContent);
  if (TweetContent.length <= 140) {
    Tweet(TweetContent);
  }
  dolanRepository.save(id, res1.response.toString());
  return res1.response;
};

const dolanRepository = {
  save: async (id: string, dolananser: string) => {
    await prismaClient.dolan.create({
      data: { id, message: dolananser },
    });
    return;
  },
};

export const getDolan = async (id: string) => {
  const dolan = await prismaClient.dolan.findMany({
    where: { id },
  });
  return dolan.map(toDolanModel);
};
