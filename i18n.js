/**
 * Ghost Touch Survey — Internationalization (EN/ZH)
 */
const I18N = (() => {
  let currentLang = 'en';

  const translations = {
    en: {
      // Header
      title: 'Ghost Touch: Haptic Profile Evaluation',
      subtitle: 'How should ghost-touch sensations feel? Help us find out.',

      // Progress
      complete: 'complete',

      // Consent
      consent_title: 'Informed Consent',
      consent_purpose_title: 'Purpose',
      consent_purpose: 'This study investigates how people imagine ghost-touch sensations as physical touch. You will read descriptions of supernatural tactile experiences and tell us what haptic (touch) parameters you think best represent them.',
      consent_whatyoudo_title: 'What You Will Do',
      consent_part1: '<strong>Part 1 — Design (~8 min):</strong> Read 10 ghost-touch descriptions. For each, use sliders to design a haptic profile that matches the described sensation.',
      consent_part2: '<strong>Part 2 — Rate (~5 min):</strong> Read the same 10 descriptions again. For each, rate how well 3 computer-generated haptic profiles match the description (1–7 scale).',
      consent_part3: '<strong>Brief demographics and feedback (~2 min).</strong>',
      consent_haptic_title: 'Haptic Profiles',
      consent_haptic: 'A haptic profile describes a touch sensation using parameters like vibration strength, temperature, roughness, and timing. You will see animated visual previews. You do <strong>not</strong> need any special hardware or experience — just use your intuition.',
      consent_risks_title: 'Risks & Benefits',
      consent_risks: 'No known risks beyond normal computer use. The study contributes to research on haptic design for virtual reality.',
      consent_data_title: 'Data & Privacy',
      consent_data: 'Your responses are anonymous. We collect no personally identifiable information. Anonymized data may be published in academic papers.',
      consent_rights_title: 'Your Rights',
      consent_rights: 'Participation is voluntary. You may withdraw at any time by closing the browser.',
      consent_agree: 'I have read and understood the above information. I am 18 years or older. I voluntarily agree to participate.',
      btn_continue: 'Continue',
      consent_check_alert: 'Please check the consent box to continue.',

      // Demographics
      demo_title: 'About You',
      demo_age: 'Age range',
      demo_age_select: 'Select...',
      demo_gender: 'Gender',
      demo_gender_select: 'Select...',
      demo_gender_female: 'Female',
      demo_gender_male: 'Male',
      demo_gender_nb: 'Non-binary / Third gender',
      demo_gender_pnts: 'Prefer not to say',
      demo_vr: 'VR / haptic device experience',
      demo_vr_never: 'Never used',
      demo_vr_occasionally: 'Occasionally',
      demo_vr_regularly: 'Regularly',
      demo_ghost: 'How familiar are you with ghost/supernatural media? (movies, games, books, shows)',
      demo_ghost_not: 'Not at all',
      demo_ghost_somewhat: 'Somewhat',
      demo_ghost_very: 'Very familiar',
      demo_alert: 'Please answer all demographic questions.',

      // Part 1: Annotation
      part1_title: 'Part 1: Design Your Haptic Profile',
      part1_desc: 'You will read <strong>10 ghost-touch descriptions</strong>. For each one, imagine you could actually feel this sensation — then use the sliders below to design a haptic profile that matches it.',
      part1_param_intro: 'The 4 parameters you can adjust:',
      part1_param_amp: '<strong>Vibration Strength:</strong> how intense the vibration is (0 = none, 100 = maximum)',
      part1_param_freq: '<strong>Vibration Speed:</strong> how fast the vibration pulses (20Hz = slow throb, 300Hz = high buzz)',
      part1_param_thermal: '<strong>Temperature:</strong> cold (−5°C) to hot (+5°C), 0 = neutral',
      part1_param_rough: '<strong>Roughness:</strong> smooth (0) to very rough/gritty (100)',
      part1_task: '<strong>Tip:</strong> There are no right or wrong answers. Trust your intuition — what would this description "feel like" as a physical touch? You can also describe your idea in the text box.',
      annotation_note_label: 'Describe what you imagine (optional)',
      annotation_note_ph: 'e.g., A cold, tingling pressure slowly creeping up the arm...',
      btn_start_part1: 'Start Part 1',
      part1_label: 'Part 1: Design',
      part1_trial: 'Trial',
      part1_of: 'of',
      part1_excerpt_label: 'Ghost-Touch Description',
      part1_instruction: 'Use the sliders to design a haptic profile that matches this sensation.',
      btn_back: 'Back',
      btn_next: 'Next',

      // Slider labels
      slider_amp: 'Vibration Strength',
      slider_amp_low: 'None',
      slider_amp_high: 'Max',
      slider_freq: 'Vibration Speed',
      slider_freq_low: 'Slow throb',
      slider_freq_high: 'High buzz',
      slider_thermal: 'Temperature',
      slider_thermal_cold: 'Cold',
      slider_thermal_hot: 'Hot',
      slider_rough: 'Roughness',
      slider_rough_smooth: 'Smooth',
      slider_rough_rough: 'Rough',
      slider_onset: 'Start Speed',
      slider_onset_slow: 'Gradual',
      slider_onset_fast: 'Instant',
      slider_dur: 'Duration',
      slider_dur_short: 'Flash',
      slider_dur_long: 'Lingering',

      // Part 2: Likert Rating
      part2_title: 'Part 2: Rate Haptic Profiles',
      part2_desc: 'Now you will see the same 10 descriptions again. For each, we show <strong>3 haptic profiles</strong> generated by different computer methods.',
      part2_task: '<strong>Your task:</strong> Rate how well each profile matches the description on a scale from 1 (very poor match) to 7 (excellent match).',
      part2_how: 'Look at each profile\'s waveform and parameters, then click a rating for each one.',
      btn_start_part2: 'Start Part 2',
      part2_label: 'Part 2: Rate',
      part2_instruction: 'How well does each profile match the described sensation? Rate 1–7.',
      likert_1: '1',
      likert_2: '2',
      likert_3: '3',
      likert_4: '4',
      likert_5: '5',
      likert_6: '6',
      likert_7: '7',
      likert_low: 'Very poor match',
      likert_high: 'Excellent match',

      // Params (visualizer)
      param_amplitude: 'Amplitude',
      param_thermal: 'Thermal',
      param_roughness: 'Roughness',
      param_onset: 'Onset',
      param_duration: 'Duration',

      // Debrief
      debrief_title: 'Final Questions',
      debrief_strategy: 'When designing your haptic profiles, which parameters did you find most important for capturing the sensation? Why?',
      debrief_strategy_ph: 'e.g., Temperature was key for cold descriptions; I focused on vibration strength for pressure...',
      debrief_difficulty: 'Which descriptions were hardest to translate into haptic parameters? Why?',
      debrief_difficulty_ph: 'e.g., The "absence/void" was difficult because it\'s about nothing being there...',
      debrief_comments: 'Any other comments or feedback? (optional)',
      debrief_comments_ph: 'Optional...',
      btn_submit: 'Submit',

      // Completion
      thankyou: 'Thank You!',
      responses_recorded: 'Your responses have been recorded successfully.',
      responses_failed: 'Note: We could not save your data to our server. Please contact the researcher.',
      completion_note: 'You may now close this page. Thank you for your contribution to haptic research!',
      submitting: 'Submitting your responses...',
      submitting_wait: 'Please wait while we save your data.',
      redirecting: 'Redirecting you back to Prolific...',
      redirect_manual: 'If you are not redirected automatically,',
      redirect_click: 'click here',

      // Language
      lang_switch: '中文',
    },

    zh: {
      title: 'Ghost Touch: 触觉配置评估',
      subtitle: '幽灵触感应该是什么样的触觉？帮助我们找出答案。',

      complete: '完成',

      consent_title: '知情同意',
      consent_purpose_title: '研究目的',
      consent_purpose: '本研究探究人们如何将幽灵触感想象为真实的物理触觉。您将阅读超自然触觉体验的描述，并告诉我们您认为什么触觉参数最能代表它们。',
      consent_whatyoudo_title: '您将做什么',
      consent_part1: '<strong>第一部分 — 设计（约8分钟）：</strong>阅读10段幽灵触感描述，每段使用滑块设计一个与描述匹配的触觉配置。',
      consent_part2: '<strong>第二部分 — 评分（约5分钟）：</strong>再次阅读相同的10段描述，对3个计算机生成的触觉配置评分（1-7分），判断它们与描述的匹配程度。',
      consent_part3: '<strong>简短的基本信息和反馈（约2分钟）。</strong>',
      consent_haptic_title: '触觉配置',
      consent_haptic: '触觉配置使用振动强度、温度、粗糙度和时间等参数来描述一种触觉。您将看到动态的可视化预览。您<strong>不需要</strong>任何特殊硬件或经验——凭直觉即可。',
      consent_risks_title: '风险与收益',
      consent_risks: '除正常使用电脑外，无已知风险。本研究有助于虚拟现实触觉设计的研究。',
      consent_data_title: '数据与隐私',
      consent_data: '您的回答是匿名的。我们不收集任何可识别个人身份的信息。匿名数据可能会发表在学术论文中。',
      consent_rights_title: '您的权利',
      consent_rights: '参与是自愿的。您可以随时关闭浏览器退出。',
      consent_agree: '我已阅读并理解以上信息。我已年满18周岁。我自愿同意参与。',
      btn_continue: '继续',
      consent_check_alert: '请勾选同意框以继续。',

      demo_title: '关于您',
      demo_age: '年龄范围',
      demo_age_select: '请选择...',
      demo_gender: '性别',
      demo_gender_select: '请选择...',
      demo_gender_female: '女',
      demo_gender_male: '男',
      demo_gender_nb: '非二元/第三性别',
      demo_gender_pnts: '不愿透露',
      demo_vr: 'VR / 触觉设备使用经验',
      demo_vr_never: '从未使用',
      demo_vr_occasionally: '偶尔使用',
      demo_vr_regularly: '经常使用',
      demo_ghost: '您对鬼怪/超自然媒体的熟悉程度？（电影、游戏、书籍、剧集）',
      demo_ghost_not: '完全不熟悉',
      demo_ghost_somewhat: '有些了解',
      demo_ghost_very: '非常熟悉',
      demo_alert: '请回答所有问题。',

      part1_title: '第一部分：设计您的触觉配置',
      part1_desc: '您将阅读 <strong>10段幽灵触感描述</strong>。对于每一段，想象您真的能感受到这种触觉——然后使用下方的滑块设计一个匹配的触觉配置。',
      part1_param_intro: '您可以调节的4个参数：',
      part1_param_amp: '<strong>振动强度：</strong>振动的强弱（0 = 无振动，100 = 最强）',
      part1_param_freq: '<strong>振动速度：</strong>振动脉冲的快慢（20Hz = 缓慢搏动，300Hz = 高频嗡鸣）',
      part1_param_thermal: '<strong>温度：</strong>冷（-5°C）到热（+5°C），0 = 中性',
      part1_param_rough: '<strong>粗糙度：</strong>光滑（0）到非常粗糙（100）',
      part1_task: '<strong>提示：</strong>没有对错之分。请相信您的直觉——这段描述如果变成真实的触觉，应该"摸起来"是什么感觉？您也可以在文本框中描述您的想法。',
      annotation_note_label: '描述您想象中的触感（可选）',
      annotation_note_ph: '例如：一种冰凉的、刺痛的压力慢慢沿手臂蔓延...',
      btn_start_part1: '开始第一部分',
      part1_label: '第一部分：设计',
      part1_trial: '第',
      part1_of: '题，共',
      part1_excerpt_label: '幽灵触感描述',
      part1_instruction: '使用滑块设计一个与这种触感匹配的触觉配置。',
      btn_back: '上一题',
      btn_next: '下一题',

      slider_amp: '振动强度',
      slider_amp_low: '无',
      slider_amp_high: '最强',
      slider_freq: '振动速度',
      slider_freq_low: '缓慢搏动',
      slider_freq_high: '高频嗡鸣',
      slider_thermal: '温度',
      slider_thermal_cold: '冷',
      slider_thermal_hot: '热',
      slider_rough: '粗糙度',
      slider_rough_smooth: '光滑',
      slider_rough_rough: '粗糙',
      slider_onset: '起始速度',
      slider_onset_slow: '渐进',
      slider_onset_fast: '瞬间',
      slider_dur: '持续时间',
      slider_dur_short: '一闪',
      slider_dur_long: '持久',

      part2_title: '第二部分：评价触觉配置',
      part2_desc: '现在您将再次看到相同的10段描述。每段描述下方有 <strong>3个触觉配置</strong>，由不同的计算机方法生成。',
      part2_task: '<strong>您的任务：</strong>对每个配置评分1-7分，表示它与描述的匹配程度（1 = 非常不匹配，7 = 非常匹配）。',
      part2_how: '查看每个配置的波形和参数，然后为每个配置点击一个评分。',
      btn_start_part2: '开始第二部分',
      part2_label: '第二部分：评分',
      part2_instruction: '每个配置与描述的匹配程度如何？请评分 1-7。',
      likert_1: '1',
      likert_2: '2',
      likert_3: '3',
      likert_4: '4',
      likert_5: '5',
      likert_6: '6',
      likert_7: '7',
      likert_low: '非常不匹配',
      likert_high: '非常匹配',

      param_amplitude: '振幅',
      param_thermal: '温度',
      param_roughness: '粗糙度',
      param_onset: '起始',
      param_duration: '时长',

      debrief_title: '最后几个问题',
      debrief_strategy: '在设计触觉配置时，您觉得哪些参数对于捕捉触感最重要？为什么？',
      debrief_strategy_ph: '例如：温度对于冷的描述最关键；对于压力描述我主要关注振动强度...',
      debrief_difficulty: '哪些描述最难转化为触觉参数？为什么？',
      debrief_difficulty_ph: '例如："虚无/空洞"很难，因为它描述的是什么都没有...',
      debrief_comments: '您对本问卷有其他意见或反馈吗？（可选）',
      debrief_comments_ph: '可选...',
      btn_submit: '提交',

      thankyou: '感谢参与！',
      responses_recorded: '您的回答已成功记录。',
      responses_failed: '提示：我们无法将数据保存到服务器，请联系研究人员。',
      completion_note: '您现在可以关闭此页面。感谢您对触觉研究的贡献！',
      submitting: '正在提交您的回答...',
      submitting_wait: '请稍候，正在保存数据。',
      redirecting: '正在将您重定向回 Prolific...',
      redirect_manual: '如果没有自动跳转，请',
      redirect_click: '点击这里',

      lang_switch: 'English',
    },
  };

  function t(key) {
    return (translations[currentLang] && translations[currentLang][key]) || translations.en[key] || key;
  }
  function setLang(lang) {
    currentLang = lang;
    try { localStorage.setItem('ghost_touch_lang', lang); } catch(e) {}
  }
  function getLang() { return currentLang; }
  function detectLang() {
    try {
      const saved = localStorage.getItem('ghost_touch_lang');
      if (saved && translations[saved]) { currentLang = saved; return; }
    } catch(e) {}
    if ((navigator.language || '').startsWith('zh')) currentLang = 'zh';
  }
  detectLang();

  return { t, setLang, getLang, translations };
})();
