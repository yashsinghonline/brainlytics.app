// Main Application Controller - Pure Frontend, Zero Backend
(function () {
  const { GAMES, GAME_MAP, dailyGamesFor, HANDLERS } = window.GamesEngine;
  const {
    SKILLS,
    SKILL_ORDER,
    ACHIEVEMENTS,
    todayKey,
    nextStreak,
    computeStats,
    evaluateAchievements,
    scoreForRound,
    gameAccuracy,
    loadState,
    saveState,
  } = window.StorageManager;
  const { sfx, buzz, configureAudio } = window.Sound;

  let state = loadState();
  let currentView = "home";
  let activeGameCleanup = null;
  let gameInterval = null;

  // Sync settings on start
  configureAudio(state.settings.sound, state.settings.haptics);
  document.documentElement.classList.toggle("dark", state.settings.theme === "dark");

  function commitState(patch) {
    state = { ...state, ...patch };
    saveState(state);
    updateNavStats();
  }

  function showToast(title, desc) {
    const container = document.getElementById("toast-container");
    if (!container) return;
    const toast = document.createElement("div");
    toast.className = "toast-box";
    toast.innerHTML = `
      <span class="label" style="font-size:16px;">🏆</span>
      <div>
        <p class="label" style="color:var(--text); font-size:11px;">${title}</p>
        <p style="font-size:12px; color:var(--muted);">${desc}</p>
      </div>
    `;
    container.appendChild(toast);
    sfx.achievement();
    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "scale(0.9)";
      toast.style.transition = "all 0.3s ease";
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  }

  // Record session
  function recordSession(result) {
    const day = todayKey();
    const sessionRecord = {
      id: `${result.gameId}-${Date.now()}`,
      gameId: result.gameId,
      score: result.score,
      accuracy: result.accuracy,
      maxCombo: result.maxCombo,
      level: result.level,
      rounds: result.rounds,
      correct: result.correct,
      avgReactionMs: result.avgReactionMs,
      durationMs: result.durationMs,
      day,
      at: Date.now(),
    };

    const sessions = [sessionRecord, ...state.sessions].slice(0, 400);
    const playDays = state.playDays.includes(day) ? state.playDays : [...state.playDays, day];
    const streak = nextStreak(state.playDays, day, state.streak);
    const computed = computeStats(sessions, state.dailies, Math.max(state.streak, streak), GAMES);
    const unlocked = evaluateAchievements(computed).filter((id) => !state.achievements.includes(id));

    unlocked.forEach((id) => {
      const ach = ACHIEVEMENTS.find((a) => a.id === id);
      if (ach) showToast(ach.title, ach.desc);
    });

    commitState({
      sessions,
      playDays,
      streak,
      achievements: [...state.achievements, ...unlocked],
    });
  }

  // Navigation controller
  function navigateTo(viewName) {
    currentView = viewName;
    window.location.hash = "#/" + (viewName === "home" ? "" : viewName);

    // Update nav links
    document.querySelectorAll(".nav-link, .bottom-tab").forEach((el) => {
      const target = el.dataset.view;
      el.classList.toggle("active", target === viewName);
    });

    // Update view panels
    document.querySelectorAll(".view-panel").forEach((panel) => {
      panel.classList.toggle("active", panel.id === `view-${viewName}`);
    });

    window.scrollTo({ top: 0, behavior: "instant" });

    // Render active view
    if (viewName === "home") renderHome();
    else if (viewName === "games") renderGames();
    else if (viewName === "daily") renderDaily();
    else if (viewName === "progress") renderProgress();
    else if (viewName === "profile") renderProfile();
  }

  function updateNavStats() {
    const stats = computeStats(state.sessions, state.dailies, state.streak, GAMES);
    const scoreEl = document.getElementById("nav-brain-score");
    const streakEl = document.getElementById("nav-streak");
    const avatarEl = document.getElementById("nav-avatar");

    if (scoreEl) scoreEl.textContent = stats.brainScore.toLocaleString();
    if (streakEl) streakEl.textContent = `${state.streak} d`;
    if (avatarEl) avatarEl.textContent = state.avatar ? state.avatar.slice(0, 1).toUpperCase() : "★";
  }

  // --- HOME VIEW ---
  function renderHome() {
    const stats = computeStats(state.sessions, state.dailies, state.streak, GAMES);
    const day = todayKey();
    const dailyCompleted = (state.dailies || []).some((d) => d.day === day && d.completed);
    const dailyGames = dailyGamesFor(day);

    const greeting = () => {
      const h = new Date().getHours();
      return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
    };

    const container = document.getElementById("view-home");
    container.innerHTML = `
      <div class="site-container animate-fade-up">
        <!-- Hero card -->
        <div class="hero-card">
          <p class="label">${greeting()}, ${state.name}</p>
          <h1 class="hero-title">Daily mental gym</h1>
          <p style="color:var(--muted); font-size:14px; margin-top:0.5rem;">
            12 targeted micro-games to train focus, working memory, and mental agility.
          </p>
          <div class="quick-stats-grid">
            <div class="stat-cell">
              <span class="label">Brain Score</span>
              <p class="num text-4xl mt-2">${stats.brainScore.toLocaleString()}</p>
            </div>
            <div class="stat-cell">
              <span class="label">Daily Streak</span>
              <p class="num text-4xl mt-2">${state.streak} <span style="font-size:14px; color:var(--muted)">days</span></p>
            </div>
            <div class="stat-cell">
              <span class="label">Total Sessions</span>
              <p class="num text-4xl mt-2">${stats.totalGames} <span style="font-size:14px; color:var(--muted)">runs</span></p>
            </div>
          </div>
        </div>

        <!-- Daily Challenge Banner -->
        <div class="card p-6 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style="padding:1.5rem; margin-bottom:2rem;">
          <div>
            <div style="display:flex; align-items:center; gap:0.5rem; margin-bottom:0.4rem;">
              <span class="label" style="color:var(--text)">Daily Workout</span>
              <span class="label">${day}</span>
              ${dailyCompleted ? '<span class="stat-pill" style="color:var(--good); font-weight:600;">✓ DONE</span>' : ""}
            </div>
            <p style="color:var(--muted); font-size:14px;">
              ${dailyCompleted ? "You completed today's 3-game workout! Streak maintained." : "3 quick exercises to lock in your daily streak."}
            </p>
          </div>
          <button type="button" class="btn-play box-fill tap" id="home-start-daily" style="max-width:220px;">
            ${dailyCompleted ? "Replay Workout" : "Start Daily Challenge"}
          </button>
        </div>

        <!-- Skills snapshot -->
        <div class="grid md:grid-cols-2 gap-8 mb-8" style="display:grid; grid-template-columns:repeat(auto-fit, minmax(300px, 1fr)); gap:2rem; margin-bottom:2rem;">
          <div class="card p-6" style="padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <span class="label">Skill Matrix</span>
              <button class="label tap" id="link-to-progress" style="color:var(--text)">View all →</button>
            </div>
            <div class="skills-list">
              ${SKILL_ORDER.slice(0, 4).map((key) => `
                <div class="skill-bar-row">
                  <div class="skill-bar-header">
                    <span style="font-weight:500;">${SKILLS[key].label}</span>
                    <span class="num">${stats.skillRatings[key] || 0}/100</span>
                  </div>
                  <div class="skill-track">
                    <div class="skill-fill" style="width:${stats.skillRatings[key] || 0}%"></div>
                  </div>
                </div>
              `).join("")}
            </div>
          </div>

          <div class="card p-6" style="padding:1.5rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
              <span class="label">Today's Picks</span>
              <button class="label tap" id="link-to-games" style="color:var(--text)">All games →</button>
            </div>
            <div style="display:flex; flex-direction:column; gap:0.75rem;">
              ${dailyGames.map((gid) => {
      const g = GAME_MAP[gid];
      const best = stats.bests[gid] || 0;
      return `
                  <div class="card-2 p-3 flex justify-between items-center tap" style="padding:0.75rem 1rem; display:flex; justify-content:space-between; align-items:center; cursor:pointer;" data-play="${g.id}">
                    <div>
                      <p style="font-weight:500; font-size:14px;">${g.title}</p>
                      <span class="label">${g.skill} · best: ${best.toLocaleString()}</span>
                    </div>
                    <span class="label box-fill p-2" style="padding:0.35rem 0.75rem;">PLAY</span>
                  </div>
                `;
    }).join("")}
            </div>
          </div>
        </div>

      
    `;

    container.querySelector("#home-start-daily").onclick = () => navigateTo("daily");
    container.querySelector("#link-to-progress").onclick = () => navigateTo("progress");
    container.querySelector("#link-to-games").onclick = () => navigateTo("games");
    const apkBtn = container.querySelector("#btn-download-apk");
    if (apkBtn) {
      apkBtn.onclick = () => {
        sfx.tap();
        showToast("Starting Download", "Downloading Brainlytics.apk directly to your device...");
      };
    }
    container.querySelectorAll("[data-play]").forEach((el) => {
      el.onclick = () => startSingleGame(el.dataset.play);
    });
  }

  // --- GAMES CATALOG ---
  function renderGames() {
    const stats = computeStats(state.sessions, state.dailies, state.streak, GAMES);
    const container = document.getElementById("view-games");
    let currentFilter = "all";

    function renderCards() {
      const filtered = currentFilter === "all" ? GAMES : GAMES.filter((g) => g.skill === currentFilter || g.secondary === currentFilter);
      return filtered.map((game) => {
        const best = stats.bests[game.id] || 0;
        const modeDesc = game.config.durationSec ? `${game.config.durationSec}s countdown` : game.config.lives ? `${game.config.lives} lives` : `${game.config.rounds} rounds`;
        return `
          <div class="game-card">
            <div>
              <div class="game-card-header">
                <span class="game-number">0${game.n}</span>
                <span class="stat-pill label">${game.skill}</span>
              </div>
              <h3 class="game-card-title">${game.title}</h3>
              <p class="game-card-desc">${game.howTo}</p>
            </div>
            <div>
              <div style="display:flex; justify-content:space-between; font-size:12px; margin-bottom:1rem; border-top:1px solid var(--line); padding-top:0.75rem;">
                <span style="color:var(--muted);">${modeDesc}</span>
                <span class="num font-bold">PB: ${best.toLocaleString()}</span>
              </div>
              <button type="button" class="btn-play box-fill tap" data-game="${game.id}">
                Play Now
              </button>
            </div>
          </div>
        `;
      }).join("");
    }

    container.innerHTML = `
      <div class="site-container animate-fade-up">
        <div style="margin-bottom:1.5rem;">
          <p class="label">Gym Catalog</p>
          <h1 class="hero-title" style="font-size:2.8rem;">All 12 Mini-Games</h1>
        </div>

        <div class="filter-tabs">
          <button class="filter-btn active" data-filter="all">All (12)</button>
          ${SKILL_ORDER.map((s) => `<button class="filter-btn" data-filter="${s}">${SKILLS[s].label}</button>`).join("")}
        </div>

        <div class="games-grid" id="games-grid-body">
          ${renderCards()}
        </div>
      </div>
    `;

    const gridBody = container.querySelector("#games-grid-body");
    container.querySelectorAll(".filter-btn").forEach((btn) => {
      btn.onclick = () => {
        container.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        gridBody.innerHTML = renderCards();
        attachPlayHandlers();
      };
    });

    function attachPlayHandlers() {
      gridBody.querySelectorAll(".btn-play").forEach((btn) => {
        btn.onclick = () => startSingleGame(btn.dataset.game);
      });
    }

    attachPlayHandlers();
  }

  // --- DAILY WORKOUT LOOP ---
  function renderDaily() {
    const day = todayKey();
    const dailyGames = dailyGamesFor(day);
    const existing = (state.dailies || []).find((d) => d.day === day && d.completed);

    const container = document.getElementById("view-daily");
    container.innerHTML = `
      <div class="site-container animate-fade-up" style="max-width:680px;">
        <div class="hero-card text-center" style="text-align:center; padding:2.5rem 1.5rem;">
          <span class="label">Daily Training</span>
          <h1 class="hero-title" style="font-size:2.8rem; margin:0.5rem 0;">Workout for ${day}</h1>
          <p style="color:var(--muted); font-size:14px; max-width:440px; margin:0 auto 1.5rem;">
            ${existing ? "You have already completed today's challenge! You can train again to set higher scores." : "Complete all 3 exercises sequentially to build your brain streak."}
          </p>

          <div style="display:flex; flex-direction:column; gap:0.75rem; text-align:left; margin-bottom:2rem;">
            ${dailyGames.map((gid, idx) => {
      const g = GAME_MAP[gid];
      return `
                <div class="card p-4 flex items-center justify-between" style="padding:1rem 1.25rem; display:flex; justify-content:space-between; align-items:center;">
                  <div>
                    <span class="label">Game 0${idx + 1}</span>
                    <p style="font-size:16px; font-weight:500;">${g.title}</p>
                    <span style="font-size:12px; color:var(--muted);">${g.tagline}</span>
                  </div>
                  <span class="stat-pill label">${g.skill}</span>
                </div>
              `;
    }).join("")}
          </div>

          <button type="button" class="btn-play box-fill tap" id="btn-begin-daily" style="max-width:280px; margin:0 auto; padding:1.1rem;">
            ${existing ? "Replay Challenge" : "Begin Challenge"}
          </button>
        </div>
      </div>
    `;

    container.querySelector("#btn-begin-daily").onclick = () => {
      startDailyChallenge(dailyGames);
    };
  }

  function startDailyChallenge(gameList) {
    let step = 0;
    const results = [];

    function playNext() {
      if (step >= gameList.length) {
        // Daily Completed!
        const totalScore = results.reduce((acc, r) => acc + r.score, 0);
        const totalRounds = results.reduce((acc, r) => acc + r.rounds, 0);
        const totalCorrect = results.reduce((acc, r) => acc + r.correct, 0);
        const accuracy = totalRounds ? Math.round((totalCorrect / totalRounds) * 1000) / 10 : 0;
        const day = todayKey();

        const others = (state.dailies || []).filter((d) => d.day !== day);
        const updatedDailies = [
          ...others,
          { day, totalScore, accuracy, completed: true, games: gameList },
        ];
        const streak = nextStreak(state.playDays, day, state.streak);

        commitState({
          dailies: updatedDailies,
          streak,
        });

        sfx.finish();
        showToast("Daily Challenge Complete!", `Total Score: ${totalScore.toLocaleString()} · ${streak} day streak!`);
        navigateTo("daily");
        return;
      }

      const gameId = gameList[step];
      launchGameStage(gameId, {
        banner: `Daily Workout · Game ${step + 1} of ${gameList.length}`,
        nextLabel: step === gameList.length - 1 ? "Finish Workout" : "Next Game →",
        onSession(res) {
          results.push(res);
          recordSession(res);
        },
        onNext() {
          step += 1;
          playNext();
        },
      });
    }

    playNext();
  }

  // --- PROGRESS / ANALYTICS VIEW ---
  function renderProgress() {
    const stats = computeStats(state.sessions, state.dailies, state.streak, GAMES);
    const container = document.getElementById("view-progress");

    container.innerHTML = `
      <div class="site-container animate-fade-up">
        <div style="margin-bottom:1.5rem;">
          <p class="label">Analytics & Tracking</p>
          <h1 class="hero-title" style="font-size:2.8rem;">Cognitive Progress</h1>
        </div>

        <div class="hero-card">
          <span class="label">Overall Rating</span>
          <p class="num" style="font-size:4.5rem; font-weight:300; margin:0.5rem 0;">${stats.brainScore.toLocaleString()}</p>
          <p style="color:var(--muted); font-size:13px;">Calculated across 6 cognitive domains from ${stats.totalGames} sessions.</p>

          <div class="quick-stats-grid" style="margin-top:1.5rem;">
            <div class="stat-cell">
              <span class="label">Best Reaction</span>
              <p class="num text-3xl mt-1">${stats.bestReaction ? `${stats.bestReaction} ms` : "—"}</p>
            </div>
            <div class="stat-cell">
              <span class="label">Best Accuracy</span>
              <p class="num text-3xl mt-1">${stats.bestAccuracy ? `${stats.bestAccuracy}%` : "—"}</p>
            </div>
            <div class="stat-cell">
              <span class="label">Max Combo</span>
              <p class="num text-3xl mt-1">${stats.maxCombo ? `${stats.maxCombo}x` : "—"}</p>
            </div>
          </div>
        </div>

        <!-- Skills Breakdown -->
        <div class="card p-6 mb-8" style="padding:1.5rem; margin-bottom:2rem;">
          <h3 class="label mb-4" style="font-size:12px; color:var(--text);">Domain Breakdown</h3>
          <div class="skills-list">
            ${SKILL_ORDER.map((key) => `
              <div class="skill-bar-row">
                <div class="skill-bar-header">
                  <span style="font-weight:500;">${SKILLS[key].label}</span>
                  <span class="num font-bold">${stats.skillRatings[key] || 0} / 100</span>
                </div>
                <div class="skill-track">
                  <div class="skill-fill" style="width:${stats.skillRatings[key] || 0}%"></div>
                </div>
              </div>
            `).join("")}
          </div>
        </div>

        <!-- Session History -->
        <div class="card p-6" style="padding:1.5rem; overflow-x:auto;">
          <h3 class="label mb-4" style="font-size:12px; color:var(--text);">Recent Sessions</h3>
          ${state.sessions.length === 0 ? `
            <p style="color:var(--muted); font-size:13px; padding:1.5rem 0; text-align:center;">No training sessions recorded yet. Play a game to see stats!</p>
          ` : `
            <table class="session-table">
              <thead>
                <tr>
                  <th>Game</th>
                  <th>Score</th>
                  <th>Accuracy</th>
                  <th>Reaction</th>
                  <th>Level</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                ${state.sessions.slice(0, 15).map((s) => {
      const g = GAME_MAP[s.gameId] || { title: s.gameId };
      return `
                    <tr>
                      <td style="font-weight:500;">${g.title}</td>
                      <td class="num">${s.score.toLocaleString()}</td>
                      <td class="num">${s.accuracy}%</td>
                      <td class="num">${s.avgReactionMs ? `${s.avgReactionMs}ms` : "—"}</td>
                      <td class="num">L${s.level}</td>
                      <td style="color:var(--muted); font-size:12px;">${s.day}</td>
                    </tr>
                  `;
    }).join("")}
              </tbody>
            </table>
          `}
        </div>
      </div>
    `;
  }

  // --- PROFILE VIEW ---
  function renderProfile() {
    const stats = computeStats(state.sessions, state.dailies, state.streak, GAMES);
    const container = document.getElementById("view-profile");

    const AVATARS = ["diamond", "target", "bolt", "grid", "star", "focus", "pattern", "logic", "memory", "crown"];
    const unlockedSet = new Set(state.achievements);

    // Leaderboard cohort
    const BOT_PLAYERS = [
      { name: "NeuroPulse", avatar: "crown", base: 4200 },
      { name: "Synapse-9", avatar: "bolt", base: 3850 },
      { name: "CortexAlpha", avatar: "star", base: 3400 },
      { name: "MindDrift", avatar: "target", base: 2950 },
      { name: "AxonRider", avatar: "focus", base: 2600 },
      { name: "LogicLoop", avatar: "logic", base: 2100 },
      { name: "GridMaster", avatar: "grid", base: 1750 },
      { name: "ChronoTap", avatar: "pattern", base: 1400 },
      { name: "NovaThink", avatar: "memory", base: 950 },
    ];

    const leaders = [
      { name: state.name, avatar: state.avatar, score: stats.brainScore, isYou: true },
      ...BOT_PLAYERS.map((b) => ({ name: b.name, avatar: b.avatar, score: b.base, isYou: false })),
    ].sort((a, b) => b.score - a.score).map((p, idx) => ({ ...p, rank: idx + 1 }));

    container.innerHTML = `
      <div class="site-container animate-fade-up">
        <div style="margin-bottom:1.5rem;">
          <p class="label">Gym Pass</p>
          <h1 class="hero-title" style="font-size:2.8rem;">Player Profile</h1>
        </div>

        <div style="display:grid; grid-template-columns:repeat(auto-fit, minmax(320px, 1fr)); gap:2rem; margin-bottom:2rem;">
          <!-- Settings Card -->
          <div class="card p-6" style="padding:1.5rem;">
            <h3 class="label mb-4" style="font-size:12px; color:var(--text);">Player Settings</h3>
            <div style="margin-bottom:1.25rem;">
              <label class="label">Name</label>
              <input type="text" id="profile-name-input" class="input-text" value="${state.name}" maxlength="20" />
            </div>

            <div style="margin-bottom:1.25rem;">
              <label class="label">Avatar Icon</label>
              <div class="avatar-selector">
                ${AVATARS.map((av) => `
                  <button type="button" class="avatar-option tap ${state.avatar === av ? 'selected' : ''}" data-av="${av}">
                    ${av.slice(0, 1).toUpperCase()}
                  </button>
                `).join("")}
              </div>
            </div>

            <div style="display:flex; flex-direction:column; gap:0.75rem; border-top:1px solid var(--line); padding-top:1rem;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px;">Dark Theme</span>
                <button type="button" class="stat-pill tap" id="toggle-theme-btn">${state.settings.theme === "dark" ? "🌙 Dark" : "☀️ Light"}</button>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px;">Sound Effects</span>
                <button type="button" class="stat-pill tap" id="toggle-sound-btn">${state.settings.sound ? "🔊 On" : "🔇 Off"}</button>
              </div>
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <span style="font-size:14px;">Reset Progress</span>
                <button type="button" class="stat-pill tap" id="reset-data-btn" style="color:var(--bad);">Clear Data</button>
              </div>
            </div>
          </div>

          <!-- Leaderboard Card -->
          <div class="card p-6" style="padding:1.5rem;">
            <h3 class="label mb-4" style="font-size:12px; color:var(--text);">Cohort Leaderboard</h3>
            <div style="display:flex; flex-direction:column; gap:0.5rem;">
              ${leaders.map((p) => `
                <div class="card-2 p-3 flex justify-between items-center ${p.isYou ? 'box-fill' : ''}" style="padding:0.6rem 1rem; display:flex; justify-content:space-between; align-items:center;">
                  <div style="display:flex; align-items:center; gap:0.75rem;">
                    <span class="num" style="width:20px; font-weight:600;">#${p.rank}</span>
                    <span style="font-weight:500; font-size:14px;">${p.name} ${p.isYou ? '(You)' : ''}</span>
                  </div>
                  <span class="num font-bold">${p.score.toLocaleString()}</span>
                </div>
              `).join("")}
            </div>
          </div>
        </div>

        <!-- Achievements -->
        <div class="card p-6" style="padding:1.5rem;">
          <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem;">
            <h3 class="label" style="font-size:12px; color:var(--text);">Achievements (${unlockedSet.size}/${ACHIEVEMENTS.length})</h3>
            <span class="num label">${Math.round((unlockedSet.size / ACHIEVEMENTS.length) * 100)}%</span>
          </div>
          <div class="badges-grid">
            ${ACHIEVEMENTS.map((ach) => {
      const isUnlocked = unlockedSet.has(ach.id);
      return `
                <div class="badge-item ${isUnlocked ? '' : 'badge-locked'}">
                  <div class="badge-icon-box ${isUnlocked ? 'box-fill' : ''}">
                    ${isUnlocked ? "★" : "🔒"}
                  </div>
                  <div>
                    <p style="font-size:14px; font-weight:600;">${ach.title}</p>
                    <p style="font-size:12px; color:var(--muted);">${ach.desc}</p>
                  </div>
                </div>
              `;
    }).join("")}
          </div>
        </div>
      </div>
    `;

    // Event handlers
    const nameInput = container.querySelector("#profile-name-input");
    nameInput.onblur = () => {
      const val = nameInput.value.trim() || "Player";
      commitState({ name: val });
    };

    container.querySelectorAll(".avatar-option").forEach((btn) => {
      btn.onclick = () => {
        commitState({ avatar: btn.dataset.av });
        renderProfile();
      };
    });

    container.querySelector("#toggle-theme-btn").onclick = () => {
      const next = state.settings.theme === "dark" ? "light" : "dark";
      document.documentElement.classList.toggle("dark", next === "dark");
      commitState({ settings: { ...state.settings, theme: next } });
      renderProfile();
    };

    container.querySelector("#toggle-sound-btn").onclick = () => {
      const next = !state.settings.sound;
      configureAudio(next, state.settings.haptics);
      commitState({ settings: { ...state.settings, sound: next } });
      renderProfile();
    };

    container.querySelector("#reset-data-btn").onclick = () => {
      if (confirm("Are you sure you want to reset all games, scores, and streak history?")) {
        commitState({
          sessions: [],
          dailies: [],
          playDays: [],
          streak: 0,
          achievements: [],
        });
        renderProfile();
        showToast("Data Reset", "All past sessions cleared.");
      }
    };
  }

  // --- GAME PLAYER RUNNER ---
  function startSingleGame(gameId) {
    launchGameStage(gameId, {
      onSession: (res) => recordSession(res),
      onNext: () => startSingleGame(gameId),
      nextLabel: "Play Again",
    });
  }

  function launchGameStage(gameId, options = {}) {
    const game = GAME_MAP[gameId];
    if (!game) return;

    if (activeGameCleanup) {
      activeGameCleanup();
      activeGameCleanup = null;
    }
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }

    const overlay = document.getElementById("game-stage-overlay");
    overlay.style.display = "flex";

    const bestScore = (state.sessions || []).reduce((b, s) => (s.gameId === gameId && s.score > b ? s.score : b), 0);

    // Render Intro
    overlay.innerHTML = `
      <div class="game-stage-container animate-fade-up">
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:0.75rem; margin-bottom:1.5rem;">
          <span class="label">${options.banner || game.skill}</span>
          <button type="button" class="label tap" id="btn-exit-stage">✕ Exit</button>
        </div>

        <div class="game-center-box">
          <span class="label">Game 0${game.n}</span>
          <h2 class="hero-title" style="font-size:2.8rem; margin:0.4rem 0;">${game.title}</h2>
          <p style="font-size:14px; color:var(--muted); max-width:380px; margin:0 auto 1.5rem;">${game.howTo}</p>

          <div style="display:flex; gap:1.5rem; margin-bottom:2rem;">
            <div>
              <span class="label">Personal Best</span>
              <p class="num text-2xl font-bold mt-1">${bestScore.toLocaleString()}</p>
            </div>
            <div>
              <span class="label">Target Score</span>
              <p class="num text-2xl font-bold mt-1">${game.target.toLocaleString()}</p>
            </div>
          </div>

          <button type="button" class="btn-play box-fill tap" id="btn-start-countdown" style="max-width:240px; padding:1.1rem;">
            Ready
          </button>
        </div>
      </div>
    `;

    overlay.querySelector("#btn-exit-stage").onclick = () => {
      closeGameStage();
    };

    overlay.querySelector("#btn-start-countdown").onclick = () => {
      runCountdown();
    };

    function runCountdown() {
      let count = 3;
      overlay.innerHTML = `
        <div class="game-stage-container" style="display:flex; align-items:center; justify-content:center;">
          <div class="animate-pop text-center" style="text-align:center;">
            <p class="label mb-3">GET READY</p>
            <p class="num text-8xl font-light" id="countdown-num" style="font-size:7rem;">${count}</p>
          </div>
        </div>
      `;
      sfx.countdown(false);

      const countTimer = setInterval(() => {
        count -= 1;
        if (count > 0) {
          const el = document.getElementById("countdown-num");
          if (el) el.textContent = count;
          sfx.countdown(false);
        } else {
          clearInterval(countTimer);
          sfx.countdown(true);
          startGameLoop();
        }
      }, 700);
    }

    function startGameLoop() {
      const config = game.config;
      let timeLeft = config.durationSec || 0;
      let lives = config.lives || 3;
      let maxRounds = config.rounds || 0;
      let currentRound = 1;
      let score = 0;
      let combo = 0;
      let maxCombo = 0;
      let level = 1;
      let correctCount = 0;
      let totalReaction = 0;
      let reactionCount = 0;
      const startTime = Date.now();

      function updateHUD() {
        const hud = overlay.querySelector("#game-live-hud");
        if (!hud) return;
        hud.innerHTML = `
          <div class="game-hud-stat">
            <span class="label">${config.durationSec ? "Time Left" : config.lives ? "Lives" : "Round"}</span>
            <span class="num text-2xl">${config.durationSec ? `${timeLeft}s` : config.lives ? "♥".repeat(lives) : `${currentRound}/${maxRounds}`}</span>
          </div>
          <div class="game-hud-stat" style="text-align:center;">
            <span class="label">Combo</span>
            <span class="num text-2xl font-bold ${combo > 1 ? 'text-[var(--good)]' : ''}">${combo > 1 ? `${combo}x` : '—'}</span>
          </div>
          <div class="game-hud-stat" style="text-align:right;">
            <span class="label">Score</span>
            <span class="num text-2xl font-bold">${score.toLocaleString()}</span>
          </div>
        `;
      }

      overlay.innerHTML = `
        <div class="game-stage-container">
          <div class="game-hud" id="game-live-hud"></div>
          <div id="game-active-content" style="display:flex; flex-direction:column; flex:1;"></div>
        </div>
      `;

      updateHUD();

      if (config.durationSec) {
        gameInterval = setInterval(() => {
          timeLeft -= 1;
          updateHUD();
          if (timeLeft <= 0) {
            endGame("Time's up!");
          }
        }, 1000);
      }

      function loadNextRound() {
        if (activeGameCleanup) {
          activeGameCleanup();
          activeGameCleanup = null;
        }

        const contentEl = overlay.querySelector("#game-active-content");
        if (!contentEl) return;

        const handler = HANDLERS[gameId];
        if (!handler) {
          endGame("Game handler not found");
          return;
        }

        activeGameCleanup = handler.init(contentEl, {
          level,
          round: currentRound,
          timeLeft,
          onRound(res) {
            handleRoundResult(res);
          },
        });
      }

      function handleRoundResult(res) {
        if (res.correct) {
          correctCount += 1;
          combo += 1;
          if (combo > maxCombo) maxCombo = combo;
          sfx.correct();
          if (combo > 1 && combo % 5 === 0) sfx.combo(combo);
        } else {
          combo = 0;
          sfx.wrong();
          buzz(120);
          if (config.lives) {
            lives -= 1;
            if (lives <= 0) {
              endGame("Out of lives!");
              return;
            }
          }
        }

        if (res.reactionMs) {
          totalReaction += res.reactionMs;
          reactionCount += 1;
        }

        const pts = scoreForRound({
          correct: res.correct,
          reactionMs: res.reactionMs,
          points: res.points,
          combo,
          level,
        });
        score = Math.max(0, score + pts);

        // Level progression
        if (correctCount > 0 && correctCount % (config.levelUpEvery || 4) === 0) {
          level += 1;
        }

        currentRound += 1;
        if (config.rounds && currentRound > config.rounds) {
          endGame("Rounds complete!");
          return;
        }

        updateHUD();
        loadNextRound();
      }

      function endGame(reason) {
        if (activeGameCleanup) {
          activeGameCleanup();
          activeGameCleanup = null;
        }
        if (gameInterval) {
          clearInterval(gameInterval);
          gameInterval = null;
        }

        const durationMs = Date.now() - startTime;
        const totalRoundsPlayed = currentRound - 1 || 1;
        const accuracy = Math.round((correctCount / totalRoundsPlayed) * 1000) / 10;
        const avgReaction = reactionCount ? Math.round(totalReaction / reactionCount) : null;
        const isPB = score > bestScore;

        const sessionResult = {
          gameId,
          score,
          accuracy,
          maxCombo,
          level,
          rounds: totalRoundsPlayed,
          correct: correctCount,
          avgReactionMs: avgReaction,
          durationMs,
        };

        if (options.onSession) options.onSession(sessionResult);
        sfx.finish();

        overlay.innerHTML = `
          <div class="game-stage-container animate-fade-up">
            <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--line); padding-bottom:0.75rem; margin-bottom:1.5rem;">
              <span class="label">${game.title} · ${reason}</span>
              <button type="button" class="label tap" id="btn-done-exit">✕ Close</button>
            </div>

            <div class="results-modal">
              ${isPB ? '<span class="stat-pill" style="color:var(--good); font-weight:bold;">★ NEW PERSONAL BEST! ★</span>' : '<span class="label">SESSION COMPLETE</span>'}
              <p class="num results-score-big">${score.toLocaleString()}</p>

              <div class="results-stats-row">
                <div class="stat-cell">
                  <span class="label">Accuracy</span>
                  <p class="num text-2xl mt-1">${accuracy}%</p>
                </div>
                <div class="stat-cell">
                  <span class="label">Reaction</span>
                  <p class="num text-2xl mt-1">${avgReaction ? `${avgReaction}ms` : "—"}</p>
                </div>
                <div class="stat-cell">
                  <span class="label">Max Combo</span>
                  <p class="num text-2xl mt-1">${maxCombo}x</p>
                </div>
              </div>

              <div class="results-actions">
                <button type="button" class="card tap label" id="btn-results-exit">Exit</button>
                <button type="button" class="box-fill tap label font-bold" id="btn-results-next">${options.nextLabel || "Play Again"}</button>
              </div>
            </div>
          </div>
        `;

        overlay.querySelector("#btn-done-exit").onclick = closeGameStage;
        overlay.querySelector("#btn-results-exit").onclick = closeGameStage;
        overlay.querySelector("#btn-results-next").onclick = () => {
          if (options.onNext) options.onNext();
          else startSingleGame(gameId);
        };
      }

      loadNextRound();
    }
  }

  function closeGameStage() {
    if (activeGameCleanup) {
      activeGameCleanup();
      activeGameCleanup = null;
    }
    if (gameInterval) {
      clearInterval(gameInterval);
      gameInterval = null;
    }
    const overlay = document.getElementById("game-stage-overlay");
    overlay.style.display = "none";
    overlay.innerHTML = "";
    navigateTo(currentView);
  }

  // --- INITIALIZATION ---
  window.addEventListener("DOMContentLoaded", () => {
    // Attach top nav links
    document.querySelectorAll(".nav-link, .bottom-tab").forEach((btn) => {
      btn.onclick = (e) => {
        e.preventDefault();
        navigateTo(btn.dataset.view);
      };
    });

    // Quick toggles in header
    const themeBtn = document.getElementById("btn-quick-theme");
    if (themeBtn) {
      themeBtn.onclick = () => {
        const next = state.settings.theme === "dark" ? "light" : "dark";
        document.documentElement.classList.toggle("dark", next === "dark");
        commitState({ settings: { ...state.settings, theme: next } });
      };
    }

    const soundBtn = document.getElementById("btn-quick-sound");
    if (soundBtn) {
      soundBtn.onclick = () => {
        const next = !state.settings.sound;
        configureAudio(next, state.settings.haptics);
        commitState({ settings: { ...state.settings, sound: next } });
        soundBtn.textContent = next ? "🔊" : "🔇";
      };
    }

    // Hash router listener
    const hash = window.location.hash.replace("#/", "");
    if (["home", "games", "daily", "progress", "profile"].includes(hash)) {
      navigateTo(hash);
    } else {
      navigateTo("home");
    }

    updateNavStats();
  });
})();
