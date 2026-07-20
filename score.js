/* Legion RX Championship Edition v3.0 */

const SCORE_TABLE = [50,45,42,40,39,38,37,36,35,34,33,32,31,30,29,28];

function getPoints(place) {
    if (!Number.isInteger(place) || place < 1) return 0;
    return SCORE_TABLE[place - 1] ?? Math.max(1, 29 - place);
}

function savePilotResult(pilot, qualifying, heat, resultValue, dnfOrder = null) {
    const existing = pilot.qualifying.find(result => result.round === qualifying);
    const isPlace = Number.isInteger(resultValue);
    const record = {
        round: qualifying,
        heat,
        place: isPlace ? resultValue : null,
        status: isPlace ? "FIN" : resultValue,
        dnfOrder: resultValue === "DNF" && Number.isInteger(dnfOrder) ? dnfOrder : null,
        points: isPlace ? getPoints(resultValue) : 0
    };

    if (existing) Object.assign(existing, record);
    else pilot.qualifying.push(record);
}

function qualifyingResultRank(result) {
    if (!result) return 10000;
    if (result.status === "FIN") return result.place;
    if (result.status === "DNF") return 100 + (result.dnfOrder || 99);
    if (result.status === "DNS") return 300;
    if (result.status === "DSQ") return 400;
    return 500;
}

function getBest3Results(pilot) {
    return [...pilot.qualifying]
        .sort((a,b) => {
            if (b.points !== a.points) return b.points - a.points;
            const rankDiff = qualifyingResultRank(a) - qualifyingResultRank(b);
            if (rankDiff !== 0) return rankDiff;
            return b.round - a.round;
        })
        .slice(0, 3);
}

function getDiscardedResults(pilot) {
    const selected = new Set(getBest3Results(pilot).map(item => `${item.round}:${item.heat}`));
    return pilot.qualifying
        .filter(item => !selected.has(`${item.round}:${item.heat}`))
        .sort((a,b) => {
            if (b.points !== a.points) return b.points - a.points;
            const rankDiff = qualifyingResultRank(a) - qualifyingResultRank(b);
            if (rankDiff !== 0) return rankDiff;
            return b.round - a.round;
        });
}

function calculateBest3(pilot) {
    const best = getBest3Results(pilot);
    pilot.best3 = best.reduce((sum, result) => sum + result.points, 0);
    pilot.points = pilot.best3;
    pilot.best3Rounds = best.map(result => result.round);
}

function placeHistogram(results, maxPlace = 16) {
    const histogram = [];
    for (let place = 1; place <= maxPlace; place += 1) {
        histogram.push(results.filter(result => result.status === "FIN" && result.place === place).length);
    }
    return histogram;
}

function compareNumberArraysDesc(a, b) {
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i += 1) {
        const av = a[i] ?? -Infinity;
        const bv = b[i] ?? -Infinity;
        if (bv !== av) return bv - av;
    }
    return 0;
}

function compareResultArraysByQuality(a, b) {
    const length = Math.max(a.length, b.length);
    for (let i = 0; i < length; i += 1) {
        const ar = a[i];
        const br = b[i];
        if (!ar && !br) continue;
        if (!ar) return 1;
        if (!br) return -1;
        if (br.points !== ar.points) return br.points - ar.points;
        const rankDiff = qualifyingResultRank(ar) - qualifyingResultRank(br);
        if (rankDiff !== 0) return rankDiff;
    }
    return 0;
}

function comparePilotsWithoutLot(a, b) {
    if (b.best3 !== a.best3) return b.best3 - a.best3;

    const bestA = getBest3Results(a);
    const bestB = getBest3Results(b);
    const histogramDiff = compareNumberArraysDesc(placeHistogram(bestA), placeHistogram(bestB));
    if (histogramDiff !== 0) return histogramDiff;

    const discardedDiff = compareResultArraysByQuality(getDiscardedResults(a), getDiscardedResults(b));
    if (discardedDiff !== 0) return discardedDiff;

    for (let round = RaceData.qualifyingCount; round >= 1; round -= 1) {
        const resultA = a.qualifying.find(result => result.round === round);
        const resultB = b.qualifying.find(result => result.round === round);
        const rankDiff = qualifyingResultRank(resultA) - qualifyingResultRank(resultB);
        if (rankDiff !== 0) return rankDiff;
    }

    return 0;
}

function exactTieKey(pilot) {
    const best = getBest3Results(pilot);
    const discarded = getDiscardedResults(pilot);
    const latest = [];
    for (let round = RaceData.qualifyingCount; round >= 1; round -= 1) {
        latest.push(qualifyingResultRank(pilot.qualifying.find(result => result.round === round)));
    }
    return JSON.stringify({
        best3: pilot.best3,
        bestPlaces: placeHistogram(best),
        discarded: discarded.map(item => [item.points, qualifyingResultRank(item)]),
        latest
    });
}

