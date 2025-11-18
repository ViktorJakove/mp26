export class City {
    /** 
    @param {number} x - x coordinate(left upper corner)
    @param {number} y - y coordinate(left upper corner)  
    @param {number} size - size of the city
    @param {number} peeps - population
    @param {string} name - self explanatory, bro
    */
    constructor(x,y,size, peeps,name) {
        this.x = x;
        this.y = y;
        this.size = size;
        this.peeps = peeps;
        this.name = name;
    }
}