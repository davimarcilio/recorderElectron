document.addEventListener("DOMContentLoaded", () => {
  const { ipcRenderer } = require("electron");
  //Declarations
  const display = document.querySelector("#display");
  const record = document.querySelector("#record");
  const micInput = document.querySelector("#mic");

  let isRecording = false;
  let selectedDeviceId = null;
  let mediaRecorder = null;
  let startTime = Date;
  let chunks = [];

  //Get avaliable devices

  navigator.mediaDevices.enumerateDevices().then((devices) => {
    devices.forEach((device) => {
      if (device.kind === "audioinput") {
        if (!selectedDeviceId) {
          selectedDeviceId = device.deviceId;
        }
        const option = document.createElement("option");
        option.value = device.deviceId;
        option.text = device.label;
        micInput.appendChild(option);
      }
    });
  });

  micInput.addEventListener("change", (event) => {
    selectedDeviceId = event.target.value;
  });

  function updateButtonTo(recording) {
    if (recording) {
      document.querySelector("#record").classList.add("recording");
      document.querySelector("#mic-icon").classList.add("hide");
    } else {
      document.querySelector("#record").classList.remove("recording");
      document.querySelector("#mic-icon").classList.remove("hide");
    }
  }
  record.addEventListener("click", () => {
    updateButtonTo(!isRecording);
    handleRecord(isRecording);
    isRecording = !isRecording;
  });

  function handleRecord(recording) {
    if (recording) {
      //stop
      mediaRecorder.stop();
    } else {
      //start
      navigator.mediaDevices
        .getUserMedia({
          audio: { deviceId: selectedDeviceId },
          video: false,
        })
        .then((stream) => {
          mediaRecorder = new MediaRecorder(stream);
          mediaRecorder.start();
          startTime = Date.now();
          updateDisplay();

          mediaRecorder.ondataavailable = (event) => {
            chunks.push(event.data);
          };
          mediaRecorder.onstop = (event) => {
            saveData();
          };
        });
    }
  }
  function updateDisplay() {
    display.innerHTML = durationToTimestamp(Date.now() - startTime);
    if (isRecording) {
      window.requestAnimationFrame(updateDisplay);
    }
  }
  function durationToTimestamp(duration) {
    let miliSeconds = parseInt((duration % 1000) / 100);
    let seconds = Math.floor((duration / 1000) % 60);
    let minutes = Math.floor((duration / 1000 / 60) % 60);
    let hours = Math.floor(duration / 1000 / 60 / 60);
    hours = hours < 10 ? "0" + hours : hours;
    seconds = seconds < 10 ? "0" + seconds : seconds;
    minutes = minutes < 10 ? "0" + minutes : minutes;
    return `${hours}:${minutes}:${seconds}.${miliSeconds}`;
  }
  function saveData() {
    const blob = new Blob(chunks, { type: "audio/webm; codecs=opus" });
    console.log(blob);
    blob.arrayBuffer().then((blobBuffer) => {
      const buffer = new Buffer(blobBuffer, "binary");
      ipcRenderer.send("save_buffer", buffer);
    });
    // document.querySelector("#audio").src = URL.createObjectURL(blob);
    chunks = [];
  }
});
window.onload = function () {
  document.body.classList.remove("preload");
};
