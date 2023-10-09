import type { Token } from './branded';

export type u売 = '1';
export type k買 = '2';
export type b売買区分 = u売 | k買;
export type g現物 = 1;
export type s新規 = 2;
export type h返済 = 3;
export type s信用区分 = g現物 | s新規 | h返済;
export type s制度信用 = 1;
export type i一般信用長期 = 2;
export type i一般信用デイトレ = 3;
export type s信用取引区分 = s制度信用 | i一般信用長期 | i一般信用デイトレ;
export type s指値 = 20;
export type g逆指値 = 30;
export type s執行条件 = s指値 | g逆指値;
export type i以下 = 1;
export type i以上 = 2;
export type i以上以下 = i以上 | i以下;

export type ReqHeaders = { 'X-API-KEY': Token };
