import { Area } from "./area.js";
import { AREATYPES } from "./areaTypes.js";

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

//zoom valeus
let gridScale = 1;
const zoomSpeed = 0.1;
const minScale = 0.3;
const maxScale = 1;

//grid setup
const cellSize = 50;
const grid = new PIXI.Graphics();
grid.lineStyle(1, 0xcccccc);
app.stage.addChild(grid);
drawGrid(0, 0);

//grid updated draw
function drawGrid(offsetX, offsetY) {
    grid.clear();
    grid.lineStyle(1, 0xcccccc);
    for (let x = offsetX % cellSize; x < app.screen.width; x += cellSize) {
        grid.moveTo(x, 0);
        grid.lineTo(x, app.screen.height);
    }for (let y = offsetY % cellSize; y < app.screen.height; y += cellSize) {
        grid.moveTo(0, y);
        grid.lineTo(app.screen.width, y);
    }
}

//enviroment defs and render func
const areas = {
    0: new Area(AREATYPES.CITY,5*cellSize, 3*cellSize, 2*cellSize, "Red Rock", 200),
    1: new Area(AREATYPES.LAKE,12*cellSize, 8*cellSize, 4*cellSize, "mega Lake", 0),
    2: new Area(AREATYPES.FOREST,20*cellSize, 5*cellSize, 6*cellSize, "Dark Woods", 0),
    3: new Area(AREATYPES.CITY,20*cellSize, 15*cellSize, 3*cellSize, "Bluemoon", 300),
};
//container - hold and rerender areas each screen move
const areaContainer = new PIXI.Container();
app.stage.addChild(areaContainer);

function drawAreas(offsetX,offsetY){
    areaContainer.removeChildren();

    Object.values(areas).forEach(area => {
        const areaGridGraphics = new PIXI.Graphics();
        areaGridGraphics.beginFill(area.type.color, 0.5);
        const relX = offsetX + area.x;
        const relY = offsetY + area.y;
        areaGridGraphics.drawRect(relX, relY, area.size, area.size);
        areaGridGraphics.endFill();
        areaContainer.addChild(areaGridGraphics);

        if (gridScale > 0.7) return; //TODO: kdyz bude hodne zazoomovano, tak tam bude fancy text!!!
        const areaText = new PIXI.Text(area.name + (area.type === AREATYPES.CITY ? '\n' + "population : " + area.peeps :""), {fontFamily: "Arial", fontSize: 14, fill: 0x000000});
        areaText.x = offsetX + area.x + area.size / 2;
        areaText.y = offsetY + area.y + area.size / 2;
        areaText.anchor.set(0.5);
        areaText.style.align = 'center';
        areaText.scale.set((1 / gridScale));
        areaContainer.addChild(areaText);
    });
}
drawAreas(0,0);

//mouse move
let isDragging = false;
let mouseInitialPos = { x: 0, y: 0 };
let offset  = { x: 0, y: 0 };

app.view.addEventListener('mousedown', (event) => {
    isDragging = true;
    mouseInitialPos = { x: event.clientX, y: event.clientY };
});

app.view.addEventListener('mouseup', () => {
    isDragging = false;
});
app.view.addEventListener('mouseout', () => {
    isDragging = false;
});

app.view.addEventListener('mousemove', (event) => {
    if (isDragging) {
        const dx = (event.clientX - mouseInitialPos.x)/gridScale;
        const dy = (event.clientY - mouseInitialPos.y)/gridScale;
        offset.x += dx;
        offset.y += dy;
        mouseInitialPos = { x: event.clientX, y: event.clientY };

        drawGrid(offset.x, offset.y);

        drawAreas(offset.x, offset.y);
    }
});

//zooming
app.view.addEventListener('wheel', (event) => {
    event.preventDefault();

    const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;

    const mousePos = app.renderer.events.pointer.global;
    const worldPos = {
        x: (mousePos.x - app.stage.x) / gridScale,
        y: (mousePos.y - app.stage.y) / gridScale,
    };
    
    //clamping
    gridScale = Math.min(maxScale, Math.max(minScale, gridScale * zoomFactor));

    app.stage.scale.set(gridScale, gridScale);

    app.stage.x = mousePos.x - worldPos.x * gridScale;
    app.stage.y = mousePos.y - worldPos.y * gridScale;

    // Redraw grid and areas
    drawGrid(offset.x, offset.y);
    drawAreas(offset.x, offset.y);
});
