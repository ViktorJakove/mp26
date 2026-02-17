import { SCREEN_DIMENSIONS } from "./screenDimensions.js";
import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";
import { generateAreas } from "./generateAreas.js";
import { keyboardControls } from "./utils/keyboardHandler.js";
import { setupTileHighlight } from "./utils/highlightTile.js";
import { createAreaRenderer } from "./utils/areaRenderer.js";

//pixi setup
const app = new PIXI.Application({
    resizeTo: window,
    autoDensity: true,
    backgroundColor: 0xeeeeee,
    antialias: true
});
document.body.appendChild(app.view);
document.body.style.margin = "0";
document.body.style.overflow = "hidden";
document.documentElement.style.margin = "0";
document.documentElement.style.overflow = "hidden";

app.stage.sortableChildren = true;
app.stage.interactive = true;
app.stage.hitArea = app.screen;

//camera
const camera = { x: 0, y: 0 };

//zoom valeus
let gridScale = 1;
const zoomSpeed = 0.1;
const minScale = 0.2;
const maxScale = 2.5;

//grid setup
const cellSize = 50;
const grid = new PIXI.Graphics();
app.stage.addChild(grid);

let level = 0;
let placementMode = false;

let areas = [];
areas = generateAreas(level, null);

const { getHighlightedTile } = setupTileHighlight(app, camera, () => gridScale, cellSize, drawGraphics, areas);

// Create area renderer
const areaRenderer = createAreaRenderer(app, camera, () => gridScale, cellSize);

function drawGrid() {
    grid.clear();
    if (!placementMode) return;

    const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);

    //grid lines
    grid.lineStyle(1, 0x999999);
    for (let worldX = dimensions.startX; worldX <= dimensions.worldRight + cellSize; worldX += cellSize) {
        const screenX = worldX - dimensions.worldLeft;
        grid.moveTo(screenX, 0);
        grid.lineTo(screenX, dimensions.screenHeight);
    }

    for (let worldY = dimensions.startY; worldY <= dimensions.worldBottom + cellSize; worldY += cellSize) {
        const screenY = worldY - dimensions.worldTop;
        grid.moveTo(0, screenY);
        grid.lineTo(dimensions.screenWidth, screenY);
    }
    //highlight
    drawHighlight(dimensions);
    
}
function drawHighlight(dimensions){
    const highlightedTile = getHighlightedTile();
    if (highlightedTile) {
        const screenX = highlightedTile.x * cellSize - dimensions.worldLeft;
        const screenY = highlightedTile.y * cellSize - dimensions.worldTop;

        let tileColor = highlightedTile.obstacle ? highlightedTile.buildOverColor : 0xffcc00;
        grid.beginFill(tileColor,0.5);
        grid.drawRect(screenX, screenY, cellSize, cellSize);
        grid.endFill();
    }
}

const fgContainer = new PIXI.Container();
fgContainer.zIndex = 10;

function drawForeground() {
    const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);
    fgContainer.removeChildren();

    const fgMapEdge = new PIXI.Graphics();
    fgMapEdge.beginFill(0xd3d3d3);
    fgMapEdge.drawRect(0, 0, dimensions.screenWidth, dimensions.screenHeight);
    fgContainer.addChild(fgMapEdge);

    const holeWidth = AREA_GEN_DATA.areaSize[level][0] * cellSize;
    const holeHeight = AREA_GEN_DATA.areaSize[level][1] * cellSize;

    const holeStartX = -holeWidth / 2;
    const holeStartY = -holeHeight / 2;

    const holeEndX = holeWidth / 2;
    const holeEndY = holeHeight / 2;

    const screenHoleStartX = holeStartX - dimensions.worldLeft;
    const screenHoleStartY = holeStartY - dimensions.worldTop;
    const screenHoleEndX = holeEndX - dimensions.worldLeft;
    const screenHoleEndY = holeEndY - dimensions.worldTop;

    const isOverlapping = screenHoleEndX > 0 && screenHoleStartX < dimensions.screenWidth && screenHoleEndY > 0 && screenHoleStartY < dimensions.screenHeight;

    if (isOverlapping) {
        const bgMask = new PIXI.Graphics();
        bgMask.beginFill(0x000000);
        bgMask.drawRect(0, 0, dimensions.screenWidth, dimensions.screenHeight);
        bgMask.beginHole();
        bgMask.drawRect(Math.max(0, screenHoleStartX),Math.max(0, screenHoleStartY),Math.min(dimensions.screenWidth, screenHoleEndX) - Math.max(0, screenHoleStartX),Math.min(dimensions.screenHeight, screenHoleEndY) - Math.max(0, screenHoleStartY)
        );
        bgMask.endHole();
        bgMask.endFill();

        fgContainer.mask = bgMask;
        fgContainer.addChild(bgMask);
    } else {
        fgContainer.mask = null;
    }

    app.stage.addChild(fgContainer);
}

function drawGraphics(){
    drawGrid();
    areaRenderer.drawAreas(areas);
    drawForeground();
}

//init draw
drawGraphics();

function addLevel(){
    console.log("adding level");
    level++;
    areas.push(...generateAreas(level, areas[areas.length - 1]));
    areaRenderer.markDirty();
}

//mouse controls
let isDragging = false;
let mouseInitialPos = { x: 0, y: 0 };

app.stage.on('pointerdown', (event) => {
    const button = event.data.button;
    if (placementMode ? (button === 2) : (button === 0 || button === 2)) {
        isDragging = true;
        mouseInitialPos = { x: event.data.global.x, y: event.data.global.y };
    }
});

app.stage.on('pointerup', (event) => {
    const button = event.data.button;
    if (placementMode ? (button === 2) : (button === 0 || button === 2)) {
        isDragging = false;
    }
});

app.stage.on('pointerupoutside', () => {
    isDragging = false;
});

app.stage.on('pointermove', (event) => {
    if (isDragging) {
        const dx = (event.data.global.x - mouseInitialPos.x) / gridScale;
        const dy = (event.data.global.y - mouseInitialPos.y) / gridScale;

        camera.x -= dx;
        camera.y -= dy;

        mouseInitialPos = { x: event.data.global.x, y: event.data.global.y };

        drawGraphics();
    }
});

//blokace okynka
app.view.addEventListener("contextmenu", (event) => {
    //TEMP FIX DEBUG SMAZONA
    //event.preventDefault();
});

//zoom
app.view.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    mapZoom(zoomFactor, event);
});

function updateStageHitArea() {
    app.stage.hitArea = new PIXI.Rectangle(
        0,
        0,
        app.screen.width / gridScale,
        app.screen.height / gridScale
    );
}

// init
updateStageHitArea();

function mapZoom(zoomFactor, event){
    console.log("zooming");
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

    drawGraphics();
}
window.addEventListener("resize", () => {
    updateStageHitArea();
});

// init funkci!!!
const keyboardMapMovement = keyboardControls(camera, zoomSpeed, gridScale, mapZoom, drawGraphics, addLevel, { get placementMode() { return placementMode; }, set placementMode(value) { placementMode = value; } });

app.ticker.add(() => {
    keyboardMapMovement();
});