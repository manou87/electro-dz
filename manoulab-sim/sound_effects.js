// Sound design industriel haute fidélité ManouLab (Web Audio API)
(function() {
  let audioCtx = null;
  let isSoundEnabled = true;

  // Variables du moteur asynchrone triphasé
  let motorSubOsc = null;
  let motorRotorOsc = null;
  let motorVentSource = null;
  let motorMasterGain = null;
  let motorVentFilter = null;
  let isMotorRunning = false;

  function getAudioContext() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume();
    }
    return audioCtx;
  }

  window.addEventListener('pointerdown', () => {
    getAudioContext();
  }, { once: true });

  function createBrownNoiseBuffer(ctx) {
    const bufferSize = ctx.sampleRate * 2.0;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5;
    }
    return buffer;
  }

  window.ManouLabAudio = {
    toggleSound: function(enable) {
      isSoundEnabled = enable !== undefined ? enable : !isSoundEnabled;
      if (!isSoundEnabled && motorMasterGain) {
        motorMasterGain.gain.setValueAtTime(0, audioCtx ? audioCtx.currentTime : 0);
      }
      return isSoundEnabled;
    },

    isAudioEnabled: function() {
      return isSoundEnabled;
    },

    // 1. Bouton Poussoir (Marche / Arrêt mécanique franc Telemecanique)
    playButtonClick: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, now);
      osc.frequency.exponentialRampToValueAtTime(100, now + 0.035);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    },

    // 2. Bouton Rotatif Sélecteur (Cran mécanique sec 90° / Came industrielle)
    playRotarySwitch: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Double clac rapide d'indexation à bille
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(850, now);
      osc1.frequency.exponentialRampToValueAtTime(180, now + 0.025);
      gain1.gain.setValueAtTime(0.6, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1600, now);

      osc1.connect(filter);
      filter.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.03);

      setTimeout(() => {
        if (!isSoundEnabled || !ctx) return;
        const now2 = ctx.currentTime;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(650, now2);
        osc2.frequency.exponentialRampToValueAtTime(120, now2 + 0.03);
        gain2.gain.setValueAtTime(0.4, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.03);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.035);
      }, 15);
    },

    // 3. Interrupteur mural à bascule / Va-et-vient (Bascule franche plastique/ressort)
    playToggleSwitch: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(750, now);
      osc.frequency.exponentialRampToValueAtTime(140, now + 0.04);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.045);
    },

    // 4. Télérupteur modulaire (Le gros CLIC bistable électromécanique)
    playTelerupteur: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      // Percussion de la roue à rochet intérieure
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(420, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.05);

      gain.gain.setValueAtTime(0.7, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(900, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    },

    // 5. Minuterie d'éclairage (Armement à ressort et déclenchement net)
    playTimerClick: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(900, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.035);

      gain.gain.setValueAtTime(0.5, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.04);
    },

    // 6. Relais thermique / Overload (Déclenchement sec bilame)
    playOverloadTrip: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.05);

      gain.gain.setValueAtTime(0.6, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.055);
    },

    // 7. Capteur / Détecteur de proximité / Fin de course
    playSensorClick: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1500, now);
      osc.frequency.exponentialRampToValueAtTime(600, now + 0.02);

      gain.gain.setValueAtTime(0.35, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.025);
    },

    // 8. Coup de poing Arrêt d'Urgence
    playEmergencyStop: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(40, now + 0.1);

      gain.gain.setValueAtTime(0.9, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.11);

      const oscMetal = ctx.createOscillator();
      const gainMetal = ctx.createGain();
      oscMetal.type = 'square';
      oscMetal.frequency.setValueAtTime(1600, now);
      oscMetal.frequency.exponentialRampToValueAtTime(250, now + 0.05);

      gainMetal.gain.setValueAtTime(0.4, now);
      gainMetal.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
      oscMetal.connect(gainMetal);
      gainMetal.connect(ctx.destination);
      oscMetal.start(now);
      oscMetal.stop(now + 0.06);
    },

    // 9. Contacteur de puissance KM (Le gros "CLACK" électromagnétique)
    playContactorClack: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(500, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.065);

      gain.gain.setValueAtTime(0.75, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.065);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1100, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);

      setTimeout(() => {
        if (!isSoundEnabled || !ctx) return;
        const now2 = ctx.currentTime;
        const osc2 = ctx.createOscillator();
        const gain2 = ctx.createGain();
        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(380, now2);
        osc2.frequency.exponentialRampToValueAtTime(60, now2 + 0.035);
        gain2.gain.setValueAtTime(0.4, now2);
        gain2.gain.exponentialRampToValueAtTime(0.001, now2 + 0.035);
        osc2.connect(gain2);
        gain2.connect(ctx.destination);
        osc2.start(now2);
        osc2.stop(now2 + 0.04);
      }, 22);
    },

    // 10. Disjoncteur magnétothermique
    playBreakerToggle: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(120, now + 0.045);

      gain.gain.setValueAtTime(0.55, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.045);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.05);
    },

    // 11. Arc Électrique / Court-circuit
    playElectricArc: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const bufferSize = ctx.sampleRate * 0.25;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (ctx.sampleRate * 0.08));
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1800, now);
      filter.Q.setValueAtTime(3.0, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.85, now);
      gain.gain.exponentialRampToValueAtTime(0.01, now + 0.24);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start(now);
    },

    // 12. Porte de tableau
    playDoorLatch: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(320, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.06);

      gain.gain.setValueAtTime(0.45, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.07);
    },

    // 13. Connexion fil / Borne
    playWireSnap: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1100, now);
      osc.frequency.exponentialRampToValueAtTime(350, now + 0.025);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.03);
    },

    // 14. Vrai moteur triphasé
    startMotorSound: function() {
      if (!isSoundEnabled) return;
      const ctx = getAudioContext();
      if (!ctx) return;

      if (isMotorRunning) return;
      isMotorRunning = true;

      const now = ctx.currentTime;

      if (!motorMasterGain) {
        motorMasterGain = ctx.createGain();
        motorMasterGain.connect(ctx.destination);
      }
      motorMasterGain.gain.cancelScheduledValues(now);
      motorMasterGain.gain.setValueAtTime(0.001, now);
      motorMasterGain.gain.linearRampToValueAtTime(0.40, now + 1.2);

      motorSubOsc = ctx.createOscillator();
      motorSubOsc.type = 'sine';
      motorSubOsc.frequency.setValueAtTime(25, now);
      motorSubOsc.frequency.exponentialRampToValueAtTime(50, now + 1.5);

      const subGain = ctx.createGain();
      subGain.gain.setValueAtTime(0.65, now);
      motorSubOsc.connect(subGain);
      subGain.connect(motorMasterGain);
      motorSubOsc.start(now);

      motorRotorOsc = ctx.createOscillator();
      motorRotorOsc.type = 'triangle';
      motorRotorOsc.frequency.setValueAtTime(35, now);
      motorRotorOsc.frequency.exponentialRampToValueAtTime(98, now + 1.8);

      const rotorFilter = ctx.createBiquadFilter();
      rotorFilter.type = 'lowpass';
      rotorFilter.frequency.setValueAtTime(180, now);

      const rotorGain = ctx.createGain();
      rotorGain.gain.setValueAtTime(0.45, now);
      motorRotorOsc.connect(rotorFilter);
      rotorFilter.connect(rotorGain);
      rotorGain.connect(motorMasterGain);
      motorRotorOsc.start(now);

      const ventBuffer = createBrownNoiseBuffer(ctx);
      motorVentSource = ctx.createBufferSource();
      motorVentSource.buffer = ventBuffer;
      motorVentSource.loop = true;

      motorVentFilter = ctx.createBiquadFilter();
      motorVentFilter.type = 'lowpass';
      motorVentFilter.frequency.setValueAtTime(100, now);
      motorVentFilter.frequency.exponentialRampToValueAtTime(380, now + 1.8);

      const ventGain = ctx.createGain();
      ventGain.gain.setValueAtTime(0.35, now);
      motorVentSource.connect(motorVentFilter);
      motorVentFilter.connect(ventGain);
      ventGain.connect(motorMasterGain);
      motorVentSource.start(now);
    },

    // 15. Arrêt progressif du Vrai Moteur Triphasé
    stopMotorSound: function() {
      if (!isMotorRunning || !audioCtx || !motorMasterGain) return;
      isMotorRunning = false;
      const now = audioCtx.currentTime;
      const stopDuration = 2.4;

      if (motorSubOsc) {
        try {
          motorSubOsc.frequency.cancelScheduledValues(now);
          motorSubOsc.frequency.setValueAtTime(motorSubOsc.frequency.value, now);
          motorSubOsc.frequency.exponentialRampToValueAtTime(10, now + stopDuration);
          motorSubOsc.stop(now + stopDuration);
        } catch (_) {}
      }

      if (motorRotorOsc) {
        try {
          motorRotorOsc.frequency.cancelScheduledValues(now);
          motorRotorOsc.frequency.setValueAtTime(motorRotorOsc.frequency.value, now);
          motorRotorOsc.frequency.exponentialRampToValueAtTime(12, now + stopDuration);
          motorRotorOsc.stop(now + stopDuration);
        } catch (_) {}
      }

      if (motorVentFilter) {
        try {
          motorVentFilter.frequency.cancelScheduledValues(now);
          motorVentFilter.frequency.setValueAtTime(motorVentFilter.frequency.value, now);
          motorVentFilter.frequency.exponentialRampToValueAtTime(60, now + stopDuration);
        } catch (_) {}
      }

      if (motorVentSource) {
        try {
          motorVentSource.stop(now + stopDuration);
        } catch (_) {}
      }

      motorMasterGain.gain.cancelScheduledValues(now);
      motorMasterGain.gain.setValueAtTime(motorMasterGain.gain.value, now);
      motorMasterGain.gain.linearRampToValueAtTime(0.0001, now + stopDuration);
    }
  };
})();
