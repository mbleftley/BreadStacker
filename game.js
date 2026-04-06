/**
 * Loaf Stacker: Multi-Slice Overhaul
 * A juicy isometric physics-ish stacking game about bread.
 */

const SLICE_WIDTH = 14;
const START_SLICES = 15;

class SoundManager {
    constructor() {
        this.ctx = null;
    }

    init() {
        if (!this.ctx) {
            try {
                this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            } catch (e) { console.error(e); }
        }
    }

    playSuccess(isPerfect = false, multiplier = 1) {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // --- PERCUSSIVE WOOD SNAP: Clean, bakery rhythm ---
        const pitchScale = 1 + (multiplier - 1) * 0.2; // Sharper pitch scaling
        const freq = (isPerfect ? 1200 : 800) * pitchScale;

        // 1. Sharp Noise Burst (The "Snap")
        const bufferSize = this.ctx.sampleRate * 0.05;
        const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;

        const noise = this.ctx.createBufferSource();
        noise.buffer = buffer;
        const noiseGain = this.ctx.createGain();
        const noiseFilter = this.ctx.createBiquadFilter();

        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(freq, now);
        noiseGain.gain.setValueAtTime(0.12, now);
        noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        noise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(this.ctx.destination);
        noise.start(now);

        // 2. Tonal "Thwack" (Fast Triangle)
        const osc = this.ctx.createOscillator();
        const oscGain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq / 2, now);
        oscGain.gain.setValueAtTime(0.08, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
        osc.connect(oscGain);
        oscGain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.1);
    }

    playThud() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;

        // HOLLOW WOOD IMPACT (Low resonant pulse)
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.3);

        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now);
        osc.stop(now + 0.4);
    }

    playJackpot() {
        if (!this.ctx) return;
        const now = this.ctx.currentTime;
        // Ascending Arpeggio (C Major-ish)
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.1);
            gain.gain.setValueAtTime(0, now + i * 0.1);
            gain.gain.linearRampToValueAtTime(0.1, now + i * 0.1 + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
            osc.connect(gain);
            gain.connect(this.ctx.destination);
            osc.start(now + i * 0.1);
            osc.stop(now + i * 0.1 + 0.4);
        });
    }
}

class FloatingText {
    constructor(x, y, text, color = '#fef3c7') {
        this.x = x;
        this.y = y;
        this.text = text;
        this.color = color;
        this.opacity = 1;
        this.alive = true;
        if (typeof gsap !== 'undefined') {
            gsap.to(this, {
                y: this.y - 120,
                opacity: 0,
                duration: 1.5,
                ease: "power2.out",
                onComplete: () => this.alive = false
            });
        }
    }
    update() { }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.opacity;
        ctx.fillStyle = this.color;
        ctx.font = '900 36px Outfit';
        ctx.textAlign = 'center';
        ctx.shadowBlur = 10;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillText(this.text, this.x, this.y);
        ctx.restore();
    }
}

class Debris {
    constructor(x, y, width, height, color, vx) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.color = color;
        this.vx = vx + (Math.random() - 0.5) * 5;
        this.vy = -Math.random() * 5;
        this.rot = 0;
        this.vRot = (Math.random() - 0.5) * 0.3;
        this.gravity = 0.6;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.rot += this.vRot;
        return this.y < window.innerHeight + 500;
    }
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x + this.width / 2, this.y + this.height / 2);
        ctx.rotate(this.rot);
        ctx.fillStyle = '#633908'; // Crust
        ctx.fillRect(-this.width / 2, -this.height / 2, this.width, this.height);
        ctx.fillStyle = '#fef3c7'; // Soft part
        ctx.fillRect(-this.width / 2 + 2, -this.height / 2 + 2, this.width - 4, this.height - 4);

        // Add some "slice" lines to debris too
        ctx.strokeStyle = 'rgba(0,0,0,0.1)';
        ctx.beginPath();
        ctx.moveTo(0, -this.height / 2);
        ctx.lineTo(0, this.height / 2);
        ctx.stroke();

        ctx.restore();
    }
}

