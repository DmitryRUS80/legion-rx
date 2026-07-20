/* Legion RallyCross Manager v2.3 UI */

const $ = id => document.getElementById(id);
const eventNameInput = $("eventName");
const clubNameInput = $("clubName");
const eventDateInput = $("eventDate");
const eventLocationInput = $("eventLocation");
const eventStatusInput = $("eventStatus");
const raceChampionshipInput = $("raceChampionshipId");
const raceStageNumberInput = $("raceStageNumber");
const publishAllowedInput = $("publishAllowed");
const qualifyingSelect = $("qualifyingCount");
const createRaceButton = $("createRace");
const pilotInput = $("pilotName");
const addPilotButton = $("addPilot");
const pilotTable = document.querySelector("#pilotTable tbody");
const pilotCounter = $("pilotCounter");
const nextButton = $("nextStep");

function escapeHtml(value) {
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function toggleChampionshipFields(){
    const on=eventStatusInput.value === "championship";
    $("championshipLinkFields")?.classList.toggle("hidden",!on);
    $("championshipStageFields")?.classList.toggle("hidden",!on);
}
eventStatusInput.addEventListener("change", toggleChampionshipFields);

function readRaceForm() {
    RaceData.eventName = eventNameInput.value.trim() || "Соревнование Legion RX";
    RaceData.clubName = clubNameInput.value.trim() || "Legion RC Penza";
    RaceData.eventDate = eventDateInput.value;
    RaceData.eventLocation = eventLocationInput.value.trim();
    RaceData.eventStatus = eventStatusInput.value;
    RaceData.championshipId = eventStatusInput.value === "championship" ? raceChampionshipInput.value : "";
    RaceData.championshipStageNumber = eventStatusInput.value === "championship" ? Number(raceStageNumberInput.value || 1) : null;
    RaceData.publishAllowed = publishAllowedInput.checked;
    RaceData.qualifyingCount = Number(qualifyingSelect.value);
    touchRace();
}

createRaceButton.addEventListener("click", () => {
    readRaceForm();
    createRaceButton.textContent = "✔ Соревнование создано";
    saveToBrowser();
    updateHomeSummary();
});

addPilotButton.addEventListener("click", () => {
    const name = pilotInput.value.trim();
    if (!name) return;
    if (RaceData.pilots.some(p => p.name.toLowerCase() === name.toLowerCase())) return alert("Пилот уже добавлен.");
    addPilot(name);
    pilotInput.value = "";
    drawPilots();
    saveToBrowser();
    updateHomeSummary();
});

pilotInput.addEventListener("keydown", e => { if (e.key === "Enter") addPilotButton.click(); });

function drawPilots() {
    pilotTable.innerHTML = "";
    RaceData.pilots.forEach((pilot,index) => {
        const row = document.createElement("tr");
        row.innerHTML = `<td>${index+1}</td><td>${escapeHtml(pilot.name)}</td><td><button class="removeButton" data-id="${pilot.id}">Удалить</button></td>`;
        pilotTable.appendChild(row);
    });
    pilotTable.querySelectorAll(".removeButton").forEach(button => button.addEventListener("click", () => { removePilot(button.dataset.id); drawPilots(); saveToBrowser(); }));
    pilotCounter.textContent = String(RaceData.pilots.length);
    nextButton.disabled = RaceData.pilots.length < 3;
}

nextButton.addEventListener("click", () => {
    if (RaceData.pilots.length < 3) return alert("Минимум 3 пилота.");
    readRaceForm();
    generateQualifying();
    navigateTo("race", "qualifyingBlock");
});

function saveToBrowser() {
    touchRace();
    localStorage.setItem("legionRxRace", JSON.stringify(RaceData));
}

function loadFromBrowser() {
    const saved = localStorage.getItem("legionRxRace");
    if (!saved) return false;
    try {
        const parsed = JSON.parse(saved);
        Object.assign(RaceData, parsed);
        RaceData.exactTieLots = parsed.exactTieLots || {};
        RaceData.pilots = (parsed.pilots || []).map((data, index) => {
            const pilot = Object.assign(new Pilot(data.name), data);
            if (!pilot.registrationOrder) pilot.registrationOrder = index + 1;
            if (!Array.isArray(pilot.qualifying)) pilot.qualifying = [];
            if (!Array.isArray(pilot.finalResults)) pilot.finalResults = [];
            return pilot;
        });
        RaceData.finals = (parsed.finals || []).map(final => ({
            basePilots: final.basePilots || final.pilots || [],
            result: final.result || [],
            saved: Boolean(final.saved),
            enabled: Boolean(final.enabled),
            ...final
        }));
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

function exportRace() {
    downloadBlob(JSON.stringify(RaceData,null,2), `${safeFileName(RaceData.eventName)}.json`, "application/json");
}

function downloadBlob(content, name, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(value) {
    return (value || "legion-rx").replace(/[^a-zа-я0-9_-]+/gi,"_");
}

function clearRace() {
    if (!confirm("Удалить текущее соревнование и все результаты?")) return;
    localStorage.removeItem("legionRxRace");
    location.reload();
}

function getArchive() {
    try { return JSON.parse(localStorage.getItem("legionRxArchive") || "[]"); }
    catch { return []; }
}

function archiveCurrentRace() {
    if (typeof syncCurrentRaceToChampionship === "function") syncCurrentRaceToChampionship();
    if (!RaceData.id || !RaceData.pilots.length) {
        return alert("Нет текущего соревнования для сохранения.");
    }

    const archive = getArchive();
    const snapshot = JSON.parse(JSON.stringify(RaceData));
    snapshot.archivedAt = new Date().toISOString();

    const idx = archive.findIndex(item => item.id === snapshot.id);
    if (idx >= 0) archive[idx] = snapshot;
    else archive.unshift(snapshot);

    localStorage.setItem("legionRxArchive", JSON.stringify(archive));
    alert(RaceData.stage === "finished"
        ? "Завершённое соревнование сохранено в архив."
        : "Текущая гонка сохранена в архив как незавершённая.");
    drawArchive();
}

function discardCurrentRace() {
    if (!RaceData.id || !RaceData.pilots.length) {
        return alert("Текущей гонки нет.");
    }

    if (!confirm("Отменить текущую гонку? Все несохранённые результаты будут удалены.")) return;

    localStorage.removeItem("legionRxRace");
    location.reload();
}

function startNewRace() {
    if (RaceData.id && RaceData.pilots.length) {
        const confirmed = confirm("Начать новую гонку? Текущая гонка будет удалена. При необходимости сначала сохраните её в архив.");
        if (!confirmed) return;
        localStorage.removeItem("legionRxRace");
        location.reload();
        return;
    }

    navigateTo("race", "createSection");
}

function drawArchive() {
    const filter = $("archiveFilter").value;
    const archive = getArchive().filter(item => filter === "all" || item.eventStatus === filter);
    const list = $("archiveList");
    if (!archive.length) { list.innerHTML = `<p class="sectionHint">В архиве пока нет соревнований.</p>`; return; }
    list.innerHTML = archive.map(item => `<article class="archiveCard"><div><h3>${escapeHtml(item.eventName)}</h3><p>${escapeHtml(item.clubName)} · ${escapeHtml(item.eventDate || "без даты")}</p><span class="statusBadge">${escapeHtml(item.eventStatus)}</span></div><div class="archiveActions"><button onclick="openArchiveRace('${item.id}')">Открыть</button><button class="dangerButton" onclick="deleteArchiveRace('${item.id}')">Удалить</button></div></article>`).join("");
}

function openArchiveRace(id) {
    const item = getArchive().find(race => race.id === id);
    if (!item) return;
    localStorage.setItem("legionRxRace", JSON.stringify(item));
    location.reload();
}

function deleteArchiveRace(id) {
    if (!confirm("Удалить соревнование из архива?")) return;
    localStorage.setItem("legionRxArchive", JSON.stringify(getArchive().filter(item => item.id !== id)));
    drawArchive();
}

function printProtocol() {
    window.print();
}

function exportProtocolPng() {
    if (!RaceData.finalProtocol.length) return;
    const rows = RaceData.finalProtocol.length;
    const width = 1400;
    const height = 520 + rows * 58;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#151515";
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = "#ff4b4b";
    ctx.font = "bold 48px Arial";
    ctx.fillText(RaceData.eventName || "Legion RX", 70, 85);
    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.fillText(`${RaceData.clubName || ""}   ${RaceData.eventDate || ""}`,70,135);
    ctx.fillStyle = "#ff8080";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Место",70,230);
    ctx.fillText("Пилот",250,230);
    ctx.fillText("Очки",1120,230);
    ctx.strokeStyle = "#555";
    let y = 275;
    RaceData.finalProtocol.forEach(item => {
        ctx.beginPath(); ctx.moveTo(70,y+25); ctx.lineTo(1330,y+25); ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "28px Arial";
        ctx.fillText(String(item.place),85,y);
        ctx.fillText(getPilot(item.pilotId).name,250,y);
        ctx.fillText(String(item.eventPoints),1150,y);
        y += 58;
    });
    const link = document.createElement("a");
    link.download = `${safeFileName(RaceData.eventName)}_results.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function updateHomeSummary() {
    const card = $("currentRaceCard");
    if (!card) return;

    if (!RaceData.id || !RaceData.pilots.length) {
        card.classList.add("hidden");
        return;
    }

    const stageNames = {
        setup: "Подготовка",
        qualifying: "Квалификация",
        finals: "Финалы",
        finished: "Завершено"
    };

    card.innerHTML = `
        <div class="cardLabel">ТЕКУЩЕЕ СОРЕВНОВАНИЕ</div>
        <h3>${escapeHtml(RaceData.eventName || "Legion RX")}</h3>
        <p>${RaceData.pilots.length} пилотов · ${stageNames[RaceData.stage] || "Подготовка"} · ${escapeHtml(RaceData.eventDate || "без даты")}</p>
        <div class="currentRaceActions">
            <button class="primaryAction" data-route="race">Продолжить гонку</button>
            <button class="secondaryButton" id="quickArchiveRace">Сохранить в архив</button>
            <button class="dangerButton" id="cancelCurrentRace">Отменить гонку</button>
        </div>
    `;

    card.classList.remove("hidden");
    bindRouteButtons(card);
    $("quickArchiveRace")?.addEventListener("click", archiveCurrentRace);
    $("cancelCurrentRace")?.addEventListener("click", discardCurrentRace);
}

function bindRouteButtons(root = document) {
    root.querySelectorAll("[data-route]").forEach(button => {
        if (button.dataset.routeBound === "1") return;
        button.dataset.routeBound = "1";
        button.addEventListener("click", () => navigateTo(button.dataset.route, button.dataset.scroll));
    });
}

function navigateTo(view, scrollId = "") {
    const views = { home: $("homeView"), race: $("raceView"), championships: $("championshipsView"), archive: $("archiveView"), help: $("helpView"), settings: $("settingsView") };
    Object.entries(views).forEach(([name, element]) => element?.classList.toggle("hidden", name !== view));

    const inRace = view === "race";
    $("appNav")?.classList.toggle("hidden", inRace);
    $("raceNav")?.classList.toggle("hidden", !inRace);

    document.querySelectorAll(".navItem").forEach(item => {
        const sameRoute = item.dataset.route === view;
        const sameSection = inRace ? (scrollId ? item.dataset.scroll === scrollId : item.dataset.scroll === "createSection") : true;
        item.classList.toggle("active", sameRoute && sameSection);
    });
    if (view === "archive") drawArchive();
    if (view === "championships") drawChampionships();
    if (view === "help") renderHelp("manual");
    if (view === "home") updateHomeSummary();
    requestAnimationFrame(() => {
        const target = scrollId ? document.getElementById(scrollId) : null;
        if (target && !target.classList.contains("hidden")) target.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function showView(view) {
    navigateTo(view);
}

function restoreRaceView() {
    if (RaceData.stage === "qualifying" && RaceData.heats.length) renderQualifying();
    if ((RaceData.stage === "finals" || RaceData.stage === "finished") && RaceData.heats.length) {
        renderQualifying();
        $("finalsSection").classList.remove("hidden");
        drawFinalsExplanation();
        drawFinals();
        if (RaceData.stage === "finished") drawFinalProtocol();
    }
}

$("exportRace").addEventListener("click", exportRace);
$("clearRace").addEventListener("click", discardCurrentRace);
$("homeNewRace").addEventListener("click", startNewRace);
$("archiveFilter").addEventListener("change", drawArchive);
$("printProtocol").addEventListener("click", printProtocol);
$("saveProtocolImage").addEventListener("click", exportProtocolPng);
$("archiveRace").addEventListener("click", archiveCurrentRace);
$("openHome").addEventListener("click", () => navigateTo("home"));
$("showInstallInfo").addEventListener("click", () => {
    const box = $("installHelp");
    box.innerHTML = "На iPhone откройте сайт в Safari → Поделиться → На экран «Домой». После первого запуска приложение работает офлайн.";
    box.classList.remove("hidden");
    window.scrollTo({ top: 0, behavior: "smooth" });
});
bindRouteButtons();

if (loadFromBrowser()) {
    eventNameInput.value = RaceData.eventName || "";
    clubNameInput.value = RaceData.clubName || "";
    eventDateInput.value = RaceData.eventDate || "";
    eventLocationInput.value = RaceData.eventLocation || "";
    eventStatusInput.value = RaceData.eventStatus || "club";
    refreshChampionshipSelectors();
    raceChampionshipInput.value = RaceData.championshipId || "";
    raceStageNumberInput.value = String(RaceData.championshipStageNumber || 1);
    publishAllowedInput.checked = Boolean(RaceData.publishAllowed);
    qualifyingSelect.value = String(RaceData.qualifyingCount || 4);
} else {
    eventDateInput.value = new Date().toISOString().slice(0,10);
}

drawPilots();
restoreRaceView();
updateHomeSummary();
navigateTo("home");


const HELP_SECTIONS={
 manual:`<div class="guideContent"><h2>Руководство пользователя</h2><h3>1. Создание соревнования</h3><p>Выберите тип: этап чемпионата, клубная гонка, тренировка или тест. Для этапа укажите чемпионат и номер этапа.</p><h3>2. Участники</h3><p>Добавьте пилотов. При создании следующего этапа список пилотов сезона переносится автоматически: удалите из текущего этапа тех, кто не приехал, и добавьте новичков.</p><h3>3. Квалификация</h3><p>Создайте заезды, внесите результаты и сохраните каждую серию. В рейтинг входят три лучших результата.</p><h3>4. Финалы</h3><p>После квалификации программа автоматически создаёт прямой проход TOP 4, необходимые LCQ и три заезда Финала A. Введите результат каждого заезда последовательно. Итог Финала A считается по двум лучшим результатам из трёх.</p><h3>5. Завершение этапа</h3><p>Сохраните этап в архив. Для этапа чемпионата очки автоматически попадут в общий зачёт.</p><h3>6. Экспорт</h3><p>Кнопка «PDF / Печать» создаёт печатный документ, «Скачать PNG» — изображение итогов.</p></div>`,
 raceguide:`<div class="guideContent">
<h2>Спортивный регламент Legion RX</h2>

<h3>1. Квалификация</h3>
<p>Квалификация проводится по действующей системе приложения без изменений. В одном заезде стартует до <b>6 машин</b>, дистанция — <b>5 кругов</b>. При большем составе программа равномерно распределяет пилотов по заездам. В итоговый рейтинг входят три лучших результата — <b>Best 3</b>.</p>
<div class="raceGuideVisual">
  <div class="guideVisualTitle">Квалификация — старт в один ряд</div>
  <div class="rxGridDiagram rxQualifyingGrid" role="img" aria-label="Шесть вертикальных машин стоят в один ряд; над каждой машиной отдельно расположена П-образная стартовая скоба">
    <div class="rxDirection"><span>↑</span><b>НАПРАВЛЕНИЕ ДВИЖЕНИЯ</b></div>
    <div class="rxTrack"><div class="rxQualifyingRow">
      <span class="rxCar pole"><i></i><b>1</b></span><span class="rxCar"><i></i><b>2</b></span><span class="rxCar"><i></i><b>3</b></span><span class="rxCar"><i></i><b>4</b></span><span class="rxCar"><i></i><b>5</b></span><span class="rxCar"><i></i><b>6</b></span>
    </div></div>
  </div>
  <p class="guideCaption">Каждая машина изображена вертикальным прямоугольником. П-образная скоба находится <b>полностью над машиной</b>, шире её и отделена зазором. Позиция 1 — внутренняя стартовая позиция.</p>
</div>

<h3>2. Назначение квалификации</h3>
<p>Квалификация определяет общий рейтинг, прямой проход в Финал A, состав LCQ и стартовые позиции. Чем выше пилот в квалификации, тем больше его спортивное преимущество.</p>

<h3>3. Что такое LCQ</h3>
<p><b>LCQ — Last Chance Qualifier, заезд последнего шанса.</b> В нём стартуют пилоты, которые не прошли в Финал A напрямую. Стартовый порядок LCQ задаётся квалификацией, а проход дальше определяется только результатом самого LCQ.</p>

<div class="rxRuleCards">
  <div class="rxRuleCard"><strong>1–6 участников</strong><span>Все пилоты проходят в Финал A. Проводятся три заезда: <b>A1, A2 и A3</b>. Во всех трёх стартовая решётка одинакова и строится по квалификации.</span></div>
  <div class="rxRuleCard"><strong>7–10 участников</strong><span>Первые <b>4</b> квалификации проходят напрямую. Остальные стартуют в одном LCQ. <b>Первый и второй</b> в LCQ получают позиции 5 и 6 Финала A.</span></div>
  <div class="rxRuleCard"><strong>11–16 участников</strong><span>Первые <b>4</b> проходят напрямую. Остальные распределяются змейкой в LCQ B и LCQ C. Победитель каждого заезда проходит в Финал A.</span></div>
  <div class="rxRuleCard"><strong>17 и более</strong><span>Программа автоматически создаёт предварительные LCQ максимум по 6 машин. Победители проходят выше, пока не останется заключительный LCQ; два лучших получают последние места Финала A.</span></div>
</div>

<h3>4. Формирование решётки Финала A</h3>
<div class="rxGridOrder">
  <div><b>Позиции 1–4</b><span>Четыре лучших пилота квалификации, прошедшие напрямую.</span></div>
  <div><b>Один общий LCQ</b><span>Позиция 5 — победитель LCQ; позиция 6 — второй пилот LCQ. Квалификация не может поменять их местами.</span></div>
  <div><b>LCQ B и C</b><span>Позиции 5–6 занимают победители двух заездов. Между победителями выше стартует пилот с лучшим результатом квалификации.</span></div>
</div>

<div class="raceGuideVisual">
  <div class="guideVisualTitle">Финал A — три стартовых ряда</div>
  <div class="rxGridDiagram rxFinalGrid" role="img" aria-label="Шесть вертикальных машин стоят в три ряда по две; отдельная П-образная скоба находится над каждой машиной">
    <div class="rxDirection"><span>↑</span><b>НАПРАВЛЕНИЕ ДВИЖЕНИЯ</b></div>
    <div class="rxTrack"><div class="rxFinalRows">
      <div class="rxFinalRow rowOne"><span class="rxCar pole"><i></i><b>1</b></span><span class="rxCar"><i></i><b>2</b></span></div>
      <div class="rxFinalRow rowTwo"><span class="rxCar"><i></i><b>3</b></span><span class="rxCar"><i></i><b>4</b></span></div>
      <div class="rxFinalRow rowThree"><span class="rxCar"><i></i><b>5</b></span><span class="rxCar"><i></i><b>6</b></span></div>
    </div></div>
  </div>
  <p class="guideCaption">Позиции 1–2 — первый ряд, 3–4 — второй, 5–6 — третий. Скобы нигде не касаются корпусов машин.</p>
</div>

<h3>5. Три заезда Финала A</h3>
<p>Финал A состоит из трёх заездов по <b>7 кругов</b>: A1, A2 и A3. Во всех трёх заездах используется одна и та же стартовая решётка, сформированная перед A1.</p>
<div class="rxProgression" role="img" aria-label="Топ четыре квалификации и два пилота из LCQ образуют Финал A, затем проводятся A1, A2 и A3">
  <div class="rxProgressFinal"><span>ИТОГОВАЯ СЕРИЯ</span><b>A1 · A2 · A3</b><em>учитываются 2 лучших результата</em></div>
  <div class="rxProgressLinks"><div class="rxProgressLink"><span class="rxAdvanceCount">↑ TOP 4</span><i></i></div><div class="rxProgressLink"><span class="rxAdvanceCount">↑ 2 ИЗ LCQ</span><i></i></div></div>
  <div class="rxProgressSemis"><div class="rxProgressBlock"><span>КВАЛИФИКАЦИЯ</span><b>1–4</b><em>прямой проход</em></div><div class="rxProgressBlock"><span>ПОСЛЕДНИЙ ШАНС</span><b>LCQ</b><em>2 места</em></div></div>
</div>

<h3>6. Подсчёт результата Финала A</h3>
<p>За место в каждом финале начисляется соответствующее количество штрафных очков: 1-е место — 1, 2-е — 2, …, 6-е — 6. DNF, DNS и DSQ получают <b>7 штрафных очков</b>. В зачёт идут два лучших результата из трёх. Побеждает пилот с наименьшей суммой.</p>
<p><b>При равенстве:</b> больше побед; затем больше вторых мест; затем лучший результат A3; затем более высокое место в квалификации.</p>

<h3>7. Очки этапа</h3>
<p>Итоговые очки чемпионата начисляются по общей классификации: <b>25–18–15–12–10–8–6–4–2–1</b>.</p>
<div class="pointsGuide"><span><b>1</b>25</span><span><b>2</b>18</span><span><b>3</b>15</span><span><b>4</b>12</span><span><b>5</b>10</span><span><b>6</b>8</span><span><b>7</b>6</span><span><b>8</b>4</span><span><b>9</b>2</span><span><b>10</b>1</span></div>
</div>`,
 terms:`<div class="guideContent"><h2>Обозначения</h2><dl class="termsList"><dt>DNS</dt><dd>Did Not Start — пилот не стартовал.</dd><dt>DNF</dt><dd>Did Not Finish — пилот стартовал, но не финишировал.</dd><dt>DSQ</dt><dd>Disqualified — дисквалификация; очки не начисляются и продвижение в следующий финал невозможно.</dd><dt>DNQ</dt><dd>Did Not Qualify — пилот не прошёл квалификационный отбор.</dd></dl></div>`};
function renderHelp(key){document.querySelectorAll('.helpTab').forEach(b=>b.classList.toggle('active',b.dataset.help===key));$('helpContent').innerHTML=HELP_SECTIONS[key]||HELP_SECTIONS.manual}
document.querySelectorAll('.helpTab').forEach(b=>b.addEventListener('click',()=>renderHelp(b.dataset.help)));
initChampionships(); toggleChampionshipFields();
