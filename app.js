/*
====================================
Legion RallyCross Manager
Version 1.1
app.js
====================================
*/

const eventNameInput = document.getElementById("eventName");
const qualifyingSelect = document.getElementById("qualifyingCount");
const createRaceButton = document.getElementById("createRace");
const pilotInput = document.getElementById("pilotName");
const addPilotButton = document.getElementById("addPilot");
const pilotTable = document.querySelector("#pilotTable tbody");
const pilotCounter = document.getElementById("pilotCounter");
const nextButton = document.getElementById("nextStep");

function escapeHtml(value) {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

createRaceButton.addEventListener("click", () => {
    RaceData.eventName = eventNameInput.value.trim() || "Соревнование Legion RX";
    RaceData.qualifyingCount = Number(qualifyingSelect.value);
    createRaceButton.textContent = "✔ Соревнование создано";
    saveToBrowser();
});

addPilotButton.addEventListener("click", () => {
    const name = pilotInput.value.trim();
    if (!name) return;

    if (RaceData.pilots.some(pilot => pilot.name.toLowerCase() === name.toLowerCase())) {
        alert("Пилот с таким именем уже добавлен.");
        return;
    }

    addPilot(name);
    pilotInput.value = "";
    drawPilots();
    saveToBrowser();
});

pilotInput.addEventListener("keydown", event => {
    if (event.key === "Enter") addPilotButton.click();
});

function drawPilots() {
    pilotTable.innerHTML = "";

    RaceData.pilots.forEach((pilot, index) => {
        const row = document.createElement("tr");
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>${escapeHtml(pilot.name)}</td>
            <td><button class="removeButton" data-id="${pilot.id}">Удалить</button></td>`;
        pilotTable.appendChild(row);
    });

    pilotTable.querySelectorAll(".removeButton").forEach(button => {
        button.addEventListener("click", () => {
            removePilot(button.dataset.id);
            drawPilots();
            saveToBrowser();
        });
    });

    pilotCounter.textContent = `Пилотов: ${RaceData.pilots.length}`;
    nextButton.disabled = RaceData.pilots.length < 3;
}

nextButton.addEventListener("click", () => {
    if (RaceData.pilots.length < 3) {
        alert("Минимум 3 пилота.");
        return;
    }

    RaceData.eventName = eventNameInput.value.trim() || "Соревнование Legion RX";
    RaceData.qualifyingCount = Number(qualifyingSelect.value);
    generateQualifying();
    saveToBrowser();
});

function saveToBrowser() {
    localStorage.setItem("legionRxRace", JSON.stringify(RaceData));
}

function loadFromBrowser() {
    const saved = localStorage.getItem("legionRxRace");
    if (!saved) return false;

    try {
        const parsed = JSON.parse(saved);
        Object.assign(RaceData, parsed);
        RaceData.pilots = (parsed.pilots || []).map(data => Object.assign(new Pilot(data.name), data));
        return true;
    } catch (error) {
        console.error("Не удалось загрузить сохранение", error);
        return false;
    }
}

function exportRace() {
    const blob = new Blob([JSON.stringify(RaceData, null, 2)], { type: "application/json" });
    const link = document.createElement("a");
    const safeName = (RaceData.eventName || "legion-rx").replace(/[^a-zа-я0-9_-]+/gi, "_");
    link.href = URL.createObjectURL(blob);
    link.download = `${safeName}.json`;
    link.click();
    URL.revokeObjectURL(link.href);
}

function clearRace() {
    if (!confirm("Удалить текущее соревнование и все результаты?")) return;
    localStorage.removeItem("legionRxRace");
    location.reload();
}

document.getElementById("exportRace").addEventListener("click", exportRace);
document.getElementById("clearRace").addEventListener("click", clearRace);

function restoreRaceView() {
    if (RaceData.stage === "qualifying" && RaceData.heats.length) {
        renderQualifying();
        return;
    }

    if ((RaceData.stage === "finals" || RaceData.stage === "finished") && RaceData.heats.length) {
        renderQualifying();
        const finalsSection = document.getElementById("finalsSection");
        finalsSection.classList.remove("hidden");
        drawFinalsExplanation();
        drawFinals();

        if (RaceData.stage === "finished" && RaceData.finalProtocol.length) {
            drawFinalProtocol();
        }
    }
}

if (loadFromBrowser()) {
    eventNameInput.value = RaceData.eventName;
    qualifyingSelect.value = String(RaceData.qualifyingCount);
}

drawPilots();
restoreRaceView();
