// All 12 Cognitive Mini-Games - Full Game Engine
(function (global) {
  function randInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function pick(items) {
    return items[Math.floor(Math.random() * items.length)];
  }

  function shuffle(items) {
    const copy = [...items];
    for (let i = copy.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  }

  function uniqueOptions(answer, count, spread = 4) {
    const options = new Set([answer]);
    let guard = 0;
    while (options.size < count && guard < 200) {
      guard += 1;
      const delta = randInt(1, spread) * (Math.random() < 0.5 ? -1 : 1);
      const candidate = answer + delta;
      if (candidate !== answer) options.add(candidate);
    }
    while (options.size < count) options.add(answer + options.size * 7 + 1);
    return shuffle([...options]);
  }

  const GAMES = [
    {
      id: "quick-math",
      n: 1,
      title: "Quick Math",
      glyph: "plus",
      skill: "math",
      secondary: "speed",
      tagline: "Solve fast, score big",
      howTo: "Solve the arithmetic problem as fast as you can. Faster answers earn bonus points.",
      target: 6000,
      config: { durationSec: 60, levelUpEvery: 5 },
    },
    {
      id: "memory-grid",
      n: 2,
      title: "Memory Grid",
      glyph: "grid",
      skill: "memory",
      secondary: "focus",
      tagline: "Remember the squares",
      howTo: "Memorise the highlighted squares, then tap them once they hide.",
      target: 4000,
      config: { lives: 3, levelUpEvery: 3 },
    },
    {
      id: "color-switch",
      n: 3,
      title: "Ink Match",
      glyph: "overlap",
      skill: "focus",
      secondary: "speed",
      tagline: "Ink, not the word",
      howTo: "Tap the colour of the INK — ignore the word that is written.",
      target: 5000,
      config: { durationSec: 45, levelUpEvery: 6 },
    },
    {
      id: "number-sequence",
      n: 4,
      title: "Number Sequence",
      glyph: "sequence",
      skill: "logic",
      secondary: "pattern",
      tagline: "What comes next?",
      howTo: "Work out the rule behind the numbers and pick the next value.",
      target: 3000,
      config: { lives: 3, levelUpEvery: 3 },
    },
    {
      id: "odd-one-out",
      n: 5,
      title: "Odd One Out",
      glyph: "odd",
      skill: "pattern",
      secondary: "focus",
      tagline: "Spot the difference",
      howTo: "One tile has a different shade. Find it as quickly as you can.",
      target: 3500,
      config: { lives: 3, levelUpEvery: 3 },
    },
    {
      id: "reaction-tap",
      n: 6,
      title: "Reaction Tap",
      glyph: "target",
      skill: "speed",
      tagline: "Wait... then tap!",
      howTo: "Wait for the screen to turn bright, then tap instantly. Tapping early costs you.",
      target: 3500,
      config: { rounds: 5 },
    },
    {
      id: "number-memory",
      n: 7,
      title: "Number Memory",
      glyph: "digits",
      skill: "memory",
      tagline: "Recall the digits",
      howTo: "A number flashes on screen. Type it back from memory. It gets longer.",
      target: 3500,
      config: { lives: 3, levelUpEvery: 1 },
    },
    {
      id: "logic-tiles",
      n: 8,
      title: "Logic Tiles",
      glyph: "tiles",
      skill: "logic",
      secondary: "pattern",
      tagline: "Which tile is next?",
      howTo: "Study the sequence of tiles and choose the one that continues it.",
      target: 3000,
      config: { lives: 3, levelUpEvery: 3 },
    },
    {
      id: "fast-count",
      n: 9,
      title: "Fast Count",
      glyph: "dots",
      skill: "focus",
      secondary: "speed",
      tagline: "Count at a glance",
      howTo: "Symbols flash by. Count how many match the target symbol.",
      target: 3500,
      config: { lives: 3, levelUpEvery: 3 },
    },
    {
      id: "direction-challenge",
      n: 10,
      title: "Direction",
      glyph: "arrow-up",
      skill: "speed",
      secondary: "focus",
      tagline: "Tap the right way",
      howTo: "Tap the button matching the arrow. Watch out — sometimes you must invert it.",
      target: 5000,
      config: { durationSec: 45, levelUpEvery: 6 },
    },
    {
      id: "word-memory",
      n: 11,
      title: "Word Memory",
      glyph: "lines",
      skill: "memory",
      secondary: "pattern",
      tagline: "Old words or new?",
      howTo: "Memorise the word list, then pick out only the words you saw before.",
      target: 3500,
      config: { lives: 3, levelUpEvery: 2 },
    },
    {
      id: "mental-rotation",
      n: 12,
      title: "Mental Rotation",
      glyph: "rotate",
      skill: "logic",
      secondary: "memory",
      tagline: "Rotate it in your mind",
      howTo: "Find the option that is the same shape rotated — not mirrored.",
      target: 3000,
      config: { lives: 3, levelUpEvery: 3 },
    },
  ];

  const GAME_MAP = {};
  GAMES.forEach((g) => {
    GAME_MAP[g.id] = g;
  });

  function dailyGamesFor(dayKey) {
    let hash = 0;
    for (let i = 0; i < dayKey.length; i += 1) {
      hash = (hash * 31 + dayKey.charCodeAt(i)) % 100000;
    }
    const pool = GAMES.map((g) => g.id);
    const pickedGames = [];
    let cursor = hash;
    while (pickedGames.length < 3) {
      cursor = (cursor * 1103515245 + 12345) % 2147483647;
      const index = cursor % pool.length;
      pickedGames.push(pool[index]);
      pool.splice(index, 1);
    }
    return pickedGames;
  }

  // --- GAME IMPLEMENTATIONS ---
  const GAME_HANDLERS = {
    // 1. Quick Math
    "quick-math": {
      init(container, { level, onRound }) {
        const ops = level <= 1 ? ["+", "-"] : level === 2 ? ["+", "-", "×"] : ["+", "-", "×", "÷"];
        const op = pick(ops);
        let a, b, answer;
        switch (op) {
          case "+":
            a = randInt(level >= 3 ? 24 : 6, level >= 3 ? 89 : 25);
            b = randInt(level >= 3 ? 18 : 5, level >= 3 ? 79 : 25);
            answer = a + b;
            break;
          case "-":
            a = randInt(level >= 3 ? 45 : 14, level >= 3 ? 99 : 30);
            b = randInt(4, a - 1);
            answer = a - b;
            break;
          case "×":
            a = randInt(level >= 4 ? 11 : 3, level >= 4 ? 19 : 9);
            b = randInt(level >= 4 ? 11 : 3, level >= 4 ? 15 : 9);
            answer = a * b;
            break;
          case "÷":
            b = randInt(2, level >= 4 ? 13 : 9);
            answer = randInt(3, level >= 4 ? 14 : 9);
            a = b * answer;
            break;
          default:
            a = randInt(5, 30);
            b = randInt(5, 30);
            answer = a + b;
        }

        let questionText = `${a} ${op} ${b}`;
        if (level >= 5 && Math.random() < 0.4) {
          const c = randInt(3, 25);
          questionText = `${a} ${op} ${b} + ${c}`;
          answer += c;
        }

        const options = shuffle(uniqueOptions(answer, 4, 6));
        const start = Date.now();

        container.innerHTML = `
          <div class="game-content-wrap">
            <div class="game-center-box animate-pop">
              <p class="num text-5xl">${questionText}</p>
              <p class="label mt-3">= ?</p>
            </div>
            <div class="choices-grid">
              ${options.map((opt, i) => `
                <button type="button" class="choice-btn tap" data-value="${opt}">
                  <span class="key-hint">${i + 1}</span>
                  <span class="num text-2xl">${opt}</span>
                </button>
              `).join("")}
            </div>
          </div>
        `;

        const buttons = container.querySelectorAll(".choice-btn");
        let answered = false;

        function handlePick(val, btn) {
          if (answered) return;
          answered = true;
          const correct = Number(val) === answer;
          if (btn) btn.classList.add(correct ? "btn-correct" : "btn-wrong");
          buttons.forEach((b) => {
            if (Number(b.dataset.value) === answer) b.classList.add("btn-correct");
            b.disabled = true;
          });
          setTimeout(() => {
            onRound({ correct, reactionMs: Date.now() - start });
          }, correct ? 140 : 450);
        }

        buttons.forEach((btn) => {
          btn.onclick = () => handlePick(btn.dataset.value, btn);
        });

        const onKey = (e) => {
          const n = Number(e.key);
          if (n >= 1 && n <= options.length && buttons[n - 1]) {
            handlePick(options[n - 1], buttons[n - 1]);
          }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      },
    },

    // 2. Memory Grid
    "memory-grid": {
      init(container, { level, onRound }) {
        const SIZES = [3, 4, 4, 5, 5, 6];
        const size = SIZES[Math.min(SIZES.length - 1, level - 1)];
        const targetCount = Math.min(size * size - 3, 2 + level);
        const cells = Array.from({ length: size * size }, (_, i) => i);
        const chosen = new Set(shuffle(cells).slice(0, targetCount));
        const selected = new Set();
        let phase = "show";

        function render() {
          container.innerHTML = `
            <div class="game-content-wrap">
              <div class="game-prompt">
                ${phase === "show" ? "Memorise" : phase === "recall" ? "Tap the squares" : "Like this"}
              </div>
              <div class="grid-board" style="grid-template-columns: repeat(${size}, minmax(0, 1fr));">
                ${Array.from({ length: size * size }, (_, idx) => {
                  const isTarget = chosen.has(idx);
                  const isPicked = selected.has(idx);
                  let stateClass = "cell-idle";
                  if (phase === "show") {
                    if (isTarget) stateClass = "cell-lit";
                  } else if (phase === "recall") {
                    if (isPicked) stateClass = "cell-lit";
                  } else {
                    if (isTarget && isPicked) stateClass = "cell-lit";
                    else if (isPicked && !isTarget) stateClass = "cell-wrong";
                    else if (isTarget && !isPicked) stateClass = "cell-missed";
                  }
                  return `<button type="button" class="grid-cell tap ${stateClass}" data-idx="${idx}"></button>`;
                }).join("")}
              </div>
              <p class="label text-center">${selected.size}/${targetCount} selected</p>
            </div>
          `;

          if (phase === "recall") {
            container.querySelectorAll(".grid-cell").forEach((cell) => {
              cell.onclick = () => {
                const idx = Number(cell.dataset.idx);
                if (selected.has(idx)) return;
                selected.add(idx);
                cell.classList.add("cell-lit");
                Sound.sfx.tap();
                if (selected.size >= targetCount) {
                  submit();
                } else {
                  render();
                }
              };
            });
          }
        }

        function submit() {
          phase = "reveal";
          render();
          const misses = [...chosen].filter((c) => !selected.has(c)).length;
          const wrongs = [...selected].filter((c) => !chosen.has(c)).length;
          const correct = misses === 0 && wrongs === 0;
          setTimeout(() => {
            onRound({ correct });
          }, correct ? 350 : 900);
        }

        render();
        const showMs = Math.max(700, 500 + targetCount * 380);
        const timerId = setTimeout(() => {
          phase = "recall";
          render();
        }, showMs);

        return () => clearTimeout(timerId);
      },
    },

    // 3. Color Switch (Ink Match)
    "color-switch": {
      init(container, { level, onRound }) {
        const PALETTE = [
          { name: "RED", hex: "#e11d48" },
          { name: "BLUE", hex: "#2563eb" },
          { name: "GREEN", hex: "#16a34a" },
          { name: "YELLOW", hex: "#ca8a04" },
          { name: "PURPLE", hex: "#7c3aed" },
          { name: "ORANGE", hex: "#ea580c" },
        ];

        const poolSize = Math.min(PALETTE.length, 4 + Math.floor(level / 2));
        const pool = shuffle(PALETTE).slice(0, poolSize);
        const ink = pick(pool);
        const conflicting = level < 2 && Math.random() < 0.3;
        const word = conflicting ? ink : pick(pool.filter((c) => c.name !== ink.name));
        const distractors = shuffle(pool.filter((c) => c.name !== ink.name)).slice(0, 3);
        const options = shuffle([ink, ...distractors]);
        const start = Date.now();
        let answered = false;

        container.innerHTML = `
          <div class="game-content-wrap">
            <div class="game-center-box">
              <p class="label">Tap the ink colour</p>
              <p class="animate-pop num text-6xl uppercase" style="color: ${ink.hex}; font-weight: 600;">
                ${word.name}
              </p>
            </div>
            <div class="choices-grid">
              ${options.map((opt, i) => `
                <button type="button" class="choice-btn tap" data-name="${opt.name}">
                  <span class="key-hint">${i + 1}</span>
                  <span class="color-dot" style="background: ${opt.hex}"></span>
                  <span class="text-sm uppercase tracking-widest">${opt.name}</span>
                </button>
              `).join("")}
            </div>
          </div>
        `;

        const buttons = container.querySelectorAll(".choice-btn");

        function handlePick(colorName, btn) {
          if (answered) return;
          answered = true;
          const correct = colorName === ink.name;
          if (btn) btn.classList.add(correct ? "btn-correct" : "btn-wrong");
          buttons.forEach((b) => {
            if (b.dataset.name === ink.name) b.classList.add("btn-correct");
            b.disabled = true;
          });
          setTimeout(() => {
            onRound({ correct, reactionMs: Date.now() - start });
          }, correct ? 120 : 420);
        }

        buttons.forEach((btn) => {
          btn.onclick = () => handlePick(btn.dataset.name, btn);
        });

        const onKey = (e) => {
          const n = Number(e.key);
          if (n >= 1 && n <= options.length && buttons[n - 1]) {
            handlePick(options[n - 1].name, buttons[n - 1]);
          }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      },
    },

    // 4. Number Sequence
    "number-sequence": {
      init(container, { level, onRound }) {
        const kinds = level <= 1 ? ["add", "sub"] : level === 2 ? ["add", "sub", "mul", "alt"] : ["mul", "alt", "square", "fib"];
        const kind = shuffle(kinds)[0];
        let terms = [], answer = 0;
        if (kind === "add") {
          const step = randInt(2, 4 + level * 2);
          const start = randInt(1, 12);
          terms = [start, start + step, start + step * 2, start + step * 3];
          answer = start + step * 4;
        } else if (kind === "sub") {
          const step = randInt(2, 5 + level);
          const start = randInt(60, 120);
          terms = [start, start - step, start - step * 2, start - step * 3];
          answer = start - step * 4;
        } else if (kind === "mul") {
          const ratio = level >= 4 ? randInt(2, 3) : 2;
          const start = randInt(2, 5);
          terms = [start, start * ratio, start * (ratio ** 2), start * (ratio ** 3)];
          answer = start * (ratio ** 4);
        } else if (kind === "square") {
          const start = randInt(1, 4);
          terms = [0, 1, 2, 3].map((i) => (start + i) ** 2);
          answer = (start + 4) ** 2;
        } else {
          let a = randInt(1, 4), b = randInt(2, 6);
          terms = [];
          for (let i = 0; i < 4; i += 1) {
            terms.push(a);
            const next = a + b;
            a = b;
            b = next;
          }
          answer = a;
        }

        const options = shuffle(uniqueOptions(answer, 4, Math.max(3, 9 - level)));
        const start = Date.now();
        let answered = false;

        container.innerHTML = `
          <div class="game-content-wrap">
            <div class="game-center-box">
              <div class="sequence-strip">
                ${terms.map((t) => `<span class="seq-item num">${t}</span>`).join("")}
                <span class="seq-item seq-mystery animate-blink">?</span>
              </div>
            </div>
            <div class="choices-grid">
              ${options.map((opt, i) => `
                <button type="button" class="choice-btn tap" data-value="${opt}">
                  <span class="key-hint">${i + 1}</span>
                  <span class="num text-2xl">${opt}</span>
                </button>
              `).join("")}
            </div>
          </div>
        `;

        const buttons = container.querySelectorAll(".choice-btn");
        function handlePick(val, btn) {
          if (answered) return;
          answered = true;
          const correct = Number(val) === answer;
          if (btn) btn.classList.add(correct ? "btn-correct" : "btn-wrong");
          buttons.forEach((b) => {
            if (Number(b.dataset.value) === answer) b.classList.add("btn-correct");
            b.disabled = true;
          });
          setTimeout(() => {
            onRound({ correct, reactionMs: Date.now() - start });
          }, correct ? 140 : 450);
        }

        buttons.forEach((btn) => {
          btn.onclick = () => handlePick(btn.dataset.value, btn);
        });

        const onKey = (e) => {
          const n = Number(e.key);
          if (n >= 1 && n <= options.length && buttons[n - 1]) {
            handlePick(options[n - 1], buttons[n - 1]);
          }
        };
        window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
      },
    },

    // 5. Odd One Out
    "odd-one-out": {
      init(container, { level, onRound }) {
        const SIZES = [3, 3, 4, 4, 5, 6];
        const size = SIZES[Math.min(SIZES.length - 1, level - 1)];
        const baseLight = randInt(40, 62);
        const delta = Math.max(3, 22 - level * 3);
        const oddIndex = randInt(0, size * size - 1);
        let locked = false;

        container.innerHTML = `
          <div class="game-content-wrap">
            <div class="game-prompt">Tap the odd shade</div>
            <div class="grid-board" style="grid-template-columns: repeat(${size}, minmax(0, 1fr));">
              ${Array.from({ length: size * size }, (_, idx) => {
                const isOdd = idx === oddIndex;
                const light = isOdd ? baseLight + delta : baseLight;
                return `<button type="button" class="grid-cell tap" data-idx="${idx}" style="background: hsl(0 0% ${light}%);"></button>`;
              }).join("")}
            </div>
          </div>
        `;

        container.querySelectorAll(".grid-cell").forEach((cell) => {
          cell.onclick = () => {
            if (locked) return;
            locked = true;
            const idx = Number(cell.dataset.idx);
            const correct = idx === oddIndex;
            cell.classList.add(correct ? "cell-lit" : "cell-wrong");
            setTimeout(() => {
              onRound({ correct });
            }, correct ? 140 : 500);
          };
        });

        return () => {};
      },
    },

    // 6. Reaction Tap
    "reaction-tap": {
      init(container, { round, onRound }) {
        let phase = "wait";
        let goAt = 0;
        let reported = false;

        container.innerHTML = `
          <div class="reaction-arena tap" id="reaction-zone">
            <span class="num text-5xl uppercase tracking-wider" id="reaction-title">Wait...</span>
            <span class="label" id="reaction-sub">Round ${round}</span>
            <span class="label mt-2">Space or click anywhere</span>
            <div id="reaction-result" class="num text-3xl mt-4"></div>
          </div>
        `;

        const zone = container.querySelector("#reaction-zone");
        const title = container.querySelector("#reaction-title");
        const sub = container.querySelector("#reaction-sub");
        const res = container.querySelector("#reaction-result");

        function report(correct, ms) {
          if (reported) return;
          reported = true;
          const points = correct && ms ? Math.max(60, Math.round(1150 - ms)) : undefined;
          setTimeout(() => {
            onRound({ correct, reactionMs: ms, points });
          }, correct ? 600 : 700);
        }

        const delay = randInt(1200, 3200);
        const timerId = setTimeout(() => {
          if (phase === "wait") {
            phase = "go";
            goAt = Date.now();
            zone.classList.add("reaction-go");
            title.textContent = "TAP NOW!";
            sub.textContent = "Click as fast as you can!";
          }
        }, delay);

        function handleTrigger() {
          if (phase === "wait") {
            clearTimeout(timerId);
            phase = "done";
            zone.classList.add("reaction-fail");
            title.textContent = "TOO EARLY!";
            sub.textContent = "Penalty: wait for the screen to turn white!";
            report(false);
          } else if (phase === "go") {
            phase = "done";
            const ms = Date.now() - goAt;
            title.textContent = "NICE!";
            res.textContent = `${ms} ms`;
            report(true, ms);
          }
        }

        zone.onclick = handleTrigger;
        const onKey = (e) => {
          if (e.key === " " || e.key === "Enter") {
            e.preventDefault();
            handleTrigger();
          }
        };
        window.addEventListener("keydown", onKey);

        return () => {
          clearTimeout(timerId);
          window.removeEventListener("keydown", onKey);
        };
      },
    },

    // 7. Number Memory
    "number-memory": {
      init(container, { level, onRound }) {
        const digits = Math.min(9, 2 + level);
        let target = "";
        for (let i = 0; i < digits; i += 1) target += String(Math.floor(Math.random() * 10));

        let entry = "";
        let phase = "show";

        function render() {
          container.innerHTML = `
            <div class="game-content-wrap">
              <div class="game-prompt">${phase === "show" ? "Memorise the number" : "Type it back"}</div>
              <div class="number-display">
                ${phase === "show" ? `<span class="animate-pop num text-5xl tracking-widest">${target}</span>` : `<span class="num text-5xl tracking-widest">${entry || "·····"}</span>`}
              </div>
              ${phase === "input" ? `
                <div class="keypad-grid">
                  ${[1, 2, 3, 4, 5, 6, 7, 8, 9].map((d) => `<button type="button" class="keypad-btn num" data-key="${d}">${d}</button>`).join("")}
                  <button type="button" class="keypad-btn label" data-key="clr">Clr</button>
                  <button type="button" class="keypad-btn num" data-key="0">0</button>
                  <button type="button" class="keypad-btn keypad-ok label" data-key="ok">OK</button>
                </div>
              ` : ""}
            </div>
          `;

          if (phase === "input") {
            container.querySelectorAll(".keypad-btn").forEach((btn) => {
              btn.onclick = () => {
                const k = btn.dataset.key;
                if (k === "clr") entry = "";
                else if (k === "ok") submit();
                else if (entry.length < 12) entry += k;
                Sound.sfx.tap();
                render();
              };
            });
          }
        }

        function submit() {
          if (!entry) return;
          const correct = entry === target;
          phase = "show";
          render();
          setTimeout(() => {
            onRound({ correct });
          }, correct ? 250 : 900);
        }

        render();
        const flashMs = 650 + target.length * 260;
        const timerId = setTimeout(() => {
          phase = "input";
          render();
        }, flashMs);

        const onKey = (e) => {
          if (phase !== "input") return;
          if (/^[0-9]$/.test(e.key) && entry.length < 12) {
            entry += e.key;
            render();
          } else if (e.key === "Backspace") {
            entry = entry.slice(0, -1);
            render();
          } else if (e.key === "Enter") {
            submit();
          }
        };
        window.addEventListener("keydown", onKey);

        return () => {
          clearTimeout(timerId);
          window.removeEventListener("keydown", onKey);
        };
      },
    },

    // 8. Logic Tiles
    "logic-tiles": {
      init(container, { level, onRound }) {
        const kinds = ["square", "diamond", "cross", "circle"];
        const chosenKind = pick(kinds);
        const baseRot = randInt(0, 3) * 45;
        const stepRot = 45;
        const terms = [0, 1, 2].map((i) => (baseRot + i * stepRot) % 360);
        const answer = (baseRot + 3 * stepRot) % 360;
        const options = shuffle([answer, (answer + 90) % 360, (answer + 180) % 360, (answer + 270) % 360]);
        let answered = false;

        function renderShape(deg, kind) {
          return `
            <svg viewBox="0 0 60 60" width="48" height="48" style="transform: rotate(${deg}deg)">
              <rect x="15" y="15" width="30" height="30" fill="currentColor" fill-opacity="0.2" stroke="currentColor" stroke-width="2" />
              <line x1="30" y1="5" x2="30" y2="15" stroke="currentColor" stroke-width="3" />
            </svg>
          `;
        }

        container.innerHTML = `
          <div class="game-content-wrap">
            <div class="game-prompt">Which tile comes next?</div>
            <div class="sequence-strip">
              ${terms.map((rot) => `<span class="seq-item">${renderShape(rot, chosenKind)}</span>`).join("")}
              <span class="seq-item seq-mystery animate-blink">?</span>
            </div>
            <div class="choices-grid">
              ${options.map((opt, i) => `
                <button type="button" class="choice-btn tap" data-value="${opt}">
                  <span class="key-hint">${i + 1}</span>
                  ${renderShape(opt, chosenKind)}
                </button>
              `).join("")}
            </div>
          </div>
        `;

        const buttons = container.querySelectorAll(".choice-btn");
        function handlePick(val, btn) {
          if (answered) return;
          answered = true;
          const correct = Number(val) === answer;
          if (btn) btn.classList.add(correct ? "btn-correct" : "btn-wrong");
          buttons.forEach((b) => {
            if (Number(b.dataset.value) === answer) b.classList.add("btn-correct");
            b.disabled = true;
          });
          setTimeout(() => {
            onRound({ correct });
          }, correct ? 140 : 500);
        }

        buttons.forEach((btn) => {
          btn.onclick = () => handlePick(btn.dataset.value, btn);
        });

        return () => {};
      },
    },

    // 9. Fast Count
    "fast-count": {
      init(container, { level, onRound }) {
        const SYMBOLS = ["▲", "●", "■", "◆", "★", "✚"];
        const cols = Math.min(6, 4 + Math.floor(level / 2));
        const rows = Math.min(5, 3 + Math.floor(level / 3));
        const variety = Math.min(SYMBOLS.length, 2 + Math.floor(level / 2));
        const pool = shuffle(SYMBOLS).slice(0, variety);
        const target = pool[0];
        const cells = [];
        let targetCount = 0;

        for (let i = 0; i < cols * rows; i += 1) {
          const sym = Math.random() < 0.32 ? target : shuffle(pool)[0];
          if (sym === target) targetCount += 1;
          cells.push(sym);
        }
        if (targetCount === 0) {
          cells[0] = target;
          targetCount = 1;
        }

        const options = shuffle(uniqueOptions(targetCount, 4, 3));
        let phase = "show";
        let answered = false;

        function render() {
          container.innerHTML = `
            <div class="game-content-wrap">
              <div class="game-prompt">${phase === "show" ? `Remember the <span class="text-xl">${target}</span>` : `How many <span class="text-xl">${target}</span> were there?`}</div>
              <div class="grid-board" style="grid-template-columns: repeat(${cols}, minmax(0, 1fr));">
                ${cells.map((sym) => `
                  <span class="grid-cell flex items-center justify-center text-xl">
                    ${phase === "show" ? sym : ""}
                  </span>
                `).join("")}
              </div>
              ${phase === "answer" ? `
                <div class="choices-grid mt-4">
                  ${options.map((opt, i) => `
                    <button type="button" class="choice-btn tap" data-value="${opt}">
                      <span class="key-hint">${i + 1}</span>
                      <span class="num text-2xl">${opt}</span>
                    </button>
                  `).join("")}
                </div>
              ` : ""}
            </div>
          `;

          if (phase === "answer") {
            const buttons = container.querySelectorAll(".choice-btn");
            buttons.forEach((btn) => {
              btn.onclick = () => {
                if (answered) return;
                answered = true;
                const correct = Number(btn.dataset.value) === targetCount;
                btn.classList.add(correct ? "btn-correct" : "btn-wrong");
                buttons.forEach((b) => {
                  if (Number(b.dataset.value) === targetCount) b.classList.add("btn-correct");
                  b.disabled = true;
                });
                setTimeout(() => {
                  onRound({ correct });
                }, correct ? 140 : 500);
              };
            });
          }
        }

        render();
        const flashMs = Math.max(550, 1350 - level * 110);
        const timerId = setTimeout(() => {
          phase = "answer";
          render();
        }, flashMs);

        return () => clearTimeout(timerId);
      },
    },

    // 10. Direction Challenge
    "direction-challenge": {
      init(container, { level, onRound }) {
        const DIRECTIONS = [
          { key: "up", glyph: "↑", label: "Up" },
          { key: "right", glyph: "→", label: "Right" },
          { key: "down", glyph: "↓", label: "Down" },
          { key: "left", glyph: "←", label: "Left" },
        ];
        const OPPOSITE = { up: "down", down: "up", left: "right", right: "left" };
        const invert = level >= 2 && Math.random() < 0.25 + level * 0.05;
        const arrow = pick(DIRECTIONS);
        const expected = invert ? OPPOSITE[arrow.key] : arrow.key;
        const start = Date.now();
        let answered = false;

        container.innerHTML = `
          <div class="game-content-wrap">
            <div class="game-center-box">
              <span class="label ${invert ? 'text-invert' : ''}">${invert ? "OPPOSITE" : "MATCH"}</span>
              <span class="animate-pop num text-8xl leading-none mt-4">${arrow.glyph}</span>
            </div>
            <div class="choices-grid">
              ${DIRECTIONS.map((dir) => `
                <button type="button" class="choice-btn tap text-4xl" data-dir="${dir.key}">
                  ${dir.glyph}
                </button>
              `).join("")}
            </div>
          </div>
        `;

        const buttons = container.querySelectorAll(".choice-btn");
        function handlePick(dirKey, btn) {
          if (answered) return;
          answered = true;
          const correct = dirKey === expected;
          if (btn) btn.classList.add(correct ? "btn-correct" : "btn-wrong");
          buttons.forEach((b) => {
            if (b.dataset.dir === expected) b.classList.add("btn-correct");
            b.disabled = true;
          });
          setTimeout(() => {
            onRound({ correct, reactionMs: Date.now() - start });
          }, correct ? 90 : 400);
        }

        buttons.forEach((btn) => {
          btn.onclick = () => handlePick(btn.dataset.dir, btn);
        });

        const onKey = (e) => {
          const map = { ArrowUp: "up", ArrowDown: "down", ArrowLeft: "left", ArrowRight: "right" };
          if (map[e.key]) {
            e.preventDefault();
            const btn = container.querySelector(`[data-dir="${map[e.key]}"]`);
            handlePick(map[e.key], btn);
          }
        };
        window.addEventListener("keydown", onKey);

        return () => window.removeEventListener("keydown", onKey);
      },
    },

    // 11. Word Memory
    "word-memory": {
      init(container, { level, onRound }) {
        const POOL = [
          "APPLE", "TRAIN", "MOON", "CHAIR", "RIVER", "CLOUD", "STONE", "LEMON", "TIGER", "PLANT",
          "BREAD", "SMILE", "GLASS", "STORM", "PIANO", "CANDLE", "ROBOT", "ISLAND", "FEATHER", "MIRROR",
          "GARDEN", "BUTTON", "ORANGE", "SILVER", "THUNDER", "MARBLE", "VIOLET", "HORIZON",
        ];
        const count = Math.min(8, 3 + level);
        const words = shuffle(POOL).slice(0, count * 2);
        const originals = new Set(words.slice(0, count));
        const list = shuffle(words);
        const selected = new Set();
        let phase = "show";
        let checked = false;

        function render() {
          container.innerHTML = `
            <div class="game-content-wrap">
              <div class="game-prompt">
                ${phase === "show" ? `Memorise ${count} words` : "Select the words you saw"}
              </div>
              <div class="words-container">
                ${phase === "show" ? `
                  ${[...originals].map((w) => `<span class="word-tag animate-pop">${w}</span>`).join("")}
                ` : `
                  ${list.map((w) => {
                    const isSelected = selected.has(w);
                    let cls = isSelected ? "word-tag-selected" : "word-tag";
                    if (checked) {
                      if (originals.has(w)) cls = "word-tag-correct";
                      else if (isSelected) cls = "word-tag-wrong";
                    }
                    return `<button type="button" class="tap ${cls}" data-word="${w}">${w}</button>`;
                  }).join("")}
                `}
              </div>
              ${phase === "select" ? `
                <button type="button" class="btn-check box-fill label tap mt-4" id="check-words-btn" ${selected.size === 0 || checked ? "disabled" : ""}>
                  ${checked ? "Checking..." : `Check (${selected.size}/${count})`}
                </button>
              ` : ""}
            </div>
          `;

          if (phase === "select" && !checked) {
            container.querySelectorAll("button[data-word]").forEach((btn) => {
              btn.onclick = () => {
                const w = btn.dataset.word;
                if (selected.has(w)) selected.delete(w);
                else selected.add(w);
                Sound.sfx.tap();
                render();
              };
            });

            const checkBtn = container.querySelector("#check-words-btn");
            if (checkBtn) {
              checkBtn.onclick = () => {
                if (checked || selected.size === 0) return;
                checked = true;
                let hits = 0, falseAlarms = 0;
                for (const w of selected) {
                  if (originals.has(w)) hits += 1;
                  else falseAlarms += 1;
                }
                const correct = hits === originals.size && falseAlarms === 0;
                const points = Math.max(0, hits * 120 - falseAlarms * 60);
                render();
                setTimeout(() => {
                  onRound({ correct, points });
                }, correct ? 400 : 900);
              };
            }
          }
        }

        render();
        const flashMs = 1200 + count * 550;
        const timerId = setTimeout(() => {
          phase = "select";
          render();
        }, flashMs);

        return () => clearTimeout(timerId);
      },
    },

    // 12. Mental Rotation
    "mental-rotation": {
      init(container, { level, onRound }) {
        const SHAPES = [
          "M22 18 H62 V40 H44 V78 H22 Z",
          "M20 20 H60 L78 50 L60 80 H20 L38 50 Z",
          "M50 16 L82 40 L70 80 H30 L18 40 Z",
        ];
        const path = pick(SHAPES);
        const baseRotation = randInt(0, 3) * 90;
        const answerRotation = (baseRotation + randInt(1, 3) * 90) % 360;
        const correctOpt = { rotation: answerRotation, mirrored: false };
        const wrongs = shuffle([
          { rotation: (baseRotation + randInt(0, 3) * 90) % 360, mirrored: true },
          { rotation: (baseRotation + 180) % 360, mirrored: true },
          { rotation: randInt(0, 3) * 90, mirrored: true },
        ]);
        const options = shuffle([correctOpt, ...wrongs]);
        const start = Date.now();
        let answered = false;

        function svgShape(p, rot, mir, size = 64) {
          return `
            <svg viewBox="0 0 100 100" width="${size}" height="${size}">
              <g transform="rotate(${rot} 50 50) ${mir ? 'translate(100 0) scale(-1 1)' : ''}">
                <path d="${p}" fill="currentColor" fill-opacity="0.15" stroke="currentColor" stroke-width="3" stroke-linejoin="miter" />
              </g>
            </svg>
          `;
        }

        container.innerHTML = `
          <div class="game-content-wrap">
            <div class="game-prompt">Same shape, rotated?</div>
            <div class="rotation-reference">
              <span class="label">Reference</span>
              <div class="card p-3 inline-flex">${svgShape(path, baseRotation, false, 90)}</div>
            </div>
            <div class="choices-grid mt-4">
              ${options.map((opt, i) => `
                <button type="button" class="choice-btn tap flex items-center justify-center p-3" data-idx="${i}">
                  ${svgShape(path, opt.rotation, opt.mirrored, 60)}
                </button>
              `).join("")}
            </div>
          </div>
        `;

        const buttons = container.querySelectorAll(".choice-btn");
        buttons.forEach((btn) => {
          btn.onclick = () => {
            if (answered) return;
            answered = true;
            const idx = Number(btn.dataset.idx);
            const correct = !options[idx].mirrored;
            btn.classList.add(correct ? "btn-correct" : "btn-wrong");
            buttons.forEach((b, i) => {
              if (!options[i].mirrored) b.classList.add("btn-correct");
              b.disabled = true;
            });
            setTimeout(() => {
              onRound({ correct, reactionMs: Date.now() - start });
            }, correct ? 180 : 600);
          };
        });

        return () => {};
      },
    },
  };

  global.GamesEngine = {
    GAMES,
    GAME_MAP,
    dailyGamesFor,
    HANDLERS: GAME_HANDLERS,
  };
})(window);
