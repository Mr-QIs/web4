const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let geometricShapes = [];
let lightBeams = [];
let time = 0;

// Color palette
const colors = {
    primary: '#00f2ff',
    secondary: '#7000ff',
    accent: '#ff00c8',
    bg: '#050505'
};

function init() {
    resize();
    createParticles();
    createGeometricShapes();
    createLightBeams();
    animate();
}

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
    recreateElements();
}

window.addEventListener('resize', resize);

function recreateElements() {
    createParticles();
    createGeometricShapes();
    createLightBeams();
}

// Particle class with enhanced effects
class Particle {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2000;
        this.vx = (Math.random() - 0.5) * 0.3;
        this.vy = (Math.random() - 0.5) * 0.3;
        this.vz = -Math.random() * 3 - 1;
        this.size = Math.random() * 3 + 1;
        this.color = Math.random() > 0.6 ? colors.primary : 
                      Math.random() > 0.3 ? colors.secondary : colors.accent;
        this.alpha = Math.random() * 0.5 + 0.3;
        this.trail = [];
    }

    update() {
        // Store trail
        this.trail.push({ x: this.x, y: this.y, z: this.z });
        if (this.trail.length > 5) this.trail.shift();

        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        if (this.z < 10 || this.x < -100 || this.x > width + 100 || 
            this.y < -100 || this.y > height + 100) {
            this.reset();
            this.z = 2000;
        }
    }

    draw() {
        const scale = 800 / (800 + this.z);
        const x2d = (this.x - width / 2) * scale + width / 2;
        const y2d = (this.y - height / 2) * scale + height / 2;
        const size = this.size * scale;

        // Draw trail
        if (this.trail.length > 1) {
            ctx.beginPath();
            for (let i = 0; i < this.trail.length; i++) {
                const t = this.trail[i];
                const tScale = 800 / (800 + t.z);
                const tx = (t.x - width / 2) * tScale + width / 2;
                const ty = (t.y - height / 2) * tScale + height / 2;
                if (i === 0) ctx.moveTo(tx, ty);
                else ctx.lineTo(tx, ty);
            }
            ctx.strokeStyle = this.color;
            ctx.globalAlpha = this.alpha * 0.3;
            ctx.lineWidth = size * 0.5;
            ctx.stroke();
        }

        // Draw particle with glow
        ctx.globalAlpha = this.alpha * scale;
        
        // Glow effect
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, size * 3);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.5, this.color + '40');
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(x2d, y2d, size * 3, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Core
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// 3D Geometric Shape class
class GeometricShape {
    constructor(type, x, y, z, size, rotationSpeed, color) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.z = z;
        this.baseY = y;
        this.size = size;
        this.rotationX = Math.random() * Math.PI * 2;
        this.rotationY = Math.random() * Math.PI * 2;
        this.rotationZ = Math.random() * Math.PI * 2;
        this.rotationSpeedX = rotationSpeed.x;
        this.rotationSpeedY = rotationSpeed.y;
        this.rotationSpeedZ = rotationSpeed.z;
        this.color = color;
        this.vertices = this.generateVertices();
        this.floatOffset = Math.random() * Math.PI * 2;
        this.floatSpeed = 0.5 + Math.random() * 0.5;
        this.floatAmount = 20 + Math.random() * 30;
    }

    generateVertices() {
        const v = [];
        const s = this.size;

        if (this.type === 'cube') {
            // Cube vertices
            for (let x = -1; x <= 1; x += 2) {
                for (let y = -1; y <= 1; y += 2) {
                    for (let z = -1; z <= 1; z += 2) {
                        v.push({ x: x * s, y: y * s, z: z * s });
                    }
                }
            }
        } else if (this.type === 'pyramid') {
            // Pyramid vertices
            v.push({ x: 0, y: -s, z: 0 }); // Top
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                v.push({ x: Math.cos(angle) * s, y: s, z: Math.sin(angle) * s });
            }
        } else if (this.type === 'octahedron') {
            // Octahedron vertices
            v.push({ x: 0, y: -s, z: 0 });
            v.push({ x: 0, y: s, z: 0 });
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                v.push({ x: Math.cos(angle) * s, y: 0, z: Math.sin(angle) * s });
            }
        } else if (this.type === 'diamond') {
            // Diamond/elongated octahedron
            v.push({ x: 0, y: -s * 1.5, z: 0 });
            v.push({ x: 0, y: s * 1.5, z: 0 });
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                v.push({ x: Math.cos(angle) * s * 0.7, y: 0, z: Math.sin(angle) * s * 0.7 });
            }
        }

        return v;
    }

    getEdges() {
        const edges = [];
        const v = this.vertices;

        if (this.type === 'cube') {
            const indices = [
                [0,1], [1,3], [3,2], [2,0], // Front face
                [4,5], [5,7], [7,6], [6,4], // Back face
                [0,4], [1,5], [2,6], [3,7]  // Connecting edges
            ];
            indices.forEach(i => edges.push([v[i[0]], v[i[1]]]));
        } else if (this.type === 'pyramid' || this.type === 'octahedron' || this.type === 'diamond') {
            // Connect top to all base vertices
            for (let i = 1; i < v.length; i++) {
                edges.push([v[0], v[i]]);
            }
            // Connect bottom to all base vertices
            for (let i = 1; i < v.length; i++) {
                edges.push([v[1], v[i]]);
            }
            // Connect base vertices
            for (let i = 1; i < v.length; i++) {
                const next = i === v.length - 1 ? 1 : i + 1;
                edges.push([v[i], v[next]]);
            }
        }

        return edges;
    }

    update() {
        this.rotationX += this.rotationSpeedX;
        this.rotationY += this.rotationSpeedY;
        this.rotationZ += this.rotationSpeedZ;

        // Floating animation
        this.y = this.baseY + Math.sin(time * this.floatSpeed + this.floatOffset) * this.floatAmount;
    }

    rotatePoint(point) {
        let x = point.x, y = point.y, z = point.z;

        // Rotate around X
        let cos = Math.cos(this.rotationX), sin = Math.sin(this.rotationX);
        let tempY = y * cos - z * sin;
        let tempZ = y * sin + z * cos;
        y = tempY;
        z = tempZ;

        // Rotate around Y
        cos = Math.cos(this.rotationY);
        sin = Math.sin(this.rotationY);
        let tempX = x * cos + z * sin;
        tempZ = -x * sin + z * cos;
        x = tempX;
        z = tempZ;

        // Rotate around Z
        cos = Math.cos(this.rotationZ);
        sin = Math.sin(this.rotationZ);
        tempX = x * cos - y * sin;
        tempY = x * sin + y * cos;
        x = tempX;
        y = tempY;

        return { x, y, z };
    }

    project(point) {
        const scale = 1000 / (1000 + this.z);
        const rotated = this.rotatePoint(point);
        const x2d = (this.x - width / 2 + rotated.x) * scale + width / 2;
        const y2d = (this.y - height / 2 + rotated.y) * scale + height / 2;
        return { x: x2d, y: y2d, z: this.z + rotated.z };
    }

    draw() {
        const edges = this.getEdges();
        const projectedEdges = edges.map(edge => [
            this.project(edge[0]),
            this.project(edge[1])
        ]);

        const scale = 1000 / (1000 + this.z);
        const alpha = Math.max(0.1, Math.min(0.8, scale));

        // Draw edges with glow
        ctx.shadowBlur = 15;
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 2 * scale;
        ctx.globalAlpha = alpha;

        projectedEdges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge[0].x, edge[0].y);
            ctx.lineTo(edge[1].x, edge[1].y);
            ctx.stroke();
        });

        // Draw vertices
        const projectedVertices = this.vertices.map(v => this.project(v));
        projectedVertices.forEach(v => {
            const vertexScale = 1000 / (1000 + v.z);
            ctx.beginPath();
            ctx.arc(v.x, v.y, 3 * vertexScale, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
        });

        ctx.shadowBlur = 0;
        ctx.globalAlpha = 1;
    }
}

