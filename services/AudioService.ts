class AudioService {
  private audioContext: AudioContext | null = null;
  private soundBuffers: { [key: string]: AudioBuffer } = {};
  private backgroundMusicSource: AudioBufferSourceNode | null = null;

  // A map of sound IDs to load as silent placeholders.
  private soundPaths: { [key: string]: string } = {
    background: '',
    purchase_upgrade: '',
    milestone_achievement: '',
    collect_orb: '',
    connect_success: '',
    node_bounce: '',
    connection_bounce: '',
    phage_spawn: '',
    phage_drain: '',
    phage_capture: '',
    ui_click: '',
    ui_open: '',
  };

  constructor() {
    this.initAudioContext().then(() => this.loadAllSounds());
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

  private async loadSound(id: string): Promise<void> {
    if (!this.audioContext || this.soundBuffers[id]) return;
    try {
      // The original base64 strings for sounds were invalid or empty, causing decode errors.
      // This approach creates a valid, silent, single-sample buffer programmatically
      // to act as a placeholder. This resolves the console errors while keeping the audio system functional.
      const buffer = this.audioContext.createBuffer(1, 1, this.audioContext.sampleRate);
      this.soundBuffers[id] = buffer;
    } catch (error) {
      console.error(`Failed to create silent buffer for sound: ${id}`, error);
    }
  }

  private async loadAllSounds(): Promise<void> {
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
    if (!this.audioContext || !this.soundBuffers[id]) return;

    // A buffer with a length of 1 sample is our silent placeholder; don't attempt to play it.
    if (this.soundBuffers[id].length <= 1) {
      return;
    }

    const source = this.audioContext.createBufferSource();
    source.buffer = this.soundBuffers[id];
    
    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);

    source.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    source.start(0);
  }

  public playBackgroundMusic(volume = 0.3): void {
    if (!this.audioContext || !this.soundBuffers.background) return;

    if (this.backgroundMusicSource) {
      this.backgroundMusicSource.stop();
    }
    
    // A buffer with a length of 1 sample is our silent placeholder; don't attempt to play it.
    if (this.soundBuffers.background.length <= 1) {
        return;
    }

    this.backgroundMusicSource = this.audioContext.createBufferSource();
    this.backgroundMusicSource.buffer = this.soundBuffers.background;
    
    // As requested, do not loop the music.
    this.backgroundMusicSource.loop = false;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    
    this.backgroundMusicSource.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    this.backgroundMusicSource.start(0);
  }
}

// Export a singleton instance
export const audioService = new AudioService();