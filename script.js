const canvas = document.getElementById('bg-canvas');
const ctx = canvas.getContext('2d');

let width, height;
let particles = [];
let geometricShapes = [];
let lightBeams = [];
let starField = [];
let energyClouds = [];
let scanlineEffect;
let waveRipple;
let glowingOrbs = [];
let time = 0;

// Enhanced Color palette
const colors = {
    primary: '#00f2ff',
    secondary: '#7000ff',
    accent: '#ff00c8',
    bg: '#050505',
    gold: '#ffd700',
    green: '#00ff41',
    orange: '#ff6b35',
    purple: '#9d4edd',
    cyan: '#00ffff',
    pink: '#ff006e'
};

function init() {
    resize();
    createParticles();
    createGeometricShapes();
    createLightBeams();
    createStarField();
    createEnergyClouds();
    createScanlineEffect();
    createWaveRipple();
    createGlowingOrbs();
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
    createStarField();
    createEnergyClouds();
    createScanlineEffect();
    createWaveRipple();
    createGlowingOrbs();
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
        this.alpha = Math.random() * 0.7 + 0.4; // Increased alpha range for better visibility
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
        } else if (this.type === 'dodecahedron') {
            // Dodecahedron vertices (simplified version)
            const phi = (1 + Math.sqrt(5)) / 2;
            const coords = [
                [1, 1, 1], [1, 1, -1], [1, -1, 1], [1, -1, -1],
                [-1, 1, 1], [-1, 1, -1], [-1, -1, 1], [-1, -1, -1],
                [0, 1/phi, phi], [0, 1/phi, -phi], [0, -1/phi, phi], [0, -1/phi, -phi],
                [1/phi, phi, 0], [1/phi, -phi, 0], [-1/phi, phi, 0], [-1/phi, -phi, 0],
                [phi, 0, 1/phi], [phi, 0, -1/phi], [-phi, 0, 1/phi], [-phi, 0, -1/phi]
            ];
            coords.forEach(coord => {
                v.push({ x: coord[0] * s * 0.8, y: coord[1] * s * 0.8, z: coord[2] * s * 0.8 });
            });
        } else if (this.type === 'icosahedron') {
            // Icosahedron vertices
            const phi = (1 + Math.sqrt(5)) / 2;
            const coords = [
                [0, 1, phi], [0, -1, phi], [0, 1, -phi], [0, -1, -phi],
                [1, phi, 0], [-1, phi, 0], [1, -phi, 0], [-1, -phi, 0],
                [phi, 0, 1], [phi, 0, -1], [-phi, 0, 1], [-phi, 0, -1]
            ];
            coords.forEach(coord => {
                v.push({ x: coord[0] * s * 0.8, y: coord[1] * s * 0.8, z: coord[2] * s * 0.8 });
            });
        } else if (this.type === 'tetrahedron') {
            // Tetrahedron vertices
            v.push({ x: s, y: s, z: s });
            v.push({ x: -s, y: -s, z: s });
            v.push({ x: -s, y: s, z: -s });
            v.push({ x: s, y: -s, z: -s });
        } else if (this.type === 'hexagonal') {
            // Hexagonal prism
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                v.push({ x: Math.cos(angle) * s, y: s, z: Math.sin(angle) * s });
                v.push({ x: Math.cos(angle) * s, y: -s, z: Math.sin(angle) * s });
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
        } else if (this.type === 'dodecahedron') {
            // Dodecahedron edges (simplified - connect nearest vertices)
            for (let i = 0; i < v.length; i++) {
                for (let j = i + 1; j < v.length; j++) {
                    const dist = Math.sqrt(
                        Math.pow(v[i].x - v[j].x, 2) + 
                        Math.pow(v[i].y - v[j].y, 2) + 
                        Math.pow(v[i].z - v[j].z, 2)
                    );
                    if (dist < 2.5 * this.size) {
                        edges.push([v[i], v[j]]);
                    }
                }
            }
        } else if (this.type === 'icosahedron') {
            // Icosahedron edges
            for (let i = 0; i < v.length; i++) {
                for (let j = i + 1; j < v.length; j++) {
                    const dist = Math.sqrt(
                        Math.pow(v[i].x - v[j].x, 2) + 
                        Math.pow(v[i].y - v[j].y, 2) + 
                        Math.pow(v[i].z - v[j].z, 2)
                    );
                    if (dist < 2.8 * this.size) {
                        edges.push([v[i], v[j]]);
                    }
                }
            }
        } else if (this.type === 'tetrahedron') {
            // Tetrahedron edges
            edges.push([v[0], v[1]]);
            edges.push([v[0], v[2]]);
            edges.push([v[0], v[3]]);
            edges.push([v[1], v[2]]);
            edges.push([v[1], v[3]]);
            edges.push([v[2], v[3]]);
        } else if (this.type === 'hexagonal') {
            // Hexagonal prism edges
            for (let i = 0; i < 6; i++) {
                const next = (i + 1) % 6;
                // Top hexagon
                edges.push([v[i * 2], v[next * 2]]);
                // Bottom hexagon
                edges.push([v[i * 2 + 1], v[next * 2 + 1]]);
                // Vertical edges
                edges.push([v[i * 2], v[i * 2 + 1]]);
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

        // Draw edges with enhanced glow
        ctx.shadowBlur = 25; // Increased from 15
        ctx.shadowColor = this.color;
        ctx.strokeStyle = this.color;
        ctx.lineWidth = 3 * scale; // Increased from 2 * scale
        ctx.globalAlpha = Math.min(0.9, alpha * 1.5); // Increased alpha
        
        // Create glowing edges
        ctx.save();
        ctx.filter = 'brightness(1.5) contrast(1.2)';
        
        projectedEdges.forEach(edge => {
            ctx.beginPath();
            ctx.moveTo(edge[0].x, edge[0].y);
            ctx.lineTo(edge[1].x, edge[1].y);
            ctx.stroke();
        });
        
        ctx.restore();

        // Draw enhanced vertices with larger glow
        const projectedVertices = this.vertices.map(v => this.project(v));
        projectedVertices.forEach(v => {
            const vertexScale = 1000 / (1000 + v.z);
            const size = 4 * vertexScale; // Increased from 3
            
            // Vertex glow
            const gradient = ctx.createRadialGradient(v.x, v.y, 0, v.x, v.y, size * 2);
            gradient.addColorStop(0, this.color + 'ff');
            gradient.addColorStop(0.5, this.color + '80');
            gradient.addColorStop(1, 'transparent');
            
            ctx.beginPath();
            ctx.arc(v.x, v.y, size * 2, 0, Math.PI * 2);
            ctx.fillStyle = gradient;
            ctx.fill();
            
            // Core vertex
            ctx.beginPath();
            ctx.arc(v.x, v.y, size * 0.8, 0, Math.PI * 2);
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
        // Enhanced light beam with multiple layers
        const beamWidth = this.width * 1.5; // Increased width
        
        // Create multiple gradient layers for enhanced brightness
        const gradients = [
            { opacity: 0.3, width: beamWidth * 2 },
            { opacity: 0.2, width: beamWidth * 1.5 },
            { opacity: 0.15, width: beamWidth }
        ];
        
        const alpha = 0.2 + Math.sin(time * this.speed + this.offset) * 0.1; // Increased base alpha
        
        gradients.forEach((layer, index) => {
            const gradient = ctx.createLinearGradient(
                this.x, 0,
                this.x + this.direction * 250, height
            );
            
            const intensity = alpha * layer.opacity;
            gradient.addColorStop(0, `${this.color}00`);
            gradient.addColorStop(0.2, `${this.color}${Math.floor(intensity * 128).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(0.5, `${this.color}${Math.floor(intensity * 255).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(0.8, `${this.color}${Math.floor(intensity * 128).toString(16).padStart(2, '0')}`);
            gradient.addColorStop(1, `${this.color}00`);
            
            ctx.fillStyle = gradient;
            ctx.shadowColor = this.color;
            ctx.shadowBlur = 10 + index * 5; // Enhanced glow
            
            ctx.beginPath();
            ctx.moveTo(this.x, 0);
            ctx.lineTo(this.x + this.direction * (100 + index * 30), height * (0.25 + index * 0.05));
            ctx.lineTo(this.x + this.direction * (200 + index * 50), height);
            ctx.lineTo(this.x + this.direction * (100 + index * 30), height * (0.25 + index * 0.05));
            ctx.closePath();
            ctx.fill();
        });
        
        ctx.shadowBlur = 0; // Reset shadow
    }
}

// Star Field class
class Star {
    constructor() {
        this.reset();
    }

    reset() {
        this.x = Math.random() * width;
        this.y = Math.random() * height;
        this.z = Math.random() * 2000 + 500;
        this.vx = (Math.random() - 0.5) * 0.1;
        this.vy = (Math.random() - 0.5) * 0.1;
        this.vz = -Math.random() * 2 - 0.5;
        this.size = Math.random() * 2 + 0.5;
        this.color = Math.random() > 0.7 ? colors.cyan : 
                      Math.random() > 0.4 ? colors.primary : colors.gold;
        this.alpha = Math.random() * 0.8 + 0.2;
        this.twinkleSpeed = 0.02 + Math.random() * 0.03;
        this.twinkleOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.z += this.vz;

        if (this.z < 50 || this.x < -50 || this.x > width + 50 || 
            this.y < -50 || this.y > height + 50) {
            this.reset();
            this.z = 2500;
        }
    }

    draw() {
        const scale = 1000 / (1000 + this.z);
        const x2d = (this.x - width / 2) * scale + width / 2;
        const y2d = (this.y - height / 2) * scale + height / 2;
        const size = this.size * scale;

        // Twinkling effect
        const twinkle = Math.sin(time * this.twinkleSpeed + this.twinkleOffset) * 0.3 + 0.7;
        
        ctx.globalAlpha = this.alpha * twinkle * scale;
        
        // Star glow
        const gradient = ctx.createRadialGradient(x2d, y2d, 0, x2d, y2d, size * 2);
        gradient.addColorStop(0, this.color);
        gradient.addColorStop(0.3, this.color + 'aa');
        gradient.addColorStop(1, 'transparent');
        
        ctx.beginPath();
        ctx.arc(x2d, y2d, size * 2, 0, Math.PI * 2);
        ctx.fillStyle = gradient;
        ctx.fill();

        // Star core
        ctx.beginPath();
        ctx.arc(x2d, y2d, size, 0, Math.PI * 2);
        ctx.fillStyle = '#ffffff';
        ctx.fill();
        
        ctx.globalAlpha = 1;
    }
}

// Energy Cloud Particle class
class EnergyParticle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.vx = (Math.random() - 0.5) * 2;
        this.vy = (Math.random() - 0.5) * 2;
        this.size = Math.random() * 8 + 2;
        this.color = Math.random() > 0.6 ? colors.purple : 
                      Math.random() > 0.3 ? colors.cyan : colors.accent;
        this.alpha = Math.random() * 0.4 + 0.2;
        this.life = Math.random() * 100 + 50;
        this.maxLife = this.life;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.life--;
        
        // Fade out over time
        this.alpha = (this.life / this.maxLife) * 0.4;
        
        // Slow down over time
        this.vx *= 0.99;
        this.vy *= 0.99;
    }

    draw() {
        const gradient = ctx.createRadialGradient(this.x, this.y, 0, this.x, this.y, this.size);
        gradient.addColorStop(0, this.color + Math.floor(this.alpha * 255).toString(16).padStart(2, '0'));
        gradient.addColorStop(0.5, this.color + Math.floor(this.alpha * 128).toString(16).padStart(2, '0'));
        gradient.addColorStop(1, 'transparent');
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
    }
}

// Energy Cloud class
class EnergyCloud {
    constructor(x, y, radius) {
        this.x = x;
        this.y = y;
        this.radius = radius;
        this.particles = [];
        this.angle = Math.random() * Math.PI * 2;
        this.speed = 0.01 + Math.random() * 0.02;
        this.colorShift = 0;
        
        // Create particles
        for (let i = 0; i < 30; i++) {
            const angle = (i / 30) * Math.PI * 2;
            const r = Math.random() * radius;
            const px = x + Math.cos(angle) * r;
            const py = y + Math.sin(angle) * r;
            this.particles.push(new EnergyParticle(px, py));
        }
    }

    update() {
        this.angle += this.speed;
        this.colorShift += 0.01;
        
        // Update particles with orbital motion
        this.particles.forEach((particle, i) => {
            const orbitalAngle = this.angle + (i / this.particles.length) * Math.PI * 2;
            const orbitalRadius = this.radius * (0.7 + Math.sin(time * 0.5 + i) * 0.3);
            
            particle.x = this.x + Math.cos(orbitalAngle) * orbitalRadius;
            particle.y = this.y + Math.sin(orbitalAngle) * orbitalRadius;
            
            particle.update();
            
            // Respawn particles if they die
            if (particle.life <= 0) {
                const angle = Math.random() * Math.PI * 2;
                const r = Math.random() * this.radius;
                particle.x = this.x + Math.cos(angle) * r;
                particle.y = this.y + Math.sin(angle) * r;
                particle.life = particle.maxLife;
                particle.alpha = Math.random() * 0.4 + 0.2;
            }
        });
    }

    draw() {
        this.particles.forEach(particle => particle.draw());
    }
}

// Scanline Effect class
class ScanlineEffect {
    constructor() {
        this.offset = 0;
        this.speed = 2 + Math.random() * 3;
        this.intensity = 0.1 + Math.random() * 0.15;
    }

    update() {
        this.offset += this.speed;
    }

    draw() {
        ctx.save();
        
        // Create scanline pattern
        const lineHeight = 2;
        const pattern = ctx.createLinearGradient(0, 0, 0, lineHeight);
        pattern.addColorStop(0, `rgba(255, 255, 255, ${this.intensity * 0.1})`);
        pattern.addColorStop(0.5, `rgba(255, 255, 255, ${this.intensity * 0.3})`);
        pattern.addColorStop(1, `rgba(255, 255, 255, ${this.intensity * 0.1})`);
        
        ctx.fillStyle = pattern;
        
        // Draw moving scanlines
        for (let y = -lineHeight; y < height + lineHeight; y += lineHeight * 4) {
            const yPos = y + (this.offset % (lineHeight * 4));
            ctx.fillRect(0, yPos, width, lineHeight);
        }
        
        ctx.restore();
    }
}

// Wave Ripple class
class WaveRipple {
    constructor() {
        this.x = width / 2;
        this.y = height / 2;
        this.radius = 0;
        this.maxRadius = Math.max(width, height) * 1.5;
        this.speed = 8;
        this.intensity = 0;
        this.delay = 0;
        this.active = false;
    }

    trigger(delay = 0) {
        this.delay = delay;
        this.radius = 0;
        this.intensity = 1;
        this.active = true;
    }

    update() {
        if (!this.active) return;
        
        if (this.delay > 0) {
            this.delay--;
            return;
        }
        
        this.radius += this.speed;
        this.intensity = Math.max(0, 1 - (this.radius / this.maxRadius));
        
        if (this.radius >= this.maxRadius || this.intensity <= 0.01) {
            this.active = false;
        }
    }

    draw() {
        if (!this.active || this.intensity <= 0) return;
        
        ctx.save();
        
        const rippleCount = 3;
        for (let i = 0; i < rippleCount; i++) {
            const r = this.radius - (i * 30);
            const alpha = this.intensity * (0.5 - i * 0.15);
            
            if (r > 0 && alpha > 0.01) {
                ctx.strokeStyle = `rgba(0, 242, 255, ${alpha})`;
                ctx.lineWidth = 2 + i;
                ctx.shadowBlur = 10;
                ctx.shadowColor = colors.primary;
                
                ctx.beginPath();
                ctx.arc(this.x, this.y, r, 0, Math.PI * 2);
                ctx.stroke();
            }
        }
        
        ctx.restore();
    }
}

// Enhanced Glowing Orb class
class GlowingOrb {
    constructor(index, total) {
        this.index = index;
        this.total = total;
        this.angle = (index / total) * Math.PI * 2;
        this.radiusX = width * 0.35;
        this.radiusY = height * 0.25;
        this.speed = 0.3 + Math.random() * 0.2;
        this.size = 100 + Math.random() * 50;
        this.colorIndex = index % 6;
        this.colors = [colors.primary, colors.secondary, colors.accent, colors.gold, colors.green, colors.purple];
        this.pulsePhase = Math.random() * Math.PI * 2;
        this.floatOffset = Math.random() * Math.PI * 2;
    }

    update() {
        this.angle += this.speed * 0.01;
    }

    draw() {
        const x = width / 2 + Math.cos(this.angle) * this.radiusX;
        const y = height / 2 + Math.sin(this.angle) * this.radiusY + Math.sin(time + this.floatOffset) * 20;
        
        const pulse = 1 + Math.sin(time * 2 + this.pulsePhase) * 0.2;
        const size = this.size * pulse;
        const color = this.colors[this.colorIndex];
        
        // Multiple glow layers
        const gradients = [
            { size: size * 0.5, alpha: 0.3 },
            { size: size * 1.2, alpha: 0.15 },
            { size: size * 2, alpha: 0.08 }
        ];
        
        gradients.forEach((gradient, i) => {
            const grad = ctx.createRadialGradient(x, y, 0, x, y, gradient.size);
            grad.addColorStop(0, `${color}${Math.floor(gradient.alpha * 255).toString(16).padStart(2, '0')}`);
            grad.addColorStop(0.7, `${color}${Math.floor(gradient.alpha * 100).toString(16).padStart(2, '0')}`);
            grad.addColorStop(1, 'transparent');
            
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(x, y, gradient.size, 0, Math.PI * 2);
            ctx.fill();
        });
        
        // Core orb
        ctx.beginPath();
        ctx.arc(x, y, size * 0.3, 0, Math.PI * 2);
        ctx.fillStyle = `${color}60`;
        ctx.fill();
        
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.shadowBlur = 15;
        ctx.shadowColor = color;
        ctx.stroke();
        ctx.shadowBlur = 0;
    }
}

function createParticles() {
    particles = [];
    const count = Math.floor((width * height) / 6000) + 250; // Increased particle count
    for (let i = 0; i < count; i++) {
        particles.push(new Particle());
    }
}

function createGeometricShapes() {
    geometricShapes = [];
    
    // Create various geometric shapes - enhanced with more types
    const shapeConfigs = [
        { type: 'cube', x: width * 0.15, y: height * 0.3, z: 300, size: 60, color: colors.primary },
        { type: 'pyramid', x: width * 0.85, y: height * 0.4, z: 400, size: 70, color: colors.secondary },
        { type: 'octahedron', x: width * 0.75, y: height * 0.25, z: 200, size: 50, color: colors.accent },
        { type: 'diamond', x: width * 0.2, y: height * 0.5, z: 500, size: 55, color: colors.primary },
        { type: 'cube', x: width * 0.6, y: height * 0.6, z: 350, size: 45, color: colors.secondary },
        { type: 'octahedron', x: width * 0.4, y: height * 0.35, z: 450, size: 65, color: colors.accent },
        // New shapes
        { type: 'dodecahedron', x: width * 0.3, y: height * 0.2, z: 250, size: 40, color: colors.gold },
        { type: 'icosahedron', x: width * 0.9, y: height * 0.7, z: 380, size: 35, color: colors.green },
        { type: 'tetrahedron', x: width * 0.1, y: height * 0.8, z: 420, size: 50, color: colors.orange },
        { type: 'hexagonal', x: width * 0.7, y: height * 0.15, z: 320, size: 45, color: colors.purple },
        { type: 'dodecahedron', x: width * 0.55, y: height * 0.75, z: 480, size: 38, color: colors.cyan },
        { type: 'icosahedron', x: width * 0.25, y: height * 0.65, z: 280, size: 42, color: colors.pink },
        // Additional shapes for more visual impact
        { type: 'cube', x: width * 0.95, y: height * 0.9, z: 150, size: 55, color: colors.primary },
        { type: 'pyramid', x: width * 0.05, y: height * 0.1, z: 180, size: 65, color: colors.secondary },
        { type: 'octahedron', x: width * 0.5, y: height * 0.1, z: 120, size: 48, color: colors.accent },
        { type: 'diamond', x: width * 0.8, y: height * 0.85, z: 220, size: 52, color: colors.gold },
        { type: 'tetrahedron', x: width * 0.12, y: height * 0.45, z: 340, size: 47, color: colors.green },
        { type: 'hexagonal', x: width * 0.88, y: height * 0.55, z: 290, size: 43, color: colors.purple }
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
    const beamCount = 12; // Significantly increased for more dynamic effect
    for (let i = 0; i < beamCount; i++) {
        const x = (width / beamCount) * i + Math.random() * 80;
        const direction = Math.random() > 0.5 ? 1 : -1;
        const colorChoices = [colors.primary, colors.secondary, colors.accent, colors.gold, colors.green, colors.purple, colors.cyan];
        const color = colorChoices[i % colorChoices.length];
        lightBeams.push(new LightBeam(x, direction, color));
    }
}

function createStarField() {
    starField = [];
    const starCount = Math.floor((width * height) / 8000) + 300; // Increased star count
    for (let i = 0; i < starCount; i++) {
        starField.push(new Star());
    }
}

function createEnergyClouds() {
    energyClouds = [];
    const cloudCount = 6; // Increased energy cloud count
    for (let i = 0; i < cloudCount; i++) {
        const x = width * (0.1 + Math.random() * 0.8);
        const y = height * (0.1 + Math.random() * 0.8);
        const radius = 100 + Math.random() * 150; // Increased radius
        energyClouds.push(new EnergyCloud(x, y, radius));
    }
}

function createScanlineEffect() {
    scanlineEffect = new ScanlineEffect();
}

function createWaveRipple() {
    waveRipple = new WaveRipple();
    // Trigger initial ripple
    setTimeout(() => waveRipple.trigger(), 1000);
    // Trigger periodic ripples
    setInterval(() => waveRipple.trigger(Math.random() * 60), 8000);
}

function createGlowingOrbs() {
    glowingOrbs = [];
    const orbCount = 18; // Significantly increased for more dynamic effect
    for (let i = 0; i < orbCount; i++) {
        glowingOrbs.push(new GlowingOrb(i, orbCount));
    }
}

function drawPerspectiveFloor() {
    const horizonY = height * 0.65;
    const gridLines = 35; // Increased for more detail
    const verticalLines = 45; // Increased for more detail
    
    // Enhanced perspective grid with dynamic colors
    ctx.strokeStyle = `${colors.secondary}60`; // Increased opacity
    ctx.lineWidth = 2; // Increased line width

    // Horizontal lines (perspective)
    for (let i = 0; i < gridLines; i++) {
        const progress = i / gridLines;
        const y = horizonY + Math.pow(progress, 2) * (height - horizonY);
        const alpha = 0.25 + progress * 0.35; // Increased alpha range
        
        const colorShift = Math.sin(time * 2 + progress * 10) * 0.5 + 0.5;
        const color = colorShift > 0.5 ? colors.secondary : colors.primary;
        
        ctx.strokeStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowBlur = 5; // Add glow
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
    }

    // Vertical lines (perspective - radiating from center)
    const centerX = width / 2;
    for (let i = -verticalLines / 2; i < verticalLines / 2; i++) {
        const angle = i * 0.05;
        const alpha = 0.15 + Math.abs(i) / (verticalLines / 2) * 0.3; // Increased alpha
        
        const colorShift = Math.cos(time * 1.5 + i * 0.3) * 0.5 + 0.5;
        const color = colorShift > 0.5 ? colors.accent : colors.cyan;
        
        ctx.strokeStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
        ctx.shadowBlur = 5; // Add glow
        ctx.shadowColor = color;
        ctx.beginPath();
        ctx.moveTo(centerX + Math.sin(angle) * 100, horizonY);
        ctx.lineTo(centerX + Math.sin(angle) * width * 0.8, height);
        ctx.stroke();
    }

    // Enhanced horizon glow with multiple layers
    const horizonGradient = ctx.createLinearGradient(0, horizonY - 200, 0, horizonY + 200);
    horizonGradient.addColorStop(0, 'transparent');
    horizonGradient.addColorStop(0.25, `${colors.primary}50`); // Increased intensity
    horizonGradient.addColorStop(0.5, `${colors.secondary}70`); // Increased intensity
    horizonGradient.addColorStop(0.75, `${colors.accent}50`); // Increased intensity
    horizonGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = horizonGradient;
    ctx.fillRect(0, horizonY - 200, width, 400);
    
    // Additional pulse effect at horizon
    const pulseIntensity = Math.sin(time * 3) * 0.3 + 0.8; // Increased base intensity
    const pulseGradient = ctx.createLinearGradient(0, horizonY - 80, 0, horizonY + 80);
    pulseGradient.addColorStop(0, 'transparent');
    pulseGradient.addColorStop(0.5, `${colors.gold}${Math.floor(pulseIntensity * 180).toString(16).padStart(2, '0')}`);
    pulseGradient.addColorStop(1, 'transparent');
    
    ctx.fillStyle = pulseGradient;
    ctx.fillRect(0, horizonY - 80, width, 160);
    
    ctx.shadowBlur = 0; // Reset shadow
}

function drawHexagonPattern() {
    const hexSize = 80; // Increased hex size
    const hexHeight = hexSize * Math.sqrt(3);
    const cols = Math.ceil(width / hexSize) + 2;
    const rows = Math.ceil(height / hexHeight) + 2;

    for (let row = -1; row < rows; row++) {
        for (let col = -1; col < cols; col++) {
            const x = col * hexSize * 1.5;
            const y = row * hexHeight + (col % 2 === 0 ? 0 : hexHeight / 2);
            
            // Enhanced movement with wave distortion
            const waveDistortion = Math.sin(time * 2 + row * 0.3) * 25;
            const offsetX = (time * 20) % (hexSize * 1.5) + waveDistortion;
            const offsetY = (time * 10) % hexHeight + Math.cos(time * 1.5 + col * 0.3) * 20;
            
            const finalX = x - offsetX;
            const finalY = y + offsetY;

            // Deformation based on distance and time
            const distFromCenter = Math.sqrt(
                Math.pow(finalX - width / 2, 2) + 
                Math.pow(finalY - height / 2, 2)
            );
            
            const deformFactor = 1 + Math.sin(time * 3 + distFromCenter * 0.01) * 0.3;
            const alpha = Math.max(0, 0.25 - distFromCenter / (width * 0.8)) * 
                         (0.7 + Math.sin(time * 2 + distFromCenter * 0.01) * 0.3); // Increased alpha

            if (alpha > 0.01) {
                drawDeformedHexagon(finalX, finalY, hexSize * deformFactor, alpha, distFromCenter);
            }
        }
    }
}

function drawDeformedHexagon(x, y, size, alpha, distance) {
    const colorShift = Math.sin(time * 2 + distance * 0.005) * 0.5 + 0.5;
    const color = colorShift > 0.5 ? colors.accent : colors.primary;
    
    ctx.strokeStyle = `${color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`;
    ctx.lineWidth = 2 + Math.sin(time * 4 + distance * 0.01) * 1; // Increased line width

    // Enhanced glow effect
    ctx.shadowBlur = 12; // Increased from 8
    ctx.shadowColor = color;

    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 - Math.PI / 6 + Math.sin(time * 2 + i) * 0.1;
        const deformSize = size * (1 + Math.sin(time * 3 + i) * 0.2);
        const px = x + Math.cos(angle) * deformSize;
        const py = y + Math.sin(angle) * deformSize;
        if (i === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
    }
    ctx.closePath();
    ctx.stroke();
    
    // Add inner glow for more depth
    const innerGradient = ctx.createRadialGradient(x, y, 0, x, y, size * 0.8);
    innerGradient.addColorStop(0, `${color}${Math.floor(alpha * 50).toString(16).padStart(2, '0')}`);
    innerGradient.addColorStop(0.7, 'transparent');
    
    ctx.fillStyle = innerGradient;
    ctx.fill();
    
    ctx.shadowBlur = 0;
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

    // Clear with semi-transparent black for trail effect (reduced opacity to show background effects)
    ctx.fillStyle = `${colors.bg}80`;
    ctx.fillRect(0, 0, width, height);

    // Draw background elements in order for proper layering (back to front)
    // 1. Star field (deep background)
    starField.forEach(star => {
        star.update();
        star.draw();
    });

    // 2. Background patterns
    drawHexagonPattern();
    drawPerspectiveFloor();
    
    // 3. Geometric shapes (mid-ground 3D objects)
    geometricShapes.sort((a, b) => b.z - a.z);
    geometricShapes.forEach(shape => {
        shape.update();
        shape.draw();
    });

    // 4. Energy clouds (mid-ground effects)
    energyClouds.forEach(cloud => {
        cloud.update();
        cloud.draw();
    });

    // 5. Light beams (mid-ground lighting effects)
    lightBeams.forEach(beam => beam.draw());

    // 6. Glowing orbs (foreground lighting effects)
    glowingOrbs.forEach(orb => {
        orb.update();
        orb.draw();
    });

    // 7. Particles (foreground details)
    particles.forEach(p => {
        p.update();
        p.draw();
    });

    // 8. Foreground effects
    if (scanlineEffect) {
        scanlineEffect.update();
        scanlineEffect.draw();
    }
    
    if (waveRipple) {
        waveRipple.update();
        waveRipple.draw();
    }

    // 9. Final vignette overlay
    drawVignette();

    requestAnimationFrame(animate);
}

init();
