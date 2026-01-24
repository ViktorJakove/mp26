import { Area } from "./area.js";
import { AREA_TYPES } from "./enums/areaTypes.js";
import { DIRECTIONS } from "./enums/directionEnum.js";
import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";
import { CITY_GEN_DATA } from "./mapGenData/cityGenData.js";
import { LAKE_GEN_DATA, FOREST_GEN_DATA, MOUNTAIN_GEN_DATA, INDIAN_GEN_DATA, BISON_GEN_DATA } from "./mapGenData/natureGenData.js";

export const generateAreas = (level, areas) => {
    while (true) {
        const result = tryGeneration(level);
        if (result) return result;
        console.log("regenerating areas");
    }
}

function tryGeneration(level){
    const citiesToGenerate = CITY_GEN_DATA.slice(0, AREA_GEN_DATA.cityCount[level]);
    const lakesToGenerate = LAKE_GEN_DATA.slice(0, AREA_GEN_DATA.lakeCount[level]);
    const indiansToGenerate = INDIAN_GEN_DATA.slice(0, AREA_GEN_DATA.indianAreasCount[level]);
    const bisonsToGenerate = BISON_GEN_DATA.slice(0, AREA_GEN_DATA.bisonAreasCount[level]);

    const allAreas = [].concat(
        citiesToGenerate.map(area => ({ ...area, type: AREA_TYPES.CITY, orderInDoc: citiesToGenerate.indexOf(area) })),
        lakesToGenerate.map(area => ({ ...area, type: AREA_TYPES.LAKE })),
        indiansToGenerate.map(area => ({ ...area, type: AREA_TYPES.INDIANS })),
        bisonsToGenerate.map(area => ({ ...area, type: AREA_TYPES.BISONS }))
    );

    //od nejvetsiho po nejmensi bez lesu a hor
    const sortedAreas = allAreas.sort((a, b) => (b.sizeX * b.sizeY) - (a.sizeX * a.sizeY));
    const placedAreas = [];

    for (const area of sortedAreas) {
        let cycles = 0;
        const maxCycles = 1000;
        let placed = false;

        while(cycles < maxCycles){
            cycles++;

            const x = getRandom(-AREA_GEN_DATA.areaSize[level][0] / 2 + 1, AREA_GEN_DATA.areaSize[level][0] / 2 - 1 - area.sizeX);
            const y = getRandom(-AREA_GEN_DATA.areaSize[level][1] / 2 + 1, AREA_GEN_DATA.areaSize[level][1] / 2 - 1 - area.sizeY);
            const collision = placedAreas.some((placedArea) =>{
                
                //overlap check
                if(!((x + area.sizeX+1 <= placedArea.x || x >= placedArea.x + placedArea.sizeX+1) &&
                (y + area.sizeY-1 <= placedArea.y || y >= placedArea.y + placedArea.sizeY-1))) return true;
                
                //city doc-neighbor distance check
                const MIN_CITY_XDISTANCE = AREA_GEN_DATA.areaSize[level][0]/4;
                console.log(MIN_CITY_XDISTANCE);

                if(area.type === AREA_TYPES.CITY && placedArea.type === AREA_TYPES.CITY){
                    const placedAreaOrderInDoc = CITY_GEN_DATA.findIndex(city => city.name === placedArea.name);
                    return Math.abs(area.orderInDoc - placedAreaOrderInDoc) === 1 && Math.min(Math.abs(x - placedArea.x),Math.abs(x + area.sizeX - placedArea.x),Math.abs(x - placedArea.x + placedArea.sizeX)) <= MIN_CITY_XDISTANCE;
                }
            });

            if(!collision){
                placedAreas.push(new Area(
                    area.type,
                    x,
                    y,
                    area.sizeX,
                    area.sizeY,
                    area.name,
                    area.type === AREA_TYPES.CITY ? getRandom(area.peepsMin, area.peepsMax) : 0
                ));
                placed = true;
                break;
            }
        }

        if (!placed)return null;
    };
    
    const forestsToGenerate = FOREST_GEN_DATA.slice(0, AREA_GEN_DATA.forestCount[level]);
    const mountainsToGenerate = MOUNTAIN_GEN_DATA.slice(0, AREA_GEN_DATA.mountainCount[level]);
    const allSnakeAreas = [].concat(
        forestsToGenerate.map(area => ({ ...area, type: AREA_TYPES.FOREST })),
        mountainsToGenerate.map(area => ({ ...area, type: AREA_TYPES.ROCK }))
    );

    const sortedSnakeAreas = allSnakeAreas.sort((a, b) => (b.thickness * b.length) - (a.length * a.thickness));
    const placedSnakeAreaParts = [];

    for (const area of sortedSnakeAreas) {
        let x = getRandom(-AREA_GEN_DATA.areaSize[level][0] / 2 + 1,AREA_GEN_DATA.areaSize[level][0] / 2 - 1);
        let y = getRandom(-AREA_GEN_DATA.areaSize[level][1] / 2 + 1,AREA_GEN_DATA.areaSize[level][1] / 2 - 1);

        let lastDir = null;
    
        for (let i = 0; i < area.length; i++) {
            let placed = false;
            let cycles = 0;
            const maxCycles = area.length * area.thickness * 3;
    
            while (!placed && cycles < maxCycles) {
                cycles++;

                //smer (pro sutry neopakujici se - jsou min rovny)
                let OKdirections = DIRECTIONS;

                if(area.type === AREA_TYPES.ROCK && lastDir){
                    OKdirections = DIRECTIONS.filter(d => !isOppositeDir(d, lastDir));
                }
                const dir = OKdirections[getRandom(0, OKdirections.length - 1)];
                const newX = x + dir.xChange * area.thickness;
                const newY = y + dir.yChange * area.thickness;

                const withinBounds = (
                    newX >= -AREA_GEN_DATA.areaSize[level][0] / 2 &&
                    newX + area.thickness <= AREA_GEN_DATA.areaSize[level][0] / 2 &&
                    newY >= -AREA_GEN_DATA.areaSize[level][1] / 2 &&
                    newY + area.thickness <= AREA_GEN_DATA.areaSize[level][1] / 2
                );
    
                const collision = squareCollides(
                    newX,
                    newY,
                    area.thickness,
                    placedAreas,
                    placedSnakeAreaParts
                );
    
                if (withinBounds && !collision) {
                    for (let dx = 0; dx < area.thickness; dx++) {
                        for (let dy = 0; dy < area.thickness; dy++) {

                            if (!shouldPlaceTile(area)) continue;
                            placedSnakeAreaParts.push(
                                new Area(
                                    area.type,
                                    newX + dx,
                                    newY + dy,
                                    1,
                                    1,
                                    area.name,
                                    0
                                )
                            );
                        }
                    }
                    x = newX;
                    y = newY;
                    placed = true;
                }
            }
    
            if (!placed) return null;
        }
    }
    
    return placedAreas.concat(placedSnakeAreaParts);
}

function squareCollides(x, y, size, placedAreas, placedSnakeParts) {
    //areas
    if (placedAreas.some(pa =>
        x < pa.x + pa.sizeX + 1 &&
        x + size > pa.x - 1 &&
        y < pa.y + pa.sizeY + 1 &&
        y + size > pa.y - 1
    )) return true;
    
    //snakes
    for (let dx = 0; dx < size; dx++) {
        for (let dy = 0; dy < size; dy++) {
            if (placedSnakeParts.some(p => p.x === x + dx && p.y === y + dy)) {
                return true;
            }
        }
    }

    return false;
}

function shouldPlaceTile(area) {
    const chance = area.type === AREA_TYPES.FOREST ? 0.2 : 0.05;
    return !(area.thickness > 1 && Math.random() < chance);
}

function isOppositeDir(dirA, dirB) {
    return dirA.xChange === -dirB.xChange &&
           dirA.yChange === -dirB.yChange;
}

function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.random() * (max - min) + min);
}