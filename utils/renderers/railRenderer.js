import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";

export function createRailRenderer(app, camera, getGridScale, cellSize) {
    const railContainer = new PIXI.Container();
    railContainer.zIndex = 3;
    app.stage.addChild(railContainer);

    const rails = []; //x, y, sprite
    const occupiedTiles = new Set();

    let railDirty = true;
    let lastCameraPos = { x: 0, y: 0 };
    let lastGridScale = 1;

    function isTileOccupied(tileX, tileY) {
        return occupiedTiles.has(`${tileX},${tileY}`);
    }

    function addRail(tileX, tileY) {
        if (isTileOccupied(tileX, tileY)) return false;

        occupiedTiles.add(`${tileX},${tileY}`);
        rails.push({ x: tileX, y: tileY });
        railDirty = true;
        return true;
    }

    function drawRails() {
        const gridScale = getGridScale();
        const cameraChanged = camera.x !== lastCameraPos.x || camera.y !== lastCameraPos.y;
        const scaleChanged = gridScale !== lastGridScale;

        if (!railDirty && !cameraChanged && !scaleChanged) return;

        while (railContainer.children.length > 0) {
            railContainer.removeChildAt(0);
        }

        const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);
        const texture = PIXI.Texture.from("../../static/map/rails/T_rail.png");

        for (const rail of rails) {
            const screenX = rail.x * cellSize - dimensions.worldLeft;
            const screenY = rail.y * cellSize - dimensions.worldTop;

            const sprite = new PIXI.Sprite(texture);
            sprite.x = screenX;
            sprite.y = screenY;
            sprite.width = cellSize;
            sprite.height = cellSize;
            railContainer.addChild(sprite);
        }

        lastCameraPos = { x: camera.x, y: camera.y };
        lastGridScale = gridScale;
        railDirty = false;
    }

    function markDirty() {
        railDirty = true;
    }

    function getRails() {
        return rails.map(r => ({ x: r.x, y: r.y }));
    }
    function loadRails(data) {
        rails.length = 0;
        occupiedTiles.clear();
        for (const r of data) {
            rails.push({ x: r.x, y: r.y });
            occupiedTiles.add(`${r.x},${r.y}`);
        }
        railDirty = true;
    }

    return { addRail, drawRails, isTileOccupied, markDirty, getRails, loadRails };
}