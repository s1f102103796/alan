import type { AppModel } from '$/commonTypesWithClient/appModels';
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
import Link from 'next/link';
import { Spacer } from 'src/components/Spacer';
import { ChatGPTIcon } from 'src/components/icons/ChatGPTIcon';
import { GithubIcon } from 'src/components/icons/GithubIcon';
import { RailwayIcon } from 'src/components/icons/RailwayIcon';
import {
  actionConclusionToIconStatus,
  deploymentStatusToIconStatus,
  useAppStatus,
} from 'src/pages/@hooks/useAppStatus';
import { CSS_VARS } from 'src/utils/constants';
import { AuthorIcon } from '../AuthorIcon';
import { StatusIcon } from '../StatusIcon/StatusIcon';
import { CustomContent } from './CustomContent';
import { NameLabel } from './NameLabel';
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
        <span className={styles.indexLabel}>No.{props.app.index}</span>
        <Link
          className={styles.authorLink}
          href={`https://github.com/${props.app.author.githubId}`}
          target="_brank"
        >
          <AuthorIcon size={24} photoURL={props.app.author.photoURL} />
          {props.app.author.name}
        </Link>
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
                          status={actionConclusionToIconStatus(bubble.content)}
                          icon={<GithubIcon size={32} fill="#fff" />}
                        />
                      );
                    case 'railway':
                      return (
                        <CustomContent
                          key={bubble.id}
                          title={`Server Deployment - ${bubble.content.title}`}
                          content={bubble.content}
                          status={deploymentStatusToIconStatus(bubble.content)}
                          icon={<RailwayIcon size={32} fill="#fff" />}
                        />
                      );
                    case 'system':
                      return <SystemContent key={bubble.id} app={props.app} bubble={bubble} />;
                    case 'ai':
                      return (
                        <Message
                          key={bubble.id}
                          model={{ type: 'custom' } as MessageModel}
                          avatarPosition="tl"
                        >
                          <Avatar>
                            <Spacer axis="y" size={26} />
                            <Spacer axis="x" size={4} />
                            <ChatGPTIcon size={32} fill="#fff" />
                          </Avatar>
                          <Message.CustomContent>
                            <NameLabel name="GPT4-turbo" createdTime={bubble.createdTime} />
                            <Spacer axis="y" size={6} />
                            <div>{bubble.content}</div>
                          </Message.CustomContent>
                        </Message>
                      );
                    case 'human':
                      return (
                        <Message
                          key={bubble.id}
                          model={{ type: 'custom', direction: 'outgoing' } as MessageModel}
                          avatarPosition="tr"
                        >
                          <Avatar>
                            <Spacer axis="y" size={26} />
                            <Spacer axis="x" size={4} />
                            <AuthorIcon size={32} photoURL={props.app.author.photoURL} />
                          </Avatar>
                          <Message.CustomContent>
                            <NameLabel
                              name={props.app.author.name}
                              createdTime={bubble.createdTime}
                            />
                            <Spacer axis="y" size={6} />
                            <div>{bubble.content}</div>
                          </Message.CustomContent>
                        </Message>
                      );
                    case 'taskList':
                      return (
                        <Message
                          key={bubble.id}
                          model={{ type: 'custom' } as MessageModel}
                          avatarPosition="tl"
                        >
                          <Avatar>
                            <Spacer axis="y" size={26} />
                            <Spacer axis="x" size={4} />
                            <ChatGPTIcon size={32} fill="#fff" />
                          </Avatar>
                          <Message.CustomContent>
                            <NameLabel name="GPT4-turbo" createdTime={bubble.createdTime} />
                            <Spacer axis="y" size={6} />
                            <div>
                              <div>実装タスクのリストを優先順に作成しました。</div>
                              {bubble.content.map((task, i) => (
                                <div key={task.id} className={styles.task}>
                                  <div className={styles.taskTitle}>
                                    {i + 1}. {task.title}
                                  </div>
                                  <div className={styles.taskContent}>{task.content}</div>
                                </div>
                              ))}
                            </div>
                          </Message.CustomContent>
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
