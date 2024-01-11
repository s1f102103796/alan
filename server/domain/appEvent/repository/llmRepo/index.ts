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
import { aspidaRepo } from '../aspidaRepo';
import { invokeOrThrow } from './invokeOrThrow';
import { prompts } from './prompts';

export type GitDiffModel = { diffs: LocalGitFile[]; deletedFiles: string[]; newMessage: string };

const sources = { schema: 'server/prisma/schema.prisma', openapi: 'server/openapi.json' };
const codeValidator = z.object({
  message: z.string(),
  files: z.array(z.object({ source: z.string(), content: z.string() })),
  deletedFiles: z.array(z.string()),
});
const filterClient = (source: string) =>
  source.startsWith('client/src/') && !source.startsWith('client/src/api/');
const filterServer = (source: string) => source.startsWith('server/domain/');
const toClientDiffs = (files: LocalGitFile[]) => files.filter((file) => filterClient(file.source));
const toServerDiffs = (files: LocalGitFile[]) => files.filter((file) => filterServer(file.source));
const toClientDeletedFiles = (deletedFiles: string[]) => deletedFiles.filter(filterClient);
const toServerDeletedFiles = (deletedFiles: string[]) => deletedFiles.filter(filterServer);

export const llmRepo = {
  initSchema: async (app: AppModel): Promise<GitDiffModel> => {
    const prompt = prompts.initSchema(app);
    const prismaHeader = `datasource db {
  provider = "postgresql"
  url      = env("API_DATABASE_URL")
}\n
generator client {
  provider = "prisma-client-js"
}\n\n`;
    const validator = z.object({ prismaSchema: z.string() });
    let result = await invokeOrThrow(app, prompt, validator, []);

    for (let i = 0; i < 3; i += 1) {
      if (!/model User ?{[^}]+?( id )[^}]+?( email )[^}]+?( name )/.test(result.prismaSchema)) {
        result = await invokeOrThrow(app, prompt, validator, [
          ['assistant', result.prismaSchema],
          ['user', 'User modelに指定のカラムが含まれていません。修正してください。'],
        ]);

        continue;
      }

      const filePath = join(tmpdir(), `${app.displayId}-${Date.now()}-schema.prisma`);
      writeFileSync(filePath, `${prismaHeader}${result.prismaSchema}`, 'utf8');
      const { stderr } = await promisify(exec)(`npx prisma format --schema ${filePath}`).catch(
        (e) => ({ stderr: e.message as string })
      );
      const content = readFileSync(filePath, 'utf8');
      unlinkSync(filePath);

      if (!stderr.includes('Error')) {
        return {
          diffs: [{ source: sources.schema, content }],
          deletedFiles: [],
          newMessage: 'DBスキーマの定義',
        };
      }

      result = await invokeOrThrow(app, prompt, validator, [
        ['assistant', result.prismaSchema],
        ['user', `以下のエラーを修正してください。\n${stderr}`],
      ]);
    }

    throw new Error('schema.prismaを正しく生成できませんでした。');
  },
  initApiDef: async (app: AppModel, localGit: LocalGitModel): Promise<LocalGitFile[]> => {
    const schema = localGit.files.find((file) => file.source === sources.schema);
    customAssert(schema, 'エラーならロジック修正必須');

    const prompt = prompts.initApiDef(app, schema);
    const validator = z.object({}).passthrough();
    let result = await invokeOrThrow(app, prompt, validator, []);

    for (let i = 0; i < 3; i += 1) {
      const filePath = join(tmpdir(), `${app.displayId}-${Date.now()}-openapi.json`);
      const openapi = JSON.stringify(result, null, 2);
      writeFileSync(filePath, openapi, 'utf8');
      const err = await SwaggerParser.validate(filePath)
        .then(() => null)
        .catch((e) => e.message as string);
      unlinkSync(filePath);

      if (err === null) return aspidaRepo.generateFromOpenapi(openapi);

      result = await invokeOrThrow(app, prompt, validator, [
        ['assistant', openapi],
        ['user', `以下のエラーを修正してください。\n${err}`],
      ]);
    }

    throw new Error('openapi.jsonを正しく生成できませんでした。');
  },
  initClient: async (
    app: AppModel,
    localGit: LocalGitModel,
    aspidaGit: LocalGitFile[]
  ): Promise<GitDiffModel> => {
    const prompt = prompts.initClient(app, localGit, aspidaGit);
    const result = await invokeOrThrow(app, prompt, codeValidator, []);

    return {
      newMessage: result.message,
      diffs: toClientDiffs(result.files),
      deletedFiles: toClientDeletedFiles(result.deletedFiles),
    };
  },
  initServer: async (
    app: AppModel,
    localGit: LocalGitModel,
    aspidaGit: LocalGitFile[]
  ): Promise<GitDiffModel> => {
    const prompt = prompts.initServer(app, localGit, aspidaGit);
    const result = await invokeOrThrow(app, prompt, codeValidator, []);

    return {
      newMessage: result.message,
      diffs: toServerDiffs(result.files),
      deletedFiles: toServerDeletedFiles(result.deletedFiles),
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
      diffs: toClientDiffs(result.files),
      deletedFiles: toClientDeletedFiles(result.deletedFiles),
    };
  },
  fixServer: async (
    app: AppModel,
    localGit: LocalGitModel,
    failedStep: GHStepModel
  ): Promise<GitDiffModel> => {
    const prompt = prompts.fixServer(app, localGit, failedStep);
    const result = await invokeOrThrow(app, prompt, codeValidator, []);

    return {
      newMessage: result.message,
      diffs: toServerDiffs(result.files),
      deletedFiles: toServerDeletedFiles(result.deletedFiles),
    };
  },
};
