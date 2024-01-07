import type { MessageModel } from '@chatscope/chat-ui-kit-react';
import { Avatar, Message } from '@chatscope/chat-ui-kit-react';
import type { AppModel } from 'commonTypesWithClient/appModels';
import type { SystemBubbleModel } from 'commonTypesWithClient/bubbleModels';
import { Spacer } from 'src/components/Spacer';
import { ChatGPTIcon } from 'src/components/icons/ChatGPTIcon';
import { FIRST_QUESTION } from 'src/utils/constants';
import { NameLabel } from './NameLabel';

export const SystemContent = (props: { app: AppModel; bubble: SystemBubbleModel }) => {
  return (
    <Message model={{ type: 'custom' } as MessageModel} avatarPosition="tl">
      <Avatar>
        <Spacer axis="y" size={26} />
        <Spacer axis="x" size={4} />
        <ChatGPTIcon size={32} fill="#fff" />
      </Avatar>
      <Message.CustomContent>
        <NameLabel name="GPT4-turbo" createdTime={props.bubble.createdTime} />
        <Spacer axis="y" size={6} />
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
              case 'completed_github':
                return 'GitHubリポジトリを作成しました。';
              case 'init_infra':
                return 'インフラのセットアップを開始しています。';
              case 'retry_test':
                return 'テストに失敗したコードを修正しています。';
              case 'creating_schema':
                return 'DBスキーマを作成しています。';
              case 'creating_api_def':
                return 'REST API定義ファイルを作成しています。';
              case 'creating_client_code':
                return 'フロントエンドの開発を開始しています。';
              default:
                throw new Error(props.bubble.content satisfies never);
            }
          })()
        }
      </Message.CustomContent>
    </Message>
  );
};
