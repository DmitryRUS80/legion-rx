/* Legion RX Championship Edition v3.4 */

const $ = id => document.getElementById(id);
const eventNameInput = $("eventName");
const clubNameInput = $("clubName");
const eventDateInput = $("eventDate");
const eventLocationInput = $("eventLocation");
const eventStatusInput = $("eventStatus");
const raceChampionshipInput = $("raceChampionshipId");
const raceStageNumberInput = $("raceStageNumber");
const publishAllowedInput = $("publishAllowed");
const qualifyingSelect = $("qualifyingCount");
const createRaceButton = $("createRace");
const pilotInput = $("pilotName");
const pilotClubInput = $("pilotClub");
const addPilotButton = $("addPilot");
const racePilotList = $("racePilotList");
const pilotCounter = $("pilotCounter");
const nextButton = $("nextStep");
const PILOT_DB_KEY = "legionRxPilotDatabase";
const LAST_LOCATION_KEY = "legionRxLastEventLocation";
const INSTALL_HINT_KEY = "legionRxInstallHintShown_v3.4";

function saveLastEventLocation(value = eventLocationInput?.value || "") {
    const locationValue = String(value).trim();
    if (locationValue) localStorage.setItem(LAST_LOCATION_KEY, locationValue);
}

function getLastEventLocation() {
    return localStorage.getItem(LAST_LOCATION_KEY) || "";
}

let pendingPilotPhoto = "";
let editingPilotId = "";
let pendingEditPilotPhoto = "";

function escapeHtml(value) {
    return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;");
}

function toggleChampionshipFields(){
    const on=eventStatusInput.value === "championship";
    $("championshipLinkFields")?.classList.toggle("hidden",!on);
    $("championshipStageFields")?.classList.toggle("hidden",!on);
}
eventStatusInput.addEventListener("change", toggleChampionshipFields);
eventLocationInput?.addEventListener("change", () => saveLastEventLocation());
eventLocationInput?.addEventListener("blur", () => saveLastEventLocation());

function readRaceForm() {
    RaceData.eventName = eventNameInput.value.trim() || "Соревнование Legion RX";
    RaceData.clubName = clubNameInput.value.trim() || "Legion RC Penza";
    RaceData.eventDate = eventDateInput.value;
    RaceData.eventLocation = eventLocationInput.value.trim();
    saveLastEventLocation(RaceData.eventLocation);
    RaceData.eventStatus = eventStatusInput.value;
    RaceData.championshipId = eventStatusInput.value === "championship" ? raceChampionshipInput.value : "";
    RaceData.championshipStageNumber = eventStatusInput.value === "championship" ? Number(raceStageNumberInput.value || 1) : null;
    RaceData.publishAllowed = publishAllowedInput.checked;
    RaceData.qualifyingCount = Number(qualifyingSelect.value);
    touchRace();
}

createRaceButton.addEventListener("click", () => {
    readRaceForm();
    createRaceButton.textContent = "✔ Соревнование создано";
    saveToBrowser();
    updateHomeSummary();
});

function getPilotDatabase() {
    try { return JSON.parse(localStorage.getItem(PILOT_DB_KEY) || "[]"); }
    catch { return []; }
}

function savePilotDatabase(items) {
    localStorage.setItem(PILOT_DB_KEY, JSON.stringify(items));
}

function createPilotProfile(name, photo = "", club = "") {
    const profile = {
        id: `profile-${Date.now()}-${Math.random().toString(16).slice(2)}`,
        name,
        photo,
        club: club.trim(),
        city: "",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    const database = getPilotDatabase();
    database.push(profile);
    savePilotDatabase(database);
    return profile;
}

function upsertLegacyRacePilotsIntoDatabase() {
    const database = getPilotDatabase();
    let changed = false;
    RaceData.pilots.forEach(pilot => {
        if (pilot.profileId) return;
        let profile = database.find(item => item.name.toLowerCase() === pilot.name.toLowerCase());
        if (!profile) {
            profile = { id:`profile-${Date.now()}-${Math.random().toString(16).slice(2)}`, name:pilot.name, photo:pilot.photo || "", club:"", city:"", createdAt:new Date().toISOString(), updatedAt:new Date().toISOString() };
            database.push(profile);
        }
        pilot.profileId = profile.id;
        if (!pilot.photo) pilot.photo = profile.photo || "";
        changed = true;
    });
    if (changed) savePilotDatabase(database);
}

function addProfileToRace(profile) {
    if (RaceData.pilots.some(p => p.profileId === profile.id || p.name.toLowerCase() === profile.name.toLowerCase())) return false;
    addPilot(profile.name, { profileId: profile.id, photo: profile.photo || "", club: profile.club || "", city: profile.city || "" });
    return true;
}

addPilotButton.addEventListener("click", () => {
    const name = pilotInput.value.trim();
    if (!name) return;
    if (RaceData.pilots.some(p => p.name.toLowerCase() === name.toLowerCase())) return alert("Пилот уже добавлен в гонку.");
    const database = getPilotDatabase();
    let profile = database.find(item => item.name.toLowerCase() === name.toLowerCase());
    if (!profile) profile = createPilotProfile(name, pendingPilotPhoto, pilotClubInput.value);
    else if (pendingPilotPhoto || pilotClubInput.value.trim()) {
        if (pendingPilotPhoto) profile.photo = pendingPilotPhoto;
        if (pilotClubInput.value.trim()) profile.club = pilotClubInput.value.trim();
        profile.updatedAt = new Date().toISOString();
        savePilotDatabase(database);
    }
    addProfileToRace(profile);
    pilotInput.value = "";
    pilotClubInput.value = "";
    pendingPilotPhoto = "";
    updatePhotoPreview();
    drawPilots();
    drawPilotDatabase();
    saveToBrowser();
    updateHomeSummary();
});

pilotInput.addEventListener("keydown", e => { if (e.key === "Enter") addPilotButton.click(); });

function pilotPhotoMarkup(photo, name) {
    return photo ? `<img src="${photo}" alt="Фото ${escapeHtml(name)}">` : `<span aria-hidden="true">👤</span>`;
}

function pilotClubMarkup(club) {
    const value = String(club || "").trim();
    if (!value) return "";
    const normalized = value.toLowerCase().replace(/[^a-zа-я0-9]/gi, "");
    if (["legionrx", "легионrx", "легионрх"].includes(normalized)) return `<small class="legionClubMark">LEGION <em>RX</em></small>`;
    return `<small class="pilotClubName">${escapeHtml(value)}</small>`;
}

function pilotTableMarkup(pilot, extraClass = "") {
    if (!pilot) return `<strong class="pilotTableName ${extraClass}">—</strong>`;
    return `<strong class="pilotTableName ${extraClass}">${escapeHtml(pilot.name)}</strong>`;
}

function pilotFinalRowMarkup(pilot, index = null) {
    if (!pilot) return `<div class="finalPilotIdentity"><div class="pilotRowPhoto qualifyingPilotPhoto"><span aria-hidden="true">👤</span></div><div class="pilotRowInfo qualifyingPilotInfo"><b>Удалённый пилот</b></div></div>`;
    return `<div class="finalPilotIdentity">${index === null ? "" : `<div class="qualifyingPilotNumber">${index + 1}</div>`}<div class="pilotRowPhoto qualifyingPilotPhoto">${pilotPhotoMarkup(pilot.photo, pilot.name)}</div><div class="pilotRowInfo qualifyingPilotInfo"><b>${escapeHtml(pilot.name)}</b>${pilotClubMarkup(pilot.club)}</div></div>`;
}

function drawPilots() {
    racePilotList.innerHTML = RaceData.pilots.length ? "" : '<div class="pilotEmpty">В гонке пока нет пилотов.</div>';
    RaceData.pilots.forEach((pilot,index) => {
        const row = document.createElement("article");
        row.className = "pilotRowCard";
        row.innerHTML = `<div class="pilotRowNumber">${index+1}</div><div class="pilotRowPhoto">${pilotPhotoMarkup(pilot.photo, pilot.name)}</div><div class="pilotRowInfo"><b>${escapeHtml(pilot.name)}</b>${pilotClubMarkup(pilot.club)}</div><button class="removeButton" data-id="${pilot.id}">Удалить</button>`;
        racePilotList.appendChild(row);
    });
    racePilotList.querySelectorAll(".removeButton").forEach(button => button.addEventListener("click", () => { removePilot(button.dataset.id); drawPilots(); saveToBrowser(); updateHomeSummary(); }));
    pilotCounter.textContent = String(RaceData.pilots.length);
    nextButton.disabled = RaceData.pilots.length < 3;
}

function updatePhotoPreview() {
    const box = $("racePilotPhotoPreview");
    box.className = pendingPilotPhoto ? "pilotPhotoImage" : "pilotPhotoPlaceholder";
    box.innerHTML = pendingPilotPhoto ? `<img src="${pendingPilotPhoto}" alt="Предпросмотр фото">` : "<span>👤</span>";
    $("clearPilotPhoto").classList.toggle("hidden", !pendingPilotPhoto);
}

let cropEditorState = null;

function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function loadCropImage(source) {
    return new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = reject;
        image.src = source;
    });
}

