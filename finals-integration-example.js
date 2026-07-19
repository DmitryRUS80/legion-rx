
/*
 * Minimal integration example.
 *
 * Call this only AFTER qualification standings are final.
 * Existing qualification generation/distribution is not changed.
 */

let finalsManager = null;

function startLegionRXFinals() {
    // Replace this line only if your standings array has another name.
    // It must already be ordered P1, P2, P3 ... after qualification.
    const orderedStandings = RaceData.standings;

    finalsManager = new LegionRXFinals(orderedStandings);

    RaceData.finalsManager = finalsManager;
    RaceData.finals = finalsManager.getState();

    renderFinalsStage();
}

function saveLegionRXHeatResult(heatId, orderedDriverIds) {
    if (!finalsManager) {
        throw new Error("Finals have not been started");
    }

    const state = finalsManager.submitHeatResult(heatId, orderedDriverIds);
    RaceData.finals = state;

    renderFinalsStage();
}

function renderFinalsStage() {
    const state = finalsManager.getState();

    // Connect this function to the existing Finals screen.
    // state.currentStage:
    //   .title
    //   .byes
    //   .heats[].id
    //   .heats[].title
    //   .heats[].drivers
    //   .heats[].advanceCount
    //
    // When state.finished === true:
    //   state.winner
    //   state.currentStage === null

    console.log("Legion RX finals state:", state);
}
