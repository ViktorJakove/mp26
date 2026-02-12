export function keyboardControls(camera, zoomSpeed, gridScale, mapZoom, drawGraphics, addLevel) {
    const keyboardMapMoveSpeed = 28;
    const keyboardZoomSpeed = zoomSpeed / 2;
    const keysDown = new Set();

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
        // Handle Space once on initial press (no repeats while held)
        if (event.code === "Space") {
            if (!keysDown.has("Space")) addLevel();
            keysDown.add("Space");
            event.preventDefault();
            return;
        }

        keysDown.add(event.code);
        event.preventDefault();
    });

    document.addEventListener("keyup", (event) => {
        keysDown.delete(event.code);
    });

    return keyboardMapMovement;
}