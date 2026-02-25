import { BUILDING_TEXTS } from "../text/buildingTexts.js";

export function createBankManager(app, getMoney, addMoney, subMoney) {
    let loanAmount = 0;
    let loanActive = false;
    let htmlInput = null;
    let uiContainer = null;
    let bankOptions = {maxLoan: BUILDING_TEXTS["bank"].transaction.bankOptions.maxLoan, interestRate: BUILDING_TEXTS["bank"].transaction.bankOptions.interestRate, repaymentTime: BUILDING_TEXTS["bank"].transaction.bankOptions.repaymentTime};

    function removeHTMLInput() {
        if (htmlInput && htmlInput.parentNode) {
            htmlInput.parentNode.removeChild(htmlInput);
            htmlInput = null;
        }
    }

    function createHTMLInput(panel, x, y, width, onSubmit, maxLoan) {
        removeHTMLInput();
        
        htmlInput = document.createElement('input');
        htmlInput.type = 'number';
        htmlInput.min = '1';
        htmlInput.max = maxLoan || 1000;
        htmlInput.step = '10';
        htmlInput.value = Math.min(100, maxLoan || 1000).toString();
        htmlInput.placeholder = `Zadej částku (max $${maxLoan || 1000})`;
        
        htmlInput.addEventListener('keydown', (e) => e.stopPropagation());
        htmlInput.addEventListener('keyup', (e) => e.stopPropagation());
        htmlInput.addEventListener('keypress', (e) => e.stopPropagation());
        htmlInput.addEventListener('mousedown', (e) => e.stopPropagation());
        htmlInput.addEventListener('click', (e) => e.stopPropagation());
        
        htmlInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                e.stopPropagation();
                const amount = parseInt(htmlInput.value);
                if (amount && amount > 0 && amount <= (maxLoan || 1000)) {
                    onSubmit(amount);
                }
            }
        });
        
        const panelWorldPos = panel.getGlobalPosition();
        
        htmlInput.style.position = 'fixed';
        htmlInput.style.left = (panelWorldPos.x + x) + 'px';
        htmlInput.style.top = (panelWorldPos.y + y) + 'px';
        htmlInput.style.width = width + 'px';
        htmlInput.style.height = '40px';
        htmlInput.style.fontSize = '20px';
        htmlInput.style.padding = '8px 12px';
        htmlInput.style.border = '3px solid #f5c518';
        htmlInput.style.borderRadius = '8px';
        htmlInput.style.backgroundColor = '#34495e';
        htmlInput.style.color = '#f5c518';
        htmlInput.style.fontWeight = 'bold';
        htmlInput.style.zIndex = '1000';
        htmlInput.style.boxSizing = 'border-box';
        htmlInput.style.textAlign = 'center';
        
        document.body.appendChild(htmlInput);
        
        setTimeout(() => {
            if (htmlInput) {
                htmlInput.focus();
                htmlInput.select();
            }
        }, 50);
        
        return htmlInput;
    }

    function showSuccessMessage(panel, desc, instr, sprite, message, onComplete) {
        destroyUI();
        
        const successContainer = new PIXI.Container();
        
        const panelW = panel.width;
        const panelH = panel.height;
        
        //průhledny pozadí přes celý panel pro zachycenii kliknutí
        const clickCatcher = new PIXI.Graphics();
        clickCatcher.beginFill(0x000000, 0.001);
        clickCatcher.drawRect(0, 0, panelW, panelH);
        clickCatcher.endFill();
        clickCatcher.interactive = true;
        clickCatcher.cursor = "pointer";
        clickCatcher.on('pointerdown', (e) => {
            e.stopPropagation();
            destroyUI();
            onComplete(true);
        });
        successContainer.addChild(clickCatcher);
        
        const successText = new PIXI.Text(
            message,
            {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0x2ecc71,
                fontWeight: "bold",
                align: "center",
                wordWrap: true,
                wordWrapWidth: panelW - 60
            }
        );
        successText.anchor.set(0.5);
        successText.x = panelW / 2;
        successText.y = panelH / 2 - 30;
        successText.interactive = true;
        successText.on('pointerdown', (e) => {
            e.stopPropagation();
            destroyUI();
            onComplete(true);
        });
        successContainer.addChild(successText);
        
        const instructionText = new PIXI.Text(
            "Klikni kamkoli pro zavření...",
            {
                fontFamily: "Arial",
                fontSize: 18,
                fill: 0xf5c518,
                align: "center"
            }
        );
        instructionText.anchor.set(0.5);
        instructionText.x = panelW / 2;
        instructionText.y = panelH / 2 + 30;
        instructionText.interactive = true;
        instructionText.on('pointerdown', (e) => {
            e.stopPropagation();
            destroyUI();
            onComplete(true);
        });
        successContainer.addChild(instructionText);
        
        panel.addChild(successContainer);
        uiContainer = successContainer;
        
        const overlayContainer = panel.parent;
        if (overlayContainer) {
            const background = overlayContainer.children[0];
            if (background) {
                background.interactive = true;
                background.once('pointerdown', (e) => {
                    e.stopPropagation();
                    destroyUI();
                    onComplete(true);
                });
            }
        }
    }

    function handleLoan(amount, panel, desc, instr, sprite, options, onComplete) {
        if (!amount || amount <= 0 || amount > bankOptions.maxLoan) {
            desc.text = `Neplatná částka (1-${bankOptions.maxLoan})`;
            return false;
        }
        
        loanAmount = amount;
        loanActive = true;
        addMoney(amount);
        
        if (sprite && options?.successSprite !== undefined) {
            const successPath = `../../graphics/chars/bank/bank${options.successSprite}.png`;
            const tex = PIXI.Texture.from(successPath);
            sprite.texture = tex;
            
            if (options.successSpritePos) {
                const map = { L: 0.33, C: 0.5, P: 0.66, R: 0.66 };
                sprite.x = app.screen.width * (map[options.successSpritePos] || 0.5);
            }
        }
        
        removeHTMLInput();
        showSuccessMessage(panel, desc, instr, sprite, `Půjčeno $${amount}. Nezapomeň vrátit $${amount * bankOptions.interestRate}!`, onComplete);
        return true;
    }

    function handleRepayment(panel, desc, instr, sprite, onComplete) {
        const repaymentAmount = loanAmount * bankOptions.interestRate;
        
        subMoney(repaymentAmount);
        loanAmount = 0;
        loanActive = false;
        
        if (sprite) {
            const normalPath = "../../graphics/chars/bank/bank1.png";
            const tex = PIXI.Texture.from(normalPath);
            sprite.texture = tex;
        }
        
        removeHTMLInput();
        destroyUI();
        
        showSuccessMessage(panel, desc, instr, sprite, "Dluh úspěšně splacen! Děkujeme.", onComplete);
    }

    function showLoanUI(panel, desc, instr, sprite, onComplete, options) {
        if (options) {
            bankOptions = { ...bankOptions, ...options };
        }
        
        if (instr) instr.visible = false;
        
        if (uiContainer && panel) {
            panel.removeChild(uiContainer);
            uiContainer.destroy({ children: true });
        }
        
        uiContainer = new PIXI.Container();
        
        const panelW = panel.width;
        const panelH = panel.height;
        
        const titleText = new PIXI.Text(
            loanActive ? "Správa dluhu" : "Půjčka",
            {
                fontFamily: "Arial",
                fontSize: 24,
                fill: 0xf5c518,
                fontWeight: "bold",
                align: "center"
            }
        );
        titleText.anchor.set(0.5);
        titleText.x = panelW / 2;
        titleText.y = 30;
        uiContainer.addChild(titleText);
        
        const statusText = new PIXI.Text(
            loanActive ? "Aktuální dluh: $" + loanAmount : "Nemáš žádný dluh",
            {
                fontFamily: "Arial",
                fontSize: 18,
                fill: 0xecf0f1,
                fontWeight: "bold",
                align: "center",
                wordWrap: true,
                wordWrapWidth: panelW - 40
            }
        );
        statusText.anchor.set(0.5);
        statusText.x = panelW / 2;
        statusText.y = 70;
        uiContainer.addChild(statusText);
        
        if (!loanActive) {
            const infoText = new PIXI.Text(
                `Maximální půjčka: $${bankOptions.maxLoan}\nVrátit budeš muset ${bankOptions.interestRate * 100}%! Bacha!`,
                {
                    fontFamily: "Arial",
                    fontSize: 16,
                    fill: 0xf5c518,
                    align: "center",
                    wordWrap: true,
                    wordWrapWidth: panelW - 60
                }
            );
            infoText.anchor.set(0.5);
            infoText.x = panelW / 2;
            infoText.y = 120;
            uiContainer.addChild(infoText);
            
            const inputLabel = new PIXI.Text("Zadej částku:", {
                fontFamily: "Arial",
                fontSize: 14,
                fill: 0x95a5a6,
                align: "center"
            });
            inputLabel.anchor.set(0.5);
            inputLabel.x = panelW / 2;
            inputLabel.y = 170;
            uiContainer.addChild(inputLabel);
            
            const inputWidth = 200;
            const inputX = (panelW - inputWidth) / 2;
            const inputY = 190;
            
            const confirmBtn = createButton("Půjčit", 0x27ae60, 0x2ecc71, panelW/2 - 75, 260, 150, 45, () => {
                if (htmlInput) {
                    const amount = parseInt(htmlInput.value);
                    handleLoan(amount, panel, desc, instr, sprite, options, onComplete);
                }
            });
            uiContainer.addChild(confirmBtn);
            
            const cancelBtn = createButton("Zrušit", 0x7f8c8d, 0x95a5a6, panelW/2 - 75, 320, 150, 40, () => {
                removeHTMLInput();
                destroyUI();
                onComplete(true);
            });
            uiContainer.addChild(cancelBtn);
            
            panel.addChild(uiContainer);
            
            createHTMLInput(panel, inputX, inputY, inputWidth, (value) => {
                handleLoan(value, panel, desc, instr, sprite, options, onComplete);
            }, bankOptions.maxLoan);
            
        } else {
            const repaymentAmount = loanAmount * bankOptions.interestRate;
            const hasEnoughMoney = getMoney() >= repaymentAmount;
            
            const repaymentText = new PIXI.Text(
                `Pro splacení dluhu potřebuješ $${repaymentAmount}`,
                {
                    fontFamily: "Arial",
                    fontSize: 18,
                    fill: hasEnoughMoney ? 0x2ecc71 : 0xe74c3c,
                    align: "center",
                    wordWrap: true,
                    wordWrapWidth: panelW - 60
                }
            );
            repaymentText.anchor.set(0.5);
            repaymentText.x = panelW / 2;
            repaymentText.y = 150;
            uiContainer.addChild(repaymentText);
            
            if (hasEnoughMoney) {
                const repayBtn = createButton("Splatit dluh", 0x27ae60, 0x2ecc71, panelW/2 - 100, 210, 200, 50, () => {
                    handleRepayment(panel, desc, instr, sprite, onComplete);
                });
                uiContainer.addChild(repayBtn);
                
                const backBtn = createButton("Zpět", 0x7f8c8d, 0x95a5a6, panelW/2 - 100, 280, 200, 40, () => {
                    destroyUI();
                    onComplete(true);
                });
                uiContainer.addChild(backBtn);
                
            } else {
                const backBtn = createButton("Zpět", 0x7f8c8d, 0x95a5a6, panelW/2 - 100, 300, 200, 40, () => {
                    destroyUI();
                    onComplete(true);
                });
                uiContainer.addChild(backBtn);
            }
        }
        
        panel.addChild(uiContainer);
    }
    
    function createButton(text, color, hoverColor, x, y, width, height, onClick) {
        const btn = new PIXI.Container();
        btn.x = x;
        btn.y = y;
        
        const bg = new PIXI.Graphics();
        bg.beginFill(color);
        bg.lineStyle(2, hoverColor);
        bg.drawRoundedRect(0, 0, width, height, 8);
        bg.endFill();
        btn.addChild(bg);
        
        const label = new PIXI.Text(text, {
            fontFamily: "Arial",
            fontSize: text.length > 10 ? 14 : 16,
            fill: 0xffffff,
            fontWeight: "bold"
        });
        label.anchor.set(0.5);
        label.x = width / 2;
        label.y = height / 2;
        btn.addChild(label);
        
        btn.interactive = true;
        btn.cursor = "pointer";
        btn.on('pointerdown', (e) => {
            e.stopPropagation();
            onClick();
        });
        
        return btn;
    }
    
    function destroyUI() {
        if (uiContainer && uiContainer.parent) {
            uiContainer.parent.removeChild(uiContainer);
            uiContainer.destroy({ children: true });
            uiContainer = null;
        }
        removeHTMLInput();
    }
    
    function reset() {
        loanAmount = 0;
        loanActive = false;
        bankOptions = { maxLoan: 1000, interestRate: 2, minRepayment: 100 };
        destroyUI();
    }
    
    window.addEventListener('resize', () => {
        if (htmlInput && uiContainer && uiContainer.parent) {
            removeHTMLInput();
        }
    });
    
    return {
        showLoanUI,
        reset,
        isLoanActive: () => loanActive,
        getLoanAmount: () => loanAmount
    };
}