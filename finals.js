/*
==========================================
Legion RallyCross Manager
Version 1.2
finals.js
==========================================
*/

function createFinal(name, pilots, order) {
    return {
        name,
        order,
        pilots: pilots.map(pilot => pilot.id),
        result: [],
        saved: false,
        enabled: order === 1
    };
}

function generateFinals() {
    updateStandings();
    RaceData.finals = [];
    RaceData.finalProtocol = [];

    const pilots = [...RaceData.pilots];
    const count = pilots.length;

    if (count <= 6) {
        RaceData.finals.push(createFinal("A1", pilots, 1));
        RaceData.finals.push(createFinal("A2", pilots, 2));
    } else {
        const directA = pilots.slice(0, 2);
        const remaining = pilots.slice(2);

        if (remaining.length <= 6) {
            RaceData.finals.push(createFinal("B", remaining, 1));
            RaceData.finals.push(createFinal("A", directA, 2));
        } else {
            const initialB = remaining.slice(0, 4);
            const initialC = remaining.slice(4);
            RaceData.finals.push(createFinal("C", initialC, 1));
            RaceData.finals.push(createFinal("B", initialB, 2));
            RaceData.finals.push(createFinal("A", directA, 3));
        }
    }

    drawFinalsExplanation();
    drawFinals();
    saveToBrowser();
}

function getFinalPilots(final) {
    return final.pilots.map(getPilot).filter(Boolean);
}

function getFinalRule(final) {
    if (final.name === "A1") {
        return {
            title: "Первый финальный заезд",
            text: "Все пилоты едут A1. Результат A1 задаёт стартовый порядок A2.",
            advance: "Все переходят в A2"
        };
    }

    if (final.name === "A2") {
        return {
            title: "Главный финальный заезд",
            text: "Результат A2 определяет итоговые места соревнования.",
            advance: "Определяет победителя"
        };
    }

    if (final.name === "C") {
        return {
            title: "Нижний отборочный финал",
            text: "Два первых пилота переходят в финал B. Остальные завершают соревнование согласно результату C.",
            advance: "1–2 место → B"
        };
    }

    if (final.name === "B") {
        return {
            title: "Отборочный финал",
            text: "Два первых пилота переходят в финал A. Остальные завершают соревнование согласно результату B.",
            advance: "1–2 место → A"
        };
    }

    return {
        title: "Главный финал",
        text: "Результат финала A определяет итоговые места соревнования.",
        advance: "Определяет победителя"
    };
}

function drawFinalsExplanation() {
    const container = document.getElementById("finalsExplanation");
    if (!container) return;

    const count = RaceData.pilots.length;
    let html = `<div class="finalsGuide"><h3>Как проходят финалы</h3>`;

    if (count <= 6) {
        html += `
            <div class="routeFlow">
                <div class="routeStep"><strong>A1</strong><span>первый заезд всех пилотов</span></div>
                <div class="routeArrow">↓</div>
                <div class="routeStep routeMain"><strong>A2</strong><span>решающий заезд и итоговые места</span></div>
            </div>`;
    } else if (RaceData.finals.some(final => final.name === "C")) {
        html += `
            <p>Пилоты №1 и №2 квалификации уже находятся в A.</p>
            <div class="routeFlow">
                <div class="routeStep"><strong>C</strong><span>два лучших проходят дальше</span></div>
                <div class="routeArrow">↓</div>
                <div class="routeStep"><strong>B</strong><span>два лучших проходят дальше</span></div>
                <div class="routeArrow">↓</div>
                <div class="routeStep routeMain"><strong>A</strong><span>главный финал</span></div>
            </div>`;
    } else {
        html += `
            <p>Пилоты №1 и №2 квалификации уже находятся в A.</p>
            <div class="routeFlow">
                <div class="routeStep"><strong>B</strong><span>два лучших проходят дальше</span></div>
                <div class="routeArrow">↓</div>
                <div class="routeStep routeMain"><strong>A</strong><span>главный финал</span></div>
            </div>`;
    }

    html += `<p class="guideNote">В финалах очки квалификации больше не меняются. Здесь учитывается только порядок финиша.</p></div>`;
    container.innerHTML = html;
}

