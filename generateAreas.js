import { Area } from "./area.js";
import { AREA_TYPES } from "./areaTypes.js";
import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";
import { CITY_GEN_DATA } from "./mapGenData/cityGenData.js";
import { LAKE_GEN_DATA, FOREST_GEN_DATA, MOUNTAIN_GEN_DATA, INDIAN_GEN_DATA, BISON_GEN_DATA } from "./mapGenData/natureGenData.js";

export const generateAreas = (level, areas) => {
    const citiesToGenerate = CITY_GEN_DATA.slice(0, AREA_GEN_DATA.cityCount[level]);
    const lakesToGenerate = LAKE_GEN_DATA.slice(0, AREA_GEN_DATA.lakeCount[level]);
    const forestsToGenerate = FOREST_GEN_DATA.slice(0, AREA_GEN_DATA.forestCount[level]);
    const mountainsToGenerate = MOUNTAIN_GEN_DATA.slice(0, AREA_GEN_DATA.mountainCount[level]);
    const indiansToGenerate = INDIAN_GEN_DATA.slice(0, AREA_GEN_DATA.indianAreasCount[level]);
    const bisonsToGenerate = BISON_GEN_DATA.slice(0, AREA_GEN_DATA.bisonAreasCount[level]);
    const merge = [];

    console.log(citiesToGenerate);
    citiesToGenerate.forEach(city => {
        console.log(city.name);
    });

    const allAreas = merge.concat(
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

    //pokud trva moc dlouho- reset
    let cycles = 0;
    sortedAreas.forEach((area, index) => {
        let x, y;
        do {
            cycles++;
            x = getRandom(-AREA_GEN_DATA.areaSize[level][0] / 2 + 1, AREA_GEN_DATA.areaSize[level][0] / 2 - 1 - area.sizeX);
            y = getRandom(-AREA_GEN_DATA.areaSize[level][1] / 2 + 1, AREA_GEN_DATA.areaSize[level][1] / 2 - 1 - area.sizeY);
        } while (placedAreas.some((placedArea, placedIndex) =>
            (x < placedArea.x + placedArea.sizeX + 1 &&
                x + area.sizeX > placedArea.x + 1 &&
                y < placedArea.y + placedArea.sizeY + 1 &&
                y + area.sizeY > placedArea.y + 1) || (Math.abs(index - placedIndex) === 1 && Math.abs(x - placedArea.x) < 10)
        ));
        placedAreas.push(new Area(
            area.type,
            x,
            y,
            area.sizeX,
            area.sizeY,
            area.name,
            area.type === AREA_TYPES.CITY ? getRandom(area.peepsMin, area.peepsMax) : 0

        ));
    });
    return placedAreas;
}

function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.random() * (max - min) + min);
}