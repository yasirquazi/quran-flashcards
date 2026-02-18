/*
  JavaScript (JS) makes the page interactive.
  
  Key concepts:
  - Variables: store data (let, const)
  - Functions: reusable blocks of code
  - DOM: Document Object Model - how JS talks to HTML
  - Events: things that happen (clicks, key presses)
*/

// ============================================
// VARIABLES - storing our app's state
// ============================================

// 'let' = variable that can change
// 'const' = constant, cannot be reassigned
let currentAyahIndex = 0;   // Which ayah we're on (starts at 0)
let currentWordIndex = 0;   // Which word within the ayah (for MCQ mode)
let surahData = null;       // Will hold our loaded data
let audio = null;           // Will hold the audio player
let isMcqMode = false;      // Track which mode we're in

// ============================================
// DOM ELEMENTS - getting references to HTML
// ============================================

// document.getElementById() finds an element by its id attribute
// Flashcard mode elements
const flashcard = document.getElementById('flashcard');
const flashcardView = document.getElementById('flashcard-view');
const arabicText = document.getElementById('arabic-text');
const transliteration = document.getElementById('transliteration');
const meaning = document.getElementById('meaning');

// MCQ mode elements
const mcqView = document.getElementById('mcq-view');
const mcqArabic = document.getElementById('mcq-arabic');
const mcqTransliteration = document.getElementById('mcq-transliteration');
const mcqOptions = document.getElementById('mcq-options');
const mcqFeedback = document.getElementById('mcq-feedback');

// Shared elements
const currentAyahSpan = document.getElementById('current-ayah');
const totalAyahsSpan = document.getElementById('total-ayahs');
const wordProgress = document.getElementById('word-progress');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const playAudioBtn = document.getElementById('play-audio');

// Mode tab elements
const tabFlashcard = document.getElementById('tab-flashcard');
const tabMcq = document.getElementById('tab-mcq');
const mcqAnswers = document.getElementById('mcq-answers');

// ============================================
// FUNCTIONS - reusable blocks of code
// ============================================

/*
  Function to load the surah data from our JSON file.
  'async' means this function can wait for things (like file loading).
*/
async function loadSurahData() {
  const response = await fetch('data/surahs.json');
  const data = await response.json();
  surahData = data.surahs[0];
  
  totalAyahsSpan.textContent = surahData.ayahs.length;
  displayCurrentContent();
}

/*
  MAIN DISPLAY FUNCTION
  Decides what to show based on current mode.
  This is called whenever we navigate or switch modes.
*/
function displayCurrentContent(autoplay = true) {
  if (isMcqMode) {
    displayMcqWord();
  } else {
    displayFlashcard();
    // Auto-play audio only in flashcard mode, and only when navigating
    if (autoplay) playRecitation();
  }
  updateProgress();
  updateButtons();
}

/*
  FLASHCARD MODE: Display full ayah
*/
function displayFlashcard() {
  const ayah = surahData.ayahs[currentAyahIndex];
  
  arabicText.textContent = ayah.arabic;
  transliteration.textContent = ayah.transliteration;
  meaning.textContent = ayah.meaning;
  
  flashcard.classList.remove('flipped');
}

/*
  MCQ MODE: Display current word with options
  
  This function:
  1. Gets the current word from the current ayah
  2. Shuffles the answer options (so correct answer isn't always first)
  3. Creates clickable buttons for each option
*/
function displayMcqWord() {
  const ayah = surahData.ayahs[currentAyahIndex];
  const word = ayah.words[currentWordIndex];
  
  // Display the word
  mcqArabic.textContent = word.arabic;
  mcqTransliteration.textContent = word.transliteration;
  mcqFeedback.textContent = '';
  mcqFeedback.className = 'feedback';
  
  // Shuffle options (so correct answer position varies)
  // [...array] creates a copy so we don't modify the original
  const shuffledOptions = shuffleArray([...word.options]);
  
  // Clear previous options
  mcqOptions.innerHTML = '';
  
  // Create a button for each option
  shuffledOptions.forEach(option => {
    const button = document.createElement('button');
    button.className = 'mcq-option';
    button.textContent = option;
    
    // When clicked, check if answer is correct
    button.addEventListener('click', () => checkAnswer(option, word.meaning, button));
    
    mcqOptions.appendChild(button);
  });
}

