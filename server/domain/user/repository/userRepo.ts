import type { UserModel } from '$/commonTypesWithClient/appModels';
import type { Prisma } from '@prisma/client';

export const userRepo = {
  save: async (tx: Prisma.TransactionClient, user: UserModel) => {
    return tx.user.upsert({
      where: { id: user.id },
      update: { email: user.email, displayName: user.displayName, photoURL: user.photoURL },
      create: {
        id: user.id,
        githubId: user.githubId,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        createdAt: new Date(user.createdTime),
      },
    });
  },
};
