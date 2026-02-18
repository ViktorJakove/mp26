export function createPointerTextRenderer(app){
    const pointerContainer = new PIXI.Container();
    pointerContainer.zIndex = 20;
    app.stage.addChild(pointerContainer);

    let pointerText = null;
    let mousePosition = {x: 0, y: 0};
    let lastObstacle = null;

    function getPointerText(){
        if (!pointerText){
            pointerText = new PIXI.Text("", {
                fontFamily: "Arial",
                fontSize: 14,
                fill: 0x000000,
                backgroundColor: 0xffffff,
                padding: 4,
                align: "center"
            });
            pointerText.alpha = 0.8;
            pointerContainer.addChild(pointerText);
        }
        return pointerText;
    }

    function updatePointerText(text,x,y, gridScale){
        const pointerText = getPointerText();
        pointerText.text = text;
        pointerText.x = x;
        pointerText.y = y;
        if (gridScale) {
            pointerText.scale.set(1 / gridScale, 1 / gridScale);
        }
    }
    function hidePointerText() {
        if (pointerText) {
            pointerText.visible = false;
        }
    }

    function updateMousePosition(x, y,obstacleName) {
        mousePosition.x = x;
        mousePosition.y = y;
        lastObstacle = obstacleName;
    }

    function refresh(getGridScale) {
        const gridScale = getGridScale();
        const text = lastObstacle ? `Obstacle: ${lastObstacle}` : "";
        const textX = mousePosition.x / gridScale;
        const textY = mousePosition.y / gridScale;
        updatePointerText(text, textX, textY, gridScale);
    }

    return {
        updatePointerText,
        hidePointerText,
        updateMousePosition,
        refresh
    };

}
export function updatePointerTextRenderer(obstacleName, screenMouseX, screenMouseY, getGridScale) {
    if (window.pointerTextRenderer) {
        const text = obstacleName ? `Obstacle: ${obstacleName}` : "";
        const gridScale = getGridScale();
        let textX = screenMouseX /gridScale
        let textY = screenMouseY /gridScale;

        window.pointerTextRenderer.updatePointerText(text, textX , textY, gridScale);
        window.pointerTextRenderer.updateMousePosition(screenMouseX, screenMouseY, obstacleName);


    }
}