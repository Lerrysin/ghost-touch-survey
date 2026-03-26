/**
 * Ghost Touch User Evaluation Survey
 * Main application logic — Prolific-ready, Bilingual (EN/ZH)
 */

(function () {
  'use strict';

  // ============================================================
  // Configuration
  // ============================================================
  const SUPABASE_URL = 'https://sbadhyaildhfmohooomj.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNiYWRoeWFpbGRoZm1vaG9vb21qIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ1NDQxMDgsImV4cCI6MjA5MDEyMDEwOH0.jWCHY3U0sybqw89be94x26AG3XrtHLKGuzHRRSOs8_o';
  const PROLIFIC_REDIRECT_BASE = 'https://app.prolific.com/submissions/complete?cc=';

  // Prolific URL Parameters
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
    part1: [],
    part2: [],
    debrief: {},
    metadata: {
      start_time: null,
      end_time: null,
      user_agent: navigator.userAgent,
      screen_width: screen.width,
      screen_height: screen.height,
      prolific_pid: PROLIFIC_PID,
      study_id: STUDY_ID,
      session_id: SESSION_ID,
    },
  };

  let trialStartTime = 0;
  const t = I18N.t;

  // ============================================================
  // i18n: Apply translations to static elements
  // ============================================================
  function applyTranslations() {
    const s = (id, key) => { const el = document.getElementById(id); if (el) el.innerHTML = t(key); };
    const st = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };

    // Header
    st('h-title', 'title');
    st('h-subtitle', 'subtitle');

    // Lang toggle
    st('lang-toggle', 'lang_switch');

    // Consent
    st('c-title', 'consent_title');
    st('c-purpose-title', 'consent_purpose_title');
    st('c-purpose', 'consent_purpose');
    st('c-whatyoudo-title', 'consent_whatyoudo_title');
    s('c-part1', 'consent_part1');
    s('c-part2', 'consent_part2');
    s('c-part3', 'consent_part3');
    st('c-haptic-title', 'consent_haptic_title');
    s('c-haptic', 'consent_haptic');
    st('c-risks-title', 'consent_risks_title');
    st('c-risks', 'consent_risks');
    st('c-data-title', 'consent_data_title');
    st('c-data', 'consent_data');
    st('c-rights-title', 'consent_rights_title');
    st('c-rights', 'consent_rights');
    st('c-agree', 'consent_agree');
    st('consent-agree', 'btn_continue');

    // Demographics
    st('d-title', 'demo_title');
    st('d-age-label', 'demo_age');
    st('d-age-select', 'demo_age_select');
    st('d-gender-label', 'demo_gender');
    st('d-gender-select', 'demo_gender_select');
    st('d-gender-f', 'demo_gender_female');
    st('d-gender-m', 'demo_gender_male');
    st('d-gender-nb', 'demo_gender_nb');
    st('d-gender-pnts', 'demo_gender_pnts');
    st('d-vr-label', 'demo_vr');
    st('d-vr-never', 'demo_vr_never');
    st('d-vr-occ', 'demo_vr_occasionally');
    st('d-vr-reg', 'demo_vr_regularly');
    st('d-ghost-label', 'demo_ghost');
    st('d-ghost-not', 'demo_ghost_not');
    st('d-ghost-some', 'demo_ghost_somewhat');
    st('d-ghost-very', 'demo_ghost_very');
    st('demo-next', 'btn_continue');

    // Part 1 intro
    st('p1-title', 'part1_title');
    s('p1-desc', 'part1_desc');
    s('p1-wave', 'part1_param_wave');
    s('p1-amp', 'part1_param_amp');
    s('p1-thermal', 'part1_param_thermal');
    s('p1-rough', 'part1_param_rough');
    s('p1-onset', 'part1_param_onset');
    s('p1-dur', 'part1_param_dur');
    s('p1-task', 'part1_task');
    st('part1-start', 'btn_start_part1');

    // Part 2 intro
    st('p2-title', 'part2_title');
    s('p2-desc', 'part2_desc');
    s('p2-task', 'part2_task');
    st('p2-how', 'part2_how');
    st('part2-start', 'btn_start_part2');

    // Debrief
    st('db-title', 'debrief_title');
    st('db-strategy-label', 'debrief_strategy');
    st('db-comments-label', 'debrief_comments');
    const strat = document.getElementById('debrief-strategy');
    if (strat) strat.placeholder = t('debrief_strategy_ph');
    const comm = document.getElementById('debrief-comments');
    if (comm) comm.placeholder = t('debrief_comments_ph');
    st('debrief-submit', 'btn_submit');

    // Update HTML lang
    document.documentElement.lang = I18N.getLang() === 'zh' ? 'zh-CN' : 'en';
  }

  // ============================================================
  // Initialization
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
      } catch (e) { /* try next */ }
    }
    if (!loaded) {
      document.getElementById('loading').innerHTML =
        '<div class="card"><h2>Error / 错误</h2>' +
        '<p>Could not load stimuli.json / 无法加载数据文件</p></div>';
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
    const totalSteps = 2 + stimuli.part1_trials.length + stimuli.part2_trials.length + 1;
    let currentStep = 0;

    if (currentPage === 'consent') currentStep = 0;
    else if (currentPage === 'demographics') currentStep = 1;
    else if (currentPage === 'part1-intro') currentStep = 2;
    else if (currentPage === 'trial') {
      if (currentPart === 2) currentStep = 2 + currentTrialIdx;
      else if (currentPart === 3) currentStep = 2 + stimuli.part1_trials.length + currentTrialIdx;
    }
    else if (currentPage === 'part2-intro') currentStep = 2 + stimuli.part1_trials.length;
    else if (currentPage === 'debrief') currentStep = totalSteps - 1;
    else if (currentPage === 'complete') currentStep = totalSteps;

    const pct = Math.round((currentStep / totalSteps) * 100);
    const bar = document.getElementById('progress-bar');
    const text = document.getElementById('progress-text');
    if (bar) bar.style.width = pct + '%';
    if (text) text.textContent = `${pct}% ${t('complete')}`;
  }

  // ============================================================
  // Event listeners
  // ============================================================
  function setupEventListeners() {
    // Language toggle
    document.getElementById('lang-toggle').addEventListener('click', () => {
      const newLang = I18N.getLang() === 'en' ? 'zh' : 'en';
      I18N.setLang(newLang);
      applyTranslations();
    });

    // Consent
    document.getElementById('consent-agree').addEventListener('click', () => {
      const cb = document.getElementById('consent-checkbox');
      if (!cb.checked) {
        alert(t('consent_check_alert'));
        return;
      }
      responses.consent = true;
      showPage('demographics');
    });

    // Demographics
    document.getElementById('demo-next').addEventListener('click', () => {
      if (!collectDemographics()) return;
      showPage('part1-intro');
    });

    // Part 1 intro
    document.getElementById('part1-start').addEventListener('click', () => {
      currentPart = 2;
      currentTrialIdx = 0;
      showPart1Trial();
    });

    // Part 2 intro
    document.getElementById('part2-start').addEventListener('click', () => {
      currentPart = 3;
      currentTrialIdx = 0;
      showPart2Trial();
    });

    // Debrief
    document.getElementById('debrief-submit').addEventListener('click', () => {
      collectDebrief();
      finishSurvey();
    });

    // Radio button visual feedback (for browsers without :has() support)
    document.querySelectorAll('.radio-group input[type="radio"]').forEach(radio => {
      radio.addEventListener('change', () => {
        const group = radio.closest('.radio-group');
        group.querySelectorAll('label').forEach(l => l.classList.remove('checked'));
        radio.closest('label').classList.add('checked');
      });
    });
  }

  // ============================================================
  // Demographics
  // ============================================================
  function collectDemographics() {
    const age = document.getElementById('demo-age').value;
    const gender = document.getElementById('demo-gender').value;
    const vrExp = document.querySelector('input[name="vr-experience"]:checked');
    const ghostFam = document.querySelector('input[name="ghost-familiarity"]:checked');

    if (!age || !gender || !vrExp || !ghostFam) {
      alert(t('demo_alert'));
      return false;
    }

    responses.demographics = {
      age, gender,
      vr_experience: vrExp.value,
      ghost_familiarity: ghostFam.value,
    };
    return true;
  }

  // ============================================================
  // Part 1: 3AFC Semantic Alignment
  // ============================================================
  function showPart1Trial() {
    if (currentTrialIdx >= stimuli.part1_trials.length) {
      showPage('part2-intro');
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
      <div class="profile-cards" id="part1-cards"></div>
      <div class="none-match-container">
        <button class="none-match-btn" id="none-match-btn">&#x2717; ${t('none_match')}</button>
        <div id="none-match-panel" style="display:none">
          <div class="custom-profile-builder" id="custom-builder">
            <p class="custom-title">${t('custom_title')}</p>
            <div class="custom-slider-row">
              <span class="custom-label">${t('custom_amp')}</span>
              <input type="range" min="0" max="100" value="50" id="custom-amp" class="custom-slider">
              <span class="custom-val" id="custom-amp-val">50%</span>
            </div>
            <div class="custom-slider-row">
              <span class="custom-label">${t('custom_freq')}</span>
              <input type="range" min="20" max="300" value="150" id="custom-freq" class="custom-slider">
              <span class="custom-val" id="custom-freq-val">150Hz</span>
            </div>
            <div class="custom-slider-row">
              <span class="custom-label">${t('custom_thermal')}</span>
              <span class="custom-range-label">${t('custom_thermal_cold')}</span>
              <input type="range" min="-5" max="5" value="0" step="0.5" id="custom-thermal" class="custom-slider">
              <span class="custom-range-label">${t('custom_thermal_hot')}</span>
              <span class="custom-val" id="custom-thermal-val">0°C</span>
            </div>
            <div class="custom-slider-row">
              <span class="custom-label">${t('custom_rough')}</span>
              <span class="custom-range-label">${t('custom_rough_smooth')}</span>
              <input type="range" min="0" max="100" value="30" id="custom-rough" class="custom-slider">
              <span class="custom-range-label">${t('custom_rough_rough')}</span>
              <span class="custom-val" id="custom-rough-val">30</span>
            </div>
            <div class="custom-slider-row">
              <span class="custom-label">${t('custom_onset')}</span>
              <span class="custom-range-label">${t('custom_onset_slow')}</span>
              <input type="range" min="50" max="2000" value="500" id="custom-onset" class="custom-slider">
              <span class="custom-range-label">${t('custom_onset_fast')}</span>
              <span class="custom-val" id="custom-onset-val">500ms</span>
            </div>
            <div class="custom-slider-row">
              <span class="custom-label">${t('custom_dur')}</span>
              <span class="custom-range-label">${t('custom_dur_short')}</span>
              <input type="range" min="200" max="6000" value="2000" id="custom-dur" class="custom-slider">
              <span class="custom-range-label">${t('custom_dur_long')}</span>
              <span class="custom-val" id="custom-dur-val">2000ms</span>
            </div>
          </div>
          <input type="text" id="none-match-input" placeholder="${t('none_match_reason_ph')}"
            style="margin-top:8px;padding:10px 12px;border:1px solid var(--border);border-radius:8px;width:100%;max-width:500px;font-size:0.9rem;font-family:inherit">
        </div>
      </div>
      <div class="btn-group">
        <button class="btn btn-primary" id="part1-next" disabled>${t('btn_next')}</button>
      </div>
    `;

    const cardsContainer = document.getElementById('part1-cards');
    let selectedLabel = null;
    let noneSelected = false;

    trial.options.forEach(opt => {
      const card = HapticVisualizer.createProfileCard(opt.label, opt.profile, (label, cardEl) => {
        cardsContainer.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
        cardEl.classList.add('selected');
        selectedLabel = label;
        noneSelected = false;
        document.getElementById('none-match-btn').classList.remove('active');
        document.getElementById('none-match-reason').style.display = 'none';
        document.getElementById('part1-next').disabled = false;
      });
      cardsContainer.appendChild(card);
    });

    // "None match" button
    document.getElementById('none-match-btn').addEventListener('click', () => {
      cardsContainer.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
      selectedLabel = '__none__';
      noneSelected = true;
      document.getElementById('none-match-btn').classList.add('active');
      document.getElementById('none-match-panel').style.display = 'block';
      document.getElementById('part1-next').disabled = false;
    });

    // Custom slider value display
    const sliderMap = [
      ['custom-amp', 'custom-amp-val', v => v + '%'],
      ['custom-freq', 'custom-freq-val', v => v + 'Hz'],
      ['custom-thermal', 'custom-thermal-val', v => (v >= 0 ? '+' : '') + v + '°C'],
      ['custom-rough', 'custom-rough-val', v => v],
      ['custom-onset', 'custom-onset-val', v => v + 'ms'],
      ['custom-dur', 'custom-dur-val', v => v + 'ms'],
    ];
    // Attach listeners after DOM is built (they may not exist if none-match not clicked yet)
    setTimeout(() => {
      sliderMap.forEach(([sliderId, valId, fmt]) => {
        const slider = document.getElementById(sliderId);
        const valEl = document.getElementById(valId);
        if (slider && valEl) {
          slider.addEventListener('input', () => { valEl.textContent = fmt(slider.value); });
        }
      });
    }, 0);

    HapticVisualizer.startAnimation();
    trialStartTime = performance.now();

    document.getElementById('part1-next').addEventListener('click', () => {
      if (!selectedLabel) return;
      const rt = Math.round(performance.now() - trialStartTime);
      const noneReason = noneSelected ? (document.getElementById('none-match-input').value || '') : '';

      // Collect custom profile if "none match" was selected
      let customProfile = null;
      if (noneSelected) {
        const gv = id => { const el = document.getElementById(id); return el ? Number(el.value) : null; };
        customProfile = {
          amplitude_pct: gv('custom-amp'),
          frequency_hz: gv('custom-freq'),
          thermal_delta_c: gv('custom-thermal'),
          roughness: gv('custom-rough') / 100,
          onset_ms: gv('custom-onset'),
          duration_ms: gv('custom-dur'),
        };
      }

      responses.part1.push({
        trial_id: trial.trial_id,
        target_family: trial.target_family,
        target_family_name: trial.target_family_name,
        selected_label: selectedLabel,
        correct_label: trial.correct_label,
        correct: selectedLabel === trial.correct_label,
        none_selected: noneSelected,
        none_reason: noneReason,
        custom_profile: customProfile,
        rt_ms: rt,
      });

      currentTrialIdx++;
      showPart1Trial();
    });

    showPage('trial');
  }

  // ============================================================
  // Part 2: Baseline Comparison (Preference Ranking)
  // ============================================================
  function showPart2Trial() {
    if (currentTrialIdx >= stimuli.part2_trials.length) {
      showPage('debrief');
      return;
    }

    const trial = stimuli.part2_trials[currentTrialIdx];
    const trialPage = document.getElementById('trial');
    HapticVisualizer.stopAnimation();

    const trialNum = I18N.getLang() === 'zh'
      ? `${t('part1_trial')} ${currentTrialIdx + 1} ${t('part1_of')} ${stimuli.part2_trials.length} 题`
      : `${t('part1_trial')} ${currentTrialIdx + 1} ${t('part1_of')} ${stimuli.part2_trials.length}`;

    trialPage.innerHTML = `
      <div class="trial-header">
        <span class="part-label">${t('part2_label')}</span>
        <div class="trial-count">${trialNum}</div>
      </div>
      <div class="excerpt-card">
        <div class="label">${t('part1_excerpt_label')}</div>
        <div class="text">"${trial.excerpt}"</div>
        ${I18N.getLang() === 'zh' && trial.excerpt_zh ? '<div class="text-zh">' + trial.excerpt_zh + '</div>' : ''}
      </div>
      <div class="trial-instruction">${t('part2_instruction')}</div>
      <div class="rank-buttons" id="rank-buttons">
        <span class="rank-hint">${t('rank_assign')}</span>
        <button class="rank-btn" data-rank="1">${t('rank_1')}</button>
        <button class="rank-btn" data-rank="2">${t('rank_2')}</button>
        <button class="rank-btn" data-rank="3">${t('rank_3')}</button>
      </div>
      <div class="profile-cards" id="part2-cards"></div>
      <div class="btn-group">
        <button class="btn btn-primary" id="part2-next" disabled>${t('btn_next')}</button>
      </div>
    `;

    const cardsContainer = document.getElementById('part2-cards');
    let selectedCard = null;
    const rankings = {};

    trial.conditions.forEach(cond => {
      const card = HapticVisualizer.createProfileCard(cond.label, cond.profile, (label, cardEl) => {
        cardsContainer.querySelectorAll('.profile-card').forEach(c => c.classList.remove('selected'));
        cardEl.classList.add('selected');
        selectedCard = label;
      });
      cardsContainer.appendChild(card);
    });

    HapticVisualizer.startAnimation();
    trialStartTime = performance.now();

    document.querySelectorAll('#rank-buttons .rank-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        if (!selectedCard) {
          alert(t('rank_alert'));
          return;
        }
        const rank = parseInt(btn.dataset.rank);
        Object.keys(rankings).forEach(k => { if (rankings[k] === rank) delete rankings[k]; });
        rankings[selectedCard] = rank;
        updateRankBadges(cardsContainer, rankings);
        if (Object.keys(rankings).length === 3) {
          document.getElementById('part2-next').disabled = false;
        }
      });
    });

    document.getElementById('part2-next').addEventListener('click', () => {
      if (Object.keys(rankings).length < 3) return;
      const rt = Math.round(performance.now() - trialStartTime);
      const conditionMap = {};
      trial.conditions.forEach(c => { conditionMap[c.label] = c.condition; });

      responses.part2.push({
        trial_id: trial.trial_id,
        target_family: trial.target_family,
        target_family_name: trial.target_family_name,
        rankings: { ...rankings },
        condition_map: conditionMap,
        rt_ms: rt,
      });

      currentTrialIdx++;
      showPart2Trial();
    });

    showPage('trial');
  }

  function updateRankBadges(container, rankings) {
    container.querySelectorAll('.rank-badge').forEach(badge => {
      badge.classList.remove('active', 'rank-1', 'rank-2', 'rank-3');
      badge.textContent = '';
    });
    Object.entries(rankings).forEach(([label, rank]) => {
      const badge = container.querySelector(`[data-rank-badge="${label}"]`);
      if (badge) {
        badge.classList.add('active', `rank-${rank}`);
        badge.textContent = rank;
      }
    });
  }

  // ============================================================
  // Debrief
  // ============================================================
  function collectDebrief() {
    responses.debrief = {
      strategy: (document.getElementById('debrief-strategy') || {}).value || '',
      comments: (document.getElementById('debrief-comments') || {}).value || '',
    };
  }

  // ============================================================
  // Finish
  // ============================================================
  async function finishSurvey() {
    responses.metadata.end_time = new Date().toISOString();
    responses.metadata.language = I18N.getLang();

    const part1Correct = responses.part1.filter(r => r.correct).length;
    const part1Total = responses.part1.length;
    const accuracy = (part1Correct / part1Total * 100).toFixed(1);

    const code = 'GT' + Math.random().toString(36).substring(2, 8).toUpperCase();
    responses.metadata.completion_code = code;

    try { localStorage.setItem('ghost_touch_' + Date.now(), JSON.stringify(responses)); } catch (e) {}

    const completePage = document.getElementById('complete');
    completePage.innerHTML = `
      <div class="completion">
        <h2>${t('submitting')}</h2>
        <div class="spinner" style="margin:24px auto"></div>
        <p>${t('submitting_wait')}</p>
      </div>
    `;
    showPage('complete');
    HapticVisualizer.stopAnimation();

    // Submit to Supabase
    let submitted = false;
    const part1Acc = part1Total > 0 ? (part1Correct / part1Total) : null;
    // Compute pipeline mean rank
    let pipelineRank = null;
    if (responses.part2.length > 0) {
      const ranks = responses.part2.map(trial => {
        for (const [label, cond] of Object.entries(trial.condition_map || {})) {
          if (cond === 'pipeline') return trial.rankings[label] || null;
        }
        return null;
      }).filter(r => r !== null);
      if (ranks.length > 0) pipelineRank = ranks.reduce((a, b) => a + b, 0) / ranks.length;
    }
    // Duration
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
      part1_accuracy: part1Acc,
      part2_pipeline_rank: pipelineRank,
      completion_code: code,
      duration_s: durationS,
      raw_json: responses,
    };

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
          <p>${t('accuracy_label')} <strong>${accuracy}%</strong> (${part1Correct}/${part1Total})</p>
          <p style="margin-top:24px">${t('redirecting')}</p>
          <p class="muted">${t('redirect_manual')} <a href="${PROLIFIC_REDIRECT_BASE}${code}">${t('redirect_click')}</a>.</p>
        </div>
      `;
      setTimeout(() => { window.location.href = PROLIFIC_REDIRECT_BASE + code; }, 3000);
    } else {
      completePage.innerHTML = `
        <div class="completion">
          <h2>${t('thankyou')}</h2>
          <p>${submitted ? t('responses_recorded') : t('responses_local')}</p>
          <p>${t('accuracy_label')} <strong>${accuracy}%</strong> (${part1Correct}/${part1Total})</p>
          <div style="margin:24px 0">
            <p><strong>${t('completion_code')}</strong></p>
            <div class="completion-code">${code}</div>
          </div>
          <p><button class="btn btn-primary" id="download-data">${t('btn_download')}</button></p>
        </div>
      `;
      document.getElementById('download-data').addEventListener('click', downloadData);
    }
  }

  function downloadData() {
    const blob = new Blob([JSON.stringify(responses, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ghost_touch_response_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ============================================================
  // Boot
  // ============================================================
  document.addEventListener('DOMContentLoaded', init);
})();
