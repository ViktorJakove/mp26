import { AREA_TYPES } from "./enums/areaTypes.js";
export function setupTileHighlight(app, camera, getGridScale, cellSize, drawGraphics, areas) {
    let highlightedTile = null;

    app.view.addEventListener("mousemove", (event) => {
        //dynamicky ziskat aktualni gridscale
        const gridScale = getGridScale(); 
        const mouseX = event.clientX - app.screen.width / 2;
        const mouseY = event.clientY - app.screen.height / 2;

        const worldMouseX = camera.x + mouseX / gridScale;
        const worldMouseY = camera.y + mouseY / gridScale;

        const tileX = Math.floor(worldMouseX / cellSize);
        const tileY = Math.floor(worldMouseY / cellSize);

        // Adjust the isOccupied logic
        const isOccupied = areas.some(placedArea =>
            tileX >= placedArea.x &&
            tileX < placedArea.x + placedArea.sizeX &&
            tileY >= placedArea.y &&
            tileY < placedArea.y + placedArea.sizeY &&
            placedArea.type != AREA_TYPES.LOCK
        );

        if (!isOccupied) {
            highlightedTile = { x: tileX, y: tileY,  };
        } else {
            highlightedTile = null;
        }

        drawGraphics();
    });

    return {
        getHighlightedTile: () => highlightedTile,
    };
}