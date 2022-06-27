let coords = [
  [55.80, 37.50],
  [55.80, 37.40],
  [55.70, 37.50]
]

ymaps.ready(init);

function init() {
  // Создаем карту.
  var myMap = new ymaps.Map("map", {
    center: [55.72, 37.44],
    zoom: 10
  }, {
    searchControlProvider: 'yandex#search'
  });


  // Создаем ломаную с помощью вспомогательного класса Polyline.
  var myPolyline = new ymaps.Polyline(coords, {
    // Описываем свойства геообъекта.
    // Содержимое балуна.
    balloonContent: "Ломаная линия"
  }, {
    // Задаем опции геообъекта.
    // Отключаем кнопку закрытия балуна.
    balloonCloseButton: false,
    // Цвет линии.
    strokeColor: "#000000",
    // Ширина линии.
    strokeWidth: 4,
    // Коэффициент прозрачности.
    strokeOpacity: 0.5
  });


  coords.push([55.70, 37.40]);
  myMap.geoObjects.add(myPolyline);

}
