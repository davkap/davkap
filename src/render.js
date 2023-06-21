const { log } = require('console');
const { desktopCapturer, remote } = require('electron');
const { writeFile } = require('fs');
const { dialog, Menu } = remote;

// Global state
let mediaRecorder; // MediaRecorder instance to capture footage
let recordedChunks = [];
let noteData = []; // Data for note-taking feature
let videoStartTime; // Start time of the recorded video
let cueList = [] // Data for each cue
let keyboardShortcutArr = [] // Data for each keyboard shortcut
let cueUlLi
let cueUl
let videoUrl // Vieo url that will be the uploaded video

// Buttons for recording screen
const videoElement = document.querySelector('video');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const videoSelectBtn = document.getElementById('videoSelectBtn');
const shortcutlistDiv = document.getElementById('shortcutlistDiv');

// Button for Note takig
const saveNoteBtn = document.getElementById('saveNoteBtn');
// JavaScript code to handle the "Upload Video" button
const videoInput = document.getElementById('file-inputVideo');
// const uploadBtn = document.getElementById('upload-btn');
const cueListDiv = document.getElementById('cueListDiv');
const toggleBtn = document.getElementById("toggleBtn");
const uploadedFileSection = document.querySelector(".uploadedFile");


const addTimeBtn = document.getElementById('addTimeBtn');

addTimeBtn.addEventListener('click', function() {
  videoElement.currentTime += 3;
  console.log(videoElement.currentTime);
});

// Hide and show Upload Section
toggleBtn.addEventListener("click", () => {
  uploadedFileSection.classList.toggle("hidden");
  if (uploadedFileSection.classList.contains("hidden")) {
    toggleBtn.innerText = "Show uploaded files";
  } else {
    toggleBtn.innerText = "Hide uploaded files";
  }
});

// Upload video to app from computer event listener
// uploadBtn.addEventListener('click', () => {
//   videoInput.click(); // open the file input dialog when the button is clicked
// });

videoInput.addEventListener('change', () => {
  videoElement.src = ''
  const fileVideo = videoInput.files[0];
  videoUrl = URL.createObjectURL(fileVideo); // create a URL for the selected video file
  videoElement.src = videoUrl; // set the video tag's src attribute to the URL of the selected file
  console.log(videoUrl, 'before test');
});

// Upload Webvtt file
const fileInputWebvtt = document.getElementById('fileInputWebvtt');
fileInputWebvtt.addEventListener('change', handleFileSelect, false);

function handleFileSelect(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(event) {
    cueList = parseWebVTT(event.target.result);
    // Do something with the cues
    console.log('onload', cueList);
    listCueList()
  };
  reader.readAsText(file);
}
function parseWebVTT(data) {
  const lines = data.split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes('-->')) {
      const parts = lines[i].split(' --> ');
      const startTime = parseTime(parts[0]);
      const endTime = parseTime(parts[1]);
      let text = '';
      for (i++; i < lines.length && lines[i]; i++) {
        text += lines[i] + '\n';
      }
      cueList.push({ startTime, endTime, text });
    }
  }
  console.log('for',cueList, cueList.length);
  return cueList;
  function parseTime(time) {
    const parts = time.split(':');
    const hours = parseInt(parts[0]);
    const minutes = parseInt(parts[1]);
    const secondsAndMilliseconds = parts[2].split('.');
    const seconds = parseInt(secondsAndMilliseconds[0]);
    const milliseconds = parseInt(secondsAndMilliseconds[1]);
    return hours * 3600 + minutes * 60 + seconds + milliseconds / 1000;
  }
  
}

