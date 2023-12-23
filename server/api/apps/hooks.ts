import type { UserModel } from '$/commonTypesWithClient/appModels';
import { userQuery } from '$/domain/user/query/userQuery';
import { getUserRecord } from '$/service/firebaseAdmin';
import { prismaClient } from '$/service/prismaClient';
import { defineHooks } from './$relay';

export type AdditionalRequest = {
  user: UserModel;
};

export default defineHooks(() => ({
  preHandler: async (req, res) => {
    const user = await getUserRecord(req.cookies.session).then((user) =>
      user === null ? null : userQuery.findById(prismaClient, user.uid)
    );

    if (user === null) {
      res.status(401).send();
      return;
    }

    req.user = user;
  },
}));
