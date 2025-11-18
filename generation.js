import { City } from "./city";
const app = new PIXI.Application({
    resizeTo: window,
    autoDensity: true,
    backgroundColor: 0xeeeeee,
    antialias: true
  });
document.body.appendChild(app.view);

const cellSize = 50;
const grid = new PIXI.Graphics();
grid.lineStyle(1, 0xcccccc);
for (let x = 0; x < app.screen.width; x += cellSize) {
    grid.moveTo(x, 0);
    grid.lineTo(x, app.screen.height);
}
/*const cities = {
    "Praha": new City(100, 100, 50, 1300000),
};*/

