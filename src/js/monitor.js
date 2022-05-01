let port, textEncoder, writableStreamClosed, writer, historyIndex = -1;
const lineHistory = [];

async function connectSerial() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({baudRate: document.getElementById("baud").value});
    listenToPort();

    textEncoder = new TextEncoderStream();
    writableStreamClosed = textEncoder.readable.pipeTo(port.writable);

    writer = textEncoder.writable.getWriter();
  } catch {
    alert("Serial Connection Failed");
  }
}

async function sendCharacterNumber() {
  document.getElementById("lineToSend").value = String
    .fromCharCode(document.getElementById("lineToSend").value);
}

async function sendSerialLine() {
  let dataToSend;
  dataToSend = document.getElementById("lineToSend").value;
  lineHistory.unshift(dataToSend);
  historyIndex = -1; // No history entry selected
  if (document.getElementById("addLine").checked === true) dataToSend = dataToSend + "\r\n";
  if (document.getElementById("echoOn").checked === true) await appendToTerminal(`> ${dataToSend}<br>`);
  await writer.write(dataToSend);
  document.getElementById("lineToSend").value = "";
}

async function listenToPort() {
  const textDecoder = new TextDecoderStream();
  const readableStreamClosed = port.readable.pipeTo(textDecoder.writable); // не торгать!
  const reader = textDecoder.readable.getReader();

  while (true) {
    const {value, done} = await reader.read();
    if (done) {
      break;
    }
    await appendToTerminal(`> ${value}<br>`);
  }
}

const serialResultsDiv = document.getElementById("serialResults");

async function appendToTerminal(newStuff) {
  serialResultsDiv.innerHTML += newStuff;
  if (serialResultsDiv.innerHTML.length > 3000) serialResultsDiv.innerHTML = serialResultsDiv.innerHTML
    .slice(serialResultsDiv.innerHTML.length - 3000);

  serialResultsDiv.scrollTop = serialResultsDiv.scrollHeight;
}

function scrollHistory(direction) {
  historyIndex = Math.max(Math.min(historyIndex + direction, lineHistory.length - 1), -1);
  if (historyIndex >= 0) {
    document.getElementById("lineToSend").value = lineHistory[historyIndex];
  } else {
    document.getElementById("lineToSend").value = "";
  }
}

document.getElementById("lineToSend").addEventListener("keyup", async function (event) {
  if (event.keyCode === 13) {
    await sendSerialLine();
  } else if (event.keyCode === 38) { // Key up
    scrollHistory(1);
  } else if (event.keyCode === 40) { // Key down
    scrollHistory(-1);
  }
})

document.getElementById("baud").value = (localStorage.baud === undefined ? 9600 : localStorage.baud);
document.getElementById("addLine").checked = (localStorage.addLine !== "false");
document.getElementById("echoOn").checked = (localStorage.echoOn !== "false");


export {connectSerial, serialResultsDiv, sendSerialLine, sendCharacterNumber};
