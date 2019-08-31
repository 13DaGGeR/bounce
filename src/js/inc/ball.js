export default class Ball {
    constructor(app) {
        this.app = app;
        this.x = 100;
        this.y = 100;
        this.w = 50;
        this.h = 50;
        this.m = Math.round(Math.random() * 99) + 1;
        this.sx = 0;
        this.sy = 0;
        this.color = this.randomColor();
        this.id = Math.round(Math.random() * 10000000);
        this.bounce_force = this.app.bounce_force;
        this.distance = {};
    }
    randomColor() {
        return '#' +
            (Math.floor(Math.random() * 255)).toString(16) +
            (Math.floor(Math.random() * 255)).toString(16) +
            (Math.floor(Math.random() * 255)).toString(16);
    }
    tick() {
        this.distance = {};
        this.bounce_canvas();
        this.apply_gravitation();
        this.apply_density();
        this.bounce_balls();
        this.apply_speed();
    }
    get_radius() {
        return this.h / 2;
    }
    apply_gravitation() {
        this.sy += this.app.gravity / this.app.tickrate;
    }
    bounce_canvas() {
        let r = this.get_radius();
        let bounce_koef = this.bounce_force / 10;
        if (this.y - r <= 0 && this.sy < 0 ||
            this.y + r >= this.app.canvas.h && this.sy > 0) {
            this.sy *= -bounce_koef;
        }
        if (this.x - r <= 0 && this.sx < 0 ||
            this.x + r >= this.app.canvas.w && this.sx > 0) {
            this.sx *= -bounce_koef;
        }
    }
    bounce_balls() {
        if (!this.sx && !this.sy) return;
        for (let b of this.app.balls) {
            if (b.id === this.id || b.distance[this.id]) {
                continue;
            }
            let d = this.distance[b.id] = this.distance2ball(b);
            if (
                d < (this.h + b.h) / 2 &&
                (
                    (this.x - b.x > 0 && this.sx < b.sx) ||
                    (this.x - b.x < 0 && this.sx > b.sx) ||
                    (this.y - b.y > 0 && this.sy < b.sy) ||
                    (this.y - b.y < 0 && this.sy > b.sy)
                )
            ) { // collision
                let bounce_koef = (this.bounce_force + b.bounce_force) / 20;
                let x2y = Math.abs(this.x - b.x) / Math.abs(this.y - b.y);
                let xIncr = this.x > b.x;
                let yIncr = this.y > b.y;
                let currentP = this.getP();
                this.applyP(b.getP() * bounce_koef, x2y, xIncr, yIncr);
                b.applyP(currentP * bounce_koef, x2y, !xIncr, !yIncr);
            }
        }
    }
    getP() {
        let result = ((this.sx ** 2 + this.sy ** 2) ** .5) * this.m;
        return isNaN(result) ? 0 : result;
    }
    applyP(p, x2y, xIncr, yIncr) {
        if (p === 0 || isNaN(p)) {
            this.sx = 0;
            this.sy = 0;
            return;
        }
        // p = ((m * sx) ** 2 + (m * sy) ** 2) ** .5
        // x2y = sx / sy;
        // sx = (p * x2y) / ((x2y ** 2 + 1) ** .5)
        let sx = (p * x2y)  / ((x2y ** 2 + 1) ** .5);
        this.sx = sx * (xIncr ? 1 : -1) / this.m;
        this.sy = ((p ** 2 - sx ** 2) ** .5) * (yIncr ? 1 : -1) / this.m;
    }
    distance2ball(b) {
        return ((this.x - b.x) ** 2 + (this.y - b.y) ** 2) ** .5;
    }
    apply_density() {
        let density_koef = Math.min(1, (100 - this.app.density) / 100);
        this.sy *= density_koef;
        this.sx *= density_koef;
    }
    apply_speed() {
        let r = this.get_radius();
        this.sy = this.app.round(this.sy, 5);
        this.sx = this.app.round(this.sx, 5);
        this.y = this.app.round(Math.min(this.app.canvas.h - r, Math.max(r, this.sy + this.y)), 3);
        this.x = this.app.round(Math.min(this.app.canvas.w - r, Math.max(r, this.sx + this.x)), 3);
    }
}
