import { BUILDING_TEXTS } from "../../../text/buildingTexts.js";
import { createOverlayUI } from "./overlayUI.js";
import { createShopManager } from "./shopManager.js";
import { createTransactionManager } from "./transactionManager.js";
import { getPath, getPos, getTexts, getStart, updateSprite } from "./overlayHelpers.js";

export function createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer, getMoney, subMoney) {
    const container = new PIXI.Container();
    Object.assign(container, { zIndex: 100, visible: false, interactive: true });
    container.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(container);

    let city = null;
    let onClose = null;
    const buildingState = new Map();
    
    //sub-moduly
    const ui = createOverlayUI(app, container, () => handleClick());
    const shopManager = createShopManager(app, getMoney, subMoney, railRenderer, stationRenderer);
    const transactionManager = createTransactionManager(app, ui.panel, ui.desc, ui.instr, ui.sprite, railRenderer, stationRenderer, getMoney, subMoney, hide);

    function handleClick() {
        if (!city || !ui.desc || transactionManager.isActive() || shopManager.shopContainer) return;
        
        const key = city.building;
        const texts = getTexts(key, buildingState);
        const d = BUILDING_TEXTS[key];
        const s = buildingState.get(key) || { questionShown: false, completed: false };
        const textIdx = ui.getTextIndex();

        if (textIdx < texts.length - 1) {
            ui.incrementTextIndex();
            ui.setText(texts[ui.getTextIndex()]);
            updateSprite(ui.sprite, key, ui.getTextIndex(), s.completed, app, buildingState);
            
            if (ui.getTextIndex() === texts.length - 1) {
                ui.setInstruction("Toto byl poslední text...");
                if (d?.transaction && !s.completed) {
                    buildingState.set(key, { ...s, questionShown: true });
                } else if (shopManager.hasItems(key) && !s.completed) {
                    shopManager.showShop(key, ui.panel, ui.desc, ui.instr);
                }
            }
        } else if (textIdx === texts.length - 1) {
            if (d?.transaction && !s.completed) {
                transactionManager.setActive(true, key);
                transactionManager.showTransaction(key, buildingState);
            } else if (shopManager.hasItems(key) && !s.completed) {
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
        const textIdx = getStart(key, buildingState);
        ui.setTextIndex(textIdx);
        transactionManager.setActive(false, null);
        
        container.removeChildren();

        //ui
        ui.createBackground();
        
        const path = getPath(key, textIdx, s?.completed, buildingState);
        const posX = getPos(key, textIdx, s?.completed, app, buildingState);
        ui.createSprite(path, posX);
        
        const title = c.name;
        const description = getTexts(key, buildingState)[textIdx];
        const instruction = "Klikni kamkoli pro další text...";
        ui.createPanel(title, description, instruction);
        
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