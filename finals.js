/* Legion RX Championship Edition v3.0 — hybrid finals system */

const FINAL_A_ROUNDS = ["A1", "A2", "A3"];
const FINAL_STATUS_RANK = { FIN: 0, DNF: 1, DNS: 2, DSQ: 3 };

function finalOrder(name, type = "lcq", round = 0) {
    if (type === "main") return 100 + Number(name.slice(1) || 1);
    return 10 + round;
}

function createFinal(name, pilots, enabled = false, options = {}) {
    return {
        name,
        type: options.type || "lcq",
        round: options.round || 0,
        advanceCount: options.advanceCount || 0,
        nextStage: options.nextStage || "",
        order: options.order || finalOrder(name, options.type, options.round),
        pilots: pilots.map(p => p.id || p),
        basePilots: pilots.map(p => p.id || p),
        result: [],
        saved: false,
        enabled
    };
}

function qualificationRankMap() {
    const map = new Map();
    RaceData.pilots.forEach((pilot, index) => map.set(String(pilot.id), index + 1));
    return map;
}

function splitSnake(pilots, groupCount) {
    const groups = Array.from({ length: groupCount }, () => []);
    let index = 0;
    let direction = 1;
    pilots.forEach(pilot => {
        groups[index].push(pilot);
        if (groupCount === 1) return;
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

function addMainFinals(pilots, enabled = false) {
    FINAL_A_ROUNDS.forEach((name, index) => {
        RaceData.finals.push(createFinal(name, pilots, enabled && index === 0, {
            type: "main", round: index + 1, order: 100 + index
        }));
    });
}

function buildLcqStage(pilots, round = 1, prefix = "LCQ") {
    if (pilots.length <= 6) {
        const name = round === 1 ? "LCQ" : `${prefix}-F`;
        RaceData.finals.push(createFinal(name, pilots, true, {
            type: "lcq-final", round, advanceCount: 2, nextStage: "A", order: 20 + round
        }));
        return;
    }

    if (pilots.length <= 12) {
        const groups = splitSnake(pilots, 2);
        ["B", "C"].forEach((name, i) => RaceData.finals.push(createFinal(name, groups[i], true, {
            type: "lcq-group", round, advanceCount: 1, nextStage: "A", order: 20 + round
        })));
        return;
    }

    const groupCount = Math.ceil(pilots.length / 6);
    const groups = splitSnake(pilots, groupCount);
    groups.forEach((group, i) => RaceData.finals.push(createFinal(`${prefix}${i + 1}`, group, true, {
        type: "prelim", round, advanceCount: 1, nextStage: `${prefix}-NEXT`, order: 20 + round
    })));
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
    RaceData.pilots.forEach(p => { p.finalResults = []; });
    const pilots = [...RaceData.pilots];

    if (pilots.length <= 6) {
        addMainFinals(pilots, true);
    } else {
        const direct = pilots.slice(0, 4);
        const lcqPilots = pilots.slice(4);
        buildLcqStage(lcqPilots, 1, "LCQ");
        addMainFinals(direct, false);
    }

    RaceData.stage = "finals";
    drawFinalsExplanation();
    drawFinals();
    saveToBrowser();
}

function finalByName(name) { return RaceData.finals.find(final => final.name === name); }
function getFinalPilots(final) { return final.pilots.map(getPilot).filter(Boolean); }

function finalTitle(final) {
    if (final.type === "main") return `Финал ${final.name}`;
    if (final.type === "lcq-final") return "Финальный LCQ";
    if (["B", "C"].includes(final.name)) return `LCQ ${final.name}`;
    return `Отборочный ${final.name}`;
}

function getFinalRule(final) {
    if (final.type === "main") {
        return { title: `Заезд ${final.round} из 3`, advance: "Очки по занятому месту", text: "Во всех трёх заездах используется одна стартовая решётка. В итог идут два лучших результата из трёх." };
    }
    if (final.type === "lcq-final") return { title: "Заезд последнего шанса", advance: "2 лучших → Финал A", text: "Победитель получает позицию 5, второй пилот — позицию 6. Квалификация задаёт старт LCQ, но не меняет местами финишировавших." };
    if (["B", "C"].includes(final.name)) return { title: "Параллельный заезд последнего шанса", advance: "Победитель → Финал A", text: "Победители LCQ B и C занимают позиции 5–6 Финала A; выше стартует тот, кто был выше в квалификации." };
    return { title: "Предварительный LCQ", advance: "Победитель проходит выше", text: "Стартовый порядок определяется квалификацией. Победители групп переходят в следующий отборочный раунд." };
}

function drawFinalsExplanation() {
    const el = document.getElementById("finalsExplanation");
    if (!el) return;
    const n = RaceData.pilots.length;
    let route = "";
    if (n <= 6) route = "Все пилоты → A1 + A2 + A3 → два лучших результата";
    else if (n <= 10) route = "TOP 4 квалификации + TOP 2 из LCQ → A1 + A2 + A3";
    else if (n <= 16) route = "TOP 4 + победители LCQ B/C → A1 + A2 + A3";
    else route = "TOP 4 + многоступенчатый LCQ → A1 + A2 + A3";
    el.innerHTML = `<div class="finalsGuide"><h3>Финальная система Legion RX</h3><p>${route}</p><p class="guideNote">Финал A всегда состоит максимум из 6 пилотов. Итог определяется по сумме двух лучших результатов из трёх финальных заездов.</p></div>`;
}

function buildGridHtml(pilots) {
    if (!pilots.length) return `<div class="emptyGrid">Состав появится после завершения отбора.</div>`;
    let html = `<div class="startDirection">НАПРАВЛЕНИЕ ДВИЖЕНИЯ ↑</div><div class="finalGrid">`;
    for (let i = 0; i < pilots.length; i += 2) {
        const row = pilots.slice(i, i + 2);
        html += `<div class="finalRow ${row.length === 1 ? "single" : "pair"}">`;
        row.forEach((pilot, offset) => {
            html += `<div class="finalSlot"><span class="slotBracket" aria-hidden="true"></span><div class="finalPlace">${i + offset + 1}</div><div class="finalPilot">${escapeHtml(pilot.name)}</div></div>`;
        });
        html += `</div>`;
    }
    return `${html}</div>`;
}

function finalOptions(count, value = "") {
    let html = `<option value="">—</option>`;
    for (let place = 1; place <= count; place += 1) html += `<option value="${place}" ${String(value) === String(place) ? "selected" : ""}>${place}</option>`;
    ["DNF", "DNS", "DSQ"].forEach(status => html += `<option value="${status}" ${value === status ? "selected" : ""}>${status}</option>`);
    return html;
}
function finalDnfOrderOptions(count, value = "") { let h=`<option value="">Порядок схода</option>`; for(let i=1;i<=count;i++)h+=`<option value="${i}" ${String(value)===String(i)?"selected":""}>DNF-${i}</option>`; return h; }
function refreshFinalDnfOrders(name){const s=[...document.querySelectorAll(`.finalDnfOrder[data-final="${name}"]`)].filter(x=>!x.classList.contains("hidden"));const c=new Map();s.forEach(x=>{if(x.value)c.set(x.value,x)});s.forEach(x=>[...x.options].forEach(o=>{if(o.value)o.disabled=c.has(o.value)&&c.get(o.value)!==x}))}
function toggleFinalDnfOrder(select){const o=document.querySelector(`.finalDnfOrder[data-final="${select.dataset.final}"][data-id="${select.dataset.id}"]`);if(!o)return;const d=select.value==="DNF";o.classList.toggle("hidden",!d);o.disabled=select.disabled||!d;if(!d)o.value="";refreshFinalDnfOrders(select.dataset.final)}
function bindFinalSelectors(){document.querySelectorAll(".finalPlaceSelect").forEach(s=>{s.addEventListener("change",()=>{refreshUniquePlaces(`.finalPlaceSelect[data-final="${s.dataset.final}"]`);toggleFinalDnfOrder(s)});toggleFinalDnfOrder(s)});document.querySelectorAll(".finalDnfOrder").forEach(s=>s.addEventListener("change",()=>refreshFinalDnfOrders(s.dataset.final)));}
function formatFinalResultPosition(item,index){if(item.status==="FIN")return String(item.place||index+1);if(item.status==="DNF")return `DNF${item.dnfOrder?`-${item.dnfOrder}`:""}`;return item.status}

function drawFinals() {
    const block = document.getElementById("finalsBlock"); if (!block) return; block.innerHTML = "";
    [...RaceData.finals].sort((a,b)=>a.order-b.order || a.name.localeCompare(b.name)).forEach(final => {
        const pilots=getFinalPilots(final), rule=getFinalRule(final);
        let html=`<article class="finalCard ${final.enabled?"activeFinal":"lockedFinal"}"><div class="finalTitleRow"><div><h2>${finalTitle(final)}</h2><div class="finalSubtitle">${rule.title}</div></div><span class="statusBadge">${final.saved?"Завершён":final.enabled?"Готов":"Ожидает"}</span></div><div class="finalRuleBox"><strong>${rule.advance}</strong><span>${rule.text}</span></div>${buildGridHtml(pilots)}`;
        if(!final.saved&&pilots.length){html+=`<div class="finishInputTitle">Введите порядок финиша</div><div class="tableWrap"><table><thead><tr><th>Результат</th><th>Пилот</th></tr></thead><tbody>`;pilots.forEach(p=>html+=`<tr><td><div class="resultControl"><select class="finalPlaceSelect" data-final="${final.name}" data-id="${p.id}" ${!final.enabled?"disabled":""}>${finalOptions(pilots.length)}</select><select class="finalDnfOrder hidden" data-final="${final.name}" data-id="${p.id}" disabled>${finalDnfOrderOptions(pilots.length)}</select></div></td><td>${escapeHtml(p.name)}</td></tr>`);html+=`</tbody></table></div><button class="finalButton" onclick="saveFinal('${final.name}')" ${!final.enabled?"disabled":""}>Сохранить ${finalTitle(final)}</button>`}else if(final.saved){html+=`<div class="savedFinalResult"><h3>Результат</h3>`;final.result.forEach((r,i)=>html+=`<div class="savedResultRow"><span class="resultPosition">${formatFinalResultPosition(r,i)}</span><span class="resultPilot">${escapeHtml(getPilot(r.pilotId)?.name||"Удалённый пилот")}</span></div>`);html+=`<button class="secondaryButton editResultButton" onclick="editFinal('${final.name}')">Исправить результат</button></div>`}block.insertAdjacentHTML("beforeend",`${html}</article>`)
    }); bindFinalSelectors();
}

function parseFinalResults(name){const s=[...document.querySelectorAll(`.finalPlaceSelect[data-final="${name}"]`)];if(!s.length||s.some(x=>!x.value))return{error:"Укажите результат каждого пилота."};const n=s.filter(x=>/^\d+$/.test(x.value));if(new Set(n.map(x=>x.value)).size!==n.length)return{error:"Финишные места не должны повторяться."};const d=s.filter(x=>x.value==="DNF");const orders=d.map(x=>document.querySelector(`.finalDnfOrder[data-final="${name}"][data-id="${x.dataset.id}"]`)?.value||"");if(orders.some(x=>!x))return{error:"Для каждого DNF укажите порядок схода."};if(new Set(orders).size!==orders.length)return{error:"Порядок DNF не должен повторяться."};const result=s.map(x=>{const fin=/^\d+$/.test(x.value);return{pilotId:x.dataset.id,status:fin?"FIN":x.value,place:fin?Number(x.value):null,dnfOrder:x.value==="DNF"?Number(document.querySelector(`.finalDnfOrder[data-final="${name}"][data-id="${x.dataset.id}"]`)?.value):null}}).sort(compareFinalResultItems);return{result}}
function compareFinalResultItems(a,b){if(FINAL_STATUS_RANK[a.status]!==FINAL_STATUS_RANK[b.status])return FINAL_STATUS_RANK[a.status]-FINAL_STATUS_RANK[b.status];if(a.status==="FIN")return(a.place||999)-(b.place||999);if(a.status==="DNF")return(a.dnfOrder||999)-(b.dnfOrder||999);return 0}
function classifiedForAdvancement(result){return result.filter(x=>x.status==="FIN"||x.status==="DNF")}

function enableMainFinals(finalists) {
    const q=qualificationRankMap();
    finalists=[...new Set(finalists.map(String))].sort((a,b)=>(q.get(a)||9999)-(q.get(b)||9999)).slice(0,6);
    FINAL_A_ROUNDS.forEach((name,index)=>{const f=finalByName(name);f.pilots=[...finalists];f.basePilots=[...finalists];f.enabled=index===0;f.saved=false;f.result=[];});
}

function advanceLcqStage(final) {
    const stage=RaceData.finals.filter(f=>f.type===final.type&&f.round===final.round);
    if(!stage.every(f=>f.saved))return;
    const winners=[];
    stage.forEach(f=>classifiedForAdvancement(f.result).slice(0,f.advanceCount||1).forEach(x=>winners.push(x.pilotId)));
    const direct=RaceData.pilots.slice(0,4).map(p=>String(p.id));

    if(final.nextStage==="A") {
        let qualifiers=winners;
        if(stage.length>1){const q=qualificationRankMap();qualifiers.sort((a,b)=>(q.get(String(a))||9999)-(q.get(String(b))||9999));}
        enableMainFinals([...direct,...qualifiers.slice(0,2)]);
        return;
    }

    const nextRound=final.round+1;
    if(winners.length<=6){RaceData.finals.push(createFinal(`LCQ-R${nextRound}`,winners,true,{type:"lcq-final",round:nextRound,advanceCount:2,nextStage:"A",order:20+nextRound}));}
    else {const count=Math.ceil(winners.length/6),groups=splitSnake(winners,count);groups.forEach((g,i)=>RaceData.finals.push(createFinal(`LCQ-R${nextRound}-${i+1}`,g,true,{type:"prelim",round:nextRound,advanceCount:1,nextStage:"LCQ-NEXT",order:20+nextRound})));}
}

function enableNextMainRound(savedName){const i=FINAL_A_ROUNDS.indexOf(savedName);if(i>=0&&i<2){const next=finalByName(FINAL_A_ROUNDS[i+1]);if(next)next.enabled=true;}else if(i===2)buildFinalProtocol();}

function saveFinal(name){const f=finalByName(name);if(!f||!f.enabled||f.saved)return;const p=parseFinalResults(name);if(p.error)return alert(p.error);f.result=p.result;f.saved=true;f.result.forEach((r,i)=>{const pilot=getPilot(r.pilotId);if(pilot)pilot.finalResults.push({final:name,place:r.place,status:r.status,dnfOrder:r.dnfOrder,order:i+1})});if(f.type==="main")enableNextMainRound(name);else advanceLcqStage(f);drawFinalsExplanation();drawFinals();saveToBrowser();}

function editFinal(name){const f=finalByName(name);if(!f?.saved)return;if(!confirm("Исправление результата сбросит этот и все последующие финалы. Продолжить?"))return;generateFinals();}

function mainRoundScore(item){if(!item)return 7;if(item.status==="FIN")return item.place||7;return 7;}
function aggregateMainFinals(){const rounds=FINAL_A_ROUNDS.map(finalByName);const pilots=rounds[0]?.pilots||[];const q=qualificationRankMap();return pilots.map(id=>{const values=rounds.map(f=>f?.result.find(r=>String(r.pilotId)===String(id)));const scores=values.map(mainRoundScore);const best=[...scores].sort((a,b)=>a-b).slice(0,2);return{pilotId:id,total:best.reduce((a,b)=>a+b,0),wins:scores.filter(x=>x===1).length,seconds:scores.filter(x=>x===2).length,last:scores[2]||7,q:q.get(String(id))||9999,scores}}).sort((a,b)=>a.total-b.total||b.wins-a.wins||b.seconds-a.seconds||a.last-b.last||a.q-b.q)}

function buildFinalProtocol(){const main=aggregateMainFinals();const added=new Set(main.map(x=>String(x.pilotId)));const rest=[];[...RaceData.finals].filter(f=>f.saved&&f.type!=="main").sort((a,b)=>b.round-a.round||b.order-a.order).forEach(f=>f.result.forEach(r=>{if(!added.has(String(r.pilotId))){rest.push({pilotId:r.pilotId,status:r.status,source:f.name});added.add(String(r.pilotId))}}));RaceData.pilots.forEach(p=>{if(!added.has(String(p.id)))rest.push({pilotId:p.id,status:"NC",source:"Q"})});const rows=[...main.map(x=>({pilotId:x.pilotId,status:"FIN",source:`A ${x.scores.join("-")}`})),...rest];RaceData.finalProtocol=rows.map((r,i)=>({place:i+1,pilotId:r.pilotId,status:r.status,source:r.source,eventPoints:["DNS","DSQ"].includes(r.status)?0:(EVENT_POINTS[i]||0)}));RaceData.stage="finished";drawFinalProtocol();if(typeof syncCurrentRaceToChampionship==="function")syncCurrentRaceToChampionship();saveToBrowser();}

function drawFinalProtocol(){const section=document.getElementById("protocolSection"),block=document.getElementById("protocolBlock");if(!section||!block||!RaceData.finalProtocol.length)return;section.classList.remove("hidden");const standings=[...RaceData.pilots].sort(comparePilots);let html=`<div class="protocolMeta"><strong>${escapeHtml(RaceData.eventName)}</strong><span>${escapeHtml(RaceData.clubName||"")}</span><span>${escapeHtml(RaceData.eventDate||"")} ${escapeHtml(RaceData.eventLocation||"")}</span></div><div class="podium">`;RaceData.finalProtocol.slice(0,3).forEach(x=>html+=`<div class="podiumPlace place${x.place}"><span>${x.place}</span>${escapeHtml(getPilot(x.pilotId)?.name||"—")}</div>`);html+=`</div><h3>Итоговая классификация</h3><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th><th>Источник</th><th>Очки этапа</th></tr></thead><tbody>`;RaceData.finalProtocol.forEach(x=>html+=`<tr><td>${x.place}</td><td>${escapeHtml(getPilot(x.pilotId)?.name||"—")}</td><td>${escapeHtml(x.source)}${x.status!=="FIN"?` · ${escapeHtml(x.status)}`:""}</td><td>${x.eventPoints}</td></tr>`);html+=`</tbody></table></div><h3>Финалы A — два лучших результата из трёх</h3><div class="tableWrap"><table><thead><tr><th>Пилот</th><th>A1</th><th>A2</th><th>A3</th><th>Сумма</th></tr></thead><tbody>`;aggregateMainFinals().forEach(x=>html+=`<tr><td>${escapeHtml(getPilot(x.pilotId)?.name||"—")}</td><td>${x.scores[0]}</td><td>${x.scores[1]}</td><td>${x.scores[2]}</td><td><b>${x.total}</b></td></tr>`);html+=`</tbody></table></div><h3>Квалификационный рейтинг</h3><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th><th>Best 3</th></tr></thead><tbody>`;standings.forEach((p,i)=>html+=`<tr><td>${i+1}</td><td>${escapeHtml(p.name)}</td><td>${p.best3||0}</td></tr>`);html+=`</tbody></table></div>`;block.innerHTML=html;section.scrollIntoView({behavior:"smooth",block:"start"});}
