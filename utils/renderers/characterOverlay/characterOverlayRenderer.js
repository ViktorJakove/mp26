import { BUILDING_TEXTS } from "../../../text/buildingTexts.js";
import { createOverlayUI } from "./overlayUI.js";
import { createShopManager } from "./shopManager.js";
import { createTransactionManager } from "./transactionManager.js";
import { getPath, getPos, getTexts, getStart, updateSprite } from "../../overlayHelpers.js";

export function createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer, getMoney, subMoney, addMoney) {
    let isAnimating = false;
    const container = new PIXI.Container();
    Object.assign(container, { zIndex: 100, visible: false, interactive: true });
    container.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(container);

    let city = null;
    let onClose = null;
    const buildingState = new Map();
    const firstOpenTracker = new Set();
    
    const ui = createOverlayUI(app, container, () => handleClick());
    const shopManager = createShopManager(app, getMoney, subMoney, railRenderer, stationRenderer);
    const transactionManager = createTransactionManager(app, ui.panel, ui.desc, ui.instr, ui.sprite, railRenderer, stationRenderer, getMoney, subMoney, addMoney, hide);

    function animateSpriteEntry(sprite, startX, startY, targetX, targetY, duration = 800) {
        sprite.x = startX;
        sprite.y = startY;
        
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const eased = 1 - Math.pow(1 - progress, 3);
            
            sprite.x = startX + (targetX - startX) * eased;
            sprite.y = startY + (targetY - startY) * eased;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.x = targetX;
                sprite.y = targetY;
                isAnimating = false;
            }
        };
        
        animate();
    }

    function fadeFromBlack(sprite, duration = 2000) {
        const startTime = Date.now();
        
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const brightness = Math.floor(progress * 255);
            sprite.tint = (brightness << 16) | (brightness << 8) | brightness;
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                sprite.tint = 0xFFFFFF;
                isAnimating = false;
            }
        };
        
        animate();
    }

    function setupSpriteAnimation(sprite, targetX, targetY, isFirstOpen) {
        if (!sprite) return;
        
        try{
            const screenWidth = app.screen.width;
            const screenHeight = app.screen.height;
            let startX = targetX;
            let startY = targetY;
            
            if (targetX < screenWidth * 0.4) {
                startX = -sprite.width;
            } else if (targetX > screenWidth * 0.6) {
                startX = screenWidth + sprite.width;
            } else {
                startY = screenHeight + sprite.height;
            }
            
            isAnimating = true;
            
            animateSpriteEntry(sprite, startX, startY, targetX, targetY, 800);
            
            if (isFirstOpen) {
                sprite.tint = 0x000000;
                
                setTimeout(() => {
                    fadeFromBlack(sprite, 2000);
                }, 1000);
            }
        }catch(error){
            console.error("Error v setupSpriteAnimation:", error);
            isAnimating = false;
        }
    }

    function handleClick() {
        if (!city || !ui.desc || transactionManager.isActive() || shopManager.shopContainer || isAnimating) return;
        
        const key = city.building;
        const texts = getTexts(key, buildingState);
        const d = BUILDING_TEXTS[key];
        const s = buildingState.get(key) || { questionShown: false, completed: false, shopOpened: false };
        const textIdx = ui.getTextIndex();

        if (key === "olda" && window.bisonProfitStore && window.bisonProfitStore.getStoredProfit() > 0) {
            if (!ui.sprite || !ui.desc || !ui.panel) {
                const targetX = getPos(key, textIdx, s?.completed, app, buildingState);
                const targetY = app.screen.height / 5 * 2;
                const path = getPath(key, textIdx, s?.completed, buildingState);
                
                ui.createSprite(path, targetX, targetY);
                
                if (!ui.panel) {
                    const title = city.name;
                    const instruction = "Klikni pro výběr...";
                    ui.createPanel(title, "", instruction);
                }
            }
            
            transactionManager.updateUIElements(ui.panel, ui.desc, ui.instr, ui.sprite);
            transactionManager.setActive(true, key);
            transactionManager.showTransaction(key, buildingState);
            return;
        }
    
        if (s?.completed) {
            if (textIdx === texts.length - 1) {
                hide();
                return;
            }
            
            ui.setTextIndex(texts.length - 1);
            ui.setText(texts[texts.length - 1]);
            updateSprite(ui.sprite, key, texts.length - 1, true, app, buildingState);
            ui.setInstruction("Klikni pro zavření...");
            return;
        }
    
        if (textIdx < texts.length - 1) {
            ui.incrementTextIndex();
            ui.setText(texts[ui.getTextIndex()]);
            updateSprite(ui.sprite, key, ui.getTextIndex(), s.completed, app, buildingState);
            
            if (ui.getTextIndex() === texts.length - 1) {
                ui.setInstruction("Toto byl poslední text...");
                if (d?.transaction && !s.completed) {
                    buildingState.set(key, { ...s, questionShown: true });
                }
            }
        } else if (textIdx === texts.length - 1) {
            if (d?.transaction && !s.completed) {
                if (!ui.sprite || !ui.desc || !ui.panel) {
                    const targetX = getPos(key, textIdx, s?.completed, app, buildingState);
                    const targetY = app.screen.height / 5 * 2;
                    const path = getPath(key, textIdx, s?.completed, buildingState);
                    
                    ui.createSprite(path, targetX, targetY);
                    
                    if (!ui.panel) {
                        const title = city.name;
                        const description = texts[textIdx];
                        const instruction = "Klikni kamkoli pro další text...";
                        ui.createPanel(title, description, instruction);
                    }
                }
                
                transactionManager.updateUIElements(ui.panel, ui.desc, ui.instr, ui.sprite);
                transactionManager.setActive(true, key);
                transactionManager.showTransaction(key, buildingState);
            } else if (shopManager.hasItems(key) && !s.completed) {
                buildingState.set(key, { ...s, shopOpened: true });
                shopManager.showShop(key, ui.panel, ui.desc, ui.instr);
            } else {
                hide();
            }
        }
    }

    function hide() {
        container.visible = false;
        city = null;
        ui.destroy();
        transactionManager.destroyButtons();
        shopManager.hide();
        ui.setTextIndex(0);
        transactionManager.setActive(false, null);
        if (onClose) onClose();
    }

    container.showCityInfo = (c) => {
        if (c.building === "none" || transactionManager.isActive()) return;
        
        city = c;
        const key = c.building;
        const s = buildingState.get(key);
        
        const hasShopItems = shopManager.hasItems(key);
        const wasShopOpened = s?.shopOpened || false;
        const isFirstOpen = !firstOpenTracker.has(key);
        
        container.removeChildren();
        ui.createBackground();
        
        const title = c.name;
        
        if (hasShopItems && wasShopOpened) {
            const texts = getTexts(key, buildingState);
            ui.setTextIndex(texts.length - 1);
            
            const path = getPath(key, texts.length - 1, s?.completed, buildingState);
            const targetX = getPos(key, texts.length - 1, s?.completed, app, buildingState);
            const targetY = app.screen.height / 5 * 2;
            ui.createSprite(path, targetX, targetY);
            
            setupSpriteAnimation(ui.sprite, targetX, targetY, isFirstOpen);
            if (isFirstOpen) firstOpenTracker.add(key);
            
            ui.createPanel(title, "", "Vyber si zboží...");
            
            shopManager.showShop(key, ui.panel, ui.desc, ui.instr);
            
        } else {
            const textIdx = getStart(key, buildingState);
            ui.setTextIndex(textIdx);
            
            const path = getPath(key, textIdx, s?.completed, buildingState);
            const targetX = getPos(key, textIdx, s?.completed, app, buildingState);
            const targetY = app.screen.height / 5 * 2;
            ui.createSprite(path, targetX, targetY);
            
            setupSpriteAnimation(ui.sprite, targetX, targetY, isFirstOpen);
            if (isFirstOpen) firstOpenTracker.add(key);
            
            const description = getTexts(key, buildingState)[textIdx];
            const instruction = "Klikni kamkoli pro další text...";
            ui.createPanel(title, description, instruction);
        }
        
        transactionManager.setActive(false, null);
        container.visible = true;
        ui.fadeIn();
    };

    container.hideOverlay = hide;
    container.isVisible = () => container.visible;
    container.setOnClose = (cb) => onClose = cb;
    container.getCurrentCity = () => city;
    
    container.refresh = () => {
        container.scale.set(1 / getGridScale());
        container.x = container.y = 0;
        container.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    };

    const handleResize = () => {
        if (city && container.visible) {
            const c = city;
            container.removeChildren();
            container.scale.set(1);
            container.showCityInfo(c);
        } else {
            container.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
        }
    };

    window.addEventListener("resize", handleResize);
    
    container.destroy = () => {
        window.removeEventListener("resize", handleResize);
    };

    return container;
}