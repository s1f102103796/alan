import type { LocalGitFile } from '$/domain/app/repository/localGitRepo';
import { listFiles } from '$/service/listFiles';
import { randomUUID } from 'crypto';
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'fs';
import openapi2aspida from 'openapi2aspida';
import { tmpdir } from 'os';
import { join } from 'path';

export const aspidaRepo = {
  generateFromOpenapi: async (openapi: string) => {
    const tmpApiDir = join(tmpdir(), `deus-${randomUUID()}`);
    if (!existsSync(tmpApiDir)) mkdirSync(tmpApiDir);

    const openapiPath = join(tmpApiDir, 'openapi.json');
    writeFileSync(openapiPath, openapi, 'utf8');
    const outputDir = join(tmpApiDir, 'server/api');

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
