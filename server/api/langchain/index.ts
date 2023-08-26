import type { DefineMethods } from 'aspida';

export type Methods = DefineMethods<{
  get: {
    resBody: string;
  };
  // post: {
  //   resBody: ChainValues;
  // };
  // post: {
  //   reqBody: { people: string };
  //   resBody: BaseMessage;
  // };
  post: {
    resBody: string;
  };
}>;
