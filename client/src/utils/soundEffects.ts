/**
 * Sound effects utility for messaging
 * Provides typing and message notification sounds
 */

class SoundEffects {
  private typingAudio: HTMLAudioElement | null = null;
  private messageAudio: HTMLAudioElement | null = null;
  private enabled: boolean = true;

  constructor() {
    // Create typing sound (typewriter effect)
    this.typingAudio = this.createTypingSound();
    
    // Create message notification sound (ding)
    this.messageAudio = this.createMessageSound();

    // Check user preference
    const savedPreference = localStorage.getItem("soundEffectsEnabled");
    this.enabled = savedPreference !== "false";
  }

  /**
   * Create typewriter typing sound using Web Audio API
   */
  private createTypingSound(): HTMLAudioElement | null {
    try {
      // Create a short click sound for typing
      const audio = new Audio();
      
      // Use a data URL for a simple click sound
      // This is a short beep sound encoded as base64
      audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjHQU2jdXvzn0vBSh+zPLaizsKE12y6OyrWBUIRp7f8r9vIgUsgs/y2Ik3CBtpvfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBQ==";
      audio.volume = 0.3;
      
      return audio;
    } catch (error) {
      console.error("Failed to create typing sound:", error);
      return null;
    }
  }

  /**
   * Create message notification sound (ding)
   */
  private createMessageSound(): HTMLAudioElement | null {
    try {
      const audio = new Audio();
      
      // Use a pleasant notification sound
      // This is a simple ding sound encoded as base64
      audio.src = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUKXh8LdjHQU2jdXvzn0vBSh+zPLaizsKE12y6OyrWBUIRp7f8r9vIgUsgs/y2Ik3CBtpvfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBSyCz/LYiTcIG2i98OScTgwOUKXh8LdjHQU2jdXvzn4vBSh+zPLaizsKE12y6O2rWBUIRp7f8r9vIgUsgs/y2Ik3CBtovfDknE4MDlCl4fC3Yx0FNo3V785+LwUofszy2os7ChNdsujtq1gVCEae3/K/byIFLILP8tiJNwgbaL3w5JxODA5QpeHwt2MdBTaN1e/Ofi8FKH7M8tqLOwoTXbLo7atYFQhGnt/yv28iBQ==";
      audio.volume = 0.5;
      
      return audio;
    } catch (error) {
      console.error("Failed to create message sound:", error);
      return null;
    }
  }

  /**
   * Play typing sound (short click)
   */
  playTypingSound(): void {
    if (!this.enabled || !this.typingAudio) return;

    try {
      // Reset and play
      this.typingAudio.currentTime = 0;
      this.typingAudio.play().catch(err => {
        // Ignore autoplay errors
        console.debug("Typing sound autoplay prevented:", err);
      });
    } catch (error) {
      console.error("Failed to play typing sound:", error);
    }
  }

  /**
   * Play message notification sound (ding)
   */
  playMessageSound(): void {
    if (!this.enabled || !this.messageAudio) return;

    try {
      // Reset and play
      this.messageAudio.currentTime = 0;
      this.messageAudio.play().catch(err => {
        // Ignore autoplay errors
        console.debug("Message sound autoplay prevented:", err);
      });
    } catch (error) {
      console.error("Failed to play message sound:", error);
    }
  }

  /**
   * Enable sound effects
   */
  enable(): void {
    this.enabled = true;
    localStorage.setItem("soundEffectsEnabled", "true");
  }

  /**
   * Disable sound effects
   */
  disable(): void {
    this.enabled = false;
    localStorage.setItem("soundEffectsEnabled", "false");
  }

  /**
   * Toggle sound effects
   */
  toggle(): boolean {
    this.enabled = !this.enabled;
    localStorage.setItem("soundEffectsEnabled", this.enabled.toString());
    return this.enabled;
  }

  /**
   * Check if sound effects are enabled
   */
  isEnabled(): boolean {
    return this.enabled;
  }
}

// Export singleton instance
export const soundEffects = new SoundEffects();

