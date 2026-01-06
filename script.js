// ============================================
// 高性能赛博朋克3D背景效果
// 目标：60fps，完全显示所有效果
// ============================================

const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d', { alpha: false });

let width, height;
let time = 0;

// 赛博朋克色系
const COLORS = {
    cyan: '#00f2ff',
    purple: '#7000ff',
    pink: '#ff00c8',
    bg: '#0a0e27'
};

// 全局对象数组
let cubes = [];
let orbs = [];
let particles = [];
let lightBeams = [];

// ============================================
// 简化的3D投影函数
// ============================================
function project3D(x, y, z, rotX, rotY, rotZ, offsetX, offsetY, offsetZ) {
    // 应用旋转
    let x1 = x, y1 = y, z1 = z;
    
    // 绕X轴旋转
    if (rotX !== 0) {
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y1 * cosX - z1 * sinX;
        const z2 = y1 * sinX + z1 * cosX;
        y1 = y2;
        z1 = z2;
    }
    
    // 绕Y轴旋转
    if (rotY !== 0) {
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x2 = x1 * cosY + z1 * sinY;
        const z2 = -x1 * sinY + z1 * cosY;
        x1 = x2;
        z1 = z2;
    }
    
    // 绕Z轴旋转
    if (rotZ !== 0) {
        const cosZ = Math.cos(rotZ);
        const sinZ = Math.sin(rotZ);
        const x2 = x1 * cosZ - y1 * sinZ;
        const y2 = x1 * sinZ + y1 * cosZ;
        x1 = x2;
        y1 = y2;
    }
    
    // 应用偏移
    x1 += offsetX;
    y1 += offsetY;
    z1 += offsetZ;
    
    // 透视投影
    const perspective = 800;
    const scale = perspective / (perspective + z1);
    
    return {
        x: (x1 * scale) + width / 2,
        y: (y1 * scale) + height / 2,
        z: z1,
        scale: scale
    };
}

// ============================================
// 简化的3D立方体类
// ============================================
class SimpleCube {
    constructor(x, y, z, size, color, rotSpeed) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.size = size;
        this.color = color;
        this.rotX = 0;
        this.rotY = 0;
        this.rotZ = 0;
        this.rotSpeedX = rotSpeed.x;
        this.rotSpeedY = rotSpeed.y;
        this.rotSpeedZ = rotSpeed.z;
        
        // 立方体的8个顶点（相对坐标）
        this.vertices = [
            { x: -1, y: -1, z: -1 },
            { x:  1, y: -1, z: -1 },
            { x:  1, y:  1, z: -1 },
            { x: -1, y:  1, z: -1 },
            { x: -1, y: -1, z:  1 },
            { x:  1, y: -1, z:  1 },
            { x:  1, y:  1, z:  1 },
            { x: -1, y:  1, z:  1 }
        ];
        
        // 立方体的12条边
        this.edges = [
            [0, 1], [1, 2], [2, 3], [3, 0], // 后面
            [4, 5], [5, 6], [6, 7], [7, 4], // 前面
            [0, 4], [1, 5], [2, 6], [3, 7]  // 连接边
        ];
    }
    
    update() {
        this.rotX += this.rotSpeedX;
        this.rotY += this.rotSpeedY;
        this.rotZ += this.rotSpeedZ;
    }
    
    draw() {
        const projectedVertices = [];
        
        // 投影所有顶点
        for (let i = 0; i < this.vertices.length; i++) {
            const v = this.vertices[i];
            const projected = project3D(
                v.x * this.size,
                v.y * this.size,
                v.z * this.size,
                this.rotX,
                this.rotY,
                this.rotZ,
                this.x,
                this.y,
                this.z
            );
            projectedVertices.push(projected);
        }
        
        // 计算透明度
        const avgScale = projectedVertices.reduce((sum, v) => sum + v.scale, 0) / projectedVertices.length;
        const alpha = Math.min(0.8, Math.max(0.3, avgScale));
        
        // 绘制边框
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2;
        ctx.globalAlpha = alpha;
        
        ctx.beginPath();
        for (let i = 0; i < this.edges.length; i++) {
            const edge = this.edges[i];
            const v1 = projectedVertices[edge[0]];
            const v2 = projectedVertices[edge[1]];
            
            ctx.moveTo(v1.x, v1.y);
            ctx.lineTo(v2.x, v2.y);
        }
        ctx.stroke();
        
        // 绘制顶点高光
        for (let i = 0; i < projectedVertices.length; i++) {
            const v = projectedVertices[i];
            const size = 4 * v.scale;
            
            // 创建径向渐变
            const gradient = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, size * 2);
            gradient.addColorStop(0, '#ffffff');
            gradient.addColorStop(0.3, this.color);
            gradient.addColorStop(1, 'transparent');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(v.x, v.y, size * 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        ctx.globalAlpha = 1;
    }
}