function buildGridHtml(pilots) {
    let html = `<div class="startDirection">НАПРАВЛЕНИЕ ДВИЖЕНИЯ ↑</div><div class="finalGrid">`;
    let index = 0;
    let groupSize = 2;

    while (index < pilots.length) {
        const rowPilots = pilots.slice(index, index + groupSize);
        html += `<div class="finalRow ${groupSize === 1 ? "single" : "pair"}">`;

        rowPilots.forEach((pilot, offset) => {
            html += `
                <div class="finalSlot">
                    <div class="finalPlace">${index + offset + 1}</div>
                    <div class="finalPilot">${escapeHtml(pilot.name)}</div>
                </div>`;
        });

        html += `</div>`;
        index += rowPilots.length;
        groupSize = groupSize === 2 ? 1 : 2;
    }

    html += `</div>`;
    return html;
}

function buildSavedResultHtml(final) {
    if (!final.saved || !final.result.length) return "";

    const rule = getFinalRule(final);
    let html = `<div class="savedFinalResult"><h3>Результат финала ${final.name}</h3>`;

    final.result.forEach(item => {
        const pilot = getPilot(item.pilotId);
        const advances = (final.name === "B" || final.name === "C") && item.place <= 2;
        html += `
            <div class="savedResultRow ${advances ? "advances" : ""}">
                <span class="resultPosition">${item.place}</span>
                <span class="resultPilot">${escapeHtml(pilot.name)}</span>
                <span class="resultAction">${advances ? rule.advance : ""}</span>
            </div>`;
    });

    html += `</div>`;
    return html;
}

function drawFinals() {
    const block = document.getElementById("finalsBlock");
    if (!block) return;

    block.innerHTML = "";

    [...RaceData.finals]
        .sort((a, b) => a.order - b.order)
        .forEach(final => {
            const pilots = getFinalPilots(final);
            const rule = getFinalRule(final);
            const stateText = final.saved ? "Завершён" : final.enabled ? "Готов к проведению" : "Ожидает предыдущий финал";

            let html = `
                <article class="finalCard ${final.enabled ? "activeFinal" : "lockedFinal"}" id="final_${final.name}">
                    <div class="finalTitleRow">
                        <div>
                            <h2>Финал ${final.name}</h2>
                            <div class="finalSubtitle">${rule.title}</div>
                        </div>
                        <span class="statusBadge">${stateText}</span>
                    </div>
                    <div class="finalRuleBox">
                        <strong>${rule.advance}</strong>
                        <span>${rule.text}</span>
                    </div>
                    ${buildGridHtml(pilots)}`;

            if (!final.saved) {
                html += `
                    <div class="finishInputTitle">Введите фактический порядок финиша</div>
                    <div class="tableWrap">
                    <table>
                        <thead><tr><th>Финиш</th><th>Пилот</th></tr></thead>
                        <tbody>`;

                pilots.forEach(pilot => {
                    html += `
                        <tr>
                            <td>
                                <select class="finalPlaceSelect"
                                    data-final="${final.name}"
                                    data-id="${pilot.id}"
                                    ${!final.enabled ? "disabled" : ""}>
                                    <option value="">—</option>
                                    ${pilots.map((_, index) => `<option value="${index + 1}">${index + 1}</option>`).join("")}
                                </select>
                            </td>
                            <td>${escapeHtml(pilot.name)}</td>
                        </tr>`;
                });

                html += `
                            </tbody>
                        </table>
                        </div>
                        <button class="finalButton"
                            onclick="saveFinal('${final.name}')"
                            ${!final.enabled ? "disabled" : ""}>
                            Сохранить результат финала ${final.name}
                        </button>`;
            } else {
                html += buildSavedResultHtml(final);
            }

            html += `</article>`;
            block.insertAdjacentHTML("beforeend", html);
        });
}

