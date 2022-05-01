# sporadic-web
## Запуск
Для сборки используется Gulp и Webpack. Структура взята с другого проекта, поэтому сборщики делают много лишней фигни. Если ее выпилить, объем готового кода сократится заметно.
```
$ git clone https://github.com/dan-sazonov/sporadic-web.git
$ cd sporadic-web
$ npm i
$ npm run build
```
После этого будет создана директория `dist` с собранным проектом. `npm run dev` соберет проект в режиме разработки.

## Структура кода
В корне лежит куча конфигов, большая часть которая здесь не нужна. Исходники лежат в `/src`.  
`/src/css`:
- `bootstrap.min.css`, - `normalize` - исходники либ
- `main` - дефолтные стили шаблона
- `styles` - основной файл, в него импортим все остальные + правки
  
`/src/js`:
- `modedrnizr` - исходник
- `plugins` - остался от шаблона, можно выкинуть (наверное)
- `graphs`, `monitor`, `webgl` - код соответсвующих фич
- `main` - основной файл
  
Каталог `img` и файл `404.html` не нужны, но без них галп не заведется.  
Некотрое библиотеки поставлены через npm, некоторые скачены. Апишка карт подрубается через cdn, скачать не вариант.

## Фичи
- Функция `update_data(0, 0, 0, 0, 0);` добавит во все графики указанную точку. Аргументы: номер пакета, высота, давление, ускорение, температура
- Все, что прилетает в ком, пишется в `localStorage.lastData;`
- В `monitor.js` линтеры ругаются, что некоторые асинки вызываются без await. Однако с awaitами ничего не работает
- Все это работает только в хроме, остальные не могут смотреть ком
- Адаптивности ноль. Если разрешение меньше 1280x800, все поплывет
