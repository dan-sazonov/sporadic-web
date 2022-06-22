import Chart from 'chart.js/auto';

window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/promise-polyfill@8/dist/polyfill.min.js"><\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/eligrey-classlist-js-polyfill@1.2.20171210/classList.min.js">' +
  '<\/script>');
window.Promise ||
document.write('<script src="https://cdn.jsdelivr.net/npm/findindex_polyfill_mdn"><\/script>');



let chartF = new Chart(document.getElementById("height_graph"), {
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


function update_data(f, label, data) {
  let chart = chartF;
  chart.data.labels.push(label);
  chart.data.datasets.forEach((dataset) => {
    dataset.data.push(data);
  });
  chart.update();
}

// update_data(chart, 100, 100)

export {update_data}
