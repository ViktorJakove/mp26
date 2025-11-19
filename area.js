export class Area {
    /** 
    @param {string} type - AREATYPES.[area type]
    @param {number} x - x coordinate(left upper corner)
    @param {number} y - y coordinate(left upper corner)  
    @param {number} size - size of the city
    @param {string} name - self explanatory, bro
    @param {number} peeps - population
    */
    constructor(type,x,y,size,name, peeps) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.size = size;
        this.name = name;
        this.peeps = peeps;
    }
}