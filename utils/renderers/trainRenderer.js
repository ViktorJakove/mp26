import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";

export function createTrainRenderer(app, camera, getGridScale, cellSize) {
    const trainContainer = new PIXI.Container();
    trainContainer.zIndex = 5;
    app.stage.addChild(trainContainer);

    const trains = [];

    const TRAIN_SPEED = 0.04;
    const TRAIN_SIZE = 0.6;

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
            speed: TRAIN_SPEED + Math.random() * 0.02
        });
    }
    function hasTrainForRoute(routeIndex) {
        return trains.some(t => t.routeIndex === routeIndex);
    }

    function clearTrains() {
        trains.length = 0;
    }

    function clearTrains() {
        trains.length = 0;
    }

    app.ticker.add((delta) => {
        for (const train of trains) {
            train.progress += train.direction * train.speed * delta;

            if (train.progress >= train.path.length - 1) {
                train.progress = train.path.length - 1;
                train.direction = -1;
            } else if (train.progress <= 0) {
                train.progress = 0;
                train.direction = 1;
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

    function markDirty() {
        drawTrains();
    }

    return { addTrain, clearTrains, markDirty, hasTrainForRoute };
}