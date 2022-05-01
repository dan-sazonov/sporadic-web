import ApexCharts from "apexcharts";

window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/eligrey-classlist-js-polyfill@1.2.20171210/classList.min.js">' +
  '<\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/findindex_polyfill_mdn"><\/script>');

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
    data: vals.height
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
    data: vals.press
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
    data: vals.acc
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
    data: vals.temp
  }],
};

function update_data(pack, height, press, acc, temp) {
  packs_num.push(pack);
  vals.height.push(height);
  vals.press.push(press);
  vals.acc.push(acc);
  vals.temp.push(temp);

  let height_rend = new ApexCharts(document.querySelector("#height_graph"), Object.assign(height_graph, options));
  let press_rend = new ApexCharts(document.querySelector("#press_graph"), Object.assign(press_graph, options));
  let acc_rend = new ApexCharts(document.querySelector("#acc_graph"), Object.assign(acc_graph, options));
  let temp_rend = new ApexCharts(document.querySelector("#temp_graph"), Object.assign(temp_graph, options));

  height_rend.render();
  press_rend.render();
  acc_rend.render();
  temp_rend.render();
}

export {update_data}
