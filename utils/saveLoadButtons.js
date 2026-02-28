export function createSaveLoadButtons(app, getGridScale, getters, setters, renderers, redrawCallback) {
    const container = new PIXI.Container();
    container.zIndex = 30;
    container.interactive = true;
    app.stage.addChild(container);

    const BUTTON_WIDTH = 80;
    const BUTTON_HEIGHT = 40;
    const BUTTON_PADDING = 10;
    const BUTTON_Y = 10;
    const BUTTON_X = app.screen.width - (BUTTON_WIDTH + BUTTON_PADDING) * 2;

    function createButton(text, x, color, hoverColor, onClick) {
        const btnContainer = new PIXI.Container();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(color);
        bg.lineStyle(2, hoverColor);
        bg.drawRoundedRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 8);
        bg.endFill();
        btnContainer.addChild(bg);
        
        const label = new PIXI.Text(text, {
            fontFamily: "Arial",
            fontSize: 16,
            fill: 0xffffff,
            fontWeight: "bold"
        });
        label.anchor.set(0.5);
        label.x = BUTTON_WIDTH / 2;
        label.y = BUTTON_HEIGHT / 2;
        btnContainer.addChild(label);
        
        btnContainer.x = x;
        btnContainer.y = BUTTON_Y;
        btnContainer.interactive = true;
        btnContainer.cursor = "pointer";
        
        btnContainer.on('pointerdown', (e) => {
            e.stopPropagation();
            onClick();
        });
        
        btnContainer.on('pointerover', () => {
            bg.clear();
            bg.beginFill(hoverColor);
            bg.lineStyle(2, hoverColor);
            bg.drawRoundedRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 8);
            bg.endFill();
        });
        
        btnContainer.on('pointerout', () => {
            bg.clear();
            bg.beginFill(color);
            bg.lineStyle(2, hoverColor);
            bg.drawRoundedRect(0, 0, BUTTON_WIDTH, BUTTON_HEIGHT, 8);
            bg.endFill();
        });
        
        return btnContainer;
    }

    function saveGame() {
        try {
            const saveData = {
                version: "1.0",
                timestamp: Date.now(),
                money: getters.getMoney(),
                level: getters.getLevel(),
                relations: getters.getRelations(),
                placementMode: getters.getPlacementMode(),
                camera: {
                    x: getters.camera.x,
                    y: getters.camera.y
                },
                gridScale: getters.getGridScale(),
                areas: getters.getAreas().map(area => ({
                    type: area.type?.type || area.type,
                    x: area.x,
                    y: area.y,
                    sizeX: area.sizeX,
                    sizeY: area.sizeY,
                    name: area.name,
                    peeps: area.peeps || 0,
                    description: area.description || "",
                    building: area.building || ""
                })),
                unlockedCities: Array.from(getters.getUnlockedCities()),
                rails: renderers.railRenderer.getRails(),
                stations: renderers.stationRenderer.getStations().map(s => ({
                    x: s.x,
                    y: s.y,
                    color: s.color,
                    index: s.index,
                    peeps: s.peeps
                })),
                bisonProfit: window.bisonProfitStore ? window.bisonProfitStore.getStoredProfit() : 0,
                bisonUnlocked: window.bisonManager ? window.bisonManager.isBisonUnlocked() : false,
                bankLoan: window.bankManager ? {
                    active: window.bankManager.isLoanActive ? window.bankManager.isLoanActive() : false,
                    amount: window.bankManager.getLoanAmount ? window.bankManager.getLoanAmount() : 0,
                    timeRemaining: window.bankManager.getTimeRemaining ? window.bankManager.getTimeRemaining() : 0
                } : null
            };

            const jsonString = JSON.stringify(saveData, null, 2);
            const blob = new Blob([jsonString], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `railway_save_${new Date().toISOString().slice(0,10)}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            showMessage("Hra uložena!", 0x27ae60);
        } catch (error) {
            console.error("Chyba při ukládání:", error);
            showMessage("Chyba při ukládání!", 0xe74c3c);
        }
    }

    function loadGame() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json,application/json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (event) => {
                try {
                    const saveData = JSON.parse(event.target.result);
                    
                    // Validate version
                    if (!saveData.version) {
                        throw new Error("Neplatný save soubor");
                    }
                    
                    // Apply loaded data
                    setters.setMoney(saveData.money);
                    setters.setLevel(saveData.level);
                    setters.setRelations(saveData.relations);
                    setters.setPlacementMode(saveData.placementMode);
                    setters.setCamera(saveData.camera.x, saveData.camera.y);
                    
                    // Restore areas (need to recreate Area objects)
                    const { Area } = require("../area.js");
                    const AREA_TYPES = require("../enums/areaTypes.js").AREA_TYPES;
                    
                    const restoredAreas = saveData.areas.map(a => {
                        let type = AREA_TYPES[a.type] || a.type;
                        return new Area(
                            type,
                            a.x,
                            a.y,
                            a.sizeX,
                            a.sizeY,
                            a.name,
                            a.peeps,
                            a.description,
                            a.building
                        );
                    });
                    setters.setAreas(restoredAreas);
                    
                    setters.setUnlockedCities(new Set(saveData.unlockedCities));
                    
                    if (saveData.rails && renderers.railRenderer) {
                        const { RAIL_TYPES } = require("../enums/railTypes.js");
                        renderers.railRenderer.loadRails(saveData.rails, RAIL_TYPES);
                    }
                    
                    if (saveData.stations && renderers.stationRenderer) {
                        renderers.stationRenderer.loadStations(saveData.stations);
                    }
                    
                    // Restore bison data
                    if (saveData.bisonProfit > 0 && window.bisonProfitStore) {
                        for (let i = 0; i < saveData.bisonProfit; i++) {
                            window.bisonProfitStore.addProfit(1);
                        }
                    }
                    
                    if (saveData.bisonUnlocked && window.bisonManager) {
                        window.bisonManager.unlockBisonBuilding();
                    }
                    
                    if (saveData.bankLoan && window.bankManager) {
                        if (saveData.bankLoan.active && saveData.bankLoan.amount > 0) {
                            window.bankManager.setLoanAmount(saveData.bankLoan.amount);
                        }
                    }
                    
                    if (renderers.buildingSpritesManager) {
                        renderers.buildingSpritesManager.clearAll();
                        const cities = restoredAreas.filter(a => a.type?.type === "city" && a.building !== "none");
                        cities.forEach(city => {
                            if (saveData.unlockedCities.includes(city.name)) {
                                renderers.buildingSpritesManager.createSprite(city);
                            }
                        });
                    }
                    
                    if (redrawCallback) redrawCallback();
                    renderers.areaRenderer.markDirty();
                    renderers.stationRenderer.markDirty();
                    renderers.railRenderer.markDirty();
                    renderers.hudRenderer.markDirty();
                    if (renderers.trainRenderer) renderers.trainRenderer.markDirty();
                    
                    showMessage("Hra načtena!", 0x27ae60);
                    
                } catch (error) {
                    console.error("Chyba při načítání:", error);
                    showMessage("Chyba při načítání!", 0xe74c3c);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    function showMessage(text, color) {
        const msgContainer = new PIXI.Container();
        msgContainer.zIndex = 31;
        
        const padding = 20;
        const bg = new PIXI.Graphics();
        bg.beginFill(0x2c3e50, 0.95);
        bg.lineStyle(2, color);
        bg.drawRoundedRect(0, 0, 200, 60, 8);
        bg.endFill();
        msgContainer.addChild(bg);
        
        const label = new PIXI.Text(text, {
            fontFamily: "Arial",
            fontSize: 16,
            fill: color,
            fontWeight: "bold",
            align: "center"
        });
        label.anchor.set(0.5);
        label.x = 100;
        label.y = 30;
        msgContainer.addChild(label);
        
        msgContainer.x = (app.screen.width - 200) / 2;
        msgContainer.y = app.screen.height / 2 - 30;
        
        msgContainer.scale.set(1 / getGridScale());
        app.stage.addChild(msgContainer);
        
        setTimeout(() => {
            if (msgContainer.parent) {
                app.stage.removeChild(msgContainer);
                msgContainer.destroy({ children: true });
            }
        }, 2000);
    }

    function repositionButtons() {
        container.x = 0;
        container.y = 0;
        
        const saveBtn = container.children[0];
        const loadBtn = container.children[1];
        
        if (saveBtn && loadBtn) {
            saveBtn.x = app.screen.width - (BUTTON_WIDTH + BUTTON_PADDING) * 2;
            loadBtn.x = app.screen.width - (BUTTON_WIDTH + BUTTON_PADDING);
        }
        
        container.scale.set(1 / getGridScale());
    }

    const saveBtn = createButton(
        "ULOŽIT",
        app.screen.width - (BUTTON_WIDTH + BUTTON_PADDING) * 2,
        0x3498db,
        0x5dade2,
        saveGame
    );
    container.addChild(saveBtn);

    /*const loadBtn = createButton(
        "NAČÍST",
        app.screen.width - (BUTTON_WIDTH + BUTTON_PADDING),
        0xe67e22,
        0xf39c12,
        loadGame
    );
    container.addChild(loadBtn);*/

    window.addEventListener('resize', repositionButtons);
    
    repositionButtons();

    return {
        container,
        saveGame,
        loadGame
    };
}