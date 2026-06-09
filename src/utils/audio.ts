let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a realistic wooden token step tap/clack sound.
 * Replaces the F1 racing engine sound with a crisp physical impact.
 */
export function playEngineSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Sharp click transient (pawn landing on wood board surface)
    const clickNoise = ctx.createBufferSource();
    const noiseSize = ctx.sampleRate * 0.008; // 8ms transient
    const noiseBuffer = ctx.createBuffer(1, noiseSize, ctx.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseSize; i++) {
      noiseData[i] = Math.random() * 2 - 1;
    }
    clickNoise.buffer = noiseBuffer;

    const noiseFilter = ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(2500, now);

    const noiseGain = ctx.createGain();
    noiseGain.gain.setValueAtTime(0.03, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.008);

    clickNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(ctx.destination);

    // 2. Resonant wooden body sound
    const osc = ctx.createOscillator();
    const oscGain = ctx.createGain();
    
    osc.type = 'triangle'; // Triangle waves have a nice wood-like organic timbre
    osc.frequency.setValueAtTime(650, now);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.04);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, now);

    oscGain.gain.setValueAtTime(0.12, now);
    oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    osc.connect(filter);
    filter.connect(oscGain);
    oscGain.connect(ctx.destination);

    clickNoise.start(now);
    osc.start(now);
    osc.stop(now + 0.06);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

/**
 * Plays a realistic wooden token strike/capture collision sound.
 * Sweeps a frictional slide followed by a sharp physical impact clack.
 */
export function playCrashSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Sliding incoming friction sound (token sweeping into space)
    const sizeSlide = ctx.sampleRate * 0.12;
    const bufSlide = ctx.createBuffer(1, sizeSlide, ctx.sampleRate);
    const dataSlide = bufSlide.getChannelData(0);
    for (let i = 0; i < sizeSlide; i++) {
      dataSlide[i] = Math.random() * 2 - 1;
    }
    const slideNode = ctx.createBufferSource();
    slideNode.buffer = bufSlide;

    const slideFilter = ctx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.setValueAtTime(1500, now);
    slideFilter.frequency.linearRampToValueAtTime(900, now + 0.12);

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.015, now);
    slideGain.gain.linearRampToValueAtTime(0.04, now + 0.10);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    slideNode.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(ctx.destination);

    // 2. Heavy wood-on-wood strike collision (at 80ms)
    const hitTime = now + 0.08;
    const osc = ctx.createOscillator();
    const hitGain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(500, hitTime);
    osc.frequency.exponentialRampToValueAtTime(120, hitTime + 0.15);

    hitGain.gain.setValueAtTime(0.20, hitTime);
    hitGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.15);

    osc.connect(hitGain);
    hitGain.connect(ctx.destination);

    // 3. Wood click noise burst at strike impact
    const hitNoise = ctx.createBufferSource();
    const hitNoiseSize = ctx.sampleRate * 0.08;
    const hitNoiseBuf = ctx.createBuffer(1, hitNoiseSize, ctx.sampleRate);
    const hitNoiseData = hitNoiseBuf.getChannelData(0);
    for (let i = 0; i < hitNoiseSize; i++) {
      hitNoiseData[i] = Math.random() * 2 - 1;
    }
    hitNoise.buffer = hitNoiseBuf;

    const hitNoiseFilter = ctx.createBiquadFilter();
    hitNoiseFilter.type = 'bandpass';
    hitNoiseFilter.frequency.setValueAtTime(1100, hitTime);

    const hitNoiseGain = ctx.createGain();
    hitNoiseGain.gain.setValueAtTime(0.12, hitTime);
    hitNoiseGain.gain.exponentialRampToValueAtTime(0.001, hitTime + 0.08);

    hitNoise.connect(hitNoiseFilter);
    hitNoiseFilter.connect(hitNoiseGain);
    hitNoiseGain.connect(ctx.destination);

    slideNode.start(now);
    osc.start(hitTime);
    hitNoise.start(hitTime);

    osc.stop(hitTime + 0.16);
  } catch (e) {
    console.error('Audio error:', e);
  }
}

/**
 * Plays a realistic plastic dice shaking and rolling clatter sound.
 * Simulates the hand shake rattle, the table release slide friction, 
 * and consecutive decaying table bounces for high physical realism.
 */
