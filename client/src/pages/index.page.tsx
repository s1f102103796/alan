import { Switch } from 'antd';
import type { DolanModel } from 'commonTypesWithClient/models';
import { useAtom } from 'jotai';
import { useCallback, useEffect, useRef, useState } from 'react';
import { userAtom } from 'src/atoms/user';
import { apiClient } from 'src/utils/apiClient';
import styles from './index.module.css';

const Home = () => {
  const [user] = useAtom(userAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayedOutput = output.substring(0, currentIndex);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<{ [key: number]: boolean }>({});
  const [messages, setMessages] = useState<DolanModel[]>([]);
  const [expanded, setExpanded] = useState<number>(-1);

  const fetchDolan = useCallback(async () => {
    if (!user) {
      console.error('User is null or undefined!');
      return;
    }
    const getDlanMessage = await apiClient.dolan.$post({ body: { id: user.id } });
    setMessages(getDlanMessage);
  }, [user]);

  useEffect(() => {
    fetchDolan();
    const intervalId = setInterval(fetchDolan, 100);
    return () => {
      clearInterval(intervalId);
    };
  }, [fetchDolan]);

  const handleItemClick = (index: number) => {
    setValues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const PostDolan = async () => {
    if (!user) {
      console.error('User is null or undefined!');
      return;
    }
    setCurrentIndex(0);
    setOutput('読み込み中...');
    console.log('押した');
    const response = await apiClient.langchain.$post({ body: { id: user.id, values } });
    setOutput(response.toString());
    console.log(response);
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (currentIndex < output.length) {
        setCurrentIndex((prev) => prev + 1);
        if (quoteRef.current) {
          quoteRef.current.scrollTop = quoteRef.current.scrollHeight;
        }
      } else {
        clearInterval(interval);
      }
    }, 100);
    return () => clearInterval(interval);
  }, [currentIndex, output]);

  return (
    <div className={styles.container}>
      <div className={styles.conversationList}>
        {messages.map((message, index) => (
          <div className={styles.messageBox} key={index}>
            <div style={{ maxHeight: expanded === index ? 'none' : '100px', overflow: 'hidden' }}>
              {message.message}
            </div>
            {message.message.length > 40 && expanded !== index && (
              <button onClick={() => setExpanded(index)}>read more</button>
            )}
            {expanded === index && <button onClick={() => setExpanded(-1)}>close</button>}
          </div>
        ))}
      </div>
      <div className={styles.gridContainer}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className={styles.gridItem} onClick={() => handleItemClick(index)}>
            <Switch />
          </div>
        ))}
      </div>
      <button
        className={styles.buttonAskDoraemon}
        // onClick={() => setIsModalOpen(true)}
        onClick={PostDolan}
      >
        教えてドラえもん
      </button>
      <div className={styles.doraemonImage} />
      <div ref={quoteRef} className={styles.quote}>
        {displayedOutput}
      </div>
      {isModalOpen && (
        <div className={styles.overlay}>
          <div className={styles.inputModal}>
            <input type="text" className={styles.inputarea} placeholder="ここに質問を入力" />
            <button className={styles.closebutton} onClick={() => setIsModalOpen(false)}>
              閉じる
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;
