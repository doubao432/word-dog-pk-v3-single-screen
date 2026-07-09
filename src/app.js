(function () {
  const data = window.WORD_DOG_DATA || { banks: [] };
  const chapters = window.WORD_DOG_CHAPTERS || [];
  const stages = window.WORD_DOG_STAGES || [];
  const PROGRESS_KEY = "word-dog-pk-v3-challenge-unlocked";
  const $ = (selector) => document.querySelector(selector);

  const els = {
    setupScreen: $("#setupScreen"),
    battleScreen: $("#battleScreen"),
    resultModal: $("#resultModal"),
    termTabs: $("#termTabs"),
    bankList: $("#bankList"),
    rangeCount: $("#rangeCount"),
    setupStatus: $("#setupStatus"),
    stagePanel: $("#stagePanel"),
    chapterTabs: $("#chapterTabs"),
    stageList: $("#stageList"),
    stageBrief: $("#stageBrief"),
    stageCount: $("#stageCount"),
    startBtn: $("#startBtn"),
    selectVisibleBtn: $("#selectVisibleBtn"),
    clearVisibleBtn: $("#clearVisibleBtn"),
    selectStarterBtn: $("#selectStarterBtn"),
    fullscreenBtn: $("#fullscreenBtn"),
    durationInput: $("#durationInput"),
    koInput: $("#koInput"),
    victoryDurationInput: $("#victoryDurationInput"),
    soundToggle: $("#soundToggle"),
    voiceToggle: $("#voiceToggle"),
    musicToggle: $("#musicToggle"),
    timerText: $("#timerText"),
    leftScore: $("#leftScore"),
    rightScore: $("#rightScore"),
    leftCorrect: $("#leftCorrect"),
    rightCorrect: $("#rightCorrect"),
    leftStreak: $("#leftStreak"),
    rightStreak: $("#rightStreak"),
    leftFeedback: $("#leftFeedback"),
    rightFeedback: $("#rightFeedback"),
    battleModeTag: $("#battleModeTag"),
    leftTeamLabel: $("#leftTeamLabel"),
    rightTeamLabel: $("#rightTeamLabel"),
    leftDogImg: $("#leftDogImg"),
    rightDogImg: $("#rightDogImg"),
    leftDogName: $("#leftDogName"),
    rightDogName: $("#rightDogName"),
    leftQuestionMode: $("#leftQuestionMode"),
    rightQuestionMode: $("#rightQuestionMode"),
    leftPrompt: $("#leftPrompt"),
    rightPrompt: $("#rightPrompt"),
    leftHint: $("#leftHint"),
    rightHint: $("#rightHint"),
    leftQuestionTitle: $("#leftQuestionTitle"),
    rightQuestionTitle: $("#rightQuestionTitle"),
    leftOptions: $("#leftOptions"),
    rightOptions: $("#rightOptions"),
    leftFill: $("#leftFill"),
    rightFill: $("#rightFill"),
    tugMarker: $("#tugMarker"),
    leftPercent: $("#leftPercent"),
    rightPercent: $("#rightPercent"),
    leftDogSide: $("#leftDogSide"),
    rightDogSide: $("#rightDogSide"),
    fxLayer: $("#fxLayer"),
    collectionPanel: $("#collectionPanel"),
    collectionCount: $("#collectionCount"),
    collectionMeter: $("#collectionMeter"),
    collectionSlots: $("#collectionSlots"),
    collectionGoal: $("#collectionGoal"),
    pauseBtn: $("#pauseBtn"),
    newRoundBtn: $("#newRoundBtn"),
    backSetupBtn: $("#backSetupBtn"),
    resultTitle: $("#resultTitle"),
    resultSummary: $("#resultSummary"),
    againBtn: $("#againBtn"),
    resultSetupBtn: $("#resultSetupBtn"),
    storyModal: $("#storyModal"),
    storyEyebrow: $("#storyEyebrow"),
    storyDogImg: $("#storyDogImg"),
    storyTitle: $("#storyTitle"),
    storyLines: $("#storyLines"),
    storyStartBtn: $("#storyStartBtn"),
    storyCancelBtn: $("#storyCancelBtn")
  };

  const state = {
    selectedTerm: "all",
    selectedBankIds: new Set(["g7a-u1", "g7a-u2", "g7b-u1", "g8a-u6"]),
    playKind: "versus",
    challengeChapterIndex: 0,
    challengeStageIndex: 0,
    unlockedStageIndex: loadUnlockedStageIndex(),
    challengeProgress: 0,
    enemyCooldown: 0,
    enemyAttacks: 0,
    resultWinner: null,
    resultReason: null,
    mode: "shared",
    duration: 45,
    ko: 100,
    victoryDuration: 2,
    phase: "setup",
    paused: false,
    timeLeft: 45,
    timerId: null,
    tug: 0,
    deck: [],
    sharedQuestion: null,
    laneQuestion: { left: null, right: null },
    locked: { left: false, right: false },
    players: {
      left: { score: 0, correct: 0, wrong: 0, streak: 0 },
      right: { score: 0, correct: 0, wrong: 0, streak: 0 }
    }
  };

  const sound = (() => {
    let ctx = null;
    let musicTimer = null;
    let barkTimer = null;
    let barkAudio = null;
    let bgmAudio = null;
    let beat = 0;

    function enabled() {
      return els.soundToggle.checked;
    }

    function ensure() {
      if (!enabled()) return null;
      if (navigator.userActivation && !navigator.userActivation.hasBeenActive) return null;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      if (!ctx) ctx = new AudioContextClass();
      if (ctx.state === "suspended") ctx.resume();
      return ctx;
    }

    function tone(freq, duration, type, gain) {
      const audio = ensure();
      if (!audio) return;
      const oscillator = audio.createOscillator();
      const volume = audio.createGain();
      oscillator.type = type || "sine";
      oscillator.frequency.value = freq;
      volume.gain.setValueAtTime(gain || .08, audio.currentTime);
      volume.gain.exponentialRampToValueAtTime(.001, audio.currentTime + duration);
      oscillator.connect(volume).connect(audio.destination);
      oscillator.start();
      oscillator.stop(audio.currentTime + duration);
    }

    function correct(side) {
      tone(side === "left" ? 520 : 620, .1, "triangle", .08);
      setTimeout(() => tone(side === "left" ? 760 : 820, .12, "triangle", .06), 70);
    }

    function wrong() {
      tone(160, .16, "sawtooth", .055);
    }

    function ko() {
      tone(220, .18, "square", .075);
      setTimeout(() => tone(440, .16, "triangle", .075), 120);
      setTimeout(() => tone(660, .24, "triangle", .065), 250);
    }

    function startVictoryBark(durationMs) {
      stopVictoryBark();
      if (!enabled()) return;
      if (!barkAudio) {
        barkAudio = new Audio("assets/audio/victory-dog-bark-cc0.mp3");
        barkAudio.loop = true;
        barkAudio.volume = .55;
      }
      barkAudio.currentTime = 0;
      barkAudio.play().catch(() => barkPattern(durationMs));
      barkTimer = window.setTimeout(stopVictoryBark, durationMs);
    }

    function stopVictoryBark() {
      if (barkTimer) window.clearTimeout(barkTimer);
      barkTimer = null;
      if (barkAudio) {
        barkAudio.pause();
        barkAudio.currentTime = 0;
      }
    }

    function barkPattern(durationMs) {
      const startedAt = performance.now();
      const run = () => {
        if (performance.now() - startedAt > durationMs) return;
        tone(145 + Math.random() * 45, .08, "sawtooth", .06);
        window.setTimeout(() => tone(95 + Math.random() * 35, .1, "square", .045), 50);
        window.setTimeout(run, 150 + Math.random() * 120);
      };
      run();
    }

    function startMusic() {
      stopMusic();
      if (!els.musicToggle.checked || !enabled()) return;
      if (!bgmAudio) {
        bgmAudio = new Audio("assets/audio/word-dog-bgm-gemini-loop.mp3");
        bgmAudio.loop = true;
        bgmAudio.volume = .28;
        bgmAudio.preload = "auto";
      }
      bgmAudio.currentTime = 0;
      const playPromise = bgmAudio.play();
      if (playPromise && typeof playPromise.catch === "function") {
        playPromise.catch(startFallbackMusic);
      }
    }

    function startFallbackMusic() {
      if (musicTimer) return;
      beat = 0;
      musicTimer = window.setInterval(() => {
        const notes = [196, 247, 294, 247];
        tone(notes[beat % notes.length], .08, "sine", .025);
        beat += 1;
      }, 560);
    }

    function stopMusic() {
      if (musicTimer) window.clearInterval(musicTimer);
      musicTimer = null;
      if (bgmAudio) {
        bgmAudio.pause();
        bgmAudio.currentTime = 0;
      }
    }

    return { correct, wrong, ko, startMusic, stopMusic, startVictoryBark, stopVictoryBark };
  })();

  function loadUnlockedStageIndex() {
    try {
      const saved = Number(window.localStorage.getItem(PROGRESS_KEY));
      if (!Number.isFinite(saved)) return 0;
      return clamp(saved, 0, stages.length);
    } catch (error) {
      return 0;
    }
  }

  function saveUnlockedStageIndex(index) {
    const value = clamp(index, 0, stages.length);
    state.unlockedStageIndex = Math.max(state.unlockedStageIndex, value);
    try {
      window.localStorage.setItem(PROGRESS_KEY, String(state.unlockedStageIndex));
    } catch (error) {
      // Some locked-down classroom browsers disable localStorage.
    }
  }

  function isStageUnlocked(index) {
    return index <= Math.min(state.unlockedStageIndex, Math.max(0, stages.length - 1));
  }

  function unlockNextStage() {
    if (state.challengeStageIndex < stages.length - 1) {
      saveUnlockedStageIndex(state.challengeStageIndex + 1);
    } else {
      saveUnlockedStageIndex(stages.length);
    }
  }

  function getStageGlobalIndex(stage) {
    const index = stages.indexOf(stage);
    return index >= 0 ? index : 0;
  }

  function getStageChapterIndex(stage) {
    if (!stage || !chapters.length) return 0;
    const index = chapters.findIndex((chapter) => chapter.id === stage.chapterId);
    return index >= 0 ? index : 0;
  }

  function getCurrentChapter() {
    return chapters[state.challengeChapterIndex] || chapters[0] || null;
  }

  function getChapterStages(chapterIndex = state.challengeChapterIndex) {
    const chapter = chapters[chapterIndex];
    if (!chapter) return stages;
    return stages.filter((stage) => stage.chapterId === chapter.id);
  }

  function isChapterUnlocked(chapterIndex) {
    const chapterStages = getChapterStages(chapterIndex);
    if (!chapterStages.length) return false;
    return isStageUnlocked(getStageGlobalIndex(chapterStages[0]));
  }

  function isChapterCleared(chapterIndex) {
    const chapterStages = getChapterStages(chapterIndex);
    if (!chapterStages.length) return false;
    const lastIndex = getStageGlobalIndex(chapterStages[chapterStages.length - 1]);
    return state.unlockedStageIndex > lastIndex;
  }

  function getCompletedChapterCount() {
    return chapters.filter((_chapter, index) => isChapterCleared(index)).length;
  }

  function renderCollectionPanel() {
    if (!els.collectionPanel || !chapters.length) return;
    const challenge = state.playKind === "challenge";
    els.collectionPanel.classList.toggle("hidden", !challenge);
    if (!challenge) return;

    const completed = getCompletedChapterCount();
    els.collectionCount.textContent = `${completed}/${chapters.length}`;
    els.collectionMeter.style.width = `${(completed / chapters.length) * 100}%`;
    els.collectionSlots.innerHTML = "";

    chapters.forEach((chapter, index) => {
      const cleared = isChapterCleared(index);
      const unlocked = isChapterUnlocked(index);
      const current = index === state.challengeChapterIndex;
      const slot = document.createElement("div");
      slot.className = [
        "collection-slot",
        cleared ? "collected" : "",
        current && !cleared ? "current" : "",
        !unlocked ? "locked" : ""
      ].filter(Boolean).join(" ");
      slot.title = unlocked ? `${chapter.name} · ${chapter.rewardName}` : "未解锁骨牌";
      slot.innerHTML = cleared || (unlocked && current)
        ? `<img src="${escapeHtml(chapter.rewardImage)}" alt="${escapeHtml(chapter.rewardName)}"><span>${cleared ? "已获得" : "寻找中"}</span>`
        : `<b>?</b><span>未发现</span>`;
      els.collectionSlots.appendChild(slot);
    });

    const chapter = getCurrentChapter();
    els.collectionGoal.textContent = completed >= chapters.length
      ? "六枚星词骨牌集齐，狗狗王国词力核心已修复。"
      : `目标：收集六枚星词骨牌。当前寻找：${chapter ? chapter.rewardName : "下一枚骨牌"}。`;
  }

  function syncChapterToCurrentStage() {
    state.challengeChapterIndex = getStageChapterIndex(getCurrentStage());
  }

  function selectChapter(index) {
    const requested = clamp(index, 0, Math.max(0, chapters.length - 1));
    if (state.playKind === "challenge" && !isChapterUnlocked(requested)) {
      els.setupStatus.textContent = "先通关前面的章节，才能进入这一区域。";
      return;
    }
    state.challengeChapterIndex = requested;
    const chapterStages = getChapterStages(requested);
    const currentStage = getCurrentStage();
    const currentInChapter = chapterStages.includes(currentStage) && isStageUnlocked(getStageGlobalIndex(currentStage));
    const targetStage = currentInChapter
      ? currentStage
      : chapterStages.find((stage) => isStageUnlocked(getStageGlobalIndex(stage))) || chapterStages[0];
    if (targetStage) {
      state.challengeStageIndex = getStageGlobalIndex(targetStage);
      if (state.playKind === "challenge") applyStageSettings(targetStage);
    }
    els.setupStatus.textContent = "";
    renderSetup();
  }

  function renderSetup() {
    els.setupScreen.classList.toggle("challenge-setup", state.playKind === "challenge");

    const terms = [
      ["all", "全部"],
      ["7-上册", "七上"],
      ["7-下册", "七下"],
      ["8-上册", "八上"],
      ["8-下册", "八下"],
      ["9-全一册", "九年级"]
    ];

    els.termTabs.innerHTML = "";
    terms.forEach(([id, label]) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = state.selectedTerm === id ? "active" : "";
      btn.textContent = label;
      btn.addEventListener("click", () => {
        state.selectedTerm = id;
        renderSetup();
      });
      els.termTabs.appendChild(btn);
    });

    const visible = getVisibleBanks();
    els.bankList.innerHTML = "";
    visible.forEach((bank) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = `bank-btn ${state.selectedBankIds.has(bank.id) ? "selected" : ""}`;
      btn.innerHTML = `<strong>${escapeHtml(bank.label)}</strong><span>${escapeHtml(bank.theme)} · ${bank.items.length}词</span>`;
      btn.addEventListener("click", () => {
        if (state.selectedBankIds.has(bank.id)) state.selectedBankIds.delete(bank.id);
        else state.selectedBankIds.add(bank.id);
        renderSetup();
      });
      els.bankList.appendChild(btn);
    });

    els.rangeCount.textContent = `${getSelectedItems().length} 个`;
    renderStages();
  }

  function renderStages() {
    if (!els.stagePanel) return;
    const hasStages = stages.length > 0;
    els.stagePanel.classList.toggle("hidden", state.playKind !== "challenge");
    if (els.chapterTabs) els.chapterTabs.innerHTML = "";
    els.stageList.innerHTML = "";
    if (!hasStages) {
      els.stageBrief.textContent = "还没有关卡素材。";
      return;
    }

    if (chapters.length && els.chapterTabs) {
      chapters.forEach((chapter, index) => {
        const locked = state.playKind === "challenge" && !isChapterUnlocked(index);
        const btn = document.createElement("button");
        btn.type = "button";
        btn.disabled = locked;
        btn.className = [
          "chapter-tab",
          index === state.challengeChapterIndex ? "active" : "",
          locked ? "locked" : "",
          isChapterCleared(index) ? "cleared" : ""
        ].filter(Boolean).join(" ");
        btn.innerHTML = `<strong>${chapter.order}</strong><span>${escapeHtml(locked ? "???" : chapter.mapLabel || chapter.name)}</span>`;
        btn.title = locked ? "未解锁章节" : `${chapter.name} · ${chapter.subtitle}`;
        btn.addEventListener("click", () => selectChapter(index));
        els.chapterTabs.appendChild(btn);
      });
    }

    getChapterStages().forEach((stage) => {
      const index = getStageGlobalIndex(stage);
      const locked = state.playKind === "challenge" && !isStageUnlocked(index);
      const statusText = locked ? "未解锁" : index < state.unlockedStageIndex ? "已通关" : "可挑战";
      const btn = document.createElement("button");
      btn.type = "button";
      btn.disabled = locked;
      btn.className = [
        "stage-card",
        index === state.challengeStageIndex ? "selected" : "",
        locked ? "locked" : "unlocked",
        index < state.unlockedStageIndex ? "cleared" : ""
      ].filter(Boolean).join(" ");
      btn.setAttribute("aria-disabled", locked ? "true" : "false");
      btn.innerHTML = locked
        ? `
          <div class="stage-mystery" aria-hidden="true">?</div>
          <span class="stage-meta">第 ${stage.order}/${stages.length} 关 · ???</span>
          <strong>未发现的关卡狗</strong>
          <em>通关前一关后出现</em>
          <span class="stage-lock">${escapeHtml(statusText)}</span>
        `
        : `
          <img src="${escapeHtml(stage.dogImage)}" alt="${escapeHtml(stage.name)}">
          <span class="stage-meta">第 ${stage.order}/${stages.length} 关 · ${escapeHtml(stage.chapterName)} · ${escapeHtml(stage.subtitle)}</span>
          <strong>${escapeHtml(stage.name)}</strong>
          <em>${stage.target} 题通关 · ${stage.duration} 秒</em>
          <span class="stage-lock">${escapeHtml(statusText)}</span>
        `;
      btn.addEventListener("click", () => selectStage(index));
      els.stageList.appendChild(btn);
    });

    const stage = getCurrentStage();
    const chapter = getCurrentChapter();
    els.stageCount.textContent = `第 ${stage.order}/${stages.length} 关`;
    els.stageBrief.textContent = state.playKind === "challenge"
      ? `${chapter ? `${chapter.name}：${chapter.intro} ` : ""}当前对手：${stage.name}。${stage.tip}（已开放到第 ${Math.min(state.unlockedStageIndex + 1, stages.length)} 关）`
      : "";
    els.startBtn.textContent = state.playKind === "challenge" ? `挑战${stage.name}` : "开始双人PK";
  }

  function getVisibleBanks() {
    if (state.selectedTerm === "all") return data.banks;
    const [grade, term] = state.selectedTerm.split("-");
    return data.banks.filter((bank) => bank.grade === grade && bank.term === term);
  }

  function getSelectedItems() {
    return data.banks
      .filter((bank) => state.selectedBankIds.has(bank.id))
      .flatMap((bank) => bank.items);
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.mode === mode);
    });
  }

  function setPlayKind(kind) {
    state.playKind = kind === "challenge" ? "challenge" : "versus";
    document.querySelectorAll("[data-play]").forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.play === state.playKind);
    });
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.disabled = state.playKind === "challenge";
    });
    if (state.playKind === "challenge") {
      if (!isStageUnlocked(state.challengeStageIndex)) state.challengeStageIndex = state.unlockedStageIndex;
      syncChapterToCurrentStage();
      applyStageSettings(getCurrentStage());
      setMode("shared");
    }
    renderSetup();
  }

  function selectStage(index) {
    const requested = clamp(index, 0, Math.max(0, stages.length - 1));
    if (state.playKind === "challenge" && !isStageUnlocked(requested)) {
      els.setupStatus.textContent = "先打败前一关，才能挑战后面的关卡。";
      return;
    }
    state.challengeStageIndex = requested;
    syncChapterToCurrentStage();
    if (state.playKind === "challenge") applyStageSettings(getCurrentStage());
    els.setupStatus.textContent = "";
    renderSetup();
  }

  function getCurrentStage() {
    return stages[state.challengeStageIndex] || stages[0] || null;
  }

  function applyStageSettings(stage) {
    if (!stage) return;
    state.selectedTerm = "all";
    state.selectedBankIds = new Set(stage.bankIds);
    setDuration(stage.duration);
    els.koInput.value = String(stage.ko);
  }

  function setDuration(seconds) {
    const value = clamp(Number(seconds) || 45, 15, 180);
    state.duration = value;
    els.durationInput.value = String(value);
    document.querySelectorAll(".time-preset").forEach((btn) => {
      btn.classList.toggle("active", Number(btn.dataset.seconds) === value);
    });
  }

  function setVictoryDuration(seconds) {
    const value = clamp(Number(seconds) || 2, 1, 8);
    const rounded = Math.round(value * 10) / 10;
    state.victoryDuration = rounded;
    if (els.victoryDurationInput) {
      els.victoryDurationInput.value = String(Number.isInteger(rounded) ? rounded : rounded.toFixed(1));
    }
  }

  function startGame() {
    hideStoryIntro();
    if (state.playKind === "challenge") {
      if (!isStageUnlocked(state.challengeStageIndex)) state.challengeStageIndex = state.unlockedStageIndex;
      syncChapterToCurrentStage();
      applyStageSettings(getCurrentStage());
    }
    const items = uniqueWords(getSelectedItems());
    state.duration = clamp(Number(els.durationInput.value) || 45, 15, 180);
    state.ko = clamp(Number(els.koInput.value) || 100, 60, 160);
    state.victoryDuration = clamp(Number(els.victoryDurationInput && els.victoryDurationInput.value) || 2, 1, 8);
    if (items.length < 8) {
      els.setupStatus.textContent = "至少选择 8 个单词再开始。";
      return;
    }

    state.phase = "battle";
    state.paused = false;
    state.challengeProgress = 0;
    state.enemyAttacks = 0;
    state.enemyCooldown = state.playKind === "challenge" ? getCurrentStage().enemyEvery : 0;
    state.resultWinner = null;
    state.resultReason = null;
    state.timeLeft = state.duration;
    state.tug = 0;
    state.deck = shuffle(items);
    state.sharedQuestion = null;
    state.laneQuestion = { left: null, right: null };
    state.locked = { left: false, right: false };
    state.players = {
      left: { score: 0, correct: 0, wrong: 0, streak: 0 },
      right: { score: 0, correct: 0, wrong: 0, streak: 0 }
    };

    els.setupScreen.classList.add("hidden");
    els.resultModal.classList.add("hidden");
    els.battleScreen.classList.remove("hidden");
    clearVictoryFx();
    configureBattleScene();
    els.pauseBtn.textContent = "暂停";
    els.battleModeTag.textContent = getBattleModeText();
    els.setupStatus.textContent = "";

    if (state.playKind === "challenge") {
      state.sharedQuestion = makeQuestion(pickItem(), "meaning-to-word");
    } else if (state.mode === "shared") {
      state.sharedQuestion = makeQuestion(pickItem(), "meaning-to-word");
    } else {
      state.laneQuestion.left = makeQuestion(pickItem(), "meaning-to-word");
      state.laneQuestion.right = makeQuestion(pickItem(), "word-to-meaning");
    }

    updateBattle();
    startTimer();
    sound.startMusic();
  }

  function handleStartPress() {
    if (state.playKind === "challenge") {
      if (!isStageUnlocked(state.challengeStageIndex)) state.challengeStageIndex = state.unlockedStageIndex;
      syncChapterToCurrentStage();
      applyStageSettings(getCurrentStage());
      renderSetup();
      showStoryIntro();
      return;
    }
    startGame();
  }

  function showStoryIntro() {
    const stage = getCurrentStage();
    if (!stage || !els.storyModal) return;
    const chapter = getCurrentChapter();
    els.storyEyebrow.textContent = chapter ? `${chapter.name} · ${chapter.subtitle}` : "剧情闯关";
    els.storyDogImg.src = stage.dogImage;
    els.storyDogImg.alt = stage.name;
    els.storyTitle.textContent = `第 ${stage.order} 关：${stage.name}`;
    const lines = stage.introLines && stage.introLines.length
      ? stage.introLines
      : [`${stage.chapterName} · ${stage.subtitle}`, stage.tip, `答对 ${stage.target} 题或提前 K.O.。`];
    els.storyLines.innerHTML = lines
      .concat([
        chapter ? `章节目标：夺回${chapter.rewardName}` : "",
        `本关目标：${stage.target} 题 · ${stage.duration} 秒 · 奖励：${stage.rewardName}`
      ].filter(Boolean))
      .map((line) => `<p>${escapeHtml(line)}</p>`)
      .join("");
    els.resultModal.classList.add("hidden");
    els.storyModal.classList.remove("hidden");
  }

  function hideStoryIntro() {
    if (els.storyModal) els.storyModal.classList.add("hidden");
  }

  function startTimer() {
    stopTimer();
    state.timerId = window.setInterval(() => {
      if (state.phase !== "battle" || state.paused) return;
      state.timeLeft -= 1;
      if (state.playKind === "challenge") tickEnemyPressure();
      updateTimer();
      if (state.timeLeft <= 0) endGame("time");
    }, 1000);
  }

  function stopTimer() {
    if (state.timerId) window.clearInterval(state.timerId);
    state.timerId = null;
  }

  function togglePause() {
    if (state.phase !== "battle") return;
    state.paused = !state.paused;
    els.pauseBtn.textContent = state.paused ? "继续" : "暂停";
    renderQuestions();
  }

  function updateBattle() {
    updateTimer();
    updateScores();
    updateTug();
    renderQuestions();
  }

  function updateTimer() {
    els.timerText.textContent = String(Math.max(0, state.timeLeft));
    els.timerText.style.background = state.timeLeft <= 10 ? "#8f2630" : "#273044";
  }

  function updateScores() {
    els.leftScore.textContent = state.players.left.score;
    els.rightScore.textContent = state.players.right.score;
    els.leftCorrect.textContent = `正确 ${state.players.left.correct}`;
    els.rightCorrect.textContent = `正确 ${state.players.right.correct}`;
    els.leftStreak.textContent = `连击 ${state.players.left.streak}`;
    els.rightStreak.textContent = `连击 ${state.players.right.streak}`;
  }

  function updateTug() {
    const leftPower = clamp((state.ko - state.tug) / (state.ko * 2), 0, 1);
    const rightPower = clamp((state.ko + state.tug) / (state.ko * 2), 0, 1);
    els.leftFill.style.width = `${leftPower * 100}%`;
    els.rightFill.style.width = `${rightPower * 100}%`;
    const marker = ((state.tug + state.ko) / (state.ko * 2)) * 100;
    els.tugMarker.style.left = `calc(${marker}% - 4px)`;
    els.leftPercent.textContent = `${Math.round(leftPower * 100)}%`;
    els.rightPercent.textContent = `${Math.round(rightPower * 100)}%`;
    document.documentElement.style.setProperty("--left-scale", (0.76 + leftPower * .48).toFixed(2));
    document.documentElement.style.setProperty("--right-scale", (0.76 + rightPower * .48).toFixed(2));
  }

  function renderQuestions() {
    if (state.playKind === "challenge") {
      renderChallengeQuestions();
      return;
    }
    if (state.mode === "shared") {
      const q = state.sharedQuestion;
      els.leftQuestionTitle.textContent = "左队抢答";
      els.rightQuestionTitle.textContent = "右队抢答";
      setQuestionCard("left", "同题抢答", q.prompt, state.paused ? "已暂停" : getQuestionHint(q));
      setQuestionCard("right", "同题抢答", q.prompt, state.paused ? "已暂停" : getQuestionHint(q));
      renderOptions("left", q);
      renderOptions("right", q);
    } else {
      const leftQ = state.laneQuestion.left;
      const rightQ = state.laneQuestion.right;
      els.leftQuestionTitle.textContent = "左队题目";
      els.rightQuestionTitle.textContent = "右队题目";
      setQuestionCard("left", "各自答题", leftQ.prompt, state.paused ? "已暂停" : getQuestionHint(leftQ));
      setQuestionCard("right", "各自答题", rightQ.prompt, state.paused ? "已暂停" : getQuestionHint(rightQ));
      renderOptions("left", leftQ);
      renderOptions("right", rightQ);
    }
  }

  function renderChallengeQuestions() {
    const stage = getCurrentStage();
    const q = state.sharedQuestion;
    els.leftQuestionTitle.textContent = "红队挑战";
    els.rightQuestionTitle.textContent = "关卡狗";
    setQuestionCard("left", `闯关 第 ${stage.order} 关`, q.prompt, state.paused ? "已暂停" : getQuestionHint(q));
    setQuestionCard("right", stage.name, `${state.challengeProgress}/${stage.target} 题通关`, stage.tip);
    renderOptions("left", q);
    renderEnemyPanel(stage);
    els.battleModeTag.textContent = getBattleModeText();
  }

  function renderEnemyPanel(stage) {
    els.rightOptions.innerHTML = `
      <div class="enemy-status">
        <strong>${escapeHtml(stage.name)}</strong>
        <span>下一次反击：${Math.max(0, state.enemyCooldown)} 秒</span>
        <span>已反击：${state.enemyAttacks} 次</span>
        <span>目标：答对 ${stage.target} 题</span>
      </div>
    `;
  }

  function setQuestionCard(side, mode, prompt, hint) {
    const modeEl = side === "left" ? els.leftQuestionMode : els.rightQuestionMode;
    const promptEl = side === "left" ? els.leftPrompt : els.rightPrompt;
    const hintEl = side === "left" ? els.leftHint : els.rightHint;
    modeEl.textContent = mode;
    promptEl.textContent = prompt;
    hintEl.textContent = hint;
  }

  function getQuestionHint(question) {
    if (!question) return "";
    return question.direction === "meaning-to-word" ? "看中文，抢选英文。" : "看英文，抢选中文。";
  }

  function renderOptions(side, question) {
    const target = side === "left" ? els.leftOptions : els.rightOptions;
    target.innerHTML = "";
    question.options.forEach((option, index) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "answer-btn";
      btn.dataset.index = String(index);
      btn.textContent = option.label;
      btn.addEventListener("click", () => answer(side, option, btn));
      target.appendChild(btn);
    });
  }

  function answer(side, option, button) {
    if (state.phase !== "battle" || state.paused || state.locked[side]) return;
    const question = state.mode === "shared" ? state.sharedQuestion : state.laneQuestion[side];
    const isCorrect = option.value === question.correct.value;
    state.locked[side] = true;

    if (isCorrect) {
      if (state.mode === "shared") {
        state.locked.left = true;
        state.locked.right = true;
      }
      button.classList.add("correct-flash");
      const endReason = applyCorrect(side, question);
      window.setTimeout(() => {
        if (state.phase !== "battle") return;
        if (endReason) {
          endGame(endReason);
          return;
        }
        if (state.playKind === "challenge") {
          state.sharedQuestion = makeQuestion(pickItem(), flipDirection(question.direction));
          state.locked.left = false;
          state.locked.right = false;
        } else if (state.mode === "shared") {
          state.sharedQuestion = makeQuestion(pickItem(), flipDirection(question.direction));
          state.locked.left = false;
          state.locked.right = false;
        } else {
          state.laneQuestion[side] = makeQuestion(pickItem(), flipDirection(question.direction));
          state.locked[side] = false;
        }
        updateBattle();
      }, 760);
    } else {
      button.classList.add("wrong-flash");
      applyWrong(side, question, option);
      window.setTimeout(() => {
        if (state.phase !== "battle") return;
        state.locked[side] = false;
        renderQuestions();
      }, 760);
    }
  }

  function applyCorrect(side, question) {
    const player = state.players[side];
    const speedBonus = performance.now() - question.startedAt < 3000 ? 4 : 0;
    const streakBonus = Math.min(8, player.streak * 2);
    const push = 12 + speedBonus + streakBonus;

    player.correct += 1;
    player.streak += 1;
    player.score += 10 + speedBonus + streakBonus;
    state.tug += side === "left" ? -push : push;
    if (state.playKind === "challenge" && side === "left") {
      state.challengeProgress += 1;
      state.enemyCooldown = Math.min(getCurrentStage().enemyEvery, state.enemyCooldown + 2);
    }
    setFeedback(side, `答对 +${push}`, "correct");
    dogAction(side, "attacking");
    blast(side, question.item.word, { selfHit: false });
    speak(question.item.word);
    sound.correct(side);

    updateScores();
    if (state.playKind === "challenge" && side === "left" && state.challengeProgress >= getCurrentStage().target) return "stage-clear";
    if (Math.abs(state.tug) >= state.ko) return "ko";
    return "";
  }

  function applyWrong(side, question, option) {
    const player = state.players[side];
    const firedText = option && /[A-Za-z]/.test(option.label) ? option.label : question.item.word;
    player.wrong += 1;
    player.streak = 0;
    state.tug += side === "left" ? 5 : -5;
    if (state.playKind === "challenge" && side === "left") {
      state.enemyCooldown = Math.max(1, state.enemyCooldown - 2);
    }
    setFeedback(side, "错误", "wrong", 1400);
    dogAction(side, "attacking");
    blast(side, firedText, { selfHit: true });
    sound.wrong();

    const feedback = `${question.item.word} = ${question.item.meaning}`;
    setQuestionCard(side, "答案提示", question.prompt, feedback);
    updateTug();
  }

  function tickEnemyPressure() {
    const stage = getCurrentStage();
    if (!stage) return;
    state.enemyCooldown -= 1;
    if (state.enemyCooldown > 0) return;
    enemyAttack(stage);
    state.enemyCooldown = stage.enemyEvery;
  }

  function enemyAttack(stage) {
    if (state.phase !== "battle") return;
    state.enemyAttacks += 1;
    state.players.right.score += 6;
    state.players.right.correct += 1;
    state.players.right.streak += 1;
    state.tug += stage.pressure;
    setFeedback("right", `答对 +${stage.pressure}`, "correct");
    dogAction("right", "attacking");
    blast("right", pickEnemyWord(stage), { selfHit: false });
    sound.wrong();
    updateScores();
    updateTug();
    renderQuestions();
    if (state.tug >= state.ko) endGame("ko");
  }

  function pickEnemyWord(stage) {
    const words = stage.attackWords && stage.attackWords.length ? stage.attackWords : getVictoryWords();
    return words[Math.floor(Math.random() * words.length)];
  }

  function setFeedback(side, text, type, holdMs) {
    const target = side === "left" ? els.leftFeedback : els.rightFeedback;
    target.classList.remove("feedback-correct", "feedback-wrong");
    if (type === "correct") target.classList.add("feedback-correct");
    if (type === "wrong") target.classList.add("feedback-wrong");
    target.textContent = text;
    window.setTimeout(() => {
      if (target.textContent === text) {
        target.textContent = "";
        target.classList.remove("feedback-correct", "feedback-wrong");
      }
    }, holdMs || 900);
  }

  function dogAction(side, className) {
    const target = side === "left" ? els.leftDogSide : els.rightDogSide;
    target.classList.remove("attacking", "hit", "stunned");
    void target.offsetWidth;
    target.classList.add(className);
    window.setTimeout(() => target.classList.remove(className), className === "stunned" ? 1800 : 430);
  }

  function getDogImage(side) {
    return side === "left" ? els.leftDogImg : els.rightDogImg;
  }

  function getDogSide(side) {
    return side === "left" ? els.leftDogSide : els.rightDogSide;
  }

  function setDogImageSources(side, normalSrc) {
    const img = getDogImage(side);
    img.dataset.normalSrc = normalSrc;
    img.src = normalSrc;
  }

  function restoreDogImage(side, force) {
    const target = getDogSide(side);
    const img = getDogImage(side);
    if (!force && target.classList.contains("knocked-out")) return;
    if (img.dataset.normalSrc) img.src = img.dataset.normalSrc;
  }

  function blast(side, text, options) {
    const selfHit = Boolean(options && options.selfHit);
    const targetSide = selfHit ? side : opposite(side);
    const start = getFxPoint(side, "mouth");
    const end = getFxPoint(targetSide, "head");
    const node = document.createElement("div");
    node.className = `blast ${side} ${selfHit ? "bad self-hit" : ""}`;
    node.textContent = text;
    node.style.left = `${start.x}px`;
    node.style.top = `${start.y}px`;
    node.style.setProperty("--dx", `${end.x - start.x}px`);
    node.style.setProperty("--dy", `${end.y - start.y}px`);
    node.style.setProperty("--dx-a", `${(end.x - start.x) * .28}px`);
    node.style.setProperty("--dy-a", `${(end.y - start.y) * .18 - 18}px`);
    node.style.setProperty("--dx-b", `${(end.x - start.x) * .62}px`);
    node.style.setProperty("--dy-b", `${(end.y - start.y) * .34 - 34}px`);
    node.style.setProperty("--spin-start", side === "left" ? "-8deg" : "8deg");
    node.style.setProperty("--spin-mid", side === "left" ? "9deg" : "-9deg");
    node.style.setProperty("--spin-back", side === "left" ? "-11deg" : "11deg");
    node.style.setProperty("--spin-end", side === "left" ? "14deg" : "-14deg");
    els.fxLayer.appendChild(node);
    window.setTimeout(() => {
      spawnImpact(targetSide, text, selfHit);
      dogAction(targetSide, "stunned");
    }, 610);
    window.setTimeout(() => node.remove(), 940);
  }

  function getFxPoint(side, kind) {
    const layerRect = els.fxLayer.getBoundingClientRect();
    const dog = side === "left" ? $(".dog-left") : $(".dog-right");
    const rect = (dog || (side === "left" ? els.leftDogSide : els.rightDogSide)).getBoundingClientRect();
    const mouthX = side === "left" ? .62 : .38;
    const point = kind === "mouth"
      ? { x: rect.left + rect.width * mouthX, y: rect.top + rect.height * .48 }
      : { x: rect.left + rect.width * .5, y: rect.top + rect.height * .22 };
    return {
      x: point.x - layerRect.left,
      y: point.y - layerRect.top
    };
  }

  function spawnImpact(side, text, bad) {
    const holdFx = new URLSearchParams(window.location.search).get("fxhold") === "1";
    const point = getFxPoint(side, "head");
    const burst = document.createElement("div");
    burst.className = `impact-burst ${side} ${bad ? "bad" : ""}`;
    if (holdFx) burst.classList.add("fx-hold");
    burst.textContent = bad ? "错误!" : "击中!";
    burst.style.left = `${point.x}px`;
    burst.style.top = `${point.y + 34}px`;
    els.fxLayer.appendChild(burst);

    const stun = document.createElement("div");
    stun.className = `stun-cloud ${side}`;
    if (holdFx) stun.classList.add("fx-hold");
    stun.innerHTML = "<i></i><i></i><i></i><i></i>";
    stun.style.left = `${point.x}px`;
    stun.style.top = `${point.y - 22}px`;
    els.fxLayer.appendChild(stun);

    window.setTimeout(() => burst.remove(), holdFx ? 4200 : 1600);
    window.setTimeout(() => stun.remove(), holdFx ? 4200 : 2700);
  }

  function endGame(reason) {
    if (state.phase !== "battle") return;
    state.phase = "victory";
    stopTimer();
    sound.stopMusic();
    sound.ko();

    let winner = determineWinner(reason);
    state.resultWinner = winner;
    state.resultReason = reason;

    if (winner !== "draw") {
      playVictorySequence(winner, reason);
      return;
    }

    showResult(reason, winner);
  }

  function determineWinner(reason) {
    if (state.playKind === "challenge") {
      const stage = getCurrentStage();
      if (reason === "stage-clear") return "left";
      if (reason === "ko") return state.tug < 0 ? "left" : "right";
      if (reason === "time") return state.challengeProgress >= stage.target ? "left" : "right";
      return state.challengeProgress >= stage.target || state.tug < 0 ? "left" : "right";
    }
    let winner = "draw";
    if (state.tug < 0) winner = "left";
    if (state.tug > 0) winner = "right";
    if (state.tug === 0) {
      if (state.players.left.score > state.players.right.score) winner = "left";
      if (state.players.right.score > state.players.left.score) winner = "right";
    }
    return winner;
  }

  function showResult(reason, winner) {
    state.phase = "ended";
    sound.stopVictoryBark();
    if (state.playKind === "challenge") {
      showChallengeResult(reason, winner);
      return;
    }
    els.againBtn.textContent = "再来一局";
    els.resultSetupBtn.textContent = "返回设置";
    const title = winner === "draw" ? "平局" : `${getSideDisplayName(winner)}胜利`;
    els.resultTitle.textContent = reason === "ko" && winner !== "draw" ? `K.O. ${title}` : title;
    els.resultSummary.innerHTML = [
      `红队：${state.players.left.score}分，正确 ${state.players.left.correct}，错误 ${state.players.left.wrong}`,
      `蓝队：${state.players.right.score}分，正确 ${state.players.right.correct}，错误 ${state.players.right.wrong}`,
      `优势值：${state.tug < 0 ? "红队" : state.tug > 0 ? "蓝队" : "双方"} ${Math.abs(Math.round(state.tug))}`
    ].map((line) => `<div>${escapeHtml(line)}</div>`).join("");
    els.resultModal.classList.remove("hidden");
  }

  function showChallengeResult(reason, winner) {
    const stage = getCurrentStage();
    const success = winner === "left";
    const hasNext = state.challengeStageIndex < stages.length - 1;
    const nextStage = hasNext ? stages[state.challengeStageIndex + 1] : null;
    if (success) unlockNextStage();
    renderCollectionPanel();
    els.resultTitle.textContent = success
      ? reason === "ko" ? `K.O. ${stage.name}` : `${stage.name} 被击败`
      : `${stage.name} 挑战失败`;
    const summary = [
      `关卡：第 ${stage.order}/${stages.length} 关 · ${stage.chapterName} · ${stage.subtitle}`,
      `答题进度：${state.challengeProgress}/${stage.target} 题`,
      `红队：${state.players.left.score}分，正确 ${state.players.left.correct}，错误 ${state.players.left.wrong}`,
      `关卡狗反击：${state.enemyAttacks} 次`,
      `优势值：${state.tug < 0 ? "红队" : state.tug > 0 ? stage.name : "持平"} ${Math.abs(Math.round(state.tug))}`,
      success ? `获得：${stage.rewardName}` : "建议重试本关，先稳住前 3 题连击。",
      success && stage.winLines && stage.winLines.length ? stage.winLines.join(" / ") : "",
      success && nextStage ? `下一关：${nextStage.chapterName} · ${nextStage.name}` : success ? "已完成当前 3.0 剧情闯关版本。" : ""
    ].filter(Boolean);
    els.resultSummary.innerHTML = summary.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
    els.againBtn.textContent = success && hasNext ? "下一关" : success ? "再挑战" : "重试本关";
    els.resultSetupBtn.textContent = "返回设置";
    els.resultModal.classList.remove("hidden");
  }

  function playVictorySequence(winner, reason) {
    const loser = opposite(winner);
    const winnerTarget = winner === "left" ? els.leftDogSide : els.rightDogSide;
    const loserTarget = loser === "left" ? els.leftDogSide : els.rightDogSide;
    const duration = Math.round(clamp(state.victoryDuration || 2, 1, 8) * 1000);
    const knockoutAt = Math.max(420, Math.min(duration - 560, duration * .55));
    const flyDuration = Math.max(520, duration - knockoutAt - 110);
    const hitCount = Math.max(3, Math.min(12, Math.round(duration / 260)));
    const hitWindow = Math.max(260, knockoutAt - 180);
    const hitInterval = hitWindow / hitCount;
    clearVictoryFx();
    els.battleScreen.style.setProperty("--ko-fly-duration", `${flyDuration}ms`);
    els.battleScreen.classList.add("victory-running", `winner-${winner}`);
    winnerTarget.classList.add("victory-winner");
    loserTarget.classList.add("victory-loser");
    sound.startVictoryBark(duration);
    spawnVictoryBanner(winner);

    const words = getVictoryWords();
    for (let i = 0; i < hitCount; i += 1) {
      const delay = 160 + i * hitInterval;
      if (delay >= knockoutAt - 60) break;
      window.setTimeout(() => {
        if (state.phase !== "victory") return;
        dogAction(winner, "attacking");
        blast(winner, words[i % words.length], { selfHit: false });
      }, delay);
    }

    window.setTimeout(() => {
      if (state.phase !== "victory") return;
      loserTarget.classList.add("knocked-out");
      winnerTarget.classList.add("victory-celebrate");
      dogAction(winner, "attacking");
      spawnVictoryKnockout(loser);
    }, knockoutAt);

    window.setTimeout(() => {
      clearVictoryFx();
      showResult(reason, winner);
    }, duration);
  }

  function clearVictoryFx() {
    sound.stopVictoryBark();
    els.battleScreen.style.removeProperty("--ko-fly-duration");
    els.battleScreen.classList.remove("victory-running", "winner-left", "winner-right");
    [els.leftDogSide, els.rightDogSide].forEach((target) => {
      target.classList.remove("victory-winner", "victory-loser", "victory-celebrate", "knocked-out", "attacking", "hit", "stunned");
    });
    restoreDogImage("left", true);
    restoreDogImage("right", true);
    els.fxLayer.querySelectorAll(".victory-banner, .victory-ko-word, .stun-cloud, .impact-burst").forEach((node) => node.remove());
  }

  function spawnVictoryBanner(winner) {
    const node = document.createElement("div");
    node.className = `victory-banner ${winner}`;
    node.innerHTML = `<strong>${escapeHtml(getSideDisplayName(winner))} WIN!</strong><span>单词连环汪汪炮</span>`;
    els.fxLayer.appendChild(node);
  }

  function spawnVictoryKnockout(loser) {
    const node = document.createElement("div");
    node.className = `victory-ko-word ${loser}`;
    node.textContent = "K.O.";
    els.fxLayer.appendChild(node);
  }

  function getVictoryWords() {
    const candidates = uniqueWords(getSelectedItems()).map((item) => item.word);
    if (candidates.length < 4) return ["word", "power", "win", "boom"];
    return shuffle(candidates).slice(0, 12);
  }

  function returnSetup() {
    state.phase = "setup";
    stopTimer();
    sound.stopMusic();
    clearVictoryFx();
    hideStoryIntro();
    els.battleScreen.classList.add("hidden");
    els.battleScreen.classList.remove("challenge-active");
    els.resultModal.classList.add("hidden");
    els.setupScreen.classList.remove("hidden");
    renderSetup();
  }

  function handleAgain() {
    if (state.playKind === "challenge") {
      els.resultModal.classList.add("hidden");
      if (state.resultWinner === "left" && state.challengeStageIndex < stages.length - 1) {
        selectStage(state.challengeStageIndex + 1);
      }
      showStoryIntro();
      return;
    }
    startGame();
  }

  function makeQuestion(item, direction) {
    const options = makeOptions(item, direction);
    const prompt = direction === "meaning-to-word" ? item.meaning : item.word;
    const correct = direction === "meaning-to-word"
      ? { label: item.word, value: item.word }
      : { label: item.meaning, value: item.meaning };
    return {
      id: `${item.id}-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      item,
      direction,
      prompt,
      correct,
      options,
      startedAt: performance.now()
    };
  }

  function makeOptions(item, direction) {
    const all = uniqueWords(getSelectedItems());
    const distractors = shuffle(all.filter((candidate) => candidate.word !== item.word)).slice(0, 3);
    const raw = [item, ...distractors];
    return shuffle(raw).map((candidate) => {
      if (direction === "meaning-to-word") return { label: candidate.word, value: candidate.word };
      return { label: candidate.meaning, value: candidate.meaning };
    });
  }

  function pickItem() {
    if (!state.deck.length) state.deck = shuffle(uniqueWords(getSelectedItems()));
    return state.deck.pop();
  }

  function speak(word) {
    if (!els.voiceToggle.checked || !("speechSynthesis" in window) || !("SpeechSynthesisUtterance" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = "en-US";
      utterance.rate = .88;
      utterance.pitch = 1.05;
      window.speechSynthesis.speak(utterance);
    } catch (error) {
      // Speech support is optional on classroom devices.
    }
  }

  function uniqueWords(items) {
    const seen = new Set();
    const output = [];
    items.forEach((item) => {
      const key = item.word.toLowerCase();
      if (seen.has(key) || !item.meaning) return;
      seen.add(key);
      output.push(item);
    });
    return output;
  }

  function flipDirection(direction) {
    return direction === "meaning-to-word" ? "word-to-meaning" : "meaning-to-word";
  }

  function opposite(side) {
    return side === "left" ? "right" : "left";
  }

  function getSideDisplayName(side) {
    if (state.playKind === "challenge" && side === "right") return getCurrentStage().name;
    return side === "left" ? "红队" : "蓝队";
  }

  function getBattleModeText() {
    if (state.playKind !== "challenge") return state.mode === "shared" ? "同题抢答" : "各自答题";
    const stage = getCurrentStage();
    return `闯关 第 ${stage.order} 关 · ${state.challengeProgress}/${stage.target}`;
  }

  function configureBattleScene() {
    const challenge = state.playKind === "challenge";
    const stage = getCurrentStage();
    els.battleScreen.classList.toggle("challenge-active", challenge);
    els.leftTeamLabel.textContent = challenge ? "红队" : "左队";
    els.rightTeamLabel.textContent = challenge ? "关卡狗" : "右队";
    const leftNormal = "assets/dog-left.png";
    const rightNormal = challenge && stage ? stage.dogImage : "assets/dog-right.png";
    const rightFlip = challenge && stage ? Number(stage.rightFlip ?? -1) : 1;
    setDogImageSources("left", leftNormal);
    setDogImageSources("right", rightNormal);
    els.rightDogImg.style.setProperty("--right-flip", String(rightFlip));
    els.leftDogName.textContent = "红队";
    els.rightDogName.textContent = challenge && stage ? stage.name : "蓝队";
    els.rightDogImg.alt = challenge && stage ? stage.name : "右队狗狗";
    renderCollectionPanel();
  }

  function shuffle(list) {
    const copy = list.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function wireEvents() {
    document.querySelectorAll("[data-play]").forEach((btn) => {
      btn.addEventListener("click", () => setPlayKind(btn.dataset.play));
    });
    document.querySelectorAll("[data-mode]").forEach((btn) => {
      btn.addEventListener("click", () => setMode(btn.dataset.mode));
    });
    document.querySelectorAll(".time-preset").forEach((btn) => {
      btn.addEventListener("click", () => setDuration(btn.dataset.seconds));
    });
    els.durationInput.addEventListener("change", () => setDuration(els.durationInput.value));
    if (els.victoryDurationInput) {
      els.victoryDurationInput.addEventListener("change", () => setVictoryDuration(els.victoryDurationInput.value));
    }
    els.startBtn.addEventListener("click", handleStartPress);
    els.storyStartBtn.addEventListener("click", () => {
      hideStoryIntro();
      startGame();
    });
    els.storyCancelBtn.addEventListener("click", () => {
      hideStoryIntro();
      returnSetup();
    });
    els.pauseBtn.addEventListener("click", togglePause);
    els.newRoundBtn.addEventListener("click", startGame);
    els.backSetupBtn.addEventListener("click", returnSetup);
    els.againBtn.addEventListener("click", handleAgain);
    els.resultSetupBtn.addEventListener("click", returnSetup);
    els.fullscreenBtn.addEventListener("click", () => {
      const target = document.documentElement;
      if (!document.fullscreenElement && target.requestFullscreen) target.requestFullscreen();
    });
    els.selectVisibleBtn.addEventListener("click", () => {
      getVisibleBanks().forEach((bank) => state.selectedBankIds.add(bank.id));
      renderSetup();
    });
    els.clearVisibleBtn.addEventListener("click", () => {
      getVisibleBanks().forEach((bank) => state.selectedBankIds.delete(bank.id));
      renderSetup();
    });
    els.selectStarterBtn.addEventListener("click", () => {
      state.selectedBankIds = new Set(["g7a-u1", "g7a-u2", "g7b-u1", "g8a-u6"]);
      state.selectedTerm = "all";
      renderSetup();
    });
    els.soundToggle.addEventListener("change", () => {
      if (!els.soundToggle.checked) sound.stopMusic();
      else if (state.phase === "battle") sound.startMusic();
    });
    els.musicToggle.addEventListener("change", () => {
      if (state.phase === "battle") sound.startMusic();
    });
  }

  window.wordDogTest = {
    state,
    startGame,
    returnSetup,
    setMode,
    setPlayKind,
    selectChapter,
    selectStage,
    setDuration,
    setVictoryDuration,
    showStoryIntro,
    hideStoryIntro,
    answerLeftCorrect() {
      const q = state.mode === "shared" ? state.sharedQuestion : state.laneQuestion.left;
      const option = q.options.find((item) => item.value === q.correct.value);
      answer("left", option, els.leftOptions.querySelector(`[data-index="${q.options.indexOf(option)}"]`));
    },
    answerRightCorrect() {
      const q = state.mode === "shared" ? state.sharedQuestion : state.laneQuestion.right;
      const option = q.options.find((item) => item.value === q.correct.value);
      answer("right", option, els.rightOptions.querySelector(`[data-index="${q.options.indexOf(option)}"]`));
    },
    answerLeftWrong() {
      const q = state.mode === "shared" ? state.sharedQuestion : state.laneQuestion.left;
      const option = q.options.find((item) => item.value !== q.correct.value);
      answer("left", option, els.leftOptions.querySelector(`[data-index="${q.options.indexOf(option)}"]`));
    },
    answerRightWrong() {
      const q = state.mode === "shared" ? state.sharedQuestion : state.laneQuestion.right;
      const option = q.options.find((item) => item.value !== q.correct.value);
      answer("right", option, els.rightOptions.querySelector(`[data-index="${q.options.indexOf(option)}"]`));
    },
    forceWin(side) {
      if (state.phase !== "battle") return;
      state.tug = side === "right" ? state.ko : -state.ko;
      updateTug();
      endGame("ko");
    }
  };

  wireEvents();
  renderSetup();
  const bootParams = new URLSearchParams(window.location.search);
  if (bootParams.get("autostart") === "1") {
    if (bootParams.get("play") === "challenge" || bootParams.get("challenge") === "1") {
      setPlayKind("challenge");
      if (bootParams.get("stage")) selectStage(clamp(Number(bootParams.get("stage")) - 1, 0, Math.max(0, stages.length - 1)));
    }
    const requestedMode = bootParams.get("mode") === "independent" ? "independent" : "shared";
    if (state.playKind !== "challenge") setMode(requestedMode);
    if (bootParams.get("duration")) setDuration(bootParams.get("duration"));
    if (bootParams.get("victoryDuration") || bootParams.get("victory")) {
      setVictoryDuration(bootParams.get("victoryDuration") || bootParams.get("victory"));
    }
    if (bootParams.get("ko")) els.koInput.value = String(clamp(Number(bootParams.get("ko")) || 100, 60, 160));
    window.setTimeout(() => {
      startGame();
      if (bootParams.get("pause") === "1") {
        state.paused = true;
        els.pauseBtn.textContent = "继续";
        renderQuestions();
      }
      if (bootParams.get("fxdemo") === "correct") {
        window.setTimeout(() => window.wordDogTest.answerLeftCorrect(), 360);
      }
      if (bootParams.get("fxdemo") === "wrong") {
        window.setTimeout(() => window.wordDogTest.answerRightWrong(), 360);
      }
      if (bootParams.get("victorydemo") === "left" || bootParams.get("victorydemo") === "right") {
        window.setTimeout(() => window.wordDogTest.forceWin(bootParams.get("victorydemo")), 520);
      }
    }, 0);
  }
})();
