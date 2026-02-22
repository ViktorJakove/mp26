import { createAreaRenderer } from "../renderers/areaRenderer.js";
import { createStationRenderer } from "../renderers/stationRenderer.js";
import { createRailRenderer } from "../renderers/railRenderer.js";
import{ createPointerTextRenderer } from "../renderers/pointerTextRenderer.js";
import { createTrainRenderer } from "../renderers/trainRenderer.js";
import { createHUDRenderer } from "../renderers/hudRenderer.js";


//init
export function creatRenderers(app, camera,getGridScale,cellSize,getAreas,getLevel, addMoney, subMoney, getMoney, getPlacementMode, getRelations,setRelations) {
    
    //pointer hint
    const pointerTextRenderer = createPointerTextRenderer(app);
    window.pointerTextRenderer = pointerTextRenderer;

    //areas
    const areaRenderer = createAreaRenderer(app, camera, getGridScale, cellSize);
    //nadry
    const stationRenderer = createStationRenderer(app, camera, getGridScale, cellSize);
    //kolejs
    const railRenderer = createRailRenderer(app, camera, getGridScale, cellSize,getAreas,getLevel,getMoney, addMoney, getRelations, setRelations);
    //vlaky
    const trainRenderer = createTrainRenderer(app, camera, getGridScale, cellSize, addMoney, railRenderer.getBisonProfit);

    const hudRenderer = createHUDRenderer(app, getGridScale, getMoney, getPlacementMode);

    return {areaRenderer,stationRenderer,railRenderer,pointerTextRenderer, trainRenderer, hudRenderer};
}