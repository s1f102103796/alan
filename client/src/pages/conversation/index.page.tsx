import { useEffect, useRef, useState } from 'react';
import { apiClient } from 'src/utils/apiClient';
import { returnNull } from 'src/utils/returnNull';
import styles from './index.module.css';

type CustomType = number[][];

const Conv = () => {
  const [messages, setMessages] = useState<CustomType>();
  const [turn, setTurn] = useState<number[]>();

  const fetchMessages = async () => {
    const turn = await apiClient.newboard.$get().catch(returnNull);
    const message = await apiClient.chat.$get().catch(returnNull);
    console.log(turn);
    console.log(message);
    if (message !== null) setMessages(message);
    if (turn !== null) setTurn(turn);
  };

  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 100);
    return () => clearInterval(intervalId);
  }, []);

  useEffect(() => {
    if (chatRef.current) {
      const currentChat = chatRef.current;
      setTimeout(() => {
        currentChat.scrollTop = currentChat.scrollHeight;
      }, 0);
    }
  }, [messages]);

  return (
    <div className={styles.container}>
      <div className={styles.chat} ref={chatRef}>
        {messages &&
          turn &&
          messages.map((msg, index) => {
            // ここでdisplayMessageを設定します。
            let displayMessage = '';
            if (turn[index] === 1) {
              displayMessage = `黒をy:${msg[0]}, x:${msg[1]}に置きました`;
            } else if (turn[index] === 2) {
              displayMessage = `白をy:${msg[0]}, x:${msg[1]}に置きました`;
            }

            return (
              <div key={index} className={turn[index] === 2 ? styles.right : styles.left}>
                {displayMessage}
              </div>
            );
          })}
      </div>
    </div>
  );
};

export default Conv;
