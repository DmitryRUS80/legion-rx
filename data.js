/* Legion RX Championship Edition v3.0 */

const RaceData = {
    id: "",
    eventName: "",
    clubName: "Legion RC Penza",
    eventDate: "",
    eventLocation: "",
    eventStatus: "club",
    championshipId: "",
    championshipStageNumber: null,
    publishAllowed: false,
    qualifyingCount: 4,
    pilots: [],
    heats: [],
    finals: [],
    finalProtocol: [],
    exactTieLots: {},
    stage: "setup",
    lifecycleStatus: "active",
    completedAt: "",
    createdAt: "",
    updatedAt: ""
};

const EVENT_POINTS = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

class Pilot {
    constructor(name, profile = {}) {
        this.id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        this.name = name;
        this.profileId = profile.profileId || profile.id || "";
        this.photo = profile.photo || "";
        this.club = profile.club || "";
        this.city = profile.city || "";
        this.registrationOrder = RaceData.pilots.length + 1;
        this.qualifying = [];
        this.best3 = 0;
        this.points = 0;
        this.finalResults = [];
    }
}

function addPilot(name, profile = {}) {
    RaceData.pilots.push(new Pilot(name, profile));
}

function removePilot(id) {
    RaceData.pilots = RaceData.pilots.filter(pilot => String(pilot.id) !== String(id));
}

function getPilot(id) {
    return RaceData.pilots.find(pilot => String(pilot.id) === String(id));
}

function resetRaceResults() {
    RaceData.heats = [];
    RaceData.finals = [];
    RaceData.finalProtocol = [];
    RaceData.exactTieLots = {};
    RaceData.stage = "setup";
    RaceData.lifecycleStatus = "active";
    RaceData.completedAt = "";

    RaceData.pilots.forEach(pilot => {
        pilot.qualifying = [];
        pilot.best3 = 0;
        pilot.points = 0;
        pilot.finalResults = [];
    });
}

function touchRace() {
    if (!RaceData.id) RaceData.id = `race-${Date.now()}`;
    if (!RaceData.createdAt) RaceData.createdAt = new Date().toISOString();
    RaceData.updatedAt = new Date().toISOString();
}
