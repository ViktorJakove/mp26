
import { AREA_TYPES } from "../../enums/areaTypes.js";
import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";

const { CITY, LAKE, INDIANS, BISONS, FOREST, ROCK, LOCK } = AREA_TYPES;

export function createAreaRenderer(app, camera, getGridScale, cellSize) {
    //kontejnery
    const areaContainer = new PIXI.Container();
    areaContainer.zIndex = 1;
    const areaTextContainer = new PIXI.Container();
    areaTextContainer.zIndex = 11;
    app.stage.addChild(areaContainer);
    app.stage.addChild(areaTextContainer);

    //pooly/cache
    const graphicsPool = [];
    const textPool = [];
    let lastCameraPos = { x: 0, y: 0 };
    let lastGridScale = 1;
    let areaDirty = true;
    let shiftPressed = false;

    function getPooledGraphics() {
        return graphicsPool.pop() || new PIXI.Graphics();
    }

    function setShiftPressed(value) {
        if (shiftPressed !== value) {
            shiftPressed = value;
            areaDirty = true;
        }
    }

    function returnGraphics(graphics) {
        graphics.clear();
        graphicsPool.push(graphics);
    }

    function getPooledText() {
        return textPool.pop() || new PIXI.Text('');
    }

    function returnText(text) {
        textPool.push(text);
    }

    function isAreaVisible(area, dimensions) {
        const areaLeft = area.x * cellSize;
        const areaRight = (area.x + area.sizeX) * cellSize;
        const areaTop = area.y * cellSize;
        const areaBottom = (area.y + area.sizeY) * cellSize;
        
        return !(areaRight < dimensions.worldLeft || 
                 areaLeft > dimensions.worldRight || 
                 areaBottom < dimensions.worldTop || 
                 areaTop > dimensions.worldBottom);
    }
    //text v snake areach
    function getGroupTextPosition(groupAreas, dimensions) {
        const minX = Math.min(...groupAreas.map(part => part.x));
        const maxX = Math.max(...groupAreas.map(part => part.x + part.sizeX));
        const minY = Math.min(...groupAreas.map(part => part.y));
        const maxY = Math.max(...groupAreas.map(part => part.y + part.sizeY));
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        //najit guye nibliz stredu
        let closestTile = groupAreas[0];
        let closestDistance = Infinity;
        
        for (const part of groupAreas) {
            const tileCenterX = (part.x + part.sizeX / 2);
            const tileCenterY = (part.y + part.sizeY / 2);
            const distance = (centerX - tileCenterX) ** 2 + (centerY - tileCenterY) ** 2;
            
            if (distance < closestDistance) {
                closestDistance = distance;
                closestTile = part;
            }
        }
        
        return {
            textX: (closestTile.x + closestTile.sizeX / 2) * cellSize - dimensions.worldLeft,
            textY: (closestTile.y + closestTile.sizeY / 2) * cellSize - dimensions.worldTop
        };
    }

    function drawAreas(areas) {
        const gridScale = getGridScale();
        const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);
        
        //musim renderovat tyto?
        const cameraChanged = camera.x !== lastCameraPos.x || camera.y !== lastCameraPos.y;
        const scaleChanged = gridScale !== lastGridScale;
        
        if (!areaDirty && !cameraChanged && !scaleChanged) {
            return;
        }
        
        //navrat do poolu
        while (areaContainer.children.length > 0) {
            returnGraphics(areaContainer.removeChildAt(0));
        }
        while (areaTextContainer.children.length > 0) {
            returnText(areaTextContainer.removeChildAt(0));
        }
        
        const visibleAreas = [];
        //pro snakes - optimalizace
        const areaGroups = new Map();
        
        //skupina viditelnych
        Object.values(areas).forEach((area) => {
            if (area.type === LOCK || !isAreaVisible(area, dimensions)) return;
            
            visibleAreas.push(area);
            
            if (area.type === FOREST || area.type === ROCK) {
                if (!areaGroups.has(area.name)) {
                    areaGroups.set(area.name, []);
                }
                areaGroups.get(area.name).push(area);
            }
        });
        
        //draw
        visibleAreas.forEach((area) => {
            const areaGraphics = getPooledGraphics();
            areaGraphics.beginFill(area.type.color, 0.55);
            
            const screenX = (area.x * cellSize) - dimensions.worldLeft;
            const screenY = (area.y * cellSize) - dimensions.worldTop;
            
            areaGraphics.drawRect(screenX, screenY, area.sizeX * cellSize, area.sizeY * cellSize);
            areaGraphics.endFill();
            areaContainer.addChild(areaGraphics);
        });
        
        //upravit na ikonku (text kdyz shift) TEMPPP
        if (!shiftPressed) {
            lastCameraPos = { x: camera.x, y: camera.y };
            lastGridScale = gridScale;
            areaDirty = false;
            return;
        }
        
        //text pro viditelny
        const processedNames = new Set();
        
        visibleAreas.forEach((area) => {
            let textPosition = null;
            
            if (area.type === FOREST || area.type === ROCK) {
                if (processedNames.has(area.name)) {
                    return;
                }
                processedNames.add(area.name);
                
                const groupAreas = areaGroups.get(area.name);
                textPosition = getGroupTextPosition(groupAreas, dimensions);
            } else {
                const screenX = (area.x * cellSize) - dimensions.worldLeft;
                const screenY = (area.y * cellSize) - dimensions.worldTop;
                textPosition = {
                    textX: screenX + area.sizeX * cellSize / 2,
                    textY: screenY + area.sizeY * cellSize / 2
                };
            }
            
            if (textPosition) {
                const textContent = ((area.type === BISONS) ? "bisons" : area.name) + 
                                  ((area.type === CITY || area.type === BISONS) ? '\n' + "population : " + area.peeps : "");
                
                const areaText = getPooledText();
                areaText.text = textContent;
                areaText.style = {
                    fontFamily: "Arial",
                    fontSize: 14,
                    fill: 0x000000,
                    align: "center"
                };
                areaText.x = textPosition.textX;
                areaText.y = textPosition.textY;
                areaText.anchor.set(0.5);
                areaText.scale.set(1 / gridScale, 1 / gridScale);
                
                areaTextContainer.addChild(areaText);
            }
        });
        
        lastCameraPos = { x: camera.x, y: camera.y };
        lastGridScale = gridScale;
        areaDirty = false;
    }

    //dirty = neni potreba vykreslit
    function markDirty() {
        areaDirty = true;
    }

    return {
        drawAreas,
        markDirty,
        setShiftPressed
    };
}