/* Legion RallyCross Manager v2.3 */

const FINAL_LEVELS = { A: 100, A2: 100, A1: 90, B: 90, C: 80, D: 70, E: 60, F: 50 };
const LOWER_FINAL_NAMES = ["C", "D", "E", "F"];

function createFinal(name, pilots, enabled = false, basePilots = pilots) {
    return {
        name,
        order: FINAL_LEVELS[name] || 0,
        pilots: pilots.map(pilot => pilot.id || pilot),
        basePilots: basePilots.map(pilot => pilot.id || pilot),
        result: [],
        saved: false,
        enabled
    };
}

function generateFinals() {
    updateStandings();
    if (hasUnresolvedExactTies()) {
        document.getElementById("finalsSection")?.classList.remove("hidden");
        drawStandings();
        alert("Сначала проведите жеребьёвку для абсолютного равенства в квалификации.");
        return;
    }

    RaceData.finals = [];
    RaceData.finalProtocol = [];
    const pilots = [...RaceData.pilots];

    if (pilots.length <= 6) {
        RaceData.finals.push(createFinal("A1", pilots, true));
        RaceData.finals.push(createFinal("A2", [], false, []));
    } else {
        RaceData.finals.push(createFinal("B", pilots.slice(0, 4), false));
        let remaining = pilots.slice(4);
        let lowerIndex = 0;

        while (remaining.length > 6) {
            const name = LOWER_FINAL_NAMES[lowerIndex];
            RaceData.finals.push(createFinal(name, remaining.slice(0, 4), false));
            remaining = remaining.slice(4);
            lowerIndex += 1;
        }

        const bottomName = LOWER_FINAL_NAMES[lowerIndex];
        RaceData.finals.push(createFinal(bottomName, remaining, true));
        RaceData.finals.push(createFinal("A", [], false, []));
    }

    RaceData.stage = "finals";
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

function getHigherFinal(name) {
    if (name === "B") return finalByName("A");
    const alphabet = ["B", "C", "D", "E", "F"];
    const index = alphabet.indexOf(name);
    return index > 0 ? finalByName(alphabet[index - 1]) : null;
}

function getFinalRule(final) {
    if (final.name === "A1") return { title: "Первый финальный заезд", text: "Все пилоты едут A1. Финишировавшие и DNF формируют сетку A2; DNS ставится в конец, DSQ исключается.", advance: "Классифицированные → A2" };
    if (final.name === "A2") return { title: "Решающий финал", text: "Результат A2 полностью определяет итог соревнования.", advance: "Итог" };
    if (final.name === "A") return { title: "Главный финал", text: "Главный финал определяет итоговые места и очки этапа.", advance: "Итог" };
    if (final.name === "B") return { title: "Предфинал B", text: "Все классифицированные пилоты B переходят в A в финишном порядке. DNS и DSQ не переходят.", advance: "Классифицированные → A" };
    const higher = getHigherFinal(final.name);
    return { title: `Отборочный финал ${final.name}`, text: `Два лучших классифицированных пилота переходят в ${higher?.name || "B"}. Сначала финишировавшие, затем DNF по порядку схода.`, advance: `Лучшие 2 → ${higher?.name || "B"}` };
}

function drawFinalsExplanation() {
    const element = document.getElementById("finalsExplanation");
    if (!element) return;
    const route = [...RaceData.finals].sort((a,b) => a.order-b.order).map(final => final.name).join(" → ");
    element.innerHTML = `<div class="finalsGuide"><h3>Схема Legion RX</h3><p>${escapeHtml(route)}</p><p class="guideNote">Нижние финалы пропускают двух лучших вверх. B является предфиналом: его классифицированный порядок формирует решётку A.</p></div>`;
}

function buildGridHtml(pilots) {
    if (!pilots.length) return `<div class="emptyGrid">Состав появится после предыдущего финала.</div>`;
    let html = `<div class="startDirection">НАПРАВЛЕНИЕ ДВИЖЕНИЯ ↑</div><div class="finalGrid">`;
    let index = 0;
    let group = 2;
    while (index < pilots.length) {
        const row = pilots.slice(index, index + group);
        html += `<div class="finalRow ${group === 1 ? "single" : "pair"}">`;
        row.forEach((pilot, offset) => {
            html += `<div class="finalSlot"><div class="finalPlace">${index + offset + 1}</div><div class="finalPilot">${escapeHtml(pilot.name)}</div></div>`;
        });
        html += `</div>`;
        index += row.length;
        group = group === 2 ? 1 : 2;
    }
    return `${html}</div>`;
}

function finalOptions(count, value = "") {
    let html = `<option value="">—</option>`;
    for (let place = 1; place <= count; place += 1) html += `<option value="${place}" ${String(value) === String(place) ? "selected" : ""}>${place}</option>`;
    ["DNF","DNS","DSQ"].forEach(status => html += `<option value="${status}" ${value === status ? "selected" : ""}>${status}</option>`);
    return html;
}

function finalDnfOrderOptions(count, value = "") {
    let html = `<option value="">Порядок схода</option>`;
    for (let order = 1; order <= count; order += 1) html += `<option value="${order}" ${String(value) === String(order) ? "selected" : ""}>DNF-${order}</option>`;
    return html;
}

function refreshFinalDnfOrders(finalName) {
    const selectors = [...document.querySelectorAll(`.finalDnfOrder[data-final="${finalName}"]`)].filter(select => !select.classList.contains("hidden"));
    const chosen = new Map();
    selectors.forEach(select => { if (select.value) chosen.set(select.value, select); });
    selectors.forEach(select => {
        [...select.options].forEach(option => {
            if (!option.value) return;
            option.disabled = chosen.has(option.value) && chosen.get(option.value) !== select;
        });
    });
}

function toggleFinalDnfOrder(select) {
    const orderSelect = document.querySelector(`.finalDnfOrder[data-final="${select.dataset.final}"][data-id="${select.dataset.id}"]`);
    if (!orderSelect) return;
    const isDnf = select.value === "DNF";
    orderSelect.classList.toggle("hidden", !isDnf);
    orderSelect.disabled = select.disabled || !isDnf;
    if (!isDnf) orderSelect.value = "";
    refreshFinalDnfOrders(select.dataset.final);
}

function bindFinalSelectors() {
    document.querySelectorAll(".finalPlaceSelect").forEach(select => {
        select.addEventListener("change", () => {
            refreshUniquePlaces(`.finalPlaceSelect[data-final="${select.dataset.final}"]`);
            toggleFinalDnfOrder(select);
        });
        toggleFinalDnfOrder(select);
    });
    document.querySelectorAll(".finalDnfOrder").forEach(select => {
        select.addEventListener("change", () => refreshFinalDnfOrders(select.dataset.final));
    });
    new Set([...document.querySelectorAll(".finalPlaceSelect")].map(select => select.dataset.final)).forEach(name => {
        refreshUniquePlaces(`.finalPlaceSelect[data-final="${name}"]`);
        refreshFinalDnfOrders(name);
    });
}

function formatFinalResultPosition(item, index) {
    if (item.status === "FIN") return String(item.place || index + 1);
    if (item.status === "DNF") return `DNF${item.dnfOrder ? `-${item.dnfOrder}` : ""}`;
    return item.status;
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
            pilots.forEach(pilot => {
                html += `<tr><td><div class="resultControl"><select class="finalPlaceSelect" data-final="${final.name}" data-id="${pilot.id}" ${!final.enabled ? "disabled" : ""}>${finalOptions(pilots.length)}</select><select class="finalDnfOrder hidden" data-final="${final.name}" data-id="${pilot.id}" disabled>${finalDnfOrderOptions(pilots.length)}</select></div></td><td>${escapeHtml(pilot.name)}</td></tr>`;
            });
            html += `</tbody></table></div><button class="finalButton" onclick="saveFinal('${final.name}')" ${!final.enabled ? "disabled" : ""}>Сохранить финал ${final.name}</button>`;
        } else if (final.saved) {
            html += `<div class="savedFinalResult"><h3>Результат</h3>`;
            final.result.forEach((item, index) => {
                const pilot = getPilot(item.pilotId);
                html += `<div class="savedResultRow"><span class="resultPosition">${formatFinalResultPosition(item,index)}</span><span class="resultPilot">${escapeHtml(pilot?.name || "Удалённый пилот")}</span></div>`;
            });
            html += `<button class="secondaryButton editResultButton" onclick="editFinal('${final.name}')">Исправить результат</button></div>`;
        }
        block.insertAdjacentHTML("beforeend", `${html}</article>`);
    });
    bindFinalSelectors();
}