export function playDiceRollSound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;

    // 1. Soft rolling friction (frictional wood slide sound as the dice rolls on the table)
    const slideSize = ctx.sampleRate * 0.25; // 250ms slide duration
    const slideBuf = ctx.createBuffer(1, slideSize, ctx.sampleRate);
    const slideData = slideBuf.getChannelData(0);
    for (let i = 0; i < slideSize; i++) {
      slideData[i] = Math.random() * 2 - 1;
    }
    const slideNode = ctx.createBufferSource();
    slideNode.buffer = slideBuf;

    const slideFilter = ctx.createBiquadFilter();
    slideFilter.type = 'bandpass';
    slideFilter.frequency.setValueAtTime(1400, now + 0.18);
    slideFilter.frequency.linearRampToValueAtTime(700, now + 0.43);

    const slideGain = ctx.createGain();
    slideGain.gain.setValueAtTime(0.0, now + 0.18);
    slideGain.gain.linearRampToValueAtTime(0.015, now + 0.23);
    slideGain.gain.exponentialRampToValueAtTime(0.001, now + 0.43);

    slideNode.connect(slideFilter);
    slideFilter.connect(slideGain);
    slideGain.connect(ctx.destination);
    
    // Start friction slide as the dice lands on the table
    slideNode.start(now + 0.18);

    // 2. Individual clatters (shake and bounces)
    const bounces = [
      // Muffled hand/cup shake rattles
      { delay: 0.00, freq: 450, vol: 0.06, len: 0.015, hpf: 2000 },
      { delay: 0.06, freq: 480, vol: 0.05, len: 0.015, hpf: 2000 },
      { delay: 0.12, freq: 430, vol: 0.06, len: 0.015, hpf: 2000 },
      // Table board impacts (brighter, higher frequency, crisper click HPF)
      { delay: 0.22, freq: 850, vol: 0.10, len: 0.020, hpf: 3500 },
      { delay: 0.28, freq: 920, vol: 0.07, len: 0.018, hpf: 3500 },
      { delay: 0.34, freq: 790, vol: 0.06, len: 0.016, hpf: 3500 },
      { delay: 0.39, freq: 880, vol: 0.04, len: 0.014, hpf: 3500 },
      { delay: 0.43, freq: 680, vol: 0.08, len: 0.025, hpf: 3000 }, // Final settle clack
    ];

    bounces.forEach((b) => {
      const t = now + b.delay;

      // Resonant plastic body sweep
      const osc = ctx.createOscillator();
      const oscGain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(b.freq, t);
      osc.frequency.exponentialRampToValueAtTime(b.freq * 0.4, t + b.len);

      oscGain.gain.setValueAtTime(b.vol, t);
      oscGain.gain.exponentialRampToValueAtTime(0.001, t + b.len);

      osc.connect(oscGain);
      oscGain.connect(ctx.destination);

      // Sharp contact surface transient click
      const click = ctx.createBufferSource();
      const clickSize = ctx.sampleRate * b.len;
      const clickBuf = ctx.createBuffer(1, clickSize, ctx.sampleRate);
      const clickData = clickBuf.getChannelData(0);
      for (let i = 0; i < clickSize; i++) {
        clickData[i] = Math.random() * 2 - 1;
      }
      click.buffer = clickBuf;

      const clickFilter = ctx.createBiquadFilter();
      clickFilter.type = 'highpass';
      clickFilter.frequency.setValueAtTime(b.hpf, t);

      const clickGain = ctx.createGain();
      clickGain.gain.setValueAtTime(b.vol * 0.45, t);
      clickGain.gain.exponentialRampToValueAtTime(0.001, t + b.len);

      click.connect(clickFilter);
      clickFilter.connect(clickGain);
      clickGain.connect(ctx.destination);

      click.start(t);
      osc.start(t);
      osc.stop(t + b.len + 0.01);
    });
  } catch (e) {
    console.error('Audio error:', e);
  }
}

/**
 * Plays a warm, harmonious xylophone/chime upward major arpeggio.
 */
export function playVictorySound() {
  try {
    const ctx = getAudioContext();
    const now = ctx.currentTime;
    
    const playNote = (freq: number, startTime: number, duration: number) => {
      const osc = ctx.createOscillator();
      const subOsc = ctx.createOscillator(); // Add high octave chime to warm triangle
      const gain = ctx.createGain();
      const subGain = ctx.createGain();
      
      osc.type = 'triangle';
      osc.frequency.value = freq;
      
      subOsc.type = 'sine';
      subOsc.frequency.value = freq * 2; // Octave harmonic
      
      gain.gain.setValueAtTime(0.08, startTime);
      gain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      subGain.gain.setValueAtTime(0.03, startTime);
      subGain.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
      
      osc.connect(gain);
      subOsc.connect(subGain);
      
      gain.connect(ctx.destination);
      subGain.connect(ctx.destination);
      
      osc.start(startTime);
      subOsc.start(startTime);
      
      osc.stop(startTime + duration + 0.05);
      subOsc.stop(startTime + duration + 0.05);
    };

    const noteDelay = 0.08;
    playNote(261.63, now, 0.15);                  // C4
    playNote(329.63, now + noteDelay, 0.15);        // E4
    playNote(392.00, now + noteDelay * 2, 0.15);    // G4
    playNote(523.25, now + noteDelay * 3, 0.15);    // C5
    playNote(659.25, now + noteDelay * 4, 0.15);    // E5
    playNote(783.99, now + noteDelay * 5, 0.15);    // G5
    playNote(1046.50, now + noteDelay * 6, 0.5);    // C6
  } catch (e) {
    console.error('Audio error:', e);
  }
}
