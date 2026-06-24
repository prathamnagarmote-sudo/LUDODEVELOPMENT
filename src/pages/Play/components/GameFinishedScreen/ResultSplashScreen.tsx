import { motion } from 'framer-motion';
import styles from './GameFinishedScreen.module.css';
import crownImage from '../../../../Atlas_Lobby/images/win crown.png';
import TokenImage from '../../../../assets/token.svg?react';

type Props = {
  text: string;
  playerColour?: string;
};

const woodStainColours: Record<string, string> = {
  red: 'url(#token-grad-red)',
  green: 'url(#token-grad-green)',
  blue: 'url(#token-grad-blue)',
  yellow: 'url(#token-grad-yellow)',
};

function ResultSplashScreen({ text, playerColour }: Props) {
  const isLose = text.toLowerCase().includes('lose');
  const isWin = text.toLowerCase().includes('win');

  if (isLose) {
    let activeColour = playerColour || 'red';
    if (activeColour === 'blue') {
      activeColour = 'red';
    }
    return (
      <motion.div
        className={styles.splashScreen}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.3 }}
        style={{ zIndex: 9999 }}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
          <defs>
            <linearGradient id="token-grad-blue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#003b73"/>
              <stop offset="100%" stopColor="#00a2e8"/>
            </linearGradient>
            <linearGradient id="token-grad-red" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#800a00"/>
              <stop offset="100%" stopColor="#f24b3f"/>
            </linearGradient>
            <linearGradient id="token-grad-green" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#034d19"/>
              <stop offset="100%" stopColor="#24d658"/>
            </linearGradient>
            <linearGradient id="token-grad-yellow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#996000"/>
              <stop offset="100%" stopColor="#ffb700"/>
            </linearGradient>
          </defs>
        </svg>
        <div className={styles.losePopupCard}>
          <div className={styles.brokenTokenContainer}>
            <TokenImage
              className={styles.brokenTokenLeft}
              style={{
                '--fill-colour': woodStainColours[activeColour]
              } as React.CSSProperties}
            />
            <TokenImage
              className={styles.brokenTokenRight}
              style={{
                '--fill-colour': woodStainColours[activeColour]
              } as React.CSSProperties}
            />
            <TokenImage
              className={styles.brokenTokenShard}
              style={{
                '--fill-colour': woodStainColours[activeColour]
              } as React.CSSProperties}
            />
          </div>
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
    const activeColour = playerColour || 'red';
    return (
      <motion.div
        className={styles.splashScreen}
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 1.2 }}
        transition={{ duration: 0.3 }}
        style={{ zIndex: 9999 }}
      >
        <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
          <defs>
            <linearGradient id="token-grad-blue" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#003b73"/>
              <stop offset="100%" stopColor="#00a2e8"/>
            </linearGradient>
            <linearGradient id="token-grad-red" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#800a00"/>
              <stop offset="100%" stopColor="#f24b3f"/>
            </linearGradient>
            <linearGradient id="token-grad-green" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#034d19"/>
              <stop offset="100%" stopColor="#24d658"/>
            </linearGradient>
            <linearGradient id="token-grad-yellow" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#996000"/>
              <stop offset="100%" stopColor="#ffb700"/>
            </linearGradient>
          </defs>
        </svg>
        <div className={`${styles.losePopupCard} ${styles.winPopupCard}`}>
          <div className={styles.winningTokenContainer}>
            <motion.img 
              src={crownImage} 
              alt="Crown" 
              className={styles.splashCrownAboveToken} 
            />
            <TokenImage
              className={styles.winningToken}
              style={{
                '--fill-colour': woodStainColours[activeColour]
              } as React.CSSProperties}
            />
          </div>
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
