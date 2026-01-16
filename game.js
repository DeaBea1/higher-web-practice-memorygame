/**
 * Константы
 */
const DIFFICULTY_SETTINGS = {
  easy: { pairs: 6, attempts: 24, time: 120 },
  medium: { pairs: 8, attempts: 28, time: 180 },
  hard: { pairs: 12, attempts: 36, time: 180 },
};
const ICONS_ARRAY = [
  '🐶',
  '🐱',
  '🐭',
  '🐹',
  '🐰',
  '🦊',
  '🐻',
  '🐼',
  '🐨',
  '🐯',
  '🦁',
  '🐮',
  '🐷',
  '🐸',
  '🐵',
  '🐔',
];

const STORAGE_KEY = 'memoryGame.bestScores.v1';

/**
 * Основная функция игры
 */
function game() {
  const modeSelect = document.querySelector('#modeSelect');
  const difficultySelect = document.querySelector('#difficultySelect');
  const startButton = document.querySelector('#startButton');

  const settingsSection = document.querySelector('#settings');
  const gameSection = document.querySelector('#game');
  const recordsSection = document.querySelector('#records');

  const settingsCounterLabel = document.querySelector('#settingsCounterLabel');
  const settingsCounterValue = document.querySelector('#settingsCounterValue');

  const hudLeftLabel = document.querySelector('#hudLeftLabel');
  const hudLeftValue = document.querySelector('#hudLeftValue');
  const hudRightLabel = document.querySelector('#hudRightLabel');
  const hudRightValue = document.querySelector('#hudRightValue');
  const pairsValue = document.querySelector('#pairsValue');

  const board = document.querySelector('#board');
  const cardTemplate = document.querySelector('#cardTemplate');

  const newGameButton = document.querySelector('#newGameButton');
  const backToSettingsButton = document.querySelector('#backToSettingsButton');

  const recordsGrid = document.querySelector('#recordsGrid');
  const resetRecordsButton = document.querySelector('#resetRecordsButton');

  const resultModal = document.querySelector('#resultModal');
  const resultModalOverlay = document.querySelector('#resultModalOverlay');
  const resultModalTitle = document.querySelector('#resultModalTitle');
  const resultModalBody = document.querySelector('#resultModalBody');
  const resultModalRestart = document.querySelector('#resultModalRestart');
  const resultModalToSettings = document.querySelector('#resultModalToSettings');

  if (
    !modeSelect ||
    !difficultySelect ||
    !startButton ||
    !settingsSection ||
    !gameSection ||
    !settingsCounterLabel ||
    !settingsCounterValue ||
    !hudLeftLabel ||
    !hudLeftValue ||
    !hudRightLabel ||
    !hudRightValue ||
    !pairsValue ||
    !board ||
    !cardTemplate ||
    !newGameButton ||
    !backToSettingsButton ||
    !recordsGrid ||
    !resetRecordsButton ||
    !resultModal ||
    !resultModalOverlay ||
    !resultModalTitle ||
    !resultModalBody ||
    !resultModalRestart ||
    !resultModalToSettings
  ) {
    return;
  }

  const state = {
    opened: [],
    isLocked: false,
    matchedPairs: 0,
    totalPairs: 0,
    isGameStarted: false,
    isGameFinished: false,
    startedAtMs: 0,
    tickId: null,
    attemptsRemaining: 0,
    attemptsUsed: 0,
    timeRemainingSeconds: 0,
  };

  const MODES = [
    { id: 'simple', title: 'Простой' },
    { id: 'attempts', title: 'На попытки' },
    { id: 'time', title: 'На время' },
  ];
  const DIFFICULTIES = [
    { id: 'easy', title: 'Лёгкий' },
    { id: 'medium', title: 'Средний' },
    { id: 'hard', title: 'Сложный' },
  ];

  function getComboKey(mode, difficulty) {
    return `${mode}__${difficulty}`;
  }

  function getStoredScores() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return {};
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== 'object') return {};
      return parsed;
    } catch {
      return {};
    }
  }

  function setStoredScores(scores) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(scores));
  }

  function formatTime(seconds) {
    const safe = Math.max(0, Math.floor(seconds));
    const mm = String(Math.floor(safe / 60)).padStart(2, '0');
    const ss = String(safe % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }

  function getModeTitle(mode) {
    if (mode === 'attempts') return 'На попытки';
    if (mode === 'time') return 'На время';
    return 'Простой';
  }

  function getDifficultyTitle(difficulty) {
    if (difficulty === 'medium') return 'Средний';
    if (difficulty === 'hard') return 'Сложный';
    return 'Лёгкий';
  }

  function getRecordSubtitle(mode) {
    if (mode === 'attempts') return 'Минимум попыток';
    if (mode === 'time') return 'Максимум остатка времени';
    return 'Минимум времени прохождения';
  }

  function getElapsedSeconds() {
    if (!state.isGameStarted) return 0;
    return Math.max(0, Math.floor((Date.now() - state.startedAtMs) / 1000));
  }

  function shuffle(array) {
    for (let i = array.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  function getDifficulty() {
    const id = difficultySelect.value;
    return DIFFICULTY_SETTINGS[id] ? id : 'easy';
  }

  function getMode() {
    const id = modeSelect.value;
    if (id === 'attempts' || id === 'time') return id;
    return 'simple';
  }

  function getColumnsByDifficulty(difficulty) {
    if (difficulty === 'hard') return 6;
    return 4;
  }

  function updateSettingsCounter() {
    const mode = getMode();
    const difficulty = getDifficulty();
    const settings = DIFFICULTY_SETTINGS[difficulty];

    if (mode === 'attempts') {
      settingsCounterLabel.textContent = 'Попытки';
      settingsCounterValue.textContent = String(settings.attempts);
      return;
    }

    if (mode === 'time') {
      settingsCounterLabel.textContent = 'Время';
      settingsCounterValue.textContent = formatTime(settings.time);
      return;
    }

    settingsCounterLabel.textContent = 'Время';
    settingsCounterValue.textContent = '00:00';
  }

  function updateHud() {
    const mode = getMode();
    const difficulty = getDifficulty();
    const settings = DIFFICULTY_SETTINGS[difficulty];

    pairsValue.textContent = `${state.matchedPairs}/${state.totalPairs}`;

    if (mode === 'attempts') {
      hudLeftLabel.textContent = 'Время';
      hudLeftValue.textContent = formatTime(getElapsedSeconds());
      hudRightLabel.textContent = 'Осталось попыток';
      hudRightValue.textContent = String(state.attemptsRemaining);
      return;
    }

    if (mode === 'time') {
      hudLeftLabel.textContent = 'Осталось';
      hudLeftValue.textContent = formatTime(state.timeRemainingSeconds);
      hudRightLabel.textContent = 'Попытки';
      hudRightValue.textContent = '—';
      return;
    }

    hudLeftLabel.textContent = 'Время';
    hudLeftValue.textContent = formatTime(getElapsedSeconds());
    hudRightLabel.textContent = 'Попытки';
    hudRightValue.textContent = '—';
  }

  function setView(isGameVisible) {
    settingsSection.classList.toggle('is-hidden', isGameVisible);
    gameSection.classList.toggle('is-hidden', !isGameVisible);
    if (recordsSection) {
      recordsSection.classList.toggle('is-hidden', isGameVisible);
    }
  }

  function stopTick() {
    if (state.tickId) {
      clearInterval(state.tickId);
      state.tickId = null;
    }
  }

  function startTickIfNeeded() {
    if (state.tickId) return;

    state.tickId = setInterval(() => {
      if (!state.isGameStarted || state.isGameFinished) return;

      const mode = getMode();
      if (mode === 'time') {
        state.timeRemainingSeconds = Math.max(0, state.timeRemainingSeconds - 1);
        updateHud();

        if (state.timeRemainingSeconds <= 0) {
          endGame(false);
        }
        return;
      }

      updateHud();
    }, 1000);
  }

  function closeModal() {
    resultModal.classList.add('is-hidden');
  }

  function setModalContent({ title, isWin, metaText, cards }) {
    resultModalTitle.textContent = title;
    resultModalBody.innerHTML = '';

    const container = document.createElement('div');
    container.className = 'result';

    const meta = document.createElement('div');
    meta.className = 'result__meta';

    const pillStatus = document.createElement('span');
    pillStatus.className = `pill ${isWin ? 'pill--win' : 'pill--lose'}`;
    pillStatus.textContent = isWin ? 'Победа' : 'Поражение';

    const pillCombo = document.createElement('span');
    pillCombo.className = 'pill';
    pillCombo.textContent = metaText;

    meta.append(pillStatus, pillCombo);

    const grid = document.createElement('div');
    grid.className = 'result__grid';

    cards.forEach((card) => {
      const cardEl = document.createElement('div');
      cardEl.className = 'result__card';

      const label = document.createElement('div');
      label.className = 'result__label';
      label.textContent = card.label;

      const value = document.createElement('div');
      value.className = 'result__value';
      value.textContent = card.value;

      cardEl.append(label, value);

      if (card.note) {
        const note = document.createElement('div');
        note.className = 'result__note';
        note.textContent = card.note;
        cardEl.append(note);
      }

      grid.append(cardEl);
    });

    container.append(meta, grid);
    resultModalBody.append(container);
    resultModal.classList.remove('is-hidden');
  }

  function getScoreTypeByMode(mode) {
    if (mode === 'time') return 'remainingSeconds';
    if (mode === 'attempts') return 'attemptsUsed';
    return 'completionSeconds';
  }

  function formatBestForMode(mode, value) {
    if (typeof value !== 'number') return '—';
    if (mode === 'attempts') return `${value} попыток`;
    return formatTime(value);
  }

  function saveBestScore(mode, difficulty, value, valueType) {
    const key = getComboKey(mode, difficulty);
    const scores = getStoredScores();
    const prev = scores[key];

    const isValid = typeof value === 'number' && Number.isFinite(value);
    if (!isValid) return null;

    let isBetter = false;
    if (!prev || typeof prev.value !== 'number') {
      isBetter = true;
    } else if (valueType === 'remainingSeconds') {
      isBetter = value > prev.value;
    } else {
      isBetter = value < prev.value;
    }

    const bestValue = isBetter ? value : prev.value;

    if (isBetter) {
      scores[key] = {
        mode,
        difficulty,
        type: valueType,
        value,
        updatedAt: Date.now(),
      };
      setStoredScores(scores);
    }

    return { isNewBest: isBetter, bestValue };
  }

  function getBestScore(mode, difficulty) {
    const scores = getStoredScores();
    const key = getComboKey(mode, difficulty);
    const prev = scores[key];
    if (!prev || typeof prev.value !== 'number') return null;
    return prev.value;
  }

  function renderRecords() {
    const scores = getStoredScores();
    const hasAnyRecords = Object.values(scores).some(
      (entry) => entry && typeof entry.value === 'number' && Number.isFinite(entry.value)
    );


    if (!hasAnyRecords) {
      const isGameVisible = !gameSection.classList.contains('is-hidden');
      if (recordsSection && !isGameVisible) {
        recordsSection.classList.remove('is-hidden');
      }

      resetRecordsButton.disabled = true;
      recordsGrid.innerHTML =
        '<div class="records__empty">Пока нет результатов. Сыграйте, чтобы появился первый рекорд.</div>';
      return;
    }

    resetRecordsButton.disabled = false;

    const isGameVisible = !gameSection.classList.contains('is-hidden');
    if (recordsSection && !isGameVisible) {
      recordsSection.classList.remove('is-hidden');
    }

    recordsGrid.innerHTML = '';

    MODES.forEach((mode) => {
      DIFFICULTIES.forEach((difficulty) => {
        const key = getComboKey(mode.id, difficulty.id);
        const entry = scores[key];

        const card = document.createElement('div');
        card.className = 'record';

        const title = document.createElement('div');
        title.className = 'record__title';
        title.textContent = `${mode.title} · ${difficulty.title}`;

        const value = document.createElement('div');
        value.className = 'record__value';

        if (!entry || typeof entry.value !== 'number') {
          value.textContent = '—';
        } else if (mode.id === 'attempts') {
          value.textContent = `${entry.value} попыток`;
        } else {
          value.textContent = formatTime(entry.value);
        }

        const sub = document.createElement('div');
        sub.className = 'record__sub';
        sub.textContent = getRecordSubtitle(mode.id);

        card.append(title, value, sub);
        recordsGrid.append(card);
      });
    });
  }

  function resetRecords() {
    localStorage.removeItem(STORAGE_KEY);
    renderRecords();
  }

/**
 *  Функция начала игры
 */
  function startGame() {
    resetGame();
    setView(true);
    createCards();
    updateHud();
  }

/**
 * Функция создания карточек
 */
  function createCards() {
    const difficulty = getDifficulty();
    const { pairs } = DIFFICULTY_SETTINGS[difficulty];

    state.totalPairs = pairs;
    state.matchedPairs = 0;
    state.opened = [];
    state.isLocked = false;
    state.isGameStarted = false;
    state.isGameFinished = false;
    state.startedAtMs = 0;

    const mode = getMode();
    const settings = DIFFICULTY_SETTINGS[difficulty];
    state.attemptsRemaining = settings.attempts;
    state.attemptsUsed = 0;
    state.timeRemainingSeconds = settings.time;

    const icons = ICONS_ARRAY.slice(0, pairs);
    const deck = shuffle([...icons, ...icons]);

    board.innerHTML = '';
    const cols = getColumnsByDifficulty(difficulty);
    board.style.setProperty('--cols', String(cols));

    deck.forEach((icon) => {
      const fragment = cardTemplate.content.cloneNode(true);
      const card = fragment.querySelector('.card');
      const front = fragment.querySelector('.card__face--front');
      const back = fragment.querySelector('.card__face--back');

      if (!card || !front || !back) return;

      card.dataset.icon = icon;
      front.textContent = icon;
      back.textContent = '';

      card.addEventListener('click', () => {
        if (state.isGameFinished) return;
        if (state.isLocked) return;
        if (card.classList.contains('is-matched')) return;
        if (card.classList.contains('is-flipped')) return;

        if (!state.isGameStarted) {
          state.isGameStarted = true;
          state.startedAtMs = Date.now();
          startTickIfNeeded();
        }

        flipCard(card);
        state.opened.push(card);

        if (state.opened.length === 2) {
          if (mode === 'attempts') {
            state.attemptsRemaining = Math.max(0, state.attemptsRemaining - 1);
            state.attemptsUsed += 1;
            updateHud();
          }
          checkMatch();
        } else {
          updateHud();
        }
      });

      board.append(fragment);
    });
  }

/**
 * Переворот карточки
 * @param card - карточка
 *  */
  function flipCard(card) {
    card.classList.add('is-flipped');
  }

/**
 * Проверка совпадения карточек
 */
  function checkMatch() {
    const [first, second] = state.opened;
    if (!first || !second) return;

    state.isLocked = true;

    const isMatch = first.dataset.icon === second.dataset.icon;

    if (isMatch) {
      first.classList.add('is-matched');
      second.classList.add('is-matched');
      first.disabled = true;
      second.disabled = true;

      state.opened = [];
      state.isLocked = false;
      state.matchedPairs += 1;
      updateHud();

      if (state.matchedPairs >= state.totalPairs) {
        endGame(true);
        return;
      }

      if (getMode() === 'attempts' && state.attemptsRemaining <= 0) {
        endGame(false);
      }
      return;
    }

    setTimeout(() => {
      first.classList.remove('is-flipped');
      second.classList.remove('is-flipped');
      state.opened = [];
      state.isLocked = false;

      if (getMode() === 'attempts' && state.attemptsRemaining <= 0) {
        endGame(false);
        return;
      }
    }, 650);
  }

  function updateTimeDisplay() {
    updateSettingsCounter();
    updateHud();
  }

  function endGame(isWin) {
    if (state.isGameFinished) return;
    state.isGameFinished = true;
    stopTick();

    [...board.querySelectorAll('.card')].forEach((card) => {
      card.disabled = true;
    });

    const mode = getMode();
    const difficulty = getDifficulty();
    const settings = DIFFICULTY_SETTINGS[difficulty];
    const valueType = getScoreTypeByMode(mode);

    let currentValue = 0;
    const metaText = `Режим: ${getModeTitle(mode)} · Сложность: ${getDifficultyTitle(difficulty)}`;
    const cards = [];
    cards.push({ label: 'Пары', value: `${state.matchedPairs}/${state.totalPairs}` });

    if (mode === 'time') {
      currentValue = state.timeRemainingSeconds;
      cards.push({ label: 'Осталось времени', value: formatTime(state.timeRemainingSeconds) });
    } else if (mode === 'attempts') {
      currentValue = state.attemptsUsed;
      cards.push({
        label: 'Использовано попыток',
        value: `${state.attemptsUsed} / ${settings.attempts}`,
      });
      cards.push({ label: 'Осталось попыток', value: String(state.attemptsRemaining) });
    } else {
      currentValue = getElapsedSeconds();
      cards.push({ label: 'Время', value: formatTime(currentValue) });
    }

    let bestInfo = null;
    if (isWin) {
      bestInfo = saveBestScore(mode, difficulty, currentValue, valueType);
    } else {
      const prevValue = getBestScore(mode, difficulty);
      if (typeof prevValue === 'number') {
        bestInfo = { isNewBest: false, bestValue: prevValue };
      }
    }

    if (bestInfo && typeof bestInfo.bestValue === 'number') {
      cards.push({
        label: 'Лучший результат',
        value: formatBestForMode(mode, bestInfo.bestValue),
        note: bestInfo.isNewBest ? 'Новый рекорд!' : '',
      });
    } else {
      cards.push({ label: 'Лучший результат', value: '—' });
    }

    setModalContent({
      title: isWin ? 'Победа!' : 'Поражение',
      isWin,
      metaText,
      cards,
    });

    renderRecords();
  }

  function loadBestScores() {
    renderRecords();
  }

// Сброс игры
  function resetGame() {
    closeModal();
    board.innerHTML = '';
    state.opened = [];
    state.isLocked = false;
    state.matchedPairs = 0;
    state.totalPairs = DIFFICULTY_SETTINGS[getDifficulty()].pairs;
    state.isGameStarted = false;
    state.isGameFinished = false;
    state.startedAtMs = 0;
    state.attemptsRemaining = DIFFICULTY_SETTINGS[getDifficulty()].attempts;
    state.attemptsUsed = 0;
    state.timeRemainingSeconds = DIFFICULTY_SETTINGS[getDifficulty()].time;
    stopTick();
    updateTimeDisplay();
  }

  function unlockStartButton() {
    startButton.disabled = false;
  }

  modeSelect.addEventListener('change', () => {
    unlockStartButton();
    updateTimeDisplay();
  });
  difficultySelect.addEventListener('change', () => {
    unlockStartButton();
    updateTimeDisplay();
  });

  modeSelect.addEventListener('focus', unlockStartButton, { once: true });
  difficultySelect.addEventListener('focus', unlockStartButton, { once: true });
  modeSelect.addEventListener('click', unlockStartButton, { once: true });
  difficultySelect.addEventListener('click', unlockStartButton, { once: true });

  startButton.addEventListener('click', startGame);
  newGameButton.addEventListener('click', startGame);
  backToSettingsButton.addEventListener('click', () => {
    resetGame();
    setView(false);
  });

  resultModalOverlay.addEventListener('click', closeModal);
  resultModalRestart.addEventListener('click', () => {
    closeModal();
    startGame();
  });
  resultModalToSettings.addEventListener('click', () => {
    closeModal();
    resetGame();
    setView(false);
  });

  resetRecordsButton.addEventListener('click', resetRecords);

  setView(false);
  updateTimeDisplay();
  loadBestScores();
}

document.addEventListener('DOMContentLoaded', () => game());
