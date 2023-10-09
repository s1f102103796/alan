import type { z } from 'zod';

type Branded<T extends string> = string & z.BRAND<T>;

export type UserId = Branded<'UserId'>;
export type TaskId = Branded<'TaskId'>;
export type Token = Branded<'Token'>;
export type OrderPass = Branded<'OrderPass'>;
export type OrderId = Branded<'OrderId'>;
export type m銘柄コード = Branded<'m銘柄コード'>;