function parseFinalResults(finalName) {
    const selects = [...document.querySelectorAll(`.finalPlaceSelect[data-final="${finalName}"]`)];
    if (!selects.length || selects.some(select => !select.value)) return { error: "Укажите результат каждого пилота." };

    const numeric = selects.filter(select => /^\d+$/.test(select.value));
    if (new Set(numeric.map(select => select.value)).size !== numeric.length) return { error: "Финишные места не должны повторяться." };

    const dnfSelects = selects.filter(select => select.value === "DNF");
    const dnfOrders = dnfSelects.map(select => document.querySelector(`.finalDnfOrder[data-final="${finalName}"][data-id="${select.dataset.id}"]`)?.value || "");
    if (dnfOrders.some(value => !value)) return { error: "Для каждого DNF укажите порядок схода." };
    if (new Set(dnfOrders).size !== dnfOrders.length) return { error: "Порядок DNF не должен повторяться." };

    const result = selects.map(select => {
        const numericPlace = /^\d+$/.test(select.value);
        const dnfOrder = select.value === "DNF" ? Number(document.querySelector(`.finalDnfOrder[data-final="${finalName}"][data-id="${select.dataset.id}"]`)?.value) : null;
        return {
            pilotId: select.dataset.id,
            status: numericPlace ? "FIN" : select.value,
            place: numericPlace ? Number(select.value) : null,
            dnfOrder
        };
    }).sort(compareFinalResultItems);

    return { result };
}

