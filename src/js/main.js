import {connectSerial, sendCharacterNumber, sendSerialLine, serialResultsDiv} from './monitor';
import {update_data} from './graphs';
import './webgl'

// localStorage.lastData;
// ^ последнее, что прочитано с ком-порта


// рендер графиков:
update_data(1, 1, 1, 1, 1);
// ^ сюда передаем номер пакета, высоту, давление, ускорение, температуру
// после этого графики перестроятся, будет добавлена новая точка


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
