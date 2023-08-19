import styles from './index.module.css';

const ChatWindow = () => {
  return (
    <div className={styles.chatWindow}>
      <div className={styles.header}>Chat Header</div>
      <div className={styles.messages}>Messages...</div>
      <div className={styles.footer}>
        <input className={styles.inputField} placeholder="Type a message..." />
      </div>
    </div>
  );
};

const LangChain = () => {
  return (
    <div className={styles.container}>
      <ChatWindow />
      <ChatWindow />
      <ChatWindow />
    </div>
  );
};

export default LangChain;
