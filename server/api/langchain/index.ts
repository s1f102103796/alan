import type { DefineMethods } from 'aspida';
import type { ChainValues } from 'langchain/dist/schema';

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
  // post: {
  //   resBody: string;
  // };
  // post: {
  //   resBody: BaseMessage[];
  // };
  post: {
    resBody: ChainValues;
  };
}>;
