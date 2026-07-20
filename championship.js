/* Legion RX Championship Edition v3.0 — championships */
const CHAMPIONSHIP_KEY = "legionRxChampionshipsV24";
function getChampionships(){try{return JSON.parse(localStorage.getItem(CHAMPIONSHIP_KEY)||"[]")}catch{return []}}
function saveChampionships(items){localStorage.setItem(CHAMPIONSHIP_KEY,JSON.stringify(items)); refreshChampionshipSelectors();}
function createChampionshipRecord(){
 const name=document.getElementById('champName').value.trim(); if(!name)return alert('Введите название чемпионата.');
 const season=Number(document.getElementById('champSeason').value)||new Date().getFullYear();
 const planned=Number(document.getElementById('champStagesPlanned').value)||1;
 const list=getChampionships(); const item={id:`champ-${Date.now()}`,name,season,plannedStages:planned,drivers:[],stages:[],createdAt:new Date().toISOString()};
 list.unshift(item); saveChampionships(list); drawChampionships(); openChampionship(item.id);
}
function refreshChampionshipSelectors(){
 const select=document.getElementById('raceChampionshipId'); if(!select)return; const current=select.value||RaceData.championshipId||'';
 select.innerHTML='<option value="">Выберите чемпионат</option>'+getChampionships().map(c=>`<option value="${c.id}">${escapeHtml(c.name)} ${c.season}</option>`).join(''); select.value=current;
}
function drawChampionships(){
 const box=document.getElementById('championshipList'); if(!box)return; const list=getChampionships();
 box.innerHTML=list.length?list.map(c=>`<article class="archiveCard championshipCard"><div><h3>${escapeHtml(c.name)} ${c.season}</h3><p>${c.stages.length} этапов · ${c.drivers.length} пилотов · план ${c.plannedStages}</p></div><div class="archiveActions"><button onclick="openChampionship('${c.id}')">Открыть</button><button class="dangerButton" onclick="deleteChampionship('${c.id}')">Удалить</button></div></article>`).join(''):'<p class="sectionHint">Чемпионатов пока нет.</p>';
}
function deleteChampionship(id){if(!confirm('Удалить чемпионат и его таблицу? Архив отдельных гонок не удаляется.'))return;saveChampionships(getChampionships().filter(c=>c.id!==id));drawChampionships();document.getElementById('championshipDetail').classList.add('hidden')}
function championshipStandings(c){
 const rows=c.drivers.map(d=>{const stagePoints={};c.stages.forEach(s=>{const r=(s.results||[]).find(x=>x.driverId===d.id);stagePoints[s.number]=r?r.points:null});return {...d,stagePoints,total:Object.values(stagePoints).reduce((a,v)=>a+(v||0),0)}});
 return rows.sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'ru'));
}
function openChampionship(id){
 const c=getChampionships().find(x=>x.id===id);if(!c)return; const detail=document.getElementById('championshipDetail'); detail.classList.remove('hidden');
 const stages=[...c.stages].sort((a,b)=>a.number-b.number); const standings=championshipStandings(c);
 let html=`<div class="sectionTitleRow"><div><div class="cardLabel">${c.season}</div><h2>${escapeHtml(c.name)}</h2><p class="sectionHint">${c.drivers.length} пилотов · ${stages.length}/${c.plannedStages} этапов</p></div><button class="primaryAction" onclick="createNextStage('${c.id}')">+ Следующий этап</button></div>`;
 html+=`<h3>Этапы</h3><div class="champStageGrid">${stages.length?stages.map(s=>`<article class="champStageCard"><b>Этап ${s.number}</b><span>${escapeHtml(s.name||'Без названия')}</span><small>${escapeHtml(s.date||'без даты')} · ${s.status==='finished'?'Завершён':'В работе'}</small>${s.raceId?`<button onclick="openChampionshipStage('${c.id}','${s.raceId}')">Открыть</button>`:''}</article>`).join(''):'<p class="sectionHint">Этапов ещё нет.</p>'}</div>`;
 html+='<h3>Общий зачёт</h3><div class="tableWrap"><table><thead><tr><th>Место</th><th>Пилот</th>'+stages.map(s=>`<th>Э${s.number}</th>`).join('')+'<th>Всего</th></tr></thead><tbody>';
 standings.forEach((r,i)=>html+=`<tr><td>${i+1}</td><td>${escapeHtml(r.name)}</td>${stages.map(s=>`<td>${r.stagePoints[s.number]??'—'}</td>`).join('')}<td><b>${r.total}</b></td></tr>`);
 html+='</tbody></table></div><div class="protocolActions championshipExportActions"><button class="secondaryButton" onclick="printChampionshipProtocol()">PDF / Печать</button><button class="primaryAction" onclick="exportChampionshipPng()">Сохранить PNG для соцсетей</button></div>';
 detail.innerHTML=html; detail.dataset.championshipId=id; detail.scrollIntoView({behavior:'smooth'});
}
function createNextStage(champId){
 const c=getChampionships().find(x=>x.id===champId);if(!c)return; const next=(c.stages.reduce((m,s)=>Math.max(m,s.number),0)||0)+1;
 if(RaceData.id&&RaceData.pilots.length&&!confirm('Текущая гонка будет заменена новым этапом. Продолжить?'))return;
 Object.assign(RaceData,{id:'',eventName:`${c.name} — этап ${next}`,clubName:'Legion RC Penza',eventDate:new Date().toISOString().slice(0,10),eventLocation:'',eventStatus:'championship',championshipId:c.id,championshipStageNumber:next,publishAllowed:true,qualifyingCount:4,pilots:[],heats:[],finals:[],finalProtocol:[],exactTieLots:{},stage:'setup',lifecycleStatus:'active',completedAt:'',createdAt:'',updatedAt:''});
 c.drivers.forEach(d=>{const p=new Pilot(d.name);p.championshipDriverId=d.id;RaceData.pilots.push(p)}); touchRace(); saveToBrowser(); location.reload();
}
function syncCurrentRaceToChampionship(){
 if(RaceData.eventStatus!=='championship'||!RaceData.championshipId)return; const list=getChampionships(); const c=list.find(x=>x.id===RaceData.championshipId);if(!c)return;
 RaceData.pilots.forEach(p=>{let d=c.drivers.find(x=>x.id===p.championshipDriverId)||c.drivers.find(x=>x.name.toLowerCase()===p.name.toLowerCase());if(!d){d={id:`driver-${Date.now()}-${Math.random().toString(16).slice(2)}`,name:p.name};c.drivers.push(d)}p.championshipDriverId=d.id});
 const results=(RaceData.finalProtocol||[]).map(r=>{const p=getPilot(r.pilotId);return{driverId:p?.championshipDriverId,name:p?.name||'',place:r.place,points:r.eventPoints,status:r.status}});
 const stage={number:Number(RaceData.championshipStageNumber)||1,raceId:RaceData.id,name:RaceData.eventName,date:RaceData.eventDate,status:RaceData.stage,results}; const i=c.stages.findIndex(s=>s.number===stage.number);if(i>=0)c.stages[i]=stage;else c.stages.push(stage); saveChampionships(list); saveToBrowser();
}
function openChampionshipStage(champId,raceId){const race=getArchive().find(x=>x.id===raceId);if(!race)return alert('Этап ещё не сохранён в архив.');localStorage.setItem('legionRxRace',JSON.stringify(race));location.reload()}
function printChampionshipProtocol(){window.print()}

