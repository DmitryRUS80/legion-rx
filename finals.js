/* Legion RallyCross Manager v1.3 */

const LADDER_NAMES = ["B", "C", "D", "E", "F"];

function createFinal(name, pilots, order, enabled = false) {
    return { name, order, pilots: pilots.map(p => p.id || p), result: [], saved: false, enabled };
}

function generateFinals() {
    updateStandings();
    RaceData.finals = [];
    RaceData.finalProtocol = [];
    const pilots = [...RaceData.pilots];

    if (pilots.length <= 6) {
        RaceData.finals.push(createFinal("A1", pilots, 1, true));
        RaceData.finals.push(createFinal("A2", [], 2, false));
    } else {
        RaceData.finals.push(createFinal("B", pilots.slice(0, 4), 999, false));
        let remaining = pilots.slice(4);
        let index = 1;

        while (remaining.length > 6) {
            RaceData.finals.push(createFinal(LADDER_NAMES[index], remaining.slice(0, 4), 999 - index, false));
            remaining = remaining.slice(4);
            index += 1;
        }

        const bottomName = LADDER_NAMES[index];
        RaceData.finals.push(createFinal(bottomName, remaining, 999 - index, true));
        RaceData.finals.push(createFinal("A", [], 1000, false));
    }

    drawFinalsExplanation();
    drawFinals();
    saveToBrowser();
}

function finalByName(name) {
    return RaceData.finals.find(final => final.name === name);
}

function getFinalPilots(final) {
    return final.pilots.map(getPilot).filter(Boolean);
}

function getFinalRule(final) {
    if (final.name === "A1") return { title: "Первый финальный заезд", text: "Все пилоты едут A1. Финишный порядок формирует сетку A2.", advance: "Все → A2" };
    if (final.name === "A2") return { title: "Решающий финал", text: "Результат A2 определяет итог соревнования.", advance: "Итог" };
    if (final.name === "A") return { title: "Главный финал", text: "Шесть пилотов стартуют в порядке результата B.", advance: "Итог" };
    if (final.name === "B") return { title: "Финал B", text: "Все участники B переходят в A в финишном порядке.", advance: "Все → A" };
    const higher = getHigherFinal(final.name);
    return { title: `Отборочный финал ${final.name}`, text: `Два лучших переходят в финал ${higher?.name || "B"}.`, advance: `1–2 → ${higher?.name || "B"}` };
}

function getHigherFinal(name) {
    const finals = [...RaceData.finals].filter(f => !["A", "A1", "A2"].includes(f.name)).sort((a,b) => b.order-a.order);
    const idx = finals.findIndex(f => f.name === name);
    return idx <= 0 ? finalByName("B") : finals[idx - 1];
}

function drawFinalsExplanation() {
    const el = document.getElementById("finalsExplanation");
    if (!el) return;
    const route = [...RaceData.finals].sort((a,b) => a.order-b.order).map(f => f.name).join(" → ");
    el.innerHTML = `<div class="finalsGuide"><h3>Схема Legion RX</h3><p>${escapeHtml(route)}</p><p class="guideNote">Нижние финалы дают шанс подняться выше. B полностью формирует стартовую сетку A.</p></div>`;
}

function buildGridHtml(pilots) {
    let html = `<div class="startDirection">НАПРАВЛЕНИЕ ДВИЖЕНИЯ ↑</div><div class="finalGrid">`;
    let index = 0;
    let group = 2;
    while (index < pilots.length) {
        const row = pilots.slice(index, index + group);
        html += `<div class="finalRow ${group === 1 ? "single" : "pair"}">`;
        row.forEach((pilot, offset) => html += `<div class="finalSlot"><div class="finalPlace">${index + offset + 1}</div><div class="finalPilot">${escapeHtml(pilot.name)}</div></div>`);
        html += `</div>`;
        index += row.length;
        group = group === 2 ? 1 : 2;
    }
    return `${html}</div>`;
}

function finalOptions(count, value = "") {
    let html = `<option value="">—</option>`;
    for (let i = 1; i <= count; i += 1) html += `<option value="${i}" ${String(value) === String(i) ? "selected" : ""}>${i}</option>`;
    ["DNF","DNS","DSQ"].forEach(status => html += `<option value="${status}" ${value === status ? "selected" : ""}>${status}</option>`);
    return html;
}

function bindFinalSelectors() {
    document.querySelectorAll(".finalPlaceSelect").forEach(select => {
        select.addEventListener("change", () => refreshUniquePlaces(`.finalPlaceSelect[data-final="${select.dataset.final}"]`));
    });
    new Set([...document.querySelectorAll(".finalPlaceSelect")].map(s => s.dataset.final)).forEach(name => refreshUniquePlaces(`.finalPlaceSelect[data-final="${name}"]`));
}

