import diceMp3 from '../sound animations/Dice3.mp3';
import matchFoundMp3 from '../sound animations/MatchFound 2.mp3';
import scrollMp3 from '../sound animations/Scroll.mp3';
import homeAnimationMp3 from '../sound animations/home animation.mp3';
import safeZoneMp3 from '../sound animations/safezone sound.mp3';
import tokenMp3 from '../sound animations/token.mp3';
import reverseMp3 from '../sound animations/Reverse.mp3';

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
  // We keep this function for backwards compatibility if it's called anywhere,
  // but it's not explicitly requested to have a new sound. We can just use token sound or silence.
  playSound(tokenMp3);
  triggerVibration([80, 50, 80]);
}

export function playDiceRollSound() {
  playSound(diceMp3);
  triggerVibration(40);
}

export function stopDiceRollSound() {
  stopSound(diceMp3);
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

export function playReverseSound(durationMs: number) {
  if (!isMusicEnabled()) return;
  const audio = getAudioElement(reverseMp3);
  
  const setupPlaybackRate = () => {
    if (audio.duration && audio.duration !== Infinity) {
      // Calculate playback rate so the audio perfectly spans the target duration
      const targetDurationSec = durationMs / 1000;
      audio.playbackRate = audio.duration / targetDurationSec;
    }
    playSound(reverseMp3, false, audio.playbackRate);
  };

  if (audio.readyState >= 1) { // HAVE_METADATA
    setupPlaybackRate();
  } else {
    audio.addEventListener('loadedmetadata', setupPlaybackRate, { once: true });
  }
}

export function stopReverseSound() {
  stopSound(reverseMp3);
}

