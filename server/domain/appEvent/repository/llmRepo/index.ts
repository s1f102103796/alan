import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { GHStepModel } from '$/domain/app/model/githubModels';
import type { LocalGitFile, LocalGitModel } from '$/domain/app/repository/localGitRepo';
import { customAssert } from '$/service/returnStatus';
import SwaggerParser from '@apidevtools/swagger-parser';
import { exec } from 'child_process';
import { readFileSync, unlinkSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { promisify } from 'util';
import { z } from 'zod';
import { invokeOrThrow } from './invokeOrThrow';
import { prompts } from './prompts';

export type GitDiffModel = {
  diffs: LocalGitFile[];
  deletedFiles: string[];
  silentDeletedFiles: string[];
  newMessage: string;
};

export const sources = { schema: 'server/prisma/schema.prisma', openapi: 'server/openapi.json' };

const codeValidator = z.object({
  message: z.string(),
  files: z.array(z.object({ source: z.string(), content: z.string() })),
  deletedFiles: z.array(z.string()),
});

const toDiffs = (files: LocalGitFile[]) =>
  files.filter(
    (file) => file.source.startsWith('client/') && !['package.json'].includes(file.source)
  );

const toDeletedFiles = (deletedFiles: string[]) =>
  deletedFiles.filter((file) => file.startsWith('client/') && !['package.json'].includes(file));

const toSilentDeletedFiles = (localGit: LocalGitModel) =>
  localGit.files
    .filter(
      (file) =>
        !file.source.startsWith('server/api') &&
        !file.source.startsWith('server/commonTypesWithClient') &&
        /^server\/.+\//.test(file.source)
    )
    .map((file) => file.source);

export const llmRepo = {
  initSchema: async (app: AppModel): Promise<GitDiffModel> => {
    const prompt = prompts.initSchema(app);
    const prismaHeader = `datasource db {
  provider = "postgresql"
  url      = env("API_DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

`;

    const validator = z.object({ prismaSchema: z.string() });
    let result = await invokeOrThrow(app, prompt, validator, []);

    for (let i = 0; i < 3; i += 1) {
      if (!/model User ?{[^}]+?( id )[^}]+?( email )[^}]+?( name )/.test(result.prismaSchema)) {
        result = await invokeOrThrow(app, prompt, validator, [
          ['ai', result.prismaSchema],
          ['human', 'User modelに指定のカラムが含まれていません。修正してください。'],
        ]);
        continue;
      }

      const filePath = join(tmpdir(), `${app.displayId}-${Date.now()}-schema.prisma`);
      writeFileSync(filePath, `${prismaHeader}${result.prismaSchema}`, 'utf8');
      const { stderr } = await promisify(exec)(`npx prisma format --schema ${filePath}`);
      const content = readFileSync(filePath, 'utf8');
      unlinkSync(filePath);

      if (!stderr.includes('Error')) {
        return {
          diffs: [{ source: sources.schema, content }],
          deletedFiles: [],
          silentDeletedFiles: [],
          newMessage: 'DBスキーマの定義',
        };
      }

      result = await invokeOrThrow(app, prompt, validator, [
        ['ai', result.prismaSchema],
        ['human', `以下のエラーを修正してください。\n${stderr}`],
      ]);
    }

    throw new Error('schema.prismaを正しく生成できませんでした。');
  },
  initApiDef: async (app: AppModel, localGit: LocalGitModel): Promise<GitDiffModel> => {
    const schema = localGit.files.find((file) => file.source === sources.schema);
    customAssert(schema, 'エラーならロジック修正必須');

    const prompt = prompts.initApiDef(app, schema);
    const validator = z.object({}).passthrough();
    let result = await invokeOrThrow(app, prompt, validator, []);

    for (let i = 0; i < 3; i += 1) {
      const filePath = join(tmpdir(), `${app.displayId}-${Date.now()}-openapi.json`);
      const content = JSON.stringify(result, null, 2);
      writeFileSync(filePath, content, 'utf8');
      const err = await SwaggerParser.validate(filePath)
        .then(() => null)
        .catch((e) => e.message as string);
      unlinkSync(filePath);

      if (err === null) {
        return {
          diffs: [{ source: sources.openapi, content }],
          deletedFiles: [],
          silentDeletedFiles: [],
          newMessage: 'REST APIエンドポイントの定義',
        };
      }

      result = await invokeOrThrow(app, prompt, validator, [
        ['ai', content],
        ['human', `以下のエラーを修正してください。\n${err}`],
      ]);
    }

    throw new Error('openapi.jsonを正しく生成できませんでした。');
  },
  initClient: async (
    app: AppModel,
    localGit: LocalGitModel,
    aspidaFiles: LocalGitFile[]
  ): Promise<GitDiffModel> => {
    const prompt = prompts.initClient(app, localGit, aspidaFiles);
    const result = await invokeOrThrow(app, prompt, codeValidator, []);
    const deletedApis = localGit.files.filter(
      (file) =>
        file.source.startsWith('server/api') &&
        aspidaFiles.every((api) => api.source !== file.source)
    );

    return {
      newMessage: result.message,
      diffs: [...toDiffs(result.files), ...aspidaFiles],
      deletedFiles: [...deletedApis.map((a) => a.source), ...toDeletedFiles(result.deletedFiles)],
      silentDeletedFiles: toSilentDeletedFiles(localGit),
    };
  },
  fixClient: async (
    app: AppModel,
    localGit: LocalGitModel,
    failedStep: GHStepModel
  ): Promise<GitDiffModel> => {
    const prompt = prompts.fixClient(app, localGit, failedStep);
    const result = await invokeOrThrow(app, prompt, codeValidator, []);

    return {
      newMessage: result.message,
      diffs: toDiffs(result.files),
      deletedFiles: toDeletedFiles(result.deletedFiles),
      silentDeletedFiles: toSilentDeletedFiles(localGit),
    };
  },
};
