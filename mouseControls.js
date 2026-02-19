export function setupMouseControls(app, camera, getGridScale, cellSize, getPlacementMode, railRenderer, drawGraphics) {
    let isDragging = false;
    let mouseInitialPos = { x: 0, y: 0 };
    let isPlacingRail = false;

    function resetDrag() {
        isDragging = false;
    }

    function getTileFromMouse(event){
        const gridScale = getGridScale();
        const worldX = camera.x + (event.data.global.x / gridScale) - app.screen.width / 2 / gridScale;
        const worldY = camera.y + (event.data.global.y / gridScale) - app.screen.height / 2 / gridScale;
        return {tileX: Math.floor(worldX / cellSize), tileY: Math.floor(worldY / cellSize)};
    }

    app.stage.on('pointerdown', (event) => {
        const button = event.data.button;
        if (getPlacementMode() && button === 0) {
            isPlacingRail = true;
            const {tileX, tileY} = getTileFromMouse(event);
            if(railRenderer.addRail(tileX, tileY))drawGraphics();
            return;
        }
        if (getPlacementMode() ? (button === 2) : (button === 0 || button === 2)) {
            isDragging = true;
            mouseInitialPos = { x: event.data.global.x, y: event.data.global.y };
        }
    });

    app.stage.on('pointerup', (event) => {
        const button = event.data.button;
        if (button === 0) isPlacingRail = false;
        if (getPlacementMode() ? (button === 2) : (button === 0 || button === 2)) {
            isDragging = false;
        }
    });

    app.stage.on('pointerupoutside', () => { isDragging = false; isPlacingRail = false; });

    app.stage.on('pointermove', (event) => {
        if(getPlacementMode() && isPlacingRail){
            const {tileX, tileY} = getTileFromMouse(event);
            if(railRenderer.addRail(tileX, tileY))drawGraphics();
            return;
        }

        if (isDragging) {
            const gridScale = getGridScale();
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
        //TEMP FIX DEBUG SMAZtA
        //event.preventDefault();
    });

    return { resetDrag };
}