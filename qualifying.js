/*
==========================================
Legion RallyCross Manager
Version 1.2
qualifying.js
==========================================
*/

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

    return heats.filter(heat => heat.length > 0);
}

function createQualifyingData() {
    RaceData.heats = [];
    const pilots = [...RaceData.pilots];
    const heatCount = getHeatCount(pilots.length);

    for (let round = 1; round <= RaceData.qualifyingCount; round += 1) {
        const heats = buildSnakeHeats(pilots, heatCount, round);

        heats.forEach((heatPilots, heatIndex) => {
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

function renderQualifying() {
    const block = document.getElementById("qualifyingBlock");
    const content = document.getElementById("qualifyingContent");

    block.classList.remove("hidden");
    document.getElementById("finalsSection").classList.add("hidden");
    document.getElementById("protocolSection").classList.add("hidden");
    content.innerHTML = "";

    for (let round = 1; round <= RaceData.qualifyingCount; round += 1) {
        const roundHeats = RaceData.heats
            .filter(heat => heat.qualifying === round)
            .sort((a, b) => a.heat - b.heat);

        let roundHtml = `<section class="roundBlock"><h2>Квалификация ${round}</h2>`;

        roundHeats.forEach(heatData => {
            const heatPilots = heatData.pilots.map(getPilot).filter(Boolean);
            const savedLabel = heatData.saved ? "✔ Заезд сохранён" : "Сохранить заезд";

            roundHtml += `
                <div class="heatCard" id="heat_q${round}_h${heatData.heat}">
                    <div class="heatHeader">
                        <h3>Заезд ${heatData.heat}</h3>
                        <span>${heatPilots.length} пилотов</span>
                    </div>
                    <div class="tableWrap">
                    <table>
                        <thead><tr><th>Место</th><th>Пилот</th></tr></thead>
                        <tbody>`;

            heatPilots.forEach(pilot => {
                const savedResult = pilot.qualifying.find(result => result.round === round);
                roundHtml += `
                    <tr>
                        <td>
                            <select class="finishPlace"
                                data-id="${pilot.id}"
                                data-q="${round}"
                                data-heat="${heatData.heat}"
                                ${heatData.saved ? "disabled" : ""}>
                                <option value="">—</option>
                                ${heatPilots.map((_, index) => {
                                    const place = index + 1;
                                    return `<option value="${place}" ${savedResult?.place === place ? "selected" : ""}>${place}</option>`;
                                }).join("")}
                            </select>
                        </td>
                        <td>${escapeHtml(pilot.name)}</td>
                    </tr>`;
            });

            roundHtml += `
                        </tbody>
                    </table>
                    </div>
                    <button id="save_q${round}_h${heatData.heat}"
                        onclick="saveHeat(${round}, ${heatData.heat})"
                        ${heatData.saved ? "disabled" : ""}>
                        ${savedLabel}
                    </button>
                </div>`;
        });

        roundHtml += `</section>`;
        content.insertAdjacentHTML("beforeend", roundHtml);
    }

    drawStandings();
}

function saveHeat(round, heatNumber) {
    const heatData = RaceData.heats.find(
        heat => heat.qualifying === round && heat.heat === heatNumber
    );

    if (!heatData) {
        alert("Заезд не найден.");
        return;
    }

    if (heatData.saved) {
        alert("Этот заезд уже сохранён.");
        return;
    }

    const selects = [...document.querySelectorAll(
        `.finishPlace[data-q="${round}"][data-heat="${heatNumber}"]`
    )];

    const places = selects.map(select => Number(select.value));
    const expected = selects.map((_, index) => index + 1);

    if (places.some(place => !Number.isInteger(place) || place < 1)) {
        alert("Заполните место каждого пилота.");
        return;
    }

    const sortedPlaces = [...places].sort((a, b) => a - b);
    if (sortedPlaces.some((place, index) => place !== expected[index])) {
        alert(`Места должны быть без повторений: от 1 до ${selects.length}.`);
        return;
    }

    selects.forEach(select => {
        const pilot = getPilot(select.dataset.id);
        savePilotResult(pilot, round, heatNumber, Number(select.value));
        select.disabled = true;
    });

    heatData.saved = true;

    const button = document.getElementById(`save_q${round}_h${heatNumber}`);
    button.disabled = true;
    button.textContent = "✔ Заезд сохранён";

    updateStandings();
    drawStandings();
    saveToBrowser();

    const remaining = RaceData.heats.filter(heat => !heat.saved).length;
    if (remaining === 0) {
        RaceData.stage = "finals";
        const finalsSection = document.getElementById("finalsSection");
        finalsSection.classList.remove("hidden");
        generateFinals();
        finalsSection.scrollIntoView({ behavior: "smooth", block: "start" });
    }
}
