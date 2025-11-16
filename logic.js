// PIXI setup
const app = new PIXI.Application({
    resizeTo: window,
    autoDensity: true,
    backgroundColor: 0xeeeeee,
    antialias: true
});
document.body.appendChild(app.view);

app.view.style.width = "100vw";
app.view.style.height = "100vh";
app.view.style.display = "block"; // removes body margin issue

document.body.style.margin = "0";
document.body.appendChild(app.view);

const GRAVITY = 0.5;
const BOUNCINESS = 0.8;
const BOX_SIZE = 40;

const boxes = [];

class Box {
    constructor(x, y) {
        //defaults
        this.size = BOX_SIZE;
        this.vx = 0;
        this.vy = 0;
        this.sprite = new PIXI.Graphics();
        this.sprite.beginFill(0x333333);
        this.sprite.drawRect(0, 0, this.size, this.size);
        this.sprite.endFill();

        //set init position
        this.sprite.x = x;
        this.sprite.y = y;

        app.stage.addChild(this.sprite);
    }

    update() {
        //moving
        this.vy += GRAVITY;
        this.sprite.x += this.vx;
        this.sprite.y += this.vy;

        //ground colls
        const groundY = app.renderer.height - this.size;
        if (this.sprite.y > groundY) {
            this.sprite.y = groundY;
            this.vy *= -BOUNCINESS;
        }

        //box-box colls
        for (let other of boxes) {
            if (other === this) continue;

            const dx = this.sprite.x - other.sprite.x;
            const dy = this.sprite.y - other.sprite.y;

            const overlapX = this.size - Math.abs(dx);
            const overlapY = this.size - Math.abs(dy);

            if (overlapX > 0 && overlapY > 0) {

                if (overlapX < overlapY) {
                    //horizontal push
                    const push = overlapX / 2;
                    if (dx > 0) {
                        this.sprite.x += push;
                        other.sprite.x -= push;
                    } else {
                        this.sprite.x -= push;
                        other.sprite.x += push;
                    }
                } else {
                    //vertical push
                    const push = overlapY / 2;
                    if (dy > 0) {
                        this.sprite.y += push;
                        other.sprite.y -= push;
                    } else {
                        this.sprite.y -= push;
                        other.sprite.y += push;
                    }

                    //vel transfer
                    if (dy < 0) {
                        other.vy += this.vy * 0.5;
                        //this.vy = 0;
                    }
                }
            }
        }
    }
}
//spawn
app.renderer.view.addEventListener("pointerdown", (e) => {
    const x = e.clientX;
    const y = e.clientY;
    boxes.push(new Box(x, y));
});
app.ticker.add(() => {
    for (let b of boxes) {
        b.update();
    }
});
