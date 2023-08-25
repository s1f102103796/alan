import type { TaskModel } from '$/commonTypesWithClient/models';
import type { Prisma, Task } from '@prisma/client';
import { randomUUID } from 'crypto';
import { taskIdParser } from '../service/idParsers';
import { prismaClient } from '../service/prismaClient';
import { func } from './Task';

const toModel = (prismaTask: Task): TaskModel => ({
  id: taskIdParser.parse(prismaTask.id),
  label: prismaTask.label,
  done: prismaTask.done,
  created: prismaTask.createdAt.getTime(),
});

export const getTasks = async (limit?: number): Promise<TaskModel[]> => {
  const prismaTasks = await prismaClient.task.findMany({
    take: limit,
    orderBy: { createdAt: 'desc' },
  });

  return prismaTasks.map(toModel);
};

export const createTask = async (label: TaskModel['label']): Promise<TaskModel> => {
  const anser = await func(label);

  // // 新規ブラウザ起動
  // const browser = await playwright.chromium.launch({ headless: false });
  // const context = await browser.newContext();
  // const page = await context.newPage();
  // await page.goto('https://twitter.com/login');
  // // ログイン情報
  // await page.getByLabel('電話番号/メールアドレス/ユーザー名').fill('ini5thji');
  // await page.getByLabel('電話番号/メールアドレス/ユーザー名').press('Enter');
  // await page.getByLabel('パスワード', { exact: true }).fill('iniad5thjissyuu');
  // await page.getByLabel('パスワード', { exact: true }).press('Enter');

  // // ツイート内容入力
  // const tweetTextbox = await page.getByRole('textbox', { name: 'Tweet text' });
  // await tweetTextbox.click();
  // await tweetTextbox.fill('aaa');

  // //文章にハッシュタグが含まれるとツイートできないため＃がある場合エスケープキーをおす
  // // if(content.includes("#")){
  // //     await tweetTextbox.press('Escape')
  // // }
  // // ツイート
  // await page.getByTestId('tweetButtonInline').click();
  // await page.waitForTimeout(10000);
  // await browser.close();

  if (typeof anser !== 'string') {
    throw new Error('anser must be a string');
  }
  const prismaTask = await prismaClient.task.create({
    data: { id: randomUUID(), done: false, label: anser, createdAt: new Date() },
  });

  return toModel(prismaTask);
};

export const updateTask = async (
  id: string,
  partialTask: Prisma.TaskUpdateInput
): Promise<TaskModel> => {
  const prismaTask = await prismaClient.task.update({ where: { id }, data: partialTask });

  return toModel(prismaTask);
};

export const deleteTask = async (id: string): Promise<TaskModel> => {
  const prismaTask = await prismaClient.task.delete({ where: { id } });

  return toModel(prismaTask);
};
