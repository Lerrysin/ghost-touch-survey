/**
 * Haptic Profile Visualizer
 * Canvas-based waveform animation and parameter visualization
 */

const HapticVisualizer = (() => {
  // Animation state
  const animations = new Map();
  let animFrameId = null;

  /**
   * Draw an animated waveform on a canvas element
   */
  function drawWaveform(canvas, profile, time) {
    const ctx = canvas.getContext('2d');
    const w = canvas.width;
    const h = canvas.height;

    ctx.clearRect(0, 0, w, h);

    // Background grid
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.15)';
    ctx.lineWidth = 0.5;
    for (let y = h * 0.25; y < h; y += h * 0.25) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Waveform parameters
    const freq = profile.frequency_hz || 150;
    const amp = (profile.amplitude_pct || 50) / 100;
    const rough = profile.roughness || 0;
    const modHz = profile.modulation_hz || 0;
    const waveform = profile.waveform || 'sine';

    // Scale frequency for visual display (map 20-300Hz to visual cycles)
    const visualFreq = freq / 40;
    const modulation = modHz > 0 ? Math.sin(time * modHz * 0.5) * 0.3 + 0.7 : 1.0;

    // Envelope shape
    const envelope = profile.envelope || 'sustained';
    let envMult = 1.0;
    const cycleT = (time * 0.3) % 1.0;
    if (envelope === 'fade_in_out') {
      envMult = Math.sin(cycleT * Math.PI);
    } else if (envelope === 'burst') {
      envMult = cycleT < 0.3 ? 1.0 : Math.exp(-(cycleT - 0.3) * 5);
    } else if (envelope === 'rhythmic') {
      envMult = Math.abs(Math.sin(cycleT * Math.PI * 3));
    }

    // Draw waveform
    ctx.beginPath();
    ctx.strokeStyle = getWaveformColor(profile);
    ctx.lineWidth = 2;
    ctx.shadowColor = getWaveformColor(profile);
    ctx.shadowBlur = 6;

    // Use a seeded PRNG for noise reproducibility per-frame
    let noiseState = Math.floor(time * 10) * 1000;

    for (let x = 0; x < w; x++) {
      const t = x / w;
      let y;
      const phase = t * visualFreq * Math.PI * 2 + time * 2;

      switch (waveform) {
        case 'sine':
          y = Math.sin(phase);
          break;
        case 'noise':
          // Pseudo-random noise
          noiseState = (noiseState * 1103515245 + 12345) & 0x7fffffff;
          y = ((noiseState / 0x7fffffff) * 2 - 1) * 0.7 + Math.sin(phase) * 0.3;
          break;
        case 'square':
          y = Math.sin(phase) > 0 ? 1 : -1;
          y *= 0.8;
          break;
        case 'pulse':
          const pulsePhase = (phase % (Math.PI * 2)) / (Math.PI * 2);
          y = pulsePhase < 0.15 ? 1 : (pulsePhase < 0.25 ? Math.cos((pulsePhase - 0.15) / 0.1 * Math.PI * 0.5) : 0);
          break;
        default:
          y = Math.sin(phase);
      }

      // Add roughness
      if (rough > 0.3) {
        noiseState = (noiseState * 1103515245 + 12345) & 0x7fffffff;
        y += ((noiseState / 0x7fffffff) * 2 - 1) * rough * 0.5;
      }

      y *= amp * modulation * envMult;
      const py = h / 2 - y * h * 0.4;

      if (x === 0) ctx.moveTo(x, py);
      else ctx.lineTo(x, py);
    }
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Center line
    ctx.strokeStyle = 'rgba(100, 116, 139, 0.3)';
    ctx.lineWidth = 0.5;
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, h / 2);
    ctx.lineTo(w, h / 2);
    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = 'rgba(148, 163, 184, 0.8)';
    ctx.font = '10px monospace';
    ctx.fillText(`${freq}Hz ${waveform}`, 6, 14);
  }

  function getWaveformColor(profile) {
    const thermal = profile.thermal_delta_c || 0;
    if (thermal < -2) return '#60a5fa';      // cold blue
    if (thermal < -0.5) return '#93c5fd';    // cool
    if (thermal > 2) return '#f87171';       // hot red
    if (thermal > 0.5) return '#fbbf24';     // warm
    return '#a78bfa';                         // neutral purple
  }

  /**
   * Render a full haptic profile card's parameters
   */
  function renderProfileParams(container, profile) {
    container.innerHTML = '';

    // Get localized labels (I18N may or may not be loaded)
    const t = (typeof I18N !== 'undefined') ? I18N.t : (k => k);
    const labels = {
      amp: t('param_amplitude') || 'Amplitude',
      thermal: t('param_thermal') || 'Thermal',
      rough: t('param_roughness') || 'Roughness',
      onset: t('param_onset') || 'Onset',
      dur: t('param_duration') || 'Duration',
    };

    // 1. Amplitude bar
    const ampRow = createParamRow(labels.amp, profile.amplitude_pct, '%', 0, 100,
      getAmplitudeColor(profile.amplitude_pct));
    container.appendChild(ampRow);

    // 2. Temperature gauge
    const tempRow = createTempGauge(labels.thermal, profile.thermal_delta_c || 0);
    container.appendChild(tempRow);

    // 3. Roughness bar
    const roughPct = Math.round((profile.roughness || 0) * 100);
    const roughRow = createParamRow(labels.rough, roughPct, '', 0, 100,
      getRoughnessColor(profile.roughness));
    container.appendChild(roughRow);

    // 4. Onset bar
    const onsetNorm = Math.min((profile.onset_ms || 500) / 2000 * 100, 100);
    const onsetRow = createParamRow(labels.onset, profile.onset_ms || 500, 'ms', 0, 100,
      '#8b5cf6', onsetNorm);
    container.appendChild(onsetRow);

    // 5. Duration bar
    const durNorm = Math.min((profile.duration_ms || 2000) / 6000 * 100, 100);
    const durRow = createParamRow(labels.dur, profile.duration_ms || 2000, 'ms', 0, 100,
      '#6366f1', durNorm);
    container.appendChild(durRow);
  }

  function createParamRow(label, value, unit, min, max, color, normalizedPct) {
    const row = document.createElement('div');
    row.className = 'param-row';

    const pct = normalizedPct !== undefined ? normalizedPct
      : ((value - min) / (max - min)) * 100;

    row.innerHTML = `
      <span class="param-label">${label}</span>
      <div class="param-bar-container">
        <div class="param-bar" style="width:${pct}%;background:${color}"></div>
      </div>
      <span class="param-value">${value}${unit}</span>
    `;
    return row;
  }

  function createTempGauge(label, thermal) {
    const row = document.createElement('div');
    row.className = 'param-row';

    // Map -5...+5 to 0...100%
    const pct = ((thermal + 5) / 10) * 100;
    const sign = thermal >= 0 ? '+' : '';

    row.innerHTML = `
      <span class="param-label">${label}</span>
      <div class="temp-gauge">
        <div class="temp-marker" style="left:calc(${pct}% - 2px)"></div>
      </div>
      <span class="param-value">${sign}${thermal.toFixed(1)}&deg;C</span>
    `;
    return row;
  }

  function getAmplitudeColor(amp) {
    if (amp >= 70) return '#ef4444';
    if (amp >= 40) return '#f59e0b';
    if (amp >= 20) return '#22c55e';
    return '#94a3b8';
  }

  function getRoughnessColor(rough) {
    if (rough >= 0.6) return '#ef4444';
    if (rough >= 0.3) return '#f59e0b';
    return '#22c55e';
  }

  /**
   * Create and render a complete profile card
   */
  function createProfileCard(label, profile, onClick) {
    const card = document.createElement('div');
    card.className = 'profile-card';
    card.dataset.label = label;

    // Label badge
    const labelEl = document.createElement('div');
    labelEl.className = 'card-label';
    labelEl.textContent = label;
    card.appendChild(labelEl);

    // Rank badge (for Part 2)
    const rankBadge = document.createElement('div');
    rankBadge.className = 'rank-badge';
    rankBadge.dataset.rankBadge = label;
    card.appendChild(rankBadge);

    // Waveform canvas
    const waveContainer = document.createElement('div');
    waveContainer.className = 'waveform-container';
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 80;
    waveContainer.appendChild(canvas);
    card.appendChild(waveContainer);

    // Parameters
    const paramsContainer = document.createElement('div');
    paramsContainer.className = 'profile-params';
    renderProfileParams(paramsContainer, profile);
    card.appendChild(paramsContainer);

    // Click handler
    if (onClick) {
      card.addEventListener('click', () => onClick(label, card));
    }

    // Register canvas for animation
    animations.set(canvas, profile);

    return card;
  }

  /**
   * Start the animation loop
   */
  function startAnimation() {
    if (animFrameId) return;
    const startTime = performance.now();

    function animate() {
      const time = (performance.now() - startTime) / 1000;
      animations.forEach((profile, canvas) => {
        if (canvas.offsetParent !== null) { // only if visible
          drawWaveform(canvas, profile, time);
        }
      });
      animFrameId = requestAnimationFrame(animate);
    }
    animFrameId = requestAnimationFrame(animate);
  }

  /**
   * Stop animation and clear canvases
   */
  function stopAnimation() {
    if (animFrameId) {
      cancelAnimationFrame(animFrameId);
      animFrameId = null;
    }
    animations.clear();
  }

  return {
    createProfileCard,
    renderProfileParams,
    startAnimation,
    stopAnimation,
    drawWaveform,
  };
})();
