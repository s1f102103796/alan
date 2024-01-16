import type { UserModel } from '$/commonTypesWithClient/appModels';
import { atom } from 'jotai';

export const userAtom = atom<UserModel | null>(null);
