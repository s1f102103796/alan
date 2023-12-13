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
import Link from 'next/link';
import { Spacer } from 'src/components/Spacer';
import { ChatGPTIcon } from 'src/components/icons/ChatGPTIcon';
import { GithubIcon } from 'src/components/icons/GithubIcon';
import { HumanIcon } from 'src/components/icons/HumanIcon';
import { actionStatusToIconStatus, useAppStatus } from 'src/pages/@hooks/useAppStatus';
import { CSS_VARS } from 'src/utils/constants';
import { formatTimestamp } from 'src/utils/dayjs';
import { RunningTimer } from '../RunningTimer';
import { StatusIcon } from '../StatusIcon/StatusIcon';
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
                props.app.bubbles.map((bubble) =>
                  bubble.type === 'github' ? (
                    <Message
                      key={bubble.id}
                      model={{ type: 'custom' } as MessageModel}
                      avatarPosition="tl"
                    >
                      <Avatar>
                        <Spacer axis="y" size={20} />
                        <GithubIcon size={36} fill="#fff" />
                      </Avatar>
                      <Message.CustomContent>
                        <Link href={bubble.content.url} target="_brank">
                          <div className={styles.githubTitle}>
                            {bubble.content.type === bubble.content.title
                              ? bubble.content.type
                              : `${bubble.content.type}: ${bubble.content.title}`}
                          </div>
                          <Spacer axis="y" size={8} />
                          <div style={{ display: 'flex', alignItems: 'center' }}>
                            <StatusIcon status={actionStatusToIconStatus(bubble.content)} />
                            <Spacer axis="x" size={8} />
                            <RunningTimer
                              start={bubble.content.createdTime}
                              end={
                                actionStatusToIconStatus(bubble.content) === 'failure' ||
                                actionStatusToIconStatus(bubble.content) === 'success'
                                  ? bubble.content.updatedTime
                                  : undefined
                              }
                            />
                          </div>
                        </Link>
                      </Message.CustomContent>
                      <Message.Footer
                        style={{ color: '#fff' }}
                        sentTime={formatTimestamp(bubble.createdTime)}
                      />
                    </Message>
                  ) : (
                    <Message
                      key={bubble.id}
                      model={{
                        message: bubble.content,
                        direction: bubble.type === 'human' ? 'outgoing' : 'incoming',
                        position: 'first',
                      }}
                      avatarPosition="center-right"
                    >
                      <Avatar>
                        <Spacer axis="y" size={4} />
                        {bubble.type === 'human' ? (
                          <HumanIcon size={36} fill="#fff" />
                        ) : (
                          <ChatGPTIcon size={36} fill="#fff" />
                        )}
                      </Avatar>
                      <Message.Footer sentTime={formatTimestamp(bubble.createdTime)} />
                    </Message>
                  )
                )
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
