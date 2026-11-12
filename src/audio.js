let context;
export function sound(kind, muted) {
  if (muted) return;
  try {
    context ??= new (window.AudioContext || window.webkitAudioContext)();
    if (context.state === 'suspended') void context.resume().catch(() => {});
    const t = context.currentTime;
    const tones = kind === 'win' ? [392, 493.88, 587.33, 783.99] : kind === 'open' ? [180, 920] : kind === 'blocked' ? [110] : kind === 'undo' ? [320, 240] : [260];
    tones.forEach((hz, i) => {
      const osc = context.createOscillator(), gain = context.createGain();
      osc.type = kind === 'open' ? 'triangle' : 'sine'; osc.frequency.value = hz;
      const start = t + i * (kind === 'win' ? .09 : .065), duration = kind === 'win' ? .32 : .07;
      gain.gain.setValueAtTime(0, start); gain.gain.linearRampToValueAtTime(.09, start + .005); gain.gain.exponentialRampToValueAtTime(.001, start + duration);
      osc.connect(gain).connect(context.destination); osc.start(start); osc.stop(start + duration + .01);
    });
  } catch { /* Audio failure never blocks the puzzle. */ }
}
