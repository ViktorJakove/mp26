import { BUILDING_TEXTS, DEFAULT_BUILDING_TEXT } from "../../text/buildingTexts.js";

export function createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer, getMoney, subMoney) {
    
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
    let buttonContainer = null;
    let transactionState = {
        active: false,
        buildingKey: null
    };
    let panel = null;
    let instructionText = null;

    function getBuildingSpritePath(buildingKey, index) {
        if (!BUILDING_TEXTS[buildingKey]) {
            return null;
        }
        
        const spriteArray = BUILDING_TEXTS[buildingKey].sprite;
        if (!spriteArray || spriteArray[index] === undefined) {
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
            case "R":
                spritePos = app.screen.width * 0.66;
                break;
            default:
                spritePos = app.screen.width * 0.5;
        }
        return spritePos;
    }

    function showTransactionStep() {
        if (!currentCity || !transactionState.active) return;
        
        const buildingKey = currentCity.building || "none";
        const buildingData = BUILDING_TEXTS[buildingKey];
        
        if (!buildingData || !buildingData.transaction) {
            hideOverlay();
            return;
        }

        if (buildingData.transaction.questionSprite !== undefined) {
            try {
                const spriteValue = buildingData.transaction.questionSprite;
                const spritePath = "../../graphics/chars/" + buildingKey + "/" + buildingKey + spriteValue + ".png";
                
                const newTexture = PIXI.Texture.from(spritePath);
                const maxSize = Math.min(app.screen.width, app.screen.height) * 0.6;
                
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
                console.warn("Could not load question sprite:", error);
            }
        }
        
        if (buildingData.transaction.questionSpritePos !== undefined) {
            const spritePos = buildingData.transaction.questionSpritePos;
            switch (spritePos){
                case "L":
                    characterSprite.x = app.screen.width * 0.33;
                    break;
                case "C":
                    characterSprite.x = app.screen.width * 0.5;
                    break;
                case "P":
                case "R":
                    characterSprite.x = app.screen.width * 0.66;
                    break;
                default:
                    characterSprite.x = app.screen.width * 0.5;
            }
        }

        if (instructionText) {
            instructionText.visible = false;
        }

        buildingDescText.text = `${buildingData.transaction.question}\n\nCena: $${buildingData.transaction.cost}`;
        
        createTransactionButtons();
    }

    function createTransactionButtons() {
        if (buttonContainer) {
            buttonContainer.destroy();
            buttonContainer = null;
        }
    
        buttonContainer = new PIXI.Container();
        
        const buttonWidth = 120;
        const buttonHeight = 50;
        const buttonSpacing = 30;
        const totalWidth = buttonWidth * 2 + buttonSpacing;
        
        const startX = (panel.width - totalWidth) / 2;
        const buttonY = (panel.height - buttonHeight) / 2 + 40;
    
        const yesButton = new PIXI.Graphics();
        yesButton.beginFill(0x27ae60);
        yesButton.lineStyle(2, 0x2ecc71);
        yesButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
        yesButton.endFill();
        yesButton.interactive = true;
        yesButton.cursor = "pointer";
        
        const yesText = new PIXI.Text("ANO", {
            fontFamily: "Arial",
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: "bold"
        });
        yesText.anchor.set(0.5);
        yesText.x = buttonWidth / 2;
        yesText.y = buttonHeight / 2;
        yesButton.addChild(yesText);
        
        yesButton.on('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            handleTransaction(true);
        });
        
        yesButton.x = startX;
        yesButton.y = buttonY;
    
        const noButton = new PIXI.Graphics();
        noButton.beginFill(0xc0392b);
        noButton.lineStyle(2, 0xe74c3c);
        noButton.drawRoundedRect(0, 0, buttonWidth, buttonHeight, 8);
        noButton.endFill();
        noButton.interactive = true;
        noButton.cursor = "pointer";
        
        const noText = new PIXI.Text("NE", {
            fontFamily: "Arial",
            fontSize: 20,
            fill: 0xffffff,
            fontWeight: "bold"
        });
        noText.anchor.set(0.5);
        noText.x = buttonWidth / 2;
        noText.y = buttonHeight / 2;
        noButton.addChild(noText);
        
        noButton.on('pointerdown', (e) => {
            e.stopPropagation();
            e.preventDefault();
            hideOverlay();
        });
        
        noButton.x = startX + buttonWidth + buttonSpacing;
        noButton.y = buttonY;
    
        buttonContainer.addChild(yesButton);
        buttonContainer.addChild(noButton);
        
        panel.addChild(buttonContainer);
    }

    function handleTransaction(accepted) {
        if (!currentCity || !transactionState.active) return;
        
        const buildingKey = currentCity.building || "none";
        const buildingData = BUILDING_TEXTS[buildingKey];
        
        if (!buildingData || !buildingData.transaction) {
            hideOverlay();
            return;
        }

        if (accepted) {
            const cost = buildingData.transaction.cost;
            if (getMoney() >= cost) {
                subMoney(cost);
                showTransactionResult(buildingData.transaction.successText, buildingData.transaction.successSprite);
                if (railRenderer) railRenderer.markDirty();
                if (stationRenderer) stationRenderer.markDirty();
            } else {
                showTransactionResult(buildingData.transaction.failText);
            }
        }
    }

    function showTransactionResult(message, successSprite) {
        if (!buildingDescText) return;
        
        if (buttonContainer) {
            buttonContainer.destroy();
            buttonContainer = null;
        }
        
        transactionState.active = false;
        buildingDescText.text = message;
        
        if (successSprite && characterSprite) {
            try {
                const buildingKey = currentCity.building || "none";
                const spritePath = "../../graphics/chars/" + buildingKey + "/" + buildingKey + successSprite + ".png";
                const newTexture = PIXI.Texture.from(spritePath);
                
                const setNewTexture = () => {
                    characterSprite.texture = newTexture;
                };
                
                if (newTexture.valid) {
                    setNewTexture();
                } else {
                    newTexture.once('update', setNewTexture);
                }
            } catch (error) {
                console.warn("Could not load success sprite:", error);
            }
        }
        
        setTimeout(() => {
            hideOverlay();
        }, 2000);
    }

    function showCityInfo(cityArea) {
        if (cityArea.building === "none") return;
        
        if (transactionState.active) return;
        
        currentCity = cityArea;
        currentTextIndex = 0;
        transactionState.active = false;
        
        overlayContainer.removeChildren();
        
        overlayBg = new PIXI.Graphics();
        overlayBg.beginFill(0x000000, 0.7);
        overlayBg.drawRect(0, 0, app.screen.width, app.screen.height);
        overlayBg.endFill();
        
        overlayBg.interactive = true;
        overlayBg.on('pointerdown', (e) => {
            e.stopPropagation();
            handleOverlayClick();
        });
        
        overlayBg.alpha = 0;
        
        overlayContainer.addChild(overlayBg);
        
        try {
            const buildingKey = cityArea.building || "none";
            const spritePath = getBuildingSpritePath(buildingKey, currentTextIndex);
            const spritePos = getBuildingSpritePos(buildingKey, currentTextIndex);
            
            if (!spritePath) {
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
    
        panel = new PIXI.Container();
        
        const panelWidth = app.screen.width * 0.8;
        const panelHeight = app.screen.height * 0.4;
        const panelX = (app.screen.width - panelWidth) / 2;
        const panelY = app.screen.height - panelHeight - 20;
    
        const panelBg = new PIXI.Graphics();
        panelBg.beginFill(0x2c3e50, 0.95);
        panelBg.lineStyle(2, 0xf5c518);
        panelBg.drawRoundedRect(0, 0, panelWidth, panelHeight, 12);
        panelBg.endFill();
        panelBg.interactive = true;
        panelBg.on('pointerdown', (e) => {
            e.stopPropagation();
            handleOverlayClick();
        });
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
            fontSize: 18,
            fill: 0xecf0f1,
            fontStyle: "italic",
            wordWrap: true,
            wordWrapWidth: panelWidth - 40,
            align: "center"
        });
        buildingDescText.x = 20;
        buildingDescText.y = 70;
        buildingDescText.interactive = true;
        buildingDescText.on('pointerdown', (e) => {
            e.stopPropagation();
            handleOverlayClick();
        });
        panel.addChild(buildingDescText);
    
        instructionText = new PIXI.Text("Klikni kamkoli pro další text...", {
            fontFamily: "Arial",
            fontSize: 14,
            fill: 0x95a5a6,
            fontStyle: "italic"
        });
        instructionText.x = panelWidth - 220;
        instructionText.y = panelHeight - 30;
        instructionText.interactive = true;
        instructionText.on('pointerdown', (e) => {
            e.stopPropagation();
            handleOverlayClick();
        });
        panel.addChild(instructionText);
    
        panel.x = panelX;
        panel.y = panelY;
        
        panel.interactive = true;
        panel.interactiveChildren = true;
        
        overlayContainer.addChild(panel);
        
        overlayContainer.visible = true;
        overlayContainer.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
        
        fadeInBackground();
    }

    function fadeInBackground() {
        if (!overlayBg) return;
        
        let elapsed = 0;
        const duration = 600;
        const startTime = Date.now();
        
        function animate() {
            const now = Date.now();
            elapsed = now - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOutProgress = 1 - Math.pow(1 - progress, 3);
            
            overlayBg.alpha = easeOutProgress * 0.8;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        }
        
        animate();
    }

    function handleOverlayClick() {
        if (!currentCity || !buildingDescText) return;
        
        if (transactionState.active) return;
        
        const buildingKey = currentCity.building || "none";
        const buildingData = BUILDING_TEXTS[buildingKey] || DEFAULT_BUILDING_TEXT;
        const buildingTexts = buildingData.text;
        
        if (currentTextIndex < buildingTexts.length - 1) {
            currentTextIndex++;
            buildingDescText.text = buildingTexts[currentTextIndex];
            
            if (characterSprite) {
                try {
                    const spritePath = getBuildingSpritePath(buildingKey, currentTextIndex);
                    const spritePos = getBuildingSpritePos(buildingKey, currentTextIndex);
                    
                    if (!spritePath) {
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
    
            if (currentTextIndex === buildingTexts.length - 1) {
                instructionText.text = "Toto byl poslední text...";
            }
        } else if (currentTextIndex === buildingTexts.length - 1) {
            const buildingDataWithTransaction = BUILDING_TEXTS[buildingKey];
            if (buildingDataWithTransaction && 
                buildingDataWithTransaction.transaction && 
                !transactionState.active && 
                transactionState.buildingKey !== buildingKey) {
                transactionState.active = true;
                transactionState.buildingKey = buildingKey;
                showTransactionStep();
            } else {
                hideOverlay();
            }
        }
    }

    function hideOverlay() {
        overlayContainer.visible = false;
        currentCity = null;
        buildingDescText = null;
        characterSprite = null;
        overlayBg = null;
        panel = null;
        instructionText = null;
        currentTextIndex = 0;
        transactionState.active = false;
        transactionState.buildingKey = null;
        if (buttonContainer) {
            buttonContainer.destroy();
            buttonContainer = null;
        }
        
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