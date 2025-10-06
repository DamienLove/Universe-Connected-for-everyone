class AudioService {
  private audioContext: AudioContext | null = null;
  private soundBuffers: { [key: string]: AudioBuffer } = {};
  private backgroundMusicSource: AudioBufferSourceNode | null = null;

  // A map of sound IDs to their corresponding file paths.
  private soundPaths: { [key: string]: string } = {
    background: '/audio/background.mp3',
    purchase_upgrade: '/audio/purchase_upgrade.wav',
    milestone_achievement: '/audio/milestone_achievement.wav',
    collect_orb: '/audio/collect_orb.wav',
    connect_success: '/audio/connect_success.wav',
    node_bounce: '/audio/node_bounce.wav',
    connection_bounce: '/audio/connection_bounce.wav',
    phage_spawn: '/audio/phage_spawn.wav',
    phage_drain: '/audio/phage_drain.wav',
    phage_capture: '/audio/phage_capture.wav',
    ui_click: '/audio/ui_click.wav',
    ui_open: '/audio/ui_open.wav',
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

  private async loadSound(id: string, path: string): Promise<void> {
    if (!this.audioContext || !path) return;
    try {
      const response = await fetch(path);
      const arrayBuffer = await response.arrayBuffer();
      const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
      this.soundBuffers[id] = audioBuffer;
    } catch (error) {
      console.error(`Failed to load sound: ${id} from ${path}`, error);
    }
  }

  public async loadSoundFromBlob(id: string, blob: Blob): Promise<void> {
    if (!this.audioContext) return;
    try {
        const arrayBuffer = await blob.arrayBuffer();
        const audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
        this.soundBuffers[id] = audioBuffer;
        console.log(`Successfully loaded sound from blob for ID: ${id}`);
    } catch (error) {
        console.error(`Failed to load sound from blob for ID: ${id}`, error);
    }
  }

  public overrideSound(id: string, newBuffer: AudioBuffer): void {
    if (!this.audioContext) return;
    this.soundBuffers[id] = newBuffer;
  }

  private async loadAllSounds(): Promise<void> {
    const soundPromises = Object.entries(this.soundPaths).map(([id, path]) => this.loadSound(id, path));
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
    
    this.backgroundMusicSource = this.audioContext.createBufferSource();
    this.backgroundMusicSource.buffer = this.soundBuffers.background;
    this.backgroundMusicSource.loop = true;

    const gainNode = this.audioContext.createGain();
    gainNode.gain.setValueAtTime(volume, this.audioContext.currentTime);
    
    this.backgroundMusicSource.connect(gainNode);
    gainNode.connect(this.audioContext.destination);
    this.backgroundMusicSource.start(0);
  }
}

// Export a singleton instance
export const audioService = new AudioService();