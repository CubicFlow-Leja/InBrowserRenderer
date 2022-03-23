function rgb(r, g, b) {
    r = Math.floor(r);
    g = Math.floor(g);
    b = Math.floor(b);
    return ["rgb(", r, ",", g, ",", b, ")"].join("");
}

class particle {
    setdefault() {
        this.x = XStart + (Math.random() * 2 - 1) * 5;
        this.y = Ystart + (Math.random() * 2 - 1) * 5;
        this.vx = (Math.random() * 2 - 1) * 15;
        this.vy = (Math.random() * 2 - 1) * 15;
        this.maxlife = 6;
        this.CurrentLifetime = this.maxlife;
        this.collisionfactor = 0.45;
    }
    constructor() {
        this.setdefault();
    }
    DrawParticle() {
        let rad = 0;
        if (this.CurrentLifetime > this.maxlife / 2) {
            rad = radius * (1 - this.CurrentLifetime / this.maxlife);
        }
        else {
            rad = radius * this.CurrentLifetime / this.maxlife;
        }
        context.beginPath();
        context.arc(this.x, this.y, rad, 0, 2 * Math.PI, true);
        context.fillStyle = rgb((1 - this.CurrentLifetime / this.maxlife) * 255, 155 * (1 - this.CurrentLifetime / this.maxlife), 55 * (1 - this.CurrentLifetime / this.maxlife));
        context.fill();
    }

    MoveParticle(DeltaTime) {
        this.x += this.vx * DeltaTime;
        this.y -= this.vy * DeltaTime;
        this.vy -= 12.5 * DeltaTime;
        this.CurrentLifetime -= DeltaTime * 0.5;
        if (this.CurrentLifetime <= 0) {
            this.setdefault();
        }
        if ((this.x <= 0 && this.vx < 0) || (this.x >= canvas.width && this.vx > 0)) {
            this.vx = -this.vx * this.collisionfactor;
            this.CurrentLifetime *= this.collisionfactor;
        }
        if ((this.y <= 0 && this.vy > 0) || (this.y >= canvas.height && this.vy < 0)) {
            this.vy = -this.vy * this.collisionfactor;
            this.CurrentLifetime *= this.collisionfactor;
        }
    }
}

function createCanvas(Xres, Yres) {
    canvas = document.createElement('canvas');
    canvas.id = "CursorLayer";
    canvas.width = Xres;
    canvas.height = Yres;
    canvas.style.zIndex = 8;
    canvas.style.position = "absolute";
    canvas.style.border = "1px solid";
    canvas.style.backgroundColor = 'black';
    document.body.appendChild(canvas);
    context = canvas.getContext('2d');
    centerX = canvas.width / 2;
    centerY = canvas.height / 2;
}

function setup() {
    createCanvas(1000, 700);
    for (let i = 0; i < 1; i++) {
        let part = new particle();
        particles.push(part);
    }
    for (let i = 0; i < particles.length; i++) {
        particles[i].DrawParticle();
    }
}

function DrawParticles() {
    context.clearRect(0, 0, canvas.width, canvas.height);
    if (particles.length < 1000) {
        for (let a = 0; a < Emission; a++) {
            let p = new particle();
            particles.push(p);
        }
    }
    for (let i = 0; i < particles.length; i++) {
        particles[i].MoveParticle(0.02);
        particles[i].DrawParticle();
    }
    setTimeout(DrawParticles, 0.02);
}

let particles = [];
let canvas;
let context;
let centerX;
let centerY;
const radius = 25;
const Emission = 2;
let XStart = 400;
let Ystart = 400;

setup();

let once = false;
document.onpointerdown = (event) => {
    if (!once)
        once = true;
    else
        return;
    DrawParticles();
    console.log("triggered");
}

let offset = 0;
function handleMouseMove(event) {
    XStart = event.pageX;
    Ystart = event.pageY + offset;
}

document.onmousemove = handleMouseMove;