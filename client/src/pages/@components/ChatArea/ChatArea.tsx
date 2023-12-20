import type { MessageModel } from '@chatscope/chat-ui-kit-react';
import {
  Avatar,
  ChatContainer,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
import type { AppModel } from 'commonTypesWithClient/appModels';
import { Spacer } from 'src/components/Spacer';
import { ChatGPTIcon } from 'src/components/icons/ChatGPTIcon';
import { GithubIcon } from 'src/components/icons/GithubIcon';
import { HumanIcon } from 'src/components/icons/HumanIcon';
import { RailwayIcon } from 'src/components/icons/RailwayIcon';
import {
  actionStatusToIconStatus,
  deploymentStatusToIconStatus,
  useAppStatus,
} from 'src/pages/@hooks/useAppStatus';
import { CSS_VARS } from 'src/utils/constants';
import { formatTimestamp } from 'src/utils/dayjs';
import { StatusIcon } from '../StatusIcon/StatusIcon';
import { CustomContent } from './CustomContent';
import { SystemContent } from './SystemContent';
import styles from './chatArea.module.css';

export const ChatArea = (props: { app: AppModel }) => {
  const isClosed = props.app.status === 'closed';
  const appStatus = useAppStatus(props.app);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StatusIcon status={appStatus} />
        <Spacer axis="x" size={12} />
        <span className={styles.modelLabel}>GPT4-turbo</span>
        <span>{formatTimestamp(props.app.createdTime)}</span>
      </div>
      <div style={{ flex: 1, position: 'relative' }}>
        <MainContainer className={styles.mainContainer}>
          <ChatContainer style={{ background: 'transparent' }}>
            <MessageList
              style={{ background: 'transparent' }}
              typingIndicator={
                props.app.status === 'running' &&
                isClosed && (
                  <TypingIndicator
                    style={{ background: 'transparent' }}
                    content="ChatGPTが思考中"
                  />
                )
              }
            >
              {
                // eslint-disable-next-line complexity
                props.app.bubbles.map((bubble) => {
                  switch (bubble.type) {
                    case 'github':
                      return (
                        <CustomContent
                          key={bubble.id}
                          title={
                            bubble.content.type === bubble.content.title
                              ? bubble.content.type
                              : `${bubble.content.type} - ${bubble.content.title}`
                          }
                          content={bubble.content}
                          status={actionStatusToIconStatus(bubble.content)}
                          icon={<GithubIcon size={36} fill="#fff" />}
                        />
                      );
                    case 'railway':
                      return (
                        <CustomContent
                          key={bubble.id}
                          title={`Deploy server - ${bubble.content.title}`}
                          content={bubble.content}
                          status={deploymentStatusToIconStatus(bubble.content)}
                          icon={<RailwayIcon size={36} fill="#fff" />}
                        />
                      );
                    case 'system':
                      return <SystemContent key={bubble.id} app={props.app} bubble={bubble} />;
                    case 'ai':
                    case 'human':
                      return (
                        <Message
                          key={bubble.id}
                          model={
                            {
                              type: 'custom',
                              direction: bubble.type === 'human' ? 'outgoing' : undefined,
                              position: 'first',
                            } as MessageModel
                          }
                          avatarPosition={bubble.type === 'human' ? 'tr' : 'tl'}
                        >
                          <Avatar>
                            <Spacer axis="y" size={20} />
                            {bubble.type === 'human' ? (
                              <HumanIcon size={36} fill="#fff" />
                            ) : (
                              <ChatGPTIcon size={36} fill="#fff" />
                            )}
                          </Avatar>
                          <Message.CustomContent>{bubble.content}</Message.CustomContent>
                          <Message.Footer sentTime={formatTimestamp(bubble.createdTime)} />
                        </Message>
                      );
                    default:
                      throw new Error(bubble satisfies never);
                  }
                })
              }
            </MessageList>
            <MessageInput
              style={{ background: '#fff2', borderTopColor: CSS_VARS.borderColor }}
              placeholder="変更要望を入力"
              sendButton={false}
              attachButton={false}
              disabled={props.app.status !== 'running'}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
};
