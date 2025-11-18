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
    0: new Area(AREATYPES.CITY,5*cellSize, 3*cellSize, 5*cellSize, "Red Rock", 200)
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

        const areaText = new PIXI.Text(area.name + (area.type === AREATYPES.CITY ? '\n' + "population : " + area.peeps :""), {fontFamily: "Arial", fontSize: 14, fill: 0x000000});
        areaText.x = offsetX + area.x + area.size / 2;
        areaText.y = offsetY + area.y + area.size / 2;
        areaText.anchor.set(0.5);
        areaText.style.align = 'center';
        areaContainer.addChild(areaText);
    });
}
drawAreas(0,0);
//
console.log(areas[0]);
//

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
        const dx = event.clientX - mouseInitialPos.x;
        const dy = event.clientY - mouseInitialPos.y;
        offset.x += dx;
        offset.y += dy;
        mouseInitialPos = { x: event.clientX, y: event.clientY };

        drawGrid(offset.x, offset.y);

        drawAreas(offset.x, offset.y);
    }
});
