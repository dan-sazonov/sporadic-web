//import {connectSerial, sendCharacterNumber, sendSerialLine, serialResultsDiv} from './monitor';
import {renderer, camera, scene} from './webgl';
import ApexCharts from "apexcharts";
import { invoke } from '@tauri-apps/api/tauri'
import {readTextFile, writeFile, readDir, copyFile, createDir, removeDir, removeFile, renameFile, BaseDirectory} from '@tauri-apps/api/fs'
import {appDir} from '@tauri-apps/api/path';
import { AlwaysStencilFunc } from 'three';
import * as THREE from "three";

//var filemanager = require('easy-file-manager')

//const invoke = window.__TAURI__.invoke;

const AHRS = require('ahrs');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/eligrey-classlist-js-polyfill@1.2.20171210/classList.min.js">' +
  '<\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/findindex_polyfill_mdn"><\/script>');
var sampleFreq = 100.0;  // sample frequency in Hz
var betaDef    =  1;   // 2 * proportional gain

// //---------------------------------------------------------------------------------------------------
// // Variable definitions
class SMA {
  constructor(filval) {
    this.filval = filval;
  }
  calc(newval) {
    var k = 0.01;
    if (Math.abs(newval - this.filval) > 1.5) k = 0.9
    this.filval += (newval - this.filval) * k;
    return this.filval;
  }
}
class SK{
  constructor(err_measure, oprosspeed){
    this._err_measure = parseFloat(err_measure);
    this._q = parseFloat(oprosspeed);
    this._kalman_gain = 0.;
    this._current_estimate = 0.;
    this._last_estimate = 0.
    this._err_estimate = parseFloat(err_measure);
  }
  calc(newval){
    this._kalman_gain = this._err_estimate / (this._err_estimate + this._err_measure);
    this._current_estimate = this._last_estimate + this._kalman_gain * (newval - this._last_estimate);
    this._err_estimate = (1. - this._kalman_gain) * this._err_estimate + Math.abs(this._last_estimate - this._current_estimate) * this._q;
    this._last_estimate = this._current_estimate;
    return parseFloat(this._current_estimate);
  }
}
var smax = new SK(0.15, 0.05);
var smay = new SK(0.15, 0.05);
var smaz = new SK(0.15, 0.05);
var smmx = new SK(20., 0.05);
var smmy = new SK(20., 0.05);
var smmz = new SK(20., 0.05);
appDir().then(q => {
  readDir(q).then(d => {
    console.log(d)
  });
});

function init(){
  let myMap = new ymaps.Map("map", {
    center: [51.7, 36.2],
    zoom: 12
  });
}

var coordination = readTextFile('./data/smth.txt', {dir: BaseDirectory.App});
var arr = [];
coordination.then(
  coordinates => {

  },
  error => {
    // вторая функция - запустится при вызове reject
    createDir("data", {dir: BaseDirectory.App, recursive: true,});
    writeFile({contents: "[DATATATATA]", path: './data/smth.txt'}, {dir: BaseDirectory.App});
  }
);
var coordinationt = readTextFile('./smth.txt', {dir: BaseDirectory.App});
coordinationt.then(
  coordinates => {

  },
  error => {
    // вторая функция - запустится при вызове reject
    writeFile({contents: "[DATATATATA]", path: './smth.txt'}, {dir: BaseDirectory.App});
  }
);


