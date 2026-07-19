# Legion RX finals patch

Файлы:

- `legion-rx-finals.js` — универсальный движок финалов.
- `finals-integration-example.js` — пример подключения к текущему приложению.
- `data-fields-patch.js` — поля, которые нужно добавить в `RaceData`.
- `RACE_GUIDE_FINALS.md` — готовый текст для раздела «Правила / Race Guide».

Подключение в HTML:

```html
<script src="data.js"></script>
<script src="legion-rx-finals.js"></script>
<script src="app.js"></script>
<script src="finals-integration-example.js"></script>
```

Важно: движок не меняет функцию формирования квалификаций. Он получает готовый массив
`RaceData.standings`, уже отсортированный по итогам квалификации.

Для сохранения результата заезда передайте идентификатор заезда и массив ID пилотов
в порядке финиша:

```js
saveLegionRXHeatResult(heat.id, [
  pilotIdFirst,
  pilotIdSecond,
  pilotIdThird,
  pilotIdFourth
]);
```
