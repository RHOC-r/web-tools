let remainingSeconds = 0;
let timerInterval = null;
let isPaused = false;

const display =
  document.getElementById("timerDisplay");

const hoursInput =
  document.getElementById("hours");

const minutesInput =
  document.getElementById("minutes");

const secondsInput =
  document.getElementById("seconds");


function startTimer() {

  // すでに動いている場合
  if (timerInterval) {
    return;
  }

  // 一時停止から再開
  if (!isPaused) {

    const hours =
      Number(hoursInput.value) || 0;

    const minutes =
      Number(minutesInput.value) || 0;

    const seconds =
      Number(secondsInput.value) || 0;

    remainingSeconds =
      hours * 3600 +
      minutes * 60 +
      seconds;

  }

  if (remainingSeconds <= 0) {
    return;
  }

  isPaused = false;

  updateDisplay();

  timerInterval = setInterval(() => {

    remainingSeconds--;

    updateDisplay();

    if (remainingSeconds <= 0) {

      clearInterval(timerInterval);

      timerInterval = null;

      alert("タイマーが終了しました！");

    }

  }, 1000);

}


function pauseTimer() {

  if (!timerInterval) {
    return;
  }

  clearInterval(timerInterval);

  timerInterval = null;

  isPaused = true;

}


function resetTimer() {

  clearInterval(timerInterval);

  timerInterval = null;

  remainingSeconds = 0;

  isPaused = false;

  hoursInput.value = "";
  minutesInput.value = "";
  secondsInput.value = "";

  updateDisplay();

}


function updateDisplay() {

  const hours =
    Math.floor(remainingSeconds / 3600);

  const minutes =
    Math.floor((remainingSeconds % 3600) / 60);

  const seconds =
    remainingSeconds % 60;

  display.textContent =
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");

}