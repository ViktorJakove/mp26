import { generateAreas } from "./generateAreas.js";
import { keyboardControls } from "./utils/keyboardHandler.js";
import { setupTileHighlight } from "./utils/highlightTile.js";
import { createApp } from "./utils/setup/appSetup.js";
import { createCamera, createZoomValues } from "./camera.js";
import { creatRenderers } from "./utils/setup/renderersSetup.js";
import { createDrawGraphics } from "./drawGraphics.js";
import { setupMouseControls } from "./mouseControls.js";
import { createStationManager } from "./stationManager.js";
import { createRouteChecker } from "./utils/routeChecker.js";
import { createRailSelectorRenderer } from "./utils/renderers/railSeclectorRenderer.js";

//pixi setup
const app = createApp();

//camera
const camera = createCamera();

//zoom valeus
const { gridScale: initScale, zoomSpeed, minScale, maxScale } = createZoomValues();
let gridScale = initScale;
const cellSize = 50;

let level = 0;
let placementMode = false;

let areas = [];
areas = generateAreas(level, null);

const getGridScale = () => gridScale;
const getPlacementMode = () => placementMode;
const getLevel = () => level;
const setLevel = (value) => level = value;
const getAreas = () => areas;

//rends
const renderers = creatRenderers(app, camera, getGridScale, cellSize, getAreas, getLevel);
const { areaRenderer, stationRenderer, railRenderer, pointerTextRenderer, trainRenderer } = renderers;
const railSelector = createRailSelectorRenderer(app,getGridScale);

//graphics
const fgContainer = new PIXI.Container();
fgContainer.zIndex = 10;
const { getHighlightedTile } = setupTileHighlight(app, camera, () => gridScale, cellSize, () => drawGraphics(), areas);
const{ drawGraphics } = createDrawGraphics(app, camera, getGridScale, cellSize, getLevel, getHighlightedTile, getPlacementMode, getAreas, renderers, fgContainer,trainRenderer);

const { addLevel, addStations, spawnTrainsForConnectedRoutes } = createStationManager(stationRenderer, areaRenderer, drawGraphics, getAreas, getLevel, setLevel, railRenderer, trainRenderer);

const {checkRouteConnections} = createRouteChecker(stationRenderer, railRenderer);

railRenderer.setOnRailPlaceCheckConn(()=>{
    const result = checkRouteConnections();

    const connectedIndices = result.filter(r => r.connected).map(r => r.routeIndex);
    spawnTrainsForConnectedRoutes(connectedIndices);

    const allConnected = result.length > 0 && result.every(r => r.connected);
    if (allConnected) addStations();
})


//init draw
drawGraphics();

//mouse controls
const { resetDrag } = setupMouseControls(app, camera, getGridScale, cellSize, getPlacementMode, railRenderer, () => drawGraphics(), ()=>railSelector.getSelectedType());

//zoom
app.view.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    mapZoom(zoomFactor, event);
});

function updateStageHitArea() {
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width / gridScale, app.screen.height / gridScale);
}

function mapZoom(zoomFactor, event){
    const newScale = Math.min(maxScale, Math.max(minScale, gridScale * zoomFactor));
    
    if(event){
        const mouseX = event.clientX - app.screen.width / 2;
        const mouseY = event.clientY - app.screen.height / 2;
        const worldMouseX = camera.x + mouseX / gridScale;
        const worldMouseY = camera.y + mouseY / gridScale;
        
        camera.x = worldMouseX - mouseX / newScale;
        camera.y = worldMouseY - mouseY / newScale;
    }

    gridScale = newScale;
    app.stage.scale.set(gridScale, gridScale, cellSize);
    updateStageHitArea();
    areaRenderer.markDirty();
    stationRenderer.markDirty();
    railRenderer.markDirty();

    pointerTextRenderer.refresh(() => gridScale);
    railSelector.draw();

    drawGraphics();
}
window.addEventListener("resize", () => {
    updateStageHitArea();
});

// init funkci!!!
const keyboardMapMovement = keyboardControls(camera, zoomSpeed, gridScale, mapZoom, drawGraphics, addLevel, addStations, { get placementMode() { return placementMode; }, set placementMode(value) { placementMode = value; } }, areaRenderer, pointerTextRenderer, resetDrag, stationRenderer,railSelector);

app.ticker.add(() => {
    keyboardMapMovement();
});