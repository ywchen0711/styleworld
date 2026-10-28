// The sounds: small synthesised blips, the same in every world, except that porcelain rings when it breaks and
// paper rustles. Nothing plays until the first key or touch (browsers' rule).
let ac = null, out = null;
function wake() { if (!ac) { ac = new (window.AudioContext || window.webkitAudioContext)(); out = ac.createGain(); out.gain.value = 0.22; out.connect(ac.destination); } if (ac.state === 'suspended') ac.resume(); }
addEventListener('keydown', wake); addEventListener('pointerdown', wake);
function tone(f0, f1, dur, type = 'square', vol = 0.3, at = 0) {
  const t = ac.currentTime + at, o = ac.createOscillator(), g = ac.createGain();
  o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
  g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur); o.connect(g).connect(out); o.start(t); o.stop(t + dur + 0.02);
}
function noise(dur, vol = 0.3, freq = 1200, at = 0, q = 0.7) {
  const t = ac.currentTime + at, n = Math.ceil(ac.sampleRate * dur), b = ac.createBuffer(1, n, ac.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / n) ** 2;
  const s = ac.createBufferSource(), f = ac.createBiquadFilter(), g = ac.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q; g.gain.value = vol;
  s.connect(f).connect(g).connect(out); s.start(t);
}
const notes = (list, type = 'square', len = 0.09, vol = 0.22) => list.forEach((f, i) => tone(f, f, len * 1.6, type, vol, i * len));
export function sfx(name) {
  if (!ac) return;
  const style = document.body.dataset.style;
  switch (name) {
    case 'jump': tone(280, 720, 0.16, 'square', 0.14); break;
    case 'coin': tone(988, 988, 0.07, 'square', 0.16); tone(1319, 1319, 0.3, 'square', 0.16, 0.07); break;
    case 'sprout': tone(200, 900, 0.35, 'triangle', 0.25); break;
    case 'stomp': tone(420, 70, 0.13, 'triangle', 0.4); noise(0.06, 0.2, 600); break;
    case 'bump': tone(140, 90, 0.08, 'square', 0.2); if (style === 'porcelain') tone(2400, 2300, 0.25, 'sine', 0.08); break;
    case 'break':
      if (style === 'porcelain') { noise(0.25, 0.35, 4000, 0, 2); for (let i = 0; i < 6; i++) tone(2600 + Math.random() * 2400, 2500, 0.18, 'sine', 0.12, 0.03 + i * 0.045); }
      else if (style === 'popup' || style === 'sticker') { noise(0.22, 0.4, 2500, 0, 0.5); noise(0.15, 0.25, 5000, 0.08, 0.5); }
      else { noise(0.3, 0.5, 900); tone(160, 60, 0.2, 'triangle', 0.3); }
      break;
    case 'grow': notes([392, 523, 659, 784, 1047], 'square', 0.07); break;
    case 'shrink': notes([784, 587, 440, 330], 'square', 0.08); break;
    case 'die': notes([494, 466, 440, 330, 262], 'triangle', 0.16, 0.3); break;
    case 'win': notes([523, 659, 784, 1047, 784, 1047, 1319], 'square', 0.12); break;
  }
}
