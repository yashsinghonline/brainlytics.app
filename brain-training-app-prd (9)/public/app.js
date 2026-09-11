(() => {
  "use strict";

  const STORAGE_KEY = "brainbolt.static.v1";
  const DAY_MS = 86_400_000;

  const GAMES = [
    { id: "quick-math", name: "Quick Math", icon: "±", category: "Math", skill: "math", mode: "timed", seconds: 45, par: 1500, blurb: "Solve arithmetic before the clock runs out.", instructions: "Choose the correct answer. Fast, accurate answers build a combo." },
    { id: "memory-grid", name: "Memory Grid", icon: "▦", category: "Memory", skill: "memory", mode: "lives", lives: 3, par: 1100, blurb: "Recall a pattern of highlighted cells.", instructions: "Memorize the dark cells, then select the same cells after they disappear." },
    { id: "color-switch", name: "Color Switch", icon: "A", category: "Focus", skill: "focus", mode: "timed", seconds: 40, par: 1500, blurb: "Name the ink color, not the word.", instructions: "Ignore what the word says and select the color of its ink." },
    { id: "number-sequence", name: "Number Sequence", icon: "…", category: "Pattern", skill: "logic", mode: "lives", lives: 3, par: 1100, blurb: "Find the number that completes the pattern.", instructions: "Study the sequence and choose the number that should come next." },
    { id: "odd-one-out", name: "Odd One Out", icon: "◇", category: "Focus", skill: "focus", mode: "timed", seconds: 40, par: 1350, blurb: "Spot the symbol that does not belong.", instructions: "One symbol differs from every other symbol. Find it as quickly as possible." },
    { id: "reaction-tap", name: "Reaction Tap", icon: "•", category: "Speed", skill: "speed", mode: "rounds", par: 1300, blurb: "Test how quickly you react to a signal.", instructions: "Wait. Tap only when the panel turns dark. Five rounds determine your result." },
    { id: "number-memory", name: "Number Memory", icon: "123", category: "Memory", skill: "memory", mode: "lives", lives: 3, par: 1000, blurb: "Remember an increasingly long number.", instructions: "Study the number, then enter it exactly after it disappears." },
    { id: "logic-tiles", name: "Logic Tiles", icon: "○●", category: "Logic", skill: "logic", mode: "lives", lives: 3, par: 1100, blurb: "Complete a visual transformation.", instructions: "Find the tile that follows the same rule as the tiles before it." },
    { id: "fast-count", name: "Fast Count", icon: "∑", category: "Speed", skill: "speed", mode: "timed", seconds: 40, par: 1300, blurb: "Count one shape among many distractions.", instructions: "Count the requested shape and choose the total without losing focus." },
    { id: "direction-dash", name: "Direction Dash", icon: "→", category: "Speed", skill: "speed", mode: "timed", seconds: 40, par: 1600, blurb: "Match directions while ignoring distractions.", instructions: "Follow the arrow. At higher levels, ignore the conflicting direction word." },
    { id: "word-memory", name: "Word Memory", icon: "Aa", category: "Memory", skill: "memory", mode: "lives", lives: 3, par: 1050, blurb: "Recognize words from a short study list.", instructions: "Study the words, then select only those words from the larger list." },
    { id: "mental-rotation", name: "Mental Rotation", icon: "⌑", category: "Pattern", skill: "logic", mode: "lives", lives: 3, par: 1000, blurb: "Find the same shape after it rotates.", instructions: "Choose the rotated match. Reflected versions are not the same shape." }
  ];

  const GAME_MAP = Object.fromEntries(GAMES.map((game) => [game.id, game]));
  const WORDS = "apple train moon chair river cloud piano garden planet winter bridge forest mirror rabbit silver window basket dragon flower marble oxygen sailor velvet coffee guitar lemon magnet palace robin violet zebra beacon energy frost globe jasper lotus pebble quartz voyage amber breeze coral ember grain haven ivory karma moose prism reef tango vivid crisp dream eager flare grace hover jolly lunar merry noble opal quest royal shine tidal witty zesty".split(" ");
  const COLORS = [
    { name: "RED", value: "#d94b4b" }, { name: "BLUE", value: "#3c6fd8" },
    { name: "GREEN", value: "#3c9b61" }, { name: "PURPLE", value: "#8a57bb" },
    { name: "ORANGE", value: "#dd743b" }, { name: "PINK", value: "#c94f83" }
  ];
  const DIRECTIONS = [
    { id: "up", arrow: "↑", word: "UP" }, { id: "right", arrow: "→", word: "RIGHT" },
    { id: "down", arrow: "↓", word: "DOWN" }, { id: "left", arrow: "←", word: "LEFT" }
  ];

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;
  const pick = (array) => array[Math.floor(Math.random() * array.length)];
  const shuffle = (array) => {
    const copy = [...array];
    for (let index = copy.length - 1; index > 0; index -= 1) {
      const target = Math.floor(Math.random() * (index + 1));
      [copy[index], copy[target]] = [copy[target], copy[index]];
    }
    return copy;
  };
  const sample = (array, count) => shuffle(array).slice(0, count);
  const format = (number) => Math.round(number).toLocaleString("en-US");
  const todayKey = (date = new Date()) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };
  const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#039;", '"': "&quot;" })[character]);

  function seeded(seedText) {
    let hash = 2166136261;
    for (const character of seedText) {
      hash ^= character.charCodeAt(0);
      hash = Math.imul(hash, 16777619);
    }
    return () => {
      hash += 0x6d2b79f5;
      let value = hash;
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  const defaultState = () => ({
    theme: "dark",
    sound: true,
    reducedMotion: false,
    streak: 0,
    bestStreak: 0,
    lastPlayDate: null,
    totalScore: 0,
    brainScore: 0,
    skills: { memory: 0, speed: 0, logic: 0, focus: 0, math: 0 },
    gameStats: {},
    history: [],
    daily: null
  });

  function loadState() {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY));
      if (stored && typeof stored === "object") {
        const fresh = defaultState();
        return {
          ...fresh,
          ...stored,
          skills: { ...fresh.skills, ...(stored.skills || {}) },
          gameStats: stored.gameStats || {},
          history: Array.isArray(stored.history) ? stored.history : []
        };
      }
      const old = JSON.parse(localStorage.getItem("brainbolt.v1"));
      if (old && typeof old === "object") {
        return {
          ...defaultState(),
          theme: old.settings?.theme || "dark",
          sound: old.settings?.sound ?? true,
          streak: old.streak || 0,
          bestStreak: old.bestStreak || 0,
          lastPlayDate: old.lastPlayDate || null,
          totalScore: old.totalScore || 0,
          brainScore: old.brainScore || 0,
          skills: { ...defaultState().skills, ...(old.skills || {}) },
          gameStats: old.stats || {},
          history: (old.history || []).map((record) => ({ ...record, time: record.ts || Date.now() }))
        };
      }
    } catch (_) {
      // A damaged local value should never block the website.
    }
    return defaultState();
  }

  let state = loadState();
  function saveState() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function createDaily() {
    const date = todayKey();
    if (state.daily?.date === date && Array.isArray(state.daily.ids)) return state.daily;
    const rng = seeded(`brainbolt-${date}`);
    const pool = [...GAMES].sort(() => rng() - 0.5);
    const selected = [];
    const categories = new Set();
    for (const game of pool) {
      if (!categories.has(game.category)) {
        selected.push(game.id);
        categories.add(game.category);
      }
      if (selected.length === 3) break;
    }
    state.daily = { date, ids: selected, done: [], score: 0 };
    saveState();
    return state.daily;
  }

  const daily = createDaily();
  let audioContext = null;
  function tone(frequency = 500, duration = 0.07) {
    if (!state.sound) return;
    try {
      audioContext ||= new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();
      oscillator.type = "sine";
      oscillator.frequency.value = frequency;
      gain.gain.setValueAtTime(0.045, audioContext.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
      oscillator.connect(gain).connect(audioContext.destination);
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration);
    } catch (_) {}
  }

  function applyPreferences() {
    document.documentElement.dataset.theme = state.theme;
    document.body.classList.toggle("motion-off", state.reducedMotion);
    $("#theme-toggle").textContent = state.theme === "dark" ? "◐" : "◑";
    $("#sound-setting").checked = state.sound;
    $("#motion-setting").checked = state.reducedMotion;
  }

  function recordsToday() {
    const key = todayKey();
    return state.history.filter((record) => todayKey(new Date(record.time)) === key);
  }

  function brainRank(score) {
    if (score >= 8500) return "Master mind";
    if (score >= 6500) return "Brain athlete";
    if (score >= 4000) return "Sharp thinker";
    if (score >= 2000) return "Quick thinker";
    return score > 0 ? "Warming up" : "Start training";
  }

  function renderMetrics() {
    const today = recordsToday();
    const bestToday = Math.max(0, ...today.map((record) => record.score));
    const reactions = state.history.map((record) => record.bestMs).filter(Number.isFinite);
    const bestReaction = reactions.length ? Math.min(...reactions) : null;
    const score = state.brainScore || 0;
    $("#hero-brain-score").textContent = score ? format(score) : "—";
    $("#brain-score").textContent = score ? format(score) : "—";
    $("#brain-rank").textContent = brainRank(score);
    $("#hero-streak").textContent = state.streak;
    $("#metric-games").textContent = today.length;
    $("#metric-best").textContent = bestToday ? format(bestToday) : "—";
    $("#metric-streak").textContent = state.streak;
    $("#metric-reaction").textContent = bestReaction ? `${bestReaction}ms` : "—";

    const allScores = state.history.map((record) => record.score);
    const allAccuracy = state.history.filter((record) => record.total >= 3).map((record) => record.accuracy);
    const allLevels = state.history.map((record) => record.level || 1);
    $("#record-score").textContent = allScores.length ? format(Math.max(...allScores)) : "—";
    $("#record-reaction").textContent = bestReaction ? `${bestReaction}ms` : "—";
    $("#record-accuracy").textContent = allAccuracy.length ? `${Math.max(...allAccuracy)}%` : "—";
    $("#record-level").textContent = allLevels.length ? `Lv ${Math.max(...allLevels)}` : "—";
    $("#record-streak").textContent = state.bestStreak;
    $("#record-total").textContent = state.history.length;
  }

  function renderSkills() {
    $("#skill-bars").innerHTML = Object.entries(state.skills).map(([skill, score]) => `
      <div class="skill-row">
        <div><label>${escapeHTML(skill)}</label><strong>${Math.round(score)}</strong></div>
        <span class="skill-track"><i style="width:${clamp(score, 0, 100)}%"></i></span>
      </div>
    `).join("");
  }

  function renderChart() {
    const points = [];
    for (let offset = 6; offset >= 0; offset -= 1) {
      const date = new Date(Date.now() - offset * DAY_MS);
      const key = todayKey(date);
      const score = state.history
        .filter((record) => todayKey(new Date(record.time)) === key)
        .reduce((total, record) => total + record.score, 0);
      points.push({ label: date.toLocaleDateString(undefined, { weekday: "short" }).slice(0, 1), score });
    }
    const maximum = Math.max(1, ...points.map((point) => point.score));
    $("#history-chart").innerHTML = points.map((point) => `
      <div class="chart-column" title="${format(point.score)} points">
        <i style="height:${point.score ? Math.max(4, (point.score / maximum) * 100) : 1}%"></i>
        <span>${point.label}</span>
      </div>
    `).join("");
  }

  function renderDaily() {
    $("#daily-date").textContent = new Date().toLocaleDateString(undefined, { month: "short", day: "numeric" });
    const complete = daily.done.length === daily.ids.length;
    $("#daily-title").textContent = complete ? "Today’s training is complete." : "Three games. One sharper mind.";
    $("#daily-start").innerHTML = complete ? `Replay set · ${format(daily.score)} <span>↻</span>` : daily.done.length ? `Continue · ${daily.done.length}/3 <span>→</span>` : `Begin daily training <span>→</span>`;
    $("#daily-games").innerHTML = daily.ids.map((id, index) => {
      const game = GAME_MAP[id];
      const done = daily.done.includes(id);
      return `<div class="daily-item ${done ? "done" : ""}"><i>${done ? "✓" : game.icon}</i><div><span>0${index + 1}</span><strong>${escapeHTML(game.name)}</strong></div></div>`;
    }).join("");
  }

  function renderGames(filter = "All") {
    const games = filter === "All" ? GAMES : GAMES.filter((game) => game.category === filter);
    $("#game-grid").innerHTML = games.map((game) => {
      const best = state.gameStats[game.id]?.best || 0;
      return `<button class="game-card" type="button" data-game="${game.id}">
        <span class="game-card-head"><i class="game-icon">${game.icon}</i><small class="game-category">${escapeHTML(game.category)}</small></span>
        <h3>${escapeHTML(game.name)}</h3><p>${escapeHTML(game.blurb)}</p>
        <span class="game-card-foot"><span>${best ? `Personal best<strong>${format(best)}</strong>` : "Not played<strong>Start now</strong>"}</span><i>→</i></span>
      </button>`;
    }).join("");
    $$(".game-card", $("#game-grid")).forEach((button) => button.addEventListener("click", () => openGame(button.dataset.game)));
  }

  function renderAll() {
    renderMetrics();
    renderSkills();
    renderChart();
    renderDaily();
    renderGames($(".filter.active")?.dataset.filter || "All");
  }

  const dialog = $("#game-dialog");
  const stage = $("#game-stage");
  let session = null;
  let dailyMode = false;
  let interval = null;
  const timeouts = new Set();

  function later(callback, delay) {
    const id = setTimeout(() => {
      timeouts.delete(id);
      callback();
    }, delay);
    timeouts.add(id);
    return id;
  }

  function clearSessionTimers() {
    clearInterval(interval);
    interval = null;
    timeouts.forEach(clearTimeout);
    timeouts.clear();
  }

  function updateHUD() {
    if (!session) return;
    $("#game-score").textContent = format(session.score);
    $("#game-level").textContent = session.game.mode === "lives"
      ? `Level ${session.level} · ${"■".repeat(session.lives)}${"□".repeat((session.game.lives || 3) - session.lives)}`
      : `Level ${session.level}`;
    if (session.game.mode === "timed") {
      $("#game-time").textContent = `${Math.ceil(session.timeLeft)}s`;
      $("#timer-bar").style.width = `${(session.timeLeft / session.game.seconds) * 100}%`;
    } else if (session.game.mode === "rounds") {
      $("#game-time").textContent = `${session.round}/5`;
      $("#timer-bar").style.width = `${(session.round / 5) * 100}%`;
    } else {
      $("#game-time").textContent = `${session.correct} correct`;
      $("#timer-bar").style.width = "100%";
    }
  }

  function toast(message, good = true) {
    const element = $("#game-toast");
    element.textContent = message;
    element.style.color = good ? "var(--ink)" : "var(--muted)";
    later(() => { if (element.textContent === message) element.textContent = ""; }, 800);
  }

  function openGame(id, fromDaily = false) {
    const game = GAME_MAP[id];
    if (!game) return;
    clearSessionTimers();
    dailyMode = fromDaily;
    session = null;
    $("#game-kicker").textContent = game.category;
    $("#game-name").textContent = game.name;
    $("#game-score").textContent = "0";
    $("#game-level").textContent = "Ready";
    $("#game-time").textContent = game.mode === "timed" ? `${game.seconds}s` : game.mode === "rounds" ? "5 rounds" : `${game.lives} lives`;
    $("#timer-bar").style.width = "100%";
    stage.innerHTML = `<div class="intro-icon">${game.icon}</div><h2>${escapeHTML(game.name)}</h2><p class="instructions">${escapeHTML(game.instructions)}</p><button class="button button-solid" id="start-game" type="button">Start game <span>→</span></button>`;
    $("#game-toast").textContent = "";
    if (!dialog.open) dialog.showModal();
    $("#start-game").addEventListener("click", () => countdown(game));
  }

  function countdown(game) {
    let count = 3;
    const show = () => {
      stage.innerHTML = `<div class="countdown">${count === 0 ? "GO" : count}</div>`;
      tone(count === 0 ? 800 : 420, .05);
      if (count === 0) later(() => startSession(game), 500);
      else { count -= 1; later(show, 700); }
    };
    show();
  }

  function startSession(game) {
    const now = Date.now();
    session = {
      game, score: 0, correct: 0, wrong: 0, combo: 0, maxCombo: 0,
      level: 1, lives: game.lives || 0, timeLeft: game.seconds || 0,
      round: 0, started: now, questionAt: now, locked: false,
      reactions: [], finished: false
    };
    updateHUD();
    if (game.mode === "timed") {
      let previous = performance.now();
      interval = setInterval(() => {
        const nowTime = performance.now();
        session.timeLeft = Math.max(0, session.timeLeft - (nowTime - previous) / 1000);
        previous = nowTime;
        updateHUD();
        if (session.timeLeft <= 0) finishGame();
      }, 100);
    }
    renderRound();
  }

  function addCorrect(points) {
    session.correct += 1;
    session.combo += 1;
    session.maxCombo = Math.max(session.maxCombo, session.combo);
    const elapsed = Date.now() - session.questionAt;
    const speed = clamp(Math.round(70 - elapsed / 100), 0, 70);
    session.score += points || Math.round((100 + speed + Math.min(50, session.combo * 5)) * (1 + (session.level - 1) * .08));
    if (session.correct % 4 === 0) session.level += 1;
    tone(720, .08);
    toast(session.combo > 1 ? `${session.combo} combo` : "Correct");
    updateHUD();
  }

  function addWrong() {
    session.wrong += 1;
    session.combo = 0;
    session.score = Math.max(0, session.score - 35);
    if (session.game.mode === "lives") session.lives -= 1;
    tone(180, .12);
    toast("Not quite — keep going", false);
    updateHUD();
  }

  function answer(ok, delay = 550) {
    if (!session || session.locked || session.finished) return;
    session.locked = true;
    if (ok) addCorrect(); else addWrong();
    if (session.game.mode === "lives" && session.lives <= 0) {
      later(finishGame, 700);
    } else {
      later(() => { session.locked = false; renderRound(); }, delay);
    }
  }

  function choiceRound(prompt, question, options, answerValue, className = "") {
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">${prompt}</div><div class="big-question">${question}</div><div class="choice-grid ${className}">${options.map((option, index) => `<button class="choice" type="button" data-value="${escapeHTML(option)}">${escapeHTML(option)}</button>`).join("")}</div>${session.combo > 1 ? `<div class="combo">Combo ×${session.combo}</div>` : ""}`;
    $$(".choice", stage).forEach((button) => button.addEventListener("click", () => {
      if (session.locked) return;
      const ok = String(button.dataset.value) === String(answerValue);
      $$(".choice", stage).forEach((item) => {
        item.disabled = true;
        if (String(item.dataset.value) === String(answerValue)) item.classList.add("correct");
      });
      if (!ok) button.classList.add("wrong");
      answer(ok);
    }));
  }

  function uniqueOptions(answerValue, spread = 8) {
    const values = new Set([answerValue]);
    while (values.size < 4) {
      const candidate = answerValue + randomInt(-spread, spread);
      if (candidate >= 0) values.add(candidate);
    }
    return shuffle([...values]);
  }

  function renderQuickMath() {
    const level = session.level;
    let a = randomInt(3, 18 + level * 8);
    let b = randomInt(2, 14 + level * 5);
    let symbol = pick(level < 2 ? ["+", "−"] : ["+", "−", "×"]);
    let result;
    if (symbol === "+") result = a + b;
    else if (symbol === "−") { if (b > a) [a, b] = [b, a]; result = a - b; }
    else { a = randomInt(2, 5 + level); b = randomInt(2, 9); result = a * b; }
    choiceRound("Solve", `${a} ${symbol} ${b} = ?`, uniqueOptions(result, Math.max(5, Math.round(result * .22))), result);
  }

  function renderColorSwitch() {
    session.questionAt = Date.now();
    const ink = pick(COLORS);
    const word = pick(COLORS.filter((color) => color.name !== ink.name));
    const options = shuffle(COLORS).slice(0, session.level > 2 ? 6 : 4);
    if (!options.some((option) => option.name === ink.name)) options[0] = ink;
    stage.innerHTML = `<div class="prompt">Choose the ink color — ignore the word</div><div class="big-question" style="color:${ink.value}">${word.name}</div><div class="choice-grid ${options.length > 4 ? "four" : ""}">${options.map((option) => `<button class="color-button" type="button" data-color="${option.name}" style="background:${option.value}">${option.name}</button>`).join("")}</div>`;
    $$(".color-button", stage).forEach((button) => button.addEventListener("click", () => {
      if (session.locked) return;
      const ok = button.dataset.color === ink.name;
      $$(".color-button", stage).forEach((item) => { item.disabled = true; if (item.dataset.color === ink.name) item.classList.add("correct"); });
      answer(ok);
    }));
  }

  function renderSequence() {
    const level = session.level;
    let sequence;
    let answerValue;
    if (level < 3 || Math.random() < .55) {
      const step = randomInt(2, 4 + level * 2);
      const start = randomInt(1, 12);
      sequence = [0, 1, 2, 3, 4].map((index) => start + index * step);
      answerValue = start + 5 * step;
    } else {
      const multiplier = pick([2, 3]);
      const start = randomInt(1, 4);
      sequence = [0, 1, 2, 3, 4].map((index) => start * multiplier ** index);
      answerValue = sequence[4] * multiplier;
    }
    session.questionAt = Date.now();
    const options = uniqueOptions(answerValue, Math.max(6, Math.round(answerValue * .25)));
    stage.innerHTML = `<div class="prompt">What comes next?</div><div class="sequence">${sequence.map((number) => `<span>${number}</span>`).join("")}<span>?</span></div><div class="choice-grid">${options.map((option) => `<button class="choice" data-value="${option}" type="button">${option}</button>`).join("")}</div>`;
    $$(".choice", stage).forEach((button) => button.addEventListener("click", () => {
      if (session.locked) return;
      const ok = Number(button.dataset.value) === answerValue;
      $$(".choice", stage).forEach((item) => { item.disabled = true; if (Number(item.dataset.value) === answerValue) item.classList.add("correct"); });
      if (!ok) button.classList.add("wrong");
      answer(ok, 700);
    }));
  }

  function renderOddOneOut() {
    const pairs = [["▲", "△"], ["■", "□"], ["●", "○"], ["◆", "◇"], ["★", "☆"], ["⬢", "⬡"]];
    const [first, second] = pick(pairs);
    const reverse = Math.random() > .5;
    const normal = reverse ? second : first;
    const odd = reverse ? first : second;
    const size = clamp(3 + Math.floor((session.level - 1) / 2), 3, 6);
    const oddIndex = randomInt(0, size * size - 1);
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">Find the odd symbol</div><div class="odd-grid" style="grid-template-columns:repeat(${size},1fr)">${Array.from({ length: size * size }, (_, index) => `<button class="odd-cell" type="button" data-index="${index}">${index === oddIndex ? odd : normal}</button>`).join("")}</div>`;
    $$(".odd-cell", stage).forEach((button) => button.addEventListener("click", () => {
      const ok = Number(button.dataset.index) === oddIndex;
      if (ok) button.style.background = "var(--ink)", button.style.color = "var(--inverse)";
      answer(ok, ok ? 300 : 500);
    }));
  }

  function renderFastCount() {
    const shapes = ["●", "▲", "■", "◆", "★"];
    const target = pick(shapes);
    const total = clamp(10 + session.level * 3, 12, 30);
    const count = randomInt(2, Math.max(3, Math.floor(total / 3)));
    const items = Array(count).fill(target);
    while (items.length < total) items.push(pick(shapes.filter((shape) => shape !== target)));
    session.questionAt = Date.now();
    const options = uniqueOptions(count, 3);
    stage.innerHTML = `<div class="prompt">How many ${target} shapes?</div><div class="word-study" aria-label="Shapes to count">${shuffle(items).map((shape, index) => `<span style="font-size:${20 + (index % 3) * 2}px;border:0;padding:3px;opacity:${.55 + (index % 4) * .14}">${shape}</span>`).join("")}</div><div class="choice-grid four">${options.map((option) => `<button class="choice" type="button" data-value="${option}">${option}</button>`).join("")}</div>`;
    $$(".choice", stage).forEach((button) => button.addEventListener("click", () => {
      if (session.locked) return;
      const ok = Number(button.dataset.value) === count;
      $$(".choice", stage).forEach((item) => { item.disabled = true; if (Number(item.dataset.value) === count) item.classList.add("correct"); });
      if (!ok) button.classList.add("wrong");
      answer(ok);
    }));
  }

  function renderDirection() {
    const direction = pick(DIRECTIONS);
    const distractor = session.level > 2 ? pick(DIRECTIONS) : null;
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">Follow the arrow${distractor ? " — ignore the word" : ""}</div><div class="big-question">${direction.arrow}</div>${distractor ? `<div style="margin-top:5px;color:var(--muted);font-size:16px;letter-spacing:.25em;text-decoration:${distractor.id !== direction.id ? "line-through" : "none"}">${distractor.word}</div>` : ""}<div class="choice-grid four">${DIRECTIONS.map((item) => `<button class="choice" type="button" data-direction="${item.id}">${item.arrow}</button>`).join("")}</div>`;
    $$(".choice", stage).forEach((button) => button.addEventListener("click", () => {
      if (session.locked) return;
      const ok = button.dataset.direction === direction.id;
      $$(".choice", stage).forEach((item) => { item.disabled = true; if (item.dataset.direction === direction.id) item.classList.add("correct"); });
      if (!ok) button.classList.add("wrong");
      answer(ok, 400);
    }));
  }

  function renderLogicTiles() {
    const symbols = ["○", "●", "□", "■", "△", "▲", "◇", "◆"];
    let sequence;
    let answerValue;
    if (Math.random() < .5) {
      const [a, b] = sample(symbols, 2);
      sequence = [a, b, a, b, a];
      answerValue = b;
    } else {
      const arrows = ["↑", "→", "↓", "←"];
      const start = randomInt(0, 3);
      sequence = [0, 1, 2, 3, 4].map((index) => arrows[(start + index) % 4]);
      answerValue = arrows[(start + 5) % 4];
    }
    const options = shuffle([answerValue, ...sample(symbols.filter((symbol) => symbol !== answerValue), 3)]);
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">Complete the pattern</div><div class="sequence">${sequence.map((symbol) => `<span>${symbol}</span>`).join("")}<span>?</span></div><div class="choice-grid">${options.map((option) => `<button class="choice" type="button" data-value="${option}">${option}</button>`).join("")}</div>`;
    $$(".choice", stage).forEach((button) => button.addEventListener("click", () => {
      if (session.locked) return;
      const ok = button.dataset.value === answerValue;
      $$(".choice", stage).forEach((item) => { item.disabled = true; if (item.dataset.value === answerValue) item.classList.add("correct"); });
      if (!ok) button.classList.add("wrong");
      answer(ok, 650);
    }));
  }

  function renderMemoryGrid() {
    const size = session.level < 3 ? 3 : session.level < 6 ? 4 : 5;
    const total = size * size;
    const count = clamp(session.level + 2, 3, Math.floor(total / 2));
    const targets = new Set(sample(Array.from({ length: total }, (_, index) => index), count));
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">Memorize ${count} cells</div><div class="memory-grid" style="grid-template-columns:repeat(${size},1fr)">${Array.from({ length: total }, (_, index) => `<button class="memory-cell active-${targets.has(index)} ${targets.has(index) ? "active" : ""}" data-index="${index}" type="button" disabled></button>`).join("")}</div>`;
    later(() => {
      if (!session || session.finished) return;
      $(".prompt", stage).textContent = `Select ${count} cells`;
      $$(".memory-cell", stage).forEach((cell) => { cell.classList.remove("active"); cell.disabled = false; });
      const selected = new Set();
      $$(".memory-cell", stage).forEach((cell) => cell.addEventListener("click", () => {
        if (session.locked) return;
        const index = Number(cell.dataset.index);
        if (selected.has(index)) { selected.delete(index); cell.classList.remove("selected"); }
        else if (selected.size < count) { selected.add(index); cell.classList.add("selected"); tone(360, .03); }
        if (selected.size === count) {
          const ok = [...targets].every((target) => selected.has(target));
          if (!ok) $$(".memory-cell", stage).forEach((item) => { if (targets.has(Number(item.dataset.index)) && !selected.has(Number(item.dataset.index))) item.classList.add("missed"); });
          answer(ok, ok ? 550 : 900);
        }
      }));
    }, clamp(2200 - session.level * 130, 1000, 2000));
  }

  function renderNumberMemory() {
    const digits = clamp(session.level + 2, 3, 11);
    let number = String(randomInt(1, 9));
    while (number.length < digits) number += randomInt(0, 9);
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">Remember this number</div><div class="digit-display">${number}</div>`;
    later(() => {
      if (!session || session.finished) return;
      stage.innerHTML = `<div class="prompt">Enter the number</div><input class="number-entry" id="number-entry" inputmode="numeric" autocomplete="off" maxlength="${digits}" aria-label="Remembered number" /><button class="button button-solid" id="submit-number" type="button" style="margin-top:12px">Check answer</button>`;
      const input = $("#number-entry");
      const submit = () => {
        if (session.locked) return;
        input.disabled = true;
        answer(input.value === number, 900);
      };
      $("#submit-number").addEventListener("click", submit);
      input.addEventListener("keydown", (event) => { if (event.key === "Enter") submit(); });
      input.focus();
    }, clamp(1000 + digits * 220, 1600, 3400));
  }

  function renderWordMemory() {
    const count = clamp(3 + session.level, 4, 8);
    const targets = sample(WORDS, count);
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">Remember these ${count} words</div><div class="word-study">${targets.map((word) => `<span>${word}</span>`).join("")}</div>`;
    later(() => {
      if (!session || session.finished) return;
      const distractors = sample(WORDS.filter((word) => !targets.includes(word)), count);
      const options = shuffle([...targets, ...distractors]);
      stage.innerHTML = `<div class="prompt">Select the ${count} words you saw</div><div class="word-options">${options.map((word) => `<button class="word-option" type="button" data-word="${word}">${word}</button>`).join("")}</div><button class="button button-solid" id="confirm-words" type="button" style="margin-top:24px" disabled>Confirm selection</button>`;
      const selected = new Set();
      $$(".word-option", stage).forEach((button) => button.addEventListener("click", () => {
        const word = button.dataset.word;
        if (selected.has(word)) { selected.delete(word); button.classList.remove("selected"); }
        else if (selected.size < count) { selected.add(word); button.classList.add("selected"); }
        $("#confirm-words").disabled = selected.size !== count;
      }));
      $("#confirm-words").addEventListener("click", () => {
        const ok = selected.size === count && targets.every((word) => selected.has(word));
        answer(ok, 1000);
      });
    }, clamp(2300 + count * 300, 3200, 5000));
  }

  const normalizeShape = (cells) => {
    const minX = Math.min(...cells.map(([x]) => x));
    const minY = Math.min(...cells.map(([, y]) => y));
    return cells.map(([x, y]) => [x - minX, y - minY]).sort((a, b) => a[1] - b[1] || a[0] - b[0]);
  };
  const rotateShape = (cells) => normalizeShape(cells.map(([x, y]) => [2 - y, x]));
  const mirrorShape = (cells) => normalizeShape(cells.map(([x, y]) => [2 - x, y]));
  const shapeKey = (cells) => normalizeShape(cells).map((cell) => cell.join(",")).join("|");
  const shapeHTML = (cells) => `<span class="shape-field">${Array.from({ length: 9 }, (_, index) => cells.some(([x, y]) => y * 3 + x === index) ? "<i></i>" : "<b></b>").join("")}</span>`;

  function renderMentalRotation() {
    const bases = [
      [[0,0],[0,1],[0,2],[1,2],[2,2]],
      [[0,0],[1,0],[1,1],[1,2],[2,2]],
      [[0,0],[1,0],[2,0],[0,1],[1,1]]
    ];
    const base = normalizeShape(pick(bases));
    let rotated = base;
    for (let index = 0; index < randomInt(1, 3); index += 1) rotated = rotateShape(rotated);
    const answerKey = shapeKey(rotated);
    const distractors = [];
    let mirror = mirrorShape(base);
    for (let index = 0; index < 4; index += 1) {
      if (shapeKey(mirror) !== answerKey && !distractors.some((item) => shapeKey(item) === shapeKey(mirror))) distractors.push(mirror);
      mirror = rotateShape(mirror);
    }
    while (distractors.length < 3) distractors.push(normalizeShape(pick(bases)));
    const options = shuffle([rotated, ...distractors.slice(0, 3)]);
    session.questionAt = Date.now();
    stage.innerHTML = `<div class="prompt">Find the same shape, rotated</div><div style="margin-top:20px;border:1px solid var(--line);background:var(--surface);padding:15px">${shapeHTML(base)}</div><div class="choice-grid">${options.map((shape, index) => `<button class="choice" type="button" data-index="${index}">${shapeHTML(shape)}</button>`).join("")}</div>`;
    $$(".choice", stage).forEach((button) => button.addEventListener("click", () => {
      if (session.locked) return;
      const selectedShape = options[Number(button.dataset.index)];
      const ok = shapeKey(selectedShape) === answerKey;
      $$(".choice", stage).forEach((item) => { item.disabled = true; if (shapeKey(options[Number(item.dataset.index)]) === answerKey) item.classList.add("correct"); });
      if (!ok) button.classList.add("wrong");
      answer(ok, 850);
    }));
  }

  function renderReaction() {
    const startRound = () => {
      session.locked = false;
      updateHUD();
      stage.innerHTML = `<button class="reaction-pad" id="reaction-pad" type="button"><strong>START</strong><span>Tap to arm round ${session.round + 1}</span></button>`;
      const pad = $("#reaction-pad");
      pad.addEventListener("click", arm, { once: true });
    };
    const arm = () => {
      stage.innerHTML = `<button class="reaction-pad" id="reaction-pad" type="button"><strong>WAIT</strong><span>Do not tap yet</span></button>`;
      const pad = $("#reaction-pad");
      let signalTime = 0;
      let signalTimeout = later(() => {
        signalTime = performance.now();
        pad.classList.add("go");
        pad.innerHTML = `<strong>TAP</strong><span>Now</span>`;
        tone(800, .04);
      }, randomInt(1200, 3200));
      pad.addEventListener("click", () => {
        if (!signalTime) {
          clearTimeout(signalTimeout);
          timeouts.delete(signalTimeout);
          addWrong();
          stage.innerHTML = `<div class="reaction-pad"><strong>EARLY</strong><span>Wait for the dark signal</span></div>`;
          later(startRound, 900);
          return;
        }
        const ms = Math.round(performance.now() - signalTime);
        session.reactions.push(ms);
        session.round += 1;
        session.correct += 1;
        session.score += clamp(Math.round(540 - ms), 50, 430);
        tone(720, .08);
        updateHUD();
        stage.innerHTML = `<div class="reaction-pad"><strong>${ms}ms</strong><span>${ms < 240 ? "Excellent" : ms < 340 ? "Quick" : "Keep sharpening"}</span></div>`;
        if (session.round >= 5) later(finishGame, 900); else later(startRound, 900);
      }, { once: true });
    };
    startRound();
  }

  function renderRound() {
    if (!session || session.finished) return;
    session.locked = false;
    session.questionAt = Date.now();
    switch (session.game.id) {
      case "quick-math": renderQuickMath(); break;
      case "memory-grid": renderMemoryGrid(); break;
      case "color-switch": renderColorSwitch(); break;
      case "number-sequence": renderSequence(); break;
      case "odd-one-out": renderOddOneOut(); break;
      case "reaction-tap": renderReaction(); break;
      case "number-memory": renderNumberMemory(); break;
      case "logic-tiles": renderLogicTiles(); break;
      case "fast-count": renderFastCount(); break;
      case "direction-dash": renderDirection(); break;
      case "word-memory": renderWordMemory(); break;
      case "mental-rotation": renderMentalRotation(); break;
    }
  }

  function updateStreak() {
    const today = todayKey();
    if (state.lastPlayDate === today) return;
    const yesterday = todayKey(new Date(Date.now() - DAY_MS));
    state.streak = state.lastPlayDate === yesterday ? state.streak + 1 : 1;
    state.lastPlayDate = today;
    state.bestStreak = Math.max(state.bestStreak, state.streak);
  }

  function finishGame() {
    if (!session || session.finished) return;
    session.finished = true;
    clearSessionTimers();
    const total = session.correct + session.wrong;
    const accuracy = total ? Math.round((session.correct / total) * 100) : 0;
    const bestMs = session.reactions.length ? Math.min(...session.reactions) : undefined;
    const record = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      gameId: session.game.id,
      time: Date.now(),
      score: Math.max(0, Math.round(session.score)),
      correct: session.correct,
      wrong: session.wrong,
      total,
      accuracy,
      level: session.level,
      bestMs
    };
    const oldStat = state.gameStats[session.game.id] || { plays: 0, best: 0, bestLevel: 0 };
    const isBest = record.score > oldStat.best;
    state.gameStats[session.game.id] = {
      plays: oldStat.plays + 1,
      best: Math.max(oldStat.best, record.score),
      bestLevel: Math.max(oldStat.bestLevel || 0, record.level),
      bestMs: bestMs ? Math.min(oldStat.bestMs || Infinity, bestMs) : oldStat.bestMs
    };
    state.history.push(record);
    state.history = state.history.slice(-400);
    state.totalScore += record.score;
    updateStreak();

    const performance = clamp(record.score / session.game.par, 0, 1) * 100;
    const oldSkill = state.skills[session.game.skill] || 0;
    state.skills[session.game.skill] = Math.round(Math.max(oldSkill, oldSkill * .65 + performance * .35));
    const skillValues = Object.values(state.skills);
    state.brainScore = Math.round((skillValues.reduce((sum, score) => sum + score, 0) / skillValues.length) * 100);

    if (dailyMode && daily.ids.includes(session.game.id) && !daily.done.includes(session.game.id)) {
      daily.done.push(session.game.id);
      daily.score += record.score;
    }
    saveState();
    renderAll();
    tone(900, .15);

    const nextDaily = dailyMode ? daily.ids.find((id) => !daily.done.includes(id)) : null;
    stage.innerHTML = `<div class="results-mark">${isBest ? "◆" : "◇"}</div><div class="results-score">${format(record.score)}</div><div class="results-label">${isBest ? "New personal best" : "Game complete"}</div><div class="result-stats"><div><strong>${accuracy}%</strong><span>Accuracy</span></div><div><strong>${session.maxCombo || "—"}</strong><span>Best combo</span></div><div><strong>${bestMs ? `${bestMs}ms` : `Lv ${session.level}`}</strong><span>${bestMs ? "Reaction" : "Level"}</span></div></div><div class="result-actions"><button class="button button-solid" id="play-again" type="button">Play again</button>${nextDaily ? `<button class="button" id="next-daily" type="button">Next daily game →</button>` : `<button class="button" id="view-progress" type="button">View progress</button>`}</div>`;
    $("#play-again").addEventListener("click", () => countdown(session.game));
    if (nextDaily) $("#next-daily").addEventListener("click", () => openGame(nextDaily, true));
    else $("#view-progress").addEventListener("click", () => { dialog.close(); location.hash = "progress"; });
  }

  function closeGame() {
    clearSessionTimers();
    session = null;
    dialog.close();
  }

  $("#close-game").addEventListener("click", closeGame);
  dialog.addEventListener("cancel", (event) => { event.preventDefault(); closeGame(); });
  dialog.addEventListener("click", (event) => { if (event.target === dialog) closeGame(); });

  $("#daily-start").addEventListener("click", () => {
    const next = daily.ids.find((id) => !daily.done.includes(id)) || daily.ids[0];
    openGame(next, true);
  });
  $$(".filter").forEach((button) => button.addEventListener("click", () => {
    $$(".filter").forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    renderGames(button.dataset.filter);
  }));

  $("#theme-toggle").addEventListener("click", () => {
    state.theme = state.theme === "dark" ? "light" : "dark";
    saveState();
    applyPreferences();
  });
  $("#sound-setting").addEventListener("change", (event) => { state.sound = event.target.checked; saveState(); });
  $("#motion-setting").addEventListener("change", (event) => { state.reducedMotion = event.target.checked; saveState(); applyPreferences(); });
  $("#reset-progress").addEventListener("click", () => {
    if (!confirm("Reset all locally saved scores, streaks, and progress?")) return;
    const theme = state.theme;
    const sound = state.sound;
    const reducedMotion = state.reducedMotion;
    state = { ...defaultState(), theme, sound, reducedMotion };
    createDaily();
    saveState();
    location.reload();
  });

  const menuButton = $("#menu-button");
  menuButton.addEventListener("click", () => {
    const open = $("#main-nav").classList.toggle("open");
    menuButton.setAttribute("aria-expanded", String(open));
  });
  $$("#main-nav a").forEach((link) => link.addEventListener("click", () => {
    $("#main-nav").classList.remove("open");
    menuButton.setAttribute("aria-expanded", "false");
  }));

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => { if (entry.isIntersecting) entry.target.classList.add("visible"); });
  }, { threshold: .08 });
  $$(".reveal").forEach((element) => observer.observe(element));

  applyPreferences();
  renderAll();

  if ("serviceWorker" in navigator && location.protocol !== "file:") {
    window.addEventListener("load", () => navigator.serviceWorker.register("/sw.js", { updateViaCache: "none" }).catch(() => {}));
  }
})();
