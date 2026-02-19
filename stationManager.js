import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";
import { ROUTES_DATA, ROUTE_COUNT_DATA } from "./mapGenData/routesData.js";
import { CITY_GEN_DATA } from "./mapGenData/cityGenData.js";
import { ColorGenerator } from "./utils/colorGenerator.js";
import { generateAreas } from "./generateAreas.js";

export function createStationManager(stationRenderer, areaRenderer, drawGraphics, getAreas, getLevel, setLevel, railRenderer) {
    let stationLevel = 0;
    const colorGen = new ColorGenerator({ sat: 0.6, light: 0.43 });

    function addLevel() {
        console.log("adding level");
        const areas = getAreas();
        const level = getLevel() + 1;
        areas.push(...generateAreas(level, areas[areas.length - 1]));
        setLevel(level);
        areaRenderer.markDirty();
        stationRenderer.markDirty();
    }

    function addStations() {
        const areas = getAreas();
        const level = getLevel();

        let indexFirst = 0;
        for (let i = 0; i < stationLevel; i++) {
            indexFirst += ROUTE_COUNT_DATA[i];
        }

        const halfW = AREA_GEN_DATA.areaSize[level][0] / 2;
        const halfH = AREA_GEN_DATA.areaSize[level][1] / 2;

        let stationIndex = 0;
        for (let i = indexFirst; i < indexFirst + ROUTE_COUNT_DATA[stationLevel]; i++) {
            const cityA = CITY_GEN_DATA[ROUTES_DATA[i][0]].name;
            const cityB = CITY_GEN_DATA[ROUTES_DATA[i][1]].name;
            console.log(cityA + "-" + cityB);

            const routeColor = Math.floor(colorGen.next(), 0.5);
            [cityA, cityB].forEach(cityName => {
                const cityArea = areas.find(a => a.name === cityName);

                const distToLeft   = cityArea.x + halfW;
                const distToRight  = halfW - (cityArea.x + cityArea.sizeX);
                const distToTop    = cityArea.y + halfH;
                const distToBottom = halfH - (cityArea.y + cityArea.sizeY);
                const minDist = Math.min(distToLeft, distToRight, distToTop, distToBottom);

                const blockedSides = {
                    left:   distToLeft   === minDist,
                    right:  distToRight  === minDist,
                    top:    distToTop    === minDist,
                    bottom: distToBottom === minDist,
                };

                const adjacentTiles = [];
                for (let tx = cityArea.x; tx < cityArea.x + cityArea.sizeX; tx++) {
                    if (!blockedSides.top)    adjacentTiles.push({ x: tx, y: cityArea.y - 1 });
                    if (!blockedSides.bottom) adjacentTiles.push({ x: tx, y: cityArea.y + cityArea.sizeY });
                }
                for (let ty = cityArea.y; ty < cityArea.y + cityArea.sizeY; ty++) {
                    if (!blockedSides.left)  adjacentTiles.push({ x: cityArea.x - 1, y: ty });
                    if (!blockedSides.right) adjacentTiles.push({ x: cityArea.x + cityArea.sizeX, y: ty });
                }
                adjacentTiles.sort(() => Math.random() - 0.5);

                const tile = adjacentTiles.find(t => !stationRenderer.isTileOccupied(t.x, t.y)) ?? adjacentTiles[0];
                stationRenderer.addStation(tile.x, tile.y, routeColor, stationIndex * 200, i);
                if(railRenderer.isTileOccupied(tile.x, tile.y))railRenderer.removeRail(tile.x, tile.y);
                stationIndex++;
            });
        }

        stationLevel++;
        drawGraphics();
    }

    return { addLevel, addStations };
}