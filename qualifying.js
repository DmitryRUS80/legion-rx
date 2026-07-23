/* Legion RX Championship Edition v3.0 */

function getHeatCount(pilotCount) {
    if (pilotCount <= 6) return 1;
    return Math.ceil(pilotCount / 6);
}

function buildSnakeHeats(pilots, heatCount, round) {
    const shift = pilots.length ? (round - 1) % pilots.length : 0;
    const ordered = [...pilots.slice(shift), ...pilots.slice(0, shift)];
    const heats = Array.from({ length: heatCount }, () => []);

    ordered.forEach((pilot, index) => {
        const row = Math.floor(index / heatCount);
        const column = index % heatCount;
        const heatIndex = row % 2 === 0 ? column : heatCount - 1 - column;
        heats[heatIndex].push(pilot);
    });

    return heats.filter(heat => heat.length);
}

function createQualifyingData() {
    RaceData.heats = [];
    const pilots = [...RaceData.pilots].sort((a,b) => (a.registrationOrder || 0) - (b.registrationOrder || 0));
    const heatCount = getHeatCount(pilots.length);

    for (let round = 1; round <= RaceData.qualifyingCount; round += 1) {
        buildSnakeHeats(pilots, heatCount, round).forEach((heatPilots, heatIndex) => {
            RaceData.heats.push({
                qualifying: round,
                heat: heatIndex + 1,
                pilots: heatPilots.map(pilot => pilot.id),
                saved: false
            });
        });
    }
}

function generateQualifying() {
    RaceData.finals = [];
    RaceData.finalProtocol = [];
    RaceData.exactTieLots = {};
    RaceData.stage = "qualifying";
    RaceData.pilots.forEach(pilot => {
        pilot.qualifying = [];
        pilot.best3 = 0;
        pilot.points = 0;
        pilot.finalResults = [];
    });
    createQualifyingData();
    renderQualifying();
    saveToBrowser();
    document.getElementById("qualifyingBlock").scrollIntoView({ behavior: "smooth", block: "start" });
}

function resultOptions(count, selectedValue = "") {
    let html = `<option value="">—</option>`;
    for (let place = 1; place <= count; place += 1) {
        html += `<option value="${place}" ${String(selectedValue) === String(place) ? "selected" : ""}>${place}</option>`;
    }
    ["DNF", "DNS", "DSQ"].forEach(status => {
        html += `<option value="${status}" ${selectedValue === status ? "selected" : ""}>${status}</option>`;
    });
    return html;
}

function dnfOrderOptions(count, selectedValue = "") {
    let html = `<option value="">Порядок схода</option>`;
    for (let order = 1; order <= count; order += 1) {
        html += `<option value="${order}" ${String(selectedValue) === String(order) ? "selected" : ""}>DNF-${order}</option>`;
    }
    return html;
}

function refreshUniquePlaces(selector) {
    const selects = [...document.querySelectorAll(selector)];
    const chosen = new Map();
    selects.forEach(select => {
        const value = select.value;
        if (/^\d+$/.test(value)) chosen.set(value, select);
    });

    selects.forEach(select => {
        [...select.options].forEach(option => {
            if (!/^\d+$/.test(option.value)) return;
            option.disabled = chosen.has(option.value) && chosen.get(option.value) !== select;
        });
    });
}

function refreshUniqueDnfOrders(round, heat) {
    const selectors = [...document.querySelectorAll(`.dnfOrder[data-q="${round}"][data-heat="${heat}"]`)].filter(select => !select.classList.contains("hidden"));
    const chosen = new Map();
    selectors.forEach(select => { if (select.value) chosen.set(select.value, select); });
    selectors.forEach(select => {
        [...select.options].forEach(option => {
            if (!option.value) return;
            option.disabled = chosen.has(option.value) && chosen.get(option.value) !== select;
        });
    });
}

