import { createAreaRenderer } from "../renderers/areaRenderer.js";
import { createStationRenderer } from "../renderers/stationRenderer.js";
import { createRailRenderer } from "../renderers/railRenderer.js";
import{ createPointerTextRenderer } from "../renderers/pointerTextRenderer.js";
import { createTrainRenderer } from "../renderers/trainRenderer.js";

//init
export function creatRenderers(app, camera,getGridScale,cellSize,getAreas,getLevel){
    
    //pointer hint
    const pointerTextRenderer = createPointerTextRenderer(app);
    window.pointerTextRenderer = pointerTextRenderer;

    //areas
    const areaRenderer = createAreaRenderer(app, camera, getGridScale, cellSize);
    //nadry
    const stationRenderer = createStationRenderer(app, camera, getGridScale, cellSize);
    //kolejs
    const railRenderer = createRailRenderer(app, camera, getGridScale, cellSize,getAreas,getLevel);
    //vlaky
    const trainRenderer = createTrainRenderer(app, camera, getGridScale, cellSize);

    return {areaRenderer,stationRenderer,railRenderer,pointerTextRenderer, trainRenderer};
}