/* =========================
   タブ切り替え
========================= */

function switchTab(tab) {

  const timerTab =
    document.getElementById("timerTab");

  const stopwatchTab =
    document.getElementById("stopwatchTab");

  const timerContent =
    document.getElementById("timerContent");

  const stopwatchContent =
    document.getElementById("stopwatchContent");


  timerTab.classList.remove("active");
  stopwatchTab.classList.remove("active");

  timerContent.classList.remove("active");
  stopwatchContent.classList.remove("active");


  if (tab === "timer") {

    timerTab.classList.add("active");
    timerContent.classList.add("active");

  } else {

    stopwatchTab.classList.add("active");
    stopwatchContent.classList.add("active");

  }

}


/* =========================
   タイマー
========================= */

let timerInterval = null;

let timerRemainingSeconds = 300;

let timerPaused = false;


const timerDisplay =
  document.getElementById("timerDisplay");

const hoursInput =
  document.getElementById("hours");

const minutesInput =
  document.getElementById("minutes");

const secondsInput =
  document.getElementById("seconds");


function startTimer() {

  if (timerInterval) {
    return;
  }


  if (!timerPaused) {

    const hours =
      Number(hoursInput.value) || 0;

    const minutes =
      Number(minutesInput.value) || 0;

    const seconds =
      Number(secondsInput.value) || 0;


    timerRemainingSeconds =
      (hours * 3600) +
      (minutes * 60) +
      seconds;

  }


  if (timerRemainingSeconds <= 0) {
    return;
  }


  timerPaused = false;

  updateTimerDisplay();


  timerInterval = setInterval(() => {

    timerRemainingSeconds--;

    updateTimerDisplay();


    if (timerRemainingSeconds <= 0) {

      clearInterval(timerInterval);

      timerInterval = null;

      timerPaused = false;

      timerRemainingSeconds = 0;

      updateTimerDisplay();

      timerFinished();

    }

  }, 1000);

}


function pauseTimer() {

  if (!timerInterval) {
    return;
  }


  clearInterval(timerInterval);

  timerInterval = null;

  timerPaused = true;

}


function resetTimer() {

  clearInterval(timerInterval);

  timerInterval = null;

  timerPaused = false;


  const hours =
    Number(hoursInput.value) || 0;

  const minutes =
    Number(minutesInput.value) || 0;

  const seconds =
    Number(secondsInput.value) || 0;


  timerRemainingSeconds =
    (hours * 3600) +
    (minutes * 60) +
    seconds;


  updateTimerDisplay();

}


function updateTimerDisplay() {

  const hours =
    Math.floor(
      timerRemainingSeconds / 3600
    );

  const minutes =
    Math.floor(
      (timerRemainingSeconds % 3600) / 60
    );

  const seconds =
    timerRemainingSeconds % 60;


  timerDisplay.textContent =
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0");

}


function timerFinished() {

  playAlarmSound();

  showTimerFinishedEffect();

}

function showTimerFinishedEffect() {

  const timerContent =
    document.getElementById("timerContent");

  timerContent.classList.add(
    "timer-finished-effect"
  );

  timerDisplay.classList.add(
    "timer-display-finished"
  );


  setTimeout(() => {

    timerContent.classList.remove(
      "timer-finished-effect"
    );

    timerDisplay.classList.remove(
      "timer-display-finished"
    );

  }, 3000);

}


