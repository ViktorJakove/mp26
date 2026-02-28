export function createWelcomeScreen(onNewGame, onLoadGame) {
    const overlay = document.createElement('div');
    overlay.id = 'welcome-overlay';
    overlay.style.position = 'fixed';
    overlay.style.top = '0';
    overlay.style.left = '0';
    overlay.style.width = '100%';
    overlay.style.height = '100%';
    overlay.style.backgroundColor = 'rgba(0, 0, 0, 0.9)';
    overlay.style.display = 'flex';
    overlay.style.justifyContent = 'center';
    overlay.style.alignItems = 'center';
    overlay.style.zIndex = '9999';
    overlay.style.fontFamily = 'Arial, sans-serif';

    const container = document.createElement('div');
    container.style.textAlign = 'center';
    container.style.color = 'white';
    container.style.maxWidth = '600px';
    container.style.padding = '40px';

    const title = document.createElement('h1');
    title.textContent = 'ŽELEZNIČNÍ TYCOON';
    title.style.fontSize = '64px';
    title.style.color = '#f5c518';
    title.style.marginBottom = '20px';
    title.style.textShadow = '2px 2px 4px rgba(0,0,0,0.5)';
    container.appendChild(title);

    const subtitle = document.createElement('h2');
    subtitle.textContent = 'Divočinou na kolejích';
    subtitle.style.fontSize = '24px';
    subtitle.style.color = '#ecf0f1';
    subtitle.style.fontStyle = 'italic';
    subtitle.style.marginBottom = '60px';
    subtitle.style.fontWeight = 'normal';
    container.appendChild(subtitle);

    const buttonStyle = {
        width: '250px',
        height: '60px',
        fontSize: '28px',
        fontWeight: 'bold',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        margin: '15px auto',
        display: 'block',
        transition: 'transform 0.2s, background-color 0.2s'
    };

    const newGameBtn = document.createElement('button');
    newGameBtn.textContent = 'NOVÁ HRA';
    Object.assign(newGameBtn.style, buttonStyle);
    newGameBtn.style.backgroundColor = '#27ae60';
    newGameBtn.style.color = 'white';
    newGameBtn.style.border = '4px solid #2ecc71';
    
    newGameBtn.onmouseover = () => {
        newGameBtn.style.backgroundColor = '#2ecc71';
        newGameBtn.style.transform = 'scale(1.05)';
    };
    newGameBtn.onmouseout = () => {
        newGameBtn.style.backgroundColor = '#27ae60';
        newGameBtn.style.transform = 'scale(1)';
    };
    newGameBtn.onclick = () => {
        document.body.removeChild(overlay);
        onNewGame();
    };
    container.appendChild(newGameBtn);

    // Load Game button
    const loadGameBtn = document.createElement('button');
    loadGameBtn.textContent = 'NAČÍST HRU';
    Object.assign(loadGameBtn.style, buttonStyle);
    loadGameBtn.style.backgroundColor = '#f39c12';
    loadGameBtn.style.color = 'white';
    loadGameBtn.style.border = '4px solid #f1c40f';
    
    loadGameBtn.onmouseover = () => {
        loadGameBtn.style.backgroundColor = '#f1c40f';
        loadGameBtn.style.transform = 'scale(1.05)';
    };
    loadGameBtn.onmouseout = () => {
        loadGameBtn.style.backgroundColor = '#f39c12';
        loadGameBtn.style.transform = 'scale(1)';
    };
    loadGameBtn.onclick = () => {
        document.body.removeChild(overlay);
        onLoadGame();
    };
    container.appendChild(loadGameBtn);

    // Version
    const version = document.createElement('div');
    version.textContent = 'Verze 1.0';
    version.style.position = 'absolute';
    version.style.bottom = '20px';
    version.style.left = '20px';
    version.style.color = '#95a5a6';
    version.style.fontSize = '14px';
    container.appendChild(version);

    overlay.appendChild(container);
    document.body.appendChild(overlay);

    // Return control functions
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