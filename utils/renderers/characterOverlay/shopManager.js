import { SHOP_ITEMS, BARBER_ITEMS, MARCO_ITEMS } from "../../../enums/shopItems.js";

export function createShopManager(app, getMoney, subMoney, railRenderer, stationRenderer) {
    const SHOP_ITEMS_MAP = {
        "shop": SHOP_ITEMS,
        "barber": BARBER_ITEMS,
        "marco": MARCO_ITEMS
    };
    
    const purchasedItems = new Map(); //key: buildingType,val: purchased item name
    let shopContainer = null;
    let currentBuildingType = null;
    let currentPanel = null;
    let currentDesc = null;
    let currentInstr = null;

    function showShop(buildingType, panel, desc, instr) {
        if (!buildingType) return;
        
        const items = SHOP_ITEMS_MAP[buildingType];
        if (!items || items.length === 0) return;
        
        currentBuildingType = buildingType;
        currentPanel = panel;
        currentDesc = desc;
        currentInstr = instr;
        
        if (shopContainer) {
            shopContainer.destroy();
            shopContainer = null;
        }
        
        if (instr) instr.visible = false;
        
        desc.text = "Co si přejete koupit?";
        
        shopContainer = new PIXI.Container();
        
        const panelW = panel.width;
        const itemHeight = 40;
        const itemMargin = 4;
        const startY = 110;
        
        const currentPurchased = purchasedItems.get(buildingType);
        
        items.forEach((item, index) => {
            const y = startY + index * (itemHeight + itemMargin);
            
            const isPurchased = currentPurchased === item.name;
            
            const itemBg = createItemBackground(panelW, y, itemHeight, isPurchased);
            itemBg.interactive = !isPurchased;
            itemBg.cursor = isPurchased ? "default" : "pointer";
            
            const itemName = createItemName(item.name, y, isPurchased);
            
            const priceText = createPriceText(item, y, isPurchased, panelW);
            
            if (!isPurchased) {
                const buyText = createBuyText(item.buyText, y);
                itemBg.addChild(buyText);
            }
            
            itemBg.addChild(itemName, priceText);
            
            if (!isPurchased) {
                itemBg.on('pointerdown', (e) => handleItemPurchase(e, buildingType, item, panel, desc, instr));
            }
            
            shopContainer.addChild(itemBg);
        });
        
        const closeBtn = createCloseButton(panel.width, panel.height, hide);
        shopContainer.addChild(closeBtn);
        panel.addChild(shopContainer);
    }

    function createItemBackground(panelW, y, itemHeight, isPurchased) {
        const bg = new PIXI.Graphics();
        if (isPurchased) {
            bg.beginFill(0x2c3e50, 0.8);
            bg.lineStyle(1, 0x7f8c8d);
        } else {
            bg.beginFill(0x34495e, 0.8);
            bg.lineStyle(1, 0xf5c518);
        }
        bg.drawRoundedRect(20, y, panelW - 40, itemHeight, 4);
        bg.endFill();
        return bg;
    }

    function createItemName(name, y, isPurchased) {
        const text = new PIXI.Text(name, {
            fontFamily: "Arial",
            fontSize: 13,
            fill: isPurchased ? 0x7f8c8d : 0xecf0f1,
            fontWeight: "bold"
        });
        text.x = 25;
        text.y = y + 6;
        return text;
    }

    function createPriceText(item, y, isPurchased, panelW) {
        let text;
        if (isPurchased) {
            text = new PIXI.Text("AKTIVNÍ", {
                fontFamily: "Arial",
                fontSize: 13,
                fill: 0x27ae60,
                fontWeight: "bold"
            });
        } else {
            text = new PIXI.Text(`$${item.cost}`, {
                fontFamily: "Arial",
                fontSize: 13,
                fill: 0xf5c518,
                fontWeight: "bold"
            });
        }
        text.x = panelW - 100;
        text.y = y + 6;
        return text;
    }

    function createBuyText(buyText, y) {
        const text = new PIXI.Text(buyText || "Koupit", {
            fontFamily: "Arial",
            fontSize: 10,
            fill: 0x95a5a6,
            fontStyle: "italic"
        });
        text.x = 25;
        text.y = y + 22;
        return text;
    }

    function createCloseButton(panelW, panelH, hideCallback) {
        const btn = new PIXI.Container();
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0xc0392b, 0.9);
        bg.lineStyle(1, 0xe74c3c);
        bg.drawRoundedRect(0, 0, 70, 25, 4);
        bg.endFill();
        btn.addChild(bg);
        
        const text = new PIXI.Text("Zavřít", {
            fontFamily: "Arial",
            fontSize: 12,
            fill: 0xffffff,
            fontWeight: "bold"
        });
        text.anchor.set(0.5);
        text.x = 35;
        text.y = 12.5;
        btn.addChild(text);
        
        btn.x = panelW - 90;
        btn.y = panelH - 35;
        btn.interactive = true;
        btn.cursor = "pointer";
        
        btn.on('pointerdown', (e) => {
            e.stopPropagation();
            hideCallback();
        });
        
        return btn;
    }

    function handleItemPurchase(e, buildingType, item, panel, desc, instr) {
        e.stopPropagation();
        
        if (getMoney() >= item.cost) {
            subMoney(item.cost);
            purchasedItems.set(buildingType, item.name);
            desc.text = `Zakoupeno: ${item.name}!`;
            
            showShop(buildingType, panel, desc, instr);
            
            if (railRenderer) railRenderer.markDirty();
            if (stationRenderer) stationRenderer.markDirty();
        } else {
            desc.text = "Nemáš dost peněz!";
        }
    }

    function hide() {
        if (shopContainer) {
            shopContainer.destroy();
            shopContainer = null;
        }
        if (currentPanel && currentPanel.parent && currentPanel.parent.hideOverlay) {
            currentPanel.parent.hideOverlay();
        }
        
    }

    function hasItems(buildingType) {
        const items = SHOP_ITEMS_MAP[buildingType];
        return items && items.length > 0;
    }

    function getPurchasedItem(buildingType) {
        return purchasedItems.get(buildingType);
    }

    return {
        showShop,
        hide,
        hasItems,
        getPurchasedItem,
        get shopContainer() { return shopContainer; }
    };
}