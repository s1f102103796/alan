import type { UserModel } from '$/commonTypesWithClient/appModels';
import { transaction } from '$/service/prismaClient';
import type { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { userMethods } from '../model/userMethods';
import { userQuery } from '../query/userQuery';
import { userRepo } from '../repository/userRepo';

export const userUseCase = {
  findOrCreate: (userRecord: UserRecord) =>
    transaction<UserModel>('RepeatableRead', async (tx) => {
      const user = await userQuery.findById(tx, userRecord.uid);
      if (user !== null) return user;

      const newUser = userMethods.create(userRecord);
      await userRepo.save(tx, newUser);

      return newUser;
    }),
};
