/**
 * Ghost Touch User Evaluation Survey — Redesigned
 * Part 1: Haptic Annotation (sliders) | Part 2: Likert Rating
 */
(function () {
  'use strict';

  // ============================================================
  // Configuration
  // ============================================================
  const SUPABASE_URL = 'https://sbadhyaildhfmohooomj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYWRoeWFpbGRoZm1vaG9vb21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDQxMDgsImV4cCI6MjA5MDEyMDEwOH0.jWCHY3U0sybqw89be94x26AG3XrtHLKGuzHRRSOs8_o';
  const PROLIFIC_REDIRECT_BASE = 'https://app.prolific.com/submissions/complete?cc=';

  const urlParams = new URLSearchParams(window.location.search);
  const PROLIFIC_PID = urlParams.get('PROLIFIC_PID') || '';
  const STUDY_ID = urlParams.get('STUDY_ID') || '';
  const SESSION_ID = urlParams.get('SESSION_ID') || '';

  // ============================================================
  // State
  // ============================================================
  let stimuli = null;
  let currentPage = 'loading';
  let currentTrialIdx = 0;
  let currentPart = 0;

  const responses = {
    consent: false,
    demographics: {},
    part1: [],  // {trial_id, family, profile: {amp, freq, thermal, rough, onset, dur}}
    part2: [],  // {trial_id, family, ratings: {A: 1-7, B: 1-7, C: 1-7}, condition_map}
    debrief: {},
    metadata: {
      start_time: null, end_time: null,
      user_agent: navigator.userAgent,
      screen_width: screen.width, screen_height: screen.height,
      prolific_pid: PROLIFIC_PID, study_id: STUDY_ID, session_id: SESSION_ID,
    },
  };

  let trialStartTime = 0;
  const t = I18N.t;

  // ============================================================
  // Slider config
  // ============================================================
  const SLIDERS = [
    { id: 'amp',     key: 'amplitude_pct',    min: 0,    max: 100,  step: 1,   def: 50,   fmt: v => v + '%' },
    { id: 'freq',    key: 'frequency_hz',     min: 1,    max: 500,  step: 1,   def: 150,  fmt: v => v + 'Hz' },
    { id: 'thermal', key: 'thermal_delta_c',  min: -30,  max: 30,   step: 1,   def: 0,    fmt: v => (v >= 0 ? '+' : '') + v + '°C' },
    { id: 'rough',   key: 'roughness',        min: 0,    max: 100,  step: 1,   def: 30,   fmt: v => v },
  ];

  // ============================================================
  // i18n: Apply translations
  // ============================================================
  function applyTranslations() {
    const s = (id, key) => { const el = document.getElementById(id); if (el) el.innerHTML = t(key); };
    const st = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };

    st('h-title', 'title'); st('h-subtitle', 'subtitle'); st('lang-toggle', 'lang_switch');
    // Consent
    st('c-title', 'consent_title'); st('c-purpose-title', 'consent_purpose_title');
    st('c-purpose', 'consent_purpose'); st('c-whatyoudo-title', 'consent_whatyoudo_title');
    s('c-part1', 'consent_part1'); s('c-part2', 'consent_part2'); s('c-part3', 'consent_part3');
    st('c-haptic-title', 'consent_haptic_title'); s('c-haptic', 'consent_haptic');
    st('c-risks-title', 'consent_risks_title'); st('c-risks', 'consent_risks');
    st('c-data-title', 'consent_data_title'); st('c-data', 'consent_data');
    st('c-rights-title', 'consent_rights_title'); st('c-rights', 'consent_rights');
    st('c-agree', 'consent_agree'); st('consent-agree', 'btn_continue');
    // Demographics
    st('d-title', 'demo_title'); st('d-age-label', 'demo_age'); st('d-age-select', 'demo_age_select');
    st('d-gender-label', 'demo_gender'); st('d-gender-select', 'demo_gender_select');
    st('d-gender-f', 'demo_gender_female'); st('d-gender-m', 'demo_gender_male');
    st('d-gender-nb', 'demo_gender_nb'); st('d-gender-pnts', 'demo_gender_pnts');
    st('d-vr-label', 'demo_vr'); st('d-vr-never', 'demo_vr_never');
    st('d-vr-occ', 'demo_vr_occasionally'); st('d-vr-reg', 'demo_vr_regularly');
    st('d-ghost-label', 'demo_ghost'); st('d-ghost-not', 'demo_ghost_not');
    st('d-ghost-some', 'demo_ghost_somewhat'); st('d-ghost-very', 'demo_ghost_very');
    st('demo-next', 'btn_continue');
    // Part 1 intro
    st('p1-title', 'part1_title'); s('p1-desc', 'part1_desc');
    st('p1-param-intro', 'part1_param_intro');
    s('p1-amp', 'part1_param_amp'); s('p1-freq', 'part1_param_freq');
    s('p1-thermal', 'part1_param_thermal'); s('p1-rough', 'part1_param_rough');
    s('p1-task', 'part1_task'); st('part1-start', 'btn_start_part1');
    // Debrief
    st('db-title', 'debrief_title');
    st('db-strategy-label', 'debrief_strategy');
    st('db-difficulty-label', 'debrief_difficulty');
    st('db-comments-label', 'debrief_comments');
    const els = {
      'debrief-strategy': 'debrief_strategy_ph',
      'debrief-difficulty': 'debrief_difficulty_ph',
      'debrief-comments': 'debrief_comments_ph',
    };
    Object.entries(els).forEach(([id, key]) => {
      const el = document.getElementById(id); if (el) el.placeholder = t(key);
    });
    st('debrief-submit', 'btn_submit');
    document.documentElement.lang = I18N.getLang() === 'zh' ? 'zh-CN' : 'en';
  }

  // ============================================================
  // Init
  // ============================================================
  async function init() {
    showPage('loading');
    const paths = ['./stimuli.json', '../../Data/experiment/stimuli.json'];
    let loaded = false;
    for (const path of paths) {
      try {
        const resp = await fetch(path);
        if (!resp.ok) continue;
        stimuli = await resp.json();
        if (stimuli && stimuli.part1_trials) { loaded = true; break; }
      } catch (e) {}
    }
    if (!loaded) {
      document.getElementById('loading').innerHTML =
        '<div class="card"><h2>Error</h2><p>Could not load stimuli.json</p></div>';
      return;
    }
    responses.metadata.start_time = new Date().toISOString();
    responses.metadata.language = I18N.getLang();
    applyTranslations();
    setupEventListeners();
    showPage('consent');
  }

  // ============================================================
  // Navigation
  // ============================================================
  function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const page = document.getElementById(pageId);
    if (page) page.classList.add('active');
    currentPage = pageId;
    updateProgress();
    window.scrollTo(0, 0);
  }

  function updateProgress() {
    if (!stimuli) return;
    const total = 2 + stimuli.part1_trials.length + 1; // consent + demo + trials + debrief
    let step = 0;
    if (currentPage === 'consent') step = 0;
    else if (currentPage === 'demographics') step = 1;
    else if (currentPage === 'part1-intro') step = 2;
    else if (currentPage === 'trial') step = 2 + currentTrialIdx;
    else if (currentPage === 'debrief') step = total - 1;
    else if (currentPage === 'complete') step = total;
    const pct = Math.round((step / total) * 100);
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = `${pct}% ${t('complete')}`;
  }

  // ============================================================
  // Event Listeners
  // ============================================================
  function setupEventListeners() {
    document.getElementById('lang-toggle').addEventListener('click', () => {
      I18N.setLang(I18N.getLang() === 'en' ? 'zh' : 'en');
      applyTranslations();
    });
    document.getElementById('consent-agree').addEventListener('click', () => {
      if (!document.getElementById('consent-checkbox').checked) {
        alert(t('consent_check_alert')); return;
      }
      responses.consent = true;
      showPage('demographics');
    });
    document.getElementById('demo-next').addEventListener('click', () => {
      if (!collectDemographics()) return;
      showPage('part1-intro');
    });
    document.getElementById('part1-start').addEventListener('click', () => {
      currentPart = 1; currentTrialIdx = 0; showPart1Trial();
    });
    document.getElementById('debrief-submit').addEventListener('click', () => {
      collectDebrief(); finishSurvey();
    });
    // Radio visual feedback
    document.querySelectorAll('.radio-group input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const group = radio.closest('.radio-group');
        group.querySelectorAll('label').forEach(l => l.classList.remove('checked'));
        radio.closest('label').classList.add('checked');
      });
    });
  }

  function collectDemographics() {
    const age = document.getElementById('demo-age').value;
    const gender = document.getElementById('demo-gender').value;
    const vrExp = document.querySelector('input[name="vr-experience"]:checked');
    const ghostFam = document.querySelector('input[name="ghost-familiarity"]:checked');
    if (!age || !gender || !vrExp || !ghostFam) { alert(t('demo_alert')); return false; }
    responses.demographics = { age, gender, vr_experience: vrExp.value, ghost_familiarity: ghostFam.value };
    return true;
  }

  // ============================================================
  // Part 1: Haptic Annotation (Sliders)
  // ============================================================
  function buildSliderHTML() {
    return SLIDERS.map(s => {
      const label = t('slider_' + s.id);
      const low = t('slider_' + s.id + '_low') || '';
      const high = t('slider_' + s.id + '_high') || '';
      return `
        <div class="custom-slider-row">
          <span class="custom-label">${label}</span>
          ${low ? `<span class="custom-range-label">${low}</span>` : ''}
          <input type="range" min="${s.min}" max="${s.max}" value="${s.def}" step="${s.step}"
                 id="slider-${s.id}" class="custom-slider" data-key="${s.key}">
          ${high ? `<span class="custom-range-label">${high}</span>` : ''}
          <span class="custom-val" id="val-${s.id}">${s.fmt(s.def)}</span>
        </div>`;
    }).join('');
  }

  function attachSliderListeners() {
    SLIDERS.forEach(s => {
      const slider = document.getElementById('slider-' + s.id);
      const valEl = document.getElementById('val-' + s.id);
      if (slider && valEl) {
        slider.addEventListener('input', () => { valEl.textContent = s.fmt(slider.value); });
      }
    });
  }

  function collectSliderValues() {
    const profile = {};
    SLIDERS.forEach(s => {
      const slider = document.getElementById('slider-' + s.id);
      if (slider) profile[s.key] = Number(slider.value);
    });
    // Normalize roughness to 0-1 for consistency
    if (profile.roughness !== undefined) profile.roughness = profile.roughness / 100;
    return profile;
  }

  function restoreSliderValues(profile) {
    if (!profile) return;
    SLIDERS.forEach(s => {
      const slider = document.getElementById('slider-' + s.id);
      const valEl = document.getElementById('val-' + s.id);
      let val = profile[s.key];
      if (s.key === 'roughness' && val !== undefined) val = Math.round(val * 100);
      if (slider && val !== undefined) {
        slider.value = val;
        if (valEl) valEl.textContent = s.fmt(val);
      }
    });
  }

  function showPart1Trial() {
    if (currentTrialIdx >= stimuli.part1_trials.length) {
      showPage('debrief');
      return;
    }
    const trial = stimuli.part1_trials[currentTrialIdx];
    const trialPage = document.getElementById('trial');
    HapticVisualizer.stopAnimation();

    const trialNum = I18N.getLang() === 'zh'
      ? `${t('part1_trial')} ${currentTrialIdx + 1} ${t('part1_of')} ${stimuli.part1_trials.length} 题`
      : `${t('part1_trial')} ${currentTrialIdx + 1} ${t('part1_of')} ${stimuli.part1_trials.length}`;

    trialPage.innerHTML = `
      <div class="trial-header">
        <span class="part-label">${t('part1_label')}</span>
        <div class="trial-count">${trialNum}</div>
      </div>
      <div class="excerpt-card">
        <div class="label">${t('part1_excerpt_label')}</div>
        <div class="text">"${trial.excerpt}"</div>
        ${I18N.getLang() === 'zh' && trial.excerpt_zh ? '<div class="text-zh">' + trial.excerpt_zh + '</div>' : ''}
      </div>
      <div class="trial-instruction">${t('part1_instruction')}</div>
      <div class="annotation-area">
        <div class="annotation-preview" id="live-preview"></div>
        <div class="annotation-panel">
          ${buildSliderHTML()}
          <div class="annotation-text-group">
            <label class="annotation-text-label" for="annotation-note">${t('annotation_note_label')}</label>
            <textarea id="annotation-note" class="annotation-note" placeholder="${t('annotation_note_ph')}" rows="3"></textarea>
          </div>
        </div>
      </div>
      <div class="btn-group">
        ${currentTrialIdx > 0 ? `<button class="btn btn-secondary" id="part1-back">${t('btn_back')}</button>` : ''}
        <button class="btn btn-primary" id="part1-next">${t('btn_next')}</button>
      </div>
    `;

    attachSliderListeners();

    // Live preview card — updates in real time as sliders move
    const liveProfile = collectSliderValues();
    const previewEl = document.getElementById('live-preview');
    const previewCard = HapticVisualizer.createProfileCard('', liveProfile, null);
    previewCard.style.cursor = 'default';
    previewEl.appendChild(previewCard);
    HapticVisualizer.startAnimation();

    const paramsEl = previewCard.querySelector('.profile-params');
    function updatePreview() {
      const vals = collectSliderValues();
      Object.keys(vals).forEach(k => { liveProfile[k] = vals[k]; });
      HapticVisualizer.renderProfileParams(paramsEl, liveProfile);
    }
    SLIDERS.forEach(s => {
      const slider = document.getElementById('slider-' + s.id);
      if (slider) slider.addEventListener('input', updatePreview);
    });

    // Restore previous answer if going back
    const prev = responses.part1[currentTrialIdx];
    if (prev) {
      restoreSliderValues(prev.profile);
      updatePreview();
      const noteEl = document.getElementById('annotation-note');
      if (noteEl && prev.note) noteEl.value = prev.note;
    }

    trialStartTime = performance.now();

    const backBtn = document.getElementById('part1-back');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        // Save current state before going back
        savePart1Response(trial);
        currentTrialIdx--;
        showPart1Trial();
      });
    }

    document.getElementById('part1-next').addEventListener('click', () => {
      savePart1Response(trial);
      currentTrialIdx++;
      showPart1Trial();
    });

    showPage('trial');
  }

  function savePart1Response(trial) {
    const rt = Math.round(performance.now() - trialStartTime);
    const noteEl = document.getElementById('annotation-note');
    const entry = {
      trial_id: trial.trial_id,
      target_family: trial.target_family,
      target_family_name: trial.target_family_name,
      profile: collectSliderValues(),
      note: noteEl ? noteEl.value.trim() : '',
      rt_ms: rt,
    };
    // Update or insert
    if (responses.part1[currentTrialIdx]) {
      responses.part1[currentTrialIdx] = entry;
    } else {
      responses.part1.push(entry);
    }
  }

  // ============================================================
  // Debrief
  // ============================================================
  function collectDebrief() {
    responses.debrief = {
      strategy: (document.getElementById('debrief-strategy') || {}).value || '',
      difficulty: (document.getElementById('debrief-difficulty') || {}).value || '',
      comments: (document.getElementById('debrief-comments') || {}).value || '',
    };
  }

  // ============================================================
  // Finish
  // ============================================================
  async function finishSurvey() {
    responses.metadata.end_time = new Date().toISOString();
    responses.metadata.language = I18N.getLang();

    const code = 'GT' + Math.random().toString(36).substring(2, 8).toUpperCase();
    responses.metadata.completion_code = code;

    try { localStorage.setItem('ghost_touch_' + Date.now(), JSON.stringify(responses)); } catch (e) {}

    const completePage = document.getElementById('complete');
    completePage.innerHTML = `
      <div class="completion">
        <h2>${t('submitting')}</h2>
        <div class="spinner" style="margin:24px auto"></div>
        <p>${t('submitting_wait')}</p>
      </div>`;
    showPage('complete');
    HapticVisualizer.stopAnimation();

    let durationS = null;
    if (responses.metadata.start_time && responses.metadata.end_time) {
      durationS = Math.round((new Date(responses.metadata.end_time) - new Date(responses.metadata.start_time)) / 1000);
    }
    const demo = responses.demographics || {};

    const row = {
      prolific_pid: PROLIFIC_PID || null,
      study_id: STUDY_ID || null,
      session_id: SESSION_ID || null,
      language: I18N.getLang(),
      age: demo.age || null,
      gender: demo.gender || null,
      vr_experience: demo.vr_experience || null,
      ghost_familiarity: demo.ghost_familiarity || null,
      part1_accuracy: null,
      part2_pipeline_rank: null,
      completion_code: code,
      duration_s: durationS,
      raw_json: responses,
    };

    let submitted = false;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const resp = await fetch(`${SUPABASE_URL}/rest/v1/responses`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
          },
          body: JSON.stringify(row),
        });
        if (resp.ok) { submitted = true; break; }
      } catch (err) {
        console.warn(`Submit attempt ${attempt + 1} failed:`, err);
        if (attempt < 2) await new Promise(r => setTimeout(r, 1000 * (attempt + 1)));
      }
    }

    if (PROLIFIC_PID) {
      completePage.innerHTML = `
        <div class="completion">
          <h2>${t('thankyou')}</h2>
          <p>${submitted ? t('responses_recorded') : '<span style="color:#ef4444">' + t('responses_failed') + '</span>'}</p>
          <p style="margin-top:24px">${t('redirecting')}</p>
          <p class="muted">${t('redirect_manual')} <a href="${PROLIFIC_REDIRECT_BASE}${code}">${t('redirect_click')}</a>.</p>
        </div>`;
      setTimeout(() => { window.location.href = PROLIFIC_REDIRECT_BASE + code; }, 3000);
    } else {
      completePage.innerHTML = `
        <div class="completion">
          <h2>${t('thankyou')}</h2>
          <p>${submitted ? t('responses_recorded') : t('responses_failed')}</p>
          <p class="muted" style="margin-top:16px">${t('completion_note')}</p>
        </div>`;
    }
  }

  // ============================================================
  document.addEventListener('DOMContentLoaded', init);
})();
