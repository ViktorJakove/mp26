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
import { createCharacterOverlay } from "./utils/renderers/characterOverlay/characterOverlayRenderer.js";
import { createBankManager } from "./utils/bankManager.js";
import { createBisonManager } from "./utils/bisonManager.js";
import{createBisonProfitStore} from "./createBisonProfitStore.js";

const app = createApp();
app.stage.sortableChildren = true;

const camera = createCamera();

const { gridScale: initScale, zoomSpeed, minScale, maxScale } = createZoomValues();
let gridScale = initScale;
const cellSize = 50;

let level = 0;
let placementMode = false;

let money = 1000;
let relations = 1;

let areas = [];
areas = generateAreas(level, null);

const getGridScale = () => gridScale;
const getPlacementMode = () => placementMode;
const getLevel = () => level;
const setLevel = (value) => level = value;
const getAreas = () => areas;
const getRelations = () => relations;
const setRelations = (value) => relations = value;
const getMoney = () => money;
const subMoney = (amount) => money -= amount;
const addMoney = (amount) => money += amount;

let unlockedCities = new Set();

const getUnlockedCities = () => unlockedCities;

const unlockCity = (cityName) => {
    unlockedCities.add(cityName);
};
const isCityUnlocked = (cityName) => unlockedCities.has(cityName);

function getLoanTimerInfo() {
    if (window.bankManager) {
        return {
            isActive: window.bankManager.isLoanActive ? window.bankManager.isLoanActive() : false,
            formattedTime: window.bankManager.getFormattedTime ? window.bankManager.getFormattedTime() : "0:00"
        };
    }
    return { isActive: false, formattedTime: "0:00" };
}

//NEJPRVE renderers
const renderers = creatRenderers(
    app, 
    camera, 
    getGridScale, 
    cellSize, 
    getAreas, 
    getLevel, 
    addMoney, 
    subMoney, 
    getMoney, 
    getPlacementMode, 
    getRelations, 
    setRelations,
    getLoanTimerInfo
);

const { areaRenderer, stationRenderer, railRenderer, pointerTextRenderer, trainRenderer, hudRenderer } = renderers;

window.trainRenderer = trainRenderer;
window.hudRenderer = hudRenderer;

const bisonManager = createBisonManager(app, getAreas, railRenderer, hudRenderer);
window.bisonManager = bisonManager;
const bisonProfitStore = createBisonProfitStore();
window.bisonProfitStore = bisonProfitStore;

function onLoanExpired(expiredAmount, seizedMoney, remainingDebt) {
    
    if (hudRenderer) hudRenderer.markDirty();
}

const bankManager = createBankManager(
    app,
    getMoney,
    addMoney,
    subMoney,
    onLoanExpired,
    railRenderer,
    hudRenderer.markDirty
);

window.bankManager = bankManager;
bankManager.reset();

const characterOverlay = createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer, getMoney, subMoney, addMoney);

const fgContainer = new PIXI.Container();
fgContainer.zIndex = 10;
const { getHighlightedTile } = setupTileHighlight(app, camera, () => gridScale, cellSize, () => drawGraphics(), areas, getPlacementMode, bisonManager);
const { drawGraphics } = createDrawGraphics(app, camera, getGridScale, cellSize, getLevel, getHighlightedTile, getPlacementMode, getAreas, renderers, fgContainer);

const { addLevel, addStations, spawnTrainsForConnectedRoutes } = createStationManager(stationRenderer, areaRenderer, drawGraphics, getAreas, getLevel, setLevel, railRenderer, trainRenderer, unlockCity);

const { checkRouteConnections } = createRouteChecker(stationRenderer, railRenderer);

function findCityByStation(stationX, stationY, areas) {
    return areas.find(area => 
        area.type?.type === "city" &&
        stationX >= area.x - 1 && stationX <= area.x + area.sizeX &&
        stationY >= area.y - 1 && stationY <= area.y + area.sizeY
    );
}