var beta = betaDef;                         // 2 * proportional gain (Kp)
var w = 1.0, x = 0.0, y = 0.0, z = 0.0;
function to_matrix_z(angle){
  var matrix = [];
  var row = [];
  var row1 = [];
  var row2 = [];
  row[0] = Math.cos(angle);
  row[1] = Math.sin(angle);
  row[2] = 0;
  matrix[0] = row;
  row1[0] = -Math.sin(angle);
  row1[1] = Math.cos(angle);
  row1[2] = 0;
  matrix[1] = row1;
  row2[0] = 0;
  row2[1] = 0;
  row2[2] = 1;
  matrix[2] = row2;
  return matrix;
}
function to_matrix_x(angle){
  var matrix = [];
  var row = [];
  var row1 = [];
  var row2 = [];
  row[0] = 1;
  row[1] = 0;
  row[2] = 0;
  matrix[0] = row;
  row1[0] = 0;
  row1[1] = Math.cos(angle);
  row1[2] = Math.sin(angle);
  matrix[1] = row1;
  row2[0] = 0;
  row2[1] = -Math.sin(angle);
  row2[2] = Math.cos(angle);
  matrix[2] = row2;
  return matrix;
}
function to_matrix_R(y, b, a){
  var matrix = [];
  var row = [];
  var row1 = [];
  var row2 = [];
  //y = y * (180/Math.PI);
  //b = b * (180/Math.PI);
  //a = a * (180/Math.PI);
  row[0] = Math.cos(a) * Math.cos(y) - Math.cos(b) * Math.sin(a) * Math.sin(y);
  row[1] = Math.cos(b) * Math.cos(y) * Math.sin(a) + Math.cos(a) * Math.sin(y);
  row[2] = Math.sin(a) * Math.sin(b);
  matrix[0] = row;
  row1[0] = -Math.cos(y) * Math.sin(a) - Math.cos(a) * Math.cos(b) * Math.sin(y);
  row1[1] = Math.cos(a) * Math.cos(b) * Math.cos(y) - Math.sin(a) * Math.sin(y);
  row1[2] = Math.cos(a) * Math.sin(b);
  matrix[1] = row1;
  row2[0] = Math.sin(b) * Math.sin(y);
  row2[1] = -Math.cos(y) * Math.sin(b);
  row2[2] = Math.cos(b);
  matrix[2] = row2;
  return matrix;
}
function to_matrix_Q(x, y, z, w){
  var matrix = [];
  var row = [];
  var row1 = [];
  var row2 = [];
  //y = y * (180/Math.PI);
  //b = b * (180/Math.PI);
  //a = a * (180/Math.PI);

  //row[0] = Math.cos(a) * Math.cos(y) - Math.cos(b) * Math.sin(a) * Math.sin(y);
  //row[1] = Math.cos(b) * Math.cos(y) * Math.sin(a) + Math.cos(a) * Math.sin(y);
  //row[2] = Math.sin(a) * Math.sin(b);
  row[0] = 1 - 2*(y*y + z*z);
  row[1] = 2*(x*y + w*z);
  row[2] = 2*(x*z - w*y);
  matrix[0] = row;

  //row1[0] = -Math.cos(y) * Math.sin(a) - Math.cos(a) * Math.cos(b) * Math.sin(y);
  //row1[1] = Math.cos(a) * Math.cos(b) * Math.cos(y) - Math.sin(a) * Math.sin(y);
  //row1[2] = Math.cos(a) * Math.sin(b);
  row1[0] = 2*(x*y - w*z);
  row1[1] = 1 - 2*(x*x + z*z);
  row1[2] = 2*(y*z + w*x);
  matrix[1] = row1;

  //row2[0] = Math.sin(b) * Math.sin(y);
  //row2[1] = -Math.cos(y) * Math.sin(b);
  //row2[2] = Math.cos(b);
  row2[0] = 2*(x*z + w*y);
  row2[1] = 2*(y*z - w*x);
  row2[2] = 1 - 2*(x*x + y*y);

  matrix[2] = row2;
  return matrix;
}
function MultiplyMatrix3x1(A,B)
{

  var MMrow1 = A[0][0]*B[0] + A[1][0]*B[1] + A[2][0]*B[2];
  var MMrow2 = A[0][1]*B[0] + A[1][1]*B[1] + A[2][1]*B[2];
  var MMrow3 = A[0][2]*B[0] + A[1][2]*B[1] + A[2][2]*B[2];
  var C = [[MMrow1], [MMrow2], [MMrow3]]
  return C;
}
function MultiplyMatrix(A,B)
{
  var rowsA = 3, colsA = 3,
    rowsB = 3, colsB = 1,
    C = [];
  if (colsA != rowsB) return false;
  for (var i = 0; i < rowsA; i++) C[ i ] = [];
  for (var k = 0; k < colsB; k++)
  { for (var i = 0; i < rowsA; i++)
  { var t = 0;
    for (var j = 0; j < rowsB; j++) t += A[ i ][j]*B[j][k];
    C[ i ][k] = t;
  }
  }
  return C;
}
function MinusMatrix(A,B)       //На входе двумерные массивы одинаковой размерности
{
  var m = A.length, n = A[0].length, C = [];
  for (var i = 0; i < m; i++)
  { C[ i ] = [];
    for (var j = 0; j < n; j++) C[ i ][j] = A[ i ][j]-B[ i ][j];
  }
  return C;
}
function madgwickAHRSupdate(gx, gy, gz, ax, ay, az, mx, my, mz) {
  var recipNorm;
  var s0, s1, s2, s3;
  var qDot1, qDot2, qDot3, qDot4;
  var hx, hy;
  var V_2wmx, V_2wmy, V_2wmz, V_2xmx, V_2bx, V_2bz, V_4bx, V_4bz, V_2w, V_2x, V_2y, V_2z, V_2wy, V_2yz;
  var ww, wx, wy, wz, xx, xy, xz, yy, yz, zz;

//     // Use IMU algorithm if magnetometer measurement invalid (avoids NaN in magnetometer normalisation)
  if ((mx === 0.0) && (my === 0.0) && (mz === 0.0)) {
    madgwickAHRSupdateIMU(gx, gy, gz, ax, ay, az);
    return;
  }

//     // Rate of change of quaternion from gyroscope
  qDot1 = 0.5 * (-x * gx - y * gy - z * gz);
  qDot2 = 0.5 * (w * gx + y * gz - z * gy);
  qDot3 = 0.5 * (w * gy - x * gz + z * gx);
  qDot4 = 0.5 * (w * gz + x * gy - y * gx);

//     // Compute feedback only if accelerometer measurement valid (avoids NaN in accelerometer normalisation)
  if (!((ax === 0.0) && (ay === 0.0) && (az === 0.0))) {

//         // Normalise accelerometer measurement
    recipNorm = Math.pow(ax * ax + ay * ay + az * az,  -0.5);
    ax *= recipNorm;
    ay *= recipNorm;
    az *= recipNorm;

//         // Normalise magnetometer measurement
    recipNorm = Math.pow(mx * mx + my * my + mz * mz, -0.5);
    mx *= recipNorm;
    my *= recipNorm;
    mz *= recipNorm;

//         // Auxiliary variables to avoid repeated arithmetic
    V_2wmx = 2.0 * w * mx;
    V_2wmy = 2.0 * w * my;
    V_2wmz = 2.0 * w * mz;
    V_2xmx = 2.0 * x * mx;
    V_2w = 2.0 * w;
    V_2x = 2.0 * x;
    V_2y = 2.0 * y;
    V_2z = 2.0 * z;
    V_2wy = 2.0 * w * y;
    V_2yz = 2.0 * y * z;
    ww = w * w;
    wx = w * x;
    wy = w * y;
    wz = w * z;
    xx = x * x;
    xy = x * y;
    xz = x * z;
    yy = y * y;
    yz = y * z;
    zz = z * z;

//         // Reference direction of Earth's magnetic field
    hx = mx * ww - V_2wmy * z + V_2wmz * y + mx * xx + V_2x * my * y + V_2x * mz * z - mx * yy - mx * zz;
    hy = V_2wmx * z + my * ww - V_2wmz * x + V_2xmx * y - my * xx + my * yy + V_2y * mz * z - my * zz;
    V_2bx = Math.sqrt(hx * hx + hy * hy);
    V_2bz = -V_2wmx * y + V_2wmy * x + mz * ww + V_2xmx * z - mz * xx + V_2y * my * z - mz * yy + mz * zz;
    V_4bx = 2.0 * V_2bx;
    V_4bz = 2.0 * V_2bz;

//         // Gradient decent algorithm corrective step
    s0 = -V_2y * (2.0 * xz - V_2wy - ax) + V_2x * (2.0 * wx + V_2yz - ay) - V_2bz * y * (V_2bx * (0.5 - yy - zz) + V_2bz * (xz - wy) - mx) + (-V_2bx * z + V_2bz * x) * (V_2bx * (xy - wz) + V_2bz * (wx + yz) - my) + V_2bx * y * (V_2bx * (wy + xz) + V_2bz * (0.5 - xx - yy) - mz);
    s1 = V_2z * (2.0 * xz - V_2wy - ax) + V_2w * (2.0 * wx + V_2yz - ay) - 4.0 * x * (1 - 2.0 * xx - 2.0 * yy - az) + V_2bz * z * (V_2bx * (0.5 - yy - zz) + V_2bz * (xz - wy) - mx) + (V_2bx * y + V_2bz * w) * (V_2bx * (xy - wz) + V_2bz * (wx + yz) - my) + (V_2bx * z - V_4bz * x) * (V_2bx * (wy + xz) + V_2bz * (0.5 - xx - yy) - mz);
    s2 = -V_2w * (2.0 * xz - V_2wy - ax) + V_2z * (2.0 * wx + V_2yz - ay) - 4.0 * y * (1 - 2.0 * xx - 2.0 * yy - az) + (-V_4bx * y - V_2bz * w) * (V_2bx * (0.5 - yy - zz) + V_2bz * (xz - wy) - mx) + (V_2bx * x + V_2bz * z) * (V_2bx * (xy - wz) + V_2bz * (wx + yz) - my) + (V_2bx * w - V_4bz * y) * (V_2bx * (wy + xz) + V_2bz * (0.5 - xx - yy) - mz);
    s3 = V_2x * (2.0 * xz - V_2wy - ax) + V_2y * (2.0 * wx + V_2yz - ay) + (-V_4bx * z + V_2bz * x) * (V_2bx * (0.5 - yy - zz) + V_2bz * (xz - wy) - mx) + (-V_2bx * w + V_2bz * y) * (V_2bx * (xy - wz) + V_2bz * (wx + yz) - my) + V_2bx * x * (V_2bx * (wy + xz) + V_2bz * (0.5 - xx - yy) - mz);
    recipNorm = Math.pow(s0 * s0 + s1 * s1 + s2 * s2 + s3 * s3, -0.5); // normalise step magnitude
    s0 *= recipNorm;
    s1 *= recipNorm;
    s2 *= recipNorm;
    s3 *= recipNorm;

//         // Apply feedback step
    qDot1 -= beta * s0;
    qDot2 -= beta * s1;
    qDot3 -= beta * s2;
    qDot4 -= beta * s3;
  }

//     // Integrate rate of change of quaternion to yield quaternion
  w += qDot1 * (1.0 / sampleFreq);
  x += qDot2 * (1.0 / sampleFreq);
  y += qDot3 * (1.0 / sampleFreq);
  z += qDot4 * (1.0 / sampleFreq);

//     // Normalise quaternion
  recipNorm = Math.pow(w * w + x * x + y * y + z * z, -0.5);
  w *= recipNorm;
  x *= recipNorm;
  y *= recipNorm;
  z *= recipNorm;


  var result = toEuler(x, y, z, w);


  return result;

}
var schetchik = 0;
var pitch;
var yaw ;
var roll;

