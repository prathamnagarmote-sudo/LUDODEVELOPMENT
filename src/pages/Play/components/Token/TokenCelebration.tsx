import React, { useEffect, useState } from 'react';
import styles from './TokenCelebration.module.css';

type Props = {
  show: boolean;
};

const COLORS = ['#FFC700', '#FF0000', '#2E3192', '#1DB954', '#FF007F', '#00FFFF'];

const generateParticles = (count: number, type: 'confetti' | 'sparkle' | 'star') => {
  return Array.from({ length: count }).map((_, i) => {
    const angle = Math.random() * Math.PI * 2;
    const velocity = 80 + Math.random() * 120;
    const tx = Math.cos(angle) * velocity;
    const ty = Math.sin(angle) * velocity;
    const rot = Math.random() * 360;
    const rotEnd = rot + (Math.random() > 0.5 ? 1 : -1) * 360;
    const delay = Math.random() * 0.2;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];

    return {
      id: `${type}-${i}`,
      tx,
      ty,
      rot,
      rotEnd,
      delay,
      color,
    };
  });
};

type Particle = {
  id: string;
  tx: number;
  ty: number;
  rot: number;
  rotEnd: number;
  delay: number;
  color: string;
};

export const TokenCelebration: React.FC<Props> = ({ show }) => {
  const [renderEffect, setRenderEffect] = useState(false);
  const [particles, setParticles] = useState<{
    confetti: Particle[];
    sparkles: Particle[];
    stars: Particle[];
  }>({ confetti: [], sparkles: [], stars: [] });

  useEffect(() => {
    if (show) {
      setTimeout(() => {
        setParticles({
          confetti: generateParticles(12, 'confetti'),
          sparkles: generateParticles(8, 'sparkle'),
          stars: generateParticles(6, 'star'),
        });
        setRenderEffect(true);
      }, 0);
      const timer = setTimeout(() => {
        setRenderEffect(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [show]);

  if (!renderEffect) return null;

  return (
    <div className={styles.celebrationContainer}>
      <div className={styles.radialGlow} />
      
      {particles.confetti.map((p) => (
        <div
          key={p.id}
          className={`${styles.particle} ${styles.confetti}`}
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`,
            '--rot-end': `${p.rotEnd}deg`,
            '--delay': `${p.delay}s`,
            backgroundColor: p.color,
          } as React.CSSProperties}
        />
      ))}

      {/* {particles.sparkles.map((p) => (
        <div
          key={p.id}
          className={`${styles.particle} ${styles.sparkle}`}
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--delay': `${p.delay}s`,
            backgroundColor: p.color,
          } as React.CSSProperties}
        />
      ))} */}

      {particles.stars.map((p) => (
        <div
          key={p.id}
          className={`${styles.particle} ${styles.star}`}
          style={{
            '--tx': `${p.tx}px`,
            '--ty': `${p.ty}px`,
            '--rot': `${p.rot}deg`,
            '--rot-end': `${p.rotEnd}deg`,
            '--delay': `${p.delay}s`,
            color: p.color,
          } as React.CSSProperties}
        >
          ★
        </div>
      ))}
    </div>
  );
};
