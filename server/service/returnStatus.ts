import assert from 'assert';

// アロー関数で宣言するとTS(2775)エラーが出る
export function customAssert(
  val: unknown,
  type: 'エラーならロジック修正必須' | '不正リクエスト防御',
  data: Record<string, unknown>
): asserts val {
  assert(val, JSON.stringify({ type, data }));
}

export const returnSuccess = <T>(val: T) => ({ status: 200 as const, body: val });

const logErr = (e: unknown) => {
  if (!(e instanceof Error)) return;

  console.error(e.stack);
};

export const returnGetError = (e: unknown) => {
  logErr(e);

  return { status: 404 as const };
};

export const returnPostError = (e: unknown) => {
  logErr(e);

  return { status: 403 as const };
};

export const returnPatchError = (e: unknown) => {
  logErr(e);

  return { status: 403 as const };
};

export const returnDeleteError = (e: unknown) => {
  logErr(e);

  return { status: 403 as const };
};
