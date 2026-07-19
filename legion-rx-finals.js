
/*
 * Legion RX Finals Engine
 * New finals system:
 * - qualification generation is NOT changed;
 * - up to 6: Final A;
 * - 7–12: Semi-final B + Semi-final C, top 3 from each -> Final A;
 * - over 12: automatic preliminary rounds, max 6 cars per heat;
 * - the engine supports any practical number of qualified drivers.
 *
 * Expected standings format:
 * [
 *   { id: "p1", name: "Иванов", ... }, // qualification P1
 *   { id: "p2", name: "Петров", ... }  // qualification P2
 * ]
 */

(function (global) {
    "use strict";

    const MAX_CARS = 6;
    const SEMI_FIELD = 12;
    const ADVANCE_FROM_HEAT = 3;

    function assert(condition, message) {
        if (!condition) throw new Error(message);
    }

    function cloneDriver(driver, qualificationPosition) {
        return {
            ...driver,
            qualificationPosition:
                Number(driver.qualificationPosition) || qualificationPosition
        };
    }

    // Balanced "snake" distribution. Qualification order remains the source order.
    function snakeDistribute(drivers, heatCount) {
        const heats = Array.from({ length: heatCount }, () => []);
        let index = 0;
        let direction = 1;

        drivers.forEach((driver) => {
            heats[index].push(driver);

            if (heatCount === 1) return;

            if (direction === 1) {
                if (index === heatCount - 1) {
                    direction = -1;
                } else {
                    index += 1;
                }
            } else {
                if (index === 0) {
                    direction = 1;
                } else {
                    index -= 1;
                }
            }
        });

        return heats;
    }

    function nextLetter(index) {
        // D, E, F ... Z, AA, AB ...
        let n = index + 4;
        let result = "";
        while (n > 0) {
            n -= 1;
            result = String.fromCharCode(65 + (n % 26)) + result;
            n = Math.floor(n / 26);
        }
        return result;
    }

    class LegionRXFinals {
        constructor(qualificationStandings) {
            assert(Array.isArray(qualificationStandings),
                "qualificationStandings must be an array");
            assert(qualificationStandings.length >= 3,
                "At least 3 classified drivers are required");

            this.qualification = qualificationStandings.map(
                (driver, index) => cloneDriver(driver, index + 1)
            );

            this.activeDrivers = [...this.qualification];
            this.eliminated = [];
            this.completedHeats = [];
            this.currentStage = null;
            this.stageCounter = 0;
            this.preliminaryHeatCounter = 0;
            this.finished = false;
            this.winner = null;

            this._buildNextStage();
        }

        _makeHeat(code, title, type, drivers, advanceCount) {
            return {
                id: `${type}-${this.stageCounter}-${code}`,
                code,
                title,
                type,
                drivers: [...drivers],
                advanceCount: Math.min(advanceCount, drivers.length),
                completed: false,
                result: []
            };
        }

        _buildNextStage() {
            this.stageCounter += 1;
            const count = this.activeDrivers.length;

            if (count <= MAX_CARS) {
                this.currentStage = {
                    type: "FINAL",
                    title: "Финал A",
                    heats: [
                        this._makeHeat(
                            "A",
                            "Финал A",
                            "FINAL",
                            this.activeDrivers,
                            0
                        )
                    ]
                };
                return;
            }

            if (count <= SEMI_FIELD) {
                const groups = snakeDistribute(this.activeDrivers, 2);

                this.currentStage = {
                    type: "SEMI",
                    title: "Полуфиналы",
                    heats: [
                        this._makeHeat(
                            "B",
                            "Полуфинал B",
                            "SEMI",
                            groups[0],
                            ADVANCE_FROM_HEAT
                        ),
                        this._makeHeat(
                            "C",
                            "Полуфинал C",
                            "SEMI",
                            groups[1],
                            ADVANCE_FROM_HEAT
                        )
                    ]
                };
                return;
            }

            /*
             * Reduce the field fairly.
             *
             * A round contains heats of no more than 6.
             * Top 3 from each heat advance.
             * Highest qualification positions may receive a bye when that is
             * necessary to produce a balanced next field.
             *
             * For 13–24 drivers, the next field is exactly 12.
             * For larger fields, repeated preliminary rounds are generated.
             */
            const target = count <= 24 ? SEMI_FIELD : Math.ceil(count / 2);
            let heatCount = Math.ceil((count - target) / (MAX_CARS - ADVANCE_FROM_HEAT));
            heatCount = Math.max(1, heatCount);

            while (count - (heatCount * MAX_CARS) > target - (heatCount * ADVANCE_FROM_HEAT)) {
                heatCount += 1;
            }

            const promotedSlots = heatCount * ADVANCE_FROM_HEAT;
            const byeCount = Math.max(0, target - promotedSlots);
            const byes = this.activeDrivers.slice(0, byeCount);
            const racingDrivers = this.activeDrivers.slice(byeCount);

            // If a heat would exceed six, add another heat.
            const actualHeatCount = Math.max(
                heatCount,
                Math.ceil(racingDrivers.length / MAX_CARS)
            );

            const groups = snakeDistribute(racingDrivers, actualHeatCount);
            const heats = groups
                .filter(group => group.length > 0)
                .map(group => {
                    const code = nextLetter(this.preliminaryHeatCounter++);
                    return this._makeHeat(
                        code,
                        `Отборочный финал ${code}`,
                        "PRELIMINARY",
                        group,
                        ADVANCE_FROM_HEAT
                    );
                });

            this.currentStage = {
                type: "PRELIMINARY",
                title: "Отборочный этап",
                byes,
                heats
            };
        }

        getState() {
            return {
                qualification: [...this.qualification],
                currentStage: this.currentStage,
                completedHeats: [...this.completedHeats],
                eliminated: [...this.eliminated],
                finished: this.finished,
                winner: this.winner
            };
        }

        submitHeatResult(heatId, orderedDriverIds) {
            assert(!this.finished, "Competition is already finished");
            const heat = this.currentStage.heats.find(h => h.id === heatId);
            assert(heat, "Heat not found");
            assert(!heat.completed, "Heat result has already been saved");
            assert(Array.isArray(orderedDriverIds), "Result must be an array");
            assert(orderedDriverIds.length === heat.drivers.length,
                "Every driver in the heat must have a finishing position");

            const expected = new Set(heat.drivers.map(d => String(d.id)));
            const received = new Set(orderedDriverIds.map(String));

            assert(expected.size === received.size &&
                   [...expected].every(id => received.has(id)),
                   "Result must contain each heat driver exactly once");

            heat.result = orderedDriverIds.map(id =>
                heat.drivers.find(d => String(d.id) === String(id))
            );
            heat.completed = true;

            if (this.currentStage.heats.every(h => h.completed)) {
                this._completeStage();
            }

            return this.getState();
        }

        _completeStage() {
            const stage = this.currentStage;
            this.completedHeats.push(...stage.heats);

            if (stage.type === "FINAL") {
                const finalResult = stage.heats[0].result;
                this.activeDrivers = finalResult;
                this.winner = finalResult[0] || null;
                this.finished = true;
                this.currentStage = null;
                return;
            }

            const advanced = [];
            const eliminated = [];

            stage.heats.forEach(heat => {
                advanced.push(...heat.result.slice(0, heat.advanceCount));
                eliminated.push(...heat.result.slice(heat.advanceCount));
            });

            // Preserve qualification advantage for grid construction:
            // promoted drivers are sorted by finishing status first, then Q rank.
            advanced.sort((a, b) =>
                a.qualificationPosition - b.qualificationPosition
            );

            const byes = stage.byes || [];
            this.eliminated.push(...eliminated);
            this.activeDrivers = [...byes, ...advanced].sort(
                (a, b) => a.qualificationPosition - b.qualificationPosition
            );

            this._buildNextStage();
        }
    }

    global.LegionRXFinals = LegionRXFinals;
    global.LegionRXFinalsUtils = {
        snakeDistribute,
        MAX_CARS,
        SEMI_FIELD,
        ADVANCE_FROM_HEAT
    };
})(typeof window !== "undefined" ? window : globalThis);