railRenderer.setOnRailPlaceCheckConn(() => {
    const result = checkRouteConnections();

    const connectedIndices = result.filter(r => r.connected).map(r => r.routeIndex);
    spawnTrainsForConnectedRoutes(connectedIndices);

    const stations = stationRenderer.getStations();
    const areas = getAreas();

    connectedIndices.forEach(index => {
        const pair = stations.filter(s => s.index === index);
        if (pair.length === 2) {
            const city1 = findCityByStation(pair[0].x, pair[0].y, areas);
            const city2 = findCityByStation(pair[1].x, pair[1].y, areas);
            
            if (city1 && !isCityUnlocked(city1.name)) {
                unlockCity(city1.name);
            }
            if (city2 && !isCityUnlocked(city2.name)) {
                unlockCity(city2.name);
            }
            if(getLevel() === 0 && index === 5) {addLevel();console.log("Level up!")}
        }
    });

    const allConnected = result.length > 0 && result.every(r => r.connected);
    if (allConnected) addStations();
})

drawGraphics();
const { resetDrag } = setupMouseControls(
    app, 
    camera, 
    getGridScale, 
    cellSize, 
    getPlacementMode, 
    railRenderer, 
    () => drawGraphics(), 
    () => hudRenderer.getSelectedType(),
    characterOverlay,
    areas,
    stationRenderer,
    isCityUnlocked,
    unlockCity
);

document.addEventListener("keydown", (event) => {
    if (event.code === "Escape" && characterOverlay.isVisible()) {
        characterOverlay.hideOverlay();
    }
});

app.view.addEventListener("wheel", (event) => {
    if (characterOverlay.isVisible && characterOverlay.isVisible()) {
        event.preventDefault();
        return;
    }
    
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    mapZoom(zoomFactor, event);
});

function updateStageHitArea() {
    app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width / gridScale, app.screen.height / gridScale);
}

function mapZoom(zoomFactor, event) {
    const newScale = Math.min(maxScale, Math.max(minScale, gridScale * zoomFactor));
    
    if (event) {
        const mouseX = event.clientX - app.screen.width / 2;
        const mouseY = event.clientY - app.screen.height / 2;
        const worldMouseX = camera.x + mouseX / gridScale;
        const worldMouseY = camera.y + mouseY / gridScale;
        
        camera.x = worldMouseX - mouseX / newScale;
        camera.y = worldMouseY - mouseY / newScale;
    }

    gridScale = newScale;
    app.stage.scale.set(gridScale, gridScale);
    updateStageHitArea();
    areaRenderer.markDirty();
    stationRenderer.markDirty();
    railRenderer.markDirty();

    pointerTextRenderer.refresh(() => gridScale);
    hudRenderer.draw();
    characterOverlay.refresh();
    
    drawGraphics();
}

window.addEventListener("resize", () => {
    const oldWidth = app.screen.width;
    const oldHeight = app.screen.height;
    
    app.renderer.resize(window.innerWidth, window.innerHeight);
    
    const newWidth = app.screen.width;
    const newHeight = app.screen.height;
    
    const widthDiff = (newWidth - oldWidth) / 2 / gridScale;
    const heightDiff = (newHeight - oldHeight) / 2 / gridScale;
    
    camera.x -= widthDiff;
    camera.y -= heightDiff;
    
    updateStageHitArea();
    areaRenderer.markDirty();
    stationRenderer.markDirty();
    railRenderer.markDirty();
    hudRenderer.markDirty();
    if (trainRenderer) trainRenderer.markDirty();
    drawGraphics();
    if (characterOverlay.isVisible && characterOverlay.isVisible()) {
        const currentCity = characterOverlay.getCurrentCity ? characterOverlay.getCurrentCity() : null;
        if (currentCity) {
            characterOverlay.refresh();
        }
    }
});

const keyboardMapMovement = keyboardControls(camera, zoomSpeed, gridScale, mapZoom, drawGraphics, addLevel, addStations, { get placementMode() { return placementMode; }, set placementMode(value) { placementMode = value; } }, areaRenderer, pointerTextRenderer, resetDrag, stationRenderer, hudRenderer, characterOverlay);

app.ticker.add(() => {
    keyboardMapMovement();
});