import { Area } from "./area.js";
import { AREA_TYPES } from "./areaTypes.js";
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
    const forestsToGenerate = FOREST_GEN_DATA.slice(0, AREA_GEN_DATA.forestCount[level]);
    const mountainsToGenerate = MOUNTAIN_GEN_DATA.slice(0, AREA_GEN_DATA.mountainCount[level]);
    const indiansToGenerate = INDIAN_GEN_DATA.slice(0, AREA_GEN_DATA.indianAreasCount[level]);
    const bisonsToGenerate = BISON_GEN_DATA.slice(0, AREA_GEN_DATA.bisonAreasCount[level]);

    const allAreas = [].concat(
        citiesToGenerate.map(area => ({ ...area, type: AREA_TYPES.CITY })),
        lakesToGenerate.map(area => ({ ...area, type: AREA_TYPES.LAKE })),
        forestsToGenerate.map(area => ({ ...area, type: AREA_TYPES.FOREST })),
        mountainsToGenerate.map(area => ({ ...area, type: AREA_TYPES.ROCK })),
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
            const collision = placedAreas.some((placedArea, placedIndex) =>
                !((x + area.sizeX+1 <= placedArea.x || x >= placedArea.x + placedArea.sizeX+1) &&
                (y + area.sizeY-1 <= placedArea.y || y >= placedArea.y + placedArea.sizeY-1))
            );

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
    return placedAreas;
}

function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.random() * (max - min) + min);
}