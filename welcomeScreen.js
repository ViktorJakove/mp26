export function createWelcomeScreen(onNewGame, spriteButtons = []) {
    if (!document.querySelector('link[href*="welcomeScreen.css"]')) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'welcomeScreen.css';
        document.head.appendChild(link);
    }

    const overlay = document.createElement('div');
    overlay.id = 'welcome-overlay';

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

    // Verze
    const version = document.createElement('div');
    version.className = 'welcome-version';
    version.textContent = 'Verze 1.0';
    container.appendChild(version);

    overlay.appendChild(container);
    document.body.appendChild(overlay);

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