function openPhotoCropper(file, target = "new") {
    if (!file || !file.type.startsWith("image/")) return;
    readImageFile(file).then(loadCropImage).then(image => {
        const stage = $("photoCropStage");
        const frame = $("photoCropFrame");
        const cropImage = $("photoCropImage");
        const stageSize = Math.min(stage.clientWidth || 340, 420);
        const frameSize = Math.min(260, stageSize - 36);
        const coverScale = Math.max(frameSize / image.naturalWidth, frameSize / image.naturalHeight);
        cropEditorState = {
            target,
            image,
            x: stageSize / 2,
            y: stageSize / 2,
            scale: coverScale,
            minScale: coverScale * .55,
            maxScale: coverScale * 5,
            rotation: 0,
            frameSize,
            stageSize,
            dragging: false,
            lastX: 0,
            lastY: 0,
            pinchDistance: 0,
            pinchScale: coverScale
        };
        cropImage.src = image.src;
        $("photoCropZoom").value = "100";
        $("photoCropSize").value = String(frameSize);
        frame.style.width = frameSize + "px";
        frame.style.height = frameSize + "px";
        $("photoCropModal").classList.remove("hidden");
        document.body.classList.add("cropEditorOpen");
        requestAnimationFrame(renderPhotoCropper);
    }).catch(() => alert("Не удалось открыть фотографию."));
}

function closePhotoCropper() {
    $("photoCropModal").classList.add("hidden");
    document.body.classList.remove("cropEditorOpen");
    $("photoCropImage").removeAttribute("src");
    cropEditorState = null;
}

function renderPhotoCropper() {
    if (!cropEditorState) return;
    const state = cropEditorState;
    $("photoCropImage").style.transform = `translate(-50%, -50%) translate(${state.x - state.stageSize/2}px, ${state.y - state.stageSize/2}px) rotate(${state.rotation}deg) scale(${state.scale})`;
    $("photoCropFrame").style.width = state.frameSize + "px";
    $("photoCropFrame").style.height = state.frameSize + "px";
}

function setCropZoom(percent) {
    if (!cropEditorState) return;
    const state = cropEditorState;
    const ratio = Math.max(0, Math.min(1, (Number(percent) - 50) / 250));
    state.scale = state.minScale + ratio * (state.maxScale - state.minScale);
    renderPhotoCropper();
}

function cropPointerPosition(event) {
    const rect = $("photoCropStage").getBoundingClientRect();
    return { x: event.clientX - rect.left, y: event.clientY - rect.top };
}

function cropTouchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.hypot(dx, dy);
}

function exportCroppedPhoto() {
    if (!cropEditorState) return;
    const state = cropEditorState;
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 400;
    const ctx = canvas.getContext("2d");
    const frameLeft = (state.stageSize - state.frameSize) / 2;
    const frameTop = (state.stageSize - state.frameSize) / 2;
    const outputScale = 400 / state.frameSize;
    ctx.save();
    ctx.scale(outputScale, outputScale);
    ctx.translate(state.x - frameLeft, state.y - frameTop);
    ctx.rotate(state.rotation * Math.PI / 180);
    ctx.scale(state.scale, state.scale);
    ctx.drawImage(state.image, -state.image.naturalWidth / 2, -state.image.naturalHeight / 2);
    ctx.restore();
    const result = canvas.toDataURL("image/jpeg", .84);
    if (state.target === "edit") {
        pendingEditPilotPhoto = result;
        updateEditPhotoPreview();
    } else {
        pendingPilotPhoto = result;
        updatePhotoPreview();
    }
    closePhotoCropper();
}

function processPilotPhoto(file) { openPhotoCropper(file, "new"); }
$("takePilotPhoto").addEventListener("click", () => $("pilotCameraInput").click());
$("uploadPilotPhoto").addEventListener("click", () => $("pilotGalleryInput").click());
$("pilotCameraInput").addEventListener("change", e => { processPilotPhoto(e.target.files[0]); e.target.value = ""; });
$("pilotGalleryInput").addEventListener("change", e => { processPilotPhoto(e.target.files[0]); e.target.value = ""; });
$("clearPilotPhoto").addEventListener("click", () => { pendingPilotPhoto = ""; updatePhotoPreview(); });

