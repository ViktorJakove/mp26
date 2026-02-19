// connections: which sides this tile connects to [N, E, S, W] = [top, right, bottom, left]
export const RAIL_TYPES = {
    STRAIGHT_H: {
        id: "STRAIGHT_H",
        connections: [false, true, false, true],  // E-W
        texture: "../../static/map/rails/rail_h.png"
    },
    STRAIGHT_V: {
        id: "STRAIGHT_V",
        connections: [true, false, true, false],  // N-S
        texture: "../../static/map/rails/rail_v.png"
    },
    CURVE_NE: {
        id: "CURVE_NE",
        connections: [true, true, false, false],  // N-E
        texture: "../../static/map/rails/rail_ne.png"
    },
    CURVE_SE: {
        id: "CURVE_SE",
        connections: [false, true, true, false],  // S-E
        texture: "../../static/map/rails/rail_se.png"
    },
    CURVE_SW: {
        id: "CURVE_SW",
        connections: [false, false, true, true],  // S-W
        texture: "../../static/map/rails/rail_sw.png"
    },
    CURVE_NW: {
        id: "CURVE_NW",
        connections: [true, false, false, true],  // N-W
        texture: "../../static/map/rails/rail_nw.png"
    },
    CROSS: {
        id: "CROSS",
        connections: [true, true, true, true],
        texture: "../../static/map/rails/rail_cross.png"
    },
    T_N: {
        id: "T_N",
        connections: [true, true, false, true],   // N-E-W
        texture: "../../static/map/rails/rail_t_n.png"
    },
    T_E: {
        id: "T_E",
        connections: [true, true, true, false],   // N-E-S
        texture: "../../static/map/rails/rail_t_e.png"
    },
    T_S: {
        id: "T_S",
        connections: [false, true, true, true],   // E-S-W
        texture: "../../static/map/rails/rail_t_s.png"
    },
    T_W: {
        id: "T_W",
        connections: [true, false, true, true],   // N-S-W
        texture: "../../static/map/rails/rail_t_w.png"
    },
};

//0=N, 1=E, 2=S, 3=W
export const OPPOSITE = [2, 3, 0, 1]; // N<->S, E<->W

export function canConnect(typeA, sideFromA) {
    // sideFromA: which side of A faces neighbor (0=N,1=E,2=S,3=W)
    if (!typeA.connections[sideFromA]) return false;
    return true;
}

export function railTypesCompatible(typeA, typeB, sideFromA) {
    const sideFromB = OPPOSITE[sideFromA];
    return typeA.connections[sideFromA] && typeB.connections[sideFromB];
}