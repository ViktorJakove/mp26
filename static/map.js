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
    areas = generateAreas(level, null);

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

    let unlockedCities = new Set();
    const getUnlockedCities = () => unlockedCities;

    //renderers
    const renderers = creatRenderers(
        app, camera, getGridScale, cellSize, getAreas, getLevel, 
        addMoney, subMoney, getMoney, getPlacementMode, getRelations, setRelations,
        () => ({
            isActive: window.bankManager?.isLoanActive?.() || false,
            formattedTime: window.bankManager?.getFormattedTime?.() || "0:00"
        })
    );

    const { areaRenderer, stationRenderer, railRenderer, pointerTextRenderer, trainRenderer, hudRenderer } = renderers;
    
    window.trainRenderer = trainRenderer;
    window.hudRenderer = hudRenderer;

    //managery
    const bisonManager = createBisonManager(app, getAreas, railRenderer, hudRenderer);
    window.bisonManager = bisonManager;
    
    const bisonProfitStore = createBisonProfitStore();
    window.bisonProfitStore = bisonProfitStore;

    const loadingOverLay = createLoadingOverlay(app, getGridScale);

    function onLoanExpired(expiredAmount, seizedMoney, remainingDebt) {
        hudRenderer?.markDirty();
    }

    const bankManager = createBankManager(
        app, getMoney, addMoney, subMoney, onLoanExpired, railRenderer,
        () => hudRenderer.markDirty()
    );
    window.bankManager = bankManager;
    bankManager.reset();

    const characterOverlay = createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer, getMoney, subMoney, addMoney);

    const buildingSpritesManager = createBuildingSpritesManager(app, camera, getGridScale, cellSize, characterOverlay, getShiftPressed, getPlacementMode);
    window.buildingSpritesManager = buildingSpritesManager;

    

    const fgContainer = new PIXI.Container();
    fgContainer.zIndex = 10;
    
    const { getHighlightedTile } = setupTileHighlight(
        app, camera, () => gridScale, cellSize, () => drawGraphics(), 
        areas, getPlacementMode, bisonManager, railRenderer, 
        () => hudRenderer.getSelectedType(), characterOverlay, getUnlockedCities
    );

    const drawGraphicsInstance = createDrawGraphics(
        app, camera, getGridScale, cellSize, getLevel, 
        getHighlightedTile, getPlacementMode, getAreas, renderers, fgContainer
    );
    let drawGraphics = drawGraphicsInstance.drawGraphics;

    const { addLevel, addStations, spawnTrainsForConnectedRoutes } = createStationManager(
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

    const { checkRouteConnections } = createRouteChecker(stationRenderer, railRenderer);

    //autentizace
    const isAuthenticated = window.isAuthenticated || false;

    async function saveGame() {
        if (!isAuthenticated) return;
        
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
        if (!isAuthenticated) return;
        
        try {
            const response = await fetch('/accounts/load/');
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success') {
                    console.log('Game loaded:', data.data);
                    showSaveNotification('Game loaded!');
                }
            }
        } catch (error) {
            console.error('Error loading game:', error);
        }
    }

    //load
    if (isAuthenticated) {
        loadGame();
        setInterval(saveGame, 30000);
    }

    

    function findCityByStation(stationX, stationY, areas) {
        return areas.find(area => 
            area.type?.type === "city" &&
            stationX >= area.x - 1 && stationX <= area.x + area.sizeX &&
            stationY >= area.y - 1 && stationY <= area.y + area.sizeY
        );
    }

    const isCityUnlocked = (cityName) => unlockedCities.has(cityName);

    railRenderer.setOnRailPlaceCheckConn(() => {
        const result = checkRouteConnections();
        const connectedIndices = result.filter(r => r.connected).map(r => r.routeIndex);
        spawnTrainsForConnectedRoutes(connectedIndices);

        const stations = stationRenderer.getStations();
        const areas = getAreas();

        connectedIndices.forEach(index => {
            const pair = stations.filter(s => s.index === index);
            if (pair.length === 2) {
                const city1 = findCityByStation(pair[0].x, pair[0].y, areas);
                const city2 = findCityByStation(pair[1].x, pair[1].y, areas);
                
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

    const { resetDrag } = setupMouseControls(
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

    const keyboardMapMovement = keyboardControls(
        camera, zoomSpeed, gridScale, mapZoom, drawGraphics, addLevel, addStations,
        { get placementMode() { return placementMode; }, set placementMode(value) { placementMode = value; } },
        areaRenderer, pointerTextRenderer, resetDrag, stationRenderer, hudRenderer, characterOverlay
    );

    window.addEventListener('beforeunload', saveGame);

    app.ticker.add(() => {
        keyboardMapMovement();
    });
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

const style = document.createElement('style');
style.textContent = `
    @keyframes fadeOut {
        0% { opacity: 1; }
        70% { opacity: 1; }
        100% { opacity: 0; }
    }
`;
document.head.appendChild(style);

startGame();