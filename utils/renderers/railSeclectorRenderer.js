import { RAIL_TYPES } from "../../enums/railTypes.js";

const TYPES_LIST = Object.values(RAIL_TYPES);

export function createRailSelectorRenderer(app) {
    const selectorContainer = new PIXI.Container();
    selectorContainer.zIndex = 30;
    selectorContainer.interactive = true;
    app.stage.addChild(selectorContainer);

    let selectedIndex = 0;
    let visible = false;

    const ICON_SIZE = 48;
    const PADDING = 6;
    const COLS = 4;
    const ROWS = Math.ceil(TYPES_LIST.length / COLS);
    const PANEL_W = COLS * (ICON_SIZE + PADDING) + PADDING;
    const PANEL_H = ROWS * (ICON_SIZE + PADDING) + PADDING;

    function getSelectedType() {
        return TYPES_LIST[selectedIndex];
    }

    function setVisible(val) {
        visible = val;
        selectorContainer.visible = val;
    }

    function selectNext() {
        selectedIndex = (selectedIndex + 1) % TYPES_LIST.length;
        draw();
    }

    function selectPrev() {
        selectedIndex = (selectedIndex - 1 + TYPES_LIST.length) % TYPES_LIST.length;
        draw();
    }

    function selectByIndex(i) {
        if (i >= 0 && i < TYPES_LIST.length) {
            selectedIndex = i;
            draw();
        }
    }

    function draw() {
        if (!visible) return;
        selectorContainer.removeChildren();

        //bg
        const bg = new PIXI.Graphics();
        bg.beginFill(0x222222, 0.85);
        bg.drawRoundedRect(0, 0, PANEL_W, PANEL_H, 8);
        bg.endFill();
        selectorContainer.addChild(bg);

        TYPES_LIST.forEach((type, i) => {
            const col = i % COLS;
            const row = Math.floor(i / COLS);
            const x = PADDING + col * (ICON_SIZE + PADDING);
            const y = PADDING + row * (ICON_SIZE + PADDING);

            //zvyraznit vybrane
            if (i === selectedIndex) {
                const highlight = new PIXI.Graphics();
                highlight.beginFill(0xffcc00, 0.6);
                highlight.drawRect(x, y, ICON_SIZE, ICON_SIZE);
                highlight.endFill();
                selectorContainer.addChild(highlight);
            }

            //ikonka
            try {
                const sprite = new PIXI.Sprite(PIXI.Texture.from(type.texture));
                sprite.x = x;
                sprite.y = y;
                sprite.width  = ICON_SIZE;
                sprite.height = ICON_SIZE;
                selectorContainer.addChild(sprite);
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
                selectorContainer.addChild(g);
            }

            //label
            const label = new PIXI.Text(type.id.replace(/_/g, '\n'), {
                fontFamily: "Arial", fontSize: 7, fill: 0xffffff, align: "center"
            });
            label.anchor.set(0.5, 1);
            label.x = x + ICON_SIZE / 2;
            label.y = y + ICON_SIZE - 2;
            selectorContainer.addChild(label);

            //klikaci cast nade vsim
            const hitArea = new PIXI.Graphics();
            hitArea.beginFill(0xffffff, 0.001);
            hitArea.drawRect(x, y, ICON_SIZE, ICON_SIZE);
            hitArea.endFill();
            hitArea.interactive = true;
            hitArea.cursor = "pointer";
            hitArea.on('pointerdown', (e) => {
                e.stopPropagation(); //nepokladat za
                selectedIndex = i;
                draw();
            });
            selectorContainer.addChild(hitArea);
        });

        selectorContainer.x = 10;
        selectorContainer.y = app.screen.height - PANEL_H - 10;
    }

    window.addEventListener("resize", () => {
        selectorContainer.y = app.screen.height - PANEL_H - 10;
        draw();
    });

    return { getSelectedType, setVisible, selectNext, selectPrev, selectByIndex, draw };
}