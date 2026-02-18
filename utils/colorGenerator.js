export class ColorGenerator {
    constructor(options = {}) {
        this.hue = Math.random() * 360;

        this.sat = options.sat ?? 0.7;
        this.light = options.light ?? 0.45;

        this.goldenAngle = 137.508;
    }

    next() {
        this.hue = (this.hue + this.goldenAngle) % 360;
        return this.hslToHex(this.hue, this.sat, this.light);
    }

    hslToHex(h, s, l) {

        const k = n => (n + h / 30) % 12;
        const a = s * Math.min(l, 1 - l);
        const f = n =>
            l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));

        const r = Math.round(255 * f(0));
        const g = Math.round(255 * f(8));
        const b = Math.round(255 * f(4));

        return (r << 16) + (g << 8) + b;
    }
}
