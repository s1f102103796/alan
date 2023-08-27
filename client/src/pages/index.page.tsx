import { useState } from 'react';
import { apiClient } from 'src/utils/apiClient';
import styles from './index.module.css';

const Home = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchNews = async () => {
    console.log('押した');
    const people = 'のび太あああ';
    // const response = await apiClient.langchain.$post({ body: { people } });
    const response = await apiClient.langchain.$post();

    console.log(response);
  };

  return (
    <div className={styles.container}>
      <div className={styles.conversationList}>{/* ここに会話のリストを表示 */}</div>
      <div className={styles.gridContainer}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className={styles.gridItem} />
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
      <div className={styles.quote}>{/* ドラえもんの名言や会話の内容をここに書く */}</div>
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
