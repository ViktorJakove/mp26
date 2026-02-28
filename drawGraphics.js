import { SCREEN_DIMENSIONS } from "./screenDimensions.js";
import { AREA_GEN_DATA } from "./mapGenData/areaGenData.js";

export function createDrawGraphics(app, camera, getGridScale, cellSize, getLevel, getHighlightedTile, getPlacementMode, getAreas, renderers, fgContainer) {
    const { areaRenderer, stationRenderer, railRenderer, pointerTextRenderer, trainRenderer, hudRenderer} = renderers;

    const grid = new PIXI.Graphics();
    app.stage.addChild(grid);

    function drawHighlight(dimensions) {
        const highlightedTile = getHighlightedTile();
        if (highlightedTile) {
            const screenX = highlightedTile.x * cellSize - dimensions.worldLeft;
            const screenY = highlightedTile.y * cellSize - dimensions.worldTop;
            let tileColor = highlightedTile.obstacle ? highlightedTile.buildOverColor : 0xffcc00;
            grid.beginFill(tileColor, 0.5);
            grid.drawRect(screenX, screenY, cellSize, cellSize);
            grid.endFill();
        }
    }

    function drawGrid() {
        grid.clear();
        if (!getPlacementMode()) return;

        const dimensions = SCREEN_DIMENSIONS(app, camera, getGridScale(), cellSize);

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
        //pointer infotext
        pointerTextRenderer.refresh(getGridScale);
    }

    function drawForeground() {

        if (fgContainer._maskRef && fgContainer._maskRef.parent) {
            fgContainer._maskRef.parent.removeChild(fgContainer._maskRef);
            fgContainer._maskRef.destroy();
            fgContainer._maskRef = null;
        }
        
        fgContainer.removeChildren();

        const level = getLevel();
        const dimensions = SCREEN_DIMENSIONS(app, camera, getGridScale(), cellSize);
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
    
        const isOverlapping = screenHoleEndX > 0 && screenHoleStartX < dimensions.screenWidth &&
            screenHoleEndY > 0 && screenHoleStartY < dimensions.screenHeight;
    
        const mask = new PIXI.Graphics();
        
        if (isOverlapping) {
            mask.beginFill(0xffffff);
            mask.drawRect(0, 0, dimensions.screenWidth, dimensions.screenHeight);
            
            mask.beginHole();
            
            const holeScreenX = Math.max(0, Math.min(screenHoleStartX, dimensions.screenWidth));
            const holeScreenY = Math.max(0, Math.min(screenHoleStartY, dimensions.screenHeight));
            const holeScreenWidth = Math.max(0, Math.min(screenHoleEndX, dimensions.screenWidth) - holeScreenX);
            const holeScreenHeight = Math.max(0, Math.min(screenHoleEndY, dimensions.screenHeight) - holeScreenY);
            
            if (holeScreenWidth > 0 && holeScreenHeight > 0) {
                mask.drawRect(holeScreenX, holeScreenY, holeScreenWidth, holeScreenHeight);
            }
            
            mask.endHole();
            mask.endFill();
        } else {
            mask.beginFill(0xffffff);
            mask.drawRect(0, 0, dimensions.screenWidth, dimensions.screenHeight);
            mask.endFill();
        }
    
        fgContainer.mask = mask;
        
        app.stage.addChild(mask);
        
        app.stage.addChild(fgContainer);
        
        if (fgContainer._maskRef) {
            app.stage.removeChild(fgContainer._maskRef);
            fgContainer._maskRef.destroy();
        }
        fgContainer._maskRef = mask;
    }

    function drawGraphics() {
        drawGrid();
        areaRenderer.drawAreas(getAreas());
        stationRenderer.drawStations();
        railRenderer.drawRails();
        if (trainRenderer) trainRenderer.drawTrains();
        hudRenderer.draw();
        drawForeground();
    }

    return { drawGraphics, grid };
}