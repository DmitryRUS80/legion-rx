/* Legion RallyCross Manager v1.3 */

const SCORE_TABLE = [50,45,42,40,39,38,37,36,35,34,33,32,31,30,29,28];

function getPoints(place) {
    if (!Number.isInteger(place) || place < 1) return 0;
    return SCORE_TABLE[place - 1] ?? Math.max(1, 29 - place);
}

function savePilotResult(pilot, qualifying, heat, resultValue) {
    const existing = pilot.qualifying.find(result => result.round === qualifying);
    const isPlace = Number.isInteger(resultValue);
    const record = {
        round: qualifying,
        heat,
        place: isPlace ? resultValue : null,
        status: isPlace ? "FIN" : resultValue,
        points: isPlace ? getPoints(resultValue) : 0
    };

    if (existing) Object.assign(existing, record);
    else pilot.qualifying.push(record);
}

function calculateBest3(pilot) {
    const points = pilot.qualifying.map(result => result.points).sort((a,b) => b-a);
    pilot.best3 = points.slice(0, 3).reduce((sum, value) => sum + value, 0);
    pilot.points = pilot.best3;
}

function countPlaces(pilot, place) {
    return pilot.qualifying.filter(result => result.place === place).length;
}

function comparePilots(a, b) {
    if (b.best3 !== a.best3) return b.best3 - a.best3;
    for (let place = 1; place <= 6; place += 1) {
        const difference = countPlaces(b, place) - countPlaces(a, place);
        if (difference !== 0) return difference;
    }
    const totalA = a.qualifying.reduce((sum, result) => sum + result.points, 0);
    const totalB = b.qualifying.reduce((sum, result) => sum + result.points, 0);
    if (totalB !== totalA) return totalB - totalA;
    return a.name.localeCompare(b.name, "ru");
}

function updateStandings() {
    RaceData.pilots.forEach(calculateBest3);
    RaceData.pilots.sort(comparePilots);
}

function formatQualifyingResult(result) {
    if (!result) return "—";
    if (result.status !== "FIN") return `<span class="statusText">${result.status}</span> <span class="points">(0)</span>`;
    return `${result.place} <span class="points">(${result.points})</span>`;
}

function drawStandings() {
    const container = document.getElementById("standings");
    if (!container) return;
    updateStandings();

    let html = `<div class="tableWrap"><table><thead><tr><th>№</th><th>Пилот</th>`;
    for (let round = 1; round <= RaceData.qualifyingCount; round += 1) html += `<th>Q${round}</th>`;
    html += `<th>Best 3</th></tr></thead><tbody>`;

    RaceData.pilots.forEach((pilot, index) => {
        html += `<tr><td>${index + 1}</td><td>${escapeHtml(pilot.name)}</td>`;
        for (let round = 1; round <= RaceData.qualifyingCount; round += 1) {
            html += `<td>${formatQualifyingResult(pilot.qualifying.find(item => item.round === round))}</td>`;
        }
        html += `<td><strong>${pilot.best3}</strong></td></tr>`;
    });

    container.innerHTML = `${html}</tbody></table></div>`;
}
