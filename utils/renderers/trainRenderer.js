import { SCREEN_DIMENSIONS } from "../../screenDimensions.js";
import { VAGONS_PER_PEEPS } from "../../enums/wagonsPerPeeps.js";

export function createTrainRenderer(app, camera, getGridScale, cellSize, addMoney, calcBisonProfitForPath) {
    const trainContainer = new PIXI.Container();
    trainContainer.zIndex = 5;
    app.stage.addChild(trainContainer);

    const trains = [];

    let trainSpeedMultiplier = 1.0;
    
    function setTrainSpeedMultiplier(multiplier) {
        trainSpeedMultiplier = multiplier;
        for (const train of trains) {
            train.speed = TRAIN_SPEED * trainSpeedMultiplier;
        }
    }

    const TRAIN_SPEED = 15; /*3*/ 
    const TRAIN_SIZE = 0.6;
    const STATION_WAIT_TIME = 3500; //ms
    const WAGON_OFFSET = 0.75;

    let avgPeeps = 0;

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
                addMoney(bisonBonus);
            }
        }
    
        let profit = avgPeeps > 50 ? avgPeeps / 4 : avgPeeps / 2;
        addMoney(Math.round(profit));
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

    const trainGraphicsPool = [];
    let lastTrainPositions = [];

    function getPooledTrainGraphic() {
        return trainGraphicsPool.pop() || new PIXI.Graphics();
    }
    function returnTrainGraphic(g) {
        g.clear();
        trainGraphicsPool.push(g);
    }

    function drawTrains() {
        while (trainContainer.children.length > 0) {
            returnTrainGraphic(trainContainer.removeChildAt(0));
        }

        if (trains.length === 0) return;

        const gridScale = getGridScale();
        const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);
        const offset = cellSize * (1 - TRAIN_SIZE) / 2;
        const size = cellSize * TRAIN_SIZE;

        for (const train of trains) {
            const { x: wx, y: wy } = getInterpolatedWorldPos(train);
            const screenX = wx - dimensions.worldLeft;
            const screenY = wy - dimensions.worldTop;

            const g = getPooledTrainGraphic();
            g.beginFill(train.color, 1);
            g.drawRect(screenX + offset, screenY + offset, size, size);
            g.endFill();

            //klikaci
            g.interactive = true;
            g.cursor = 'pointer';
            g.removeAllListeners();
            g.on('pointerdown', (e) => {
            e.stopPropagation();
            resetTrainToStation(train);
            });

            trainContainer.addChild(g);

            for (const wagon of train.wagons) {
                const wagonProgress = train.progress + wagon.progress * train.direction;
                const { x: wwx, y: wwy } = getWagonWorldPos(train, wagonProgress);
                const wsx = wwx - dimensions.worldLeft;
                const wsy = wwy - dimensions.worldTop;

                const wg = getPooledTrainGraphic();
                wg.beginFill(train.color, 0.75);
                wg.drawRect(wsx + offset, wsy + offset, size, size);
                wg.endFill();

                //klikaci
                wg.interactive = true;
                wg.cursor = 'pointer';
                wg.removeAllListeners();
                wg.on('pointerdown', (e) => {
                    e.stopPropagation();
                    resetTrainToStation(train);
                });

                trainContainer.addChild(wg);
            }
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

    return { addTrain, clearTrains, markDirty, hasTrainForRoute, removeTrainForRoute, drawTrains, setTrainSpeedMultiplier};
}