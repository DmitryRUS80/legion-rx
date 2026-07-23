/* Legion RX Championship Edition v3.0 — hybrid finals */

const FINAL_A_RUNS = ["A1", "A2", "A3"];

function createFinal(name, pilots = [], options = {}) {
    return {
        name,
        label: options.label || name,
        type: options.type || "lcq",
        round: Number(options.round || 0),
        order: Number(options.order || 0),
        pilots: pilots.map(p => p?.id || p),
        basePilots: pilots.map(p => p?.id || p),
        result: [],
        saved: false,
        enabled: Boolean(options.enabled),
        advanceCount: Number(options.advanceCount || 0)
    };
}

function finalByName(name) {
    return (RaceData.finals || []).find(final => final.name === name);
}

function getFinalPilots(final) {
    return (final?.pilots || []).map(getPilot).filter(Boolean);
}

function qualificationRankMap() {
    const map = new Map();
    RaceData.pilots.forEach((pilot, index) => map.set(String(pilot.id), index + 1));
    return map;
}

function splitSnake(pilots, groupCount) {
    const groups = Array.from({ length: groupCount }, () => []);
    if (groupCount <= 1) return [pilots.slice()];
    let index = 0;
    let direction = 1;
    pilots.forEach(pilot => {
        groups[index].push(pilot);
        if (direction > 0) {
            if (index === groupCount - 1) { direction = -1; index -= 1; }
            else index += 1;
        } else {
            if (index === 0) { direction = 1; index += 1; }
            else index -= 1;
        }
    });
    return groups;
}

function addFinalARuns(pilots, enabledFirst = false, startOrder = 1000) {
    FINAL_A_RUNS.forEach((name, index) => {
        RaceData.finals.push(createFinal(name, pilots, {
            type: "main",
            label: `Финал ${name}`,
            order: startOrder + index,
            enabled: enabledFirst && index === 0
        }));
    });
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
    RaceData.pilots.forEach(pilot => { pilot.finalResults = []; });
    const pilots = [...RaceData.pilots];
    const count = pilots.length;

    if (count <= 6) {
        addFinalARuns(pilots, true);
    } else {
        const direct = pilots.slice(0, 4);
        const remaining = pilots.slice(4);

        if (count <= 10) {
            RaceData.finals.push(createFinal("LCQ", remaining, {
                type: "single-lcq", label: "Заезд последнего шанса (LCQ)",
                order: 100, enabled: true, advanceCount: 2
            }));
        } else if (count <= 16) {
            const groups = splitSnake(remaining, 2);
            RaceData.finals.push(createFinal("LCQ-B", groups[0], {
                type: "dual-lcq", label: "LCQ B", round: 1,
                order: 100, enabled: true, advanceCount: 1
            }));
            RaceData.finals.push(createFinal("LCQ-C", groups[1], {
                type: "dual-lcq", label: "LCQ C", round: 1,
                order: 101, enabled: true, advanceCount: 1
            }));
        } else {
            createPreliminaryRound(remaining, 1, 100);
        }
        addFinalARuns([], false);
    }

    RaceData.stage = "finals";
    drawFinalsExplanation();
    drawFinals();
    saveToBrowser();
}

function createPreliminaryRound(pilotIdsOrObjects, round, startOrder) {
    const groupCount = Math.ceil(pilotIdsOrObjects.length / 6);
    const groups = splitSnake(pilotIdsOrObjects, groupCount);
    groups.forEach((group, index) => {
        RaceData.finals.push(createFinal(`P${round}-${index + 1}`, group, {
            type: "prelim", label: `Предварительный LCQ ${round}.${index + 1}`,
            round, order: startOrder + index, enabled: true, advanceCount: 1
        }));
    });
}

