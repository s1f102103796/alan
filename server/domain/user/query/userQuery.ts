import type { UserModel } from '$/commonTypesWithClient/appModels';
import { ghUserIdParser, userIdParser } from '$/service/idParsers';
import type { Prisma, User } from '@prisma/client';

const toUser = (prismaUser: User) => ({
  id: userIdParser.parse(prismaUser.id),
  githubId: ghUserIdParser.parse(prismaUser.githubId),
  email: prismaUser.email,
  displayName: prismaUser.displayName ?? undefined,
  photoURL: prismaUser.photoURL ?? undefined,
  createdTime: prismaUser.createdAt.getTime(),
});

export const userQuery = {
  findById: (tx: Prisma.TransactionClient, id: string): Promise<UserModel | null> =>
    tx.user.findUnique({ where: { id } }).then((user) => (user !== null ? toUser(user) : null)),
};
