export const CHAR_FOLDERS = [
    "bank",
    "barber", 
    "bussiness",
    "graveyard",
    "indian",
    "marco",
    "mech",
    "olda",
    "shop",
    "sheriff"
];

const MAX_SPRITES_PER_FOLDER = 1;

export async function getRandomCharacter() {
    const randomFolder = CHAR_FOLDERS[Math.floor(Math.random() * CHAR_FOLDERS.length)];
    
    const randomSprite = Math.floor(Math.random() * MAX_SPRITES_PER_FOLDER) + 1;
    
    const path = `graphics/chars/${randomFolder}/${randomFolder}${randomSprite}.png`;
    
    return {
        path,
        folder: randomFolder,
        spriteIndex: randomSprite
    };
}

export async function createCharacterSprite(path, app) {
    return new Promise((resolve, reject) => {
        console.log("Loading sprite from:", path);
        
        const texture = PIXI.Texture.from(path);
        const sprite = new PIXI.Sprite(texture);
        
        const setScale = () => {
            const maxSize = Math.min(app.screen.width, app.screen.height) * 0.15;
            const scale = maxSize / Math.max(texture.width, texture.height);
            sprite.scale.set(scale);
            console.log("Sprite loaded, scale:", scale);
            resolve(sprite);
        };
        
        if (texture.valid) {
            setScale();
        } else {
            texture.once('update', setScale);
            texture.once('error', (err) => {
                console.error("Error loading texture:", path, err);
                reject(err);
            });
        }
    });
}