function getFinalRule(final) {
    if (final.type === "main") {
        return {
            title: "Главный финальный заезд",
            advance: `${final.name} · 7 кругов`,
            text: "Стартовая решётка во всех трёх заездах одинакова. В итог идут два лучших результата из трёх."
        };
    }
    if (final.type === "single-lcq") {
        return {
            title: "Один заезд последнего шанса",
            advance: "2 лучших → Финал A",
            text: "Старт по квалификации. Победитель LCQ получает позицию 5 Финала A, второе место — позицию 6."
        };
    }
    if (final.type === "dual-lcq") {
        return {
            title: "Параллельный заезд последнего шанса",
            advance: "Победитель → Финал A",
            text: "Победители LCQ B и C занимают позиции 5–6 Финала A. Выше стартует пилот с лучшим местом в квалификации."
        };
    }
    if (final.type === "final-lcq") {
        return {
            title: "Заключительный заезд последнего шанса",
            advance: "2 лучших → Финал A",
            text: "Победитель получает позицию 5 Финала A, второе место — позицию 6. Результат этого заезда не переставляется по квалификации."
        };
    }
    return {
        title: "Предварительный отбор",
        advance: "Победитель проходит выше",
        text: "Старт по квалификации. Победители предварительных групп переходят в следующий LCQ-уровень."
    };
}

function drawFinalsExplanation() {
    const element = document.getElementById("finalsExplanation");
    if (!element) return;
    const count = RaceData.pilots.length;
    let route;
    if (count <= 6) route = "Все пилоты → A1 + A2 + A3 → два лучших результата";
    else if (count <= 10) route = "TOP 4 квалификации + 2 лучших LCQ → Финал A";
    else if (count <= 16) route = "TOP 4 квалификации + победители LCQ B/C → Финал A";
    else route = "TOP 4 квалификации + предварительные LCQ → заключительный LCQ → 2 лучших → Финал A";
    element.innerHTML = `<div class="finalsGuide"><h3>Гибридная финальная система Legion RX</h3><p>${route}</p><p class="guideNote">Финал A состоит из трёх заездов: A1, A2 и A3. Побеждает пилот с наименьшей суммой двух лучших результатов.</p></div>`;
}

function buildGridHtml(pilots) {
    if (!pilots.length) return `<div class="emptyGrid">Состав появится после завершения отборочных заездов.</div>`;
    let html = `<div class="startDirection">НАПРАВЛЕНИЕ ДВИЖЕНИЯ ↑</div><div class="finalGrid startGrid">`;
    pilots.forEach((pilot, index) => {
        html += `<div class="startGridEntry"><div class="startBracket" aria-hidden="true"></div><div class="startGridPhoto ${index === 0 ? "pole" : ""}">${pilotPhotoMarkup(pilot.photo, pilot.name)}<span class="startGridPosition">${index + 1}</span></div><div class="startGridName">${escapeHtml(pilot.name)}</div></div>`;
    });
    return `${html}</div>`;
}