function toggleDnfOrder(select) {
    const orderSelect = document.querySelector(`.dnfOrder[data-id="${select.dataset.id}"][data-q="${select.dataset.q}"][data-heat="${select.dataset.heat}"]`);
    if (!orderSelect) return;
    const isDnf = select.value === "DNF";
    orderSelect.classList.toggle("hidden", !isDnf);
    orderSelect.disabled = select.disabled || !isDnf;
    if (!isDnf) orderSelect.value = "";
    refreshUniqueDnfOrders(select.dataset.q, select.dataset.heat);
}

function bindUniquePlaceSelectors() {
    document.querySelectorAll(".finishPlace").forEach(select => {
        select.addEventListener("change", () => {
            refreshUniquePlaces(`.finishPlace[data-q="${select.dataset.q}"][data-heat="${select.dataset.heat}"]`);
            toggleDnfOrder(select);
        });
        toggleDnfOrder(select);
    });

    document.querySelectorAll(".dnfOrder").forEach(select => {
        select.addEventListener("change", () => refreshUniqueDnfOrders(select.dataset.q, select.dataset.heat));
    });

    const groups = new Set([...document.querySelectorAll(".finishPlace")].map(select => `${select.dataset.q}:${select.dataset.heat}`));
    groups.forEach(group => {
        const [round, heat] = group.split(":");
        refreshUniquePlaces(`.finishPlace[data-q="${round}"][data-heat="${heat}"]`);
        refreshUniqueDnfOrders(round, heat);
    });
}

function renderQualifying() {
    const block = document.getElementById("qualifyingBlock");
    const content = document.getElementById("qualifyingContent");
    block.classList.remove("hidden");
    document.getElementById("finalsSection").classList.add("hidden");
    document.getElementById("protocolSection").classList.add("hidden");
    content.innerHTML = "";

    for (let round = 1; round <= RaceData.qualifyingCount; round += 1) {
        const roundHeats = RaceData.heats.filter(heat => heat.qualifying === round).sort((a,b) => a.heat-b.heat);
        let html = `<section class="roundBlock"><h2>Квалификация ${round}</h2>`;

        roundHeats.forEach(heatData => {
            const pilots = heatData.pilots.map(getPilot).filter(Boolean);
            html += `<div class="heatCard"><div class="heatHeader"><h3>Заезд ${heatData.heat}</h3><span>${pilots.length} пилотов</span></div><div class="qualifyingPilotList">`;

            pilots.forEach((pilot, pilotIndex) => {
                const saved = pilot.qualifying.find(result => result.round === round);
                const value = saved ? (saved.status === "FIN" ? saved.place : saved.status) : "";
                const dnfOrder = saved?.dnfOrder || "";
                html += `<div class="qualifyingPilotRow">
                    <div class="qualifyingPilotIdentity">
                        <div class="qualifyingPilotNumber">${pilotIndex + 1}</div>
                        <div class="pilotRowPhoto qualifyingPilotPhoto">${pilotPhotoMarkup(pilot.photo, pilot.name)}</div>
                        <div class="pilotRowInfo qualifyingPilotInfo"><b>${escapeHtml(pilot.name)}</b>${pilotClubMarkup(pilot.club)}</div>
                    </div>
                    <div class="qualifyingResultSide">
                        <label class="qualifyingResultLabel" for="q${round}h${heatData.heat}p${pilot.id}">Место</label>
                        <div class="resultControl">
                            <select id="q${round}h${heatData.heat}p${pilot.id}" class="finishPlace" data-id="${pilot.id}" data-q="${round}" data-heat="${heatData.heat}" ${heatData.saved ? "disabled" : ""}>${resultOptions(pilots.length, value)}</select>
                            <select class="dnfOrder ${value === "DNF" ? "" : "hidden"}" data-id="${pilot.id}" data-q="${round}" data-heat="${heatData.heat}" ${heatData.saved || value !== "DNF" ? "disabled" : ""}>${dnfOrderOptions(pilots.length, dnfOrder)}</select>
                        </div>
                    </div>
                </div>`;
            });

            html += `</div><div class="heatActions"><button id="save_q${round}_h${heatData.heat}" onclick="saveHeat(${round},${heatData.heat})" ${heatData.saved ? "disabled" : ""}>${heatData.saved ? "✔ Заезд сохранён" : "Сохранить заезд"}</button>${heatData.saved ? `<button class="secondaryButton editResultButton" onclick="editHeat(${round},${heatData.heat})">Исправить результат</button>` : ""}</div></div>`;
        });

        content.insertAdjacentHTML("beforeend", `${html}</section>`);
    }

    bindUniquePlaceSelectors();
    drawStandings();
}

