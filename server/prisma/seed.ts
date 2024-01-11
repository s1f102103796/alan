import { userQuery } from '$/domain/user/query/userQuery';
import { GITHUB_OWNER } from '$/service/envValues';
import { prismaClient } from '$/service/prismaClient';
import { randomUUID } from 'crypto';

async function main() {
  const hasDeusUser = (await userQuery.countByGithubId(GITHUB_OWNER)) > 0;
  if (hasDeusUser) return;

  await prismaClient.user.create({
    data: {
      id: randomUUID(),
      githubId: GITHUB_OWNER,
      email: 'deus@example.com',
      displayName: 'Deus lo vult',
      createdAt: new Date(),
    },
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  });