function comparePilots(a, b) {
    const sportsResult = comparePilotsWithoutLot(a, b);
    if (sportsResult !== 0) return sportsResult;

    const lotA = RaceData.exactTieLots?.[String(a.id)];
    const lotB = RaceData.exactTieLots?.[String(b.id)];
    if (Number.isInteger(lotA) && Number.isInteger(lotB) && lotA !== lotB) return lotA - lotB;

    return (a.registrationOrder || 9999) - (b.registrationOrder || 9999);
}

function getExactTieGroups() {
    const groups = new Map();
    RaceData.pilots.forEach(pilot => {
        const key = exactTieKey(pilot);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(pilot);
    });
    return [...groups.values()].filter(group => group.length > 1);
}

function hasUnresolvedExactTies() {
    return getExactTieGroups().some(group => group.some(pilot => !Number.isInteger(RaceData.exactTieLots?.[String(pilot.id)])));
}

function runTieDraw() {
    if (!RaceData.exactTieLots) RaceData.exactTieLots = {};
    const unresolved = getExactTieGroups().filter(group => group.some(pilot => !Number.isInteger(RaceData.exactTieLots[String(pilot.id)])));
    if (!unresolved.length) return alert("Неразрешённых абсолютных равенств нет.");

    unresolved.forEach(group => {
        const shuffled = [...group];
        for (let i = shuffled.length - 1; i > 0; i -= 1) {
            const random = new Uint32Array(1);
            crypto.getRandomValues(random);
            const j = random[0] % (i + 1);
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        shuffled.forEach((pilot, index) => {
            RaceData.exactTieLots[String(pilot.id)] = index + 1;
        });
    });

    updateStandings();
    drawStandings();
    saveToBrowser();
    alert("Жеребьёвка проведена и сохранена в соревновании.");
    if (RaceData.heats.length && RaceData.heats.every(heat => heat.saved) && !RaceData.finals.length) generateFinals();
}

function updateStandings() {
    RaceData.pilots.forEach(calculateBest3);
    RaceData.pilots.sort(comparePilots);
}

function formatQualifyingResult(result) {
    if (!result) return "—";
    if (result.status === "DNF") return `<span class="statusText">DNF${result.dnfOrder ? `-${result.dnfOrder}` : ""}</span> <span class="points">(0)</span>`;
    if (result.status !== "FIN") return `<span class="statusText">${result.status}</span> <span class="points">(0)</span>`;
    return `${result.place} <span class="points">(${result.points})</span>`;
}

function drawStandings() {
    const container = document.getElementById("standings");
    if (!container) return;
    updateStandings();

    let html = `<div class="tableWrap"><table class="rankingTable"><thead><tr><th>№</th><th>Пилот</th>`;
    for (let round = 1; round <= RaceData.qualifyingCount; round += 1) html += `<th>Q${round}</th>`;
    html += `<th>Best 3</th></tr></thead><tbody>`;

    RaceData.pilots.forEach((pilot, index) => {
        const bestRounds = new Set(getBest3Results(pilot).map(result => result.round));
        const tied = getExactTieGroups().some(group => group.some(item => String(item.id) === String(pilot.id)));
        const lot = RaceData.exactTieLots?.[String(pilot.id)];
        html += `<tr><td>${index + 1}</td><td><strong>${escapeHtml(pilot.name)}</strong>${tied ? `<small class="tieMark">${Number.isInteger(lot) ? `жребий №${lot}` : "абсолютное равенство"}</small>` : ""}</td>`;
        for (let round = 1; round <= RaceData.qualifyingCount; round += 1) {
            const result = pilot.qualifying.find(item => item.round === round);
            const winnerClass = result?.status === "FIN" && result.place === 1 ? "roundWinner" : "";
            const bestClass = bestRounds.has(round) ? "best3Cell" : "discardedCell";
            html += `<td class="${winnerClass} ${bestClass}">${formatQualifyingResult(result)}</td>`;
        }
        html += `<td class="bestTotal"><strong>${pilot.best3}</strong></td></tr>`;
    });

    html += `</tbody></table></div>`;

    const allQualifyingSaved = RaceData.heats.length > 0 && RaceData.heats.every(heat => heat.saved);
    if (allQualifyingSaved && hasUnresolvedExactTies()) {
        html += `<div class="regulationAlert warning"><div><strong>Абсолютное равенство</strong><span>Спортивные критерии не разделили пилотов. Перед финалами нужна жеребьёвка.</span></div><button onclick="runTieDraw()">Провести жеребьёвку</button></div>`;
    }

    container.innerHTML = html;
}