// ============================================
// 发光球体类
// ============================================
class SimpleOrb {
    constructor(x, y, z, radius, color) {
        this.baseX = x;
        this.baseY = y;
        this.z = z;
        this.radius = radius;
        this.color = color;
        this.angle = Math.random() * Math.PI * 2;
        this.orbitRadius = 100 + Math.random() * 100;
        this.orbitSpeed = 0.0005 + Math.random() * 0.001;
        this.pulseSpeed = 0.002 + Math.random() * 0.002;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }
    
    update() {
        this.angle += this.orbitSpeed;
    }
    
    draw() {
        // 计算当前位置（公转）
        const x = this.baseX + Math.cos(this.angle) * this.orbitRadius;
        const y = this.baseY + Math.sin(this.angle) * this.orbitRadius;
        
        // 透视投影
        const perspective = 800;
        const scale = perspective / (perspective + this.z);
        const x2d = x * scale + width / 2;
        const y2d = y * scale + height / 2;
        
        // 脉冲效果
        const pulse = 1 + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.3;
        const displayRadius = this.radius * scale * pulse;
        
        const alpha = Math.min(0.9, Math.max(0.4, scale));
        ctx.globalAlpha = alpha;
        
        // 外层光晕（大）
        const gradient1 = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, displayRadius * 3);
        gradient1.addColorStop(0, this.color + '40');
        gradient1.addColorStop(0.5, this.color + '20');
        gradient1.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient1;
        ctx.beginPath();
        ctx.arc(x2d, y2d, displayRadius * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 中层光晕
        const gradient2 = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, displayRadius * 2);
        gradient2.addColorStop(0, this.color + '80');
        gradient2.addColorStop(0.5, this.color + '40');
        gradient2.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient2;
        ctx.beginPath();
        ctx.arc(x2d, y2d, displayRadius * 2, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心球体（3D效果）
        const gradient3 = ctx.createRadialGradient(
            x2d - displayRadius * 0.3, 
            y2d - displayRadius * 0.3, 
            0, 
            x2d, 
            y2d, 
            displayRadius
        );
        gradient3.addColorStop(0, '#ffffff');
        gradient3.addColorStop(0.3, this.color);
        gradient3.addColorStop(1, this.color + '80');
        
        ctx.fillStyle = gradient3;
        ctx.beginPath();
        ctx.arc(x2d, y2d, displayRadius, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// ============================================
// 粒子类（超级简化，流动效果）
// ============================================
class SimpleParticle {
    constructor() {
        this.reset();
    }
    
    reset() {
        // 从远处向近处移动
        this.x = (Math.random() - 0.5) * width * 2;
        this.y = (Math.random() - 0.5) * height * 2;
        this.z = Math.random() * 1500 + 500; // 远处开始
        this.speed = 2 + Math.random() * 3;
        this.size = Math.random() * 2 + 1;
        
        const colorChoice = Math.random();
        if (colorChoice < 0.33) {
            this.color = COLORS.cyan;
        } else if (colorChoice < 0.66) {
            this.color = COLORS.purple;
        } else {
            this.color = COLORS.pink;
        }
    }
    
    update() {
        this.z -= this.speed;
        
        // 如果到达近处，重置到远处
        if (this.z < 10) {
            this.reset();
        }
    }
    
    draw() {
        const perspective = 800;
        const scale = perspective / (perspective + this.z);
        const x2d = this.x * scale + width / 2;
        const y2d = this.y * scale + height / 2;
        const displaySize = this.size * scale;
        
        // 检查是否在屏幕范围内
        if (x2d < -50 || x2d > width + 50 || y2d < -50 || y2d > height + 50) {
            return;
        }
        
        const alpha = Math.min(0.8, Math.max(0.2, scale));
        ctx.globalAlpha = alpha;
        
        // 绘制简单的光点和尾迹
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, displaySize * 3);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '80');
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x2d, y2d, displaySize * 3, 0, Math.PI * 2);
        ctx.fill();
        
        // 核心点
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(x2d, y2d, displaySize * 0.5, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// ============================================
// 光线类
// ============================================
class LightBeam {
    constructor(x, color) {
        this.x = x;
        this.color = color;
        this.pulseSpeed = 0.001 + Math.random() * 0.001;
        this.pulseOffset = Math.random() * Math.PI * 2;
    }
    
    draw() {
        const alpha = 0.1 + Math.sin(time * this.pulseSpeed + this.pulseOffset) * 0.05;
        
        // 创建竖向渐变
        const gradient = ctx.createLinearGradient(this.x, 0, this.x, height);
        gradient.addColorStop(0, this.color + '00');
        gradient.addColorStop(0.3, this.color + Math.floor(alpha * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.7, this.color + Math.floor(alpha * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, this.color + '00');
        
        ctx.fillStyle = gradient;
        ctx.fillRect(this.x - 40, 0, 80, height);
    }
}

// ============================================
// 初始化函数
// ============================================
function init() {
    console.log('初始化赛博朋克3D背景...');
    
    // 设置canvas尺寸
    resize();
    
    // 创建3个立方体
    cubes = [
        new SimpleCube(-200, -100, 400, 60, COLORS.cyan, { x: 0.002, y: 0.003, z: 0.001 }),
        new SimpleCube(200, 50, 600, 80, COLORS.purple, { x: 0.001, y: 0.002, z: 0.003 }),
        new SimpleCube(0, -150, 800, 50, COLORS.pink, { x: 0.003, y: 0.001, z: 0.002 })
    ];
    
    // 创建3个球体
    orbs = [
        new SimpleOrb(-150, -50, 500, 30, COLORS.cyan),
        new SimpleOrb(150, 100, 700, 40, COLORS.purple),
        new SimpleOrb(0, -100, 900, 25, COLORS.pink)
    ];
    
    // 创建250个粒子
    particles = [];
    for (let i = 0; i < 250; i++) {
        particles.push(new SimpleParticle());
    }
    
    // 创建3条光束
    lightBeams = [
        new LightBeam(width * 0.2, COLORS.cyan),
        new LightBeam(width * 0.5, COLORS.purple),
        new LightBeam(width * 0.8, COLORS.pink)
    ];
    
    console.log('初始化完成！立方体:', cubes.length, '球体:', orbs.length, '粒子:', particles.length);
    
    // 开始动画循环
    animate();
}

// ============================================
// 窗口大小调整
// ============================================
function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    
    // 重新定位光束
    if (lightBeams.length > 0) {
        lightBeams[0].x = width * 0.2;
        lightBeams[1].x = width * 0.5;
        lightBeams[2].x = width * 0.8;
    }
}

window.addEventListener('resize', resize);

// ============================================
// 绘制背景网格（可选）
// ============================================
function drawGrid() {
    ctx.strokeStyle = COLORS.cyan + '10';
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.3;
    
    const gridSize = 50;
    
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
    
    ctx.globalAlpha = 1;
}

// ============================================
// 绘制暗角效果
// ============================================
function drawVignette() {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, 0,
        width / 2, height / 2, Math.max(width, height) * 0.7
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(0.7, 'transparent');
    gradient.addColorStop(1, COLORS.bg);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

// ============================================
// 主动画循环
// ============================================
function animate() {
    time++;
    
    // 1. 清除canvas，填充背景色
    ctx.fillStyle = COLORS.bg;
    ctx.fillRect(0, 0, width, height);
    
    // 2. 绘制背景网格（可选，低透明度）
    // drawGrid(); // 可以取消注释来显示网格
    
    // 3. 绘制光线/光晕（先绘制，作为背景层）
    for (let i = 0; i < lightBeams.length; i++) {
        lightBeams[i].draw();
    }
    
    // 4. 绘制粒子
    for (let i = 0; i < particles.length; i++) {
        particles[i].update();
        particles[i].draw();
    }
    
    // 5. 绘制球体
    for (let i = 0; i < orbs.length; i++) {
        orbs[i].update();
        orbs[i].draw();
    }
    
    // 6. 绘制立方体
    for (let i = 0; i < cubes.length; i++) {
        cubes[i].update();
        cubes[i].draw();
    }
    
    // 7. 绘制暗角（四周渐黑）
    drawVignette();
    
    // 继续下一帧
    requestAnimationFrame(animate);
}

// ============================================
// 页面加载完成后初始化
// ============================================
window.addEventListener('DOMContentLoaded', init);
