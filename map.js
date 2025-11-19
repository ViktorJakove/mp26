import { Area } from "./area.js";
import { AREA_TYPES } from "./areaTypes.js";
import { SCREEN_DIMENSIONS } from "./screenDimensions.js";

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

//camera
const camera = { x: 0, y: 0 };

//zoom valeus
let gridScale = 1;
const zoomSpeed = 0.1;
const minScale = 0.3;
const maxScale = 1;

//grid setup
const cellSize = 50;
const grid = new PIXI.Graphics();
app.stage.addChild(grid);

function drawGrid() {
    grid.clear();
    grid.lineStyle(1, 0xcccccc);

    const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);

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

//environment
const areas = {
    0: new Area(AREA_TYPES.CITY, 5 * cellSize, 3 * cellSize, 2 * cellSize, "Red Rock", 200),
    1: new Area(AREA_TYPES.LAKE, 12 * cellSize, 8 * cellSize, 4 * cellSize, "Booger Lake", 0),
    2: new Area(AREA_TYPES.BISONS, 20 * cellSize, 5 * cellSize, 6 * cellSize, "Wild Bunch", 42),
    3: new Area(AREA_TYPES.CITY, 20 * cellSize, 15 * cellSize, 3 * cellSize, "Bluemoon", 300),
};

const areaContainer = new PIXI.Container();
app.stage.addChild(areaContainer);

function drawAreas() {
    areaContainer.removeChildren();

    const dimensions = SCREEN_DIMENSIONS(app, camera, gridScale, cellSize);

    Object.values(areas).forEach(area => {
        const areaGraphics = new PIXI.Graphics();
        areaGraphics.beginFill(area.type.color, 0.5);

        const screenX = area.x - dimensions.worldLeft;
        const screenY = area.y - dimensions.worldTop;

        areaGraphics.drawRect(screenX, screenY, area.size, area.size);
        areaGraphics.endFill();
        areaContainer.addChild(areaGraphics);

        if (gridScale > 0.7) return;

        const areaText = new PIXI.Text(area.name + ((area.type === AREA_TYPES.CITY || area.type === AREA_TYPES.BISONS) ? '\n' + "population : " + area.peeps : ""),{ fontFamily: "Arial", fontSize: 14, fill: 0x000000 });
        areaText.x = screenX + area.size / 2;
        areaText.y = screenY + area.size / 2;
        areaText.anchor.set(0.5);
        areaText.style.align = "center";
        areaText.scale.set(1 / gridScale,1/gridScale);
        areaContainer.addChild(areaText);
    });
}

//init draw
drawGrid();
drawAreas();

//mouse movement
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

        drawGrid();
        drawAreas();
    }
});
//zoom
app.view.addEventListener("wheel", (event) => {
    event.preventDefault();
    const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
    const newScale = Math.min(maxScale, Math.max(minScale, gridScale * zoomFactor));
    
    const mouseX = event.clientX - app.screen.width / 2;
    const mouseY = event.clientY - app.screen.height / 2;
    const worldMouseX = camera.x + mouseX / gridScale;
    const worldMouseY = camera.y + mouseY / gridScale;

    gridScale = newScale;
    app.stage.scale.set(gridScale, gridScale,cellSize);

    camera.x = worldMouseX - mouseX / gridScale;
    camera.y = worldMouseY - mouseY / gridScale;

    drawGrid();
    drawAreas();
});
