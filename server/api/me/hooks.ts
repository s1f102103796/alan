import type { UserModel } from '$/commonTypesWithClient/appModels';
import { userUseCase } from '$/domain/user/userCase/userUseCase';
import { getUserRecord } from '$/service/firebaseAdmin';
import { defineHooks } from './$relay';

export type AdditionalRequest = {
  user: UserModel;
};

export default defineHooks(() => ({
  preHandler: async (req, res) => {
    const user = await getUserRecord(req.cookies.session);

    if (user === null) {
      res.status(401).send();
      return;
    }

    req.user = await userUseCase.findOrCreateUser(user);
  },
}));
