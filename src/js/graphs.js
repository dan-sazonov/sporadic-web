import Chart from 'chart.js/auto';

window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/eligrey-classlist-js-polyfill@1.2.20171210/classList.min.js">' +
  '<\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/findindex_polyfill_mdn"><\/script>');


// Да, я слышал про DRY. Интересно, почему код должен быть сухим?🤔
let height_graph = new Chart(document.getElementById("height_graph"), {
  type: 'line',
  data: {
    labels: [0],
    datasets: [{
      data: [0],
      label: "Высота, м",
      borderColor: "#3e95cd",
      fill: false
    }]
  },
  options: {
    title: {
      display: true,
      text: 'Высота, м'
    },
    animation: {
      duration: 0 // если включить анимацию, будет красиво, но криво. графики медленно на такой частоте строятся
    }
  }
});

let press_graph = new Chart(document.getElementById("press_graph"), {
  type: 'line',
  data: {
    labels: [0],
    datasets: [{
      data: [0],
      label: "Давление, Па",
      borderColor: "#3e95cd",
      fill: false
    }]
  },
  options: {
    title: {
      display: true,
      text: 'Давление, Па'
    },
    animation: {
      duration: 0
    }
  }
});

let acc_graph = new Chart(document.getElementById("acc_graph"), {
  type: 'line',
  data: {
    labels: [0],
    datasets: [{
      data: [0],
      label: "Ускорение, м/с^2",
      borderColor: "#3e95cd",
      fill: false
    }]
  },
  options: {
    title: {
      display: true,
      text: 'Ускорение, м/с^2'
    },
    animation: {
      duration: 0
    }
  }
});

let temp_graph = new Chart(document.getElementById("temp_graph"), {
  type: 'line',
  data: {
    labels: [0],
    datasets: [{
      data: [0],
      label: "Температура, ℃",
      borderColor: "#3e95cd",
      fill: false
    }]
  },
  options: {
    title: {
      display: true,
      text: 'Температура, ℃'
    },
    animation: {
      duration: 0
    }
  }
});


function update_data(pack, height, press, acc, temp) {
  height_graph.data.labels.push(pack);
  height_graph.data.datasets.forEach((dataset) => {
    dataset.data.push(height);
  });
  height_graph.update();

  press_graph.data.labels.push(pack);
  press_graph.data.datasets.forEach((dataset) => {
    dataset.data.push(press);
  });
  press_graph.update();

  acc_graph.data.labels.push(pack);
  acc_graph.data.datasets.forEach((dataset) => {
    dataset.data.push(acc);
  });
  acc_graph.update();

  temp_graph.data.labels.push(pack);
  temp_graph.data.datasets.forEach((dataset) => {
    dataset.data.push(temp);
  });
  temp_graph.update();
}

export {update_data}
