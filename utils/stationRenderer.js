import { SCREEN_DIMENSIONS } from "../screenDimensions.js";

export function createStationRenderer(app, camera, getGridScale, cellSize) {
    const stationContainer = new PIXI.Container();
    stationContainer.zIndex = 2;
    app.stage.addChild(stationContainer);

    const stations = [];
const graphicsPool = [];

function getPooledGraphics() {
    return graphicsPool.pop() || new PIXI.Graphics();
}

function returnGraphics(graphics) {
    graphics.clear();
    graphicsPool.push(graphics);
}

function addStation(tileX, tileY, color,delay) {
    stations.push({ x: tileX, y: tileY, color, alpha: 0, delay});
}

function isTileOccupied(tileX, tileY) {
    return stations.some(s => s.x === tileX && s.y === tileY);
}

app.ticker.add(() => {
    let anyFading = false;
    for (const station of stations) {
        if (station.delay > 0) {
            station.delay -= app.ticker.deltaMS;
            anyFading = true;
            continue;
        }
        if (station.alpha < 0.7) {
            station.alpha = Math.min(0.7, station.alpha + 0.05);
            anyFading = true;
        }
    }
    if (anyFading) drawStations();
});

function drawStations() {
    while (stationContainer.children.length > 0) {
        returnGraphics(stationContainer.removeChildAt(0));
    }

    const gridScale = getGridScale();
    const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);

    for (const station of stations) {
        const screenX = station.x * cellSize - dimensions.worldLeft;
        const screenY = station.y * cellSize - dimensions.worldTop;

        const g = getPooledGraphics();
        g.beginFill(station.color, station.alpha);
        g.drawRect(screenX, screenY, cellSize, cellSize);
        g.endFill();
        stationContainer.addChild(g);
    }
}

return { addStation, drawStations, isTileOccupied };
}