function compareFinalResultItems(a, b) {
    const statusRank = { FIN: 0, DNF: 1, DNS: 2, DSQ: 3 };
    if (statusRank[a.status] !== statusRank[b.status]) return statusRank[a.status] - statusRank[b.status];
    if (a.status === "FIN") return (a.place || 999) - (b.place || 999);
    if (a.status === "DNF") return (a.dnfOrder || 999) - (b.dnfOrder || 999);
    return 0;
}

function classifiedForAdvancement(result, includeDns = false) {
    return result.filter(item => item.status === "FIN" || item.status === "DNF" || (includeDns && item.status === "DNS"));
}

function saveFinal(finalName) {
    const final = finalByName(finalName);
    if (!final || !final.enabled || final.saved) return;
    const parsed = parseFinalResults(finalName);
    if (parsed.error) return alert(parsed.error);

    final.result = parsed.result;
    final.saved = true;
    final.result.forEach((item, index) => {
        const pilot = getPilot(item.pilotId);
        if (pilot) pilot.finalResults.push({ final: finalName, place: item.place, status: item.status, dnfOrder: item.dnfOrder, order: index + 1 });
    });

    advanceFinalists(final);
    drawFinalsExplanation();
    drawFinals();
    saveToBrowser();
}

function advanceFinalists(final) {
    if (final.name === "A1") {
        const a2 = finalByName("A2");
        a2.pilots = classifiedForAdvancement(final.result, true).map(item => item.pilotId).slice(0, 6);
        a2.enabled = a2.pilots.length > 0;
        if (!a2.enabled) buildFinalProtocol(final);
        return;
    }

    if (final.name === "B") {
        const a = finalByName("A");
        a.pilots = classifiedForAdvancement(final.result, false).map(item => item.pilotId).slice(0, 6);
        a.enabled = a.pilots.length > 0;
        if (!a.enabled) buildFinalProtocol(final);
        return;
    }

    if (final.name !== "A" && final.name !== "A2") {
        const higher = getHigherFinal(final.name);
        if (higher) {
            const advancing = classifiedForAdvancement(final.result, false).slice(0, 2).map(item => item.pilotId);
            higher.pilots = [...new Set([...higher.basePilots, ...advancing])].slice(0, 6);
            higher.enabled = true;
        }
        return;
    }

    buildFinalProtocol(final);
}

