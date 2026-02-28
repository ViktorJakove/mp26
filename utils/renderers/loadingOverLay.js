export function createLoadingOverlay(app) {
    let container = null;
    let interval = null;
    let isVisible = false;
    
    function show(message = "Generuji mapu. Prosím čekejte.") {
        if (isVisible) return;
        
        container = new PIXI.Container();
        container.zIndex = 1000;
        
        const bg = new PIXI.Graphics();
        bg.beginFill(0x000000, 0.7);
        bg.drawRect(0, 0, app.screen.width, app.screen.height);
        bg.endFill();
        bg.interactive = true;
        container.addChild(bg);
        
        const panel = new PIXI.Graphics();
        panel.beginFill(0x2c3e50, 0.95);
        panel.lineStyle(4, 0xf5c518);
        panel.drawRoundedRect(0, 0, 450, 200, 16);
        panel.endFill();
        panel.x = (app.screen.width - 450) / 2;
        panel.y = (app.screen.height - 200) / 2;
        container.addChild(panel);
        
        const text = new PIXI.Text(message, {
            fontFamily: "Arial",
            fontSize: 22,
            fill: 0xf5c518,
            fontWeight: "bold",
            align: "center",
            wordWrap: true,
            wordWrapWidth: 410
        });
        text.anchor.set(0.5);
        text.x = app.screen.width / 2;
        text.y = app.screen.height / 2 - 30;
        container.addChild(text);
        
        const animText = new PIXI.Text("⏳", {
            fontFamily: "Arial",
            fontSize: 36,
            fill: 0xffffff
        });
        animText.anchor.set(0.5);
        animText.x = app.screen.width / 2;
        animText.y = app.screen.height / 2 + 40;
        container.addChild(animText);
        
        app.stage.addChild(container);
        
        //ANIM
        let dots = 0;
        interval = setInterval(() => {
            if (!container) return;
            dots = (dots + 1) % 4;
            animText.text = "⏳" + ".".repeat(dots);
        }, 300);
        
        isVisible = true;
        
        const resizeHandler = () => {
            if (!container) return;
            container.children[1].x = (app.screen.width - 450) / 2;
            container.children[1].y = (app.screen.height - 200) / 2;
            container.children[2].x = app.screen.width / 2;
            container.children[2].y = app.screen.height / 2 - 30;
            container.children[3].x = app.screen.width / 2;
            container.children[3].y = app.screen.height / 2 + 40;
        };
        
        window.addEventListener('resize', resizeHandler);
        
        return { container, interval, resizeHandler };
    }
    
    function hide() {
        if (interval) {
            clearInterval(interval);
            interval = null;
        }
        if (container && container.parent) {
            app.stage.removeChild(container);
            container.destroy({ children: true });
            container = null;
        }
        isVisible = false;
    }
    
    return { show, hide, isVisible: () => isVisible };
}