class Particle {
    constructor(x, y, color) {
        this.x = x;
        this.y = y;
        this.size = Math.random() * 6 + 2;
        this.color = color;
        this.vx = (Math.random() - 0.5) * 20;
        this.vy = -Math.random() * 12 - 5;
        this.gravity = 0.5;
        this.life = 1;
        this.decay = 0.02 + Math.random() * 0.03;
    }
    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.life -= this.decay;
        return this.life > 0;
    }
    draw(ctx) {
        ctx.save();
        ctx.globalAlpha = this.life;
        ctx.fillStyle = this.color;
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }
}

class Slab {
    constructor(x, y, sliceCount, height, isBase = false) {
        this.x = x;
        this.y = y;
        this.sliceCount = sliceCount;
        this.width = sliceCount * SLICE_WIDTH;
        this.height = height;
        this.isSliding = false;
        this.speed = 4;
        this.direction = 1;
        this.isBase = isBase;
        this.scaleX = 1;
        this.scaleY = 1;
    }

    update(targetX, targetWidth) {
        if (this.isSliding) {
            this.x += this.speed * this.direction;
            const range = 240;
            const left = targetX - range;
            const right = (targetX + targetWidth) + (range - this.width);
            if (this.x >= right) { this.x = right; this.direction = -1; }
            else if (this.x <= left) { this.x = left; this.direction = 1; }
        }
    }

    squash() {
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(this,
                { scaleX: 1.15, scaleY: 0.85 },
                { scaleX: 1, scaleY: 1, duration: 0.65, ease: "elastic.out(1, 0.4)" }
            );
        }
    }

    draw(ctx, camera) {
        const { x, y, width: w, height: h, scaleX, scaleY, isBase, sliceCount } = this;
        ctx.save();
        ctx.translate(x + w / 2, y + h);
        ctx.scale(scaleX, scaleY);
        ctx.translate(-(x + w / 2), -(y + h));

        if (isBase) {
            // RENDERING A WOODEN BREAD BOARD
            const woodGrad = ctx.createLinearGradient(x, y, x, y + h);
            woodGrad.addColorStop(0, '#5d3a1a');
            woodGrad.addColorStop(1, '#2c1808');
            ctx.fillStyle = woodGrad;
            ctx.fillRect(x, y, w, h);
            ctx.strokeStyle = '#3e2610';
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + 12, y - 8);
            ctx.lineTo(x + w + 12, y - 8);
            ctx.lineTo(x + w, y);
            ctx.fill();
            ctx.fillStyle = '#78481b';
            ctx.beginPath();
            ctx.moveTo(x, y); ctx.lineTo(x + 12, y - 8); ctx.lineTo(x + w + 12, y - 8); ctx.lineTo(x + w, y);
            ctx.fill();
        } else {
            // RENDERING A LOAF (or Stack of Loaves)
            const loafCount = Math.round(h / 48); // 48 is slabThickness
            const singleH = h / loafCount;

            for (let L = 0; L < loafCount; L++) {
                const ly = y + (L * singleH);

                // 1. Draw the main loaf shape (The "Under-Crust")
                const crustGrad = ctx.createLinearGradient(x, ly, x, ly + singleH);
                crustGrad.addColorStop(0, '#d97706');
                crustGrad.addColorStop(1, '#452906');
                ctx.fillStyle = crustGrad;
                this.drawRoundedRect(ctx, x, ly, w, singleH, 8);
                ctx.fill();

                // 2. SOFT CENTER (The Bread Part)
                ctx.fillStyle = '#fef3c7';
                this.drawRoundedRect(ctx, x + 3, ly + 3, w - 6, singleH - 6, 6);
                ctx.fill();

                // 3. SLICE LINES
                ctx.strokeStyle = 'rgba(69, 41, 6, 0.25)';
                ctx.lineWidth = 1.5;
                for (let i = 1; i < sliceCount; i++) {
                    const sx = x + i * SLICE_WIDTH;
                    ctx.beginPath();
                    ctx.moveTo(sx, ly + 4);
                    ctx.lineTo(sx, ly + singleH - 4);
                    ctx.stroke();
                }

                // 4. TOP CRUST ISOMETRIC (Only for the very top loaf in the stack)
                if (L === 0) {
                    ctx.fillStyle = '#fbbf24';
                    ctx.beginPath();
                    ctx.moveTo(x, ly);
                    ctx.lineTo(x + 12, ly - 8);
                    ctx.lineTo(x + w + 12, ly - 8);
                    ctx.lineTo(x + w, ly);
                    ctx.fill();
                }

                // 5. SIDE CRUST
                const sideGrad = ctx.createLinearGradient(x + w, ly, x + w + 12, ly);
                sideGrad.addColorStop(0, '#92400e');
                sideGrad.addColorStop(1, '#5d2b06');
                ctx.fillStyle = sideGrad;
                ctx.beginPath();
                ctx.moveTo(x + w, ly);
                ctx.lineTo(x + w + 12, ly - 8);
                ctx.lineTo(x + w + 12, ly + singleH - 8);
                ctx.lineTo(x + w, ly + singleH);
                ctx.fill();
            }
        }
        ctx.restore();
    }

    drawRoundedRect(ctx, x, y, width, height, radius) {
        ctx.beginPath();
        ctx.moveTo(x + radius, y);
        ctx.lineTo(x + width - radius, y);
        ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
        ctx.lineTo(x + width, y + height - radius);
        ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
        ctx.lineTo(x + radius, y + height);
        ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
        ctx.lineTo(x, y + radius);
        ctx.quadraticCurveTo(x, y, x + radius, y);
        ctx.closePath();
    }
}

