import { AREA_TYPES } from "../../enums/areaTypes.js";
import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";
import { FOREST_SPRITES, GRAVE_SPRITES } from "../../enums/areaSprites.js";

const { CITY, LAKE, INDIANS, BISONS, FOREST, ROCK, LOCK } = AREA_TYPES;

export function createAreaRenderer(app, camera, getGridScale, cellSize) {
    //kontejnery
    const areaContainer = new PIXI.Container();
    areaContainer.zIndex = 1;
    const areaTextContainer = new PIXI.Container();
    areaTextContainer.zIndex = 11;
    const forestSpriteContainer = new PIXI.Container();
    forestSpriteContainer.zIndex = 2;
    forestSpriteContainer.sortableChildren = true;
    
    app.stage.addChild(areaContainer);
    app.stage.addChild(forestSpriteContainer);
    app.stage.addChild(areaTextContainer);

    //pooly/cache
    const graphicsPool = [];
    const textPool = [];
    const textureCache = new Map();
    
    let lastCameraPos = { x: 0, y: 0 };
    let lastGridScale = 1;
    let areaDirty = true;
    let shiftPressed = false;

    // Cache -static, generované jednou
    const forestSpritesData = []; // pole spritu se souřadnicemi
    const forestSpritesPool = []; //PIXI sprity
    let forestSpritesGenerated = false;

    function getForestTexture() {
        let path = null;
        if (Math.random() < 0.01) path = GRAVE_SPRITES[Math.floor(Math.random() * GRAVE_SPRITES.length)];
        else{
            const randomIndex = Math.floor(Math.random() * FOREST_SPRITES.length);
            path = FOREST_SPRITES[randomIndex];
        }
        
        if (!textureCache.has(path)) {
            textureCache.set(path, PIXI.Texture.from(path));
        }
        return textureCache.get(path);
    }

    function getPooledForestSprite() {
        return forestSpritesPool.pop() || new PIXI.Sprite();
    }

    function returnForestSprite(sprite) {
        sprite.texture = PIXI.Texture.EMPTY;
        sprite.alpha = 1;
        sprite.x = 0;
        sprite.y = 0;
        sprite.visible = false;
        forestSpritesPool.push(sprite);
    }

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

    function generateForestSprites(areas) {
        if (forestSpritesGenerated) return;
        
        console.log("Generating forest sprites...");
        
        areas.forEach(area => {
            if (area.type !== FOREST) return;
            
            const tileSize = cellSize;
            
            for (let x = area.x; x < area.x + area.sizeX; x++) {
                for (let y = area.y; y < area.y + area.sizeY; y++) {
                    //const spriteCount = 1 + Math.floor(Math.random() * 3);
                    //const spriteCount = Math.random() < 0.8 ? 1 : 0;
                    const spriteCount = Math.random() < 0.8 ? 1 : (Math.random() < 0.33 ? 2: (Math.random() < 0.33 ? 4: 3));
                    
                    for (let i = 0; i < spriteCount; i++) {
                        const offsetX = (Math.random() - 0.5) * (tileSize * 0.8);
                        const offsetY = (Math.random() - 0.5) * (tileSize * 0.8);
                        
                        const scale = 0.2 + Math.random() * 0.3;
                        
                        const texture = getForestTexture();
                        
                        forestSpritesData.push({
                            worldX: (x) * tileSize + offsetX,
                            worldY: (y) * tileSize + offsetY,
                            texture,
                            baseY: y,
                            scale: scale,
                            width: texture.width * scale,
                            height: texture.height * scale
                        });
                    }
                }
            }
        });
        
        //(spodní = vyšší Y = vykreslit později = nad horníma)
        //forestSpritesData.sort((a, b) => a.worldY - b.worldY);
        
        forestSpritesGenerated = true;
        console.log(`Generated ${forestSpritesData.length} forest sprites`);
    }

    function updateForestSprites(dimensions) {
        while (forestSpriteContainer.children.length > 0) {
            returnForestSprite(forestSpriteContainer.removeChildAt(0));
        }
        for (const spriteData of forestSpritesData) {
            const screenX = spriteData.worldX - dimensions.worldLeft;
            const screenY = spriteData.worldY - dimensions.worldTop;
            
            const margin = 50;
            if (screenX + spriteData.width + margin < 0 || 
                screenX - margin > dimensions.screenWidth || 
                screenY + spriteData.height + margin < 0 || 
                screenY - margin > dimensions.screenHeight) {
                continue;
            }

            const sprite = getPooledForestSprite();
            
            if (spriteData.texture.valid) {
                sprite.texture = spriteData.texture;
            } else {
                sprite.texture = PIXI.Texture.EMPTY;
                spriteData.texture.once('update', () => {
                    if (sprite.parent) {
                        sprite.texture = spriteData.texture;
                    }
                });
            }
            
            sprite.x = screenX;
            sprite.y = screenY;
            sprite.alpha = 0.8;
            sprite.scale.set(spriteData.scale);
            sprite.visible = true;
            
            
            sprite.zIndex = sprite.y + sprite.height;

            forestSpriteContainer.addChild(sprite);
        }
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
        
        if (!forestSpritesGenerated) {
            generateForestSprites(areas);
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
        
        updateForestSprites(dimensions);
        
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
                const textContent = ((area.type === BISONS) ? "bizoni" : area.name) + 
                                  ((area.type === CITY) ? '\n' + "populace : " + area.peeps : "");
                
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
                areaText.cursor = "help";
                
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