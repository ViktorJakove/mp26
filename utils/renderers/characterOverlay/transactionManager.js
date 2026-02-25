import { BUILDING_TEXTS } from "../../../text/buildingTexts.js";

export function createTransactionManager(app, panel, desc, instr, sprite, railRenderer, stationRenderer, getMoney, subMoney, hideOverlay) {
    let trans = { active: false, key: null };
    let btnContainer = null;

    function showTransaction(key, buildingState) {
        const d = BUILDING_TEXTS[key];
        if (!d?.transaction) return false;

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
            if (window.trainRenderer) {
                window.trainRenderer.setTrainSpeedMultiplier(3);
            }
        } else if (key === "mech" && d.transaction.cost === 500) {
            if (window.hudRenderer) {
                window.hudRenderer.unlockRailType("CROSS");
            }
        }
        
        if (instr) instr.visible = false;
        desc.text = `${d.transaction.question}\n\nCena: $${d.transaction.cost}`;

        if (btnContainer) btnContainer.destroy();
        btnContainer = new PIXI.Container();

        const yes = createButton("ANO", 0x27ae60, 0x2ecc71, () => {
            const cost = d.transaction.cost;
            if (getMoney() >= cost) {
                subMoney(cost);
                buildingState.set(key, { completed: true, questionShown: true });
                trans.active = false;
                desc.text = d.transaction.successText;
                
                if (d.transaction.successSprite !== undefined) {
                    updateSuccessSprite(key, d);
                }
                
                destroyButtons();
                showInstruction(true);
                if (railRenderer) railRenderer.markDirty();
                if (stationRenderer) stationRenderer.markDirty();
            } else {
                desc.text = d.transaction.failText;
                
                if (d.transaction.failSprite !== undefined) {
                    updateFailSprite(key, d);
                }
                
                destroyButtons();
                trans.active = false;
                showInstruction(true);
            }
        });

        const no = createButton("NE", 0xc0392b, 0xe74c3c, hideOverlay);

        const total = 120 * 2 + 30;
        yes.x = (panel.width - total) / 2;
        no.x = yes.x + 150;
        yes.y = no.y = (panel.height - 50) / 2 + 40;

        btnContainer.addChild(yes, no);
        panel.addChild(btnContainer);
        
        return true;
    }

    function createButton(text, color, hover, onClick) {
        const btn = new PIXI.Graphics()
            .beginFill(color)
            .lineStyle(2, hover)
            .drawRoundedRect(0, 0, 120, 50, 8)
            .endFill();
        
        btn.interactive = true;
        btn.cursor = "pointer";
        
        const txt = new PIXI.Text(text, { 
            fontFamily: "Arial", 
            fontSize: 20, 
            fill: 0xffffff, 
            fontWeight: "bold" 
        });
        txt.anchor.set(0.5);
        txt.x = 60;
        txt.y = 25;
        btn.addChild(txt);
        
        btn.on('pointerdown', (e) => { 
            e.stopPropagation(); 
            e.preventDefault(); 
            onClick(); 
        });
        
        return btn;
    }

    function updateSuccessSprite(key, d) {
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

    function updateFailSprite(key, d) {
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

    function destroyButtons() {
        if (btnContainer) {
            btnContainer.destroy();
            btnContainer = null;
        }
    }

    function showInstruction(visible) {
        if (instr) {
            instr.visible = visible;
            if (visible) instr.text = "Klikni kamkoli pro zavření...";
        }
    }

    function setActive(active, key) {
        trans.active = active;
        trans.key = key;
    }

    function isActive() {
        return trans.active;
    }

    function getKey() {
        return trans.key;
    }

    return {
        showTransaction,
        setActive,
        isActive,
        getKey,
        destroyButtons
    };
}