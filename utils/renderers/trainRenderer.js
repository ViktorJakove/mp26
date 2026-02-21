import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";

export function createTrainRenderer(app, camera, getGridScale, cellSize) {
    const trainContainer = new PIXI.Container();
    trainContainer.zIndex = 5;
    app.stage.addChild(trainContainer);

    const trains = [];

    const TRAIN_SPEED = 3;
    const TRAIN_SIZE = 0.6;
    const STATION_WAIT_TIME = 3500; //ms

    /**
     * @param {Array<{x,y}>} path
     * @param {number} color
     */
    function addTrain(path, color, routeIndex) {
        if (!path || path.length < 2) return;
        trains.push({
            path,
            progress: 0,
            direction: 1,      // 1 = dopredu, -1 = dozadu
            color,
            routeIndex,
            speed: TRAIN_SPEED,
            waitTimer: 0,
            waiting: false
        });
    }
    function hasTrainForRoute(routeIndex) {
        return trains.some(t => t.routeIndex === routeIndex);
    }

    function clearTrains() {
        trains.length = 0;
    }

    app.ticker.add(() => {
        for (const train of trains) {

            if(train.waiting){
                train.waitTimer += app.ticker.deltaMS;
                if(train.waitTimer >= STATION_WAIT_TIME){
                    train.waiting = false;
                    train.waitTimer = 0;
                    train.direction *= -1; //změna směru
                }else continue; //nehybat!!
            }
            
            train.progress += train.direction * train.speed / 1000 * app.ticker.deltaMS;

            if (train.progress >= train.path.length - 1) {
                train.progress = train.path.length - 1;
                train.waiting = true; //čekán
            } else if (train.progress <= 0) {
                train.progress = 0;
                train.waiting = true;
            }
        }
        drawTrains();
    });

    function drawTrains() {
        while (trainContainer.children.length > 0) {
            trainContainer.removeChildAt(0);
        }

        if (trains.length === 0) return;

        const gridScale = getGridScale();
        const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);

        for (const train of trains) {
            const { x: wx, y: wy } = getInterpolatedWorldPos(train);

            const screenX = wx - dimensions.worldLeft;
            const screenY = wy - dimensions.worldTop;

            const offset = cellSize * (1 - TRAIN_SIZE) / 2;
            const size = cellSize * TRAIN_SIZE;

            const g = new PIXI.Graphics();

            //vlak TEMP
            g.beginFill(train.color, 1);
            g.drawRoundedRect(screenX + offset, screenY + offset, size, size, 4);
            g.endFill();

            trainContainer.addChild(g);
        }
    }
    function getInterpolatedWorldPos(train) {
        const { path, progress } = train;
        const floorIdx = Math.min(Math.floor(progress), path.length - 2);
        const t = progress - floorIdx;

        const tileA = path[floorIdx];
        const tileB = path[floorIdx + 1];

        return {
            x: (tileA.x + t * (tileB.x - tileA.x)) * cellSize,
            y: (tileA.y + t * (tileB.y - tileA.y)) * cellSize,
        };
    }

    function removeTrainForRoute(routeIndex) {
        const idx = trains.findIndex(t => t.routeIndex === routeIndex);
        if (idx !== -1) trains.splice(idx, 1);
    }

    function markDirty() {
        drawTrains();
    }

    return { addTrain, clearTrains, markDirty, hasTrainForRoute, removeTrainForRoute };
}