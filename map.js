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
const { areaRenderer, stationRenderer, railRenderer, pointerTextRenderer } = renderers;

//graphics
const fgContainer = new PIXI.Container();
fgContainer.zIndex = 10;
const { getHighlightedTile } = setupTileHighlight(app, camera, () => gridScale, cellSize, () => drawGraphics(), areas);
const{ drawGraphics } = createDrawGraphics(app, camera, getGridScale, cellSize, getLevel, getHighlightedTile, getPlacementMode, getAreas, renderers, fgContainer);

const { addLevel, addStations } = createStationManager(stationRenderer, areaRenderer, drawGraphics, getAreas, getLevel, setLevel);

const {checkRouteConnections} = createRouteChecker(stationRenderer, railRenderer);
railRenderer.setOnRailPlaceCheckConn(()=>{
    const result = checkRouteConnections();
    const allConnected = result.length > 0 && result.every(route => route.connected);
    if(allConnected)addStations();
})


//init draw
drawGraphics();

//mouse controls
const { resetDrag } = setupMouseControls(app, camera, getGridScale, cellSize, getPlacementMode, railRenderer, () => drawGraphics());

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

    drawGraphics();
}
window.addEventListener("resize", () => {
    updateStageHitArea();
});

// init funkci!!!
const keyboardMapMovement = keyboardControls(camera, zoomSpeed, gridScale, mapZoom, drawGraphics, addLevel, addStations, { get placementMode() { return placementMode; }, set placementMode(value) { placementMode = value; } }, areaRenderer, pointerTextRenderer, resetDrag, stationRenderer);

app.ticker.add(() => {
    keyboardMapMovement();
});