import { BUILDING_TEXTS, DEFAULT_BUILDING_TEXT } from "../../text/buildingTexts.js";
import { SHOP_ITEMS, BARBER_ITEMS, MARCO_ITEMS } from "../../enums/shopItems.js";

export function createCharacterOverlay(app, getGridScale, railRenderer, stationRenderer, getMoney, subMoney) {
    const container = new PIXI.Container();
    Object.assign(container, { zIndex: 100, visible: false, interactive: true });
    container.hitArea = new PIXI.Rectangle(0, 0, app.screen.width, app.screen.height);
    app.stage.addChild(container);

    let city = null, onClose = null, textIdx = 0, desc = null, sprite = null, bg = null, panel = null, instr = null;
    let btnContainer = null, trans = { active: false, key: null };
    let shopContainer = null; // New container for shop items
    const buildingState = new Map();

    // Shop items mapping
    const SHOP_ITEMS_MAP = {
        "shop": SHOP_ITEMS,
        "barber": BARBER_ITEMS,
        "marco": MARCO_ITEMS
    };

    const getPath = (key, idx, after) => {
        const d = BUILDING_TEXTS[key];
        if (!d) return null;
        
        const arr = after && d.afterTransaction?.sprite ? d.afterTransaction.sprite : d.sprite;
        if (!arr || arr[idx] === undefined) return null;
        
        const spriteValue = arr[idx];
        return `../../graphics/chars/${key}/${key}${spriteValue}.png`;
    };

    const getPos = (key, idx, after) => {
        const d = BUILDING_TEXTS[key];
        if (!d) return app.screen.width * 0.5;
        
        const pos = after && d.afterTransaction?.spritePos ? d.afterTransaction.spritePos[idx] : d.spritePos[idx];
        const map = { L: 0.33, C: 0.5, P: 0.66, R: 0.66 };
        return app.screen.width * (map[pos] || 0.5);
    };

    const getTexts = (key) => {
        const d = BUILDING_TEXTS[key];
        const s = buildingState.get(key);
        return s?.completed && d?.afterTransaction?.text ? d.afterTransaction.text : d?.text || DEFAULT_BUILDING_TEXT.text;
    };

    const getStart = (key) => {
        const s = buildingState.get(key);
        const d = BUILDING_TEXTS[key];
        return s?.questionShown && d?.transaction && !s?.completed ? getTexts(key).length - 1 : 0;
    };

    const updateSprite = (key, idx, after) => {
        if (!sprite) return;
        const path = getPath(key, idx, after);
        if (!path) return;
        
        const tex = PIXI.Texture.from(path);
        sprite.x = getPos(key, idx, after);
        
        const update = () => {
            sprite.texture = tex;
            const scale = Math.min(app.screen.width, app.screen.height) * 0.6 / Math.max(tex.width, tex.height);
            sprite.scale.set(scale);
        };
        
        if (tex.valid) {
            update();
        } else {
            tex.once('update', update);
        }
    };

    const showShop = () => {
        if (!city || !city.building) return;
        
        const buildingType = city.building;
        const items = SHOP_ITEMS_MAP[buildingType];
        
        if (!items || items.length === 0) return;
        
        // Clear any existing shop container
        if (shopContainer) {
            shopContainer.destroy();
            shopContainer = null;
        }
        
        // Hide instruction text
        if (instr) instr.visible = false;
        
        // Update description
        desc.text = "Co si přejete koupit?";
        
        // Create shop container
        shopContainer = new PIXI.Container();
        
        const panelW = panel.width;
        const itemHeight = 40; // Reduced from 60
        const itemMargin = 4; // Reduced from 5
        const startY = 110; // Adjusted for smaller items
        
        items.forEach((item, index) => {
            const y = startY + index * (itemHeight + itemMargin);
            
            // Item background - smaller
            const itemBg = new PIXI.Graphics();
            itemBg.beginFill(0x34495e, 0.8);
            itemBg.lineStyle(1, 0xf5c518);
            itemBg.drawRoundedRect(20, y, panelW - 40, itemHeight, 4); // Smaller border radius
            itemBg.endFill();
            itemBg.interactive = true;
            itemBg.cursor = "pointer";
            
            // Item name - smaller font
            const itemName = new PIXI.Text(item.name, {
                fontFamily: "Arial",
                fontSize: 13, // Reduced from 16
                fill: 0xecf0f1,
                fontWeight: "bold"
            });
            itemName.x = 25; // Slightly adjusted
            itemName.y = y + 6; // Centered vertically
            
            // Item price - smaller font
            const itemPrice = new PIXI.Text(`$${item.cost}`, {
                fontFamily: "Arial",
                fontSize: 13, // Reduced from 16
                fill: 0xf5c518,
                fontWeight: "bold"
            });
            itemPrice.x = panelW - 100;
            itemPrice.y = y + 6; // Centered vertically
            
            // Buy text - smaller font
            const buyText = new PIXI.Text(item.buyText || "Koupit", {
                fontFamily: "Arial",
                fontSize: 10, // Reduced from 12
                fill: 0x95a5a6,
                fontStyle: "italic"
            });
            buyText.x = 25;
            buyText.y = y + 22; // Adjusted for smaller item height
            
            itemBg.addChild(itemName, itemPrice, buyText);
            
            // Buy handler
            itemBg.on('pointerdown', (e) => {
                e.stopPropagation();
                
                if (getMoney() >= item.cost) {
                    subMoney(item.cost);
                    
                    // Show success message
                    desc.text = `Zakoupeno: ${item.name}!`;
                    
                    // Apply item effects here
                    applyItemEffect(buildingType, item);
                    
                    // Remove shop and show continue instruction
                    if (shopContainer) {
                        shopContainer.destroy();
                        shopContainer = null;
                    }
                    
                    if (instr) {
                        instr.visible = true;
                        instr.text = "Klikni kamkoli pro zavření...";
                    }
                    
                    if (railRenderer) railRenderer.markDirty();
                    if (stationRenderer) stationRenderer.markDirty();
                } else {
                    desc.text = "Nemáš dost peněz!";
                }
            });
            
            shopContainer.addChild(itemBg);
        });
        
        // Add close button - fixed positioning
        const closeBtn = new PIXI.Container();
        
        // Button background
        const closeBg = new PIXI.Graphics();
        closeBg.beginFill(0xc0392b, 0.9);
        closeBg.lineStyle(1, 0xe74c3c);
        closeBg.drawRoundedRect(0, 0, 70, 25, 4); // Smaller button
        closeBg.endFill();
        closeBtn.addChild(closeBg);
        
        // Button text
        const closeText = new PIXI.Text("Zavřít", {
            fontFamily: "Arial",
            fontSize: 12,
            fill: 0xffffff,
            fontWeight: "bold"
        });
        closeText.anchor.set(0.5);
        closeText.x = 35; // Half of button width
        closeText.y = 12.5; // Half of button height
        closeBtn.addChild(closeText);
        
        // Position button in bottom right corner
        closeBtn.x = panel.width - 90; // 20px from right edge
        closeBtn.y = panel.height - 35; // 10px from bottom edge
        
        closeBtn.interactive = true;
        closeBtn.cursor = "pointer";
        
        closeBtn.on('pointerdown', (e) => {
            e.stopPropagation();
            hide();
        });
        
        shopContainer.addChild(closeBtn);
        panel.addChild(shopContainer);
    };

    const applyItemEffect = (buildingType, item) => {
        // Add special effects based on item type
        switch(item.name) {
            case "flag":
                // Example effect: increase relations
                console.log("Flag purchased - MURRICA!");
                break;
            case "lowtaper":
                console.log("Low taper fade - massive!");
                break;
            case "tuxedo":
                console.log("Tuxedo purchased - looking sharp!");
                break;
            default:
                console.log(`Purchased ${item.name} from ${buildingType}`);
        }
    };

    const showTrans = () => {
        if (!city || !trans.active) return;
        const key = city.building;
        const d = BUILDING_TEXTS[key];
        if (!d?.transaction) return hide();

        if (d.transaction.questionSprite !== undefined) {
            const path = `../../graphics/chars/${key}/${key}${d.transaction.questionSprite}.png`;
            const tex = PIXI.Texture.from(path);
            
            const update = () => {
                sprite.texture = tex;
                const scale = Math.min(app.screen.width, app.screen.height) * 0.6 / Math.max(tex.width, tex.height);
                sprite.scale.set(scale);
            };
            
            if (tex.valid) {
                update();
            } else {
                tex.once('update', update);
            }
            
            if (d.transaction.questionSpritePos) {
                const map = { L: 0.33, C: 0.5, P: 0.66, R: 0.66 };
                sprite.x = app.screen.width * (map[d.transaction.questionSpritePos] || 0.5);
            }
        }

        if (key === "bussiness" && d.transaction.cost === 300) {
            //double speed
            if (window.trainRenderer) {
                window.trainRenderer.setTrainSpeedMultiplier(3);
            }
        } else if (key === "mech" && d.transaction.cost === 500) {
            //Mech ounlock
            if (window.hudRenderer) {
                window.hudRenderer.unlockRailType("CROSS");
            }
        }
        
        if (instr) instr.visible = false;
        desc.text = `${d.transaction.question}\n\nCena: $${d.transaction.cost}`;

        if (btnContainer) btnContainer.destroy();
        btnContainer = new PIXI.Container();

        const makeBtn = (text, color, hover, fn) => {
            const btn = new PIXI.Graphics().beginFill(color).lineStyle(2, hover).drawRoundedRect(0, 0, 120, 50, 8).endFill();
            btn.interactive = true;
            btn.cursor = "pointer";
            const txt = new PIXI.Text(text, { fontFamily: "Arial", fontSize: 20, fill: 0xffffff, fontWeight: "bold" });
            txt.anchor.set(0.5);
            txt.x = 60;
            txt.y = 25;
            btn.addChild(txt);
            btn.on('pointerdown', (e) => { e.stopPropagation(); e.preventDefault(); fn(); });
            return btn;
        };

        const yes = makeBtn("ANO", 0x27ae60, 0x2ecc71, () => {
            const cost = d.transaction.cost;
            if (getMoney() >= cost) {
                subMoney(cost);
                buildingState.set(key, { completed: true, questionShown: true });
                trans.active = false;
                desc.text = d.transaction.successText;
                
                if (d.transaction.successSprite !== undefined) {
                    const path = `../../graphics/chars/${key}/${key}${d.transaction.successSprite}.png`;
                    const tex = PIXI.Texture.from(path);
                    
                    const update = () => {
                        sprite.texture = tex;
                        const scale = Math.min(app.screen.width, app.screen.height) * 0.6 / Math.max(tex.width, tex.height);
                        sprite.scale.set(scale);
                    };
                    
                    if (tex.valid) {
                        update();
                    } else {
                        tex.once('update', update);
                    }
                    
                    if (d.transaction.successSpritePos) {
                        const map = { L: 0.33, C: 0.5, P: 0.66, R: 0.66 };
                        sprite.x = app.screen.width * (map[d.transaction.successSpritePos] || 0.5);
                    }
                }
                
                if (btnContainer) btnContainer.destroy();
                btnContainer = null;
                if (instr) {
                    instr.visible = true;
                    instr.text = "Klikni kamkoli pro zavření...";
                }
                if (railRenderer) railRenderer.markDirty();
                if (stationRenderer) stationRenderer.markDirty();
            } else {
                desc.text = d.transaction.failText;
                
                if (d.transaction.failSprite !== undefined) {
                    const path = `../../graphics/chars/${key}/${key}${d.transaction.failSprite}.png`;
                    const tex = PIXI.Texture.from(path);
                    
                    const update = () => {
                        sprite.texture = tex;
                        const scale = Math.min(app.screen.width, app.screen.height) * 0.6 / Math.max(tex.width, tex.height);
                        sprite.scale.set(scale);
                    };
                    
                    if (tex.valid) {
                        update();
                    } else {
                        tex.once('update', update);
                    }
                    
                    if (d.transaction.failSpritePos) {
                        const map = { L: 0.33, C: 0.5, P: 0.66, R: 0.66 };
                        sprite.x = app.screen.width * (map[d.transaction.failSpritePos] || 0.5);
                    }
                }
                
                if (btnContainer) btnContainer.destroy();
                btnContainer = null;
                trans.active = false;
                if (instr) {
                    instr.visible = true;
                    instr.text = "Klikni kamkoli pro zavření...";
                }
            }
        });

        const no = makeBtn("NE", 0xc0392b, 0xe74c3c, hide);

        const total = 120 * 2 + 30;
        yes.x = (panel.width - total) / 2;
        no.x = yes.x + 150;
        yes.y = no.y = (panel.height - 50) / 2 + 40;

        btnContainer.addChild(yes, no);
        panel.addChild(btnContainer);
    };

    const fadeIn = () => {
        if (!bg) return;
        const start = Date.now();
        const anim = () => {
            const prog = Math.min((Date.now() - start) / 600, 1);
            bg.alpha = (1 - Math.pow(1 - prog, 3)) * 0.8;
            if (prog < 1) requestAnimationFrame(anim);
        };
        anim();
    };

    const handleClick = () => {
        if (!city || !desc || trans.active || shopContainer) return;
        const key = city.building;
        const texts = getTexts(key);
        const d = BUILDING_TEXTS[key];
        const s = buildingState.get(key) || { questionShown: false, completed: false };

        if (textIdx < texts.length - 1) {
            textIdx++;
            desc.text = texts[textIdx];
            updateSprite(key, textIdx, s.completed);
            if (textIdx === texts.length - 1) {
                instr.text = "Toto byl poslední text...";
                if (d?.transaction && !s.completed) {
                    buildingState.set(key, { ...s, questionShown: true });
                } else if (SHOP_ITEMS_MAP[key] && !s.completed) {
                    // Show shop if this building has items
                    showShop();
                }
            }
        } else if (textIdx === texts.length - 1) {
            if (d?.transaction && !s.completed) {
                trans.active = true;
                trans.key = key;
                showTrans();
            } else if (SHOP_ITEMS_MAP[key] && !s.completed) {
                showShop();
            } else {
                hide();
            }
        }
    };

    const hide = () => {
        container.visible = false;
        city = null;
        desc = null;
        sprite = null;
        bg = null;
        panel = null;
        instr = null;
        textIdx = 0;
        trans.active = false;
        if (btnContainer) {
            btnContainer.destroy();
            btnContainer = null;
        }
        if (shopContainer) {
            shopContainer.destroy();
            shopContainer = null;
        }
        if (onClose) onClose();
    };

    container.showCityInfo = (c) => {
        if (c.building === "none" || trans.active) return;
        city = c;
        const key = c.building;
        textIdx = getStart(key);
        trans.active = false;
        container.removeChildren();

        bg = new PIXI.Graphics().beginFill(0x000000, 0.7).drawRect(0, 0, app.screen.width, app.screen.height).endFill();
        bg.alpha = 0;
        bg.interactive = true;
        bg.on('pointerdown', (e) => { e.stopPropagation(); handleClick(); });
        container.addChild(bg);

        const s = buildingState.get(key);
        const path = getPath(key, textIdx, s?.completed);
        
        if (path) {
            const tex = PIXI.Texture.from(path);
            sprite = new PIXI.Sprite(tex);
            sprite.anchor.set(0.5);
            sprite.x = getPos(key, textIdx, s?.completed);
            sprite.y = app.screen.height / 5 * 2;
            
            const setScale = () => {
                if (sprite.texture && sprite.texture.valid) {
                    const scale = Math.min(app.screen.width, app.screen.height) * 0.6 / Math.max(sprite.texture.width, sprite.texture.height);
                    sprite.scale.set(scale);
                }
            };
            
            if (tex.valid) {
                setScale();
            } else {
                tex.once('update', setScale);
            }
        } else {
            sprite = new PIXI.Sprite(PIXI.Texture.WHITE);
            sprite.anchor.set(0.5);
            sprite.x = app.screen.width * 0.5;
            sprite.y = app.screen.height / 5 * 2;
            sprite.scale.set(100, 100);
            sprite.tint = 0xff00ff;
        }
        
        sprite.interactive = true;
        sprite.on('pointerdown', (e) => { e.stopPropagation(); handleClick(); });
        container.addChild(sprite);

        panel = new PIXI.Container();
        const w = app.screen.width * 0.8;
        const h = app.screen.height * 0.4;
        
        const panelBg = new PIXI.Graphics().beginFill(0x2c3e50, 0.95).lineStyle(2, 0xf5c518).drawRoundedRect(0, 0, w, h, 12).endFill();
        panelBg.interactive = true;
        panelBg.on('pointerdown', (e) => { e.stopPropagation(); handleClick(); });
        panel.addChild(panelBg);

        const title = new PIXI.Text(c.name, { fontFamily: "Arial", fontSize: 28, fill: 0xf5c518, fontWeight: "bold" });
        title.x = 20;
        title.y = 20;
        panel.addChild(title);

        desc = new PIXI.Text(getTexts(key)[textIdx], { 
            fontFamily: "Arial", 
            fontSize: 18, 
            fill: 0xecf0f1, 
            fontStyle: "italic", 
            wordWrap: true, 
            wordWrapWidth: w - 40, 
            align: "center" 
        });
        desc.x = 20;
        desc.y = 70;
        desc.interactive = true;
        desc.on('pointerdown', (e) => { e.stopPropagation(); handleClick(); });
        panel.addChild(desc);

        instr = new PIXI.Text("Klikni kamkoli pro další text...", { 
            fontFamily: "Arial", 
            fontSize: 14, 
            fill: 0x95a5a6, 
            fontStyle: "italic" 
        });
        instr.x = w - 220;
        instr.y = h - 30;
        instr.interactive = true;
        instr.on('pointerdown', (e) => { e.stopPropagation(); handleClick(); });
        panel.addChild(instr);

        panel.x = (app.screen.width - w) / 2;
        panel.y = app.screen.height - h - 20;
        panel.interactive = true;
        panel.interactiveChildren = true;
        container.addChild(panel);

        container.visible = true;
        fadeIn();
    };

    container.hideOverlay = hide;
    container.isVisible = () => container.visible;
    container.setOnClose = (cb) => onClose = cb;
    container.getCurrentCity = () => city;
    container.destroy = () => window.removeEventListener("resize", handleResize);
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
    return container;
}