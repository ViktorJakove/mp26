import { AREA_TYPES } from "../../enums/areaTypes.js";
import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";
import { FOREST_SPRITES, ROCK_SPRITES, CITY_SPRITES, LAKE_SPRITES, GRAVE_SPRITES } from "../../enums/areaSprites.js";

const { CITY, LAKE, INDIANS, BISONS, FOREST, ROCK, LOCK } = AREA_TYPES;

// --- Nová mapa pro přiřazení spriteů k typům oblastí ---
const AREA_SPRITE_MAP = {
    [FOREST.type]: FOREST_SPRITES,
    [ROCK.type]: ROCK_SPRITES,
    [CITY.type]: CITY_SPRITES,
    [LAKE.type]: LAKE_SPRITES,
};

// Speciální případ pro hřbitov v lese - můžeme to mít jako samostatnou konstantu
const GRAVE_SPRITE_ARRAY = GRAVE_SPRITES;
// ----------------------------------------------------

export function createAreaRenderer(app, camera, getGridScale, cellSize) {
    // ... (zbytek kódu zůstává stejný - kontejnery, pool atd.) ...
    const areaContainer = new PIXI.Container();
    areaContainer.zIndex = 1;
    const areaTextContainer = new PIXI.Container();
    areaTextContainer.zIndex = 11;
    const spriteContainer = new PIXI.Container();
    spriteContainer.zIndex = 2;
    spriteContainer.sortableChildren = true;
    
    app.stage.addChild(areaContainer);
    app.stage.addChild(spriteContainer);
    app.stage.addChild(areaTextContainer);

    const graphicsPool = [];
    const textPool = [];
    const textureCache = new Map();
    
    let lastCameraPos = { x: 0, y: 0 };
    let lastGridScale = 1;
    let areaDirty = true;
    let shiftPressed = false;

    const spritesData = [];
    const spritesPool = [];
    let spritesGenerated = false;

    /**
     * Získá náhodnou texturu pro daný typ oblasti.
     * Tato funkce nahrazuje původní dlouhý if-else blok.
     */
    function getTextureForArea(areaType) {
        // 1. Speciální případ: Hřbitov v lese (1% šance)
        if (areaType === FOREST && Math.random() < 0.01 && GRAVE_SPRITE_ARRAY.length > 0) {
            const path = GRAVE_SPRITE_ARRAY[Math.floor(Math.random() * GRAVE_SPRITE_ARRAY.length)];
            return getOrCreateTexture(path);
        }

        // 2. Najdi pole spriteů pro daný typ oblasti v naší mapě
        const spriteArray = AREA_SPRITE_MAP[areaType.type]; // Použijeme areaType.type jako klíč

        // 3. Pokud pole existuje a není prázdné, vyber náhodný sprite
        if (spriteArray && spriteArray.length > 0) {
            const randomIndex = Math.floor(Math.random() * spriteArray.length);
            const path = spriteArray[randomIndex];
            return getOrCreateTexture(path);
        }

        // 4. Fallback pro případ, že typ oblasti nemá definované sprity
        // console.warn(`No sprites defined for area type: ${areaType.type}`);
        return null;
    }

    /**
     * Pomocná funkce pro získání textury z cache nebo její vytvoření.
     */
    function getOrCreateTexture(path) {
        if (!path) return null;
        
        if (!textureCache.has(path)) {
            textureCache.set(path, PIXI.Texture.from(path));
        }
        return textureCache.get(path);
    }

    // ... (zbytek kódu zůstává stejný - getPooledSprite, returnSprite atd.) ...

    function getPooledSprite() {
        return spritesPool.pop() || new PIXI.Sprite();
    }

    function returnSprite(sprite) {
        sprite.texture = PIXI.Texture.EMPTY;
        sprite.alpha = 1;
        sprite.x = 0;
        sprite.y = 0;
        sprite.visible = false;
        spritesPool.push(sprite);
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

    let needsSpriteRegen = false;

    function markSpriteDirty() {
        needsSpriteRegen = true;
        spritesGenerated = false;
        areaDirty = true;
    }

    function generateSprites(areas) {
        if (spritesGenerated && !needsSpriteRegen) return;
        
        spritesData.length = 0;
        
        areas.forEach(area => {
            if (area.type !== FOREST && area.type !== ROCK) return;
            
            const tileSize = cellSize;
            const getSpriteCount = area.type.getSpriteCount || (() => 0);
            
            for (let x = area.x; x < area.x + area.sizeX; x++) {
                for (let y = area.y; y < area.y + area.sizeY; y++) {
                    const spriteCount = getSpriteCount();
                    
                    for (let i = 0; i < spriteCount; i++) {
                        const offsetX = (Math.random() - 0.5) * (tileSize * 0.8);
                        const offsetY = (Math.random() - 0.5) * (tileSize * 0.8);
                        
                        const scale = area.type.minSpriteSize + Math.random() * (area.type.maxSpriteSize - area.type.minSpriteSize);
                        
                        const texture = getTextureForArea(area.type);
                        if (!texture) continue;
                        
                        spritesData.push({
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
        
        spritesGenerated = true;
        needsSpriteRegen = false;
    }
    
    function removeSpriteAt(tileX, tileY) {
        const tileSize = cellSize;
        const worldTileCenterX = (tileX + 0.5) * tileSize;
        const worldTileCenterY = (tileY + 0.5) * tileSize;
        const tolerance = tileSize * 0.8;
        
        for (let i = spritesData.length - 1; i >= 0; i--) {
            const sprite = spritesData[i];
            const dx = Math.abs(sprite.worldX - worldTileCenterX);
            const dy = Math.abs(sprite.worldY - worldTileCenterY);
            
            if (dx < tolerance && dy < tolerance) {
                spritesData.splice(i, 1);
            }
        }
        
        areaDirty = true;
    }

    function updateSprites(dimensions) {
        while (spriteContainer.children.length > 0) {
            returnSprite(spriteContainer.removeChildAt(0));
        }
        for (const spriteData of spritesData) {
            const screenX = spriteData.worldX - dimensions.worldLeft;
            const screenY = spriteData.worldY - dimensions.worldTop;
            
            const margin = 50;
            if (screenX + spriteData.width + margin < 0 || 
                screenX - margin > dimensions.screenWidth || 
                screenY + spriteData.height + margin < 0 || 
                screenY - margin > dimensions.screenHeight) {
                continue;
            }

            const sprite = getPooledSprite();
            
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

            spriteContainer.addChild(sprite);
        }
    }

    function getGroupTextPosition(groupAreas, dimensions) {
        const minX = Math.min(...groupAreas.map(part => part.x));
        const maxX = Math.max(...groupAreas.map(part => part.x + part.sizeX));
        const minY = Math.min(...groupAreas.map(part => part.y));
        const maxY = Math.max(...groupAreas.map(part => part.y + part.sizeY));
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
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
        
        const cameraChanged = camera.x !== lastCameraPos.x || camera.y !== lastCameraPos.y;
        const scaleChanged = gridScale !== lastGridScale;
        
        if (!areaDirty && !cameraChanged && !scaleChanged) {
            return;
        }
        
        if (!spritesGenerated) {
            generateSprites(areas);
        }
        
        while (areaContainer.children.length > 0) {
            returnGraphics(areaContainer.removeChildAt(0));
        }
        while (areaTextContainer.children.length > 0) {
            returnText(areaTextContainer.removeChildAt(0));
        }
        
        const visibleAreas = [];
        const areaGroups = new Map();
        
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
        
        visibleAreas.forEach((area) => {
            const areaGraphics = getPooledGraphics();
            areaGraphics.beginFill(area.type.color, 0.55);
            
            const screenX = (area.x * cellSize) - dimensions.worldLeft;
            const screenY = (area.y * cellSize) - dimensions.worldTop;
            
            areaGraphics.drawRect(screenX, screenY, area.sizeX * cellSize, area.sizeY * cellSize);
            areaGraphics.endFill();
            areaContainer.addChild(areaGraphics);
        });
        
        updateSprites(dimensions);
        
        if (!shiftPressed) {
            lastCameraPos = { x: camera.x, y: camera.y };
            lastGridScale = gridScale;
            areaDirty = false;
            return;
        }
        
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

    function markDirty() {
        areaDirty = true;
    }

    return {
        drawAreas,
        markDirty,
        setShiftPressed,
        removeSpriteAt
    };
}