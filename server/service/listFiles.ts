import { readdirSync } from 'fs';

export const listFiles = (dir: string): string[] =>
  readdirSync(dir, { withFileTypes: true }).flatMap((dirent) =>
    dirent.isFile() ? [`${dir}/${dirent.name}`] : listFiles(`${dir}/${dirent.name}`)
  );
