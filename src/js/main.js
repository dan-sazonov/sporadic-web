import 'airbnb-browser-shims';
import * as $ from 'jquery';
import ApexCharts from 'apexcharts'

window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/eligrey-classlist-js-polyfill@1.2.20171210/classList.min.js">' +
  '<\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/findindex_polyfill_mdn"><\/script>');

let options = {
  xaxis: {
    categories: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22],
  },
  chart: {
    height: 350,
    type: 'line',
    zoom: {
      enabled: false
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'straight'
  },
  grid: {
    row: {
      colors: ['#f3f3f3', 'transparent'], // takes an array which will be repeated on columns
      opacity: 0.5
    },
  }
};

let height_graph = {
  title: {
    text: 'График высоты',
    align: 'center'
  },
  yaxis: {
    labels: {},
    title: {
      text: 'Высота, м'
    },
  },
  series: [{
    name: "Высота, м",
    data: [2, 5, 8, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100, 200, 300, 400, 500, 600, 700, 800, 900, 1000]
  }],
};
let press_graph = {
  title: {
    text: 'График давления',
    align: 'center'
  },
  yaxis: {
    labels: {},
    title: {
      text: 'Давление, Па'
    },
  },
  series: [{
    name: "Давление, Па",
    data: [1000, 10000, 11111, 11111, 22222, 22222, 33333, 33333, 44444, 44444, 55555, 55555, 66666, 66666, 77777, 77777,
      88888, 88888, 99999, 99999, 100000, 100000]
  }],
};
let acc_graph = {
  title: {
    text: 'График ускорения',
    align: 'center'
  },
  yaxis: {
    labels: {},
    title: {
      text: 'Ускорение, м/с²'
    },
  },
  series: [{
    name: "Ускорение, м/с<sup>2</sup>",
    data: [0, 1, 2, 2, 4, 4, 6, 6, 8, 8, 10, 10, 12, 12, 14, 14, 16, 16, 18, 18, 20, 20]
  }],
};
let temp_graph = {
  title: {
    text: 'График температуры',
    align: 'center'
  },
  yaxis: {
    labels: {},
    title: {
      text: 'Температура, °C'
    },
  },
  series: [{
    name: "Температура, °C",
    data: [0, 1, 2, 2, 4, 4, 6, 6, 8, 8, 10, 10, 12, 12, 14, 14, 16, 16, 18, 18, 20, 20]
  }],
};

let height_rend = new ApexCharts(document.querySelector("#height_graph"), Object.assign(height_graph, options));
let press_rend = new ApexCharts(document.querySelector("#press_graph"), Object.assign(press_graph, options));
let acc_rend = new ApexCharts(document.querySelector("#acc_graph"), Object.assign(acc_graph, options));
let temp_rend = new ApexCharts(document.querySelector("#temp_graph"), Object.assign(temp_graph, options));

height_rend.render();
press_rend.render();
acc_rend.render();
temp_rend.render();


let port, textEncoder, writableStreamClosed, writer, historyIndex = -1;
const lineHistory = [];

async function connectSerial() {
  try {
    port = await navigator.serial.requestPort();
    await port.open({baudRate: document.getElementById("baud").value});
    await listenToPort();

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

document.getElementById("connect_btn").onclick = connectSerial;
document.getElementById("baud").onclick = function () {this.value = ''};
document.getElementById("baud").onchange = function () {localStorage.baud = this.value};
document.getElementById("clear_btn").onclick = function () {serialResultsDiv.innerHTML = '';};
document.getElementById("send_btn").onclick = sendSerialLine;
document.getElementById("sendchr_btn").onclick = sendCharacterNumber;
document.getElementById("addLine").onclick = function () {localStorage.addLine = this.checked;};
document.getElementById("echoOn").onclick = function () {localStorage.echoOn = this.checked;};
