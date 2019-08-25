<template>
    <div class="row">
        <div class="col-12 col-lg-6">
            <div ref="canvas"
                 class="canvas"
                 :style="canvas_style"
                 @mouseup="clickup"
                 @mouseleave="clickup"
                 @touchend="clickup"
                 @mousemove="dragMove"
                 @touchmove="dragMove"
            >
                <div class="ball"
                     :style="ball_style(ball)"
                     v-for="ball in balls"
                     @mousedown="clickdown($event, ball)"
                     @touchstart="clickdown($event, ball)"
                >{{ball.m}}</div>
                <div class="launch_line" :style="launch_line_style(ll_num)" v-for="ll_num in 3"></div>
            </div>
            P: {{impulse}}
        </div>
        <div class="col-12 col-lg-6">
            <table>
                <tr><td>tickrate:</td><td><input type="range" v-model="tickrate" min="1" max="100" /></td><td>{{tickrate}}</td></tr>
                <tr><td>gravity:</td><td><input type="range" v-model="gravity" min="0" max="50" /></td><td>{{gravity}}</td></tr>
                <tr><td>volume density:</td><td><input type="range" v-model="density" min="0" max="15" /></td><td>{{density}}</td></tr>
                <tr><td>bounce force:</td><td><input type="range" v-model="bounce_force" min="0" max="11" /></td><td>{{bounce_force}}</td></tr>
                <tr><td>canvas width:</td><td><input type="range" v-model="canvas.w" :min="50 * 2" max="500" /></td><td>{{canvas.w}}</td></tr>
                <tr><td>canvas height:</td><td><input type="range" v-model="canvas.h" :min="50 * 2" max="500" /></td><td>{{canvas.h}}</td></tr>
            </table>
            <hr />
            <table v-for="ball in balls">
                <tr><td>color:</td><td><input type="color" v-model="ball.color"/></td><td :style="{backgroundColor: ball.color}"></td></tr>
                <tr><td>mass:</td><td><input type="range" v-model="ball.m" min="1" max="100" /></td><td>{{ball.m}}</td></tr>
                <tr><td>bounce force:</td><td><input type="range" v-model="ball.bounce_force" min="0" max="11" /></td><td>{{ball.bounce_force}}</td></tr>
            </table>
            <button @click="add_ball">ADD MORE FUN</button>
        </div>
    </div>
</template>

