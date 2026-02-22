import { setShiftPressed } from "./shiftState.js";
export function keyboardControls(camera, zoomSpeed, gridScale, mapZoom, drawGraphics, /**/addLevel, /**/addStations, placementModeObj, areaRenderer, pointerTextRenderer, resetDrag, stationRenderer,hudRenderer) {
    const keyboardMapMoveSpeed = 28;
    const keyboardZoomSpeed = zoomSpeed / 2;
    const keysDown = new Set();
    let spacePressed = false;

    const movementActions = {
        "ArrowUp": () => camera.y -= keyboardMapMoveSpeed / gridScale,
        "ArrowDown": () => camera.y += keyboardMapMoveSpeed / gridScale,
        "ArrowLeft": () => camera.x -= keyboardMapMoveSpeed / gridScale,
        "ArrowRight": () => camera.x += keyboardMapMoveSpeed / gridScale,
        "KeyA": () => mapZoom(1 - keyboardZoomSpeed, undefined),
        "KeyS": () => mapZoom(1 + keyboardZoomSpeed, undefined),
    };

    function keyboardMapMovement() {
        let moved = false;

        keysDown.forEach((key) => {
            if (movementActions[key]) {
                movementActions[key]();
                moved = true;
            }
        });

        if (moved) {
            drawGraphics();
        }
    }

    document.addEventListener("keydown", (event) => {
        try {
            switch (event.code) {
                case "Space":
                    if (!spacePressed) {
                        spacePressed = true;
                        placementModeObj.placementMode = !placementModeObj.placementMode;
                        hudRenderer.draw()
                        pointerTextRenderer.togglePointerText(placementModeObj.placementMode);
                        resetDrag();
                    }
                    event.preventDefault();
                    return;
                case "ShiftLeft":
                case "ShiftRight":
                case "Shift":
                    if (!keysDown.has(event.code)) {
                        areaRenderer.setShiftPressed(true);
                        setShiftPressed(true);
                        if (stationRenderer)stationRenderer.setShiftPressed(true);
                        pointerTextRenderer.refresh(() => gridScale);
                        keysDown.add(event.code);
                        drawGraphics();
                    }
                    event.preventDefault();
                    return;
                //temp ficurs
                case "KeyP":
                    if (!keysDown.has("KeyP")) addLevel();
                    event.preventDefault();
                    return;
                case "KeyO":
                    if (!keysDown.has("KeyO")) addStations();
                    event.preventDefault();
                    return;
            }
            
            keysDown.add(event.code);
            event.preventDefault();
        } catch (error) {
            console.error("Error in keydown listener:", error);
        }
    });

    document.addEventListener("keyup", (event) => {
        try{
            switch (event.code) {
                case "Space":
                    spacePressed = false;
                    break;
                case "ShiftLeft":
                case "ShiftRight":
                case "Shift":
                    areaRenderer.setShiftPressed(false);
                    setShiftPressed(false);
                    if (stationRenderer)stationRenderer.setShiftPressed(false);
                    pointerTextRenderer.refresh(() => gridScale);
                    drawGraphics();
                    break;
            }
            keysDown.delete(event.code);
            event.preventDefault();
        }catch (error) {
            console.error("Error in keyup listener:", error);
        }
    });

    return keyboardMapMovement;
}