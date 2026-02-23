export function createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer) {
    
    const overlayContainer = new PIXI.Container();
    overlayContainer.zIndex = 100;
    overlayContainer.visible = false;
    
    overlayContainer.interactive = true;
    
    app.stage.addChild(overlayContainer);
    
    let currentCity = null;
    let onCloseCallback = null;

    function getCityConnections(cityArea) {
        const stations = stationRenderer.getStations();
        
        const cityStations = stations.filter(station => {
            for (let x = cityArea.x - 1; x <= cityArea.x + cityArea.sizeX; x++) {
                for (let y = cityArea.y - 1; y <= cityArea.y + cityArea.sizeY; y++) {
                    if (station.x === x && station.y === y) {
                        const otherStation = stations.find(s => 
                            s.index === station.index && 
                            (s.x !== station.x || s.y !== station.y)
                        );
                        if (otherStation) {
                            const connected = railRenderer.areStationsConnected(
                                station.x, station.y,
                                otherStation.x, otherStation.y
                            );
                            return connected;
                        }
                    }
                }
            }
            return false;
        });

        return cityStations;
    }

    function showCityInfo(cityArea) {
        console.log("showCityInfo called with:", cityArea.name);
        currentCity = cityArea;
        
        overlayContainer.removeChildren();
        
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, app.screen.width, app.screen.height);
        overlay.endFill();
        
        overlay.interactive = true;
        overlay.on('pointerdown', (e) => {
            e.stopPropagation();
        });
        
        overlayContainer.addChild(overlay);
        console.log("Overlay added, size:", app.screen.width, "x", app.screen.height);
    
        const panel = new PIXI.Container();
        
        const panelWidth = app.screen.width * 0.8;
        const panelHeight = app.screen.height * 0.3;
        const panelX = (app.screen.width - panelWidth) / 2;
        const panelY = app.screen.height - panelHeight - 20;
    
        console.log("Panel dimensions:", panelWidth, panelHeight, panelX, panelY);
    
        const panelBg = new PIXI.Graphics();
        panelBg.beginFill(0x2c3e50, 0.95);
        panelBg.lineStyle(2, 0xf5c518);
        panelBg.drawRoundedRect(0, 0, panelWidth, panelHeight, 12);
        panelBg.endFill();
        panel.addChild(panelBg);
    
        const closeBtn = new PIXI.Graphics();
        closeBtn.beginFill(0xe74c3c);
        closeBtn.drawCircle(panelWidth - 25, 25, 15);
        closeBtn.endFill();
        
        const closeText = new PIXI.Text("×", {
            fontFamily: "Arial",
            fontSize: 24,
            fill: 0xffffff,
            fontWeight: "bold"
        });
        closeText.anchor.set(0.5);
        closeText.x = panelWidth - 25;
        closeText.y = 25;
        
        closeBtn.interactive = true;
        closeBtn.cursor = "pointer";
        closeBtn.on("pointerdown", (e) => {
            e.stopPropagation();
            hideOverlay();
            if (onCloseCallback) onCloseCallback();
        });
        
        panel.addChild(closeBtn);
        panel.addChild(closeText);
    
        const title = new PIXI.Text(`${cityArea.name}`, {
            fontFamily: "Arial",
            fontSize: 28,
            fill: 0xf5c518,
            fontWeight: "bold"
        });
        title.x = 20;
        title.y = 20;
        panel.addChild(title);
    
        if (cityArea.description) {
            const desc = new PIXI.Text(cityArea.description, {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xecf0f1,
                fontStyle: "italic"
            });
            desc.x = 20;
            desc.y = 60;
            panel.addChild(desc);
        }
    
        const statsY = 100;
        const stats = [
            `Population: ${cityArea.peeps}`,
            `Size: ${cityArea.sizeX}×${cityArea.sizeY} tiles`,
            `Building: ${cityArea.building || "None"}`,
            `Defense Level: ${cityArea.defenseLevel || 1}`
        ];
    
        stats.forEach((stat, index) => {
            const statText = new PIXI.Text(stat, {
                fontFamily: "Arial",
                fontSize: 18,
                fill: 0xbdc3c7
            });
            statText.x = 20;
            statText.y = statsY + index * 30;
            panel.addChild(statText);
        });
    
        const connections = getCityConnections(cityArea);
        const connectionStatus = new PIXI.Text(
            connections.length > 0 ? "✓ Connected to railway network" : "✗ Not connected",
            {
                fontFamily: "Arial",
                fontSize: 20,
                fill: connections.length > 0 ? 0x2ecc71 : 0xe74c3c,
                fontWeight: "bold"
            }
        );
        connectionStatus.x = 20;
        connectionStatus.y = statsY + stats.length * 30 + 20;
        panel.addChild(connectionStatus);
    
        if (connections.length > 0) {
            const routes = new PIXI.Text(`Active routes: ${connections.length}`, {
                fontFamily: "Arial",
                fontSize: 16,
                fill: 0xecf0f1
            });
            routes.x = 20;
            routes.y = statsY + stats.length * 30 + 50;
            panel.addChild(routes);
        }
    
        panel.x = panelX;
        panel.y = panelY;
        
        panel.interactive = true;
        
        overlayContainer.addChild(panel);
        
        overlayContainer.visible = true;
        overlayContainer.updateTransform();
    }

    function hideOverlay() {
        overlayContainer.visible = false;
        currentCity = null;
    }

    function isVisible() {
        return overlayContainer.visible;
    }

    function setOnClose(callback) {
        onCloseCallback = callback;
    }

    function handleResize() {
        if (currentCity && overlayContainer.visible) {
            const cityToShow = currentCity;
            const gridScale = getGridScale();
        
            overlayContainer.removeChildren();
            overlayContainer.scale.set(1, 1);
            showCityInfo(cityToShow);
        }
    }

    window.addEventListener("resize", handleResize);

    function destroy() {
        window.removeEventListener("resize", handleResize);
    }

    function refresh() {
        const gridScale = getGridScale();
    
        overlayContainer.scale.set(1 / gridScale);
    
        overlayContainer.x = 0;
        overlayContainer.y = 0;

        overlayContainer.hitArea = new PIXI.Rectangle(
            0,
            0,
            app.screen.width,
            app.screen.height
        );

    }

    return {
        showCityInfo,
        hideOverlay,
        isVisible,
        setOnClose,
        overlayContainer,
        getCurrentCity: () => currentCity,
        destroy,
        refresh
    };
}