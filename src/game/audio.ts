export class Ambience {
  private ctx: AudioContext | null = null;
  private hum: GainNode | null = null;
  private stepAt = 0;
  private noise: AudioBuffer | null = null;

  start() {
    if (this.ctx) {
      void this.ctx.resume();
      return;
    }
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return;
    const ctx = new AC();
    this.ctx = ctx;
    const hum = ctx.createGain();
    hum.gain.value = 0.018;
    hum.connect(ctx.destination);
    this.hum = hum;
    const o1 = ctx.createOscillator();
    o1.type = "sine";
    o1.frequency.value = 60;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 120;
    o2.connect(hum);
    o1.connect(hum);
    o1.start();
    o2.start();
    const len = Math.floor(ctx.sampleRate * 0.045);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    this.noise = buf;
    void ctx.resume();
  }

  resume() {
    if (this.ctx?.state === "suspended") void this.ctx.resume();
  }

  update(dt: number, speed: number) {
    if (!this.ctx || !this.noise || speed < 0.35) return;
    this.stepAt -= dt;
    const interval = 0.46 - Math.min(0.18, speed * 0.05);
    if (this.stepAt > 0) return;
    this.stepAt = interval;
    const src = this.ctx.createBufferSource();
    src.buffer = this.noise;
    const filter = this.ctx.createBiquadFilter();
    filter.type = "bandpass";
    filter.frequency.value = 280;
    filter.Q.value = 0.7;
    const g = this.ctx.createGain();
    g.gain.value = 0.08;
    src.connect(filter);
    filter.connect(g);
    g.connect(this.ctx.destination);
    src.start();
  }

  beep() {
    this.tone(880, 0.06, 0.04);
  }

  chime() {
    this.tone(523, 0.18, 0.05);
    window.setTimeout(() => this.tone(784, 0.22, 0.04), 160);
  }

  private tone(freq: number, dur: number, gain: number) {
    if (!this.ctx) return;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.frequency.value = freq;
    o.type = "sine";
    g.gain.value = gain;
    o.connect(g);
    g.connect(this.ctx.destination);
    o.start();
    g.gain.exponentialRampToValueAtTime(0.0001, this.ctx.currentTime + dur);
    o.stop(this.ctx.currentTime + dur);
  }

  dispose() {
    void this.ctx?.close();
    this.ctx = null;
  }
}
