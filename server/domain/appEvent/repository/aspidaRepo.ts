import type { AppModel } from '$/commonTypesWithClient/appModels';
import type { LocalGitFile } from '$/domain/app/repository/localGitRepo';
import { localGitRepo } from '$/domain/app/repository/localGitRepo';
import { listFiles } from '$/service/listFiles';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import openapi2aspida from 'openapi2aspida';
import { tmpdir } from 'os';
import { join } from 'path';
import { sources } from './llmRepo';

export const aspidaRepo = {
  generateFromOpenapi: async (app: AppModel) => {
    const openapi = await localGitRepo.fetchRemoteFileOrThrow(
      app,
      'deus/api-definition',
      sources.openapi
    );
    const tmpApiDir = join(tmpdir(), app.displayId);
    if (!existsSync(tmpApiDir)) mkdirSync(tmpApiDir);

    const openapiPath = join(tmpApiDir, 'openapi.json');
    writeFileSync(openapiPath, openapi.content, 'utf8');
    const outputDir = join(tmpApiDir, 'server/api');
    if (existsSync(outputDir)) rmSync(outputDir, { recursive: true, force: true }); // エラーで残ることがあるのをopenapi2aspidaのために空にしておく

    await Promise.all(
      openapi2aspida({
        input: outputDir,
        openapi: { inputFile: openapiPath, yaml: false, outputDir },
      })
    );

    const aspidaFiles = listFiles(outputDir).map(
      (file): LocalGitFile => ({
        source: file.replace(tmpApiDir, ''),
        content: readFileSync(file, 'utf8'),
      })
    );

    rmSync(tmpApiDir, { recursive: true, force: true });

    return aspidaFiles;
  },
};