<script>
    let app;
    class Ball {
        constructor() {
            this.x = 100;
            this.y = 100;
            this.w = 50;
            this.h = 50;
            this.m = Math.round(Math.random() * 99) + 1;
            this.sx = 0;
            this.sy = 0;
            this.color = '#000';
            this.id = Math.round(Math.random() * 10000000);
            this.bounce_force = app.bounce_force;
            this.distance = {};
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
            this.sy += app.gravity / app.tickrate;
        }
        bounce_canvas() {
            let r = this.get_radius();
            let bounce_koef = this.bounce_force / 10;
            if (this.y - r <= 0 && this.sy < 0 ||
                this.y + r >= app.canvas.h && this.sy > 0) {
                this.sy *= -bounce_koef;
            }
            if (this.x - r <= 0 && this.sx < 0 ||
                this.x + r >= app.canvas.w && this.sx > 0) {
                this.sx *= -bounce_koef;
            }
        }
        bounce_balls() {
            if (!this.sx && !this.sy) return;
            for (let b of app.balls) {
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

                    this.applyP(b.getP() * bounce_koef, x2y, xIncr, yIncr);
                    b.applyP(this.getP() * bounce_koef, x2y, !xIncr, !yIncr);
                }
            }
        }
        getP() {
            return ((this.sx ** 2 + this.sy ** 2) ** .5) * this.m;
        }
        applyP(p, x2y, xIncr, yIncr) {
            if (p === 0) {
                this.sx = 0;
                this.sy = 0;
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
            let density_koef = Math.min(1, (100 - app.density) / 100);
            this.sy *= density_koef;
            this.sx *= density_koef;
        }
        apply_speed() {
            let r = this.get_radius();
            this.sy = app.round(this.sy, 5);
            this.sx = app.round(this.sx, 5);
            this.y = app.round(Math.min(app.canvas.h - r, Math.max(r, this.sy + this.y)), 3);
            this.x = app.round(Math.min(app.canvas.w - r, Math.max(r, this.sx + this.x)), 3);
        }
    }
    export default {
        name: "main",
        data: function () {
            return {
                drag: {
                    on: false,
                    startPosX: 0,
                    startPosY: 0,
                    startTime: 0,
                    x: 0,
                    y: 0,
                },
                balls: [],
                selected: null,
                canvas: {
                    w: 500,
                    h: 500
                },
                tickrate: 60,
                gravity: 0,
                density: 0,
                bounce_force: 10,
                launch_line_ball_diameter: 10,
                log: [],
            };
        },
        methods: {
            tick() {
                if (!this.drag.on) {
                    for (let ball of this.balls) {
                        ball.tick();
                    }
                }
                setTimeout(this.tick, 1000 / this.tickrate);
            },
            clickdown(ev, b) {
                if (!this.drag.on) {
                    this.selected = b;
                    b.sx = 0;
                    b.sy = 0;
                    this.drag.on = true;
                    let coords = this.getPointerCoordinates(ev, this.$refs.canvas);
                    this.drag.startPosX = coords.x;
                    this.drag.startPosY = coords.y;
                    this.drag.x = coords.x;
                    this.drag.y = coords.y;
                    b.x = coords.x;
                    b.y = coords.y;
                    ev.preventDefault();
                }
            },
            clickup(ev) {
                if (this.drag.on) {
                    this.drag.on = false;
                    this.selected.sx = Math.floor(this.drag.x - this.drag.startPosX) / 20;
                    this.selected.sy = Math.floor(this.drag.y - this.drag.startPosY) / 20;
                    this.selected = null;
                    ev.preventDefault();
                }
            },
            dragMove(ev) {
                if (this.drag.on) {
                    let coords = this.getPointerCoordinates(ev, this.$refs.canvas);
                    this.drag.x = coords.x;
                    this.drag.y = coords.y;
                    ev.preventDefault();// disable page scroll on touch drag
                }
            },
            getPointerCoordinates(ev, element) {
                let rect = element.getBoundingClientRect();
                let x, y;
                if (ev.type.substring(0, 5) === 'touch') {
                    x = ev.touches[0].clientX;
                    y = ev.touches[0].clientY;
                } else {
                    x = ev.clientX;
                    y = ev.clientY;
                }
                return {
                    x: Math.round(x - rect.left),
                    y: Math.round(y - rect.top),
                }
            },
            launch_line_style(num) {
                let x, y;
                if (num === 1) {
                    x = this.drag.startPosX;
                    y = this.drag.startPosY;
                } else if (num === 2) {
                    x = this.drag.startPosX + (this.drag.x - this.drag.startPosX) / 2;
                    y = this.drag.startPosY + (this.drag.y - this.drag.startPosY) / 2;
                } else {
                    x = this.drag.x;
                    y = this.drag.y;
                }
                return {
                    display: this.drag.on ? 'block' : 'none',
                    top: (y - this.launch_line_ball_diameter / 2) + 'px',
                    left: (x - this.launch_line_ball_diameter / 2) + 'px',
                    width: this.launch_line_ball_diameter + 'px',
                    height: this.launch_line_ball_diameter + 'px',
                }
            },
            ball_style(b) {
                return {
                    top: (b.y - b.h / 2) + 'px',
                    left: (b.x - b.w / 2) + 'px',
                    width: b.w + 'px',
                    height: b.h + 'px',
                    backgroundColor: b.color,
                }
            },
            round(v, n) {
                n = n || 0;
                let k = 10 ** n;
                return Math.round(v * k) / k;
            },
            add_ball() {
                let b = new Ball();
                b.x = Math.round((Math.random() * this.canvas.w) / 2 + this.canvas.w / 4);
                b.y = Math.round((Math.random() * this.canvas.h) / 2 + this.canvas.h / 4);
                this.balls.push(b);
            },
            testCollision() {
                this.gravity = 0;
                this.density = 0;
                this.bounce_force = 10;
                let b1 = new Ball();
                let b2 = new Ball();
                let cx = this.canvas.w / 2;
                let cy = this.canvas.h / 2;
                b1.x = cx;
                b1.y = cy;
                b1.color = 'red';
                b2.x = cx + 100;
                b2.y = cy + 10;
                b2.sx = -5;
                b2.color = 'green';
                this.balls.push(b1);
                this.balls.push(b2);
            },
            initObjects() {
                let colors = [
                    'red',
                    'green',
                    'blue',
                    'yellow',
                    'cyan',
                    'pink',
                ];
                for (let i in colors) {
                    let b = new Ball();
                    b.x = Math.round((Math.random() * this.canvas.w) / 2 + this.canvas.w / 4);
                    b.y = Math.round((Math.random() * this.canvas.h) / 2 + this.canvas.h / 4);
                    b.sx = Math.round((Math.random() * 10)) - 5;
                    b.color = colors[i];
                    this.balls.push(b);
                }
            }
        },
        computed: {
            canvas_style() {
                return {
                    width: this.canvas.w + 'px',
                    height: this.canvas.h + 'px',
                }
            },
            impulse() {
                let sum = 0;
                for (let b of this.balls) {
                    sum += b.getP();
                }
                return sum;
            },
        },
        mounted() {
            app = this;
            this.canvas.w = Math.min(this.canvas.w, window.innerWidth - 20);
            let _this = this;
            window.addEventListener('resize', () => {
                _this.canvas.w = Math.min(_this.canvas.w, window.innerWidth - 20);
            });
            //this.testCollision();
            this.initObjects();
            this.tick();
        },
    }
</script>

<style scoped lang="scss">
    @import '~bootstrap/scss/bootstrap.scss';
    .canvas {
        position: relative;
        background-color: aliceblue;
    }

    .ball {
        border-radius: 50%;
        position: absolute;
        cursor: grab;
        display: flex;
        align-items: center;
        justify-content: center;
    }

    .launch_line {
        position: absolute;
        border-radius: 50%;
        z-index: 10;
        background-color: blue;
        cursor: crosshair;
    }
</style>