// Light Beam class
class LightBeam {
    constructor(x, direction, color) {
        this.x = x;
        this.direction = direction;
        this.color = color;
        this.speed = 0.002 + Math.random() * 0.002;
        this.offset = Math.random() * Math.PI * 2;
        this.width = 30 + Math.random() * 50;
    }

    draw() {
        const gradient = ctx.createLinearGradient(
            this.x, 0,
            this.x + this.direction * 200, height
        );
        
        const alpha = 0.1 + Math.sin(time * this.speed + this.offset) * 0.05;
        gradient.addColorStop(0, `${this.color}00`);
        gradient.addColorStop(0.3, `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(0.7, `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
        gradient.addColorStop(1, `${this.color}00`);

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.moveTo(this.x, 0);
        ctx.lineTo(this.x + this.direction * 100, height * 0.3);
        ctx.lineTo(this.x + this.direction * 200, height);
        ctx.lineTo(this.x + this.direction * 100, height * 0.3);
        ctx.closePath();
        ctx.fill();
    }
}

function createParticles() {
    particles = [];
    const count = Math.floor((width * height) / 8000) + 150;
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function createGeometricShapes() {
    geometricShapes = [];
    
    // Create various geometric shapes
    const shapeConfigs = [
        { type: 'cube', x: width * 0.15, y: height * 0.3, z: 300, size: 60, color: colors.primary },
        { type: 'pyramid', x: width * 0.85, y: height * 0.4, z: 400, size: 70, color: colors.secondary },
        { type: 'octahedron', x: width * 0.75, y: height * 0.25, z: 200, size: 50, color: colors.accent },
        { type: 'diamond', x: width * 0.2, y: height * 0.5, z: 500, size: 55, color: colors.primary },
        { type: 'cube', x: width * 0.6, y: height * 0.6, z: 350, size: 45, color: colors.secondary },
        { type: 'octahedron', x: width * 0.4, y: height * 0.35, z: 450, size: 65, color: colors.accent },
    ];

    shapeConfigs.forEach(config => {
        geometricShapes.push(new GeometricShape(
            config.type,
            config.x,
            config.y,
            config.z,
            config.size,
            {
                x: (Math.random() - 0.5) * 0.02,
                y: (Math.random() - 0.5) * 0.02,
                z: (Math.random() - 0.5) * 0.02
            },
            config.color
        ));
    });
}

function createLightBeams() {
    lightBeams = [];
    const beamCount = 5;
    for (let i = 0; i < beamCount; i++) {
        const x = (width / beamCount) * i + Math.random() * 100;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const color = Math.random() > 0.5 ? colors.primary : colors.secondary;
        lightBeams.push(new LightBeam(x, direction, color));
    }
}

function drawPerspectiveFloor() {
    const horizonY = height * 0.65;
    const gridLines = 20;
    const verticalLines = 30;
    
    // Draw perspective grid
    ctx.strokeStyle = `${colors.secondary}30`;
    ctx.lineWidth = 1;

    // Horizontal lines (perspective)
    for (let i = 0; i < gridLines; i++) {
        const progress = i / gridLines;
        const y = horizonY + Math.pow(progress, 2) * (height - horizonY);
        const alpha = 0.1 + progress * 0.2;
        
        ctx.strokeStyle = `${colors.secondary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Vertical lines (perspective - radiating from center)
    const centerX = width / 2;
    for (let i = -verticalLines / 2; i < verticalLines / 2; i++) {
        const angle = i * 0.05;
        const alpha = 0.05 + Math.abs(i) / (verticalLines / 2) * 0.15;
        
        ctx.strokeStyle = `${colors.primary}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.sin(angle) * 100, horizonY);
        ctx.lineTo(centerX + Math.sin(angle) * width * 0.8, height);
        ctx.stroke();
    }

    // Horizon glow
    const horizonGradient = ctx.createLinearGradient(0, horizonY - 100, 0, horizonY + 100);
    horizonGradient.addColorStop(0, 'transparent');
    horizonGradient.addColorStop(0.5, `${colors.primary}20`);
    horizonGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = horizonGradient;
    ctx.fillRect(0, horizonY - 100, width, 200);
}

function drawHexagonPattern() {
    const hexSize = 60;
    const hexHeight = hexSize * Math.sqrt(3);
    const cols = Math.ceil(width / hexSize) + 2;
    const rows = Math.ceil(height / hexHeight) + 2;

    for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
            const x = col * hexSize * 1.5;
            const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
            
            // Offset by time for movement
            const offsetX = (time * 20) % (hexSize * 1.5);
            const offsetY = (time * 10) % hexHeight;
            
            const finalX = x - offsetX;
            const finalY = y + offsetY;

            const distFromCenter = Math.sqrt(
                Math.pow(finalX - width / 2, 2) + 
                Math.pow(finalY - height / 2, 2)
            );
            
            const alpha = Math.max(0, 0.1 - distFromCenter / (width * 0.8)) * 
                         (0.5 + Math.sin(time * 2 + distFromCenter * 0.01) * 0.3);

            if (alpha > 0.01) {
                drawHexagon(finalX, finalY, hexSize, alpha);
            }
        }
    }
}

