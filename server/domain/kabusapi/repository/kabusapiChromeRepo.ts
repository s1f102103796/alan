import { chromium } from 'playwright';
import type { KabusUserInfo } from '../model/kabusapiTypes';

const getChrome = async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage({ locale: 'ja-JP' });

  return { browser, page };
};

export const kabusapiChromeRepo = {
  login: async (userInfo: KabusUserInfo) => {
    const { browser, page } = await getChrome();
    await page.goto('https://www.sbisec.co.jp/ETGate');
    await page.fill('[name="user_id"]', userInfo.id);
    await page.click('[name="ACT_login"]');
    await page.waitForSelector('#logout');

    return { browser, page };
  },
};
