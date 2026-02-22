import { RAIL_TYPES, DESTROY_ENTRY } from "../../enums/railTypes.js";

const TYPES_LIST = [...Object.values(RAIL_TYPES), DESTROY_ENTRY];

export function createHUDRenderer(app, getGridScale, getMoney, getPlacementMode) {
    const hudContainer = new PIXI.Container();
    hudContainer.zIndex = 25;
    hudContainer.interactiveChildren = true;
    app.stage.addChild(hudContainer);

    const topBar = new PIXI.Container();
    hudContainer.addChild(topBar);

    const leftBar = new PIXI.Container();
    hudContainer.addChild(leftBar);

    let selectedIndex = 0;
    let onSelectCallback = null;

    let hudDirty = true;
    let lastMoney = null;
    let lastPlacementMode = null;
    let lastGridScale = null;


    const ICON_SIZE = 44;
    const PADDING = 6;
    const TOP_BAR_H = 36;

    function getSelectedType() {
        return TYPES_LIST[selectedIndex];
    }

    function setOnSelect(cb) {
        onSelectCallback = cb;
    }

    function drawTopBar() {
        topBar.removeChildren();
        const gridScale = getGridScale();
        const w = app.screen.width / gridScale;

        const bg = new PIXI.Graphics();
        bg.beginFill(0x222222, 0.88);
        bg.drawRect(0, 0, w, TOP_BAR_H / gridScale);
        bg.endFill();
        topBar.addChild(bg);

        const money = getMoney();
        const label = new PIXI.Text(`💰 $${money}`, {
            fontFamily: "Arial",
            fontSize: 18,
            fontWeight: "bold",
            fill: 0xf5c518,
        });
        label.scale.set(1 / gridScale);
        label.x = 12 / gridScale;
        label.y = (TOP_BAR_H / 2 - 9) / gridScale;
        topBar.addChild(label);
    }

    function drawLeftBar() {
        leftBar.removeChildren();
        if (!getPlacementMode()) return;

        const gridScale = getGridScale();
        const panelW = (ICON_SIZE + PADDING * 2);
        const panelH = TYPES_LIST.length * (ICON_SIZE + PADDING) + PADDING;
        const startY = TOP_BAR_H / gridScale + 8 / gridScale;

        const bg = new PIXI.Graphics();
        bg.beginFill(0x222222, 0.88);
        bg.drawRoundedRect(0, startY, panelW / gridScale, panelH / gridScale, 6 / gridScale);
        bg.endFill();
        leftBar.addChild(bg);

        TYPES_LIST.forEach((type, i) => {
            const itemY = startY + (PADDING + i * (ICON_SIZE + PADDING)) / gridScale;
            const itemX = PADDING / gridScale;
            const iSize = ICON_SIZE / gridScale;
            const pad2 = 2 / gridScale;

            // highlight
            if (i === selectedIndex) {
                const hl = new PIXI.Graphics();
                hl.beginFill(0xffcc00, 0.55);
                hl.drawRoundedRect(itemX, itemY, iSize, iSize, 4 / gridScale);
                hl.endFill();
                leftBar.addChild(hl);
            }

            //ikonky
            if (type.isDestroy) {
                const g = new PIXI.Graphics();
                g.beginFill(0xaa0000, 0.9);
                g.drawRect(itemX + pad2, itemY + pad2, iSize - pad2 * 2, iSize - pad2 * 2);
                g.endFill();
                g.lineStyle(3 / gridScale, 0xffffff);
                g.moveTo(itemX + 8 / gridScale, itemY + 8 / gridScale);
                g.lineTo(itemX + iSize - 8 / gridScale, itemY + iSize - 8 / gridScale);
                g.moveTo(itemX + iSize - 8 / gridScale, itemY + 8 / gridScale);
                g.lineTo(itemX + 8 / gridScale, itemY + iSize - 8 / gridScale);
                leftBar.addChild(g);
            } else {
                try {
                    const sprite = new PIXI.Sprite(PIXI.Texture.from(type.texture));
                    sprite.x = itemX;
                    sprite.y = itemY;
                    sprite.width = iSize;
                    sprite.height = iSize;
                    leftBar.addChild(sprite);
                } catch {
                    const g = new PIXI.Graphics();
                    g.lineStyle(2 / gridScale, 0xffffff);
                    g.drawRect(itemX + pad2, itemY + pad2, iSize - pad2 * 2, iSize - pad2 * 2);
                    const cx = itemX + iSize / 2;
                    const cy = itemY + iSize / 2;
                    if (type.connections[0]) { g.moveTo(cx, cy); g.lineTo(cx, itemY); }
                    if (type.connections[1]) { g.moveTo(cx, cy); g.lineTo(itemX + iSize, cy); }
                    if (type.connections[2]) { g.moveTo(cx, cy); g.lineTo(cx, itemY + iSize); }
                    if (type.connections[3]) { g.moveTo(cx, cy); g.lineTo(itemX, cy); }
                    leftBar.addChild(g);
                }
            }

            //label
            const label = new PIXI.Text(type.id.replace(/_/g, '\n'), {
                fontFamily: "Arial",
                fontSize: 7 / gridScale,
                fill: 0xffffff,
                align: "center",
            });
            label.anchor.set(0.5, 1);
            label.x = itemX + iSize / 2;
            label.y = itemY + iSize - 2 / gridScale;
            leftBar.addChild(label);

            //clickable
            const hit = new PIXI.Graphics();
            hit.beginFill(0xffffff, 0.001);
            hit.drawRect(itemX, itemY, iSize, iSize);
            hit.endFill();
            hit.interactive = true;
            hit.cursor = "pointer";
            hit.on('pointerdown', (e) => {
                e.stopPropagation();
                selectedIndex = i;
                draw();
                if (onSelectCallback) onSelectCallback(type);
            });
            leftBar.addChild(hit);
        });
    }

    function draw() {
        const currentMoney = getMoney();
        const currentPlacementMode = getPlacementMode();
        const currentGridScale = getGridScale();

        //pokud zmena
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
        draw();
    }

    window.addEventListener("resize", () => draw());

    return {
        draw,
        refresh,
        getSelectedType,
        setOnSelect,
    };
}