const photoCropStage = $("photoCropStage");
photoCropStage.addEventListener("pointerdown", event => {
    if (!cropEditorState || event.pointerType === "touch") return;
    const point = cropPointerPosition(event);
    cropEditorState.dragging = true;
    cropEditorState.lastX = point.x;
    cropEditorState.lastY = point.y;
    photoCropStage.setPointerCapture(event.pointerId);
});
photoCropStage.addEventListener("pointermove", event => {
    if (!cropEditorState?.dragging || event.pointerType === "touch") return;
    const point = cropPointerPosition(event);
    cropEditorState.x += point.x - cropEditorState.lastX;
    cropEditorState.y += point.y - cropEditorState.lastY;
    cropEditorState.lastX = point.x;
    cropEditorState.lastY = point.y;
    renderPhotoCropper();
});
photoCropStage.addEventListener("pointerup", () => { if (cropEditorState) cropEditorState.dragging = false; });
photoCropStage.addEventListener("pointercancel", () => { if (cropEditorState) cropEditorState.dragging = false; });
photoCropStage.addEventListener("touchstart", event => {
    if (!cropEditorState) return;
    event.preventDefault();
    if (event.touches.length === 1) {
        const rect = photoCropStage.getBoundingClientRect();
        cropEditorState.dragging = true;
        cropEditorState.lastX = event.touches[0].clientX - rect.left;
        cropEditorState.lastY = event.touches[0].clientY - rect.top;
    } else if (event.touches.length === 2) {
        cropEditorState.pinchDistance = cropTouchDistance(event.touches);
        cropEditorState.pinchScale = cropEditorState.scale;
    }
}, { passive:false });
photoCropStage.addEventListener("touchmove", event => {
    if (!cropEditorState) return;
    event.preventDefault();
    if (event.touches.length === 1 && cropEditorState.dragging) {
        const rect = photoCropStage.getBoundingClientRect();
        const x = event.touches[0].clientX - rect.left;
        const y = event.touches[0].clientY - rect.top;
        cropEditorState.x += x - cropEditorState.lastX;
        cropEditorState.y += y - cropEditorState.lastY;
        cropEditorState.lastX = x;
        cropEditorState.lastY = y;
    } else if (event.touches.length === 2 && cropEditorState.pinchDistance) {
        const ratio = cropTouchDistance(event.touches) / cropEditorState.pinchDistance;
        cropEditorState.scale = Math.max(cropEditorState.minScale, Math.min(cropEditorState.maxScale, cropEditorState.pinchScale * ratio));
        const normalized = (cropEditorState.scale - cropEditorState.minScale) / (cropEditorState.maxScale - cropEditorState.minScale);
        $("photoCropZoom").value = String(Math.round(50 + normalized * 250));
    }
    renderPhotoCropper();
}, { passive:false });
photoCropStage.addEventListener("touchend", () => { if (cropEditorState) { cropEditorState.dragging = false; cropEditorState.pinchDistance = 0; } }, { passive:false });
$("photoCropZoom").addEventListener("input", event => setCropZoom(event.target.value));
$("photoCropSize").addEventListener("input", event => {
    if (!cropEditorState) return;
    cropEditorState.frameSize = Number(event.target.value);
    renderPhotoCropper();
});
$("photoCropRotate").addEventListener("click", () => {
    if (!cropEditorState) return;
    cropEditorState.rotation = (cropEditorState.rotation + 90) % 360;
    renderPhotoCropper();
});
$("photoCropReset").addEventListener("click", () => {
    if (!cropEditorState) return;
    const state = cropEditorState;
    const coverScale = Math.max(state.frameSize / state.image.naturalWidth, state.frameSize / state.image.naturalHeight);
    state.x = state.stageSize / 2; state.y = state.stageSize / 2; state.scale = coverScale; state.rotation = 0;
    state.minScale = coverScale * .55; state.maxScale = coverScale * 5;
    $("photoCropZoom").value = "100";
    renderPhotoCropper();
});
$("photoCropCancel").addEventListener("click", closePhotoCropper);
$("photoCropClose").addEventListener("click", closePhotoCropper);
$("photoCropDone").addEventListener("click", exportCroppedPhoto);
$("photoCropModal").addEventListener("click", event => { if (event.target === $("photoCropModal")) closePhotoCropper(); });


function drawPilotDatabase() {
    const host = $("pilotDatabaseList");
    if (!host) return;
    const database = getPilotDatabase();
    host.innerHTML = database.length ? "" : '<div class="pilotEmpty">База пилотов пока пуста.</div>';
    database.forEach((profile, index) => {
        const card = document.createElement("article");
        card.className = "pilotRowCard";
        card.innerHTML = `<div class="pilotRowNumber">${index+1}</div><div class="pilotRowPhoto">${pilotPhotoMarkup(profile.photo, profile.name)}</div><div class="pilotRowInfo"><b>${escapeHtml(profile.name)}</b>${pilotClubMarkup(profile.club)}</div><div class="databaseCardActions"><button class="secondaryButton addDbPilot" data-id="${profile.id}">В гонку</button><button class="secondaryButton editDbPilot" data-id="${profile.id}">Редактировать</button><button class="dangerMini deleteDbPilot" data-id="${profile.id}">Удалить</button></div>`;
        host.appendChild(card);
    });
    host.querySelectorAll(".addDbPilot").forEach(button => button.addEventListener("click", () => {
        const profile = getPilotDatabase().find(item => item.id === button.dataset.id);
        if (!profile || !addProfileToRace(profile)) return alert("Пилот уже добавлен в гонку.");
        drawPilots(); saveToBrowser(); updateHomeSummary();
    }));
    host.querySelectorAll(".editDbPilot").forEach(button => button.addEventListener("click", () => openPilotEdit(button.dataset.id)));
    host.querySelectorAll(".deleteDbPilot").forEach(button => button.addEventListener("click", () => {
        const database = getPilotDatabase();
        const profile = database.find(item => item.id === button.dataset.id);
        if (!profile || !confirm(`Удалить ${profile.name} из базы пилотов? Из текущей гонки и архивов пилот удалён не будет.`)) return;
        savePilotDatabase(database.filter(item => item.id !== button.dataset.id));
        drawPilotDatabase(); drawPilotPicker();
    }));
}

function updateEditPhotoPreview() {
    const box = $("editPilotPhotoPreview");
    box.className = pendingEditPilotPhoto ? "pilotPhotoImage" : "pilotPhotoPlaceholder";
    box.innerHTML = pendingEditPilotPhoto ? `<img src="${pendingEditPilotPhoto}" alt="Предпросмотр фото">` : "<span>👤</span>";
    $("editClearPilotPhoto").classList.toggle("hidden", !pendingEditPilotPhoto);
}

function openPilotEdit(id) {
    const profile = getPilotDatabase().find(item => item.id === id);
    if (!profile) return;
    editingPilotId = id;
    pendingEditPilotPhoto = profile.photo || "";
    $("editPilotName").value = profile.name || "";
    $("editPilotClub").value = profile.club || "";
    updateEditPhotoPreview();
    $("pilotEditModal").classList.remove("hidden");
}

function closePilotEdit() {
    $("pilotEditModal").classList.add("hidden");
    editingPilotId = "";
    pendingEditPilotPhoto = "";
}

function processEditPilotPhoto(file) { openPhotoCropper(file, "edit"); }

$("closePilotEdit").addEventListener("click", closePilotEdit);
$("pilotEditModal").addEventListener("click", e => { if (e.target === $("pilotEditModal")) closePilotEdit(); });
$("editTakePilotPhoto").addEventListener("click", () => $("editPilotCameraInput").click());
$("editUploadPilotPhoto").addEventListener("click", () => $("editPilotGalleryInput").click());
$("editPilotCameraInput").addEventListener("change", e => { processEditPilotPhoto(e.target.files[0]); e.target.value = ""; });
$("editPilotGalleryInput").addEventListener("change", e => { processEditPilotPhoto(e.target.files[0]); e.target.value = ""; });
$("editClearPilotPhoto").addEventListener("click", () => { pendingEditPilotPhoto = ""; updateEditPhotoPreview(); });
$("savePilotEdit").addEventListener("click", () => {
    const name = $("editPilotName").value.trim();
    if (!name) return alert("Введите имя пилота.");
    const database = getPilotDatabase();
    const profile = database.find(item => item.id === editingPilotId);
    if (!profile) return;
    profile.name = name; profile.club = $("editPilotClub").value.trim(); profile.photo = pendingEditPilotPhoto; profile.updatedAt = new Date().toISOString();
    savePilotDatabase(database);
    RaceData.pilots.forEach(pilot => { if (pilot.profileId === profile.id) { pilot.name = profile.name; pilot.club = profile.club; pilot.photo = profile.photo; } });
    saveToBrowser(); drawPilots(); drawPilotDatabase(); drawPilotPicker($("pilotDatabaseSearch").value);
    if (RaceData.heats.length && typeof renderQualifying === "function") renderQualifying();
    if (RaceData.finals.length && typeof drawFinals === "function") drawFinals();
    closePilotEdit();
});

