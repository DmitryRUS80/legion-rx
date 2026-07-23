(() => {
'use strict';
const KEY = 'legionRxLanguage';
let lang = localStorage.getItem(KEY) === 'en' ? 'en' : 'ru';

const en = {
  'Главная':'Home','Чемпионаты':'Championships','Пилоты':'Drivers','Архив':'Archive','Настройки':'Settings','Участники':'Drivers','Квалификация':'Qualifying','Квалификации':'Qualifying','Финалы':'Finals','Итог':'Results','Результаты':'Results',
  'Соревнование':'Race','Настройки этапа и пилоты':'Event settings and drivers','Постоянная база участников':'Permanent driver database','Экспорт и управление данными':'Export and data management','Сезоны, этапы и общий зачёт':'Seasons, rounds and standings','История соревнований':'Race history','Заезды, очки и Best 3':'Heats, points and Best 3','Стартовые сетки и переходы':'Starting grids and progression','Протокол, PDF и PNG':'Report, PDF and PNG',
  'Новое соревнование':'New race','Новая гонка':'New race','Продолжить соревнование':'Continue race','Продолжить гонку':'Continue race','Отменить гонку':'Cancel race','Создать соревнование':'Create race','Соревнование создано':'Race created','✔ Соревнование создано':'✔ Race created',
  '01 · НАСТРОЙКА ЭТАПА':'01 · EVENT SETUP','02 · СОСТАВ':'02 · LINE-UP','04 · РЕШАЮЩИЕ ЗАЕЗДЫ':'04 · DECIDING HEATS','05 · ОФИЦИАЛЬНЫЙ ДОКУМЕНТ':'05 · OFFICIAL DOCUMENT','ТЕКУЩЕЕ СОРЕВНОВАНИЕ':'CURRENT RACE',
  'Название соревнования':'Race name','Клуб-организатор':'Organizing club','Дата':'Date','Место проведения':'Location','Тип соревнования':'Race type','Клубная гонка':'Club race','Официальное соревнование':'Official race','Тренировка':'Practice','Тренировочное':'Practice','Тест':'Test','Тестовое':'Test','Этап чемпионата':'Championship round','Чемпионат':'Championship','Номер этапа':'Round number','Количество квалификаций':'Number of qualifying rounds','Разрешить публикацию результата':'Allow result publication',
  'Регистрация пилотов':'Driver registration','Пилот останется в базе для следующих гонок.':'The driver will remain in the database for future races.','Сфотографировать':'Take photo','📷 Сфотографировать':'📷 Take photo','Загрузить фото':'Upload photo','🖼 Загрузить фото':'🖼 Upload photo','Убрать фото':'Remove photo','Создать и добавить':'Create and add','Добавить из базы':'Add from database','Перейти к квалификациям':'Go to qualifying',
  'Общий рейтинг':'Overall ranking','Турнирная таблица Финала A':'Final A standings','Итоговый протокол':'Final report','Завершить соревнование':'Finish race','🏁 Завершить соревнование':'🏁 Finish race','Скачать PNG':'Download PNG','PDF / Печать':'PDF / Print',
  'База пилотов':'Driver database','ПОСТОЯННЫЕ ПРОФИЛИ':'PERMANENT PROFILES','Постоянные профили':'Permanent profiles','Новый пилот':'New driver','＋ Новый пилот':'＋ New driver','В гонку':'Add to race','Редактировать':'Edit','Удалить':'Delete','Добавить в гонку':'Add to race','Поиск пилота':'Search driver','Профиль пилота':'Driver profile','ПРОФИЛЬ ПИЛОТА':'DRIVER PROFILE','БАЗА ПИЛОТОВ':'DRIVER DATABASE','Фамилия Имя':'Full name','Клуб':'Club','Необязательно':'Optional','Клуб (необязательно)':'Club (optional)','Сохранить изменения':'Save changes','Удаление здесь удаляет профиль из базы, но не меняет архивные результаты.':'Deleting here removes the profile from the database but does not change archived results.',
  'Язык':'Language','Выберите язык интерфейса приложения.':'Choose the application interface language.','Русский':'Russian','Темы':'Themes','Дополнительные темы оформления появятся позже.':'Additional themes will be added later.','Скоро':'Coming soon','СИСТЕМА':'SYSTEM',
  'Экспорт гонки':'Export race','Сохранить полную резервную копию в JSON.':'Save a full JSON backup.','Скачать':'Download','Отменить текущую гонку':'Cancel current race','Удалить незавершённую гонку. Архив не пострадает.':'Delete the unfinished race. The archive will not be affected.','Отменить':'Cancel','PWA-приложение':'PWA application','Устанавливается на экран телефона и работает офлайн.':'Installs on your device and works offline.','Инструкция':'Instructions','Установка':'Installation','Руководства и правила':'Guides and rules','Работа с приложением, формат гонки и обозначения.':'Application guide, race format and terminology.','Открыть':'Open','Меню':'Menu','← Меню':'← Menu',
  'Мои чемпионаты':'My championships','СЕЗОНЫ':'SEASONS','НОВЫЙ СЕЗОН':'NEW SEASON','Создать чемпионат':'Create championship','Название':'Name','Сезон':'Season','План этапов':'Planned rounds','Сохранённые этапы':'Saved rounds','СОХРАНЁННЫЕ ЭТАПЫ':'SAVED ROUNDS','Все':'All','Официальные':'Official','Клубные':'Club','Тренировочные':'Practice','Тестовые':'Test',
  'Руководство':'Guide','Правила гонки':'Race rules','Обозначения':'Terms','СПРАВКА':'HELP','ИСТОРИЯ':'HISTORY','Добавлен':'Added','Добавить':'Add','Пилоты не найдены.':'No drivers found.','База пилотов пока пуста.':'The driver database is empty.','В гонке пока нет пилотов.':'No drivers in this race yet.','Удалённый пилот':'Deleted driver',
  'Результат':'Result','Пилот':'Driver','Сохранить заезд':'Save heat','Введите порядок финиша':'Enter finishing order','Исправить результат':'Edit result','Стартовая решётка':'Starting grid','Направление движения':'Direction of travel','НАПРАВЛЕНИЕ ДВИЖЕНИЯ':'DIRECTION OF TRAVEL','НАПРАВЛЕНИЕ ДВИЖЕНИЯ ↑':'DIRECTION OF TRAVEL ↑','Место':'Position','Источник':'Source','Очки этапа':'Event points','Зачёт Финала A':'Final A classification','Лучшие 2':'Best 2','Порядок схода':'Retirement order',
  'Создать серии':'Create rounds','Сформировать финалы':'Generate finals','Жеребьёвка':'Tie-break draw','Провести жеребьёвку':'Run tie-break draw','Место':'Position','Очки':'Points','Победы выделены красным. В зачёт автоматически входят три лучших результата.':'Wins are highlighted in red. The three best results count automatically.','Пока нет результатов.':'No results yet.','Состав Финала A появится после завершения отбора.':'The Final A line-up will appear after qualifying is complete.',
  'Архив соревнований':'Race archive','Соревнования':'Races','В архиве пока нет соревнований.':'There are no archived races yet.','без даты':'no date','Завершено':'Completed','Подготовка':'Setup',
  'Выберите чемпионат':'Select championship','Чемпионатов пока нет.':'There are no championships yet.','Этапов ещё нет.':'There are no rounds yet.','Этапы':'Rounds','Общий зачёт':'Overall standings','Всего':'Total','ВСЕГО':'TOTAL','МЕСТО':'POSITION','ПИЛОТ':'DRIVER',
  'Главный финальный заезд':'Main final heat','Один заезд последнего шанса':'Single Last Chance Qualifier','Параллельный заезд последнего шанса':'Parallel Last Chance Qualifier','Заключительный заезд последнего шанса':'Final Last Chance Qualifier','Предварительный отбор':'Preliminary qualifier','Заезд последнего шанса (LCQ)':'Last Chance Qualifier (LCQ)','Заключительный LCQ':'Final LCQ','Победитель проходит выше':'Winner advances','Победитель → Финал A':'Winner → Final A','2 лучших → Финал A':'Top 2 → Final A','Гибридная финальная система Legion RX':'Legion RX hybrid finals system','Состав появится после завершения отборочных заездов.':'The line-up will appear after the qualifying heats are complete.',
  'Квалификация — стартовые позиции':'Qualifying — starting positions','Финал A — стартовые позиции':'Final A — starting positions','ГЛАВНЫЙ ФИНАЛ':'MAIN FINAL','КВАЛИФИКАЦИЯ':'QUALIFYING','прямой проход':'direct advancement','зачёт двух лучших результатов':'best two results count','↑ 2 МЕСТА':'↑ 2 POSITIONS',
  'Руководство пользователя':'User guide','1. Создание соревнования':'1. Creating a race','2. Участники':'2. Drivers','3. Квалификация':'3. Qualifying','4. Финальная стадия':'4. Finals stage','5. Ввод результатов':'5. Entering results','6. Экспорт':'6. Export','Спортивный регламент Legion RX Championship':'Legion RX Championship sporting regulations','2. Что такое LCQ':'2. What is LCQ','3. Финальная система':'3. Finals system','4. Как формируется решётка Финала A':'4. How the Final A grid is formed',
  'Закрыть':'Close','На главную':'Home','Навигация':'Navigation','Предпросмотр фото':'Photo preview','Фото':'Photo','Фото пилота':'Driver photo','English':'English'
  ,'Выберите тип соревнования, заполните название, дату и место проведения.':'Select the race type and enter its name, date and location.'
  ,'Добавьте пилотов. Порядок регистрации не заменяет спортивный результат: стартовые позиции определяются квалификацией.':'Add drivers. Registration order does not replace sporting results: starting positions are determined by qualifying.'
  ,'Создайте серии, внесите результаты и сохраните каждый заезд. В итоговый рейтинг входят три лучших результата пилота — Best 3.':'Create qualifying rounds, enter the results and save every heat. The driver’s three best results — Best 3 — count toward the qualifying standings.'
  ,'Нажмите «Сформировать финалы». Программа автоматически выберет схему по количеству участников, построит LCQ и три заезда Финала A.':'Tap “Generate finals”. The app automatically selects the format according to the number of drivers, creates the LCQ structure and the three Final A heats.'
  ,'Сохраняйте заезды по порядку. После A3 программа автоматически рассчитает два лучших результата из трёх и сформирует итоговый протокол.':'Save the heats in order. After A3, the app automatically calculates the best two results out of three and generates the final report.'
  ,'Кнопка «PDF / Печать» создаёт печатный документ, «Скачать PNG» — изображение итогов.':'“PDF / Print” creates a printable document, while “Download PNG” creates an image of the results.'
  ,'1. Квалификация':'1. Qualifying'
  ,'Квалификационная система не меняется. В одном заезде участвует до 6 машин, дистанция —':'The qualifying system remains unchanged. Up to 6 cars take part in one heat; the distance is'
  ,'5 кругов':'5 laps'
  ,'Проводится 3–5 серий, в зачёт входят три лучших результата пилота (':'There are 3–5 qualifying rounds, and the driver’s three best results count ('
  ,'Best 3':'Best 3'
  ,'Итог квалификации определяет посев, прямой проход в Финал A, состав отборочных заездов и стартовые позиции.':'The qualifying standings determine seeding, direct advancement to Final A, LCQ composition and starting positions.'
  ,'Квалификация — стартовые позиции':'Qualifying — starting positions'
  ,'НАПРАВЛЕНИЕ ДВИЖЕНИЯ':'DIRECTION OF TRAVEL'
  ,'Машина изображается вертикальным прямоугольником. Над каждой машиной находится':'Each car is shown as a vertical rectangle. Above every car there is a'
  ,'отдельная':'separate'
  ,'П-образная стартовая скоба. Скоба шире машины и не касается её: между ними сохраняется видимый зазор.':'U-shaped starting bracket. The bracket is wider than the car and does not touch it, leaving a visible gap.'
  ,'LCQ — Last Chance Qualifier':'LCQ — Last Chance Qualifier'
  ,'или «заезд последнего шанса». Это отборочный заезд для пилотов, которые не получили прямой проход в Финал A. Старт LCQ всегда формируется по результатам квалификации.':'or “last chance race”. It is a qualifying race for drivers who did not advance directly to Final A. The LCQ starting order is always based on qualifying results.'
  ,'1–6 участников':'1–6 drivers'
  ,'Все пилоты проходят в Финал A. Проводятся три заезда:':'All drivers advance to Final A. Three heats are held:'
  ,'A1, A2 и A3':'A1, A2 and A3'
  ,'Во всех трёх заездах стартовый порядок одинаковый — по квалификации.':'The starting order is identical in all three heats and follows qualifying.'
  ,'7–10 участников':'7–10 drivers'
  ,'Первые 4 пилота квалификации проходят напрямую. Остальные стартуют в одном LCQ.':'The top 4 drivers in qualifying advance directly. The remaining drivers compete in one LCQ.'
  ,'Первые два на финише':'The first two finishers'
  ,'получают позиции 5 и 6 Финала A.':'receive positions 5 and 6 in Final A.'
  ,'11–16 участников':'11–16 drivers'
  ,'Первые 4 проходят напрямую. Остальные распределяются «змейкой» в LCQ B и LCQ C. Из каждого заезда проходит':'The top 4 advance directly. The remaining drivers are distributed in a snake pattern between LCQ B and LCQ C. From each race, only the'
  ,'только победитель':'winner advances'
  ,'17 и более участников':'17 or more drivers'
  ,'Создаются предварительные LCQ максимум по 6 машин. Победители переходят выше. В заключительном LCQ два лучших получают последние места Финала A.':'Preliminary LCQs are created with a maximum of 6 cars each. Winners advance upward. In the final LCQ, the top two receive the last places in Final A.'
  ,'Позиции 1–4':'Positions 1–4'
  ,'Четыре лучших пилота квалификации. Они проходят напрямую.':'The four best qualifying drivers. They advance directly.'
  ,'Позиции 5–6 при одном LCQ':'Positions 5–6 with one LCQ'
  ,'Победитель LCQ стартует пятым, второе место — шестым. Квалификация не может переставить их местами.':'The LCQ winner starts fifth and the second-place finisher starts sixth. Qualifying cannot reverse their order.'
  ,'Позиции 5–6 при LCQ B/C':'Positions 5–6 with LCQ B/C'
  ,'Оба пилота являются победителями разных заездов. Выше стартует тот, кто был выше в квалификации.':'Both drivers are winners of different races. The driver ranked higher in qualifying starts ahead.'
  ,'Финал A — стартовые позиции':'Final A — starting positions'
  ,'Эта схема является эталонной для приложения: каждый следующий ряд смещён вправо. Скоба всегда расположена отдельно над машиной, шире корпуса и не пересекает его.':'This layout is the app standard: each following row is offset to the right. The bracket is always separate above the car, wider than its body and never overlaps it.'
  ,'5. Три заезда Финала A':'5. Three Final A heats'
  ,'Финал A состоит из трёх заездов по':'Final A consists of three heats of'
  ,'7 кругов':'7 laps'
  ,'A1, A2 и A3. Стартовая решётка во всех трёх заездах остаётся одинаковой.':'A1, A2 and A3. The starting grid remains the same in all three heats.'
  ,'За место начисляются штрафные очки: 1-е место — 1, 2-е — 2, далее по занятому месту. DNF, DNS и DSQ дают 7 очков. В итог входят':'Penalty points are awarded by finishing position: 1st place — 1, 2nd — 2, and so on. DNF, DNS and DSQ score 7 points. The final result uses the'
  ,'два лучших результата из трёх':'best two results out of three'
  ,'Побеждает пилот с наименьшей суммой.':'The driver with the lowest total wins.'
  ,'6. Равенство очков в Финале A':'6. Ties in Final A'
  ,'При равной сумме применяются последовательно:':'If totals are equal, the following tie-breakers are applied in order:'
  ,'Большее количество побед в A1–A3.':'More wins in A1–A3.'
  ,'Большее количество вторых мест.':'More second-place finishes.'
  ,'Лучший результат в A3.':'Better result in A3.'
  ,'Более высокое место в квалификации.':'Higher qualifying position.'
  ,'ОТБОР':'LCQ'
  ,'честный проход по финишу':'advancement by finishing result'
  ,'7. Очки этапа':'7. Round points'
  ,'По итоговому протоколу первые 10 пилотов получают очки:':'According to the final report, the top 10 drivers receive points:'
  ,'Обозначения':'Terms'
  ,'Last Chance Qualifier — заезд последнего шанса для прохода в Финал A.':'Last Chance Qualifier — a last-chance race for advancement to Final A.'
  ,'Did Not Start — пилот не стартовал.':'Did Not Start — the driver did not start.'
  ,'Did Not Finish — пилот стартовал, но не финишировал.':'Did Not Finish — the driver started but did not finish.'
  ,'Disqualified — дисквалификация.':'Disqualified — the driver was disqualified.'
  ,'Три лучших результата пилота в квалификационных сериях.':'The driver’s three best results from the qualifying rounds.'
  ,'ФОТО ПИЛОТА':'DRIVER PHOTO','Выберите область фотографии':'Choose the photo area','Перемещайте фотографию пальцем или мышью. Используйте два пальца или ползунок для масштаба.':'Move the photo with your finger or mouse. Use two fingers or the slider to zoom.','Масштаб':'Zoom','Размер рамки':'Crop frame size','↻ Повернуть':'↻ Rotate','Повернуть':'Rotate','Сбросить':'Reset','Оптимизировано для Legion RX':'Optimized for Legion RX','Готово':'Done','Фотография для кадрирования':'Photo to crop','Не удалось открыть фотографию.':'Could not open the photo.'

};


const extraEn = {
  'УПРАВЛЕНИЕ':'CONTROL','Главное меню':'Main menu','Новая гонка':'New race','Финалы формируют стартовую сетку главного заезда и итоговый протокол.':'Finals determine the main-event starting grid and the final report.',
  'Отмена':'Cancel','Открыть':'Open','Завершён':'Completed','В работе':'In progress','Этапов ещё нет.':'There are no rounds yet.','Чемпионатов пока нет.':'There are no championships yet.',
  'Заезд сохранён':'Heat saved','✔ Заезд сохранён':'✔ Heat saved','Место':'Position','Исправить результат':'Edit result','Сохранить заезд':'Save heat','Введите порядок финиша':'Enter finishing order',
  'Абсолютное равенство':'Exact tie','Спортивные критерии не разделили пилотов. Перед финалами нужна жеребьёвка.':'The sporting criteria could not separate the drivers. A draw is required before the finals.','Провести жеребьёвку':'Run draw',
  'Все пилоты → A1 + A2 + A3 → два лучших результата':'All drivers → A1 + A2 + A3 → best two results',
  'TOP 4 квалификации + 2 лучших LCQ → Финал A':'Top 4 qualifiers + top 2 from LCQ → Final A',
  'TOP 4 квалификации + победители LCQ B/C → Финал A':'Top 4 qualifiers + LCQ B/C winners → Final A',
  'TOP 4 квалификации + предварительные LCQ → заключительный LCQ → 2 лучших → Финал A':'Top 4 qualifiers + preliminary LCQs → final LCQ → top 2 → Final A',
  'Итоговая классификация':'Final classification','Квалификационный рейтинг':'Qualifying ranking','Результаты серий':'Round results','Пилот':'Driver','Источник':'Source','Очки этапа':'Event points','Лучшие 2':'Best 2',
  'ОТБОР':'QUALIFIER','честный проход по финишу':'advancement by finishing order','Позиции 1–4':'Positions 1–4','Позиции 5–6 при одном LCQ':'Positions 5–6 with one LCQ','Позиции 5–6 при LCQ B/C':'Positions 5–6 with LCQ B/C',
  '5. Три заезда Финала A':'5. Three Final A heats','6. Равенство очков в Финале A':'6. Ties in Final A','7. Очки этапа':'7. Event points',
  '1–6 участников':'1–6 drivers','7–10 участников':'7–10 drivers','11–16 участников':'11–16 drivers','17 и более участников':'17 or more drivers',
  'Отмена':'Cancel','УПРАВЛЕНИЕ':'CONTROL','Сохранённые этапы':'Saved rounds','СОХРАНЁННЫЕ ЭТАПЫ':'SAVED ROUNDS',
  'На главную':'Home','Закрыть':'Close','Не удалось открыть фотографию.':'Could not open the photo.','Предпросмотр фото':'Photo preview','Фото удалённого пилота':'Deleted driver photo'
};
Object.assign(en, extraEn);

const rules = [
  [/^Квалификация (\d+)$/,'Qualifying $1'],[/^Заезд (\d+)$/,'Heat $1'],[/^(\d+) пилот$/,'$1 driver'],[/^(\d+) пилота$/,'$1 drivers'],[/^(\d+) пилотов$/,'$1 drivers'],
  [/^Финал (.+)$/,'Final $1'],[/^Сохранить (.+)$/,'Save $1'],[/^Предварительный LCQ (.+)$/,'Preliminary LCQ $1'],[/^Отборочный финал (.+)$/,'Qualifying final $1'],
  [/^Этап (\d+)$/,'Round $1'],[/^Э(\d+)$/,'R$1'],[/^(\d+) этапов$/,'$1 rounds'],[/^(\d+) этап$/,'$1 round'],[/^(\d+) пилотов · (.+) · (.+)$/,'$1 drivers · $2 · $3'],
  [/^Удалить (.+) из базы пилотов\? Из текущей гонки и архивов пилот удалён не будет\.$/,'Delete $1 from the driver database? The driver will remain in the current race and archives.'],
  [/^Завершено этапов: (\d+)\. Таблица сформирована приложением Legion RX\.$/,'Completed rounds: $1. The table was generated by Legion RX.'],
  [/^(\d+) пилотов  ·  (\d+)\/(\d+) этапов$/,'$1 drivers · $2/$3 rounds'],
  [/^жребий №(\d+)$/,'draw no. $1'],[/^Финал A · (\d+) очк\.$/,'Final A · $1 pts'],[/^Финал A · (\d+) очка\.$/,'Final A · $1 pts'],[/^Финал A · (\d+) очков\.$/,'Final A · $1 pts'],
  [/^(.+) · (\d+) кругов$/,'$1 · $2 laps'],[/^(.+) — этап (\d+)$/,'$1 — round $2'],
  [/^(\d+) этапов · (\d+) пилотов$/,'$1 rounds · $2 drivers'],[/^Этап (\d+) · (.+)$/,'Round $1 · $2'],[/^Сохранить Финал (.+)$/,'Save Final $1']
];

const longer = {
  'Пилот уже добавлен в гонку.':'The driver has already been added to the race.','Введите имя пилота.':'Enter the driver name.','Минимум 3 пилота.':'At least 3 drivers are required.','Удалить текущее соревнование и все результаты?':'Delete the current race and all results?','Нет текущего соревнования для сохранения.':'There is no current race to save.','Текущей гонки нет.':'There is no current race.','Сначала завершите все заезды Финала A и сформируйте итоговый протокол.':'Complete all Final A heats and generate the final report first.','Это соревнование уже завершено и находится в архиве.':'This race has already been completed and is in the archive.','Завершить соревнование? После завершения этап будет автоматически перенесён в архив и исчезнет с главной страницы.':'Finish the race? The round will be moved to the archive and removed from the home screen.','Соревнование завершено и перенесено в архив.':'The race has been completed and moved to the archive.','Отменить текущую гонку? Все несохранённые результаты будут удалены.':'Cancel the current race? All unsaved results will be deleted.','Начать новую гонку? Текущая незавершённая гонка будет удалена.':'Start a new race? The current unfinished race will be deleted.','Удалить соревнование из архива?':'Delete this race from the archive?',
  'Введите название чемпионата.':'Enter the championship name.','Удалить чемпионат и его таблицу? Архив отдельных гонок не удаляется.':'Delete the championship and its standings? Individual archived races will remain.','Текущая гонка будет заменена новым этапом. Продолжить?':'The current race will be replaced with a new round. Continue?','Этап ещё не сохранён в архив.':'This round has not been saved to the archive yet.','Сначала откройте чемпионат.':'Open a championship first.','В чемпионате пока нет пилотов и результатов.':'There are no drivers or results in this championship yet.','Не удалось создать изображение.':'Could not create the image.','Не удалось сохранить PNG.':'Could not save the PNG.',
  'Сначала проведите жеребьёвку для абсолютного равенства в квалификации.':'Run the tie-break draw for an exact qualifying tie first.','Исправление результата сбросит этот и все последующие финалы. Продолжить?':'Editing this result will reset this and all subsequent finals. Continue?','Для каждого DNF укажите порядок схода.':'Specify the retirement order for every DNF.','Порядок DNF не должен повторяться.':'DNF retirement positions must not repeat.','Укажите результат каждого пилота.':'Enter a result for every driver.','Финишные места не должны повторяться.':'Finishing positions must not repeat.',
  'Изменение квалификации удалит сформированные финалы и итоговый протокол. Продолжить?':'Changing qualifying will delete the generated finals and final report. Continue?','Разблокировать заезд для исправления результата?':'Unlock this heat to edit the result?','Квалификация завершена. Перед формированием финалов проведите жеребьёвку для абсолютного равенства.':'Qualifying is complete. Before generating finals, run a tie-break draw for any exact tie.','Неразрешённых абсолютных равенств нет.':'There are no unresolved exact ties.','Жеребьёвка проведена и сохранена в соревновании.':'The tie-break draw has been completed and saved.',
  'На iPhone откройте сайт в Safari → Поделиться → На экран «Домой». После первого запуска приложение работает офлайн.':'On iPhone, open the site in Safari → Share → Add to Home Screen. After the first launch, the app works offline.','Service Worker не зарегистрирован':'Service Worker is not registered',
  'Финал A состоит из трёх заездов: A1, A2 и A3. Побеждает пилот с наименьшей суммой двух лучших результатов.':'Final A consists of three heats: A1, A2 and A3. The driver with the lowest sum of the best two results wins.','Стартовая решётка во всех трёх заездах одинакова. В итог идут два лучших результата из трёх.':'The starting grid is the same in all three heats. The best two results out of three count.','Старт по квалификации. Победитель LCQ получает позицию 5 Финала A, второе место — позицию 6.':'The start order follows qualifying. The LCQ winner takes position 5 in Final A and second place takes position 6.','Победители LCQ B и C занимают позиции 5–6 Финала A. Выше стартует пилот с лучшим местом в квалификации.':'The winners of LCQ B and C take positions 5–6 in Final A. The driver ranked higher in qualifying starts ahead.','Победитель получает позицию 5 Финала A, второе место — позицию 6. Результат этого заезда не переставляется по квалификации.':'The winner takes position 5 in Final A and second place takes position 6. Qualifying does not reorder this result.','Старт по квалификации. Победители предварительных групп переходят в следующий LCQ-уровень.':'The start order follows qualifying. Preliminary group winners advance to the next LCQ level.','В зачёт идут два лучших результата из A1, A2 и A3. DNF, DNS и DSQ дают 7 очков.':'The best two results from A1, A2 and A3 count. DNF, DNS and DSQ score 7 points.'
};
Object.assign(en, longer);

function translate(value) {
  const source = String(value ?? '');
  if (lang !== 'en' || !source) return source;
  if (en[source]) return en[source];
  for (const [pattern, replacement] of rules) if (pattern.test(source)) return source.replace(pattern, replacement);
  return source;
}

const originalTextNodes = new WeakMap();

function translateTextNode(node) {
  const raw = node.nodeValue;
  const trimmed = raw.trim();
  if (!trimmed) return;
  if (!originalTextNodes.has(node)) originalTextNodes.set(node, trimmed);
  const source = originalTextNodes.get(node);
  const translated = translate(source);
  node.nodeValue = raw.replace(trimmed, translated);
}

function apply(root = document) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = [];
  while (walker.nextNode()) nodes.push(walker.currentNode);
  nodes.forEach(translateTextNode);
  root.querySelectorAll?.('[placeholder]').forEach(el => {
    if (!el.dataset.ruPlaceholder) el.dataset.ruPlaceholder = el.placeholder;
    el.placeholder = translate(el.dataset.ruPlaceholder);
  });
  root.querySelectorAll?.('[aria-label]').forEach(el => {
    if (!el.dataset.ruAria) el.dataset.ruAria = el.getAttribute('aria-label');
    el.setAttribute('aria-label', translate(el.dataset.ruAria));
  });
  root.querySelectorAll?.('[title]').forEach(el => {
    if (!el.dataset.ruTitle) el.dataset.ruTitle = el.title;
    el.title = translate(el.dataset.ruTitle);
  });
  document.documentElement.lang = lang === 'en' ? 'en' : 'ru';
}

function setLanguage(value) {
  lang = value === 'en' ? 'en' : 'ru';
  localStorage.setItem(KEY, lang);
  location.reload();
}

const originalAlert = window.alert.bind(window);
const originalConfirm = window.confirm.bind(window);
window.alert = message => originalAlert(translate(message));
window.confirm = message => originalConfirm(translate(message));
window.LegionI18n = { getLanguage: () => lang, setLanguage, apply, t: translate };
window.t = translate;

document.addEventListener('DOMContentLoaded', () => {
  apply();
  new MutationObserver(mutations => mutations.forEach(mutation => mutation.addedNodes.forEach(node => {
    if (node.nodeType === 1) apply(node);
    else if (node.nodeType === 3) translateTextNode(node);
  }))).observe(document.body, { childList: true, subtree: true });
});
})();
