export function createApp(){
    const app = new PIXI.Application({
        resizeTo: window,
        autoDensity: true,
        backgroundColor: 0xeeeeee,
        antialias: true
    });
    document.body.appendChild(app.view);
    document.body.style.margin = "0";
    document.body.style.overflow = "hidden";
    document.documentElement.style.margin = "0";
    document.documentElement.style.overflow = "hidden";
    
    app.stage.sortableChildren = true;
    app.stage.interactive = true;
    app.stage.hitArea = app.screen;

    return app;
}