export function createRailPathfinder(occupiedTiles) {
    const DELTAS = [[0,-1],[1,0],[0,1],[-1,0]];
    const OPPOSITE = [2, 3, 0, 1]; // N<->S, E<->W

    function getNeighborKeys(x, y) {
        const rail = occupiedTiles.get(`${x},${y}`);
        if (!rail) return [];

        const neighbors = [];
        for (let side = 0; side < 4; side++) {
            if (!rail.type.connections[side]) continue;
            const [dx, dy] = DELTAS[side];
            const nx = x + dx, ny = y + dy;
            const neighborKey = `${nx},${ny}`;
            const neighbor = occupiedTiles.get(neighborKey);
            if (neighbor && neighbor.type.connections[OPPOSITE[side]]) {
                neighbors.push(neighborKey);
            }
        }
        return neighbors;
    }

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
            for (const neighbor of getNeighborKeys(cx, cy)) {
                if (neighbor === target) return true;
                if (!visited.has(neighbor)) {
                    visited.add(neighbor);
                    queue.push(neighbor);
                }
            }
        }
        return false;
    }

    return { areStationsConnected };
}