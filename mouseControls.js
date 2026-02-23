// mouseControls.js
export function setupMouseControls(app, camera, getGridScale, cellSize, getPlacementMode, railRenderer, drawGraphics, getSelectedRailType, cityInfoOverlay, areas, stationRenderer) {
    let isDragging = false;
    let mouseInitialPos = { x: 0, y: 0 };
    let isPlacingRail = false;

    function resetDrag() {
        isDragging = false;
    }

    function getTileFromMouse(event){
        try{
            const gridScale = getGridScale();
            const worldX = camera.x + (event.data.global.x / gridScale) - app.screen.width / 2 / gridScale;
            const worldY = camera.y + (event.data.global.y / gridScale) - app.screen.height / 2 / gridScale;
            return {tileX: Math.floor(worldX / cellSize), tileY: Math.floor(worldY / cellSize)};
        }catch(error){
            console.error("Error v getTileFromMouse:", error);
            return null;
        }
    }

    function handleRailAction(tileX, tileY) {
        try{
            const selected = getSelectedRailType();
            if (selected.isDestroy) {
                if (railRenderer.isTileOccupied(tileX, tileY)) {
                    railRenderer.removeRail(tileX, tileY);
                    drawGraphics();
                }
                return;
            }
            if (!railRenderer.isTileOccupied(tileX, tileY)) {
                if (railRenderer.addRail(tileX, tileY, selected)) drawGraphics();
            }
        }catch(error){
            console.error("Error v handleRailAction:", error);
        }
    }

    function handleCityClick(tileX, tileY) {
        // Don't handle clicks if overlay is already visible
        if (cityInfoOverlay.isVisible()) return false;

        console.log("Checking city click at:", tileX, tileY); // Debug log
        
        // Check if clicked on a city
        const clickedCity = areas.find(area => 
            area.type?.type === "city" &&
            tileX >= area.x && tileX < area.x + area.sizeX &&
            tileY >= area.y && tileY < area.y + area.sizeY
        );

        console.log("Found city:", clickedCity); // Debug log

        if (clickedCity) {
            // Check if city is connected to railway
            const stations = stationRenderer.getStations();
            console.log("Stations:", stations); // Debug log
            
            const isConnected = stations.some(station => {
                // Check if station is adjacent to city
                for (let x = clickedCity.x - 1; x <= clickedCity.x + clickedCity.sizeX; x++) {
                    for (let y = clickedCity.y - 1; y <= clickedCity.y + clickedCity.sizeY; y++) {
                        if (station.x === x && station.y === y) {
                            // Check if this station is connected to another station
                            const otherStation = stations.find(s => 
                                s.index === station.index && 
                                (s.x !== station.x || s.y !== station.y)
                            );
                            if (otherStation) {
                                const connected = railRenderer.areStationsConnected(
                                    station.x, station.y,
                                    otherStation.x, otherStation.y
                                );
                                console.log("Station connected:", connected); // Debug log
                                return connected;
                            }
                        }
                    }
                }
                return false;
            });

            console.log("City connected:", isConnected); // Debug log

            if (isConnected) {
                cityInfoOverlay.showCityInfo(clickedCity);
                return true;
            }
        }
        return false;
    }

    app.stage.on('pointerdown', (event) => {
        try{
            const button = event.data.button;
            
            // Get tile coordinates
            const tilePos = getTileFromMouse(event);
            if (!tilePos) return;
            
            console.log("Pointer down at tile:", tilePos, "button:", button, "placementMode:", getPlacementMode()); // Debug log
            
            // Check for city click first (left click only)
            if (button === 0 && !getPlacementMode()) {
                console.log("Checking city click..."); // Debug log
                const cityClicked = handleCityClick(tilePos.tileX, tilePos.tileY);
                if (cityClicked) {
                    console.log("City clicked, showing overlay"); // Debug log
                    event.stopPropagation(); // Stop event from propagating
                    return; // City click handled, don't start dragging
                }
            }

            // Handle rail placement
            if (getPlacementMode() && button === 0) {
                isPlacingRail = true;
                handleRailAction(tilePos.tileX, tilePos.tileY);
                return;
            }

            // Handle dragging
            if (getPlacementMode() ? (button === 2) : (button === 0 || button === 2)) {
                isDragging = true;
                mouseInitialPos = { x: event.data.global.x, y: event.data.global.y };
            }
        }catch(error){
            console.error("Error v pointerdown listener:", error);
        }
    });

    app.stage.on('pointerup', (event) => {
        const button = event.data.button;
        if (button === 0) isPlacingRail = false;
        if (getPlacementMode() ? (button === 2) : (button === 0 || button === 2)) {
            isDragging = false;
        }
    });

    app.stage.on('pointerupoutside', () => { 
        isDragging = false; 
        isPlacingRail = false; 
    });

    app.stage.on('pointermove', (event) => {
        try{
            if(getPlacementMode() && isPlacingRail){
                const tilePos = getTileFromMouse(event);
                if (tilePos) {
                    handleRailAction(tilePos.tileX, tilePos.tileY);
                }
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
        }catch(error){
            console.error("Error v pointermove listener:", error);
        }
    });

    app.view.addEventListener("contextmenu", (event) => {
        // TEMP FIX DEBUG
        // event.preventDefault();
    });

    return { resetDrag };
}