cueUl = document.createElement("ul");
cueUl.classList.add('cue-list')
function listCueList(){

  // Loop through each cue in the cue list
  for (let i = 0; i < cueList.length; i++) {
    const cue = cueList[i];
    console.log(cue);
  
    // Create a div for the cue text
    cueUlLi = document.createElement("li");
    cueUlLi.innerHTML = cue.text;
    cueUlLi.classList.add(`cue${[i]}`);
    cueUlLi.addEventListener('click', () => {
    // Add an event listener to the cue div to change the video's current time to the cue's start time when clicked
    videoElement.currentTime = cue.startTime;
    console.log('You clicked on:', cue, cue.startTime, videoElement.currentTime)
    });
  
  
    // // Add an event listener to the cue div to change the video's current time to the cue's start time when clicked
    // cueUl.addEventListener("click", () => {
    //   videoElement.currentTime = cue.startTime;
    // });
    console.log('before append', cueList);
    // Add the cue div to the cue list div
    cueListDiv.appendChild(cueUl);
    cueUl.appendChild(cueUlLi)
  }
  // Searching and filter cue list
  const searchBar = document.getElementById('searchBar')
  const cueItems = document.getElementsByTagName('li');
  searchBar.addEventListener('keyup', () => {
    const filter = searchBar.value.toLowerCase();
    console.log(cueUlLi.innerHTML, filter);

    for (let i = 0; i < cueItems.length; i++) {
      const cueText = cueItems[i].innerHTML.toLowerCase();

      if (cueText.includes(filter)) {
        cueItems[i].style.display = '';
        console.log('good');
      } else {
        cueItems[i].style.display = 'none';
        console.log('bad');
      }
    }
  });

}



// Textarea for note-taking feature
const noteTextarea = document.getElementById('noteTextarea');

// Shortcut test
window.addEventListener('keydown', function(event) {
  // Check if the "Ctrl" key is pressed and the "S" key is pressed
  if (event.ctrlKey && event.key === 's') {
    // Prevent the default behavior of saving the page
    event.preventDefault();
    // Change the text in the textarea
    noteTextarea.value = 'Keyboard shortcut works!';
  }
});

// Configure keyboard shortcut button to pop up
const configureShortcutBtn = document.getElementById("shortcutBtn");
const configureShortcutPopup = document.getElementById("configure-shortcut-popup");

configureShortcutBtn.addEventListener("click", () => {
  configureShortcutPopup.classList.toggle("hidden");
});

// When keyboard shortcut + button is pressed
const addShortcutBtn = document.getElementById("add-shortcut-btn");
const addShortcutPopup = document.getElementById("add-shortcut-popup");
const popup = document.getElementById("configure-shortcut-popup");
const closeButton = document.getElementById("close-popup-btn");

closeButton.addEventListener("click", () => {
   popup.classList.add("hidden");
});
addShortcutBtn.addEventListener("click", () => {
  addShortcutPopup.classList.toggle("hidden")
  if(!addShortcutPopup.classList.contains('hidden')) {
    addShortcutBtn.innerText = '-'
  } else {
    addShortcutBtn.innerHTML = '+'
  }
});

// Creating the list of keyboard with what it means

window.addEventListener('keydown', function(event) {
  keyboardShortcutArr.forEach(obj => {
    const shortcut = obj.shortcut;
    
    if(addShortcutPopup.classList.contains('hidden') && document.activeElement !== searchBar){
      
      if(shortcut.length <= 1){
        for (let i = 0; i < shortcut.length; i++) {
          
          // Check if the "Ctrl" key is pressed and the "S" key is pressed
          if (event.key === shortcut[i]) {
            // Prevent the default behavior of saving the page
            event.preventDefault();
            // Change the text in the textarea
            noteTextarea.value = obj.meaning
            console.log(obj.meaning);
          } 
          console.log(shortcut[i]);
        }
      }

      }
    
  });
});
    
  
 

// Keyboard shortcut save button
const saveShortcutBtn = document.querySelector('#save-shortcut-btn');
saveShortcutBtn.addEventListener('click', () => {
  const shortcutInput = document.querySelector('#shortcut-input');
  const shortcutMeaningInput = document.querySelector('#shortcut-meaning-input');
  const shortcutDescriptionInput = document.querySelector('#shortcut-description-input');
  
  const shortcut = shortcutInput.value;
  const meaning = shortcutMeaningInput.value;
  const description = shortcutDescriptionInput.value;

  if(shortcutInput.value !== '' && shortcutMeaningInput.value !== '' && shortcut.length <= 1 ){
    keyboardShortcutArr.push({ shortcut, meaning, description });
    console.log(keyboardShortcutArr);
    
    // close the pop-up window and reset input value
    addShortcutPopup.classList.toggle("hidden")
    shortcutInput.value = ''
    shortcutMeaningInput.value = ''
    shortcutDescriptionInput.value = ''
    const span = document.createElement('span')
    const hr = document.createElement('hr')
    for (let i = 0; i < keyboardShortcutArr.length; i++) {
      const cueObj = keyboardShortcutArr[i];
      span.textContent = `${cueObj.shortcut}: ${cueObj.meaning}`
      shortcutlistDiv.appendChild(span)
      shortcutlistDiv.appendChild(hr)
      console.log(span);
    }
  } else {
    console.log('Shortcut input must only have one letter and the meaning input must be filled');
  }
  
  addShortcutBtn.innerHTML = '+'
  
});


