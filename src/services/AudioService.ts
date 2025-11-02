// Placeholder for AudioService
class AudioService {
  userInteraction() {
    return Promise.resolve();
  }
  playBackgroundMusic() {}
  playSound(_sound: string) {}
  setSfxVolume(_volume: number) {}
  setMusicVolume(_volume: number) {}
}
export const audioService = new AudioService();
