import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { AppId } from '$/commonTypesWithClient/branded';
import type { GitDiffModel } from '$/domain/appEvent/repository/llmRepo';
import { GITHUB_OWNER, GITHUB_TOKEN } from '$/service/envValues';
import { listFiles } from '$/service/listFiles';
import { customAssert } from '$/service/returnStatus';
import { existsSync, mkdirSync, readFileSync, unlinkSync, writeFileSync } from 'fs';
import isBinaryPath from 'is-binary-path';
import { dirname } from 'path';
import simpleGit, { ResetMode } from 'simple-git';

const remoteBranches = {
  main: 'main',
  testClient: 'deus/test-client',
  testServer: 'deus/test-server',
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
  deletedFiles: LocalGitFile[];
};

const genPathes = (app: AppModel, remoteBranch: RemoteBranch) => ({
  dirPath: `appRepositories/${app.displayId}/${remoteBranch}`,
  gitPath: `github.com/${GITHUB_OWNER}/${app.displayId}.git`,
  deletedFilesJson: `appRepositories/${app.displayId}/${remoteBranch}/deletedFiles.json`,
});

const fetchBranch = async (app: AppModel, remoteBranch: RemoteBranch, baseBranch: RemoteBranch) => {
  const { dirPath, gitPath } = genPathes(app, remoteBranch);

  if (existsSync(dirPath)) {
    await simpleGit(dirPath)
      .fetch('origin', remoteBranch)
      .catch(() => simpleGit(dirPath).fetch('origin', baseBranch));
  } else {
    await simpleGit().clone(`https://${gitPath}`, dirPath);
  }

  await simpleGit(dirPath)
    .checkout(remoteBranch)
    .reset(ResetMode.HARD, [`origin/${remoteBranch}`])
    .catch(() =>
      simpleGit(dirPath)
        .checkout(baseBranch)
        .reset(ResetMode.HARD, [`origin/${baseBranch}`])
    );
};

export const localGitRepo = {
  getFiles: async (app: AppModel, remoteBranch: RemoteBranch): Promise<LocalGitModel> => {
    await fetchBranch(app, remoteBranch, 'main');

    const { dirPath, deletedFilesJson } = genPathes(app, remoteBranch);
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
      deletedFiles: existsSync(deletedFilesJson)
        ? JSON.parse(readFileSync(deletedFilesJson, 'utf8'))
        : [],
    };
  },
  getApiFiles: (app: AppModel) =>
    localGitRepo
      .getFiles(app, 'deus/api-definition')
      .then((res) => res.files.filter((f) => f.source.startsWith('server/api/'))),
  getLogs: async (app: AppModel, remoteBranch: RemoteBranch) => {
    await fetchBranch(app, remoteBranch, 'main');

    const { dirPath } = genPathes(app, remoteBranch);
    const log = await simpleGit(dirPath).checkout(remoteBranch).log();
    return log.all;
  },
  pushToRemoteOrThrow: async (
    app: AppModel,
    localGit: LocalGitModel | undefined,
    gitDiff: GitDiffModel,
    remoteBranch: RemoteBranch
  ) => {
    await fetchBranch(app, remoteBranch, 'main');

    const { dirPath, gitPath, deletedFilesJson } = genPathes(app, remoteBranch);

    gitDiff.deletedFiles.forEach((source) => {
      const filePath = `${dirPath}/${source}`;
      if (existsSync(filePath)) unlinkSync(filePath);
    });

    if (remoteBranch === 'main') {
      unlinkSync(deletedFilesJson);
    } else if (localGit !== undefined) {
      const newDeletedFiles: LocalGitFile[] = [
        ...localGit.deletedFiles.filter((del) =>
          gitDiff.diffs.every((d) => d.source !== del.source)
        ),
        ...gitDiff.deletedFiles.flatMap((f) =>
          localGit.files.flatMap((file) => (file.source === f ? file : []))
        ),
      ];

      writeFileSync(deletedFilesJson, JSON.stringify(newDeletedFiles, null, 2), 'utf8');
    }

    gitDiff.diffs.forEach((file) => {
      const filePath = `${dirPath}/${file.source}`;
      if (!existsSync(dirname(filePath))) mkdirSync(dirname(filePath), { recursive: true });
      writeFileSync(`${dirPath}/${file.source}`, file.content, 'utf8');
    });

    const { pushed } = await simpleGit(dirPath)
      .add('./*')
      .commit(gitDiff.newMessage, {
        '--author': '"github-actions[bot] <41898282+github-actions[bot]@users.noreply.github.com>"',
      })
      .push(`https://${GITHUB_TOKEN}@${gitPath}`, `HEAD:${remoteBranch}`, ['-f']);

    if (pushed[0]?.alreadyUpdated === true) throw new Error(`${app.displayId} alreadyUpdated`);
  },
};