/*
  SHUFFLE FUNCTION
  Randomly reorders an array using Fisher-Yates algorithm.
  Used to randomize MCQ option positions.
*/
function shuffleArray(array) {
  // Loop backwards through array
  for (let i = array.length - 1; i > 0; i--) {
    // Pick a random index from 0 to i
    const j = Math.floor(Math.random() * (i + 1));
    // Swap elements at positions i and j
    // This syntax [a, b] = [b, a] is called "destructuring assignment"
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}

/*
  CHECK ANSWER
  Called when user clicks an MCQ option.
  Compares their choice to the correct answer.
*/
function checkAnswer(selected, correct, buttonElement) {
  // Disable all buttons after answer is selected
  const allButtons = mcqOptions.querySelectorAll('.mcq-option');
  allButtons.forEach(btn => btn.disabled = true);
  
  if (selected === correct) {
    buttonElement.classList.add('correct');
    mcqFeedback.textContent = '✓ Correct!';
    mcqFeedback.classList.add('correct');
    playSuccessSound();
    
    // Auto-advance after 1 second
    setTimeout(() => {
      goNext();
    }, 1000);
  } else {
    buttonElement.classList.add('wrong');
    mcqFeedback.textContent = `✗ Correct answer: ${correct}`;
    mcqFeedback.classList.add('wrong');
    
    // Highlight the correct answer
    allButtons.forEach(btn => {
      if (btn.textContent === correct) {
        btn.classList.add('correct');
      }
    });
  }
}

/*
  UPDATE PROGRESS DISPLAY
  Shows ayah number, and word number if in MCQ mode.
*/
function updateProgress() {
  currentAyahSpan.textContent = currentAyahIndex + 1;
  
  if (isMcqMode) {
    const totalWords = surahData.ayahs[currentAyahIndex].words.length;
    wordProgress.textContent = `(Word ${currentWordIndex + 1}/${totalWords})`;
  } else {
    wordProgress.textContent = '';
  }
}

/*
  UPDATE NAVIGATION BUTTONS
  Disables prev/next when at boundaries.
*/
function updateButtons() {
  if (isMcqMode) {
    // In MCQ mode, check word boundaries within current ayah
    const totalWords = surahData.ayahs[currentAyahIndex].words.length;
    const isFirstWord = currentAyahIndex === 0 && currentWordIndex === 0;
    const isLastWord = currentAyahIndex === surahData.ayahs.length - 1 &&
                       currentWordIndex === totalWords - 1;

    prevBtn.disabled = isFirstWord;
    nextBtn.disabled = isLastWord;
    nextBtn.textContent = 'Next →';
  } else {
    // In flashcard mode, last ayah turns Next into Restart
    const isLast = currentAyahIndex === surahData.ayahs.length - 1;
    prevBtn.disabled = currentAyahIndex === 0;
    nextBtn.disabled = false;
    nextBtn.textContent = isLast ? '↺ Restart' : 'Next →';
  }
}

/*
  PLAY AUDIO RECITATION
  Plays Al-Hussary's recitation of the current ayah.
*/
function playRecitation() {
  if (audio) {
    audio.pause();
  }
  
  const surahNum = String(surahData.number).padStart(3, '0');
  const ayahNum = String(surahData.ayahs[currentAyahIndex].number).padStart(3, '0');
  const audioUrl = `https://everyayah.com/data/Husary_128kbps/${surahNum}${ayahNum}.mp3`;
  
  audio = new Audio(audioUrl);
  audio.play();
}

/*
  NAVIGATION: Go to next item
  In flashcard mode: next ayah
  In MCQ mode: next word (or next ayah's first word)
*/
function goNext() {
  if (isMcqMode) {
    const totalWords = surahData.ayahs[currentAyahIndex].words.length;
    
    if (currentWordIndex < totalWords - 1) {
      // More words in current ayah
      currentWordIndex++;
      displayCurrentContent();
    } else if (currentAyahIndex < surahData.ayahs.length - 1) {
      // Move to next ayah, start at first word
      currentAyahIndex++;
      currentWordIndex = 0;
      displayCurrentContent();
    }
  } else {
    // Flashcard mode: next ayah, or restart from beginning
    if (currentAyahIndex < surahData.ayahs.length - 1) {
      currentAyahIndex++;
    } else {
      currentAyahIndex = 0;
    }
    displayCurrentContent();
  }
}

/*
  NAVIGATION: Go to previous item
*/
function goPrev() {
  if (isMcqMode) {
    if (currentWordIndex > 0) {
      // Previous word in current ayah
      currentWordIndex--;
      displayCurrentContent();
    } else if (currentAyahIndex > 0) {
      // Move to previous ayah, start at last word
      currentAyahIndex--;
      currentWordIndex = surahData.ayahs[currentAyahIndex].words.length - 1;
      displayCurrentContent();
    }
  } else {
    // Flashcard mode
    if (currentAyahIndex > 0) {
      currentAyahIndex--;
      displayCurrentContent();
    }
  }
}

/*
  FLIP FLASHCARD
  Only works in flashcard mode.
*/
function flipCard() {
  if (!isMcqMode) {
    flashcard.classList.toggle('flipped');
  }
}

/*
  SWITCH MODE
  Toggle between flashcard and MCQ modes.
  
  When switching to MCQ: start at first word of current ayah.
  When switching to flashcard: stay on current ayah.
*/
function switchMode(newIsMcq) {
  isMcqMode = newIsMcq;

  // Update tab active state
  tabFlashcard.classList.toggle('active', !isMcqMode);
  tabMcq.classList.toggle('active', isMcqMode);

  // Show/hide appropriate views
  flashcardView.classList.toggle('hidden', isMcqMode);
  mcqView.classList.toggle('hidden', !isMcqMode);
  mcqAnswers.classList.toggle('hidden', !isMcqMode);
  playAudioBtn.classList.toggle('hidden', isMcqMode);

  // Reset word index when entering MCQ mode
  if (isMcqMode) {
    currentWordIndex = 0;
  }

  displayCurrentContent(false); // Don't autoplay when switching modes
}

/*
  SUCCESS SOUND
  Uses the Web Audio API to generate a short ascending chime.
  No external files needed — the browser synthesizes it.
*/
function playSuccessSound() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5

  notes.forEach((freq, i) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.type = 'sine';
    osc.frequency.value = freq;

    const start = ctx.currentTime + i * 0.13;
    gain.gain.setValueAtTime(0, start);
    gain.gain.linearRampToValueAtTime(0.25, start + 0.04);
    gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);

    osc.start(start);
    osc.stop(start + 0.3);
  });
}

// ============================================
// EVENT LISTENERS - responding to user actions
// ============================================

/*
  .addEventListener() runs a function when something happens.
  Format: element.addEventListener('eventType', functionToRun)
*/

// When flashcard is clicked, flip it
flashcard.addEventListener('click', flipCard);

// When buttons are clicked, run their functions
nextBtn.addEventListener('click', goNext);
prevBtn.addEventListener('click', goPrev);
playAudioBtn.addEventListener('click', playRecitation);

// Mode tab buttons
tabFlashcard.addEventListener('click', () => switchMode(false));
tabMcq.addEventListener('click', () => switchMode(true));

// Keyboard navigation (arrow keys)
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowRight') {
    goNext();
  } else if (event.key === 'ArrowLeft') {
    goPrev();
  } else if (event.key === ' ') {
    event.preventDefault();
    flipCard();
  }
});

// ============================================
// INITIALIZATION - start the app
// ============================================

// Load the data when the page loads
loadSurahData();

// Register service worker for PWA (offline support)
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js')
    .then(() => console.log('Service Worker registered'))
    .catch(err => console.log('Service Worker error:', err));
}
