/**
 * Константы
 */
const DIFFICULTY_SETTINGS = {
  easy: { pairs: 6, attempts: 24, time: 60 },
  medium: { pairs: 8, attempts: 28, time: 120 },
  hard: { pairs: 12, attempts: 36, time: 120 },
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

/**
 * Основная функция игры
 */
function game() {
  const modeSelect = document.querySelector('#modeSelect');
  const difficultySelect = document.querySelector('#difficultySelect');
  const startButton = document.querySelector('#startButton');

  const settingsSection = document.querySelector('#settings');
  const gameSection = document.querySelector('#game');

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
    board.style.setProperty('--cols', String(getColumnsByDifficulty(difficulty)));

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

    setModalContent({
      title: isWin ? 'Победа!' : 'Поражение',
      isWin,
      metaText,
      cards,
    });
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

  startButton.disabled = true;

  modeSelect.addEventListener('change', () => {
    startButton.disabled = false;
    updateTimeDisplay();
  });

  difficultySelect.addEventListener('change', () => {
    startButton.disabled = false;
    updateTimeDisplay();
  });

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

  setView(false);
  updateTimeDisplay();
}

document.addEventListener('DOMContentLoaded', () => game());
