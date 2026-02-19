import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";
import { createRailPathfinder } from "../railPathfinder.js";
import { AREA_TYPES } from "../../enums/areaTypes.js";
import { AREA_GEN_DATA } from "../../mapGenData/areaGenData.js";

export function createRailRenderer(app, camera, getGridScale, cellSize, getAreas,getLevel) {
    const railContainer = new PIXI.Container();
    railContainer.zIndex = 3;
    app.stage.addChild(railContainer);

    const rails = []; //x, y, sprite
    const occupiedTiles = new Set();

    const {areStationsConnected} = createRailPathfinder(occupiedTiles);

    let railDirty = true;
    let lastCameraPos = { x: 0, y: 0 };
    let lastGridScale = 1;

    function isTileOccupied(tileX, tileY) {
        return occupiedTiles.has(`${tileX},${tileY}`);
    }
    function isTileBlocked(tileX, tileY) {
        const areas = getAreas();
        return areas.some(area => {
            if (area.type !== AREA_TYPES.CITY && area.type !== AREA_TYPES.LAKE) return false;
            return tileX >= area.x && tileX < area.x + area.sizeX &&
                   tileY >= area.y && tileY < area.y + area.sizeY;
        });
    }
    function isOutOfBounds(tileX, tileY) {
        
        const width = AREA_GEN_DATA.areaSize[getLevel()][0]/2;
        const height = AREA_GEN_DATA.areaSize[getLevel()][1]/2;
        return tileX >= width || tileY >= height || tileX < -width || tileY < -height;
    }

    function addRail(tileX, tileY) {
        if (isTileOccupied(tileX, tileY) || isTileBlocked(tileX,tileY) || isOutOfBounds(tileX,tileY)) return false;

        occupiedTiles.add(`${tileX},${tileY}`);
        rails.push({ x: tileX, y: tileY });
        railDirty = true;

        if (onRailPlaced) onRailPlaced();

        return true;
    }

    function removeRail(tileX, tileY) {
        const key = `${tileX},${tileY}`;
        if (!occupiedTiles.has(key)) return;

        occupiedTiles.delete(key);
        const index = rails.findIndex(r => r.x === tileX && r.y === tileY);
        if (index !== -1) {
            rails.splice(index, 1);
            railDirty = true;
        }

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

    let onRailPlaced = null;
    function setOnRailPlaceCheckConn(callback) {
        onRailPlaced = callback;
    }

    return { addRail, removeRail, drawRails, isTileOccupied, markDirty, getRails, loadRails, areStationsConnected, setOnRailPlaceCheckConn};
}