import React from 'react';
import styles from './index.module.css';
interface ChatWindowProps {
  messages: string[];
}

const ChatWindow: React.FC<ChatWindowProps> = ({ messages }) => {
  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>Chat Header</div>
      <div className={styles.messages}>
        {messages.map((message, index) => (
          <div key={index} className={styles.message}>
            {message}
          </div>
        ))}
      </div>
      <div className={styles.footer}>
        <input className={styles.inputField} placeholder="Type a message..." />
      </div>
    </div>
  );
};

const LangChain = () => {
  // 3つの異なるメッセージリスト
  const messagesList1 = ['FXを買いました。', 'FXを売りました。', 'FXを買いました。'];
  const messagesList2 = ['FXを売りました。', 'FXを買いました。'];
  const messagesList3 = [
    'FXを買いました。',
    'FXを売りました。',
    'FXを売りました。',
    'FXを買いました。',
  ];

  return (
    <div className={styles.container}>
      <ChatWindow messages={messagesList1} />
      <ChatWindow messages={messagesList2} />
      <ChatWindow messages={messagesList3} />
    </div>
  );
};
export default LangChain;
