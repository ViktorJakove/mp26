import { AREA_TYPES } from "./enums/areaTypes.js";
import { SCREEN_DIMENSIONS } from "./screenDimensions.js";
import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";
import { generateAreas } from "./generateAreas.js";
import { keyboardControls } from "./mapMovement.js";

const { CITY, LAKE, INDIANS, BISONS, FOREST, ROCK, LOCK } = AREA_TYPES;

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

let areas = [];
areas = generateAreas(level, null);

function drawGrid() {
    grid.clear();
    const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);

    // Draw grid lines
    grid.lineStyle(1, 0x999999); // Slightly darker grey for grid lines
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

const areaContainer = new PIXI.Container();
areaContainer.zIndex = 1;
const areaTextContainer = new PIXI.Container();
areaTextContainer.zIndex = 11;
app.stage.addChild(areaContainer);
app.stage.addChild(areaTextContainer);

function drawAreas() {
    areaContainer.removeChildren();
    areaTextContainer.removeChildren();

    const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);

    Object.values(areas).forEach((area, index) => {
        if(area.type === LOCK) return;

        const areaGraphics = new PIXI.Graphics();
        areaGraphics.beginFill(area.type.color, 0.5);

        const screenX = (area.x * cellSize) - dimensions.worldLeft;
        const screenY = (area.y * cellSize) - dimensions.worldTop;

        areaGraphics.drawRect(screenX, screenY, area.sizeX * cellSize, area.sizeY * cellSize);
        areaGraphics.endFill();
        areaContainer.addChild(areaGraphics);

        if (gridScale > 0.7) return;
        if ((area.type === FOREST || area.type === ROCK)) {
            if (Object.values(areas).findIndex(part => part.name === area.name) !== index) {
                return;
            }
        }

        const textPosition = getAreaTextPosition(area, dimensions, Object.values(areas), screenX, screenY);
        
        const areaText = new PIXI.Text(((area.type === BISONS) ? "bisons" : area.name)  + ((area.type === CITY || area.type === BISONS) ? '\n' + "population : " + area.peeps : ""),{ fontFamily: "Arial", fontSize: 14, fill: 0x000000 });
        areaText.x = textPosition.textX;
        areaText.y = textPosition.textY;
        areaText.anchor.set(0.5);
        areaText.style.align = "center";
        areaText.scale.set(1 / gridScale,1/gridScale);
        
        areaTextContainer.addChild(areaText);
    });
}

function getAreaTextPosition(area, dimensions, areas, screenX, screenY) {
    let textX = screenX + area.sizeX * cellSize / 2;
    let textY = screenY + area.sizeY * cellSize / 2;

    if (area.type === FOREST || area.type === ROCK) {
        const snakeParts = areas.filter(part => part.name === area.name); //all parst
        const minX = Math.min(...snakeParts.map(part => part.x));
        const maxX = Math.max(...snakeParts.map(part => part.x + part.sizeX));
        const minY = Math.min(...snakeParts.map(part => part.y));
        const maxY = Math.max(...snakeParts.map(part => part.y + part.sizeY));

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;

        //nejblizsi cast hada k centru
        let closestTile = snakeParts[0];
        let closestDistance = Infinity;

        snakeParts.forEach(part => {
            const tileCenterX = (part.x + part.sizeX / 2);
            const tileCenterY = (part.y + part.sizeY / 2);
            const distance = Math.sqrt(
                Math.pow(centerX - tileCenterX, 2) + Math.pow(centerY - tileCenterY, 2)
            );

            if (distance < closestDistance) {
                closestDistance = distance;
                closestTile = part;
            }
        });

        textX = (closestTile.x + closestTile.sizeX / 2) * cellSize - dimensions.worldLeft;
        textY = (closestTile.y + closestTile.sizeY / 2) * cellSize - dimensions.worldTop;
    }

    return { textX, textY };
}

function drawGraphics(){
    drawGrid();
    drawAreas();
    drawForeground();
}

//init draw
drawGraphics();

function addLevel(){
    console.log("adding level");
    level++;
    areas.push(...generateAreas(level, areas[areas.length - 1]));
}

//mouse controls
let isDragging = false;
let mouseInitialPos = { x: 0, y: 0 };

app.view.addEventListener("mousedown", (event) => {
    isDragging = true;
    mouseInitialPos = { x: event.clientX, y: event.clientY };
});
app.view.addEventListener("mouseup", () => { isDragging = false; });
app.view.addEventListener("mouseout", () => { isDragging = false; });
app.view.addEventListener("mousemove", (event) => {
    if (isDragging) {
        const dx = (event.clientX - mouseInitialPos.x) / gridScale;
        const dy = (event.clientY - mouseInitialPos.y) / gridScale;

        camera.x -= dx;
        camera.y -= dy;

        mouseInitialPos = { x: event.clientX, y: event.clientY };

        drawGraphics();
    }
});
//zoom
app.view.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    mapZoom(zoomFactor, event);
});

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
    app.stage.scale.set(gridScale, gridScale,cellSize);

    drawGraphics();
}

// init funkci!!!
const keyboardMapMovement = keyboardControls(camera, zoomSpeed, gridScale, mapZoom, drawGraphics);

app.ticker.add(() => {
    keyboardMapMovement();
});