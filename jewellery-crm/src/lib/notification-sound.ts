/**
 * Notification Sound Utility
 * 
 * Handles playing notification sounds when new notifications arrive
 */

class NotificationSound {
  private audio: HTMLAudioElement | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.5;

  constructor() {
    // Only initialize audio in browser environment
    if (typeof window !== 'undefined') {
      this.initializeAudio();
    }
  }

  private initializeAudio() {
    try {
      // Check if we're in browser environment
      if (typeof window === 'undefined') {
        return;
      }

      // Lazy placeholder to keep class initialized in browser; sound is created on play()
      this.audio = new Audio();
    } catch (error) {
      console.warn('Could not initialize notification sound:', error);
    }
  }

  /**
   * Play notification sound
   */
  play() {
    if (!this.isEnabled || !this.audio || typeof window === 'undefined') return;

    try {
      if (!document.hasFocus()) {
        // Silent if not active session
        return;
      }

      // Create a refined two-note chime using Web Audio API (Apple-like)
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const masterGain = audioContext.createGain();
      masterGain.gain.value = this.volume;
      masterGain.connect(audioContext.destination);

      const playTone = (freq: number, start: number, duration: number) => {
        const osc = audioContext.createOscillator();
        const gain = audioContext.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, audioContext.currentTime + start);
        // Gentle ADSR
        gain.gain.setValueAtTime(0.0001, audioContext.currentTime + start);
        gain.gain.exponentialRampToValueAtTime(1.0, audioContext.currentTime + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + start + duration);
        osc.connect(gain);
        gain.connect(masterGain);
        osc.start(audioContext.currentTime + start);
        osc.stop(audioContext.currentTime + start + duration + 0.02);
      };

      // Two chime notes
      playTone(880, 0.0, 0.18);  // A5
      playTone(1174.66, 0.18, 0.22); // D6 (approx)
    } catch (error) {
      console.warn('Could not play notification sound:', error);
    }
  }

  /**
   * Enable/disable notification sounds
   */
  setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  /**
   * Set volume (0.0 to 1.0)
   */
  setVolume(volume: number) {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  /**
   * Get current volume
   */
  getVolume(): number {
    return this.volume;
  }

  /**
   * Check if sound is enabled
   */
  isSoundEnabled(): boolean {
    return this.isEnabled;
  }
}

// Create a lazy singleton instance
let notificationSoundInstance: NotificationSound | null = null;

export const notificationSound = {
  get instance() {
    if (!notificationSoundInstance && typeof window !== 'undefined') {
      notificationSoundInstance = new NotificationSound();
    }
    return notificationSoundInstance;
  },
  
  play() {
    this.instance?.play();
  },
  
  setEnabled(enabled: boolean) {
    this.instance?.setEnabled(enabled);
  },
  
  setVolume(volume: number) {
    this.instance?.setVolume(volume);
  },
  
  getVolume(): number {
    return this.instance?.getVolume() || 0.5;
  },
  
  isSoundEnabled(): boolean {
    return this.instance?.isSoundEnabled() || false;
  }
}; 