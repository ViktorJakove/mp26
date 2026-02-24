import { BUILDING_TEXTS, DEFAULT_BUILDING_TEXT } from "../../text/buildingTexts.js";

export function createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer) {
    
    const overlayContainer = new PIXI.Container();
    overlayContainer.zIndex = 100;
    overlayContainer.visible = false;
    
    overlayContainer.interactive = true;
    overlayContainer.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    
    app.stage.addChild(overlayContainer);
    
    let currentCity = null;
    let onCloseCallback = null;
    let currentTextIndex = 0;
    let buildingDescText = null;
    let characterSprite = null;
    let overlayBg = null;

    function getBuildingSpritePath(buildingKey, index) {
        if (!BUILDING_TEXTS[buildingKey]) {
            console.warn(`Building key "${buildingKey}" not found in BUILDING_TEXTS`);
            return null;
        }
        
        const spriteArray = BUILDING_TEXTS[buildingKey].sprite;
        if (!spriteArray || spriteArray[index] === undefined) {
            console.warn(`Sprite index ${index} not found for building "${buildingKey}"`);
            return null;
        }
        
        const path = "../../graphics/chars/" + buildingKey + "/" + buildingKey + spriteArray[index] + ".png";
        return path;
    }
    
    function getBuildingSpritePos(buildingKey, index) {
        let spritePos = BUILDING_TEXTS[buildingKey].spritePos[index];
        switch (spritePos){
            case "L":
                spritePos = app.screen.width * 0.33;
                break;
            case "C":
                spritePos = app.screen.width * 0.5;
                break;
            case "P":
                spritePos = app.screen.width * 0.66;
                break;
            case "R":
                    spritePos = app.screen.width * 0.66;
                    break;
            default:
                spritePos = app.screen.width * 0.5;
        }
        return spritePos;
    }

    function showCityInfo(cityArea) {
        if (cityArea.building === "none") return;
        currentCity = cityArea;
        currentTextIndex = 0;
        
        overlayContainer.removeChildren();
        
        // Create the semi-transparent background
        overlayBg = new PIXI.Graphics();
        overlayBg.beginFill(0x000000, 0.7);
        overlayBg.drawRect(0, 0, app.screen.width, app.screen.height);
        overlayBg.endFill();
        
        overlayBg.interactive = true;
        overlayBg.on('pointerdown', (e) => {
            e.stopPropagation();
            handleOverlayClick();
        });
        
        // Set initial alpha to 0 for fade-in
        overlayBg.alpha = 0;
        
        overlayContainer.addChild(overlayBg);
        
        try {
            const buildingKey = cityArea.building || "none";
            const spritePath = getBuildingSpritePath(buildingKey, currentTextIndex);
            const spritePos = getBuildingSpritePos(buildingKey, currentTextIndex);
            
            if (!spritePath) {
                console.warn(`No sprite path for ${buildingKey}`);
                return;
            }
            
            const texture = PIXI.Texture.from(spritePath);
            characterSprite = new PIXI.Sprite(texture);
            
            characterSprite.anchor.set(0.5);
            characterSprite.x = spritePos;
            characterSprite.y = app.screen.height / 5 * 2;

            characterSprite.interactive = true;
            characterSprite.on('pointerdown', (e) => {
                e.stopPropagation();
                handleOverlayClick();
            });
            
            const maxSize = Math.min(app.screen.width, app.screen.height) * 0.6;
            
            const setSpriteScale = () => {
                if (characterSprite.texture && characterSprite.texture.valid) {
                    const scale = maxSize / Math.max(characterSprite.texture.width, characterSprite.texture.height);
                    characterSprite.scale.set(scale);
                }
            };
            
            if (texture.valid) {
                setSpriteScale();
            } else {
                texture.once('update', setSpriteScale);
            }
            
            overlayContainer.addChild(characterSprite);
        } catch (error) {
            console.warn("Could not load character sprite:", error);
        }
    
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
        const buildingData = BUILDING_TEXTS[buildingKey] || DEFAULT_BUILDING_TEXT;
        const buildingTexts = buildingData.text;
        
        buildingDescText = new PIXI.Text(buildingTexts[0], {
            fontFamily: "Arial",
            fontSize: 16,
            fill: 0xecf0f1,
            fontStyle: "italic",
            wordWrap: true,
            wordWrapWidth: panelWidth - 40
        });
        buildingDescText.x = 20;
        buildingDescText.y = 60;
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
        
        // Start fade-in animation
        fadeInBackground();
    }

    function fadeInBackground() {
        if (!overlayBg) return;
        
        let elapsed = 0;
        const duration = 300; // 300ms fade duration
        const startTime = Date.now();
        
        function animate() {
            const now = Date.now();
            elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease-out cubic for smooth deceleration
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            
            overlayBg.alpha = easeOutProgress * 0.7; // Target alpha 0.7
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        animate();
    }

    function handleOverlayClick() {
        if (!currentCity || !buildingDescText) return;
        
        const buildingKey = currentCity.building || "none";
        const buildingData = BUILDING_TEXTS[buildingKey] || DEFAULT_BUILDING_TEXT;
        const buildingTexts = buildingData.text;
        
        if (currentTextIndex === buildingTexts.length - 1) {
            hideOverlay();
            return;
        }
        
        currentTextIndex = (currentTextIndex + 1) % buildingTexts.length;
        buildingDescText.text = buildingTexts[currentTextIndex];
        
        if (characterSprite) {
            try {
                const spritePath = getBuildingSpritePath(buildingKey, currentTextIndex);
                const spritePos = getBuildingSpritePos(buildingKey, currentTextIndex);
                
                if (!spritePath) {
                    console.warn(`No sprite path for ${buildingKey} at index ${currentTextIndex}`);
                    return;
                }
                
                const newTexture = PIXI.Texture.from(spritePath);
                const maxSize = Math.min(app.screen.width, app.screen.height) * 0.6;
                
                characterSprite.x = spritePos;
                
                const setNewTexture = () => {
                    characterSprite.texture = newTexture;
                    const scale = maxSize / Math.max(newTexture.width, newTexture.height);
                    characterSprite.scale.set(scale);
                };
                
                if (newTexture.valid) {
                    setNewTexture();
                } else {
                    newTexture.once('update', setNewTexture);
                }
                
            } catch (error) {
                console.warn("Could not update character sprite:", error);
            }
        }
    }

    function hideOverlay() {
        overlayContainer.visible = false;
        currentCity = null;
        buildingDescText = null;
        characterSprite = null;
        overlayBg = null;
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
        overlayContainer.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
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