function drawFinals() {
    const block = document.getElementById("finalsBlock");
    if (!block) return;
    block.innerHTML = "";

    [...RaceData.finals].sort((a,b) => a.order-b.order).forEach(final => {
        const pilots = getFinalPilots(final);
        const rule = getFinalRule(final);
        let html = `<article class="finalCard ${final.enabled ? "activeFinal" : "lockedFinal"}"><div class="finalTitleRow"><div><h2>Финал ${final.name}</h2><div class="finalSubtitle">${rule.title}</div></div><span class="statusBadge">${final.saved ? "Завершён" : final.enabled ? "Готов" : "Ожидает"}</span></div><div class="finalRuleBox"><strong>${rule.advance}</strong><span>${rule.text}</span></div>${buildGridHtml(pilots)}`;

        if (!final.saved && pilots.length) {
            html += `<div class="finishInputTitle">Введите порядок финиша</div><div class="tableWrap"><table><thead><tr><th>Результат</th><th>Пилот</th></tr></thead><tbody>`;
            pilots.forEach(pilot => html += `<tr><td><select class="finalPlaceSelect" data-final="${final.name}" data-id="${pilot.id}" ${!final.enabled ? "disabled" : ""}>${finalOptions(pilots.length)}</select></td><td>${escapeHtml(pilot.name)}</td></tr>`);
            html += `</tbody></table></div><button class="finalButton" onclick="saveFinal('${final.name}')" ${!final.enabled ? "disabled" : ""}>Сохранить финал ${final.name}</button>`;
        } else if (final.saved) {
            html += `<div class="savedFinalResult"><h3>Результат</h3>`;
            final.result.forEach((item, idx) => html += `<div class="savedResultRow"><span class="resultPosition">${item.status === "FIN" ? idx + 1 : item.status}</span><span class="resultPilot">${escapeHtml(getPilot(item.pilotId).name)}</span></div>`);
            html += `</div>`;
        }
        block.insertAdjacentHTML("beforeend", `${html}</article>`);
    });
    bindFinalSelectors();
}

function parseFinalResults(finalName) {
    const selects = [...document.querySelectorAll(`.finalPlaceSelect[data-final="${finalName}"]`)];
    if (selects.some(s => !s.value)) return null;
    const numeric = selects.filter(s => /^\d+$/.test(s.value));
    if (new Set(numeric.map(s => s.value)).size !== numeric.length) return null;
    return selects.map(s => ({ pilotId: s.dataset.id, status: /^\d+$/.test(s.value) ? "FIN" : s.value, place: /^\d+$/.test(s.value) ? Number(s.value) : null }))
        .sort((a,b) => (a.place ?? 999) - (b.place ?? 999));
}

function saveFinal(finalName) {
    const final = finalByName(finalName);
    if (!final || !final.enabled || final.saved) return;
    const result = parseFinalResults(finalName);
    if (!result) {
        alert("Заполните результаты без повторяющихся мест.");
        return;
    }
    final.result = result;
    final.saved = true;
    result.forEach((item, index) => getPilot(item.pilotId).finalResults.push({ final: finalName, place: item.place, status: item.status, order: index + 1 }));
    advanceFinalists(final);
    drawFinalsExplanation();
    drawFinals();
    saveToBrowser();
}

function advanceFinalists(final) {
    const finishers = final.result.filter(item => item.status === "FIN");

    if (final.name === "A1") {
        const a2 = finalByName("A2");
        a2.pilots = final.result.map(item => item.pilotId);
        a2.enabled = true;
        return;
    }

    if (final.name === "B") {
        const a = finalByName("A");
        a.pilots = final.result.map(item => item.pilotId).slice(0, 6);
        a.enabled = true;
        return;
    }

    if (final.name !== "A" && final.name !== "A2") {
        const higher = getHigherFinal(final.name);
        if (higher) {
            higher.pilots = [...higher.pilots, ...finishers.slice(0, 2).map(item => item.pilotId)];
            higher.enabled = true;
        }
        return;
    }

    buildFinalProtocol(final);
}

function buildFinalProtocol(mainFinal) {
    const protocol = [];
    const added = new Set();

    function addResult(final) {
        final.result.forEach(item => {
            if (!added.has(String(item.pilotId))) {
                protocol.push(getPilot(item.pilotId));
                added.add(String(item.pilotId));
            }
        });
    }

    addResult(mainFinal);
    [...RaceData.finals].filter(f => f.saved && f.name !== mainFinal.name).sort((a,b) => b.order-a.order).forEach(addResult);
    RaceData.pilots.forEach(p => { if (!added.has(String(p.id))) protocol.push(p); });

    RaceData.finalProtocol = protocol.map((pilot, index) => ({ place: index + 1, pilotId: pilot.id, eventPoints: EVENT_POINTS[index] || 0 }));
    RaceData.stage = "finished";
    drawFinalProtocol();
    saveToBrowser();
}

function drawFinalProtocol() {
    const section = document.getElementById("protocolSection");
    const block = document.getElementById("protocolBlock");
    if (!section || !block || !RaceData.finalProtocol.length) return;
    section.classList.remove("hidden");

    let html = `<div class="protocolMeta"><strong>${escapeHtml(RaceData.eventName)}</strong><span>${escapeHtml(RaceData.clubName || "")}</span><span>${escapeHtml(RaceData.eventDate || "")} ${escapeHtml(RaceData.eventLocation || "")}</span></div><div class="podium">`;
    RaceData.finalProtocol.slice(0,3).forEach(item => html += `<div class="podiumPlace place${item.place}"><span>${item.place}</span>${escapeHtml(getPilot(item.pilotId).name)}</div>`);
    html += `</div><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th><th>Очки этапа</th></tr></thead><tbody>`;
    RaceData.finalProtocol.forEach(item => html += `<tr><td>${item.place}</td><td>${escapeHtml(getPilot(item.pilotId).name)}</td><td>${item.eventPoints}</td></tr>`);
    block.innerHTML = `${html}</tbody></table></div>`;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
}
