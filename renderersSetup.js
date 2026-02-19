import { createAreaRenderer } from "./utils/renderers/areaRenderer.js";
import { createStationRenderer } from "./utils/renderers/stationRenderer.js";
import { createRailRenderer } from "./utils/renderers/railRenderer.js";
import{ createPointerTextRenderer } from "./utils/renderers/pointerTextRenderer.js";

//init
export function creatRenderers(app, camera,getGridScale,cellSize){
    
    //pointer hint
    const pointerTextRenderer = createPointerTextRenderer(app);
    window.pointerTextRenderer = pointerTextRenderer;

    //areas
    const areaRenderer = createAreaRenderer(app, camera, getGridScale, cellSize);
    //nadry
    const stationRenderer = createStationRenderer(app, camera, getGridScale, cellSize);
    //kolejs
    const railRenderer = createRailRenderer(app, camera, getGridScale, cellSize);

    return {areaRenderer,stationRenderer,railRenderer,pointerTextRenderer};
}