function drawHexagon(x, y, size, alpha) {
    ctx.strokeStyle = `${colors.accent}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 1;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 6;
        const px = x + Math.cos(angle) * size;
        const py = y + Math.sin(angle) * size;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
}

function drawGlowingOrbs() {
    const orbCount = 8;
    for (let i = 0; i < orbCount; i++) {
        const angle = (i / orbCount) * Math.PI * 2 + time * 0.3;
        const radiusX = width * 0.35;
        const radiusY = height * 0.25;
        
        const x = width / 2 + Math.cos(angle) * radiusX;
        const y = height / 2 + Math.sin(angle) * radiusY;
        
        const size = 100 + Math.sin(time * 2 + i) * 30;
        const color = i % 2 === 0 ? colors.primary : colors.secondary;
        
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, size);
        gradient.addColorStop(0, `${color}20`);
        gradient.addColorStop(0.5, `${color}10`);
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.fill();
    }
}

function drawVignette() {
    const gradient = ctx.createRadialGradient(
        width / 2, height / 2, height * 0.3,
        width / 2, height / 2, height * 0.8
    );
    gradient.addColorStop(0, 'transparent');
    gradient.addColorStop(1, `${colors.bg}cc`);
    
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
}

function animate() {
    time = Date.now() * 0.001;

    // Clear with semi-transparent black for trail effect
    ctx.fillStyle = `${colors.bg}f0`;
    ctx.fillRect(0, 0, width, height);

    // Draw background elements
    drawHexagonPattern();
    drawGlowingOrbs();
    drawLightBeams();
    drawPerspectiveFloor();

    // Draw geometric shapes (sorted by z for proper depth)
    geometricShapes.sort((a, b) => b.z - a.z);
    geometricShapes.forEach(shape => {
        shape.update();
        shape.draw();
    });

    // Draw particles
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // Apply vignette
    drawVignette();

    requestAnimationFrame(animate);
}

init();
