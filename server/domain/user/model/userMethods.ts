import type { UserModel } from '$/commonTypesWithClient/appModels';
import { ghUserIdParser, userIdParser } from '$/commonTypesWithClient/idParsers';
import type { UserRecord } from 'firebase-admin/lib/auth/user-record';

export const userMethods = {
  create: (userRecord: UserRecord): UserModel => ({
    id: userIdParser.parse(userRecord.uid),
    githubId: ghUserIdParser.parse(
      userRecord.providerData.find(({ providerId }) => providerId === 'github.com')?.uid
    ),
    email: userRecord.email ?? '',
    displayName: userRecord.displayName,
    photoURL: userRecord.photoURL,
    createdTime: Date.now(),
  }),
};