function toEuler(x, y, z, w){
  var qw = parseFloat(w);
  var qx = parseFloat(x);
  var qy = parseFloat(y);
  var qz = parseFloat(z)

  var qw2 = qw*qw;
  var qx2 = qx*qx;
  var qy2 = qy*qy;
  var qz2 = qz*qz;
  var test= qx*qy + qz*qw;

  if (test > 0.499) {
    pitch = 90;
    yaw = 360/Math.PI*Math.atan2(qx,qw);
    roll = 0;

  }
  if (test < -0.499) {
    pitch = -90;
    yaw = -360/Math.PI*Math.atan2(qx,qw);
    roll = 0;

  }
  var p = Math.asin(2*qx*qy+2*qz*qw);
  var y = Math.atan2(2*qy*qw-2*qx*qz,1-2*qy2-2*qz2);
  var r = Math.atan2(2*qx*qw-2*qy*qz,1-2*qx2-2*qz2);

  pitch = Math.round(p*180/Math.PI);
  yaw = Math.round(y*180/Math.PI);
  roll = Math.round(r*180/Math.PI);

  var objnya = {
    x: roll,
    y: pitch,
    z: yaw
  };
  console.log(objnya);
  document.getElementById("pitch").innerHTML=pitch;
  document.getElementById("roll").innerHTML=roll;
  document.getElementById("yaw").innerHTML=yaw;

  return objnya;
}

