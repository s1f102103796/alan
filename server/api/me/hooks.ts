import type { UserModel } from '$/commonTypesWithClient/appModels';
import { getUserModel } from '$/service/firebaseAdmin';
import { githubIdParser, userIdParser } from '$/service/idParsers';
import { defineHooks } from './$relay';

export type AdditionalRequest = {
  user: UserModel;
};

export default defineHooks(() => ({
  preHandler: async (req, res) => {
    const user = await getUserModel(req.cookies.session);

    if (user === null) {
      res.status(401).send();
      return;
    }

    req.user = {
      id: userIdParser.parse(user.uid),
      githubId: githubIdParser.parse(
        user.providerData.find(({ providerId }) => providerId === 'github.com')?.uid
      ),
      email: user.email ?? '',
      displayName: user.displayName,
      photoURL: user.photoURL,
    };
  },
}));
