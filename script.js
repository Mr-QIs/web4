const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];

function init() {
    resize();
    createParticles();
    animate();
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);

class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * width; // Using z for depth effect
        this.vx = (Math.random() - 0.5) * 0.5;
        this.vy = (Math.random() - 0.5) * 0.5;
        this.vz = -Math.random() * 2;
        this.color = Math.random() > 0.5 ? '#00f2ff' : '#7000ff';
        this.size = Math.random() * 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        if (this.z < 1) {
            this.reset();
            this.z = width;
        }
    }

    draw() {
        // Simple 3D projection
        const scale = 400 / (400 + this.z);
        const x2d = (this.x - width / 2) * scale + width / 2;
        const y2d = (this.y - height / 2) * scale + height / 2;
        const size = this.size * scale;

        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.globalAlpha = scale;
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

function createParticles() {
    particles = [];
    const count = Math.floor((width * height) / 10000) + 100;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function drawGrid() {
    const time = Date.now() * 0.001;
    ctx.strokeStyle = 'rgba(112, 0, 255, 0.1)';
    ctx.lineWidth = 1;

    const gridSize = 100;
    const scrollSpeed = (time * 50) % gridSize;

    // Horizontal lines
    for (let y = scrollSpeed; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Vertical lines
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

function animate() {
    ctx.fillStyle = '#050505';
    ctx.fillRect(0, 0, width, height);

    drawGrid();

    particles.forEach(p => {
        p.update();
        p.draw();
    });

    requestAnimationFrame(animate);
}

init();