let packs_num = [];
let vals = {
  height: [],
  press: [],
  acc: [],
  temp: []
};

let options = {
  xaxis: {
    categories: packs_num,
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
const copySign = (x, y) => Math.sign(x) === Math.sign(y) ? x : -x;
function toEulerS(x, y, z, w){
  var qw = parseFloat(w);
  var qx = parseFloat(x);
  var qy = parseFloat(y);
  var qz = parseFloat(z)
  var sinr_cosp = 2 * (qw * qx + qy * qz);
  var cosr_cosp = 1 - 2 * (qx * qx + qy * qy);
  var roll = Math.atan2(sinr_cosp, cosr_cosp);
  var sinp = 2 * (qw * qy - qz * qx);
  var pitch = 0;
  if (Math.abs(sinp) >= 1){
    pitch = copySign(Math.PI / 2, sinp);
  } else {
    pitch = Math.asin(sinp);
  }
  var siny_cosp = 2 * (qw * qz + qx * qy);
  var cosy_cosp = 1 - 2 * (qy * qy + qz * qz);
  var yaw = Math.atan2(siny_cosp, cosy_cosp);
  pitch = Math.round(pitch*180/Math.PI);
  yaw = Math.round(yaw*180/Math.PI);
  roll = Math.round(roll*180/Math.PI);
  return {
    heading: yaw,
    pitch: pitch,
    roll: roll,
  }
}

var height_graph = {
  series: [{
    data: vals.height
  }],
  chart: {
    id: 'realtime',
    height: 350,
    type: 'line',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    toolbar: {
      show: false
    },
    zoom: {
      enabled: true,
      type: 'x',
      autoScaleYaxis: false,
      zoomedArea: {
        fill: {
          color: '#90CAF9',
          opacity: 0.4
        },
        stroke: {
          color: '#0D47A1',
          opacity: 0.4,
          width: 1
        }
      }
    }
  },
  dataLabels: {
    enabled: false
  },
  stroke: {
    curve: 'straight'
  },

  markers: {
    size: 0
  },

  xaxis: {
    categories: packs_num,
    max: 15,
    range: 7,

    floating: true,
    axisTicks: {
      show: false
    },
    axisBorder: {
      show: false
    },
    labels: {
      show: false
    },
  },
  yaxis: {
    range: 15,
    labels: {},
    title: {
      text: 'Высота'
    },
  },
  title: {
    text: 'График высоты',
    align: 'center'
  },
  legend: {
    show: false
  },
};
var press_graph = {
  series: [{
    data: vals.press
  }],
  chart: {
    id: 'realtime',
    height: 350,
    type: 'line',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    toolbar: {
      show: false
    },
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

  markers: {
    size: 0
  },
  yaxis: {
    range: 15,
  },
  xaxis: {
    categories: packs_num,
    max: 15,
    range: 7,

    floating: true,
    axisTicks: {
      show: false
    },
    axisBorder: {
      show: false
    },
    labels: {
      show: false
    },
  },
  title: {
    text: 'График давления',
    align: 'center'
  },
  legend: {
    show: false
  },
};
var acc_graph = {
  series: [{
    data: vals.acc
  }],
  chart: {
    id: 'realtime',
    height: 350,
    type: 'line',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    toolbar: {
      show: false
    },
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

  markers: {
    size: 0
  },
  yaxis: {
    range: 15,
  },
  xaxis: {
    categories: packs_num,
    max: 15,
    range: 7,

    floating: true,
    axisTicks: {
      show: false
    },
    axisBorder: {
      show: false
    },
    labels: {
      show: false
    },
  },
  title: {
    text: 'График ускорения',
    align: 'center'
  },
  legend: {
    show: false
  },
};
var temp_graph = {
  series: [{
    data: vals.temp
  }],
  chart: {
    id: 'realtime',
    height: 350,
    type: 'line',
    animations: {
      enabled: true,
      easing: 'linear',
      dynamicAnimation: {
        speed: 1000
      }
    },
    toolbar: {
      show: false
    },
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

  markers: {
    size: 0
  },
  xaxis: {
    categories: packs_num,
    max: 15,
    range: 7,

    floating: true,
    axisTicks: {
      show: false
    },
    axisBorder: {
      show: false
    },
    labels: {
      show: false
    },
  },
  yaxis: {
    range: 15,
  },
  title: {
    text: 'График температуры',
    align: 'center'
  },
  legend: {
    show: false
  },
};

//fs.writeFile('./sporadic-web-0.1.1/telemetry.txt', packnum, { flag: 'a+' }, err => {});
console.log("Gotcha!");
// localStorage.lastData;
// ^ последнее, что прочитано с ком-порта
let height_rend = new ApexCharts(document.querySelector("#height_graph"), Object.assign(height_graph, options));
let press_rend = new ApexCharts(document.querySelector("#press_graph"), Object.assign(press_graph, options));
let acc_rend = new ApexCharts(document.querySelector("#acc_graph"), Object.assign(acc_graph, options));
let temp_rend = new ApexCharts(document.querySelector("#temp_graph"), Object.assign(temp_graph, options));

var angles = [0., 0., 0.];
const madgwick = new AHRS({
  /*
   * The sample interval, in Hz.
   *
   * Default: 20
   */
  sampleInterval: 40,

  /*
   * Choose from the `Madgwick` or `Mahony` filter.
   *
   * Default: 'Madgwick'
   */
  algorithm: 'Madgwick',

  /*
   * The filter noise value, smaller values have
   * smoother estimates, but have higher latency.
   * This only works for the `Madgwick` filter.
   *
   * Default: 0.4
   */
  beta: 0.8,

  /*
   * The filter noise values for the `Mahony` filter.
   */
  kp: 0.5, // Default: 0.5
  ki: 0, // Default: 0.0

  /*
   * When the AHRS algorithm runs for the first time and this value is
   * set to true, then initialisation is done.
   *
   * Default: false
   */
  doInitialisation: false,
});
var runningavg = {
  filval: 0, coef: 0.6,
  'doStuff': function(newval) {
    var cef = 0.;
    if (Math.abs((newval - this.filval)) > 1.5){cef = 0.9;} else {cef = 0.1}
    this.filval += (newval - this.filval) * cef;
    return this.filval;
  }
};
var one = false;
var V0 = 0;
var V = 0;
var Vx0 = 0;
var Vy0 = 0;
var Vz0 = 0;
var Vx = 0;
var Vy = 0;
var Vz = 0;
var Sx = 0;
var Sy = 0;
var Sz = 0;
var S = 0;
var first = true;
var skip = 0;
var packnumprev;
// рендер графиков:
packs_num.push(0);
vals.height.push(0);
vals.press.push(0);
vals.acc.push(0);
vals.temp.push(0);

height_rend.render();
press_rend.render();
acc_rend.render();
temp_rend.render();

let port, textEncoder, writableStreamClosed, writer, historyIndex = -1;
const lineHistory = [];

function delay(delayInms) {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}

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

  try {
    while (true) {

      //localStorage.lastData = ""
      const { value, done } = await reader.read();
      if (done) {
        console.log("GOTCHA");
        break;

      }
      if (value){
        if (skip < 15){
          skip += 1;
        }

        localStorage.lastData += value;
        if (skip >= 10 && localStorage.lastData.split(';').length > 12){
          var array = localStorage.lastData.split(';');

          serialResultsDiv.innerHTML = "";
          var packnum = parseFloat(array[0]);
          var altitude = parseFloat(array[1]);

          var press = parseFloat(array[2]);
          var temp = parseFloat(array[3]);
          var magx = parseFloat(array[4]);
          var magy = parseFloat(array[5]);
          var magz = parseFloat(array[6]);
          var accelx = parseFloat(array[7]);
          var accely = parseFloat(array[8]);
          var accelz = parseFloat(array[9]);
          var gyrx = parseFloat(array[10]);
          var gyry = parseFloat(array[11]);
          var gyrz = parseFloat(array[12]);
          if (!isNaN(magx) && !isNaN(magy) && !isNaN(magz) && !isNaN(accelx/9.81) && !isNaN(accely/9.81) && !isNaN(accelz/9.81) && !isNaN(gyrx * (Math.PI/180)) && !isNaN(gyry * (Math.PI/180)) && !isNaN(gyrz * (Math.PI/180)) && (Math.sqrt(Math.pow(accelx, 2) + Math.pow(accely, 2) + Math.pow(accelz, 2)) < 250.)){
            if (first && packnum){packnumprev = packnum-1; first = false};
            magx = smmx.calc(magx);
            magy = smmy.calc(magy);
            magz = smmz.calc(magz);
            accelx += 0;
            accelx = smax.calc(accelx);
            accely += 0.1;
            accely = smay.calc(accely);
            accelz = (accelz + 0.25) * 0.989
            accelz = smaz.calc(accelz);
            serialResultsDiv.innerHTML += `> ${packnum}<br>`;
            //serialResultsDiv.innerHTML += `> ${altitude}<br>`;
            //serialResultsDiv.innerHTML += `> ${press}<br>`;
            //serialResultsDiv.innerHTML += `> ${temp}<br>`;
            serialResultsDiv.innerHTML += `> ${magx}<br>`;
            serialResultsDiv.innerHTML += `> ${magy}<br>`;
            serialResultsDiv.innerHTML += `> ${magz}<br>`;

            serialResultsDiv.innerHTML += `> ${Math.sqrt(Math.pow(accelx, 2) + Math.pow(accely, 2) + Math.pow(accelz, 2))}<br>`;
            invoke('update_txt', { jsMsg: `${packnum};${altitude};${press};${temp};${magx};${magy};${magz};${accelx};${accely};${accelz};${gyrx};${gyry};${gyrz};\n` });
            //serialResultsDiv.innerHTML += `> ${gyrx}<br>`;
            //serialResultsDiv.innerHTML += `> ${gyry}<br>`;
            //serialResultsDiv.innerHTML += `> ${gyrz}<br>`;
            packs_num.push(packnum);
            //if (packs_num.length > 6) packs_num.shift();

            vals.height.push(altitude);
            vals.press.push(press);
            vals.acc.push(Math.sqrt(Math.pow(accelx, 2) + Math.pow(accely, 2) + Math.pow(accelz, 2)));
            vals.temp.push(temp);
            /*
            schetchik+=1
            if (schetchik == 20){
              height_rend.updateSeries([{
                data: vals.height
              }]);
            }
            if (schetchik == 40){
              press_rend.updateSeries([{
                data: vals.press
              }]);
            }
            if (schetchik == 60){
              acc_rend.updateSeries([{
                data: vals.acc
              }]);
            }
            if (schetchik == 80){
              temp_rend.updateSeries([{
                data: vals.temp
              }]);
              schetchik = 0;
            }
            */


            if (!isNaN(magx) && !isNaN(magy) && !isNaN(magz) && !isNaN(accelx/9.81) && !isNaN(accely/9.81) && !isNaN(accelz/9.81) && !isNaN(gyrx * (Math.PI/180)) && !isNaN(gyry * (Math.PI/180)) && !isNaN(gyrz * (Math.PI/180)) && (Math.sqrt(Math.pow(accelx, 2) + Math.pow(accely, 2) + Math.pow(accelz, 2)) < 250.)){
              if (Math.abs(gyrx) < 2.1){gyrx=0}
              if (Math.abs(gyry) < 2.1){gyry=0}
              if (Math.abs(gyrz) < 2.1){gyrz=0}
              madgwick.update(gyrx * (Math.PI/180),  gyry* (Math.PI/180), gyrz * (Math.PI/180), accelx/9.81, accely/9.81, accelz/9.81, magx, magy, magz);
              var temp = madgwick.getEulerAngles();
              var quat = madgwick.getQuaternion();
              console.log("", temp?.roll);
              console.log("", temp?.pitch);
              console.log("", temp?.heading);
              angles[0] = temp?.pitch;
              angles[1] = temp?.heading;
              angles[2] = temp?.roll;
              var accelmatrix = [
                [accelx],
                [accely],
                [accelz]
              ];
              var matrixV3 = to_matrix_Q(quat?.x, quat?.y, quat?.z, quat?.w);
              var matrixV2 = to_matrix_R(angles[1], angles[0], angles[2]);
              var matrix_y = to_matrix_z(angles[1]);
              var matrix_b = to_matrix_x(angles[0]);
              var matrix_a = to_matrix_z(angles[2]);
              var tempmatrix = MultiplyMatrix(matrix_y, matrix_b);
              var matrixV = MultiplyMatrix(tempmatrix, matrix_a);
              var matrixSpeed = MultiplyMatrix(matrixV, accelmatrix);
              var matrixSpeedV2 = MultiplyMatrix3x1(matrixV2, accelmatrix);
              var matrixSpeedV3 = MultiplyMatrix3x1(matrixV3, accelmatrix);
              console.log("ALL MATRIXES");
              console.log("", matrixV2);
              console.log("", matrix_y);
              console.log("", matrix_b);
              console.log("", matrix_a);
              console.log("", tempmatrix);
              console.log("", matrixV);
              console.log("", matrixSpeed);
              console.log("", matrixSpeedV2);
              console.log("", matrixSpeedV3);


              var accelmatrix = [
                [0.],
                [0.],
                [9.81]
              ];
              var trueaccel = MinusMatrix(matrixSpeedV3, accelmatrix);

              if (Math.abs(trueaccel[0][0]) < 0.1) {trueaccel[0][0] = 0.;}
              if (Math.abs(trueaccel[1][0]) < 0.1) {trueaccel[1][0] = 0.;}
              if (Math.abs(trueaccel[2][0]) < 0.1) {trueaccel[2][0] = 0.;}

              console.log("", trueaccel);
              console.log("", accelx);
              console.log("", accely);
              console.log("", accelz);
              console.log("''''''''''''");

              ymaps.ready(init);

              /* function init(){
                 let myMap = new ymaps.Map("map", {
                   center: [51.7, 36.2],
                   zoom: 12
                 });
               }*/

              V = V0 + Math.sqrt(Math.pow(trueaccel[0][0], 2.) + Math.pow(trueaccel[1][0], 2.) + Math.pow(trueaccel[2][0], 2.)) * 0.03;

              Vx = Vx0 + trueaccel[0][0] * ((packnum-packnumprev) * 0.1);
              Vy = Vy0 + trueaccel[1][0] * ((packnum-packnumprev) * 0.1);
              Vz = Vz0 + trueaccel[2][0] * ((packnum-packnumprev) * 0.1);

              Sx = Vx0 * (packnum-packnumprev)*0.1 + (trueaccel[0][0] * Math.pow((packnum-packnumprev)*0.1, 2.)) / 2 + Sx;
              Sy = Vy0 * (packnum-packnumprev)*0.1 + (trueaccel[1][0] * Math.pow((packnum-packnumprev)*0.1, 2.)) / 2 + Sy;
              Sz = Vz0 * (packnum-packnumprev)*0.1 + (trueaccel[2][0] * Math.pow((packnum-packnumprev)*0.1, 2.)) / 2 + Sz;

              V0 = V;
              Vx0 = Vx;
              Vy0 = Vy;
              Vz0 = Vz;
              packnumprev = packnum;
              //fs.writeFile('./sporadic-web-0.1.1/telemetry.txt', packnum, { flag: 'a+' }, err => {});
              invoke('update_coord', { jsMsg: `${packnum};${Sx};${Sy};${Sz};n\n` });

              console.log(V);
              console.log(Sx);
              console.log(Sy);
              console.log(Sz);
              serialResultsDiv.innerHTML += `> ${Vz}<br>`;
              serialResultsDiv.innerHTML += `> ${trueaccel[0][0]}<br>`;
              serialResultsDiv.innerHTML += `> ${trueaccel[1][0]}<br>`;
              serialResultsDiv.innerHTML += `> ${trueaccel[2][0]}<br>`;
              console.log(Math.sqrt(Math.pow(accelx*angles[2], 2) + Math.pow(accely*angles[0], 2) + Math.pow(accelz*angles[1], 2)));


            }
          }

          localStorage.lastData = "";
        } else if (localStorage.lastData.split(';').length < 4){
          var array = localStorage.lastData.split(';');
          var time = array[0];
          var lat = array[1];
          var long = array[2];
        }
      }





    }
  } catch (error) {
    console.error(error);
  } finally {
    readerRef.current.releaseLock();
  }

}

const serialResultsDiv = document.getElementById("serialResults");

async function appendToTerminal(newStuff) {
  serialResultsDiv.innerHTML += newStuff;
  if (serialResultsDiv.innerHTML?.length > 3000) serialResultsDiv.innerHTML = serialResultsDiv.innerHTML
    .slice(serialResultsDiv.innerHTML?.length - 3000);

  serialResultsDiv.scrollTop = serialResultsDiv.scrollHeight;

}

function scrollHistory(direction) {
  historyIndex = Math.max(Math.min(historyIndex + direction, lineHistory?.length - 1), -1);
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

document.getElementById("baud").onclick = function () {
  this.value = ''
};
document.getElementById("baud").onchange = function () {
  localStorage.baud = this.value
};
document.getElementById("clear_btn").onclick = function () {
  var coordinat = readTextFile('./data/smth.txt', {dir: BaseDirectory.App});
  console.log("", coordinat);
  var arr = [];
  coordinat.then(
    coordinates => {
      console.log("", coordinates);
      coordinates = coordinates.split('n');
      var splinex = 0;
      var spliney = 0;
      var splinez = 0;
      for (var i = 4; i < coordinates.length; i++){
        var temp = coordinates[i].split(';');
        if (!isNaN(parseFloat(temp[1]))) splinex = parseFloat(temp[1]);
        if (!isNaN(parseFloat(temp[2]))) spliney = parseFloat(temp[2]);
        if (!isNaN(parseFloat(temp[3]))) splinez = parseFloat(temp[3]);
        arr.push(new THREE.Vector3(splinex, spliney, splinez));
      }
      const curve = new THREE.CatmullRomCurve3(arr);
      const points = curve.getPoints(256);
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const material = new THREE.LineBasicMaterial({color: 0xff0000});
      const curveObject = new THREE.Line(geometry, material);
      scene.add(curveObject);
    },
    error => {
      // вторая функция - запустится при вызове reject
      alert("Rejected: " + error); // error - аргумент reject
    }
  );

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

/*
var array = [];
var lastish = localStorage.lastData;
setInterval(function() {
  //const callRust = () => {
  //  invoke('call_rust', {jsMsg: 'どもJSです'}) // Hi It's JS
  //  .then((rustMsg) => console.log('from Rust：' + rustMsg));
  //};
  //callRust();
  console.log("Hi");
  //console.log(localStorage.lastData);
  if(lastish != localStorage.lastData && localStorage.lastData != "" && localStorage.lastData.length > 30){
    if (lastish < 50) {lastish+=localStorage.lastData;} else {lastish = localStorage.lastData;}
    //console.log ("",localStorage.lastData);
    lastish = localStorage.lastData;
    var arr = lastish.split(';', 13);
    array.push(...arr);
    if (array.length > 12 ){

      for (var i = 1; i < 12; i++){
        if (!array[i].includes('.')){
          if (array[i-1].includes('.')){
            array.splice(i-1, 2, array[i-1].concat(array[i]));
            continue;
          }
          else if (array[(i+1)%13].includes('.')){
            array.splice(i, 2, array[i].concat(array[(i+1)%13]));
            continue;
          }
        }
      }

      console.log("", array);
      if (array.length <= 14 && array[0].includes("\n") && !array[0].includes(".")){
        serialResultsDiv.innerHTML = "";
        var packnum = parseFloat(array[0]);
        var altitude = parseFloat(array[1]);
        var press = parseFloat(array[2]);
        var temp = parseFloat(array[3]);
        var magx = parseFloat(array[4]);
        var magy = parseFloat(array[5]);
        var magz = parseFloat(array[6]);
        var accelx = parseFloat(array[7]);
        var accely = parseFloat(array[8]);
        var accelz = parseFloat(array[9]);
        var gyrx = parseFloat(array[10]);
        var gyry = parseFloat(array[11]);
        var gyrz = parseFloat(array[12]);
        serialResultsDiv.innerHTML += `> ${packnum}<br>`;
        serialResultsDiv.innerHTML += `> ${altitude}<br>`;
        serialResultsDiv.innerHTML += `> ${press}<br>`;
        serialResultsDiv.innerHTML += `> ${temp}<br>`;
        serialResultsDiv.innerHTML += `> ${magx}<br>`;
        serialResultsDiv.innerHTML += `> ${magy}<br>`;
        serialResultsDiv.innerHTML += `> ${magz}<br>`;
        serialResultsDiv.innerHTML += `> ${accelx}<br>`;
        serialResultsDiv.innerHTML += `> ${accely}<br>`;
        serialResultsDiv.innerHTML += `> ${accelz}<br>`;
        packs_num.push(packnum);
        //if (packs_num.length > 6) packs_num.shift();



        vals.height.push(altitude);
        vals.press.push(press);
        vals.acc.push(Math.sqrt(Math.pow(accelx, 2) + Math.pow(accely, 2) + Math.pow(accelz, 2)));
        vals.temp.push(temp);
        height_rend.updateSeries([{
          data: vals.height
        }]);
        press_rend.updateSeries([{
          data: vals.press
        }]);
        acc_rend.updateSeries([{
          data: vals.acc
        }]);
        temp_rend.updateSeries([{
          data: vals.temp
        }]);

        if (array[0].includes("\n") && !array[0].includes(".") && !isNaN(magx) && !isNaN(magy) && !isNaN(magz) && !isNaN(accelx) && !isNaN(accely) && !isNaN(accelz) && !isNaN(gyrx) && !isNaN(gyry) && !isNaN(gyrz)){
          madgwick.update(gyrx, gyry, gyrz, accelx, accely, accelz, magx, magy, magz);
          var temp = madgwick.getEulerAngles();
          angles[0] = temp?.roll;
          angles[1] = temp?.pitch;
          angles[2] = temp?.heading;
        }
        localStorage.lastData = "";
        console.log("", angles);
      }


      /*
      if (array.length == 13){
        packs_num.push(packnum);
        vals.height.push(altitude);
        vals.press.push(press);
        vals.acc.push(Math.sqrt(Math.pow(accelx, 2) + Math.pow(accely, 2) + Math.pow(accelz, 2)));
        vals.temp.push(temp);

        height_rend.updateSeries([{data: data}]);
        press_rend.updateSeries([{data: data}]);
        acc_rend.updateSeries([{data: data}]);
        temp_rend.updateSeries([{data: data}]);
      }

      array = [];

    }

    //console.log("", arr);
    localStorage.lastData = "";
  }
}, 1);
console.log("Gotcha!");
*/
export{angles}