// End of Shortcut test

videoSelectBtn.onclick = getVideoSources;

// Get the available video sources
async function getVideoSources() {
  const inputSources = await desktopCapturer.getSources({
    types: ['window', 'screen']
  });

  const videoOptionsMenu = Menu.buildFromTemplate(
    inputSources.map(source => {
      return {
        label: source.name,
        click: () => selectSource(source)
      };
    })
  );

  videoOptionsMenu.popup();
}

// Change the videoSource window to record
async function selectSource(source) {
  videoSelectBtn.innerText = source.name;

  const constraints = {
    audio: {
      audio: {
        mandatory: {
          chromeMediaSource: 'desktop'
        }
      }
    },
    video: {
      mandatory: {
        chromeMediaSource: 'desktop',
        chromeMediaSourceId: source.id
      }
    }
  };

  // Create a Stream
  const stream = await navigator.mediaDevices.getUserMedia(constraints);

  // Preview the source in a video element
  videoElement.srcObject = null;
  videoElement.srcObject = stream;
  videoElement.play();

  // Create the Media Recorder
  const options = { mimeType: 'video/webm; codecs=vp9' };
  mediaRecorder = new MediaRecorder(stream, options);

  // Register Event Handlers
  mediaRecorder.ondataavailable = handleDataAvailable;
  mediaRecorder.onstop = handleStop;

  // Enable note-taking textarea and save note button
  noteTextarea.disabled = false;

  // Updates the UI
  

}


// Captures all recorded chunks
function handleDataAvailable(e) {
  recordedChunks.push(e.data);
}

// Saves the video and note file on stop
async function handleStop(e) {
  const blob = new Blob(recordedChunks, {
    type: 'video/webm; codecs=vp9'
  });

  const buffer = Buffer.from(await blob.arrayBuffer());

  const { filePath } = await dialog.showSaveDialog({
    buttonLabel: 'Save video',
    defaultPath: `vid-${Date.now()}.webm`
  });

  if (filePath) {
    writeFile(filePath, buffer, () => console.log('video saved successfully!'));
  }

  // Formatting Timestamp time
  function formatTime(time) {
    const date = new Date(time * 1000);
    const hours = date.getUTCHours().toString().padStart(2, '0');
    const minutes = date.getUTCMinutes().toString().padStart(2, '0');
    const seconds = date.getUTCSeconds().toString().padStart(2, '0');
    const milliseconds = (time % 1).toFixed(3).slice(2, 5);
    return `${hours}:${minutes}:${seconds}.${milliseconds}`;
  }

  function noteDataToWebVTT(data) {
    let result = "WEBVTT\n\n";
    let cueStartTime
    let cueEndTime
    for (let i = 0; i < data.length; i++) {
      cueEndTime = data[i].time;
      if(cueEndTime >= 10){
        cueStartTime = cueEndTime - 10;
        console.log('bigger than 10');
      } else {
        cueStartTime = 0
        console.log('smaller than 10');
      }
    //  const cueStartTime = data[i].time - 10;
      const cueText = data[i].text;
  
      result += `${formatTime(cueStartTime)} --> ${formatTime(cueEndTime)}\n`;
      result += `${cueText}\n\n`;
      console.log(data[i])
    }
  
    return result;
  }
  console.log('before convert data',noteData)

  // Convert note data to webvtt format and save to file
  const webvttData = noteDataToWebVTT(noteData);
  const webvttBuffer = Buffer.from(webvttData, 'utf-8');
  const webvttFilePath = `${filePath}.vtt`;
  writeFile(webvttFilePath, webvttBuffer, (err) => {
    if (err) {
        console.log(`Failed to write webvtt file: ${err.message}`);
      } else {
        console.log('webvtt file saved successfully!', noteData);
      }
    });
    console.log('after convert data',noteData)
    // Clear note data
    noteData = [];
  
    // Reset UI state
    videoSelectBtn.innerText = 'Select Source';
    noteTextarea.value = '';
    noteTextarea.disabled = true;
    recordedChunks = [];
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'Start';
  }

  

  

