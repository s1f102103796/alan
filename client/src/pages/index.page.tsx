import { useEffect, useRef, useState } from 'react';
import { apiClient } from 'src/utils/apiClient';
import styles from './index.module.css';

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [output, setOutput] = useState<string>('');
  const [currentIndex, setCurrentIndex] = useState(0);
  const displayedOutput = output.substring(0, currentIndex);
  const quoteRef = useRef<HTMLDivElement>(null);
  const [values, setValues] = useState<{ [key: number]: boolean }>({});

  const handleItemClick = (index: number) => {
    setValues((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const fetchNews = async () => {
    setCurrentIndex(0);
    setOutput('読み込み中...');
    console.log('押した');
    const response = await apiClient.langchain.$post({ body: { values } });
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
      <div className={styles.conversationList}>{/* ここに会話のリストを表示 */}</div>
      <div className={styles.gridContainer}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className={styles.gridItem} onClick={() => handleItemClick(index)}>
            {values[index] ? 'TRUE' : 'FALSE'}
          </div>
        ))}
      </div>
      <button
        className={styles.buttonAskDoraemon}
        // onClick={() => setIsModalOpen(true)}
        onClick={fetchNews}
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
