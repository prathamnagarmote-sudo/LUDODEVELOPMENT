import { motion } from 'framer-motion';
import styles from './GameFinishedScreen.module.css';
import crownImage from '../../../../Atlas_Lobby/images/win crown.png';

type Props = {
  text: string;
};

const LoseStarsGraphic = () => (
  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '6px', marginBottom: '15px' }}>
    <svg width="36" height="36" viewBox="0 0 24 24" fill="#a0a0a0" stroke="#ffffff" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    <svg width="48" height="48" viewBox="0 0 24 24" fill="#a0a0a0" stroke="#ffffff" strokeWidth="2" style={{ marginBottom: '12px' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    <svg width="72" height="72" viewBox="0 0 24 24" fill="#e0e0e0" stroke="#ffffff" strokeWidth="2" style={{ marginBottom: '24px' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    <svg width="48" height="48" viewBox="0 0 24 24" fill="#a0a0a0" stroke="#ffffff" strokeWidth="2" style={{ marginBottom: '12px' }}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
    <svg width="36" height="36" viewBox="0 0 24 24" fill="#a0a0a0" stroke="#ffffff" strokeWidth="2"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
  </div>
);

function ResultSplashScreen({ text }: Props) {
  const isLose = text.toLowerCase().includes('lose');
  const isWin = text.toLowerCase().includes('win');

  if (isLose) {
    return (
      <motion.div
        className={styles.splashScreen}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.3 }}
        style={{ zIndex: 9999 }}
      >
        <div className={styles.losePopupCard}>
          <LoseStarsGraphic />
          <h1 className={styles.losePopupText}>YOU LOSE!</h1>
        </div>
      </motion.div>
    );
  }

  const isTie = text.toLowerCase().includes('tie');
  if (isTie) {
    return (
      <motion.div
        className={styles.splashScreen}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.3 }}
        style={{ zIndex: 9999 }}
      >
        <div className={`${styles.losePopupCard} ${styles.tiePopupCard}`}>
          <h1 className={styles.losePopupText}>IT'S A TIE!</h1>
        </div>
      </motion.div>
    );
  }

  if (isWin) {
    return (
      <motion.div
        className={styles.splashScreen}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.3 }}
        style={{ zIndex: 9999 }}
      >
        <div className={`${styles.losePopupCard} ${styles.winPopupCard}`}>
          <img src={crownImage} alt="Crown" className={styles.splashCrown} />
          <h1 className={styles.losePopupText}>YOU WIN !</h1>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className={styles.splashScreen}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 1.2 }}
      transition={{ duration: 0.3 }}
    >
      <h1 className={styles.splashText}>{text}</h1>
    </motion.div>
  );
}

export default ResultSplashScreen;
