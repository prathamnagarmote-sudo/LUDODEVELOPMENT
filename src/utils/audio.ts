import diceMp3 from '../sound animations/Dice3.mp3';
import matchFoundMp3 from '../sound animations/MatchFound 2.mp3';
import scrollMp3 from '../sound animations/Scroll.mp3';
import homeAnimationMp3 from '../sound animations/home animation.mp3';
import safeZoneMp3 from '../sound animations/safezone sound.mp3';
import tokenMp3 from '../sound animations/token.mp3';
import reverseMp3 from '../sound animations/Reverse1.mp3';
import gameStartMp3 from '../sound animations/GME START.mp3';
import gameWinMp3 from '../sound animations/game win.mp3';
import ludoTieMp3 from '../sound animations/ludo tie.mp3';
import gameLostMp3 from '../sound animations/game lost.mp3';

function isMusicEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return localStorage.getItem('musicEnabled') !== 'false';
}

function triggerVibration(pattern: number | number[]) {
  if (typeof window !== 'undefined' && typeof navigator !== 'undefined' && navigator.vibrate) {
    if (localStorage.getItem('vibrationEnabled') !== 'false') {
      navigator.vibrate(pattern);
    }
  }
}

const audioCache: Record<string, HTMLAudioElement> = {};
const fadeIntervals: Record<string, NodeJS.Timeout> = {};

function getAudioElement(src: string): HTMLAudioElement {
  if (!audioCache[src]) {
    const audio = new Audio(src);
    audio.preload = 'auto';
    audioCache[src] = audio;
  }
  return audioCache[src];
}

function playSound(src: string, loop: boolean = false, playbackRate: number = 1.0) {
  if (!isMusicEnabled()) return;
  try {
    const audio = getAudioElement(src);
    
    // Clear any active fade-outs to prevent them from muting new plays
    if (fadeIntervals[src]) {
      clearInterval(fadeIntervals[src]);
      delete fadeIntervals[src];
    }
    audio.volume = 1.0;
    
    audio.loop = loop;
    audio.playbackRate = playbackRate;
    // Reset time to allow overlapping plays or rapid re-triggering
    audio.currentTime = 0;
    audio.play().catch((e) => console.error('Audio play failed:', e));
  } catch (e) {
    console.error('Audio error:', e);
  }
}

function stopSound(src: string) {
  try {
    const audio = getAudioElement(src);
    audio.pause();
    audio.currentTime = 0;
  } catch (e) {
    console.error('Audio stop error:', e);
  }
}

export function playEngineSound() {
  playSound(tokenMp3);
  triggerVibration(15);
}

export function playTokenSound() {
  playSound(tokenMp3);
  triggerVibration(15);
}

export function playCrashSound() {
  // User requested to remove the token movement sound when a piece gets killed
  // We just trigger the vibration now so it doesn't interfere with the Reverse sound.
  triggerVibration([80, 50, 80]);
}

export function playDiceRollSound() {
  playSound(diceMp3);
  triggerVibration(40);
}

export function stopDiceRollSound() {
  const audio = getAudioElement(diceMp3);
  executeFadeOut(diceMp3, audio);
}

export function playVictorySound() {
  playSound(homeAnimationMp3);
  triggerVibration([100, 50, 100, 50, 200]);
}

export function playHomeSound() {
  playSound(homeAnimationMp3);
  triggerVibration([100, 50, 100, 50, 200]);
}

export function playSafeZoneSound() {
  playSound(safeZoneMp3);
  triggerVibration([50, 50]);
}

let scrollInterval: ReturnType<typeof setInterval> | null = null;
const scrollPool = [
  getAudioElement(scrollMp3),
  new Audio(scrollMp3),
  new Audio(scrollMp3),
  new Audio(scrollMp3),
  new Audio(scrollMp3),
  new Audio(scrollMp3),
  new Audio(scrollMp3),
  new Audio(scrollMp3),
];
let poolIdx = 0;

export function playMatchmakingScrollSound(start: boolean) {
  if (start) {
    if (!scrollInterval) {
      // Play instantly on start
      if (isMusicEnabled()) {
        try {
          const firstAudio = scrollPool[poolIdx];
          // Use 0 to avoid DOMException on some browsers if metadata isn't loaded yet
          firstAudio.currentTime = 0;
          firstAudio.play().catch(() => {});
          poolIdx = (poolIdx + 1) % scrollPool.length;
        } catch (e) {
          console.error("Audio instant play failed", e);
        }
      }
      
      // Play rapidly every 60ms, overlapping cleanly using the expanded pool
      scrollInterval = setInterval(() => {
        if (!isMusicEnabled()) return;
        const a = scrollPool[poolIdx];
        a.currentTime = 0;
        a.play().catch(() => {});
        poolIdx = (poolIdx + 1) % scrollPool.length;
      }, 60);
    }
  } else {
    if (scrollInterval) {
      clearInterval(scrollInterval);
      scrollInterval = null;
    }
    stopSound(scrollMp3);
  }
}

export function playMatchFoundSound() {
  stopSound(scrollMp3); // Ensure scroll stops
  playSound(matchFoundMp3);
}

export function playReverseSound(distance: number = 0) {
  if (!isMusicEnabled()) return;
  const audio = getAudioElement(reverseMp3);
  
  if (distance > 30) {
    audio.playbackRate = 0.6; // Deep, slow, dramatic swoosh for long kills
  } else {
    audio.playbackRate = 1.0; 
  }
  audio.volume = 1.0;
  
  playSound(reverseMp3, false, audio.playbackRate);
}

export function stopReverseSoundWithFade(startTime: number) {
  const audio = getAudioElement(reverseMp3);
  const elapsedMs = Date.now() - startTime;
  
  // The user wants at least 500ms of the sound to be heard
  if (elapsedMs < 500) {
    setTimeout(() => {
      executeFadeOut(reverseMp3, audio);
    }, 500 - elapsedMs);
  } else {
    executeFadeOut(reverseMp3, audio);
  }
}

function executeFadeOut(src: string, audio: HTMLAudioElement) {
  if (audio.paused) return;
  if (fadeIntervals[src]) clearInterval(fadeIntervals[src]);

  fadeIntervals[src] = setInterval(() => {
    if (audio.volume > 0.05) {
      audio.volume -= 0.05;
    } else {
      audio.volume = 0;
      audio.pause();
      audio.currentTime = 0;
      audio.volume = 1.0; // Reset for next play
      clearInterval(fadeIntervals[src]);
      delete fadeIntervals[src];
    }
  }, 10);
}

export function stopReverseSound() {
  stopSound(reverseMp3);
}

export function playGameStartSound() {
  playSound(gameStartMp3, false, 1.0);
}

export function playResultSound(type: 'win' | 'lose' | 'tie') {
  if (type === 'win') playSound(gameWinMp3, false, 1.0);
  else if (type === 'tie') playSound(ludoTieMp3, false, 1.0);
  else playSound(gameLostMp3, false, 1.0);
}

export function stopResultSounds() {
  executeFadeOut(gameWinMp3, getAudioElement(gameWinMp3));
  executeFadeOut(ludoTieMp3, getAudioElement(ludoTieMp3));
  executeFadeOut(gameLostMp3, getAudioElement(gameLostMp3));
}