function validateHeatResults(round, heatNumber) {
    const selects = [...document.querySelectorAll(`.finishPlace[data-q="${round}"][data-heat="${heatNumber}"]`)];
    if (selects.some(select => !select.value)) return "Укажите результат каждого пилота.";

    const places = selects.map(select => select.value).filter(value => /^\d+$/.test(value));
    if (new Set(places).size !== places.length) return "Финишные места не должны повторяться.";

    const dnfSelects = selects.filter(select => select.value === "DNF");
    const dnfOrders = dnfSelects.map(select => document.querySelector(`.dnfOrder[data-id="${select.dataset.id}"][data-q="${round}"][data-heat="${heatNumber}"]`)?.value || "");
    if (dnfOrders.some(value => !value)) return "Для каждого DNF укажите порядок схода.";
    if (new Set(dnfOrders).size !== dnfOrders.length) return "Порядок DNF не должен повторяться.";

    return "";
}

function saveHeat(round, heatNumber) {
    const heatData = RaceData.heats.find(heat => heat.qualifying === round && heat.heat === heatNumber);
    if (!heatData || heatData.saved) return;

    const error = validateHeatResults(round, heatNumber);
    if (error) return alert(error);

    const selects = [...document.querySelectorAll(`.finishPlace[data-q="${round}"][data-heat="${heatNumber}"]`)];
    selects.forEach(select => {
        const raw = select.value;
        const dnfOrder = raw === "DNF" ? Number(document.querySelector(`.dnfOrder[data-id="${select.dataset.id}"][data-q="${round}"][data-heat="${heatNumber}"]`)?.value) : null;
        savePilotResult(getPilot(select.dataset.id), round, heatNumber, /^\d+$/.test(raw) ? Number(raw) : raw, dnfOrder);
        select.disabled = true;
    });

    heatData.saved = true;
    updateStandings();
    drawStandings();
    saveToBrowser();
    renderQualifying();

    if (RaceData.heats.every(heat => heat.saved)) {
        RaceData.stage = "finals";
        document.getElementById("finalsSection").classList.remove("hidden");
        if (hasUnresolvedExactTies()) {
            alert("Квалификация завершена. Перед формированием финалов проведите жеребьёвку для абсолютного равенства.");
            document.getElementById("standings").scrollIntoView({ behavior: "smooth", block: "center" });
            saveToBrowser();
            return;
        }
        generateFinals();
        document.getElementById("finalsSection").scrollIntoView({ behavior: "smooth", block: "start" });
    }
}

function editHeat(round, heatNumber) {
    const heatData = RaceData.heats.find(heat => heat.qualifying === round && heat.heat === heatNumber);
    if (!heatData?.saved) return;

    const downstreamExists = RaceData.finals.length || RaceData.finalProtocol.length;
    const message = downstreamExists
        ? "Изменение квалификации удалит сформированные финалы и итоговый протокол. Продолжить?"
        : "Разблокировать заезд для исправления результата?";
    if (!confirm(message)) return;

    heatData.saved = false;
    heatData.pilots.forEach(id => {
        const pilot = getPilot(id);
        pilot.qualifying = pilot.qualifying.filter(result => result.round !== round);
    });
    RaceData.finals = [];
    RaceData.finalProtocol = [];
    RaceData.exactTieLots = {};
    RaceData.stage = "qualifying";
    updateStandings();
    saveToBrowser();
    renderQualifying();
}
