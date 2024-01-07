import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { AppId } from '$/commonTypesWithClient/branded';
import { GITHUB_OWNER, GITHUB_TOKEN } from '$/service/envValues';
import { customAssert } from '$/service/returnStatus';
import { existsSync, mkdirSync, readFileSync, readdirSync, unlinkSync, writeFileSync } from 'fs';
import isBinaryPath from 'is-binary-path';
import { dirname } from 'path';
import simpleGit, { ResetMode } from 'simple-git';
import type { GitDiffModel } from './llmRepo';

const remoteBranches = {
  main: 'main',
  testTypes: 'deus/test-types',
  mainTypes: 'deus/main-types',
  test: 'deus/test',
  dbSchema: 'deus/db-schema',
  apiDefinition: 'deus/api-definition',
} as const;

export type RemoteBranch = (typeof remoteBranches)[keyof typeof remoteBranches];

export type LocalGitFile = { source: string; content: string };

export type LocalGitModel = {
  appId: AppId;
  message: string;
  remoteBranch: RemoteBranch;
  files: LocalGitFile[];
};

const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((dirent) =>
    dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`)
  );

const genPathes = (app: AppModel, remoteBranch: RemoteBranch) => ({
  dirPath: `appRepositories/${app.displayId}/${remoteBranch}`,
  gitPath: `github.com/${GITHUB_OWNER}/${app.displayId}.git`,
});

export const localGitRepo = {
  getFiles: async (app: AppModel, remoteBranch: RemoteBranch): Promise<LocalGitModel> => {
    const { dirPath, gitPath } = genPathes(app, remoteBranch);

    if (!existsSync(dirPath)) {
      await simpleGit().clone(`https://${gitPath}`, dirPath);
    } else {
      await simpleGit(dirPath).fetch('origin', remoteBranch);
    }

    await simpleGit(dirPath)
      .checkout(remoteBranch)
      .reset(ResetMode.HARD, [`origin/${remoteBranch}`])
      .catch(() =>
        simpleGit(dirPath)
          .checkout(remoteBranches.mainTypes)
          .reset(ResetMode.HARD, [`origin/${remoteBranches.mainTypes}`])
      );

    const log = await simpleGit(dirPath)
      .log({ maxCount: 1 })
      .then((e) => e.latest);

    customAssert(log, 'エラーならロジック修正必須');

    return {
      appId: app.id,
      message: log.message,
      remoteBranch,
      files: listFiles(dirPath).flatMap((file) =>
        isBinaryPath(file) || file.includes('/.git/')
          ? []
          : { source: file.replace(`${dirPath}/`, ''), content: readFileSync(file, 'utf8') }
      ),
    };
  },
  pushToRemote: async (app: AppModel, gitDiff: GitDiffModel, remoteBranch: RemoteBranch) => {
    const { dirPath, gitPath } = genPathes(app, remoteBranch);

    if (!existsSync(dirPath)) {
      await simpleGit().clone(`https://${gitPath}`, dirPath);
    } else {
      await simpleGit(dirPath).fetch('origin', remoteBranch);
    }

    await simpleGit(dirPath)
      .checkout(remoteBranch)
      .reset(ResetMode.HARD, [`origin/${remoteBranch}`])
      .catch(() => simpleGit(dirPath).reset(ResetMode.HARD, [`origin/${remoteBranches.main}`]));

    gitDiff.deletedFiles.forEach((source) => {
      const filePath = `${dirPath}/${source}`;
      if (existsSync(filePath)) unlinkSync(filePath);
    });

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
      .push(`https://${GITHUB_TOKEN}@${gitPath}`, `HEAD:${remoteBranch}`, ['-f']);
  },
};
