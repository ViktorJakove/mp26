import { RAIL_TYPES, DESTROY_ENTRY } from "../../enums/railTypes.js";

const TYPES_LIST = [...Object.values(RAIL_TYPES), DESTROY_ENTRY];

export function createHUDRenderer(app, getGridScale, getMoney, getPlacementMode) {

    const LOCKED_RAIL_TYPES = new Set(/*["CROSS"]*/);
    
    function unlockRailType(typeId) {
        LOCKED_RAIL_TYPES.delete(typeId);
        hudDirty = true;
        draw();
    }

    const topBarContainer = new PIXI.Container();
    topBarContainer.zIndex = 25;
    topBarContainer.interactive = true;
    app.stage.addChild(topBarContainer);

    const TOP_BAR_H = 36;
    const TOP_BAR_FONT = 18;

    function drawTopBar() {
        topBarContainer.removeChildren();

        const gridScale = getGridScale();
        const w = app.screen.width;

        const bg = new PIXI.Graphics();
        bg.beginFill(0x222222, 0.88);
        bg.drawRect(0, 0, w, TOP_BAR_H);
        bg.endFill();
        topBarContainer.addChild(bg);

        const money = getMoney();
        const label = new PIXI.Text(`💰 $${money}`, {
            fontFamily: "Arial",
            fontSize: TOP_BAR_FONT,
            fontWeight: "bold",
            fill: 0xf5c518,
        });
        label.x = 12;
        label.y = TOP_BAR_H / 2 - TOP_BAR_FONT / 2;
        topBarContainer.addChild(label);

        topBarContainer.scale.set(1 / gridScale);
        topBarContainer.x = 0;
        topBarContainer.y = 0;
    }

    const leftBarContainer = new PIXI.Container();
    leftBarContainer.zIndex = 25;
    leftBarContainer.interactive = true;
    app.stage.addChild(leftBarContainer);

    const ICON_SIZE = 48;
    const PADDING = 6;

    let selectedIndex = 0;
    let onSelectCallback = null;

    let hudDirty = true;
    let lastMoney = null;
    let lastPlacementMode = null;
    let lastGridScale = null;

    function getSelectedType() {
        const availableTypes = TYPES_LIST.filter(type => {
            if (type.isDestroy) return true;
            return !LOCKED_RAIL_TYPES.has(type.id);
        });
        
        // Ensure selectedIndex is within bounds
        if (selectedIndex >= availableTypes.length) {
            selectedIndex = 0;
        }
        
        // Return the selected type or the first available type if something goes wrong
        return availableTypes[selectedIndex] || availableTypes[0] || TYPES_LIST[0];
    }

    function setOnSelect(cb) {
        onSelectCallback = cb;
    }

    function drawLeftBar() {
        leftBarContainer.removeChildren();

        leftBarContainer.visible = getPlacementMode();
        
        if (!getPlacementMode()) {
            return;
        }

        const gridScale = getGridScale();

        const PANEL_W = ICON_SIZE + PADDING * 2;
        const PANEL_H = TYPES_LIST.length * (ICON_SIZE + PADDING + 10) + PADDING;

        const bg = new PIXI.Graphics();
        bg.beginFill(0x222222, 0.88);
        bg.drawRect(0, 0, PANEL_W, PANEL_H, 8);
        bg.endFill();
        bg.interactive = true;
        leftBarContainer.addChild(bg);

        TYPES_LIST.forEach((type, i) => {
            const x = PADDING;
            const y = PADDING + i * (ICON_SIZE + PADDING + 10);

            const isLocked = !type.isDestroy && LOCKED_RAIL_TYPES.has(type.id);

            if (i === selectedIndex && !isLocked) {
                const hl = new PIXI.Graphics();
                hl.beginFill(0xffcc00, 0.55);
                hl.drawRoundedRect(x, y, ICON_SIZE, ICON_SIZE, 4);
                hl.endFill();
                leftBarContainer.addChild(hl);
            }

            if (type.isDestroy) {
                const g = new PIXI.Graphics();
                g.beginFill(0xaa0000, 0.9);
                g.drawRect(x + 2, y + 2, ICON_SIZE - 4, ICON_SIZE - 4);
                g.endFill();
                g.lineStyle(3, 0xffffff);
                g.moveTo(x + 10, y + 10);
                g.lineTo(x + ICON_SIZE - 10, y + ICON_SIZE - 10);
                g.moveTo(x + ICON_SIZE - 10, y + 10);
                g.lineTo(x + 10, y + ICON_SIZE - 10);
                leftBarContainer.addChild(g);
            } else {
                try {
                    const sprite = new PIXI.Sprite(PIXI.Texture.from(type.texture));
                    sprite.x = x;
                    sprite.y = y;
                    sprite.width = ICON_SIZE;
                    sprite.height = ICON_SIZE;
                    leftBarContainer.addChild(sprite);
                } catch {
                    const g = new PIXI.Graphics();
                    g.lineStyle(2, 0xffffff);
                    g.drawRect(x + 2, y + 2, ICON_SIZE - 4, ICON_SIZE - 4);
                    const cx = x + ICON_SIZE / 2;
                    const cy = y + ICON_SIZE / 2;
                    if (type.connections[0]) { g.moveTo(cx, cy); g.lineTo(cx, y); }
                    if (type.connections[1]) { g.moveTo(cx, cy); g.lineTo(x + ICON_SIZE, cy); }
                    if (type.connections[2]) { g.moveTo(cx, cy); g.lineTo(cx, y + ICON_SIZE); }
                    if (type.connections[3]) { g.moveTo(cx, cy); g.lineTo(x, cy); }
                    leftBarContainer.addChild(g);
                }
                
                if (isLocked) {
                    const lockOverlay = new PIXI.Graphics();
                    lockOverlay.beginFill(0x888888, 0.6);
                    lockOverlay.drawRect(x, y, ICON_SIZE, ICON_SIZE);
                    lockOverlay.endFill();
                    leftBarContainer.addChild(lockOverlay);
                }

                const costLabel = new PIXI.Text(`$${type.cost}`, {
                    fontFamily: "Arial",
                    fontSize: 12,
                    fill: 0xf5c518,
                    align: "center",
                    fontWeight: "bold",
                });
                costLabel.anchor.set(0.5, 0);
                costLabel.x = x + ICON_SIZE / 2;
                costLabel.y = y + ICON_SIZE + 2;
                leftBarContainer.addChild(costLabel);
            }

            const hitArea = new PIXI.Graphics();
            hitArea.beginFill(0xffffff, 0.001);
            hitArea.drawRect(x, y, ICON_SIZE, ICON_SIZE + 10);
            hitArea.endFill();
            hitArea.interactive = true;
            hitArea.cursor = isLocked ? "not-allowed" : "pointer";
            
            hitArea.on('pointerdown', (e) => {
                e.stopPropagation();
                if (!isLocked) {
                    selectedIndex = i;
                    hudDirty = true;
                    draw();
                    if (onSelectCallback) onSelectCallback(type);
                }
            });
            
            leftBarContainer.addChild(hitArea);
        });

        leftBarContainer.scale.set(1 / gridScale);
        leftBarContainer.x = 10 / gridScale;
        leftBarContainer.y = (TOP_BAR_H + 8) / gridScale;
    }

    function draw() {
        const currentMoney = getMoney();
        const currentPlacementMode = getPlacementMode();
        const currentGridScale = getGridScale();

        if (currentPlacementMode !== lastPlacementMode) {
            hudDirty = true;
        }

        if (!hudDirty
            && currentMoney === lastMoney
            && currentPlacementMode === lastPlacementMode
            && currentGridScale === lastGridScale) return;

        lastMoney = currentMoney;
        lastPlacementMode = currentPlacementMode;
        lastGridScale = currentGridScale;
        hudDirty = false;

        drawTopBar();
        drawLeftBar();
    }

    function markDirty() {
        hudDirty = true;
    }

    function refresh() {
        hudDirty = true;
        draw();
    }

    window.addEventListener("resize", () => {
        hudDirty = true;
        draw();
    });

    return {
        draw,
        refresh,
        markDirty,
        getSelectedType,
        setOnSelect,
        unlockRailType
    };
}