import type { DefineMethods } from 'aspida';
import type { ChainValues } from 'langchain/dist/schema';
import type { UserId } from '../../commonTypesWithClient/branded';

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
    reqBody: { id: UserId; values: { [key: number]: boolean }; message: string };
    resBody: ChainValues;
  };
}>;