function championshipPngFileName(value){
 return String(value||'championship').trim().replace(/[\\/:*?\"<>|]+/g,'_').replace(/\s+/g,'_').slice(0,90)||'championship';
}
function championshipCanvasText(ctx,text,x,y,maxWidth){
 const value=String(text??'');
 if(!maxWidth||ctx.measureText(value).width<=maxWidth){ctx.fillText(value,x,y);return}
 let result=value;
 while(result.length>1&&ctx.measureText(result+'…').width>maxWidth)result=result.slice(0,-1);
 ctx.fillText(result+'…',x,y);
}
function exportChampionshipPng(){
 const detail=document.getElementById('championshipDetail');
 const id=detail?.dataset.championshipId;
 const c=getChampionships().find(x=>x.id===id);
 if(!c)return alert('Сначала откройте чемпионат.');
 const stages=[...c.stages].sort((a,b)=>a.number-b.number);
 const standings=championshipStandings(c);
 if(!standings.length)return alert('В чемпионате пока нет пилотов и результатов.');

 const rankW=110,driverW=390,stageW=112,totalW=150,pad=64;
 const tableW=rankW+driverW+stages.length*stageW+totalW;
 const width=Math.max(1400,tableW+pad*2);
 const headerH=250,rowH=68,footerH=150;
 const height=headerH+70+standings.length*rowH+footerH;
 const canvas=document.createElement('canvas');
 canvas.width=width;canvas.height=height;
 const ctx=canvas.getContext('2d');
 if(!ctx)return alert('Не удалось создать изображение.');

 ctx.fillStyle='#0d1015';ctx.fillRect(0,0,width,height);
 ctx.fillStyle='#151a21';ctx.fillRect(0,0,width,headerH);
 ctx.fillStyle='#ef2b2d';ctx.fillRect(0,0,18,height);

 ctx.fillStyle='#ef2b2d';ctx.font='900 28px Arial';ctx.fillText('LEGION RX · CHAMPIONSHIP',pad,56);
 ctx.fillStyle='#ffffff';ctx.font='900 54px Arial';championshipCanvasText(ctx,`${c.name} ${c.season}`,pad,120,width-pad*2);
 ctx.fillStyle='#aab1bc';ctx.font='26px Arial';ctx.fillText(`${standings.length} пилотов  ·  ${stages.length}/${c.plannedStages} этапов`,pad,170);
 ctx.fillStyle='#747d89';ctx.font='21px Arial';ctx.fillText(`Общий зачёт чемпионата · ${new Date().toLocaleDateString('ru-RU')}`,pad,210);

 const tableX=pad,tableY=headerH;
 ctx.fillStyle='#20262f';ctx.fillRect(tableX,tableY,tableW,70);
 ctx.fillStyle='#ff6b6d';ctx.font='900 22px Arial';
 ctx.textAlign='center';ctx.fillText('МЕСТО',tableX+rankW/2,tableY+44);
 ctx.textAlign='left';ctx.fillText('ПИЛОТ',tableX+rankW+22,tableY+44);
 let x=tableX+rankW+driverW;
 stages.forEach(s=>{ctx.textAlign='center';ctx.fillText(`Э${s.number}`,x+stageW/2,tableY+44);x+=stageW});
 ctx.fillStyle='#ffc400';ctx.fillText('ВСЕГО',x+totalW/2,tableY+44);

 let y=tableY+70;
 standings.forEach((r,i)=>{
   ctx.fillStyle=i%2===0?'#12171e':'#171d25';ctx.fillRect(tableX,y,tableW,rowH);
   if(i<3){ctx.fillStyle=i===0?'#ffc400':i===1?'#cbd2da':'#c88b55';ctx.fillRect(tableX,y,8,rowH)}
   ctx.strokeStyle='#2c333d';ctx.beginPath();ctx.moveTo(tableX,y+rowH);ctx.lineTo(tableX+tableW,y+rowH);ctx.stroke();
   ctx.textAlign='center';ctx.fillStyle=i<3?'#ffffff':'#c8ced7';ctx.font=i<3?'900 27px Arial':'700 25px Arial';ctx.fillText(String(i+1),tableX+rankW/2,y+43);
   ctx.textAlign='left';ctx.fillStyle='#ffffff';ctx.font='700 25px Arial';championshipCanvasText(ctx,r.name,tableX+rankW+22,y+43,driverW-42);
   let cx=tableX+rankW+driverW;
   stages.forEach(s=>{ctx.textAlign='center';ctx.fillStyle='#d7dce4';ctx.font='24px Arial';ctx.fillText(String(r.stagePoints[s.number]??'—'),cx+stageW/2,y+43);cx+=stageW});
   ctx.fillStyle='#ffc400';ctx.font='900 28px Arial';ctx.fillText(String(r.total),cx+totalW/2,y+43);
   y+=rowH;
 });

 const finished=stages.filter(s=>s.status==='finished').length;
 ctx.textAlign='left';ctx.fillStyle='#aab1bc';ctx.font='22px Arial';
 ctx.fillText(`Завершено этапов: ${finished}. Таблица сформирована приложением Legion RX.`,pad,height-82);
 ctx.fillStyle='#ef2b2d';ctx.font='900 23px Arial';ctx.fillText('LEGION RC PENZA',pad,height-42);
 ctx.textAlign='right';ctx.fillStyle='#727b87';ctx.font='20px Arial';ctx.fillText('RallyCross Manager',width-pad,height-42);

 const download=blob=>{
   const link=document.createElement('a');
   link.download=`${championshipPngFileName(c.name)}_${c.season}_итоги.png`;
   link.href=URL.createObjectURL(blob);document.body.appendChild(link);link.click();link.remove();
   setTimeout(()=>URL.revokeObjectURL(link.href),1500);
 };
 if(canvas.toBlob)canvas.toBlob(blob=>blob?download(blob):alert('Не удалось сохранить PNG.'),'image/png');
 else{const link=document.createElement('a');link.download=`${championshipPngFileName(c.name)}_${c.season}_итоги.png`;link.href=canvas.toDataURL('image/png');link.click()}
}

function initChampionships(){document.getElementById('champSeason').value=new Date().getFullYear();document.getElementById('createChampionship').addEventListener('click',createChampionshipRecord);refreshChampionshipSelectors();drawChampionships()}
