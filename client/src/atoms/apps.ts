import type { AppModel } from '$/commonTypesWithClient/appModels';
import { atom } from 'jotai';

export const appsAtom = atom<AppModel[]>([]);
