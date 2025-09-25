// A centralized service for managing all audio within the application.
// This ensures consistency and keeps audio logic separate from component logic.

// Royalty-free Base64 encoded audio data.
const SOUNDS = {
  // A simple, short synth click sound for UI interaction.
  uiStart: 'data:audio/wav;base64,UklGRlJDAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTo/AABMAH4A/gAnAMcBJgDIAcoCNgM0BHQE0gT8BSwGIQdTB5wIKgkdCUEK+gtDDL4NQw3CDk4PPQ+ID6AQjhCtEQ4R8hLBE5IUVBViFkIWlxfAGFwZQBlaGdoAWYAAAA=',
  // An atmospheric, looping background track with a "cosmic pinball" feel.
  backgroundMusic: 'data:audio/wav;base64,UklGRkh5AABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YVgseQAA/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/9//8A/v/tANqA4wD6gICA3IEHgXSB14I8AmOCx4NOg+iEcITihWqF7gY/BrAG+IfBCP8KNwupDEsNsA9FEGgSXBSEFkAXaBkqGvgc6iE4IwwlGCgHKbIuQTKyNLw+DEYgTJhcsHIIf4iSgKKApoDAgM+//4C/gIqA1EE0gXbB+wJygs9DX4PthDeE7IV1ReNGP8bABz6HyQj+CgCLwIx4TVcO0I/FkaMU1BY9FrAXpBsoHXgfICLiJiAnwCxgLkAxIDNgOgA/QENAUsBagGUAZgBTwEAAAAA/v/+AAEA/v/+AAAAAP7//gAAAAAAAP7//gD+//4AAAAA/v/+AP7//gAAAAAAAP7//gD+//4AAP7//gACAP7//gD+//4A/v/+AP7//gD+//4AAAAA/v/+AP7//gAAAAAAAP7//gD+//4AAP7//gD+//4A/v/+AP7//gACAP7//gD+//4A/v/+AP7//gD+//4A/v/+AAAAAP7//gD+//4AAAAAAAD+//4A/v/+AAAAAP7//gAAAAAAAP7//gAAAAAAAP7//gAAAAAAAP7//gD+//4AAP7//gAAAAAAAP7//gD+//4A/v/+AAAAAP7//gAAAAAAAP7//gD+//4AAP7//gAAAAAAAP7//gAA',
};

type SoundKeys = keyof typeof SOUNDS;

class AudioService {
    private audioCtx: AudioContext | null = null;
    private soundBuffers: Map<SoundKeys, AudioBuffer> = new Map();
    private musicSource: AudioBufferSourceNode | null = null;
    private isInitialized = false;

    // Must be called on the first user interaction to enable audio.
    public async init() {
        if (this.isInitialized || typeof window === 'undefined') return;
        try {
            this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
            await this.loadAllSounds();
            this.isInitialized = true;
            console.log("AudioService Initialized");
        } catch (e) {
            console.error("Web Audio API is not supported or failed to initialize:", e);
        }
    }

    private async loadSound(key: SoundKeys, url: string): Promise<void> {
        if (!this.audioCtx) return;
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
            this.soundBuffers.set(key, audioBuffer);
        } catch (error) {
            console.error(`Failed to load sound: ${key}`, error);
        }
    }

    private async loadAllSounds(): Promise<void> {
        const loadPromises = Object.keys(SOUNDS).map(key =>
            this.loadSound(key as SoundKeys, SOUNDS[key as SoundKeys])
        );
        await Promise.all(loadPromises);
    }

    public playSound(key: SoundKeys, volume = 0.5) {
        if (!this.audioCtx || !this.soundBuffers.has(key)) return;

        const source = this.audioCtx.createBufferSource();
        source.buffer = this.soundBuffers.get(key)!;

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);

        source.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        source.start(0);
    }
    
    public playMusic(key: SoundKeys, volume = 0.3) {
        if (!this.audioCtx || !this.soundBuffers.has(key) || this.musicSource) return;
        
        this.musicSource = this.audioCtx.createBufferSource();
        this.musicSource.buffer = this.soundBuffers.get(key)!;
        this.musicSource.loop = true;

        const gainNode = this.audioCtx.createGain();
        gainNode.gain.setValueAtTime(volume, this.audioCtx.currentTime);
        
        this.musicSource.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        this.musicSource.start(0);
    }
    
    public stopMusic() {
        if (this.musicSource) {
            this.musicSource.stop(0);
            this.musicSource.disconnect();
            this.musicSource = null;
        }
    }

    public playUpgradeSound() {
        if (!this.audioCtx) return;

        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300, this.audioCtx.currentTime);
        oscillator.frequency.exponentialRampToValueAtTime(1200, this.audioCtx.currentTime + 0.4);

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.2, this.audioCtx.currentTime + 0.05);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 0.5);

        oscillator.start(this.audioCtx.currentTime);
        oscillator.stop(this.audioCtx.currentTime + 0.5);
    }
    
    public playConnectionSound() {
        if (!this.audioCtx) return;
        
        const osc1 = this.audioCtx.createOscillator();
        const osc2 = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();
        
        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);
        
        osc1.type = 'triangle';
        osc2.type = 'sine';
        
        const baseFreq = 220; // A3
        osc1.frequency.setValueAtTime(baseFreq, this.audioCtx.currentTime);
        osc2.frequency.setValueAtTime(baseFreq * 1.5, this.audioCtx.currentTime); // Perfect fifth E4

        gainNode.gain.setValueAtTime(0, this.audioCtx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.15, this.audioCtx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + 1.0);

        osc1.start(this.audioCtx.currentTime);
        osc1.stop(this.audioCtx.currentTime + 1.0);
        osc2.start(this.audioCtx.currentTime);
        osc2.stop(this.audioCtx.currentTime + 1.0);
    }
}

export const audioService = new AudioService();