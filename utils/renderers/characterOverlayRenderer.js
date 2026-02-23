import { BUILDING_TEXTS, DEFAULT_BUILDING_TEXT } from "../../text/buildingTexts.js";

export function createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer) {
    
    const overlayContainer = new PIXI.Container();
    overlayContainer.zIndex = 100;
    overlayContainer.visible = false;
    
    overlayContainer.interactive = true;
    // Nastavíme hitArea na celou obrazovku
    overlayContainer.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    
    app.stage.addChild(overlayContainer);
    
    let currentCity = null;
    let onCloseCallback = null;
    let currentTextIndex = 0;
    let buildingDescText = null;

    /*function getCityConnections(cityArea) {
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
    }*/

    function showCityInfo(cityArea) {
        
        currentCity = cityArea;
        currentTextIndex = 0;
        
        overlayContainer.removeChildren();
        
        const overlay = new PIXI.Graphics();
        overlay.beginFill(0x000000, 0.7);
        overlay.drawRect(0, 0, app.screen.width, app.screen.height);
        overlay.endFill();
        
        overlay.interactive = true;
        overlay.on('pointerdown', (e) => {
            e.stopPropagation();
            handleOverlayClick();
        });
        
        overlayContainer.addChild(overlay);
    
        const panel = new PIXI.Container();
        
        const panelWidth = app.screen.width * 0.8;
        const panelHeight = app.screen.height * 0.4;
        const panelX = (app.screen.width - panelWidth) / 2;
        const panelY = app.screen.height - panelHeight - 20;
    
        const panelBg = new PIXI.Graphics();
        panelBg.beginFill(0x2c3e50, 0.95);
        panelBg.lineStyle(2, 0xf5c518);
        panelBg.drawRoundedRect(0, 0, panelWidth, panelHeight, 12);
        panelBg.endFill();
        panel.addChild(panelBg);
    
        const title = new PIXI.Text(`${cityArea.name}`, {
            fontFamily: "Arial",
            fontSize: 28,
            fill: 0xf5c518,
            fontWeight: "bold"
        });
        title.x = 20;
        title.y = 20;
        panel.addChild(title);
        
        const buildingKey = cityArea.building || "none";
        const buildingTexts = BUILDING_TEXTS[buildingKey] || DEFAULT_BUILDING_TEXT;
        
        buildingDescText = new PIXI.Text(buildingTexts[0], {
            fontFamily: "Arial",
            fontSize: 16,
            fill: 0xecf0f1,
            fontStyle: "italic",
            wordWrap: true,
            wordWrapWidth: panelWidth - 40
        });
        buildingDescText.x = 20;
        buildingDescText.y = title.y*3;
        panel.addChild(buildingDescText);
    
        const instructionText = new PIXI.Text("Klikni kamkoli...", {
            fontFamily: "Arial",
            fontSize: 14,
            fill: 0x95a5a6,
            fontStyle: "italic"
        });
        instructionText.x = panelWidth - 200;
        instructionText.y = panelHeight - 30;
        panel.addChild(instructionText);
    
        panel.x = panelX;
        panel.y = panelY;
        
        panel.interactive = false;
        panel.interactiveChildren = false;
        
        overlayContainer.addChild(panel);
        
        overlayContainer.visible = true;
        
        overlayContainer.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
        
        overlayContainer.updateTransform();
    }

    function handleOverlayClick() {
        if (!currentCity || !buildingDescText) return;
        
        const buildingKey = currentCity.building || "none";
        const buildingTexts = BUILDING_TEXTS[buildingKey] || DEFAULT_BUILDING_TEXT;
        
        if (currentTextIndex === buildingTexts.length - 1) {
            hideOverlay();
            return;
        }
        currentTextIndex = (currentTextIndex + 1) % buildingTexts.length;
        buildingDescText.text = buildingTexts[currentTextIndex];
    }

    function hideOverlay() {
        overlayContainer.visible = false;
        currentCity = null;
        buildingDescText = null;
        currentTextIndex = 0;
        
        if (onCloseCallback) {
            onCloseCallback();
        }
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
        } else {
            overlayContainer.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
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