function drawPilotPicker(filter = "") {
    const host = $("pilotDatabasePickerList");
    const query = filter.trim().toLowerCase();
    const database = getPilotDatabase().filter(item => !query || item.name.toLowerCase().includes(query));
    host.innerHTML = database.length ? "" : '<div class="pilotEmpty">Пилоты не найдены.</div>';
    database.forEach(profile => {
        const already = RaceData.pilots.some(p => p.profileId === profile.id || p.name.toLowerCase() === profile.name.toLowerCase());
        const card = document.createElement("article");
        card.className = "pilotPickerCard";
        card.innerHTML = `<div class="pilotRowPhoto">${pilotPhotoMarkup(profile.photo, profile.name)}</div><div class="pilotRowInfo"><b>${escapeHtml(profile.name)}</b>${pilotClubMarkup(profile.club)}</div><button data-id="${profile.id}" ${already ? "disabled" : ""}>${already ? "Добавлен" : "Добавить"}</button>`;
        host.appendChild(card);
    });
    host.querySelectorAll("button:not(:disabled)").forEach(button => button.addEventListener("click", () => {
        const profile = getPilotDatabase().find(item => item.id === button.dataset.id);
        if (profile && addProfileToRace(profile)) { drawPilots(); drawPilotPicker($("pilotDatabaseSearch").value); saveToBrowser(); updateHomeSummary(); }
    }));
}

$("openPilotDatabase").addEventListener("click", () => { $("pilotDatabaseModal").classList.remove("hidden"); $("pilotDatabaseSearch").value = ""; drawPilotPicker(); });
$("closePilotDatabase").addEventListener("click", () => $("pilotDatabaseModal").classList.add("hidden"));
$("pilotDatabaseModal").addEventListener("click", e => { if (e.target === $("pilotDatabaseModal")) $("pilotDatabaseModal").classList.add("hidden"); });
$("pilotDatabaseSearch").addEventListener("input", e => drawPilotPicker(e.target.value));
$("newDatabasePilot").addEventListener("click", () => navigateTo("race", "pilotsSection"));

nextButton.addEventListener("click", () => {
    if (RaceData.pilots.length < 3) return alert("Минимум 3 пилота.");
    readRaceForm();
    generateQualifying();
    navigateTo("race", "qualifyingBlock");
});

function saveToBrowser() {
    touchRace();
    localStorage.setItem("legionRxRace", JSON.stringify(RaceData));
}

function loadFromBrowser() {
    const saved = localStorage.getItem("legionRxRace");
    if (!saved) return false;
    try {
        const parsed = JSON.parse(saved);
        Object.assign(RaceData, parsed);
        // Старые сохранения до v3.0.3 считаются активными, чтобы их можно было корректно завершить.
        RaceData.lifecycleStatus = parsed.lifecycleStatus || "active";
        RaceData.completedAt = parsed.completedAt || "";
        RaceData.exactTieLots = parsed.exactTieLots || {};
        RaceData.pilots = (parsed.pilots || []).map((data, index) => {
            const pilot = Object.assign(new Pilot(data.name), data);
            if (!pilot.registrationOrder) pilot.registrationOrder = index + 1;
            if (!Array.isArray(pilot.qualifying)) pilot.qualifying = [];
            if (!Array.isArray(pilot.finalResults)) pilot.finalResults = [];
            return pilot;
        });
        RaceData.finals = (parsed.finals || []).map(final => ({
            basePilots: final.basePilots || final.pilots || [],
            result: final.result || [],
            saved: Boolean(final.saved),
            enabled: Boolean(final.enabled),
            ...final
        }));
        return true;
    } catch (error) {
        console.error(error);
        return false;
    }
}

function exportRace() {
    downloadBlob(JSON.stringify(RaceData,null,2), `${safeFileName(RaceData.eventName)}.json`, "application/json");
}

