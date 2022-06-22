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


function update_data(chrt, label, data) {
  let chart = chrt;
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  chart.update();
}

update_data(height_graph, 100, 100)
update_data(acc_graph, 100, 100)
update_data(press_graph, 100, 100)
update_data(temp_graph, 100, 100)

export {update_data}
