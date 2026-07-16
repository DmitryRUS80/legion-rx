/* Legion RallyCross Manager v2.3 UI */

const $ = id => document.getElementById(id);
const eventNameInput = $("eventName");
const clubNameInput = $("clubName");
const eventDateInput = $("eventDate");
const eventLocationInput = $("eventLocation");
const eventStatusInput = $("eventStatus");
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

function readRaceForm() {
    RaceData.eventName = eventNameInput.value.trim() || "Соревнование Legion RX";
    RaceData.clubName = clubNameInput.value.trim() || "Legion RC Penza";
    RaceData.eventDate = eventDateInput.value;
    RaceData.eventLocation = eventLocationInput.value.trim();
    RaceData.eventStatus = eventStatusInput.value;
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
    const views = { home: $("homeView"), race: $("raceView"), archive: $("archiveView"), settings: $("settingsView") };
    Object.entries(views).forEach(([name, element]) => element?.classList.toggle("hidden", name !== view));
    document.querySelectorAll(".navItem").forEach(item => item.classList.toggle("active", item.dataset.route === view && (!scrollId || item.dataset.scroll === scrollId)));
    if (view === "archive") drawArchive();
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

$("showRules").addEventListener("click", () => {
    const panel = $("rulesPanel");
    panel.innerHTML = `
        <div class="rulesHeader"><div><span>LEGION RX</span><h2>Спортивный регламент v2.3</h2></div><button class="secondaryButton" onclick="document.getElementById('rulesPanel').classList.add('hidden')">Закрыть</button></div>
        <div class="rulesGrid">
            <article><b>Квалификация</b><p>3–5 серий. Всегда учитываются три лучших результата. Очки начисляются за место в своём заезде.</p></article>
            <article><b>Тай-брейк</b><p>Best 3 → победы в зачётной тройке → вторые/третьи места → лучший отброшенный результат → последние квалификации → жеребьёвка.</p></article>
            <article><b>Статусы</b><p>DNF получает 0 очков и ручной порядок схода. DNS и DSQ получают 0. DSQ не продвигается в следующий финал.</p></article>
            <article><b>3–6 пилотов</b><p>A1 формирует старт A2. A2 определяет итог соревнования.</p></article>
            <article><b>7–16 пилотов</b><p>Из нижних финалов проходят два лучших классифицированных. B полностью формирует решётку A.</p></article>
            <article><b>Очки этапа</b><p>25–20–16–13–11–10–8–6–4–3–2–1. С 13 места — 0.</p></article>
        </div>`;
    panel.classList.remove("hidden");
    panel.scrollIntoView({ behavior: "smooth", block: "start" });
});

if (loadFromBrowser()) {
    eventNameInput.value = RaceData.eventName || "";
    clubNameInput.value = RaceData.clubName || "";
    eventDateInput.value = RaceData.eventDate || "";
    eventLocationInput.value = RaceData.eventLocation || "";
    eventStatusInput.value = RaceData.eventStatus || "club";
    publishAllowedInput.checked = Boolean(RaceData.publishAllowed);
    qualifyingSelect.value = String(RaceData.qualifyingCount || 4);
} else {
    eventDateInput.value = new Date().toISOString().slice(0,10);
}

drawPilots();
restoreRaceView();
updateHomeSummary();
navigateTo("home");
