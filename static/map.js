import { generateAreas } from "./generateAreas.js";
import { keyboardControls } from "./utils/keyboardHandler.js";
import { setupTileHighlight } from "./utils/highlightTile.js";
import { createApp } from "./utils/setup/appSetup.js";
import { createCamera, createZoomValues } from "./camera.js";
import { creatRenderers } from "./utils/setup/renderersSetup.js";
import { createDrawGraphics } from "./drawGraphics.js";
import { setupMouseControls } from "./mouseControls.js";
import { createStationManager } from "./stationManager.js";
import { createRouteChecker } from "./utils/routeChecker.js";
import { createCharacterOverlay } from "./renderers/characterOverlay/characterOverlayRenderer.js";
import { createBankManager } from "./utils/bankManager.js";
import { createBisonManager } from "./utils/bisonManager.js";
import { createBisonProfitStore } from "./createBisonProfitStore.js";
import { createBuildingSpritesManager } from "./buildingSprites.js";
import { getShiftPressed } from "./utils/shiftState.js";
import { createLoadingOverlay } from "./renderers/loadingOverLay.js";
import { RAIL_TYPES } from "./enums/railTypes.js";
import { Area } from "./area.js";
import { AREA_TYPES } from "./enums/areaTypes.js";

let isAuthenticated = window.isAuthenticated || false;

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

