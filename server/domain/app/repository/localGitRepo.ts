import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { AppId } from '$/commonTypesWithClient/branded';
import { GITHUB_TOKEN } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'fs';
import isBinaryPath from 'is-binary-path';
import { dirname } from 'path';
import simpleGit, { ResetMode } from 'simple-git';
import type { GitDiffModel } from './llmRepo';

export type LocalGitFile = { source: string; content: string };

export type LocalGitModel = { appId: AppId; message: string; files: LocalGitFile[] };

export const testBranch = 'deus/test';

const typesBranch = 'copy-with-types';

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((dirent) =>
    dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`)
  );

const genPathes = (app: AppModel) => ({
  dirPath: `appRepositories/${app.displayId}`,
  gitPath: `github.com/deus-app/${app.displayId}.git`,
});

export const localGitRepo = {
  getFiles: async (app: AppModel): Promise<LocalGitModel> => {
    const { dirPath, gitPath } = genPathes(app);

    if (!existsSync(dirPath)) {
      await simpleGit().clone(`https://${gitPath}`, dirPath, ['-b', typesBranch]);
    } else {
      await simpleGit(dirPath)
        .fetch('origin', typesBranch)
        .checkout(typesBranch)
        .reset(ResetMode.HARD, [`origin/${typesBranch}`]);
    }

    const message = await simpleGit(dirPath)
      .log({ format: '%B', maxCount: 1 })
      .then((e) => e.latest);

    customAssert(message, 'エラーならロジック修正必須');

    return {
      appId: app.id,
      message,
      files: listFiles(dirPath).flatMap((file) =>
        isBinaryPath(file) || file.includes('/.git/')
          ? []
          : { source: file.replace(`${dirPath}/`, ''), content: readFileSync(file, 'utf8') }
      ),
    };
  },
  pushToRemote: async (app: AppModel, gitDiff: GitDiffModel) => {
    const { dirPath, gitPath } = genPathes(app);

    await simpleGit(dirPath).fetch().reset(ResetMode.HARD, ['origin/main']);

    gitDiff.diffs.forEach((file) => {
      const filePath = `${dirPath}/${file.source}`;
      if (!existsSync(dirname(filePath))) mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(`${dirPath}/${file.source}`, file.content, 'utf8');
    });

    await simpleGit(dirPath)
      .add('./*')
      .commit(gitDiff.newMessage, {
        '--author': '"github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>"',
      })
      .push(`https://${GITHUB_TOKEN}@${gitPath}`, `HEAD:${testBranch}`, ['-f']);
  },
};
