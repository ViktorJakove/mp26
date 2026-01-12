import { Area } from "./area.js";
import { AREA_TYPES } from "./areaTypes.js";
import { SCREEN_DIMENSIONS } from "./screenDimensions.js";
import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";
import { CITY_GEN_DATA } from "./mapGenData/cityGenData.js";

export const generateAreas = (level , areas) => {
    //vygenerovat mesta - podle velikosti- od nejetsiho po nejmensi
    const citiesToGenerate = CITY_GEN_DATA.slice(0, AREA_GEN_DATA.cityCount[level]);
    const sortedCities = citiesToGenerate.sort((a, b) => (b.sizeX * b.sizeY) - (a.sizeX * a.sizeY));
    sortedCities.forEach((city, index) => {
        console.log(`City ${index + 1}: ${city.cityName}, Size: ${city.sizeX * city.sizeY}`);
    });
    return areas;
}