function saveFinal(finalName) {
    const final = RaceData.finals.find(item => item.name === finalName);
    if (!final || !final.enabled || final.saved) return;

    const selects = [...document.querySelectorAll(`.finalPlaceSelect[data-final="${finalName}"]`)];
    const places = selects.map(select => Number(select.value));
    const sorted = [...places].sort((a, b) => a - b);

    if (places.some(place => !Number.isInteger(place) || place < 1)) {
        alert("Заполните все места финала.");
        return;
    }

    if (sorted.some((place, index) => place !== index + 1)) {
        alert(`Места должны быть без повторений: от 1 до ${selects.length}.`);
        return;
    }

    final.result = selects
        .map(select => ({ pilotId: select.dataset.id, place: Number(select.value) }))
        .sort((a, b) => a.place - b.place);
    final.saved = true;

    final.result.forEach(item => {
        const pilot = getPilot(item.pilotId);
        pilot.finalResults.push({ final: finalName, place: item.place });
    });

    advanceFinalists(final);
    drawFinalsExplanation();
    drawFinals();
    saveToBrowser();
}

function advanceFinalists(final) {
    if (final.name === "A1") {
        const a2 = RaceData.finals.find(item => item.name === "A2");
        a2.pilots = final.result.map(item => item.pilotId);
        a2.enabled = true;
        return;
    }

    if (final.name === "C") {
        const bFinal = RaceData.finals.find(item => item.name === "B");
        bFinal.pilots = [...bFinal.pilots, final.result[0].pilotId, final.result[1].pilotId];
        bFinal.enabled = true;
        return;
    }

    if (final.name === "B") {
        const aFinal = RaceData.finals.find(item => item.name === "A");
        aFinal.pilots = [...aFinal.pilots, final.result[0].pilotId, final.result[1].pilotId];
        aFinal.enabled = true;
        return;
    }

    if (final.name === "A" || final.name === "A2") {
        buildFinalProtocol(final);
    }
}

function buildFinalProtocol(mainFinal) {
    const protocol = [];
    const added = new Set();

    mainFinal.result.forEach(item => {
        protocol.push(getPilot(item.pilotId));
        added.add(String(item.pilotId));
    });

    [...RaceData.finals]
        .filter(final => final.saved && final.name !== mainFinal.name)
        .sort((a, b) => b.order - a.order)
        .forEach(final => {
            final.result.forEach(item => {
                const id = String(item.pilotId);
                if (!added.has(id)) {
                    protocol.push(getPilot(item.pilotId));
                    added.add(id);
                }
            });
        });

    RaceData.pilots.forEach(pilot => {
        if (!added.has(String(pilot.id))) protocol.push(pilot);
    });

    RaceData.finalProtocol = protocol.map((pilot, index) => ({
        place: index + 1,
        pilotId: pilot.id
    }));
    RaceData.stage = "finished";
    drawFinalProtocol();
}

function drawFinalProtocol() {
    const section = document.getElementById("protocolSection");
    const block = document.getElementById("protocolBlock");
    if (!section || !block || !RaceData.finalProtocol.length) return;

    section.classList.remove("hidden");

    let html = `<div class="podium">`;
    RaceData.finalProtocol.slice(0, 3).forEach(item => {
        const pilot = getPilot(item.pilotId);
        html += `<div class="podiumPlace place${item.place}"><span>${item.place}</span>${escapeHtml(pilot.name)}</div>`;
    });
    html += `</div><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th></tr></thead><tbody>`;

    RaceData.finalProtocol.forEach(item => {
        html += `<tr><td>${item.place}</td><td>${escapeHtml(getPilot(item.pilotId).name)}</td></tr>`;
    });

    html += `</tbody></table></div>`;
    block.innerHTML = html;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
}
