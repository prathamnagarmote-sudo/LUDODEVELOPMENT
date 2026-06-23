import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '../../../../state/store';
import styles from './ScoreBoard.module.css';
import { triggerVibration, onTimerWarning } from '../../../../utils/audio';
import clsx from 'clsx';

function formatTime(ms: number) {
  const totalSeconds = Math.floor(ms / 1000);
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const s = (totalSeconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
}

export default function ScoreBoard() {
  const players = useSelector((state: RootState) => state.players.players);
  const timeRemainingMs = useSelector((state: RootState) => state.session.timeRemainingMs);
  const prevTimeRef = useRef(timeRemainingMs);

  useEffect(() => {
    const prevSeconds = Math.ceil(prevTimeRef.current / 1000);
    const currentSeconds = Math.ceil(timeRemainingMs / 1000);

    if (prevSeconds > 10 && currentSeconds <= 10 && currentSeconds > 0) {
      onTimerWarning();
      triggerVibration(50);
    } else if (prevSeconds !== currentSeconds && (currentSeconds === 5 || currentSeconds === 3)) {
      triggerVibration(50);
    }

    prevTimeRef.current = timeRemainingMs;
  }, [timeRemainingMs]);

  if (players.length === 0) return null;

  const isWarning = timeRemainingMs <= 10000 && timeRemainingMs > 0;

  return (
    <div className={clsx(styles.scoreBoard, isWarning && styles.warningScoreBoard)}>
      <div className={clsx(styles.timer, isWarning && styles.warningTimer)}>
        {formatTime(timeRemainingMs)}
      </div>
    </div>
  );
}
