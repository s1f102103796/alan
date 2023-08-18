import { useEffect, useState } from 'react';
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

  useEffect(() => {
    fetchMessages();
    const intervalId = setInterval(fetchMessages, 100);
    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.chat}>
        {/* {messages.map((msg, index) => (
          <div key={index} className={styles.comment} turn={msg.turn}>
            {msg.text}
          </div>
        ))} */}
      </div>
    </div>
  );
};

export default Conv;