function finalOptions(count, value = "") {
    let html = `<option value="">—</option>`;
    for (let place = 1; place <= count; place += 1) html += `<option value="${place}" ${String(value) === String(place) ? "selected" : ""}>${place}</option>`;
    ["DNF", "DNS", "DSQ"].forEach(status => html += `<option value="${status}" ${value === status ? "selected" : ""}>${status}</option>`);
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
    selectors.forEach(select => [...select.options].forEach(option => {
        if (option.value) option.disabled = chosen.has(option.value) && chosen.get(option.value) !== select;
    }));
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
    document.querySelectorAll(".finalDnfOrder").forEach(select => select.addEventListener("change", () => refreshFinalDnfOrders(select.dataset.final)));
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
    [...RaceData.finals].sort((a, b) => a.order - b.order).forEach(final => {
        const pilots = getFinalPilots(final);
        const rule = getFinalRule(final);
        let html = `<article class="finalCard ${final.enabled ? "activeFinal" : "lockedFinal"}"><div class="finalTitleRow"><div><h2>${escapeHtml(final.label || final.name)}</h2><div class="finalSubtitle">${rule.title}</div></div><span class="statusBadge">${final.saved ? "Завершён" : final.enabled ? "Готов" : "Ожидает"}</span></div><div class="finalRuleBox"><strong>${rule.advance}</strong><span>${rule.text}</span></div>${buildGridHtml(pilots)}`;
        if (!final.saved && pilots.length) {
            html += `<div class="finishInputTitle">Введите порядок финиша</div><div class="finalPilotList">`;
            pilots.forEach((pilot, pilotIndex) => {
                html += `<div class="finalPilotRow"><div class="finalPilotLeft">${pilotFinalRowMarkup(pilot, pilotIndex)}</div><div class="finalResultSide"><label class="qualifyingResultLabel" for="f${final.name}p${pilot.id}">Место</label><div class="resultControl"><select id="f${final.name}p${pilot.id}" class="finalPlaceSelect" data-final="${final.name}" data-id="${pilot.id}" ${!final.enabled ? "disabled" : ""}>${finalOptions(pilots.length)}</select><select class="finalDnfOrder hidden" data-final="${final.name}" data-id="${pilot.id}" disabled>${finalDnfOrderOptions(pilots.length)}</select></div></div></div>`;
            });
            html += `</div><button class="finalButton" onclick="saveFinal('${final.name}')" ${!final.enabled ? "disabled" : ""}>Сохранить ${escapeHtml(final.label || final.name)}</button>`;
        } else if (final.saved) {
            html += `<div class="savedFinalResult"><h3>Результат</h3>`;
            final.result.forEach((item, index) => { const pilot = getPilot(item.pilotId); html += `<div class="savedResultRow">${pilotFinalRowMarkup(pilot)}<span class="resultPosition">${formatFinalResultPosition(item, index)}</span></div>`; });
            html += `<button class="secondaryButton editResultButton" onclick="editFinal('${final.name}')">Исправить результат</button></div>`;
        }
        block.insertAdjacentHTML("beforeend", `${html}</article>`);
    });
    bindFinalSelectors();
    drawFinalsStandings();
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
    return { result: selects.map(select => {
        const numericPlace = /^\d+$/.test(select.value);
        const dnfOrder = select.value === "DNF" ? Number(document.querySelector(`.finalDnfOrder[data-final="${finalName}"][data-id="${select.dataset.id}"]`)?.value) : null;
        return { pilotId: select.dataset.id, status: numericPlace ? "FIN" : select.value, place: numericPlace ? Number(select.value) : null, dnfOrder };
    }).sort(compareFinalResultItems) };
}

function compareFinalResultItems(a, b) {
    const statusRank = { FIN: 0, DNF: 1, DNS: 2, DSQ: 3 };
    if (statusRank[a.status] !== statusRank[b.status]) return statusRank[a.status] - statusRank[b.status];
    if (a.status === "FIN") return (a.place || 999) - (b.place || 999);
    if (a.status === "DNF") return (a.dnfOrder || 999) - (b.dnfOrder || 999);
    return 0;
}