function downloadBlob(content, name, type) {
    const url = URL.createObjectURL(new Blob([content], { type }));
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFileName(value) {
    return (value || "legion-rx").replace(/[^a-zа-я0-9_-]+/gi,"_");
}

function clearRace() {
    if (!confirm("Удалить текущее соревнование и все результаты?")) return;
    localStorage.removeItem("legionRxRace");
    location.reload();
}

function getArchive() {
    try { return JSON.parse(localStorage.getItem("legionRxArchive") || "[]"); }
    catch { return []; }
}

function saveRaceSnapshotToArchive(snapshot) {
    const archive = getArchive();
    const idx = archive.findIndex(item => item.id === snapshot.id);
    if (idx >= 0) archive[idx] = snapshot;
    else archive.unshift(snapshot);
    localStorage.setItem("legionRxArchive", JSON.stringify(archive));
}

function archiveCurrentRace() {
    if (!RaceData.id || !RaceData.pilots.length || RaceData.lifecycleStatus === "completed") {
        return alert("Нет текущего соревнования для сохранения.");
    }
    const snapshot = JSON.parse(JSON.stringify(RaceData));
    snapshot.archivedAt = new Date().toISOString();
    saveRaceSnapshotToArchive(snapshot);
    drawArchive();
}

function completeCurrentRace() {
    if (!RaceData.id || !RaceData.pilots.length) return alert("Текущей гонки нет.");
    if (RaceData.stage !== "finished" || !RaceData.finalProtocol.length) {
        return alert("Сначала завершите все заезды Финала A и сформируйте итоговый протокол.");
    }
    if (RaceData.lifecycleStatus === "completed") {
        return alert("Это соревнование уже завершено и находится в архиве.");
    }
    if (!confirm("Завершить соревнование? После завершения этап будет автоматически перенесён в архив и исчезнет с главной страницы.")) return;

    const now = new Date().toISOString();
    RaceData.lifecycleStatus = "completed";
    RaceData.completedAt = now;
    RaceData.archivedAt = now;
    touchRace();

    if (typeof syncCurrentRaceToChampionship === "function") syncCurrentRaceToChampionship();
    saveRaceSnapshotToArchive(JSON.parse(JSON.stringify(RaceData)));
    localStorage.removeItem("legionRxRace");
    alert("Соревнование завершено и перенесено в архив.");
    location.reload();
}

function discardCurrentRace() {
    if (!RaceData.id || !RaceData.pilots.length) {
        return alert("Текущей гонки нет.");
    }

    if (!confirm("Отменить текущую гонку? Все несохранённые результаты будут удалены.")) return;

    localStorage.removeItem("legionRxRace");
    location.reload();
}

function startNewRace() {
    if (RaceData.id && RaceData.pilots.length && RaceData.lifecycleStatus !== "completed") {
        const confirmed = confirm("Начать новую гонку? Текущая незавершённая гонка будет удалена.");
        if (!confirmed) return;
        localStorage.removeItem("legionRxRace");
        location.reload();
        return;
    }
    if (RaceData.lifecycleStatus === "completed") {
        localStorage.removeItem("legionRxRace");
        location.reload();
        return;
    }
    navigateTo("race", "createSection");
}

function drawArchive() {
    const filter = $("archiveFilter").value;
    const archive = getArchive().filter(item => filter === "all" || item.eventStatus === filter);
    const list = $("archiveList");
    if (!archive.length) { list.innerHTML = `<p class="sectionHint">В архиве пока нет соревнований.</p>`; return; }
    list.innerHTML = archive.map(item => `<article class="archiveCard"><div><h3>${escapeHtml(item.eventName)}</h3><p>${escapeHtml(item.clubName)} · ${escapeHtml(item.eventDate || "без даты")}</p><span class="statusBadge">${escapeHtml(item.eventStatus)}</span></div><div class="archiveActions"><button onclick="openArchiveRace('${item.id}')">Открыть</button><button class="dangerButton" onclick="deleteArchiveRace('${item.id}')">Удалить</button></div></article>`).join("");
}

function openArchiveRace(id) {
    const item = getArchive().find(race => race.id === id);
    if (!item) return;
    localStorage.setItem("legionRxRace", JSON.stringify(item));
    location.reload();
}

function deleteArchiveRace(id) {
    if (!confirm("Удалить соревнование из архива?")) return;
    localStorage.setItem("legionRxArchive", JSON.stringify(getArchive().filter(item => item.id !== id)));
    drawArchive();
}

function printProtocol() {
    window.print();
}

function exportProtocolPng() {
    if (!RaceData.finalProtocol.length) return;
    const rows = RaceData.finalProtocol.length;
    const width = 1400;
    const height = 520 + rows * 58;
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#151515";
    ctx.fillRect(0,0,width,height);
    ctx.fillStyle = "#ff4b4b";
    ctx.font = "bold 48px Arial";
    ctx.fillText(RaceData.eventName || "Legion RX", 70, 85);
    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.fillText(`${RaceData.clubName || ""}   ${RaceData.eventDate || ""}`,70,135);
    ctx.fillStyle = "#ff8080";
    ctx.font = "bold 30px Arial";
    ctx.fillText("Место",70,230);
    ctx.fillText("Пилот",250,230);
    ctx.fillText("Очки",1120,230);
    ctx.strokeStyle = "#555";
    let y = 275;
    RaceData.finalProtocol.forEach(item => {
        ctx.beginPath(); ctx.moveTo(70,y+25); ctx.lineTo(1330,y+25); ctx.stroke();
        ctx.fillStyle = "#fff";
        ctx.font = "28px Arial";
        ctx.fillText(String(item.place),85,y);
        ctx.fillText(getPilot(item.pilotId).name,250,y);
        ctx.fillText(String(item.eventPoints),1150,y);
        y += 58;
    });
    const link = document.createElement("a");
    link.download = `${safeFileName(RaceData.eventName)}_results.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
}

function updateHomeSummary() {
    const card = $("currentRaceCard");
    if (!card) return;

    if (!RaceData.id || !RaceData.pilots.length || RaceData.lifecycleStatus === "completed") {
        card.classList.add("hidden");
        card.innerHTML = "";
        return;
    }

    const stageNames = {
        setup: "Подготовка",
        qualifying: "Квалификация",
        finals: "Финалы",
        finished: "Завершено"
    };

    card.innerHTML = `
        <div class="cardLabel">ТЕКУЩЕЕ СОРЕВНОВАНИЕ</div>
        <h3>${escapeHtml(RaceData.eventName || "Legion RX")}</h3>
        <p>${RaceData.pilots.length} пилотов · ${stageNames[RaceData.stage] || "Подготовка"} · ${escapeHtml(RaceData.eventDate || "без даты")}</p>
        <div class="currentRaceActions">
            <button class="primaryAction" data-route="race">Продолжить гонку</button>
            <button class="dangerButton" id="cancelCurrentRace">Отменить гонку</button>
        </div>
    `;

    card.classList.remove("hidden");
    bindRouteButtons(card);
    $("cancelCurrentRace")?.addEventListener("click", discardCurrentRace);
}

function bindRouteButtons(root = document) {
    root.querySelectorAll("[data-route]").forEach(button => {
        if (button.dataset.routeBound === "1") return;
        button.dataset.routeBound = "1";
        button.addEventListener("click", () => navigateTo(button.dataset.route, button.dataset.scroll));
    });
}

function navigateTo(view, scrollId = "") {
    const views = { home: $("homeView"), race: $("raceView"), championships: $("championshipsView"), pilots: $("pilotsView"), archive: $("archiveView"), help: $("helpView"), settings: $("settingsView") };
    Object.entries(views).forEach(([name, element]) => element?.classList.toggle("hidden", name !== view));

    const inRace = view === "race";
    $("appNav")?.classList.toggle("hidden", inRace);
    $("raceNav")?.classList.toggle("hidden", !inRace);

    document.querySelectorAll(".navItem").forEach(item => {
        const sameRoute = item.dataset.route === view;
        const sameSection = inRace ? (scrollId ? item.dataset.scroll === scrollId : item.dataset.scroll === "createSection") : true;
        item.classList.toggle("active", sameRoute && sameSection);
    });
    if (view === "archive") drawArchive();
    if (view === "pilots") drawPilotDatabase();
    if (view === "championships") drawChampionships();
    if (view === "help") renderHelp("manual");
    if (view === "home") updateHomeSummary();
    requestAnimationFrame(() => {
        const target = scrollId ? document.getElementById(scrollId) : null;
        if (target && !target.classList.contains("hidden")) target.scrollIntoView({ behavior: "smooth", block: "start" });
        else window.scrollTo({ top: 0, behavior: "smooth" });
    });
}

function showView(view) {
    navigateTo(view);
}

function restoreRaceView() {
    if (RaceData.stage === "qualifying" && RaceData.heats.length) renderQualifying();
    if ((RaceData.stage === "finals" || RaceData.stage === "finished") && RaceData.heats.length) {
        renderQualifying();
        $("finalsSection").classList.remove("hidden");
        drawFinalsExplanation();
        drawFinals();
        if (RaceData.stage === "finished") drawFinalProtocol();
    }
}

$("exportRace").addEventListener("click", exportRace);
$("clearRace").addEventListener("click", discardCurrentRace);
$("homeNewRace").addEventListener("click", startNewRace);
$("archiveFilter").addEventListener("change", drawArchive);
$("printProtocol").addEventListener("click", printProtocol);
$("saveProtocolImage").addEventListener("click", exportProtocolPng);
$("completeRace")?.addEventListener("click", completeCurrentRace);
$("openHome").addEventListener("click", () => navigateTo("home"));
let deferredInstallPrompt = null;
window.addEventListener("beforeinstallprompt", event => {
    event.preventDefault();
    deferredInstallPrompt = event;
});

function detectInstallPlatform() {
    const ua = navigator.userAgent || "";
    const isStandalone = window.matchMedia?.("(display-mode: standalone)")?.matches || window.navigator.standalone === true;
    const isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    const isAndroid = /Android/i.test(ua);
    const isWindows = /Windows/i.test(ua);
    const isMac = /Macintosh|Mac OS X/i.test(ua);
    return { isStandalone, isIOS, isAndroid, isWindows, isMac };
}

function getInstallHelpHtml() {
    const lang = window.LegionI18n?.getLanguage?.() || "ru";
    const p = detectInstallPlatform();
    if (p.isStandalone) {
        return lang === "en"
            ? `<div class="installHelpInner"><b>Legion RX is already installed</b><span>The app launches from its icon and can work offline after the first complete load.</span></div>`
            : `<div class="installHelpInner"><b>Legion RX уже установлено</b><span>Приложение запускается с иконки и после первой полной загрузки может работать офлайн.</span></div>`;
    }
    if (p.isIOS) {
        return lang === "en"
            ? `<div class="installHelpInner"><b>Install on iPhone or iPad</b><ol><li>Open Legion RX in Safari.</li><li>Tap Share.</li><li>Select “Add to Home Screen”.</li><li>Tap “Add”.</li></ol><span>Open the installed app once while online, then test it in Airplane Mode.</span></div>`
            : `<div class="installHelpInner"><b>Установка на iPhone или iPad</b><ol><li>Откройте Legion RX в Safari.</li><li>Нажмите «Поделиться».</li><li>Выберите «На экран Домой».</li><li>Нажмите «Добавить».</li></ol><span>Один раз откройте установленное приложение с интернетом, затем проверьте его в авиарежиме.</span></div>`;
    }
    if (p.isAndroid) {
        const button = deferredInstallPrompt
            ? `<button type="button" id="installPwaNow" class="primaryAction installNowButton">${lang === "en" ? "Install Legion RX" : "Установить Legion RX"}</button>`
            : "";
        return lang === "en"
            ? `<div class="installHelpInner"><b>Install on Android</b><ol><li>Open Legion RX in Google Chrome.</li><li>Tap the browser menu ⋮.</li><li>Select “Install app” or “Add to Home screen”.</li><li>Confirm installation.</li></ol>${button}<span>If the page opened inside Telegram or VK, first choose “Open in browser”.</span></div>`
            : `<div class="installHelpInner"><b>Установка на Android</b><ol><li>Откройте Legion RX в Google Chrome.</li><li>Нажмите меню браузера ⋮.</li><li>Выберите «Установить приложение» или «Добавить на главный экран».</li><li>Подтвердите установку.</li></ol>${button}<span>Если ссылка открылась внутри Telegram или VK, сначала выберите «Открыть в браузере».</span></div>`;
    }
    const desktopName = p.isWindows ? "Windows" : (p.isMac ? "macOS" : "computer");
    return lang === "en"
        ? `<div class="installHelpInner"><b>Install on ${desktopName}</b><ol><li>Open Legion RX in Chrome or Edge.</li><li>Click the install icon in the address bar or open the browser menu.</li><li>Select “Install Legion RX”.</li></ol><span>The installed app opens in a separate window and can work offline after the first complete load.</span></div>`
        : `<div class="installHelpInner"><b>Установка на ${desktopName}</b><ol><li>Откройте Legion RX в Chrome или Edge.</li><li>Нажмите значок установки в адресной строке или откройте меню браузера.</li><li>Выберите «Установить Legion RX».</li></ol><span>Приложение будет открываться в отдельном окне и после первой полной загрузки сможет работать офлайн.</span></div>`;
}

function showInstallInstructions({ auto = false } = {}) {
    const box = $("installHelp");
    if (!box) return;
    box.innerHTML = getInstallHelpHtml();
    box.classList.remove("hidden");
    box.querySelector("#installPwaNow")?.addEventListener("click", async () => {
        if (!deferredInstallPrompt) return;
        deferredInstallPrompt.prompt();
        await deferredInstallPrompt.userChoice;
        deferredInstallPrompt = null;
        box.innerHTML = getInstallHelpHtml();
    });
    if (!auto) window.scrollTo({ top: 0, behavior: "smooth" });
}

$("showInstallInfo").addEventListener("click", () => showInstallInstructions());
bindRouteButtons();
$("languageSelect").value = window.LegionI18n?.getLanguage?.() || "ru";
$("languageSelect").addEventListener("change", e => window.LegionI18n?.setLanguage?.(e.target.value));

if (loadFromBrowser()) {
    eventNameInput.value = RaceData.eventName || "";
    clubNameInput.value = RaceData.clubName || "";
    eventDateInput.value = RaceData.eventDate || "";
    eventLocationInput.value = RaceData.eventLocation || "";
    eventStatusInput.value = RaceData.eventStatus || "club";
    refreshChampionshipSelectors();
    raceChampionshipInput.value = RaceData.championshipId || "";
    raceStageNumberInput.value = String(RaceData.championshipStageNumber || 1);
    publishAllowedInput.checked = Boolean(RaceData.publishAllowed);
    qualifyingSelect.value = String(RaceData.qualifyingCount || 4);
} else {
    eventDateInput.value = new Date().toISOString().slice(0,10);
    eventLocationInput.value = getLastEventLocation();
}
if (eventLocationInput.value.trim()) saveLastEventLocation(eventLocationInput.value);

upsertLegacyRacePilotsIntoDatabase();
drawPilots();
drawPilotDatabase();
updatePhotoPreview();
restoreRaceView();
updateHomeSummary();
navigateTo("home");
setTimeout(() => {
    const platform = detectInstallPlatform();
    if (!platform.isStandalone && !localStorage.getItem(INSTALL_HINT_KEY)) {
        showInstallInstructions({ auto: true });
        localStorage.setItem(INSTALL_HINT_KEY, "1");
    }
}, 700);


const HELP_SECTIONS_RU={
 manual:`<div class="guideContent"><h2>Руководство пользователя</h2><h3>1. Создание соревнования</h3><p>Выберите тип соревнования, заполните название, дату и место проведения.</p><h3>2. Участники</h3><p>Добавьте пилотов. Порядок регистрации не заменяет спортивный результат: стартовые позиции определяются квалификацией.</p><h3>3. Квалификация</h3><p>Создайте серии, внесите результаты и сохраните каждый заезд. В итоговый рейтинг входят три лучших результата пилота — Best 3.</p><h3>4. Финальная стадия</h3><p>Нажмите «Сформировать финалы». Программа автоматически выберет схему по количеству участников, построит LCQ и три заезда Финала A.</p><h3>5. Ввод результатов</h3><p>Сохраняйте заезды по порядку. После A3 программа автоматически рассчитает два лучших результата из трёх и сформирует итоговый протокол.</p><h3>6. Экспорт</h3><p>Кнопка «PDF / Печать» создаёт печатный документ, «Скачать PNG» — изображение итогов.</p></div>`,
 raceguide:`<div class="guideContent">
<h2>Спортивный регламент Legion RX Championship</h2>
<h3>1. Квалификация</h3>
<p>Квалификационная система не меняется. В одном заезде участвует до 6 машин, дистанция — <b>5 кругов</b>. Проводится 3–5 серий, в зачёт входят три лучших результата пилота (<b>Best 3</b>).</p>
<p>Итог квалификации определяет посев, прямой проход в Финал A, состав отборочных заездов и стартовые позиции.</p>
<div class="raceGuideVisual"><div class="guideVisualTitle">Квалификация — стартовые позиции</div><div class="rxGridDiagram rxQualifyingGrid" role="img" aria-label="Шесть вертикальных машин стоят в один ряд; над каждой машиной находится отдельная П-образная стартовая скоба"><div class="rxDirection"><span>↑</span><b>НАПРАВЛЕНИЕ ДВИЖЕНИЯ</b></div><div class="rxTrack"><div class="rxQualifyingRow"><span class="rxCar pole"><i></i><b>1</b></span><span class="rxCar"><i></i><b>2</b></span><span class="rxCar"><i></i><b>3</b></span><span class="rxCar"><i></i><b>4</b></span><span class="rxCar"><i></i><b>5</b></span><span class="rxCar"><i></i><b>6</b></span></div></div></div><p class="guideCaption">Машина изображается вертикальным прямоугольником. Над каждой машиной находится <b>отдельная</b> П-образная стартовая скоба. Скоба шире машины и не касается её: между ними сохраняется видимый зазор.</p></div>
<h3>2. Что такое LCQ</h3><p><b>LCQ — Last Chance Qualifier</b>, или «заезд последнего шанса». Это отборочный заезд для пилотов, которые не получили прямой проход в Финал A. Старт LCQ всегда формируется по результатам квалификации.</p>
<h3>3. Финальная система</h3><div class="rxRuleCards"><div class="rxRuleCard"><strong>1–6 участников</strong><span>Все пилоты проходят в Финал A. Проводятся три заезда: <b>A1, A2 и A3</b>. Во всех трёх заездах стартовый порядок одинаковый — по квалификации.</span></div><div class="rxRuleCard"><strong>7–10 участников</strong><span>Первые 4 пилота квалификации проходят напрямую. Остальные стартуют в одном LCQ. <b>Первые два на финише</b> получают позиции 5 и 6 Финала A.</span></div><div class="rxRuleCard"><strong>11–16 участников</strong><span>Первые 4 проходят напрямую. Остальные распределяются «змейкой» в LCQ B и LCQ C. Из каждого заезда проходит <b>только победитель</b>.</span></div><div class="rxRuleCard"><strong>17 и более участников</strong><span>Создаются предварительные LCQ максимум по 6 машин. Победители переходят выше. В заключительном LCQ два лучших получают последние места Финала A.</span></div></div>
<h3>4. Как формируется решётка Финала A</h3><div class="rxGridOrder"><div><b>Позиции 1–4</b><span>Четыре лучших пилота квалификации. Они проходят напрямую.</span></div><div><b>Позиции 5–6 при одном LCQ</b><span>Победитель LCQ стартует пятым, второе место — шестым. Квалификация не может переставить их местами.</span></div><div><b>Позиции 5–6 при LCQ B/C</b><span>Оба пилота являются победителями разных заездов. Выше стартует тот, кто был выше в квалификации.</span></div></div>
<div class="raceGuideVisual"><div class="guideVisualTitle">Финал A — стартовые позиции</div><div class="rxGridDiagram rxFinalGrid" role="img" aria-label="В финале шесть вертикальных машин стоят в три ряда; над каждой машиной отдельная П-образная скоба"><div class="rxDirection"><span>↑</span><b>НАПРАВЛЕНИЕ ДВИЖЕНИЯ</b></div><div class="rxTrack"><div class="rxFinalRows"><div class="rxFinalRow rowOne"><span class="rxCar pole"><i></i><b>1</b></span><span class="rxCar"><i></i><b>2</b></span></div><div class="rxFinalRow rowTwo"><span class="rxCar"><i></i><b>3</b></span><span class="rxCar"><i></i><b>4</b></span></div><div class="rxFinalRow rowThree"><span class="rxCar"><i></i><b>5</b></span><span class="rxCar"><i></i><b>6</b></span></div></div></div></div><p class="guideCaption">Эта схема является эталонной для приложения: каждый следующий ряд смещён вправо. Скоба всегда расположена отдельно над машиной, шире корпуса и не пересекает его.</p></div>
<h3>5. Три заезда Финала A</h3><p>Финал A состоит из трёх заездов по <b>7 кругов</b>: A1, A2 и A3. Стартовая решётка во всех трёх заездах остаётся одинаковой.</p><p>За место начисляются штрафные очки: 1-е место — 1, 2-е — 2, далее по занятому месту. DNF, DNS и DSQ дают 7 очков. В итог входят <b>два лучших результата из трёх</b>. Побеждает пилот с наименьшей суммой.</p>
<h3>6. Равенство очков в Финале A</h3><p>При равной сумме применяются последовательно:</p><div class="rxGridOrder"><div><b>1</b><span>Большее количество побед в A1–A3.</span></div><div><b>2</b><span>Большее количество вторых мест.</span></div><div><b>3</b><span>Лучший результат в A3.</span></div><div><b>4</b><span>Более высокое место в квалификации.</span></div></div>
<div class="rxProgression" role="img" aria-label="Квалификация: первые четыре напрямую в Финал A, остальные через LCQ; затем три заезда A1 A2 A3"><div class="rxProgressFinal"><span>ГЛАВНЫЙ ФИНАЛ</span><b>A1 + A2 + A3</b><em>зачёт двух лучших результатов</em></div><div class="rxProgressLinks"><div class="rxProgressLink"><span class="rxAdvanceCount">↑ TOP 4</span><i></i></div><div class="rxProgressLink"><span class="rxAdvanceCount">↑ 2 МЕСТА</span><i></i></div></div><div class="rxProgressSemis"><div class="rxProgressBlock"><span>КВАЛИФИКАЦИЯ</span><b>TOP 4</b><em>прямой проход</em></div><div class="rxProgressBlock"><span>ОТБОР</span><b>LCQ</b><em>честный проход по финишу</em></div></div></div>
<h3>7. Очки этапа</h3><p>По итоговому протоколу первые 10 пилотов получают очки: <b>25–18–15–12–10–8–6–4–2–1</b>.</p><div class="pointsGuide"><span><b>1</b>25</span><span><b>2</b>18</span><span><b>3</b>15</span><span><b>4</b>12</span><span><b>5</b>10</span><span><b>6</b>8</span><span><b>7</b>6</span><span><b>8</b>4</span><span><b>9</b>2</span><span><b>10</b>1</span></div></div>`,
 terms:`<div class="guideContent"><h2>Обозначения</h2><dl class="termsList"><dt>LCQ</dt><dd>Last Chance Qualifier — заезд последнего шанса для прохода в Финал A.</dd><dt>DNS</dt><dd>Did Not Start — пилот не стартовал.</dd><dt>DNF</dt><dd>Did Not Finish — пилот стартовал, но не финишировал.</dd><dt>DSQ</dt><dd>Disqualified — дисквалификация.</dd><dt>Best 3</dt><dd>Три лучших результата пилота в квалификационных сериях.</dd></dl></div>`,
 install:`<div class="guideContent"><h2>Установка приложения</h2><div id="guideInstallDetected" class="guideInstallDetected"></div><h3>iPhone и iPad</h3><ol><li>Откройте Legion RX в Safari.</li><li>Нажмите «Поделиться».</li><li>Выберите «На экран Домой».</li><li>Нажмите «Добавить».</li></ol><h3>Android</h3><ol><li>Откройте Legion RX в Google Chrome.</li><li>Нажмите меню ⋮.</li><li>Выберите «Установить приложение» или «Добавить на главный экран».</li><li>Подтвердите установку.</li></ol><h3>Компьютер</h3><p>В Chrome или Edge нажмите значок установки в адресной строке и выберите «Установить Legion RX».</p><p><b>Проверка офлайн:</b> после первой полной загрузки закройте приложение, включите авиарежим и снова откройте его с иконки.</p></div>`
};
const HELP_SECTIONS_EN={
 manual:`<div class="guideContent"><h2>User guide</h2><h3>1. Creating a race</h3><p>Select the race type and enter its name, date and location.</p><h3>2. Drivers</h3><p>Add drivers. Registration order does not determine sporting results: starting positions are set by qualifying.</p><h3>3. Qualifying</h3><p>Create the rounds, enter the results and save every heat. The driver’s three best results — Best 3 — count toward the qualifying standings.</p><h3>4. Finals stage</h3><p>Tap “Generate finals”. The app automatically selects the format based on the number of drivers, creates the LCQ structure and the three Final A heats.</p><h3>5. Entering results</h3><p>Save the heats in order. After A3, the app automatically calculates the best two results out of three and generates the final report.</p><h3>6. Export</h3><p>“PDF / Print” creates a printable document, while “Download PNG” creates an image of the results.</p></div>`,
 raceguide:`<div class="guideContent">
<h2>Legion RX Championship sporting regulations</h2>
<h3>1. Qualifying</h3><p>The qualifying system remains unchanged. Up to 6 cars take part in one heat; the distance is <b>5 laps</b>. There are 3–5 qualifying rounds, and the driver’s three best results count (<b>Best 3</b>).</p><p>The qualifying result determines seeding, direct advancement to Final A, LCQ line-ups and starting positions.</p>
<div class="raceGuideVisual"><div class="guideVisualTitle">Qualifying — starting positions</div><div class="rxGridDiagram rxQualifyingGrid" role="img" aria-label="Six vertical cars stand in one row, each with its own separate U-shaped starting gate above it"><div class="rxDirection"><span>↑</span><b>DIRECTION OF TRAVEL</b></div><div class="rxTrack"><div class="rxQualifyingRow"><span class="rxCar pole"><i></i><b>1</b></span><span class="rxCar"><i></i><b>2</b></span><span class="rxCar"><i></i><b>3</b></span><span class="rxCar"><i></i><b>4</b></span><span class="rxCar"><i></i><b>5</b></span><span class="rxCar"><i></i><b>6</b></span></div></div></div><p class="guideCaption">A car is shown as a vertical rectangle. Each car has its own <b>separate</b> U-shaped starting gate above it. The gate is wider than the car and does not touch it, leaving a visible gap.</p></div>
<h3>2. What is an LCQ?</h3><p><b>LCQ — Last Chance Qualifier</b> — is a qualifying heat for drivers who did not advance directly to Final A. The LCQ starting order is always based on qualifying results.</p>
<h3>3. Finals system</h3><div class="rxRuleCards"><div class="rxRuleCard"><strong>1–6 drivers</strong><span>All drivers advance to Final A. Three heats are held: <b>A1, A2 and A3</b>. The starting order is identical in all three heats and follows qualifying.</span></div><div class="rxRuleCard"><strong>7–10 drivers</strong><span>The top 4 qualifiers advance directly. The remaining drivers race in one LCQ. The <b>top two finishers</b> take positions 5 and 6 in Final A.</span></div><div class="rxRuleCard"><strong>11–16 drivers</strong><span>The top 4 advance directly. The remaining drivers are distributed in a snake pattern between LCQ B and LCQ C. <b>Only the winner</b> of each heat advances.</span></div><div class="rxRuleCard"><strong>17 or more drivers</strong><span>Preliminary LCQs of no more than 6 cars are created. Winners advance to the next level. The top two in the final LCQ take the last two places in Final A.</span></div></div>
<h3>4. How the Final A grid is formed</h3><div class="rxGridOrder"><div><b>Positions 1–4</b><span>The four best qualifiers advance directly.</span></div><div><b>Positions 5–6 with one LCQ</b><span>The LCQ winner starts fifth and second place starts sixth. Qualifying cannot reverse their order.</span></div><div><b>Positions 5–6 with LCQ B/C</b><span>Both drivers are winners of separate heats. The driver ranked higher in qualifying starts ahead.</span></div></div>
<div class="raceGuideVisual"><div class="guideVisualTitle">Final A — starting positions</div><div class="rxGridDiagram rxFinalGrid" role="img" aria-label="Six vertical cars stand in three staggered rows, each with its own separate U-shaped starting gate"><div class="rxDirection"><span>↑</span><b>DIRECTION OF TRAVEL</b></div><div class="rxTrack"><div class="rxFinalRows"><div class="rxFinalRow rowOne"><span class="rxCar pole"><i></i><b>1</b></span><span class="rxCar"><i></i><b>2</b></span></div><div class="rxFinalRow rowTwo"><span class="rxCar"><i></i><b>3</b></span><span class="rxCar"><i></i><b>4</b></span></div><div class="rxFinalRow rowThree"><span class="rxCar"><i></i><b>5</b></span><span class="rxCar"><i></i><b>6</b></span></div></div></div></div><p class="guideCaption">This is the reference layout used by the app: each following row is shifted to the right. Every gate remains separate above the car, wider than the body and never overlaps it.</p></div>
<h3>5. Three Final A heats</h3><p>Final A consists of three <b>7-lap</b> heats: A1, A2 and A3. The starting grid remains the same in all three heats.</p><p>Penalty points match the finishing position: 1st place scores 1 point, 2nd scores 2, and so on. DNF, DNS and DSQ score 7 points. The <b>best two results out of three</b> count. The driver with the lowest total wins.</p>
<h3>6. Ties in Final A</h3><p>If totals are equal, the following criteria are applied in order:</p><div class="rxGridOrder"><div><b>1</b><span>More wins in A1–A3.</span></div><div><b>2</b><span>More second-place finishes.</span></div><div><b>3</b><span>Better result in A3.</span></div><div><b>4</b><span>Higher qualifying position.</span></div></div>
<div class="rxProgression" role="img" aria-label="Qualifying: the top four advance directly to Final A, the others go through the LCQ, followed by A1, A2 and A3"><div class="rxProgressFinal"><span>MAIN FINAL</span><b>A1 + A2 + A3</b><em>best two results count</em></div><div class="rxProgressLinks"><div class="rxProgressLink"><span class="rxAdvanceCount">↑ TOP 4</span><i></i></div><div class="rxProgressLink"><span class="rxAdvanceCount">↑ 2 POSITIONS</span><i></i></div></div><div class="rxProgressSemis"><div class="rxProgressBlock"><span>QUALIFYING</span><b>TOP 4</b><em>direct advancement</em></div><div class="rxProgressBlock"><span>QUALIFIER</span><b>LCQ</b><em>advancement by finishing order</em></div></div></div>
<h3>7. Event points</h3><p>The top 10 drivers in the final report score: <b>25–18–15–12–10–8–6–4–2–1</b>.</p><div class="pointsGuide"><span><b>1</b>25</span><span><b>2</b>18</span><span><b>3</b>15</span><span><b>4</b>12</span><span><b>5</b>10</span><span><b>6</b>8</span><span><b>7</b>6</span><span><b>8</b>4</span><span><b>9</b>2</span><span><b>10</b>1</span></div></div>`,
 terms:`<div class="guideContent"><h2>Terms</h2><dl class="termsList"><dt>LCQ</dt><dd>Last Chance Qualifier — a last-chance heat for advancement to Final A.</dd><dt>DNS</dt><dd>Did Not Start — the driver did not start.</dd><dt>DNF</dt><dd>Did Not Finish — the driver started but did not finish.</dd><dt>DSQ</dt><dd>Disqualified — the driver was disqualified.</dd><dt>Best 3</dt><dd>The driver’s three best results from the qualifying rounds.</dd></dl></div>`,
 install:`<div class="guideContent"><h2>Installing the application</h2><div id="guideInstallDetected" class="guideInstallDetected"></div><h3>iPhone and iPad</h3><ol><li>Open Legion RX in Safari.</li><li>Tap Share.</li><li>Select “Add to Home Screen”.</li><li>Tap “Add”.</li></ol><h3>Android</h3><ol><li>Open Legion RX in Google Chrome.</li><li>Tap the ⋮ menu.</li><li>Select “Install app” or “Add to Home screen”.</li><li>Confirm installation.</li></ol><h3>Computer</h3><p>In Chrome or Edge, click the install icon in the address bar and choose “Install Legion RX”.</p><p><b>Offline test:</b> after the first complete load, close the app, enable Airplane Mode and open it again from its icon.</p></div>`
};
function currentHelpSections(){return window.LegionI18n?.getLanguage?.()==='en'?HELP_SECTIONS_EN:HELP_SECTIONS_RU}
function renderHelp(key){
    const sections=currentHelpSections();
    document.querySelectorAll('.helpTab').forEach(b=>b.classList.toggle('active',b.dataset.help===key));
    $('helpContent').innerHTML=sections[key]||sections.manual;
    if(key==='install'){
        const target=$('guideInstallDetected');
        if(target) target.innerHTML=getInstallHelpHtml();
        target?.querySelector('#installPwaNow')?.addEventListener('click',async()=>{
            if(!deferredInstallPrompt)return;
            deferredInstallPrompt.prompt();
            await deferredInstallPrompt.userChoice;
            deferredInstallPrompt=null;
            target.innerHTML=getInstallHelpHtml();
        });
    }
}
document.querySelectorAll('.helpTab').forEach(b=>b.addEventListener('click',()=>renderHelp(b.dataset.help)));
initChampionships(); toggleChampionshipFields();
