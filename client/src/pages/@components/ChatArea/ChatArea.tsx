import {
  ChatContainer,
  MainContainer,
  Message,
  MessageInput,
  MessageList,
  MessageSeparator,
  TypingIndicator,
} from '@chatscope/chat-ui-kit-react';
import type { AppModel } from 'commonTypesWithClient/appModels';
import { Spacer } from 'src/components/Spacer';
import { CSS_VARS } from 'src/utils/constants';
import { formatTimestamp } from 'src/utils/dayjs';
import { RunningTimer } from '../RunningTimer';
import { StatusIcon } from '../StatusIcon/StatusIcon';
import styles from './chatArea.module.css';

export const ChatArea = (props: { app: AppModel }) => {
  const isClosed = props.app.status === 'closed';

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <StatusIcon status={props.app.status} />
        <Spacer axis="x" size={12} />
        <span className={styles.modelLabel}>GPT4-turbo</span>
        <Spacer axis="x" size={12} />
        <RunningTimer
          start={props.app.createdTime}
          end={props.app.status === 'running' ? undefined : props.app.statusUpdatedTime}
        />
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
              <MessageSeparator
                style={{ background: 'transparent' }}
                content={formatTimestamp(props.app.createdTime)}
              />
              <Message
                model={{
                  message: 'どんなアプリが欲しいですか？',
                  sender: 'AI',
                  sentTime: formatTimestamp(props.app.createdTime),
                  direction: 'incoming',
                  position: 'single',
                }}
              />
              {props.app.bubbles.map((bubble) => (
                <Message
                  key={bubble.id}
                  model={{
                    message: bubble.content,
                    sender: bubble.type === 'human' ? 'You' : 'AI',
                    direction: bubble.type === 'human' ? 'outgoing' : 'incoming',
                    position: 'single',
                  }}
                />
              ))}
              {props.app.status !== 'running' && (
                <MessageSeparator
                  style={{ background: 'transparent' }}
                  content={formatTimestamp(props.app.statusUpdatedTime)}
                />
              )}
            </MessageList>
            <MessageInput
              style={{ background: '#fff2', borderTopColor: CSS_VARS.borderColor }}
              placeholder="変更要望を入力"
              disabled={props.app.status !== 'running'}
            />
          </ChatContainer>
        </MainContainer>
      </div>
    </div>
  );
};
