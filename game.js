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
function game() {}

/**
 *  Функция начала игры
 */
function startGame() {}

/**
 * Функция создания карточек
 */
function createCards() {}

/**
 * Переворот карточки
 * @param card - карточка
 *  */
function flipCard(card) {}

/**
 * Проверка совпадения карточек
 */
function checkMatch() {}

// Обновление отображения времени
function updateTimeDisplay() {}

// Завершение игры
function endGame(isWin, attemptsUsed = 0, gameTime = 0) {}

// Сохранение лучшего результата
function saveBestScore(mode, value, valueType) {}

// Загрузка лучших результатов с использованием шаблонов
function loadBestScores() {}

// Сброс игры
function resetGame() {}

document.addEventListener('DOMContentLoaded', () => {
  game();
});
