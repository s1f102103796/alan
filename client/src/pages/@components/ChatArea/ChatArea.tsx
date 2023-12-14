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
import type { GHActionModel, RWDeploymentModel } from 'commonTypesWithClient/bubbleModels';
import Link from 'next/link';
import type { ReactNode } from 'react';
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
import { RunningTimer } from '../RunningTimer';
import { StatusIcon } from '../StatusIcon/StatusIcon';
import styles from './chatArea.module.css';

const CustomContent = (props: {
  content: GHActionModel | RWDeploymentModel;
  status: AppModel['status'];
  title: string;
  icon: ReactNode;
}) => {
  return (
    <Message model={{ type: 'custom' } as MessageModel} avatarPosition="tl">
      <Avatar>
        <Spacer axis="y" size={20} />
        {props.icon}
      </Avatar>
      <Message.CustomContent>
        <Link href={props.content.url} target="_brank">
          <div className={styles.contentTitle}>{props.title}</div>
        </Link>
        <Spacer axis="y" size={8} />
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <StatusIcon status={props.status} />
          <Spacer axis="x" size={8} />
          <RunningTimer
            start={props.content.createdTime}
            end={
              props.status === 'failure' || props.status === 'success'
                ? props.content.updatedTime
                : undefined
            }
          />
        </div>
      </Message.CustomContent>
      <Message.Footer
        style={{ color: '#fff' }}
        sentTime={formatTimestamp(props.content.createdTime)}
      />
    </Message>
  );
};

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
                    <CustomContent
                      key={bubble.id}
                      title={
                        bubble.content.type === bubble.content.title
                          ? bubble.content.type
                          : `${bubble.content.type}: ${bubble.content.title}`
                      }
                      content={bubble.content}
                      status={actionStatusToIconStatus(bubble.content)}
                      icon={<GithubIcon size={36} fill="#fff" />}
                    />
                  ) : bubble.type === 'railway' ? (
                    <CustomContent
                      key={bubble.id}
                      title={bubble.content.title}
                      content={bubble.content}
                      status={deploymentStatusToIconStatus(bubble.content)}
                      icon={<RailwayIcon size={36} fill="#fff" />}
                    />
                  ) : (
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