function editFinal(finalName) {
    const final = finalByName(finalName);
    if (!final?.saved) return;
    if (!confirm("Исправление результата сбросит этот и все последующие финалы. Продолжить?")) return;

    const editedOrder = final.order;
    RaceData.pilots.forEach(pilot => {
        pilot.finalResults = pilot.finalResults.filter(result => {
            const resultFinal = finalByName(result.final);
            return resultFinal && resultFinal.order < editedOrder;
        });
    });

    RaceData.finalProtocol = [];
    RaceData.stage = "finals";

    RaceData.finals.forEach(item => {
        if (item.order >= editedOrder) {
            item.result = [];
            item.saved = false;
            if (item.name === finalName) {
                item.enabled = true;
            } else {
                item.pilots = [...item.basePilots];
                item.enabled = false;
            }
        }
    });

    saveToBrowser();
    drawFinalsExplanation();
    drawFinals();
}

function buildFinalProtocol(mainFinal) {
    const classified = [];
    const dns = [];
    const dsq = [];
    const added = new Set();

    function collect(final) {
        [...final.result].sort(compareFinalResultItems).forEach(item => {
            if (added.has(String(item.pilotId))) return;
            const record = { pilot: getPilot(item.pilotId), source: final.name, status: item.status };
            if (item.status === "DSQ") dsq.push(record);
            else if (item.status === "DNS") dns.push(record);
            else classified.push(record);
            added.add(String(item.pilotId));
        });
    }

    collect(mainFinal);
    [...RaceData.finals]
        .filter(final => final.saved && final.name !== mainFinal.name)
        .sort((a,b) => b.order-a.order)
        .forEach(collect);

    [...RaceData.pilots].sort(comparePilots).forEach(pilot => {
        if (!added.has(String(pilot.id))) {
            classified.push({ pilot, source: "Q", status: "NC" });
            added.add(String(pilot.id));
        }
    });

    const protocol = [...classified, ...dns, ...dsq];
    RaceData.finalProtocol = protocol.map((item, index) => ({
        place: index + 1,
        pilotId: item.pilot.id,
        status: item.status,
        source: item.source,
        eventPoints: ["DNS", "DSQ"].includes(item.status) ? 0 : (EVENT_POINTS[index] || 0)
    }));
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
    RaceData.finalProtocol.slice(0,3).forEach(item => html += `<div class="podiumPlace place${item.place}"><span>${item.place}</span>${escapeHtml(getPilot(item.pilotId)?.name || "—")}</div>`);
    html += `</div><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th><th>Источник</th><th>Очки этапа</th></tr></thead><tbody>`;
    RaceData.finalProtocol.forEach(item => {
        html += `<tr><td>${item.place}</td><td>${escapeHtml(getPilot(item.pilotId)?.name || "—")}</td><td>${escapeHtml(item.source)}${item.status !== "FIN" ? ` · ${escapeHtml(item.status)}` : ""}</td><td>${item.eventPoints}</td></tr>`;
    });
    block.innerHTML = `${html}</tbody></table></div>`;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
}