function classifiedForAdvancement(result) {
    return result.filter(item => item.status === "FIN" || item.status === "DNF");
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

function setMainGrid(lastTwo) {
    const qTop4 = RaceData.pilots.slice(0, 4).map(p => p.id);
    const grid = [...qTop4, ...lastTwo].slice(0, 6);
    FINAL_A_RUNS.forEach((name, index) => {
        const final = finalByName(name);
        if (!final) return;
        final.pilots = [...grid];
        final.basePilots = [...grid];
        final.enabled = index === 0;
    });
}

function advanceFinalists(final) {
    if (final.type === "single-lcq") {
        setMainGrid(classifiedForAdvancement(final.result).slice(0, 2).map(item => item.pilotId));
        return;
    }
    if (final.type === "dual-lcq") {
        const pair = RaceData.finals.filter(item => item.type === "dual-lcq");
        if (pair.every(item => item.saved)) {
            const qRank = qualificationRankMap();
            const winners = pair.map(item => classifiedForAdvancement(item.result)[0]?.pilotId).filter(Boolean)
                .sort((a, b) => (qRank.get(String(a)) || 9999) - (qRank.get(String(b)) || 9999));
            setMainGrid(winners);
        }
        return;
    }
    if (final.type === "prelim") {
        processPreliminaryRound(final.round);
        return;
    }
    if (final.type === "final-lcq") {
        setMainGrid(classifiedForAdvancement(final.result).slice(0, 2).map(item => item.pilotId));
        return;
    }
    if (final.type === "main") {
        const runIndex = FINAL_A_RUNS.indexOf(final.name);
        if (runIndex < 2) {
            const next = finalByName(FINAL_A_RUNS[runIndex + 1]);
            if (next) next.enabled = true;
        } else {
            buildFinalProtocol();
        }
    }
}

function processPreliminaryRound(round) {
    const roundFinals = RaceData.finals.filter(item => item.type === "prelim" && item.round === round);
    if (!roundFinals.length || !roundFinals.every(item => item.saved)) return;
    const winners = roundFinals.map(item => classifiedForAdvancement(item.result)[0]?.pilotId).filter(Boolean);
    if (winners.length <= 6) {
        const existing = finalByName(`LCQ-F${round}`);
        if (!existing) RaceData.finals.push(createFinal(`LCQ-F${round}`, winners, {
            type: "final-lcq", label: "Заключительный LCQ", round: round + 1,
            order: 500 + round, enabled: true, advanceCount: 2
        }));
    } else {
        const nextRound = round + 1;
        if (!RaceData.finals.some(item => item.type === "prelim" && item.round === nextRound)) {
            createPreliminaryRound(winners, nextRound, 100 + nextRound * 50);
        }
    }
}

function editFinal(finalName) {
    const final = finalByName(finalName);
    if (!final?.saved) return;
    if (!confirm("Исправление результата сбросит этот и все последующие финалы. Продолжить?")) return;
    const resetOrder = final.order;
    RaceData.pilots.forEach(pilot => {
        pilot.finalResults = pilot.finalResults.filter(result => {
            const linked = finalByName(result.final);
            return linked && linked.order < resetOrder;
        });
    });
    RaceData.finalProtocol = [];
    RaceData.stage = "finals";
    RaceData.finals = RaceData.finals.filter(item => item.order <= resetOrder || item.type === "main");
    RaceData.finals.forEach(item => {
        if (item.order >= resetOrder) {
            item.result = [];
            item.saved = false;
            item.enabled = item.name === finalName;
            if (item.type === "main" && item.name !== finalName) item.enabled = false;
        }
    });
    saveToBrowser();
    drawFinalsExplanation();
    drawFinals();
}

function mainRunScore(item) {
    return item?.status === "FIN" ? Number(item.place || 7) : 7;
}

function buildMainStandings() {
    const qRank = qualificationRankMap();
    const mainFinals = FINAL_A_RUNS.map(finalByName).filter(Boolean);
    const pilotIds = mainFinals[0]?.pilots || [];
    return pilotIds.map(pilotId => {
        // A run that has not been completed yet is shown as “—”, not as a DNS penalty.
        const results = mainFinals.map(final => final.saved
            ? (final.result.find(item => String(item.pilotId) === String(pilotId)) || { status: "DNS" })
            : null);
        const scores = results.map(item => item ? mainRunScore(item) : null);
        const completedScores = scores.filter(Number.isFinite);
        const bestTwo = [...completedScores].sort((a, b) => a - b).slice(0, 2);
        const latestCompleted = [...scores].reverse().find(Number.isFinite);
        return {
            pilotId,
            results,
            scores,
            bestTwo,
            total: bestTwo.length ? bestTwo.reduce((sum, value) => sum + value, 0) : null,
            wins: results.filter(item => item?.status === "FIN" && item.place === 1).length,
            seconds: results.filter(item => item?.status === "FIN" && item.place === 2).length,
            lastScore: latestCompleted ?? 9999,
            qRank: qRank.get(String(pilotId)) || 9999
        };
    }).sort((a, b) => {
        if (a.total === null && b.total !== null) return 1;
        if (a.total !== null && b.total === null) return -1;
        if (a.total !== b.total) return (a.total ?? 9999) - (b.total ?? 9999);
        return b.wins - a.wins || b.seconds - a.seconds || a.lastScore - b.lastScore || a.qRank - b.qRank;
    });
}

function formatMainStandingScore(result, score) {
    if (!result || score === null) return "—";
    if (result.status === "FIN") return String(score);
    return `${score} · ${escapeHtml(result.status)}`;
}

function drawFinalsStandings() {
    const block = document.getElementById("finalsStandings");
    if (!block) return;
    const mainFinals = FINAL_A_RUNS.map(finalByName).filter(Boolean);
    const standings = buildMainStandings();
    if (!mainFinals.length || !standings.length || !mainFinals[0]?.pilots?.length) {
        block.innerHTML = "Состав Финала A появится после завершения отбора.";
        return;
    }
    let html = `<div class="tableWrap"><table class="finalsRankingTable"><thead><tr><th>Место</th><th>Пилот</th><th>A1</th><th>A2</th><th>A3</th><th>Лучшие 2</th></tr></thead><tbody>`;
    standings.forEach((row, index) => {
        const counted = new Set();
        row.scores.forEach((score, scoreIndex) => {
            if (!Number.isFinite(score)) return;
            const candidates = row.scores.map((value, i) => ({ value, i })).filter(item => Number.isFinite(item.value)).sort((a, b) => a.value - b.value || a.i - b.i).slice(0, 2);
            if (candidates.some(item => item.i === scoreIndex)) counted.add(scoreIndex);
        });
        html += `<tr><td>${index + 1}</td><td>${pilotTableMarkup(getPilot(row.pilotId))}</td>`;
        row.scores.forEach((score, scoreIndex) => {
            html += `<td class="${counted.has(scoreIndex) ? "bestScoreCell" : ""}">${formatMainStandingScore(row.results[scoreIndex], score)}</td>`;
        });
        html += `<td class="bestTotal"><b>${row.total ?? "—"}</b></td></tr>`;
    });
    html += `</tbody></table></div><p class="finalsRankingNote">В зачёт идут два лучших результата из A1, A2 и A3. DNF, DNS и DSQ дают 7 очков.</p>`;
    block.innerHTML = html;
}

function buildFinalProtocol() {
    const mainStandings = buildMainStandings();
    const added = new Set(mainStandings.map(item => String(item.pilotId)));
    const eliminated = [];
    const qRank = qualificationRankMap();
    const stageGroups = new Map();
    [...RaceData.finals].filter(final => final.saved && final.type !== "main").forEach(final => {
        const stageKey = final.type === "dual-lcq" ? "dual-lcq" : final.type === "prelim" ? `prelim-${final.round}` : `${final.type}-${final.order}`;
        if (!stageGroups.has(stageKey)) stageGroups.set(stageKey, { order: final.order, finals: [] });
        stageGroups.get(stageKey).order = Math.max(stageGroups.get(stageKey).order, final.order);
        stageGroups.get(stageKey).finals.push(final);
    });
    [...stageGroups.values()].sort((a, b) => b.order - a.order).forEach(group => {
        const candidates = [];
        group.finals.forEach(final => [...final.result].sort(compareFinalResultItems).forEach((item, index) => {
            candidates.push({ ...item, resultOrder: index + 1, source: final.label || final.name });
        }));
        candidates.sort((a, b) => a.resultOrder - b.resultOrder || (qRank.get(String(a.pilotId)) || 9999) - (qRank.get(String(b.pilotId)) || 9999));
        candidates.forEach(item => {
            if (!added.has(String(item.pilotId))) {
                eliminated.push({ pilotId: item.pilotId, status: item.status, source: item.source });
                added.add(String(item.pilotId));
            }
        });
    });
    RaceData.pilots.forEach(pilot => {
        if (!added.has(String(pilot.id))) eliminated.push({ pilotId: pilot.id, status: "NC", source: "Квалификация" });
    });
    const rows = [
        ...mainStandings.map(item => ({ pilotId: item.pilotId, status: "FIN", source: `Финал A · ${item.total} очк.` })),
        ...eliminated
    ];
    RaceData.finalProtocol = rows.map((item, index) => ({
        place: index + 1,
        pilotId: item.pilotId,
        status: item.status,
        source: item.source,
        eventPoints: ["DNS", "DSQ"].includes(item.status) ? 0 : (EVENT_POINTS[index] || 0)
    }));
    RaceData.stage = "finished";
    drawFinalProtocol();
    if (typeof syncCurrentRaceToChampionship === "function") syncCurrentRaceToChampionship();
    saveToBrowser();
}

function drawFinalProtocol() {
    const section = document.getElementById("protocolSection");
    const block = document.getElementById("protocolBlock");
    if (!section || !block || !RaceData.finalProtocol.length) return;
    section.classList.remove("hidden");
    const completeButton = document.getElementById("completeRace");
    if (completeButton) {
        const completed = RaceData.lifecycleStatus === "completed";
        completeButton.classList.toggle("hidden", completed);
        completeButton.disabled = completed;
    }
    const standings = [...RaceData.pilots].sort(comparePilots);
    const mainStandings = buildMainStandings();
    let html = `<div class="protocolMeta"><strong>${escapeHtml(RaceData.eventName)}</strong><span>${escapeHtml(RaceData.clubName || "")}</span><span>${escapeHtml(RaceData.eventDate || "")} ${escapeHtml(RaceData.eventLocation || "")}</span></div><div class="podium">`;
    RaceData.finalProtocol.slice(0, 3).forEach(item => { const pilot=getPilot(item.pilotId); html += `<div class="podiumPlace place${item.place}"><span>${item.place}</span><div class="podiumPhoto">${pilotPhotoMarkup(pilot?.photo || "", pilot?.name || "Пилот")}</div><b>${escapeHtml(pilot?.name || "—")}</b></div>`; });
    html += `</div><h3>Итоговая классификация</h3><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th><th>Источник</th><th>Очки этапа</th></tr></thead><tbody>`;
    RaceData.finalProtocol.forEach(item => html += `<tr><td>${item.place}</td><td>${pilotTableMarkup(getPilot(item.pilotId))}</td><td>${escapeHtml(item.source)}${item.status !== "FIN" ? ` · ${escapeHtml(item.status)}` : ""}</td><td>${item.eventPoints}</td></tr>`);
    html += `</tbody></table></div><h3>Зачёт Финала A</h3><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th><th>A1</th><th>A2</th><th>A3</th><th>Лучшие 2</th></tr></thead><tbody>`;
    mainStandings.forEach((row, index) => html += `<tr><td>${index + 1}</td><td>${pilotTableMarkup(getPilot(row.pilotId))}</td><td>${formatMainStandingScore(row.results[0], row.scores[0])}</td><td>${formatMainStandingScore(row.results[1], row.scores[1])}</td><td>${formatMainStandingScore(row.results[2], row.scores[2])}</td><td><b>${row.total ?? "—"}</b></td></tr>`);
    html += `</tbody></table></div><h3>Квалификационный рейтинг</h3><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th><th>Best 3</th><th>Результаты серий</th></tr></thead><tbody>`;
    standings.forEach((p, i) => html += `<tr><td>${i + 1}</td><td>${pilotTableMarkup(p)}</td><td>${p.best3 || 0}</td><td>${(p.qualifying || []).map(q => q.status && q.status !== "FIN" ? q.status : (q.points ?? "—")).join(" · ")}</td></tr>`);
    html += `</tbody></table></div>`;
    block.innerHTML = html;
    section.scrollIntoView({ behavior: "smooth", block: "start" });
}
