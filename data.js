/* Legion RallyCross Manager v1.3 */

const RaceData = {
    id: "",
    eventName: "",
    clubName: "Legion RC Penza",
    eventDate: "",
    eventLocation: "",
    eventStatus: "club",
    publishAllowed: false,
    qualifyingCount: 4,
    pilots: [],
    heats: [],
    finals: [],
    finalProtocol: [],
    stage: "setup",
    createdAt: "",
    updatedAt: ""
};

const EVENT_POINTS = [25, 20, 16, 13, 11, 10];

class Pilot {
    constructor(name) {
        this.id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        this.name = name;
        this.qualifying = [];
        this.best3 = 0;
        this.points = 0;
        this.finalResults = [];
    }
}

function addPilot(name) {
    RaceData.pilots.push(new Pilot(name));
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
    RaceData.stage = "setup";

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