class Game {
    constructor() {
        this.canvas = document.getElementById('game-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.topCanvas = document.getElementById('top-canvas');
        this.topCtx = this.topCanvas.getContext('2d');
        this.scoreValue = document.getElementById('score-value');
        this.finalScoreValue = document.getElementById('final-score-value');
        this.maxMultiplierValue = document.getElementById('max-multiplier-value');
        this.funComparison = document.getElementById('fun-comparison');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');
        this.comboContainer = document.getElementById('combo-container');
        this.comboText = document.getElementById('combo-text');
        this.soundManager = new SoundManager();
        this.slabs = []; this.debris = []; this.particles = []; this.topParticles = []; this.floatingTexts = [];
        this.currentSlab = null;
        this.camera = { x: 0, targetX: 0, y: 0, targetY: 0, scale: 1, targetScale: 1, yOffset: 0, xOffset: 0 };
        this.score = 0; this.displayScore = 0;
        this.gameState = 'START'; this.slabThickness = 48;
        this.consecutivePerfects = 0;
        this.comboMultiplier = 1;
        this.maxCombo = 1;
        this.shake = 0;
        this.firebaseInitialized = false;
        this.initFirebase();
        this.init();
    }

    async initFirebase() {
        // --- FIREBASE CONFIGURATION ---
        const firebaseConfig = {
            apiKey: "AIzaSyCe_9bU3ZVM86S2NqsHTJVERriwVmOckqQ",
            authDomain: "breadstackergame.firebaseapp.com",
            projectId: "breadstackergame",
            storageBucket: "breadstackergame.firebasestorage.app",
            messagingSenderId: "836938686791",
            appId: "1:836938686791:web:0e3d110814aede4cce6c62",
            measurementId: "G-5SYJD1PJTZ"
        };

        if (typeof firebase !== 'undefined') {
            try {
                firebase.initializeApp(firebaseConfig);
                this.db = firebase.firestore();
                this.firebaseInitialized = true;
                console.log("🔥 BreadStacker Firebase Initialized");
                
                // Automatic Seeding: Prime the database if empty
                this.seedLeaderboard();
            } catch (e) {
                console.error("Firebase Init Error:", e);
            }
        }
    }

    async seedLeaderboard() {
        if (!this.firebaseInitialized) return;
        try {
            const snapshot = await this.db.collection("leaderboard").limit(1).get();
            if (snapshot.empty) {
                console.log("🥯 Seeding initial bread legends...");
                const legends = [
                    { name: "LE QUACK", score: 100 },
                    { name: "YEAST FEAST", score: 90 },
                    { name: "DOUGH PRO", score: 80 },
                    { name: "CRUST MASTER", score: 70 },
                    { name: "LOAF LOVER", score: 60 },
                    { name: "Sourdough Sam", score: 50 },
                    { name: "Baguette Bob", score: 40 },
                    { name: "Ciabatta Chad", score: 30 },
                    { name: "Rye Riley", score: 20 },
                    { name: "Bun Ben", score: 10 }
                ];
                
                const batch = this.db.batch();
                legends.forEach(legend => {
                    const docRef = this.db.collection("leaderboard").doc();
                    batch.set(docRef, {
                        ...legend,
                        timestamp: firebase.firestore.FieldValue.serverTimestamp()
                    });
                });
                await batch.commit();
                console.log("✅ Legend scores seeded successfully!");
            }
        } catch (e) {
            console.error("Seeding failed:", e);
        }
    }

    init() {
        this.resize();
        window.addEventListener('resize', () => this.resize());
        document.getElementById('start-button').onclick = () => { this.soundManager.init(); this.startSession(); };
        document.getElementById('restart-button').onclick = () => this.startSession();
        document.getElementById('back-to-menu-button').onclick = () => this.showMenu();
        
        // Leaderboard Listeners
        document.getElementById('show-leaderboard-btn').onclick = () => this.showLeaderboard();
        document.getElementById('close-leaderboard-btn').onclick = () => this.hideLeaderboard();
        document.getElementById('submit-score-btn').onclick = () => this.submitCurrentScore();
        document.getElementById('cancel-save-btn').onclick = () => this.closeNameEntry();

        const handleInput = (e) => {
            if (this.gameState === 'PLAYING') {
                if (e.type === 'keydown' && e.code !== 'Space') return;
                if (e.target.closest('button')) return;
                this.handleInteraction();
            }
        };
        window.addEventListener('keydown', handleInput);
        window.addEventListener('mousedown', handleInput);
        window.addEventListener('touchstart', (e) => {
            if (this.gameState === 'PLAYING') { e.preventDefault(); handleInput(e); }
        }, { passive: false });
        this.animate();
    }

    resize() { 
        this.canvas.width = window.innerWidth; 
        this.canvas.height = window.innerHeight; 
        this.topCanvas.width = window.innerWidth;
        this.topCanvas.height = window.innerHeight;
    }

    startSession() {
        this.gameState = 'PLAYING'; this.score = 0; this.displayScore = 0;
        this.consecutivePerfects = 0; this.comboMultiplier = 1; this.maxCombo = 1;
        this.slabs = []; this.debris = []; this.particles = []; this.topParticles = []; this.floatingTexts = []; this.currentSlab = null;
        this.camera = { x: 0, targetX: 0, y: 0, targetY: 0, scale: 1, targetScale: 1, yOffset: 0, xOffset: 0 };
        this.scoreValue.textContent = "0";
        document.getElementById('score-container').classList.add('visible');
        this.startScreen.classList.remove('active'); this.gameOverScreen.classList.remove('active');
        
        // Reset submit button state for new session
        const submitBtn = document.getElementById('submit-score-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "SUBMIT TO GLOBAL";
        }

        const x = (this.canvas.width - (START_SLICES * SLICE_WIDTH)) / 2;
        const y = this.canvas.height - 150;
        const base = new Slab(x, y, START_SLICES, this.slabThickness, true);
        this.slabs.push(base);
        base.squash();

        // Initial Center
        const initialTargetY = -(base.y - (this.canvas.height * 0.65));
        this.camera.targetY = initialTargetY;
        this.camera.y = initialTargetY;

        setTimeout(() => this.spawnNextSlab(), 600);
    }

    spawnNextSlab() {
        if (this.gameState !== 'PLAYING') return;
        const last = this.slabs[this.slabs.length - 1];
        const lastCount = last.sliceCount;
        const y = last.y - (this.slabThickness * this.comboMultiplier);
        const range = 240;
        const startX = Math.random() > 0.5 ? last.x - range : last.x + last.width + (range - (lastCount * SLICE_WIDTH));

        this.currentSlab = new Slab(startX, y, lastCount, this.slabThickness * this.comboMultiplier);
        this.currentSlab.isSliding = true;
        this.currentSlab.speed = Math.min(16, 6.5 + (this.slabs.length * 0.28)); // Slightly slower speed scaling
        this.currentSlab.direction = startX < last.x ? 1 : -1;
    }

    handleInteraction() {
        if (!this.currentSlab || this.gameState !== 'PLAYING') return;
        const last = this.slabs[this.slabs.length - 1];
        const curr = this.currentSlab;
        const overlapX1 = Math.max(last.x, curr.x);
        const overlapX2 = Math.min(last.x + last.width, curr.x + curr.width);
        const overlapWidth = overlapX2 - overlapX1;

        if (overlapWidth < SLICE_WIDTH * 0.5) { 
            // --- FULL MISS DEBRIS ---
            const loafCount = Math.round(curr.height / this.slabThickness);
            for (let L = 0; L < loafCount; L++) {
                const ly = curr.y + (L * this.slabThickness);
                for (let i = 0; i < curr.sliceCount; i++) {
                    this.debris.push(new Debris(
                        curr.x + i * SLICE_WIDTH,
                        ly,
                        SLICE_WIDTH,
                        this.slabThickness,
                        '#633908',
                        curr.x < last.x ? -1 : 1
                    ));
                }
            }
            this.currentSlab = null; // Remove it from the update loop
            setTimeout(() => this.gameOver(), 800); // Slight delay for the "oops" fall animation
            return; 
        }

        const landedSlices = Math.round(overlapWidth / SLICE_WIDTH); // Use round for massive leniency
        const lostSlices = curr.sliceCount - landedSlices;
        const diff = Math.abs(curr.x - last.x);

        let finalX = overlapX1;
        let finalCount = landedSlices;
        let gain = landedSlices * (curr.height / this.slabThickness);

        if (lostSlices === 0 && diff < 14) { // Increased margin to 14px (one full slice)
            this.consecutivePerfects++;
            this.comboMultiplier++; 
            this.maxCombo = Math.max(this.maxCombo, this.comboMultiplier);
            finalX = last.x;
            this.soundManager.playSuccess(true, this.comboMultiplier);
            this.showCombo(`YEAST MODE x${this.comboMultiplier}`);
            this.spawnExplosion(finalX + (finalCount * SLICE_WIDTH) / 2, curr.y, '#fef3c7', 40 + (this.comboMultiplier * 10));
            this.shake = 20 + (this.comboMultiplier * 5);
        } else {
            this.consecutivePerfects = 0;
            this.comboMultiplier = 1;
            this.soundManager.playSuccess(false, 1);
            this.shake = 5; // Reduced from 10 for subtler "normal" hits
            // --- FIXED DEBRIS: Spawn for each loaf in the combo stack ---
            const dropDir = curr.x < last.x ? -1 : 1;
            const startX = curr.x < last.x ? curr.x : overlapX2;
            const loafCount = Math.round(curr.height / this.slabThickness);

            for (let L = 0; L < loafCount; L++) {
                const ly = curr.y + (L * this.slabThickness);
                for (let i = 0; i < lostSlices; i++) {
                    this.debris.push(new Debris(
                        startX + i * SLICE_WIDTH,
                        ly,
                        SLICE_WIDTH,
                        this.slabThickness,
                        '#633908',
                        dropDir * (5 + Math.random() * 3)
                    ));
                }
            }
            this.spawnExplosion(startX + (lostSlices * SLICE_WIDTH) / 2, curr.y, '#d97706', 15);
        }

        const newSlab = new Slab(finalX, curr.y, finalCount, curr.height);
        this.slabs.push(newSlab);
        newSlab.squash();
        this.currentSlab = null;
        this.score += Math.floor(gain);
        this.floatingTexts.push(new FloatingText(finalX + (finalCount * SLICE_WIDTH) / 2, curr.y, `+${Math.floor(gain)} SLICES`));

        // --- FIXED CAMERA: Keep the action in the middle-bottom of the screen ---
        const targetScreenY = this.canvas.height * 0.65;
        this.camera.targetY = -(newSlab.y - targetScreenY);

        setTimeout(() => this.spawnNextSlab(), 100);
    }

    spawnExplosion(x, y, color, count) {
        for (let i = 0; i < count; i++) this.particles.push(new Particle(x, y, color));
    }

    showCombo(text) {
        this.comboText.textContent = text;
        
        // --- JUICY COMBO POP: Spring into view on every update ---
        if (typeof gsap !== 'undefined') {
            gsap.fromTo(this.comboContainer, 
                { scale: 0.4, opacity: 0, rotate: -15 }, 
                { scale: 1.1, opacity: 1, rotate: -8, duration: 0.5, ease: "back.out(2.5)", overwrite: true }
            );
        }

        clearTimeout(this.comboTimer);
        this.comboTimer = setTimeout(() => {
            if (typeof gsap !== 'undefined') {
                gsap.to(this.comboContainer, { scale: 0.6, opacity: 0, duration: 0.3 });
            }
        }, 1100);
    }

    drawRuler(scale = 1.0) {
        if (this.slabs.length <= 1) return;
        const first = this.slabs[0];
        const last = this.slabs[this.slabs.length - 1];
        const towerMidX = first.x + (first.width / 2);
        const compScale = 1 / scale; 
        const startX = towerMidX + (120 * compScale); 
        
        this.ctx.save();
        this.ctx.strokeStyle = 'rgba(217, 119, 6, 0.08)';
        this.ctx.lineWidth = 2 * compScale;
        this.ctx.setLineDash([5 * compScale, 15 * compScale]);
        this.ctx.beginPath();
        this.ctx.moveTo(startX, first.y + this.slabThickness);
        this.ctx.lineTo(startX, last.y);
        this.ctx.stroke();

        this.ctx.setLineDash([]);
        this.ctx.fillStyle = 'rgba(251, 191, 36, 0.85)';
        this.ctx.font = `700 ${Math.round(18 * compScale)}px Outfit`; 
        this.ctx.textAlign = 'left';

        // --- PERCENTAGE MARKERS: 20%, 50%, and 80% points ---
        const count = this.slabs.length - 1;
        const targets = [...new Set([
            Math.max(1, Math.floor(count * 0.20)),
            Math.max(1, Math.floor(count * 0.50)),
            Math.max(1, Math.floor(count * 0.80))
        ])].sort((a,b) => a-b);

        let runningSum = 0;
        this.slabs.forEach((slab, index) => {
            if (index === 0) return;
            runningSum += slab.sliceCount * Math.round(slab.height / this.slabThickness);
            
            if (targets.includes(index)) {
                const tickY = slab.y;
                this.ctx.strokeStyle = 'rgba(251, 191, 36, 0.4)';
                this.ctx.lineWidth = 2 * compScale;
                this.ctx.beginPath();
                this.ctx.moveTo(startX - (12 * compScale), tickY); 
                this.ctx.lineTo(startX + (12 * compScale), tickY);
                this.ctx.stroke();
                this.ctx.fillText(`${runningSum}`, startX + (25 * compScale), tickY + (6 * compScale));
            }
        });
        this.ctx.restore();
    }

    async gameOver() {
        this.gameState = 'GAMEOVER'; this.soundManager.playThud(); this.shake = 40;
        document.getElementById('score-container').classList.add('visible');

        const first = this.slabs[0]; const last = this.slabs[this.slabs.length - 1];
        const height = (first.y + this.slabThickness) - last.y;

        // --- MINIMAL COMPOSITION: Center tower frame, scale to fit nicely in between ---
        const targetScale = Math.min(1.1, (this.canvas.height * 0.7) / height);
        if (typeof gsap !== 'undefined') {
            gsap.to(this.camera, {
                targetScale: targetScale,
                yOffset: (this.canvas.height * 0.5), // Dead center
                xOffset: 0, // No sidebar/split shift
                duration: 2,
                ease: "expo.out"
            });
        }
        this.gameOverScreen.classList.add('active');

        // Check if Top 10
        if (this.score > 0 && this.firebaseInitialized) {
            try {
                const snapshot = await this.db.collection("leaderboard")
                    .orderBy("score", "desc")
                    .limit(10)
                    .get();
                
                let isTop10 = false;
                if (snapshot.size < 10) {
                    isTop10 = true;
                } else {
                    const tenPercentile = snapshot.docs[9].data().score;
                    if (this.score > tenPercentile) isTop10 = true;
                }

                if (isTop10) {
                    console.log("🏆 TOP 10 QUALIFIED! Score:", this.score);
                    // CELEBRATION!
                    setTimeout(() => {
                        this.soundManager.playJackpot();
                        this.spawnCelebration();
                        this.openNameEntry();
                    }, 600); // Wait for tower zoom to finish
                } else {
                    console.log("🍞 Solid run, but not Top 10. Min needed was:", snapshot.docs[9] ? snapshot.docs[9].data().score : 0);
                }
            } catch (e) {
                console.error("Top 10 check failed, defaulting to celebrate:", e);
                // Fallback: Celebrate anyway if score is > 0
                if (this.score > 0) {
                    setTimeout(() => {
                        this.soundManager.playJackpot();
                        this.spawnCelebration();
                        this.openNameEntry();
                    }, 600);
                }
            }
        } else {
            console.log("🚫 Score 0 or Firebase not ready.");
        }
    }

    spawnCelebration() {
        const count = 100;
        const colors = ['#fbbf24', '#fef3c7', '#d97706', '#ffffff'];
        for (let i = 0; i < count; i++) {
            const x = Math.random() * this.canvas.width;
            const p = new Particle(x, this.canvas.height + 50, colors[Math.floor(Math.random() * colors.length)]);
            p.vy = -Math.random() * 25 - 10;
            p.vx = (Math.random() - 0.5) * 15;
            this.topParticles.push(p);
        }
    }

    openNameEntry() {
        document.getElementById('name-entry-overlay').classList.add('active');
        document.getElementById('player-name').focus();
    }

    closeNameEntry() {
        document.getElementById('name-entry-overlay').classList.remove('active');
    }

    async submitCurrentScore() {
        const nameInput = document.getElementById('player-name');
        const name = nameInput.value.trim() || "BREAD LOVER";
        const btn = document.getElementById('submit-score-btn');

        if (!this.firebaseInitialized) {
            alert("Firebase not configured. Please see instructions!");
            return;
        }

        btn.disabled = true;
        btn.textContent = "SAVING...";

        try {
            await this.db.collection("leaderboard").add({
                name: name,
                score: this.score,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            
            // Transition to leaderboard
            nameInput.value = "";
            this.closeNameEntry();
            this.showLeaderboard();
        } catch (e) {
            console.error("Score Save Error:", e);
            alert("Failed to save score. Check console.");
            btn.disabled = false;
            btn.textContent = "SUBMIT TO GLOBAL";
        }
    }

    async showLeaderboard() {
        const overlay = document.getElementById('leaderboard-overlay');
        const list = document.getElementById('leaderboard-list');
        const scoreContainer = document.getElementById('score-container');

        list.innerHTML = '<div class="leaderboard-entry"><span class="entry-name">LOADING BREAD DATA...</span></div>';
        
        overlay.classList.add('active');
        if (scoreContainer) scoreContainer.classList.remove('visible');

        if (!this.firebaseInitialized) {
            list.innerHTML = '<div class="leaderboard-entry"><span class="entry-name">FIREBASE NOT SETUP</span></div>';
            return;
        }

        try {
            const snapshot = await this.db.collection("leaderboard")
                .orderBy("score", "desc")
                .limit(10)
                .get();

            list.innerHTML = "";
            let rank = 1;
            snapshot.forEach(doc => {
                const data = doc.data();
                const item = document.createElement('div');
                item.className = 'leaderboard-entry';
                item.innerHTML = `
                    <span class="entry-rank">#${rank++}</span>
                    <span class="entry-name">${data.name || 'ANONYMOUS'}</span>
                    <span class="entry-score">${data.score}</span>
                `;
                list.appendChild(item);
            });

            if (snapshot.empty) {
                list.innerHTML = '<div class="leaderboard-entry"><span class="entry-name">NO SCORES YET!</span></div>';
            }
        } catch (e) {
            console.error("Fetch Error:", e);
            list.innerHTML = '<div class="leaderboard-entry"><span class="entry-name">ERROR FETCHING SCORES</span></div>';
        }
    }

    hideLeaderboard() {
        document.getElementById('leaderboard-overlay').classList.remove('active');
        // Bring score back if we are still in Game Over
        if (this.gameState === 'GAMEOVER') {
            document.getElementById('score-container').classList.add('visible');
        }
    }

    showMenu() {
        this.gameState = 'START';
        this.startScreen.classList.add('active');
        this.gameOverScreen.classList.remove('active');
        document.getElementById('score-container').classList.remove('visible');
        
        // --- CLEANUP: Proper game world wipe ---
        this.slabs = [];
        this.debris = [];
        this.particles = [];
        this.topParticles = [];
        this.floatingTexts = [];
        this.currentSlab = null;
        this.score = 0;
        this.displayScore = 0;
        this.scoreValue.textContent = "0";

        // --- CAMERA RESET: Back to base view ---
        this.camera = { x: 0, targetX: 0, y: 0, targetY: 0, scale: 1, targetScale: 1, yOffset: 0, xOffset: 0 };
        
        // Reset UI states
        this.closeNameEntry();
        
        // Reset submit button state
        const submitBtn = document.getElementById('submit-score-btn');
        if (submitBtn) {
            submitBtn.disabled = false;
            submitBtn.textContent = "SUBMIT TO GLOBAL";
        }
    }

    animate() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        if (this.shake > 0) {
            this.ctx.save();
            this.ctx.translate(Math.random() * this.shake - this.shake / 2, Math.random() * this.shake - this.shake / 2);
            this.shake *= 0.85; // Faster decay (0.85 instead of 0.95) for snappier feedback
        }

        this.camera.y += (this.camera.targetY - this.camera.y) * 0.1;

        this.ctx.save();
        const first = this.slabs[0];
        const towerCenterX = first ? first.x + (first.width / 2) : this.canvas.width / 2;
        const horizontalShift = (this.canvas.width / 2) - towerCenterX;

        if (this.gameState === 'GAMEOVER') {
            const last = this.slabs[this.slabs.length - 1];
            const towerHeight = (first.y + this.slabThickness) - last.y;

            // ANTI-OVERLAP ENGINE: Measure available vertical space between UI elements
            const scoreRect = document.getElementById('score-container').getBoundingClientRect();
            // Use the top-most button for framing
            const topBtn = document.getElementById('restart-button');
            const btnRect = topBtn.getBoundingClientRect();
            const availableGap = (btnRect.top - scoreRect.bottom) - 40; // 40px safety padding
            
            // SELF-RESIZE: Zoom to exactly fit the gap with 5% extra clearance
            const dynamicTargetScale = Math.min(1.0, (availableGap * 0.95) / towerHeight);
            this.camera.targetScale = dynamicTargetScale; 

            // DYNAMIC CENTER: Always target the live midpoint of the available gap
            this.camera.yOffset = scoreRect.bottom + (availableGap / 2) + 20; 
            const towerCenterY = (first.y + (last.y - first.y) / 2);

            // Draw Ruler before scaling so it anchors correctly
            this.ctx.translate(this.canvas.width / 2 + this.camera.xOffset, this.camera.yOffset);
            this.ctx.scale(this.camera.targetScale, this.camera.targetScale);
            this.ctx.translate(-towerCenterX, -towerCenterY);
            this.drawRuler(this.camera.targetScale);
        } else {
            // Apply dynamic horizontal centering in PLAYING mode
            if (first) {
                const last = this.slabs[this.slabs.length - 1];
                const targetScreenY = this.canvas.height * 0.65;
                this.camera.targetY = -(last.y - targetScreenY);
            }
            this.ctx.translate(horizontalShift, this.camera.y);
        }

        // Draw Game World
        this.slabs.forEach(slab => slab.draw(this.ctx));
        if (this.currentSlab && this.gameState === 'PLAYING') {
            const last = this.slabs[this.slabs.length - 1];
            this.currentSlab.update(last.x, last.width);
            this.currentSlab.draw(this.ctx);
        }

        // Update & Filter Effects
        this.debris = this.debris.filter(d => {
            const alive = d.update();
            if (alive) d.draw(this.ctx);
            return alive;
        });

        this.particles = this.particles.filter(p => {
            const alive = p.update();
            if (alive) p.draw(this.ctx);
            return alive;
        });

        this.topCtx.clearRect(0, 0, this.topCanvas.width, this.topCanvas.height);

        this.topParticles = this.topParticles.filter(p => {
            const alive = p.update();
            if (alive) p.draw(this.topCtx); // Render only celebrations on top canvas
            return alive;
        });

        this.floatingTexts = this.floatingTexts.filter(t => {
            t.update();
            if (t.alive) t.draw(this.ctx);
            return t.alive;
        });

        this.ctx.restore();
        if (this.shake > 0) this.ctx.restore();

        // Increment Display Score
        if (this.displayScore < this.score) {
            this.displayScore = Math.min(this.score, this.displayScore + Math.ceil((this.score - this.displayScore) * 0.1));
            this.scoreValue.textContent = this.displayScore;
            if (this.finalScoreValue) this.finalScoreValue.textContent = this.displayScore;
        }

        requestAnimationFrame(() => this.animate());
    }
}
window.onload = () => new Game();
