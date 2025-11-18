import { City } from "./city.js";

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
for (let x = 0; x < app.screen.width; x += cellSize) {
    grid.moveTo(x, 0);
    grid.lineTo(x, app.screen.height);
}for (let y = 0; y < app.screen.height; y += cellSize) {
    grid.moveTo(0, y);
    grid.lineTo(app.screen.width, y);
}
app.stage.addChild(grid);

//cities defs and render
const cities = {
    0: new City(5*cellSize, 3*cellSize, 5*cellSize, 200, "Red Rock")
};
Object.values(cities).forEach(city => {
    const cityGridGraphics = new PIXI.Graphics();
    cityGridGraphics.beginFill(0xff0000, 0.5);
    cityGridGraphics.drawRect(city.x, city.y, city.size, city.size);
    cityGridGraphics.endFill();
    app.stage.addChild(cityGridGraphics);
    const cityText = new PIXI.Text(city.name + '\n' + "population : " + city.peeps, {fontFamily: "Arial", fontSize: 14, fill: 0x000000});
    cityText.x = city.x + city.size / 2;
    cityText.y = city.y + city.size / 2;
    cityText.anchor.set(0.5);
    cityText.style.align = 'center';
    app.stage.addChild(cityText);
});
console.log(cities[0]);
