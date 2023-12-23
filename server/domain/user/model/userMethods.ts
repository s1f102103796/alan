import type { UserModel } from '$/commonTypesWithClient/appModels';
import { githubIdParser, userIdParser } from '$/service/idParsers';
import type { UserRecord } from 'firebase-admin/lib/auth/user-record';

export const userMethods = {
  create: (userRecord: UserRecord): UserModel => ({
    id: userIdParser.parse(userRecord.uid),
    githubId: githubIdParser.parse(
      userRecord.providerData.find(({ providerId }) => providerId === 'github.com')?.uid
    ),
    email: userRecord.email ?? '',
    displayName: userRecord.displayName,
    photoURL: userRecord.photoURL,
    createdTime: Date.now(),
  }),
};
