(() => {
    const canvas = document.getElementById('bg-canvas');
    const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
    if (!ctx) return;

    const colors = {
        bg: '#050505',
        primary: '#00f2ff',
        secondary: '#7000ff',
        accent: '#ff00c8'
    };

    const isMobile = () => {
        return (
            /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
            window.innerWidth < 768
        );
    };

    const isTablet = () => window.innerWidth >= 768 && window.innerWidth < 1024;

    let width = 0;
    let height = 0;
    let dpr = 1;

    let geometries = [];
    let lightBeams = [];
    let gridGround = null;

    let vignetteGradient = null;

    const mainEl = document.querySelector('main');
    let targetMX = 0, targetMY = 0;
    let currentMX = 0, currentMY = 0;

    window.addEventListener('mousemove', (e) => {
        targetMX = (e.clientX / window.innerWidth - 0.5) * 40;
        targetMY = (e.clientY / window.innerHeight - 0.5) * 40;
    }, { passive: true });

    const CAMERA_Z = 900;
    const PROJ_SCALE = 900;

    class Geometry {
        constructor({ x, y, z, vertices, edges, color, rotSpeedX, rotSpeedY, rotSpeedZ, floatAmp, floatSpeed, floatOffset }) {
            this.x = x;
            this.y = y;
            this.baseY = y;
            this.z = z;

            this.color = color;

            this.rx = Math.random() * Math.PI * 2;
            this.ry = Math.random() * Math.PI * 2;
            this.rz = Math.random() * Math.PI * 2;

            this.rsx = rotSpeedX;
            this.rsy = rotSpeedY;
            this.rsz = rotSpeedZ;

            this.floatAmp = floatAmp;
            this.floatSpeed = floatSpeed;
            this.floatOffset = floatOffset;

            this.vertices = vertices;
            this.edges = edges;

            this.projected = new Array(vertices.length);
            for (let i = 0; i < vertices.length; i++) this.projected[i] = { x: 0, y: 0, scale: 1 };
        }

        update(t) {
            this.rx += this.rsx;
            this.ry += this.rsy;
            this.rz += this.rsz;
            this.y = this.baseY + Math.sin(t * this.floatSpeed + this.floatOffset) * this.floatAmp;
        }

        projectPoint(p, out, sinx, cosx, siny, cosy, sinz, cosz) {
            let x = p.x;
            let y = p.y;
            let z = p.z;

            let ty = y * cosx - z * sinx;
            let tz = y * sinx + z * cosx;
            y = ty;
            z = tz;

            let tx = x * cosy + z * siny;
            tz = -x * siny + z * cosy;
            x = tx;
            z = tz;

            tx = x * cosz - y * sinz;
            ty = x * sinz + y * cosz;
            x = tx;
            y = ty;

            const wx = this.x + x;
            const wy = this.y + y;
            const wz = this.z + z;

            const depth = CAMERA_Z + wz;
            const scale = PROJ_SCALE / depth;

            out.x = (wx - width * 0.5) * scale + width * 0.5;
            out.y = (wy - height * 0.5) * scale + height * 0.5;
            out.scale = scale;
        }

        draw() {
            const sinx = Math.sin(this.rx), cosx = Math.cos(this.rx);
            const siny = Math.sin(this.ry), cosy = Math.cos(this.ry);
            const sinz = Math.sin(this.rz), cosz = Math.cos(this.rz);

            for (let i = 0; i < this.vertices.length; i++) {
                this.projectPoint(this.vertices[i], this.projected[i], sinx, cosx, siny, cosy, sinz, cosz);
            }

            const approxScale = this.projected[0].scale;
            const alpha = Math.max(0.15, Math.min(0.6, approxScale));

            ctx.globalAlpha = alpha;
            ctx.strokeStyle = this.color;
            ctx.lineWidth = Math.max(1, approxScale * 1.5);

            ctx.beginPath();
            for (let i = 0; i < this.edges.length; i += 2) {
                const a = this.projected[this.edges[i]];
                const b = this.projected[this.edges[i + 1]];
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
            }
            ctx.stroke();

            ctx.globalAlpha = 1;
        }
    }

    const getCube = (s) => ({
        vertices: [
            { x: -s, y: -s, z: -s }, { x: s, y: -s, z: -s }, { x: s, y: s, z: -s }, { x: -s, y: s, z: -s },
            { x: -s, y: -s, z: s }, { x: s, y: -s, z: s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s }
        ],
        edges: [0, 1, 1, 2, 2, 3, 3, 0, 4, 5, 5, 6, 6, 7, 7, 4, 0, 4, 1, 5, 2, 6, 3, 7]
    });

    const getTetrahedron = (s) => ({
        vertices: [
            { x: s, y: s, z: s }, { x: s, y: -s, z: -s }, { x: -s, y: s, z: -s }, { x: -s, y: -s, z: s }
        ],
        edges: [0, 1, 0, 2, 0, 3, 1, 2, 1, 3, 2, 3]
    });

    const getPyramid = (s) => ({
        vertices: [
            { x: -s, y: s, z: -s }, { x: s, y: s, z: -s }, { x: s, y: s, z: s }, { x: -s, y: s, z: s }, { x: 0, y: -s, z: 0 }
        ],
        edges: [0, 1, 1, 2, 2, 3, 3, 0, 0, 4, 1, 4, 2, 4, 3, 4]
    });

    const getPrism = (s) => ({
        vertices: [
            { x: 0, y: -s, z: s * 0.8 }, { x: s * 0.7, y: -s, z: -s * 0.4 }, { x: -s * 0.7, y: -s, z: -s * 0.4 },
            { x: 0, y: s, z: s * 0.8 }, { x: s * 0.7, y: s, z: -s * 0.4 }, { x: -s * 0.7, y: s, z: -s * 0.4 }
        ],
        edges: [0, 1, 1, 2, 2, 0, 3, 4, 4, 5, 5, 3, 0, 3, 1, 4, 2, 5]
    });

    const getOctahedron = (s) => ({
        vertices: [
            { x: s, y: 0, z: 0 }, { x: -s, y: 0, z: 0 }, { x: 0, y: s, z: 0 }, { x: 0, y: -s, z: 0 }, { x: 0, y: 0, z: s }, { x: 0, y: 0, z: -s }
        ],
        edges: [0, 2, 0, 3, 0, 4, 0, 5, 1, 2, 1, 3, 1, 4, 1, 5, 2, 4, 4, 3, 3, 5, 5, 2]
    });

    const getSphere = (s) => {
        const vertices = [];
        const edges = [];
        const latCount = 5;
        const lonCount = 8;
        for (let i = 0; i <= latCount; i++) {
            const lat = Math.PI * i / latCount - Math.PI / 2;
            for (let j = 0; j < lonCount; j++) {
                const lon = 2 * Math.PI * j / lonCount;
                vertices.push({
                    x: s * Math.cos(lat) * Math.cos(lon),
                    y: s * Math.sin(lat),
                    z: s * Math.cos(lat) * Math.sin(lon)
                });
            }
        }
        for (let i = 0; i < latCount; i++) {
            for (let j = 0; j < lonCount; j++) {
                const c = i * lonCount + j;
                const n = i * lonCount + (j + 1) % lonCount;
                const d = (i + 1) * lonCount + j;
                edges.push(c, n, c, d);
            }
        }
        return { vertices, edges };
    };

    class GridGround {
        constructor() {
            this.spacing = 100;
            this.gridWidth = 4000;
            this.gridDepth = 4000;
        }

        draw(t) {
            const groundY = height * 0.85;
            const moveZ = (t * 120) % this.spacing;
            
            ctx.save();
            ctx.strokeStyle = colors.secondary;
            ctx.globalAlpha = 0.15;
            ctx.lineWidth = 1;

            // Horizontal lines
            for (let z = 0; z <= this.gridDepth; z += this.spacing) {
                const zPos = z - moveZ;
                this.drawLine(-this.gridWidth / 2, groundY, zPos, this.gridWidth / 2, groundY, zPos);
            }

            // Vertical lines
            for (let x = -this.gridWidth / 2; x <= this.gridWidth / 2; x += this.spacing) {
                this.drawLine(x, groundY, 0, x, groundY, this.gridDepth);
            }

            // Light pulse
            const pulseZ = (t * 400) % this.gridDepth;
            ctx.strokeStyle = colors.primary;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 2;
            this.drawLine(-this.gridWidth / 2, groundY, pulseZ, this.gridWidth / 2, groundY, pulseZ);
            
            ctx.restore();
        }

        drawLine(x1, y1, z1, x2, y2, z2) {
            const p1 = this.project(x1, y1, z1);
            const p2 = this.project(x2, y2, z2);
            if (p1.scale > 0 && p2.scale > 0) {
                ctx.beginPath();
                ctx.moveTo(p1.x, p1.y);
                ctx.lineTo(p2.x, p2.y);
                ctx.stroke();
            }
        }

        project(x, y, z) {
            const depth = CAMERA_Z + z;
            if (depth <= 10) return { x: 0, y: 0, scale: -1 };
            const scale = PROJ_SCALE / depth;
            return {
                x: x * scale + width * 0.5,
                y: (y - height * 0.5) * scale + height * 0.5,
                scale: scale
            };
        }
    }

    class LightBeam {
        constructor(x, direction, color) {
            this.x = x;
            this.direction = direction;
            this.color = color;
            this.speed = 0.6 + Math.random() * 0.5;
            this.offset = Math.random() * Math.PI * 2;
            this.width = 18 + Math.random() * 26;
        }

        draw(t) {
            const alpha = 0.05 + (Math.sin(t * this.speed + this.offset) * 0.03 + 0.03);
            const dx = this.direction * (120 + this.width * 3);

            const grad = ctx.createLinearGradient(this.x, 0, this.x + dx, height);
            grad.addColorStop(0, 'transparent');
            grad.addColorStop(0.35, `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
            grad.addColorStop(0.65, `${this.color}${Math.floor(alpha * 255).toString(16).padStart(2, '0')}`);
            grad.addColorStop(1, 'transparent');

            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.moveTo(this.x, 0);
            ctx.lineTo(this.x + this.direction * this.width, height * 0.3);
            ctx.lineTo(this.x + dx, height);
            ctx.lineTo(this.x + this.direction * this.width, height * 0.3);
            ctx.closePath();
            ctx.fill();
        }
    }

    function resize() {
        width = window.innerWidth;
        height = window.innerHeight;

        dpr = Math.min(window.devicePixelRatio || 1, 2);

        canvas.width = Math.floor(width * dpr);
        canvas.height = Math.floor(height * dpr);
        canvas.style.width = `${width}px`;
        canvas.style.height = `${height}px`;
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

        vignetteGradient = ctx.createRadialGradient(width * 0.5, height * 0.5, height * 0.25, width * 0.5, height * 0.5, height * 0.9);
        vignetteGradient.addColorStop(0, 'transparent');
        vignetteGradient.addColorStop(1, 'rgba(0,0,0,0.8)');

        createScene();
    }

    function createScene() {
        const mobile = isMobile();
        const tablet = isTablet();

        const count = mobile ? 12 : tablet ? 13 : 15;
        const beamCount = mobile ? 2 : 3;

        const sizeBase = mobile ? 24 : tablet ? 30 : 34;

        geometries = [];
        lightBeams = [];
        gridGround = new GridGround();

        const palette = [colors.primary, colors.secondary, colors.accent];
        const factories = [getCube, getTetrahedron, getPyramid, getPrism, getOctahedron, getSphere];

        for (let i = 0; i < count; i++) {
            const layer = i / (count - 1 || 1);
            const z = 100 + layer * 550;

            const spreadX = width * 0.4;
            const spreadY = height * 0.3;

            const x = width * 0.5 + (Math.random() * 2 - 1) * spreadX;
            const y = height * 0.4 + (Math.random() * 2 - 1) * spreadY;

            const size = sizeBase * (0.8 + Math.random() * 1.2) * (1.1 - layer * 0.4);

            const speedMul = mobile ? 0.7 : tablet ? 0.85 : 1;
            const rotSpeedX = (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1) * speedMul;
            const rotSpeedY = (Math.random() * 0.01 + 0.005) * (Math.random() > 0.5 ? 1 : -1) * speedMul;
            const rotSpeedZ = (Math.random() * 0.006 + 0.002) * (Math.random() > 0.5 ? 1 : -1) * speedMul;

            const floatAmp = (mobile ? 10 : 15) * (0.7 + Math.random() * 0.8);
            const floatSpeed = (mobile ? 0.6 : 0.8) + Math.random() * 0.5;
            const floatOffset = Math.random() * Math.PI * 2;

            const factory = factories[Math.floor(Math.random() * factories.length)];
            const { vertices, edges } = factory(size);

            geometries.push(
                new Geometry({
                    x,
                    y,
                    z,
                    vertices,
                    edges,
                    color: palette[i % palette.length],
                    rotSpeedX,
                    rotSpeedY,
                    rotSpeedZ,
                    floatAmp,
                    floatSpeed,
                    floatOffset
                })
            );
        }

        geometries.sort((a, b) => b.z - a.z);

        for (let i = 0; i < beamCount; i++) {
            const x = (width / beamCount) * (i + 0.2 + Math.random() * 0.6);
            const direction = Math.random() > 0.5 ? 1 : -1;
            const color = i % 2 === 0 ? colors.primary : colors.secondary;
            lightBeams.push(new LightBeam(x, direction, color));
        }
    }

    function drawBackground() {
        ctx.fillStyle = colors.bg;
        ctx.fillRect(0, 0, width, height);
    }

    function drawVignette() {
        if (vignetteGradient) {
            ctx.fillStyle = vignetteGradient;
            ctx.fillRect(0, 0, width, height);
        }
    }

    function animate() {
        const t = performance.now() * 0.001;

        drawBackground();
        
        if (gridGround) gridGround.draw(t);

        if (mainEl && !isMobile()) {
            currentMX += (targetMX - currentMX) * 0.08;
            currentMY += (targetMY - currentMY) * 0.08;
            mainEl.style.transform = `translate3d(${currentMX}px, ${currentMY}px, 0)`;
        }

        for (let i = 0; i < lightBeams.length; i++) lightBeams[i].draw(t);
        for (let i = 0; i < geometries.length; i++) {
            geometries[i].update(t);
            geometries[i].draw();
        }

        drawVignette();

        requestAnimationFrame(animate);
    }

    window.addEventListener('resize', resize, { passive: true });

    resize();
    animate();
})();
