import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";
import { VAGONS_PER_PEEPS } from "../../enums/wagonsPerPeeps.js";

export function createTrainRenderer(app, camera, getGridScale, cellSize, addMoney, calcBisonProfitForPath) {
    const trainContainer = new PIXI.Container();
    trainContainer.zIndex = 5;
    app.stage.addChild(trainContainer);

    const trains = [];
    const trainSpritePool = [];

    let trainSpeedMultiplier = 1.0;
    
    function setTrainSpeedMultiplier(multiplier) {
        trainSpeedMultiplier = multiplier;
        for (const train of trains) {
            train.speed = TRAIN_SPEED * trainSpeedMultiplier;
        }
    }

    const TRAIN_SPEED = 3;
    const TRAIN_SIZE = 1.4;
    const STATION_WAIT_TIME = 3500;
    const WAGON_OFFSET = 1.4;

    let avgPeeps = 0;
    
    let trainTextureH = null;
    let wagonTextureH = null;
    let trainTextureV = null;
    let wagonTextureV = null;
    
    const TRAIN_SPRITE_H_PATH = "../../graphics/train/loco_h.png";
    const WAGON_SPRITE_H_PATH = "../../graphics/train/wagon_h.png";
    const TRAIN_SPRITE_V_PATH = "../../graphics/train/loco_v_d.png";
    const WAGON_SPRITE_V_PATH = "../../graphics/train/wagon_v.png";

    
    function initTextures() {
        trainTextureH = PIXI.Texture.from(TRAIN_SPRITE_H_PATH);
        wagonTextureH = PIXI.Texture.from(WAGON_SPRITE_H_PATH);
        trainTextureV = PIXI.Texture.from(TRAIN_SPRITE_V_PATH);
        wagonTextureV = PIXI.Texture.from(WAGON_SPRITE_V_PATH);
    }
    initTextures();

    function getTrainTexture(direction) {
        return direction === 'vertical' ? trainTextureV : trainTextureH;
    }

    function getWagonTexture(direction) {
        return direction === 'vertical' ? wagonTextureV : wagonTextureH;
    }

    
    function getMovementDirection(prevTile, nextTile) {
        if (!prevTile || !nextTile) return 'horizontal';
        
        const dx = nextTile.x - prevTile.x;
        const dy = nextTile.y - prevTile.y;
        
        return Math.abs(dy) > Math.abs(dx) ? 'vertical' : 'horizontal';
    }

    function getDirectionAtProgress(path, progress) {
        if (path.length < 2) return { axis: 'horizontal', isFlipped: false };
        
        const currentIdx = Math.min(Math.floor(progress), path.length - 2);
        const nextIdx = currentIdx + 1;
        
        if (currentIdx < 0 || nextIdx >= path.length) {
            return { axis: 'horizontal', isFlipped: false };
        }
        
        const currentTile = path[currentIdx];
        const nextTile = path[nextIdx];
        const axis = getMovementDirection(currentTile, nextTile);
        
        let isFlipped = false;
        if (axis === 'horizontal') {
            isFlipped = nextTile.x < currentTile.x;
        }
        
        return { axis, isFlipped };
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

    function getWagonWorldPos(train, wagonProgress) {
        const clampedProgress = Math.max(0, Math.min(wagonProgress, train.path.length - 1));
        const index = Math.floor(clampedProgress);
        const nextIndex = Math.min(index + 1, train.path.length - 1);
        const t = clampedProgress - index;
    
        const current = train.path[index];
        const next = train.path[nextIndex];
    
        return {
            x: (current.x + t * (next.x - current.x)) * cellSize,
            y: (current.y + t * (next.y - current.y)) * cellSize,
        };
    }

    
    function getPooledTrainSprite() {
        return trainSpritePool.pop() || new PIXI.Sprite();
    }

    function returnTrainSprite(sprite) {
        sprite.texture = PIXI.Texture.EMPTY;
        sprite.interactive = false;
        sprite.cursor = 'default';
        sprite.removeAllListeners();
        trainSpritePool.push(sprite);
    }

    function getTintedColor(color, tintAmount) {
        const r = ((color >> 16) & 0xFF) * (1 - tintAmount) + 255 * tintAmount;
        const g = ((color >> 8) & 0xFF) * (1 - tintAmount) + 255 * tintAmount;
        const b = (color & 0xFF) * (1 - tintAmount) + 255 * tintAmount;
        return (r << 16) | (g << 8) | b;
    }

    
    function addTrain(path, color, routeIndex, routeCities = []) {
        if (!path) return;
        
        avgPeeps = ((routeCities[0] ?? 0) + (routeCities[1] ?? 0)) / 2;
        
        let wagons = [];
        let getPeepIndex = 0;
        
        for (let i = 0; i < VAGONS_PER_PEEPS.length; i++) {
            if (avgPeeps > VAGONS_PER_PEEPS[i]) getPeepIndex++;
        }
        for (let w = 0; w < getPeepIndex; w++) { 
            wagons.push({ progress: -WAGON_OFFSET * (w + 1) }); 
        }
        
        trains.push({
            path,
            progress: 0,
            direction: 1,
            color,
            routeIndex,
            speed: TRAIN_SPEED * trainSpeedMultiplier,
            waitTimer: 0,
            waiting: false,
            wagons,
            routeCities
        });
    }
    
    function hasTrainForRoute(routeIndex) {
        return trains.some(t => t.routeIndex === routeIndex);
    }

    function resetTrainToStation(train){
        const nearestEnd = train.progress < train.path.length / 2 ? 0 : train.path.length - 1;
        train.progress = nearestEnd;
        train.waiting = true;
        train.waitTimer = 0;
        train.direction = nearestEnd === 0 ? 1 : -1;
        for (let w = 0; w < train.wagons.length; w++) train.wagons[w].progress = 0;
        train.snapToStation = true;
    }

    function clearTrains() {
        trains.length = 0;
    }

    function removeTrainForRoute(routeIndex) {
        const idx = trains.findIndex(t => t.routeIndex === routeIndex);
        if (idx !== -1) trains.splice(idx, 1);
    }

    
    function blocked(train, trainIndex) {
        let nextProgressIndex;
        if (train.direction === 1) {
            nextProgressIndex = Math.floor(train.progress) + 1;
        } else {
            nextProgressIndex = Math.ceil(train.progress) - 1;
        }
        nextProgressIndex = Math.max(0, Math.min(nextProgressIndex, train.path.length - 1));
    
        const nextTile = train.path[nextProgressIndex];
    
        for (let j = 0; j < trains.length; j++) {
            if (j === trainIndex) continue;
    
            const other = trains[j];
    
            const otherTileIndex = Math.floor(other.progress);
            const otherTile = other.path[Math.min(otherTileIndex, other.path.length - 1)];
            if (otherTile.x === nextTile.x && otherTile.y === nextTile.y) return true;

            for (const wagon of other.wagons) {
                const wagonProgress = other.progress + wagon.progress * other.direction;
                const wagonTileIndex = Math.max(0, Math.min(Math.floor(wagonProgress), other.path.length - 1));
                const wagonTile = other.path[wagonTileIndex];
                if (wagonTile && wagonTile.x === nextTile.x && wagonTile.y === nextTile.y) return true;
            }
        }
    
        return false;
    }
    
    function profit(train) {
        const isBisonUnlocked = window.bisonManager ? window.bisonManager.isBisonUnlocked() : false;
        
        if (isBisonUnlocked && calcBisonProfitForPath) {
            const bisonBonus = calcBisonProfitForPath(train.path);
            if (bisonBonus > 0) {
                if (window.bisonProfitStore) {
                     window.bisonProfitStore.addProfit(bisonBonus);
                }
            }
        }
    
        let profit = avgPeeps > 50 ? avgPeeps / 4 : avgPeeps / 2;
        addMoney(Math.round(profit));
    }

    
    function areTexturesReady() {
        return trainTextureH.valid && wagonTextureH.valid && trainTextureV.valid && wagonTextureV.valid;
    }

    function drawTrains() {
        while (trainContainer.children.length > 0) {
            returnTrainSprite(trainContainer.removeChildAt(0));
        }

        if (trains.length === 0) return;

        if (!areTexturesReady()) {
            //načtení textur
            const checkTextures = () => {
                if (areTexturesReady()) {
                    drawTrains();
                } else {
                    setTimeout(checkTextures, 100);
                }
            };
            checkTextures();
            return;
        }

        const gridScale = getGridScale();
        const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);
        const spriteSize = cellSize * TRAIN_SIZE;

        for (const train of trains) {
            drawTrain(train, dimensions, spriteSize);
        }
    }

    function drawTrain(train, dimensions, spriteSize) {
        const { x: wx, y: wy } = getInterpolatedWorldPos(train);
        const screenX = wx - dimensions.worldLeft;
        const screenY = wy - dimensions.worldTop;

        const locoDirection = getDirectionAtProgress(train.path, train.progress);
        
        drawLocomotive(train, screenX, screenY, spriteSize, locoDirection);
        drawWagons(train, dimensions, spriteSize);
    }

    function drawLocomotive(train, screenX, screenY, spriteSize, direction) {
        const texture = getTrainTexture(direction.axis);
        
        const sprite = getPooledTrainSprite();
        sprite.texture = texture;
        sprite.anchor.set(0.5);
        sprite.x = screenX + cellSize / 2;
        sprite.y = screenY + cellSize / 2;
        
        const scale = spriteSize / Math.max(texture.width, texture.height);
        sprite.scale.set(scale);
        
        if (direction.isFlipped) {
            sprite.scale.x = -Math.abs(sprite.scale.x);
        }
        
        sprite.tint = getTintedColor(train.color, 0.6);
        
        sprite.interactive = true;
        sprite.cursor = 'pointer';
        sprite.on('pointerdown', (e) => {
            e.stopPropagation();
            resetTrainToStation(train);
        });

        trainContainer.addChild(sprite);
    }

    function drawWagons(train, dimensions, spriteSize) {
        for (const wagon of train.wagons) {
            const wagonProgress = train.progress + wagon.progress * train.direction;
            const { x: wwx, y: wwy } = getWagonWorldPos(train, wagonProgress);
            const wsx = wwx - dimensions.worldLeft;
            const wsy = wwy - dimensions.worldTop;

            const wagonDirection = getDirectionAtProgress(train.path, wagonProgress);
            const texture = getWagonTexture(wagonDirection.axis);

            const wagonSprite = getPooledTrainSprite();
            wagonSprite.texture = texture;
            wagonSprite.anchor.set(0.5);
            wagonSprite.x = wsx + cellSize / 2;
            wagonSprite.y = wsy + cellSize / 2;
            
            const scale = spriteSize / Math.max(texture.width, texture.height);
            wagonSprite.scale.set(scale);
            
            if (wagonDirection.isFlipped) {
                wagonSprite.scale.x = -Math.abs(wagonSprite.scale.x);
            }
            
            wagonSprite.tint = getTintedColor(train.color, 0.7);

            wagonSprite.interactive = true;
            wagonSprite.cursor = 'pointer';
            wagonSprite.on('pointerdown', (e) => {
                e.stopPropagation();
                resetTrainToStation(train);
            });

            trainContainer.addChild(wagonSprite);
        }
    }

    function markDirty() {
        drawTrains();
    }
    
    app.ticker.add(() => {
        let anyMoved = false;

        for (let i = 0; i < trains.length; i++) {
            const train = trains[i];
            const prevProgress = train.progress;

            if (train.waiting) {
                train.waitTimer += app.ticker.deltaMS;
                if(!train.snapToStation) {
                    for (const wagon of train.wagons) {
                        const delta = train.speed / 1000 * app.ticker.deltaMS;
                        if (wagon.progress < 0) {
                            wagon.progress = Math.min(0, wagon.progress + delta);
                            anyMoved = true;
                        } else if (wagon.progress > 0) {
                            wagon.progress = Math.max(0, wagon.progress - delta);
                            anyMoved = true;
                        }
                    }
                }
            
                if (train.waitTimer >= STATION_WAIT_TIME) {
                    train.waiting = false;
                    train.waitTimer = 0;
                    if (!train.snapToStation) train.direction *= -1;
                    train.snapToStation = false;
                    for (let w = 0; w < train.wagons.length; w++) train.wagons[w].progress = -WAGON_OFFSET * (w + 1);
                } else continue;
            }
    
            if (blocked(train, i)) continue;

            train.progress += train.direction * train.speed / 1000 * app.ticker.deltaMS;
            if (train.progress !== prevProgress) anyMoved = true;
            
            if(train.waiting) continue;
            if (train.progress >= train.path.length - 1) {
                train.progress = train.path.length - 1;
                train.waiting = true;
                train.waitTimer = 0;
                profit(train);
            } else if (train.progress <= 0) {
                train.progress = 0;
                train.waiting = true;
                train.waitTimer = 0;
                profit(train);
            }
        }
        if (anyMoved && trains.length > 0) drawTrains();
    });
    
    return { 
        addTrain, 
        clearTrains, 
        markDirty, 
        hasTrainForRoute, 
        removeTrainForRoute, 
        drawTrains, 
        setTrainSpeedMultiplier
    };
}