function playAlarmSound() {

  try {

    const AudioContextClass =
      window.AudioContext ||
      window.webkitAudioContext;


    const audioContext =
      new AudioContextClass();


    const beepTimes = [
      0,
      0.25,
      0.5,
      1.0,
      1.25,
      1.5,
      2.0,
      2.25,
      2.5
    ];


    beepTimes.forEach(time => {

      const oscillator =
        audioContext.createOscillator();

      const gainNode =
        audioContext.createGain();


      oscillator.connect(gainNode);

      gainNode.connect(
        audioContext.destination
      );


      oscillator.type = "sine";

      oscillator.frequency.value = 880;


      gainNode.gain.setValueAtTime(
        0.25,
        audioContext.currentTime + time
      );


      gainNode.gain.exponentialRampToValueAtTime(
        0.01,
        audioContext.currentTime + time + 0.15
      );


      oscillator.start(
        audioContext.currentTime + time
      );


      oscillator.stop(
        audioContext.currentTime + time + 0.15
      );

    });


    setTimeout(() => {

      audioContext.close();

    }, 3500);


  } catch (error) {

    console.log(
      "タイマー音を再生できませんでした。"
    );

  }

}


/* 入力値を変更したら表示にも反映 */

function syncTimerInput() {

  if (timerInterval || timerPaused) {
    return;
  }


  const hours =
    Number(hoursInput.value) || 0;

  const minutes =
    Number(minutesInput.value) || 0;

  const seconds =
    Number(secondsInput.value) || 0;


  timerRemainingSeconds =
    (hours * 3600) +
    (minutes * 60) +
    seconds;


  updateTimerDisplay();

}


hoursInput.addEventListener(
  "input",
  syncTimerInput
);

minutesInput.addEventListener(
  "input",
  syncTimerInput
);

secondsInput.addEventListener(
  "input",
  syncTimerInput
);


/* =========================
   ストップウォッチ
========================= */

let stopwatchInterval = null;

let stopwatchStartTime = 0;

let stopwatchElapsed = 0;

let lapCount = 0;


const stopwatchDisplay =
  document.getElementById(
    "stopwatchDisplay"
  );

const lapList =
  document.getElementById("lapList");

const lapArea =
  document.getElementById("lapArea");


function startStopwatch() {

  if (stopwatchInterval) {
    return;
  }


  stopwatchStartTime =
    performance.now() -
    stopwatchElapsed;


  stopwatchInterval =
    setInterval(() => {

      stopwatchElapsed =
        performance.now() -
        stopwatchStartTime;

      updateStopwatchDisplay();

    }, 10);

}


function pauseStopwatch() {

  if (!stopwatchInterval) {
    return;
  }


  clearInterval(stopwatchInterval);

  stopwatchInterval = null;

}


function resetStopwatch() {

  clearInterval(stopwatchInterval);

  stopwatchInterval = null;

  stopwatchElapsed = 0;

  lapCount = 0;


  stopwatchDisplay.textContent =
    "00:00:00.00";


  lapList.innerHTML = "";

  lapArea.style.display = "none";

}


function addLap() {

  if (
    stopwatchElapsed <= 0
  ) {
    return;
  }


  lapCount++;


  const li =
    document.createElement("li");


  li.innerHTML = `
    <span>ラップ ${lapCount}</span>
    <strong>
      ${formatStopwatchTime(stopwatchElapsed)}
    </strong>
  `;


  lapList.prepend(li);

  lapArea.style.display = "block";

}


function updateStopwatchDisplay() {

  stopwatchDisplay.textContent =
    formatStopwatchTime(
      stopwatchElapsed
    );

}


function formatStopwatchTime(milliseconds) {

  const totalCentiseconds =
    Math.floor(
      milliseconds / 10
    );


  const centiseconds =
    totalCentiseconds % 100;


  const totalSeconds =
    Math.floor(
      totalCentiseconds / 100
    );


  const seconds =
    totalSeconds % 60;


  const totalMinutes =
    Math.floor(
      totalSeconds / 60
    );


  const minutes =
    totalMinutes % 60;


  const hours =
    Math.floor(
      totalMinutes / 60
    );


  return (
    String(hours).padStart(2, "0") +
    ":" +
    String(minutes).padStart(2, "0") +
    ":" +
    String(seconds).padStart(2, "0") +
    "." +
    String(centiseconds).padStart(2, "0")
  );

}


/* 初期表示 */

updateTimerDisplay();