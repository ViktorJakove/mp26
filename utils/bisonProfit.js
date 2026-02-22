import { AREA_TYPES } from "../enums/areaTypes.js";

export function getBisonAdjacentTiles(getAreas) {
    const areas = getAreas();
    const bisonAdjacent = new Set();
    const deltas = [[0,-1],[1,0],[0,1],[-1,0]];

    for (const area of areas) {
        if (area.type !== AREA_TYPES.BISONS) continue;
        for (let x = area.x; x < area.x + area.sizeX; x++) {
            for (let y = area.y; y < area.y + area.sizeY; y++) {
                for (const [dx, dy] of deltas) {
                    bisonAdjacent.add(`${x + dx},${y + dy}`);
                }
            }
        }
    }
    return bisonAdjacent;
}

export function countConnectedBisonRails(tileX, tileY, occupiedTiles, getAreas) {
    const bisonAdjacent = getBisonAdjacentTiles(getAreas);
    if (!bisonAdjacent.has(`${tileX},${tileY}`)) return 0;

    const visited = new Set();
    const queue = [`${tileX},${tileY}`];
    visited.add(`${tileX},${tileY}`);
    let count = 0;

    while (queue.length > 0) {
        const current = queue.shift();
        if (bisonAdjacent.has(current)) {
            count++;
            const [cx, cy] = current.split(',').map(Number);
            const deltas = [[0,-1],[1,0],[0,1],[-1,0]];
            for (const [dx, dy] of deltas) {
                const nk = `${cx + dx},${cy + dy}`;
                if (!visited.has(nk) && occupiedTiles.has(nk)) {
                    visited.add(nk);
                    queue.push(nk);
                }
            }
        }
    }
    return count;
}