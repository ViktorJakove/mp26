export function createRailPathfinder(occupiedTiles) {
    function areStationsConnected(x1, y1, x2, y2) {
        if (!occupiedTiles.has(`${x1},${y1}`) || !occupiedTiles.has(`${x2},${y2}`)) return false;
        if (x1 === x2 && y1 === y2) return true;

        const visited = new Set();
        const queue = [`${x1},${y1}`];
        visited.add(`${x1},${y1}`);
        const target = `${x2},${y2}`;

        while (queue.length > 0) {
            const current = queue.shift();
            const [cx, cy] = current.split(',').map(Number);
            for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
                const neighbor = `${cx+dx},${cy+dy}`;
                if (neighbor === target) return true;
                if (!visited.has(neighbor) && occupiedTiles.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return false;
    }

    return { areStationsConnected };
}