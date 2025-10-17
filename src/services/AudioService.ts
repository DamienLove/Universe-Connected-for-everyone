class AudioService {
  private audioContext: AudioContext | null = null;
  private soundBuffers: { [key: string]: AudioBuffer } = {};
  private backgroundMusicSource: AudioBufferSourceNode | null = null;
  private themeMusicSource: AudioBufferSourceNode | null = null;
  private musicGainNode: GainNode | null = null;
  private themeGainNode: GainNode | null = null;
  private sfxVolume = 1;
  private musicVolume = 0.3;

  // Sound effects encoded as base64 data URIs
  // FIX: Replaced all previous base64 strings with valid, minimal WAV data to prevent decoding errors.
  private soundPaths: { [key: string]: string } = {
    background: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    theme_music: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    purchase_upgrade: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    milestone_achievement: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    collect_orb_standard: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    collect_orb_good: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    collect_orb_bad: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    node_bounce: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    connection_bounce: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    phage_spawn: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    phage_drain: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    phage_capture: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    ui_click: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    ui_open: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    connect_success: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
    pinball_bounce: 'data:audio/wav;base64,UklGRigAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQQAAAAAAAD//w==',
  };

  constructor() {
    this.initAudioContext().then(() => this.loadAllSounds());
  }

  public getSoundKeys(): string[] {
    return Object.keys(this.soundPaths);
  }
  
  public setSfxVolume(level: number) {
    this.sfxVolume = Math.max(0, Math.min(1, level));
  }
  
  public setMusicVolume(level: number) {
    this.musicVolume = Math.max(0, Math.min(1, level));
    if (this.audioContext) {
        if (this.musicGainNode) {
            this.musicGainNode.gain.linearRampToValueAtTime(this.musicVolume, this.audioContext.currentTime + 0.1);
        }
        if (this.themeGainNode) {
            this.themeGainNode.gain.linearRampToValueAtTime(this.musicVolume, this.audioContext.currentTime + 0.1);
        }
    }
  }

  private async initAudioContext() {
    if (!this.audioContext) {
      try {
        this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (e) {
        console.error("Web Audio API is not supported in this browser");
      }
    }
  }

  private base64ToArrayBuffer(base64: string): ArrayBuffer {
    const binaryString = window.atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  public async loadSound(id: string): Promise<void> {
    if (!this.audioContext) return;

    const customSoundData = localStorage.getItem(`custom_audio_${id}`);
    const dataUri = customSoundData || this.soundPaths[id];
    
    // If there's no data URI, create a silent buffer to prevent errors.
    if (!dataUri) {
      if (!this.soundBuffers[id]) {
        this.soundBuffers[id] = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
      }
      return;
    }

    try {
      const base64String = dataUri.split(',')[1];
      if (!base64String) {
          throw new Error('Invalid data URI format');
      }
      const arrayBuffer = this.base64ToArrayBuffer(base64String);
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers[id] = audioBuffer;
    } catch (error) {
      console.error(`Failed to load sound: ${id}`, error);
      // If loading fails, fall back to a silent buffer to prevent crashes
      if (!this.soundBuffers[id]) {
        this.soundBuffers[id] = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
      }
    }
  }

  public async loadAllSounds(): Promise<void> {
    if (!this.audioContext) return;
    const soundPromises = Object.keys(this.soundPaths).map((id) => this.loadSound(id));
    await Promise.all(soundPromises);
  }

  public async userInteraction(): Promise<void> {
    if (!this.audioContext) {
        await this.initAudioContext();
        await this.loadAllSounds();
    }
    if (this.audioContext && this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public playSound(id: string, volume = 1): void {
    // Do not play if context is missing, buffer is missing, or buffer is a silent placeholder.
    if (!this.audioContext || !this.soundBuffers[id] || this.soundBuffers[id].length <= 1) {
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.soundBuffers[id];
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume * this.sfxVolume, this.audioContext.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  public playBackgroundMusic(): void {
    if (!this.audioContext || !this.soundBuffers.background || this.soundBuffers.background.length <= 1) {
      return;
    }
    if (this.backgroundMusicSource) {
      this.backgroundMusicSource.stop();
    }
    this.backgroundMusicSource = this.audioContext.createBufferSource();
    this.backgroundMusicSource.buffer = this.soundBuffers.background;
    this.backgroundMusicSource.loop = true;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
    this.musicGainNode = gainNode;
    
    this.backgroundMusicSource.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    this.backgroundMusicSource.start(0);
  }

  public stopBackgroundMusic(): void {
      if (this.backgroundMusicSource) {
          this.backgroundMusicSource.stop();
          this.backgroundMusicSource = null;
      }
  }
  
  public playThemeMusic(): void {
      if (!this.audioContext || !this.soundBuffers.theme_music || this.soundBuffers.theme_music.length <= 1) {
          return;
      }
      this.stopThemeMusic();
      this.themeMusicSource = this.audioContext.createBufferSource();
      this.themeMusicSource.buffer = this.soundBuffers.theme_music;
      this.themeMusicSource.loop = true;

      const gainNode = this.audioContext.createGain();
      gainNode.gain.setValueAtTime(this.musicVolume, this.audioContext.currentTime);
      this.themeGainNode = gainNode;

      this.themeMusicSource.connect(gainNode);
      gainNode.connect(this.audioContext.destination);
      this.themeMusicSource.start(0);
  }
  
  public stopThemeMusic(): void {
      if (this.themeMusicSource) {
          this.themeMusicSource.stop();
          this.themeMusicSource = null;
      }
  }
}

// Export a singleton instance
export const audioService = new AudioService();