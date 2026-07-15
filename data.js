/*
===========================================
Legion RallyCross Manager
Version 1.1
data.js
===========================================
*/

const RaceData = {
    eventName: "",
    qualifyingCount: 4,
    pilots: [],
    heats: [],
    finals: [],
    finalProtocol: [],
    stage: "setup"
};

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
