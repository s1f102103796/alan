import styles from './index.module.css';

const Home = () => {
  return (
    <div className={styles.container}>
      <div className={styles.conversationList}>{/* ここに会話のリストを表示 */}</div>
      <div className={styles.gridContainer}>
        {[...Array(8)].map((_, index) => (
          <div key={index} className={styles.gridItem} />
        ))}
      </div>
      <button className={styles.buttonAskDoraemon}>教えてドラえもん</button>
      <div className={styles.doraemonImage} />
      <div className={styles.quote}>{/* ドラえもんの名言や会話の内容をここに書く */}</div>
    </div>
  );
};

export default Home;