function reconstructAreas(areaData) {
    return areaData.map(a => {
        const areaType = Object.values(AREA_TYPES).find(t => t.type === a.type.type);
        return new Area(
            areaType || a.type,
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
}

function startGame() {
    const app = createApp();
    app.stage.sortableChildren = true;

    const camera = createCamera();

    const { gridScale: initScale, zoomSpeed, minScale, maxScale } = createZoomValues();
    let gridScale = initScale;
    const cellSize = 50;

    let level = 0;
    let placementMode = false;
    let money = 1000;
    let relations = 1;
    let areas = [];
    let unlockedCities = new Set();
    
    let areaRenderer, stationRenderer, railRenderer, pointerTextRenderer, trainRenderer, hudRenderer;
    let bisonManager, bisonProfitStore, loadingOverLay, bankManager, characterOverlay, buildingSpritesManager;
    let drawGraphics, getHighlightedTile, addLevel, addStations, spawnTrainsForConnectedRoutes, checkRouteConnections;
    let resetDrag, keyboardMapMovement;

    const getGridScale = () => gridScale;
    const getPlacementMode = () => placementMode;
    const getLevel = () => level;
    const setLevel = (value) => level = value;
    const getAreas = () => areas;
    const getRelations = () => relations;
    const setRelations = (value) => relations = value;
    const getMoney = () => money;
    const subMoney = (amount) => money -= amount;
    const addMoney = (amount) => money += amount;
    const getUnlockedCities = () => unlockedCities;
    const isCityUnlocked = (cityName) => unlockedCities.has(cityName);

    const renderers = creatRenderers(
        app, camera, getGridScale, cellSize, getAreas, getLevel, 
        addMoney, subMoney, getMoney, getPlacementMode, getRelations, setRelations,
        () => ({
            isActive: window.bankManager?.isLoanActive?.() || false,
            formattedTime: window.bankManager?.getFormattedTime?.() || "0:00"
        })
    );

    areaRenderer = renderers.areaRenderer;
    stationRenderer = renderers.stationRenderer;
    railRenderer = renderers.railRenderer;
    pointerTextRenderer = renderers.pointerTextRenderer;
    trainRenderer = renderers.trainRenderer;
    hudRenderer = renderers.hudRenderer;
    
    window.trainRenderer = trainRenderer;
    window.hudRenderer = hudRenderer;

    bisonManager = createBisonManager(app, getAreas, railRenderer, hudRenderer);
    window.bisonManager = bisonManager;
    
    bisonProfitStore = createBisonProfitStore();
    window.bisonProfitStore = bisonProfitStore;

    loadingOverLay = createLoadingOverlay(app, getGridScale);

    function onLoanExpired(expiredAmount, seizedMoney, remainingDebt) {
        hudRenderer?.markDirty();
    }

    bankManager = createBankManager(
        app, getMoney, addMoney, subMoney, onLoanExpired, railRenderer,
        () => hudRenderer.markDirty()
    );
    window.bankManager = bankManager;
    bankManager.reset();

    characterOverlay = createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer, getMoney, subMoney, addMoney);
    buildingSpritesManager = createBuildingSpritesManager(app, camera, getGridScale, cellSize, characterOverlay, getShiftPressed, getPlacementMode);
    window.buildingSpritesManager = buildingSpritesManager;

    const fgContainer = new PIXI.Container();
    fgContainer.zIndex = 10;

    async function saveGame() {
        if (!window.isAuthenticated) return;
        
        const gameData = {
            level: getLevel(),
            money: getMoney(),
            relations: getRelations(),
            areas: getAreas(),
            rails: railRenderer.getRails(),
            stations: stationRenderer.getStations(),
            unlocked_cities: Array.from(unlockedCities),
            purchased_items: {},
            building_state: {},
            loan_amount: bankManager.getLoanAmount?.() || 0,
            loan_active: bankManager.isLoanActive?.() || false,
            loan_time_remaining: bankManager.getTimeRemaining?.() || 0,
            bison_unlocked: bisonManager.isBisonUnlocked?.() || false,
            bison_profit: bisonProfitStore.getStoredProfit?.() || 0,
        };
        
        try {
            const response = await fetch('/accounts/save/', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCookie('csrftoken')
                },
                body: JSON.stringify(gameData)
            });
            
            if (response.ok) {
                console.log('Game saved successfully');
                showSaveNotification('Game saved!');
            }
        } catch (error) {
            console.error('Error saving game:', error);
        }
    }

    async function loadGame() {
        if (!window.isAuthenticated) return;
        console.log('loadGame called');
        
        try {
            const response = await fetch('/accounts/load/');
            if (response.ok) {
                const result = await response.json();
                if (result.status === 'success') {
                    const data = result.data;
                    console.log('Loading game data:', data);
                    
                    if (data.level !== undefined) level = data.level;
                    if (data.money !== undefined) money = data.money;
                    if (data.relations !== undefined) relations = data.relations;
                    
                    if (data.areas && data.areas.length > 0) {
                        areas = reconstructAreas(data.areas);
                    } else {
                        areas = generateAreas(level, null);
                    }
                    
                    if (data.rails && data.rails.length > 0) {
                        const railTypesMap = {
                            "STRAIGHT_H": RAIL_TYPES.STRAIGHT_H,
                            "STRAIGHT_V": RAIL_TYPES.STRAIGHT_V,
                            "CURVE_NE": RAIL_TYPES.CURVE_NE,
                            "CURVE_SE": RAIL_TYPES.CURVE_SE,
                            "CURVE_SW": RAIL_TYPES.CURVE_SW,
                            "CURVE_NW": RAIL_TYPES.CURVE_NW,
                            "T_N": RAIL_TYPES.T_N,
                            "T_E": RAIL_TYPES.T_E,
                            "T_S": RAIL_TYPES.T_S,
                            "T_W": RAIL_TYPES.T_W,
                            "CROSS": RAIL_TYPES.CROSS,
                        };
                        railRenderer.loadRails(data.rails, railTypesMap);
                    }
                    
                    if (data.stations && data.stations.length > 0) {
                        stationRenderer.loadStations(data.stations);
                    }
                    
                    if (data.unlocked_cities) {
                        unlockedCities = new Set(data.unlocked_cities);
                        unlockedCities.forEach(cityName => {
                            const city = areas.find(a => a.name === cityName);
                            if (city && city.building !== "none") {
                                buildingSpritesManager.createSprite(city);
                            }
                        });
                    }
                    
                    if (data.loan_amount !== undefined) {
                        bankManager.setLoanAmount?.(data.loan_amount);
                    }
                    
                    if (data.bison_unlocked !== undefined && data.bison_unlocked) {
                        bisonManager.unlockBisonBuilding?.();
                    }
                    if (data.bison_profit !== undefined) {
                        bisonProfitStore.setStoredProfit?.(data.bison_profit);
                    }
                    
                    initializeGame();
                    showSaveNotification('Game loaded!');
                }
            }
        } catch (error) {
            console.error('Error loading game:', error);
            areas = generateAreas(level, null);
            initializeGame();
        }
    }

    function initializeGame() {
        const highlightResult = setupTileHighlight(
            app, camera, () => gridScale, cellSize, () => drawGraphics(), 
            areas, getPlacementMode, bisonManager, railRenderer, 
            () => hudRenderer.getSelectedType(), characterOverlay, getUnlockedCities
        );
        getHighlightedTile = highlightResult.getHighlightedTile;

        const drawGraphicsInstance = createDrawGraphics(
            app, camera, getGridScale, cellSize, getLevel, 
            () => getHighlightedTile ? getHighlightedTile() : null, 
            getPlacementMode, getAreas, 
            { areaRenderer, stationRenderer, railRenderer, pointerTextRenderer, trainRenderer, hudRenderer }, 
            fgContainer
        );
        drawGraphics = drawGraphicsInstance.drawGraphics;

        const stationManager = createStationManager(
            stationRenderer, areaRenderer, drawGraphics, getAreas, getLevel, setLevel,
            railRenderer, trainRenderer,
            (cityName) => {
                if (unlockedCities.has(cityName)) return;
                unlockedCities.add(cityName);
                const city = areas.find(a => a.name === cityName);
                if (city?.building !== "none") buildingSpritesManager.createSprite(city);
            },
            characterOverlay, loadingOverLay
        );
        addLevel = stationManager.addLevel;
        addStations = stationManager.addStations;
        spawnTrainsForConnectedRoutes = stationManager.spawnTrainsForConnectedRoutes;

        const routeChecker = createRouteChecker(stationRenderer, railRenderer);
        checkRouteConnections = routeChecker.checkRouteConnections;

        function findCityByStation(stationX, stationY, areas) {
            return areas.find(area => 
                area.type?.type === "city" &&
                stationX >= area.x - 1 && stationX <= area.x + area.sizeX &&
                stationY >= area.y - 1 && stationY <= area.y + area.sizeY
            );
        }

        railRenderer.setOnRailPlaceCheckConn(() => {
            const result = checkRouteConnections();
            const connectedIndices = result.filter(r => r.connected).map(r => r.routeIndex);
            spawnTrainsForConnectedRoutes(connectedIndices);

            const stations = stationRenderer.getStations();
            const areasList = getAreas();

            connectedIndices.forEach(index => {
                const pair = stations.filter(s => s.index === index);
                if (pair.length === 2) {
                    const city1 = findCityByStation(pair[0].x, pair[0].y, areasList);
                    const city2 = findCityByStation(pair[1].x, pair[1].y, areasList);
                    
                    [city1, city2].forEach(city => {
                        if (city && !isCityUnlocked(city.name) && !unlockedCities.has(city.name)) {
                            unlockedCities.add(city.name);
                            if (city.building !== "none") buildingSpritesManager.createSprite(city);
                        }
                    });
                    
                    if (getLevel() === 0 && index === 5) {
                        addLevel();
                        console.log("Level up!");
                    }
                }
            });

            const allConnected = result.length > 0 && result.every(r => r.connected);
            if (allConnected) addStations();
        });

        const originalDrawGraphics = drawGraphics;
        function enhancedDrawGraphics() {
            originalDrawGraphics();
            buildingSpritesManager.updatePositions();
        }
        drawGraphics = enhancedDrawGraphics;
        drawGraphics();

        const mouseControls = setupMouseControls(
            app, camera, getGridScale, cellSize, getPlacementMode, railRenderer,
            () => drawGraphics(), () => hudRenderer.getSelectedType(),
            characterOverlay, areas, stationRenderer, isCityUnlocked,
            (cityName) => {
                if (unlockedCities.has(cityName)) return;
                unlockedCities.add(cityName);
                const city = areas.find(a => a.name === cityName);
                if (city?.building !== "none") buildingSpritesManager.createSprite(city);
            }
        );
        resetDrag = mouseControls.resetDrag;

        document.addEventListener("keydown", (event) => {
            if (event.code === "Escape" && characterOverlay.isVisible()) {
                characterOverlay.hideOverlay();
            }
        });

        app.view.addEventListener("wheel", (event) => {
            if (characterOverlay.isVisible?.()) {
                event.preventDefault();
                return;
            }
            event.preventDefault();
            const zoomFactor = event.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
            mapZoom(zoomFactor, event);
        });

        function updateStageHitArea() {
            app.stage.hitArea = new PIXI.Rectangle(0, 0, app.screen.width / gridScale, app.screen.height / gridScale);
        }

        function mapZoom(zoomFactor, event) {
            const newScale = Math.min(maxScale, Math.max(minScale, gridScale * zoomFactor));
            
            if (event) {
                const mouseX = event.clientX - app.screen.width / 2;
                const mouseY = event.clientY - app.screen.height / 2;
                const worldMouseX = camera.x + mouseX / gridScale;
                const worldMouseY = camera.y + mouseY / gridScale;
                camera.x = worldMouseX - mouseX / newScale;
                camera.y = worldMouseY - mouseY / newScale;
            }

            gridScale = newScale;
            app.stage.scale.set(gridScale, gridScale);
            updateStageHitArea();
            
            [areaRenderer, stationRenderer, railRenderer, hudRenderer].forEach(r => r?.markDirty());
            pointerTextRenderer.refresh(() => gridScale);
            hudRenderer.draw();
            characterOverlay.refresh();
            buildingSpritesManager.refresh();
            loadingOverLay.refresh();
            trainRenderer?.markDirty();
            
            drawGraphics();
        }

        window.addEventListener("resize", () => {
            const oldWidth = app.screen.width;
            const oldHeight = app.screen.height;
            
            app.renderer.resize(window.innerWidth, window.innerHeight);
            
            const newWidth = app.screen.width;
            const newHeight = app.screen.height;
            
            const widthDiff = (newWidth - oldWidth) / 2 / gridScale;
            const heightDiff = (newHeight - oldHeight) / 2 / gridScale;
            
            camera.x -= widthDiff;
            camera.y -= heightDiff;
            
            updateStageHitArea();
            [areaRenderer, stationRenderer, railRenderer, hudRenderer].forEach(r => r?.markDirty());
            trainRenderer?.markDirty();
            buildingSpritesManager.refresh();
            characterOverlay.refresh();
            loadingOverLay.refresh();
            drawGraphics();
        });

        keyboardMapMovement = keyboardControls(
            camera, zoomSpeed, gridScale, mapZoom, drawGraphics, addLevel, addStations,
            { get placementMode() { return placementMode; }, set placementMode(value) { placementMode = value; } },
            areaRenderer, pointerTextRenderer, resetDrag, stationRenderer, hudRenderer, characterOverlay
        );

        window.addEventListener('beforeunload', saveGame);

        app.ticker.add(() => {
            keyboardMapMovement();
        });

        window.getLevel = getLevel;
        window.getMoney = getMoney;
        window.getRelations = getRelations;
        window.getAreas = getAreas;
        window.railRenderer = railRenderer;
        window.stationRenderer = stationRenderer;
        window.unlockedCities = unlockedCities;
        window.bankManager = bankManager;
        window.bisonManager = bisonManager;
        window.bisonProfitStore = bisonProfitStore;
        window.saveGame = saveGame;
    }

    console.log("isAuthenticated:", window.isAuthenticated);
    if (window.isAuthenticated) {
        console.log("User is authenticated, loading game...");
        loadGame();
        setInterval(saveGame, 30000);
    } else {
        console.log("User not authenticated, should not be here!");
    }
}

function getCookie(name) {
    let cookieValue = null;
    if (document.cookie && document.cookie !== '') {
        const cookies = document.cookie.split(';');
        for (let i = 0; i < cookies.length; i++) {
            const cookie = cookies[i].trim();
            if (cookie.substring(0, name.length + 1) === (name + '=')) {
                cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
                break;
            }
        }
    }
    return cookieValue;
}

function showSaveNotification(message) {
    const notification = document.createElement('div');
    notification.style.position = 'fixed';
    notification.style.top = '60px';
    notification.style.right = '20px';
    notification.style.backgroundColor = '#28a745';
    notification.style.color = 'white';
    notification.style.padding = '10px 20px';
    notification.style.borderRadius = '5px';
    notification.style.zIndex = '1000';
    notification.style.animation = 'fadeOut 2s forwards';
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 2000);
}

document.head.appendChild(style);
startGame();