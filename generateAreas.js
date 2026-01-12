import { Area } from "./area.js";
import { AREA_TYPES } from "./areaTypes.js";
import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";
import { CITY_GEN_DATA } from "./mapGenData/cityGenData.js";

export const generateAreas = (level , areas) => {
    //vygenerovat mesta - podle velikosti- od nejetsiho po nejmensi
    const citiesToGenerate = CITY_GEN_DATA.slice(0, AREA_GEN_DATA.cityCount[level]);
    const sortedCities = citiesToGenerate.sort((a, b) => (b.sizeX * b.sizeY) - (a.sizeX * a.sizeY));
    const placedCities = [];
    sortedCities.forEach((city, index) => {
        let x, y;
        do {
            x = getRandom(-AREA_GEN_DATA.areaSize[level][0]/2+1, AREA_GEN_DATA.areaSize[level][0]/2-1 - city.sizeX);
            y = getRandom(-AREA_GEN_DATA.areaSize[level][1]/2+1, AREA_GEN_DATA.areaSize[level][1]/2-1 - city.sizeY);
        } while (placedCities.some((placedCity, placedIndex) => 
            (x < placedCity.x + placedCity.sizeX + 1 &&
            x + city.sizeX > placedCity.x + 1 &&
            y < placedCity.y + placedCity.sizeY + 1 &&
            y + city.sizeY > placedCity.y + 1) || (Math.abs(index - placedIndex) === 1 && Math.abs(x-placedCity.x)<10)
        ));
        placedCities.push(new Area(AREA_TYPES.CITY, x, y, city.sizeX, city.sizeY, city.cityName, getRandom(city.peepsMin, city.peepsMax)));
    });
    return placedCities;
}

function getRandom(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.round(Math.floor(Math.random() * (max - min)) + min);
}