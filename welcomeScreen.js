
import { getRandomCharacter, createCharacterSprite } from './utils/randomCharSelector.js';
export function createWelcomeScreen(onNewGame, spriteButtons = []) {
    if (!document.querySelector('link[href*="welcomeScreen.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'welcomeScreen.css';
        document.head.appendChild(link);
    }

    const overlay = document.createElement('div');
    overlay.id = 'welcome-overlay';

    // PŘIDÁME KONTEJNER PRO POSTAVY
    const pixiContainer = document.createElement('div');
    pixiContainer.id = 'welcome-pixi-container';
    pixiContainer.style.position = 'absolute';
    pixiContainer.style.top = '0';
    pixiContainer.style.left = '0';
    pixiContainer.style.width = '100%';
    pixiContainer.style.height = '100%';
    pixiContainer.style.pointerEvents = 'none';
    pixiContainer.style.zIndex = '9998';
    overlay.appendChild(pixiContainer);

    const topRightContainer = document.createElement('div');
    topRightContainer.className = 'top-right-buttons';
    overlay.appendChild(topRightContainer);

    spriteButtons.forEach((button) => {
        if (!button.path) return;
        
        const btnContainer = document.createElement('div');
        btnContainer.className = 'sprite-button';
        
        btnContainer.onclick = (e) => {
            e.stopPropagation();
            if (button.onClick) {
                button.onClick();
            }
        };
        
        const img = document.createElement('img');
        img.src = button.path;
        img.alt = button.alt || 'button';
        img.style.width = button.width || '40px';
        img.style.height = button.height || '40px';
        
        btnContainer.appendChild(img);
        topRightContainer.appendChild(btnContainer);
    });

    const container = document.createElement('div');
    container.className = 'welcome-container';

    const title = document.createElement('h1');
    title.className = 'welcome-title';
    title.textContent = 'Wild Wild Rails 3';
    container.appendChild(title);

    const subtitle = document.createElement('h2');
    subtitle.className = 'welcome-subtitle';
    subtitle.textContent = 'Divoké koleje';
    container.appendChild(subtitle);

    const newGameBtn = document.createElement('button');
    newGameBtn.className = 'welcome-button welcome-button-new';
    newGameBtn.textContent = 'NOVÁ HRA';
    
    newGameBtn.onclick = () => {
        document.body.removeChild(overlay);
        onNewGame();
    };
    container.appendChild(newGameBtn);

    const version = document.createElement('div');
    version.className = 'welcome-version';
    version.textContent = 'Verze 1.0';
    container.appendChild(version);

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // ZDE VOLÁME initCharacters
    setTimeout(() => initCharacters(pixiContainer), 100);

    return {
        hide: () => {
            if (overlay.parentNode) {
                document.body.removeChild(overlay);
            }
        },
        show: () => {
            if (!overlay.parentNode) {
                document.body.appendChild(overlay);
            }
        }
    };
}

async function initCharacters(container) {
    console.log("Initializing characters...");
    
    try {
        const app = new PIXI.Application({
            width: window.innerWidth,
            height: window.innerHeight,
            transparent: true,
            resolution: 1,
            antialias: true
        });
        
        app.view.style.position = 'absolute';
        app.view.style.top = '0';
        app.view.style.left = '0';
        app.view.style.width = '100%';
        app.view.style.height = '100%';
        app.view.style.pointerEvents = 'none';
        
        container.appendChild(app.view);
        console.log("PIXI app created");

        // Načteme postavy
        const characters = await loadCharacters(app);
        
        if (characters.left && characters.right) {
            app.stage.addChild(characters.left);
            app.stage.addChild(characters.right);
            
            // Animace
            let time = 0;
            app.ticker.add(() => {
                time += 0.01;
                if (characters.left) {
                    characters.left.y = app.screen.height * 0.5 + Math.sin(time) * 10;
                }
                if (characters.right) {
                    characters.right.y = app.screen.height * 0.5 + Math.cos(time) * 10;
                }
            });
            
            console.log("Characters added to stage");
        }
        
        window.addEventListener('resize', () => {
            app.renderer.resize(window.innerWidth, window.innerHeight);
            if (characters.left) {
                characters.left.x = app.screen.width * 0.15;
            }
            if (characters.right) {
                characters.right.x = app.screen.width * 0.85;
            }
        });
        
    } catch (error) {
        console.error("Error initializing characters:", error);
    }
}

async function loadCharacters(app) {
    const leftChar = await getRandomCharacter();
    console.log("Left character:", leftChar);
    
    let rightChar;
    do {
        rightChar = await getRandomCharacter();
        console.log("Right character:", rightChar);
    } while (rightChar.folder === leftChar.folder);
    
    const leftSprite = await createCharacterSprite(leftChar.path, app);
    leftSprite.anchor.set(0.5);
    leftSprite.x = app.screen.width * 0.15;
    leftSprite.y = app.screen.height * 0.5;
    leftSprite.rotation = -0.1;
    
    const rightSprite = await createCharacterSprite(rightChar.path, app);
    rightSprite.anchor.set(0.5);
    rightSprite.x = app.screen.width * 0.85;
    rightSprite.y = app.screen.height * 0.5;
    rightSprite.rotation = 0.1;
    
    return { left: leftSprite, right: rightSprite };
}