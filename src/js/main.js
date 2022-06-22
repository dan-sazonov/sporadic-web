import {connectSerial, sendCharacterNumber, sendSerialLine, serialResultsDiv} from './monitor';
import {update_data} from './graphs';
import './webgl'

// localStorage.lastData;
// ^ последнее, что прочитано с ком-порта


// рендер графиков:
let i = 1;
// update_data(i, i * 2, i * 2, i * 2, i * 2);
// i++;
// update_data(i, i * 2, i * 2, i * 2, i * 2);
// i++;
// update_data(i, i * 2, i * 2, i * 2, i * 2);
// i++;
// update_data(i, i * 2, i * 2, i * 2, i * 2);
// i++;
// update_data(i, i * 2, i * 2, i * 2, i * 2);
// i++;
setInterval(function (){update_data('chart', i, i*2); i++;}, 200);
// ^ сюда передаем номер пакета, высоту, давление, ускорение, температуру
// посде этого графики перестроятся, будет добавлена новая точка


// биндим ивенты монитора:
document.getElementById("connect_btn").onclick = connectSerial;
document.getElementById("baud").onclick = function () {
  this.value = ''
};
document.getElementById("baud").onchange = function () {
  localStorage.baud = this.value
};
document.getElementById("clear_btn").onclick = function () {
  serialResultsDiv.innerHTML = '';
};
document.getElementById("send_btn").onclick = sendSerialLine;
document.getElementById("sendchr_btn").onclick = sendCharacterNumber;
document.getElementById("addLine").onclick = function () {
  localStorage.addLine = this.checked;
};
document.getElementById("echoOn").onclick = function () {
  localStorage.echoOn = this.checked;
};
