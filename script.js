const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width = window.innerWidth;
let height = window.innerHeight;
let time = 0;

canvas.width = width;
canvas.height = height;

window.addEventListener('resize', () => {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
});

// 颜色定义
const colors = {
    bg: '#0a0e27',
    cyan: '#00f2ff',
    purple: '#7000ff',
    pink: '#ff00c8',
    white: '#ffffff'
};

// 粒子数组
let particles = [];

class Particle {
    constructor() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.size = Math.random() * 2 + 1;
        this.speedX = (Math.random() - 0.5) * 2;
        this.speedY = (Math.random() - 0.5) * 2;
        const colorChoices = [colors.cyan, colors.purple, colors.pink];
        this.color = colorChoices[Math.floor(Math.random() * colorChoices.length)];
    }

    update() {
        this.x += this.speedX;
        this.y += this.speedY;

        if (this.x < 0) this.x = width;
        if (this.x > width) this.x = 0;
        if (this.y < 0) this.y = height;
        if (this.y > height) this.y = 0;
    }

    draw() {
        ctx.fillStyle = this.color;
        ctx.globalAlpha = 0.7;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.globalAlpha = 1;
    }
}

// 初始化粒子
for (let i = 0; i < 100; i++) {
    particles.push(new Particle());
}

// 绘制网格背景
function drawGrid() {
    const gridSize = 40;
    ctx.strokeStyle = colors.purple + '20';
    ctx.lineWidth = 1;

    // 竖线
    for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }

    // 横线
    for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// 绘制扫描线（CRT效果）
function drawScanlines() {
    ctx.strokeStyle = colors.cyan + '10';
    ctx.lineWidth = 1;

    for (let y = 0; y < height; y += 4) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }
}

// 绘制脉冲光圈
function drawPulses() {
    const pulseCount = 3;
    
    for (let i = 0; i < pulseCount; i++) {
        const angle = (time * 0.5 + (i / pulseCount) * Math.PI * 2);
        const x = width / 2 + Math.cos(angle) * 150;
        const y = height / 2 + Math.sin(angle) * 150;
        const radius = 30 + Math.sin(time * 3 + i) * 10;
        
        const colorChoices = [colors.cyan, colors.purple, colors.pink];
        const color = colorChoices[i % colorChoices.length];
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, color + '80');
        gradient.addColorStop(1, color + '00');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }
}

// 绘制动态线条
function drawLines() {
    ctx.strokeStyle = colors.cyan;
    ctx.lineWidth = 2;
    ctx.globalAlpha = 0.3;

    for (let i = 0; i < 5; i++) {
        const y = (time * 50 + i * height / 5) % height;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    ctx.globalAlpha = 1;
}

// 绘制四角标记
function drawCorners() {
    const cornerSize = 40;
    const lineWidth = 3;
    
    ctx.strokeStyle = colors.cyan;
    ctx.lineWidth = lineWidth;
    ctx.globalAlpha = 0.6;

    // 左上角
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(10 + cornerSize, 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(10, 10);
    ctx.lineTo(10, 10 + cornerSize);
    ctx.stroke();

    // 右上角
    ctx.beginPath();
    ctx.moveTo(width - 10, 10);
    ctx.lineTo(width - 10 - cornerSize, 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 10, 10);
    ctx.lineTo(width - 10, 10 + cornerSize);
    ctx.stroke();

    // 左下角
    ctx.beginPath();
    ctx.moveTo(10, height - 10);
    ctx.lineTo(10 + cornerSize, height - 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(10, height - 10);
    ctx.lineTo(10, height - 10 - cornerSize);
    ctx.stroke();

    // 右下角
    ctx.beginPath();
    ctx.moveTo(width - 10, height - 10);
    ctx.lineTo(width - 10 - cornerSize, height - 10);
    ctx.stroke();
    
    ctx.beginPath();
    ctx.moveTo(width - 10, height - 10);
    ctx.lineTo(width - 10, height - 10 - cornerSize);
    ctx.stroke();

    ctx.globalAlpha = 1;
}

// 动画循环
function animate() {
    time += 0.016; // 约60fps

    // 背景
    ctx.fillStyle = colors.bg;
    ctx.fillRect(0, 0, width, height);

    // 绘制网格
    drawGrid();

    // 绘制脉冲
    drawPulses();

    // 绘制粒子
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // 绘制动态线条
    drawLines();

    // 绘制四角标记
    drawCorners();

    // 绘制扫描线
    drawScanlines();

    requestAnimationFrame(animate);
}

animate();

console.log('✓ Web4游戏背景已加载！');
console.log('✓ Canvas尺寸:', width, 'x', height);
console.log('✓ 粒子数:', particles.length);
