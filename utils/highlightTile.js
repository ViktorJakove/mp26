import { AREA_TYPES } from "../enums/areaTypes.js";
import {updatePointerTextRenderer} from "./renderers/pointerTextRenderer.js";
export function setupTileHighlight(app, camera, getGridScale, cellSize, drawGraphics, areas) {
    let highlightedTile = null;

    app.view.addEventListener("mousemove", (event) => {
        try {
            //dynamicky ziskat aktualni gridscale
            const gridScale = getGridScale(); 
            const mouseX = event.clientX - app.screen.width / 2;
            const mouseY = event.clientY - app.screen.height / 2;

            const worldMouseX = camera.x + mouseX / gridScale;
            const worldMouseY = camera.y + mouseY / gridScale;

            const tileX = Math.floor(worldMouseX / cellSize);
            const tileY = Math.floor(worldMouseY / cellSize);

            //zdali je obsazena dlazd
            let obstacleInfo = "";
            let obstacle = null;
            const isOccupied = areas.some(placedArea => {
                let within = tileX >= placedArea.x &&
                tileX < placedArea.x + placedArea.sizeX &&
                tileY >= placedArea.y &&
                tileY < placedArea.y + placedArea.sizeY &&
                placedArea.type != AREA_TYPES.LOCK;

                if (within) {
                    if(placedArea.type === AREA_TYPES.FOREST || placedArea.type === AREA_TYPES.ROCK || placedArea.type === AREA_TYPES.INDIANS || placedArea.type === AREA_TYPES.BISONS){
                        obstacle = placedArea.type;
                        obstacleInfo = obstacle.buildOverCost ? "+"+obstacle.buildOverCost + "$" : obstacle.buildOverInfo;
                        return true;
                    }else if (placedArea.type === AREA_TYPES.CITY || placedArea.type === AREA_TYPES.LAKE) {
                        obstacleInfo = placedArea.description;
                        return true;
                    }
                    return true;
                }
                return false;
            });

            //rovnout passnout text 
            //let obstacleInfo = obstacle ? (obstacle.buildOverCost ? "+"+obstacle.buildOverCost + "$" : obstacle.buildOverInfo) : (obstacle.description);
            
            updatePointerTextRenderer(obstacleInfo,event.clientX,event.clientY, getGridScale);

            if (!isOccupied) {
                highlightedTile = { x: tileX, y: tileY, obstacle: obstacle};
            } else {
                highlightedTile = null;
            }

            drawGraphics();
        } catch (error) {
            console.error("Error in mousemove listener:", error);
        }
    });

    return {
        getHighlightedTile: () => highlightedTile,
    };
}