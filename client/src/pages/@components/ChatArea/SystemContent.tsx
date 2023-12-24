import type { MessageModel } from '@chatscope/chat-ui-kit-react';
import { Avatar, Message } from '@chatscope/chat-ui-kit-react';
import type { AppModel } from 'commonTypesWithClient/appModels';
import type { SystemBubbleModel } from 'commonTypesWithClient/bubbleModels';
import { Spacer } from 'src/components/Spacer';
import { ChatGPTIcon } from 'src/components/icons/ChatGPTIcon';
import { FIRST_QUESTION } from 'src/utils/constants';
import { formatTimestamp } from 'src/utils/dayjs';

export const SystemContent = (props: { app: AppModel; bubble: SystemBubbleModel }) => {
  return (
    <Message model={{ type: 'custom', position: 'first' } as MessageModel} avatarPosition="tl">
      <Avatar>
        <Spacer axis="y" size={20} />
        <ChatGPTIcon size={36} fill="#fff" />
      </Avatar>
      <Message.CustomContent>
        {
          // eslint-disable-next-line complexity
          (() => {
            switch (props.bubble.content) {
              case 'first_question':
                return FIRST_QUESTION;
              case 'waiting_init':
                return `API制限回避のため順番にインフラを構築します。\n開始まで残り${
                  props.app.waitingOrder ?? 0
                }人です。`;
              case 'init_infra':
                return `「${props.app.name}」のインフラ構築を開始しています。`;
              case 'create_app':
                return `「${props.app.name}」のアプリ開発を開始しています。`;
              case 'retry_test':
                return 'テストに失敗したコードを修正しています。';
              default:
                throw new Error(props.bubble.content satisfies never);
            }
          })()
        }
      </Message.CustomContent>
      <Message.Footer sentTime={formatTimestamp(props.bubble.createdTime)} />
    </Message>
  );
};
