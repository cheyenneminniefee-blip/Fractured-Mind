// Sectional Title: Tilemap Matrix Grid Engine (game.js) - 2026-05-18

// 1. Core Engine Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const container = document.getElementById("game-container");

// Dynamic Resolution Matcher
canvas.width = container.clientWidth - 4;
canvas.height = container.clientHeight - 4;

// 2. Fetch data from EJS handoff
const userProfile = window.GAME_STATE.playerProfile;

// Track active room loading transactions to guard against repetitive calls
let isTransitioning = false;
let isChatting = false;

// 3. Grid Configuration (0 = Air, 1 = Wall, 4 = Memory Entity NPC)
// Changed to 'let' to allow completely dynamic overwrite states!
let levelGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// Re-allocated to lets to stay dynamic across room shifts
let gridRows = levelGrid.length;
let gridCols = levelGrid[0].length;

const viewportCols = 20;
let tileWidth = canvas.width / viewportCols;
let tileHeight = canvas.height / gridRows;

let levelWidth = gridCols * tileWidth;
let levelHeight = gridRows * tileHeight;

const camera = { x: 0, y: 0 };

const scaleX = tileWidth / 40;
const scaleY = tileHeight / 37.5;
// Sectional Title: Combat & Anomaly Engine Arrays - 2026-05-19

const projectiles = []; // Tracks ranged attacks
let activeMeleeHitbox = null; // Tracks the current sword swing
let meleeCooldown = 0;
let rangedCooldown = 0;

const ghosts = []; // Tracks active enemies

const cracks = [
    {
        x: canvas.width * 0.75,
        y: canvas.height * 0.15,
        width: 60 * scaleX,
        height: 80 * scaleY,
        color: "#ff00ff",
        spawnTimer: 0,
        spawnRate: 180,
        isSealed: false,
        sealProgress: 0, // NEW: Tracks how long the player has held the beam
        sealMax: 120, // NEW: Requires 2 straight seconds (120 frames at 60fps)
    },
];

// --- NEW: Progression & Boss Tracking Variables ---
let levelCount = 1; // Tracks how many rooms the player has cleared
const upgradesOnMap = []; // Tracks physical upgrade items on the floor
let boss = null; // Holds the boss entity when spawned

// 4. Structural Array Compilers
const platforms = [];
const npcs = [];

// Clean modular compilation routine used both on startup and dynamic transitions
function compileStructuralBlocks() {
    platforms.length = 0;
    npcs.length = 0;

    for (let row = 0; row < gridRows; row++) {
        for (let col = 0; col < gridCols; col++) {
            if (levelGrid[row][col] === 1) {
                platforms.push({
                    x: col * tileWidth,
                    y: row * tileHeight,
                    width: tileWidth,
                    height: tileHeight,
                    color: "#1f1f2e",
                });
            } else if (levelGrid[row][col] === 4) {
                npcs.push({
                    x: col * tileWidth,
                    y: row * tileHeight,
                    width: tileWidth,
                    height: tileHeight,
                    color: "#ffff00",
                });
            }
        }
    }
}

// Execute baseline structural compilation on runtime start
compileStructuralBlocks();

// 5. Responsive Platformer Player Object
const player = {
    x: tileWidth * 3, // Spawns 2 tiles in from the left wall
    y: canvas.height - tileHeight * 2,

    // Size scales directly with screen real estate
    width: 25 * scaleX,
    height: 25 * scaleY,

    color: userProfile.auraColor || "#ffffff",

    // Horizontal forces scale with horizontal tile changes
    speed: 0.6 * scaleX,
    maxSpeed: 4 * scaleX,
    velocityX: 0,

    // Vertical forces scale with vertical tile changes
    velocityY: 0,
    gravity: 0.4 * scaleY,
    jumpStrength: -9.5 * scaleY,
    friction: 0.85,
    isGrounded: false,
    facingRight: true, // NEW: Tracks which way the player is looking
    maxHealth: 100,
    currentHealth: 100,
    corruptionLevel: 0, // Tracks 0 to 100
    isLockedOut: false, // Triggers when Corruption hits 100
    invincibilityTimer: 0, // Prevents instant multi-hit deaths
};

// 6. Track Keyboard Input State
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    " ": false,
    j: false, // Melee Attack
    k: false, // Ranged Attack
    e: false, // Interact / Seal Crack
};

// Sectional Title: Mouse State & Aiming Tracking - 2026-05-19

const mouse = {
    x: 0,
    y: 0,
    leftDown: false,
    rightDown: false,
    leftJustPressed: false,
};

// Track mouse position relative to the canvas
canvas.addEventListener("mousemove", (e) => {
    const rect = canvas.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
});

// Track mouse clicks
canvas.addEventListener("mousedown", (e) => {
    if (e.button === 0) {
        mouse.leftDown = true;
        mouse.leftJustPressed = true; // Captures the exact frame they clicked
    }
    if (e.button === 2) mouse.rightDown = true;
});

canvas.addEventListener("mouseup", (e) => {
    if (e.button === 0) mouse.leftDown = false;
    if (e.button === 2) mouse.rightDown = false;
});

// Prevent the right-click menu from popping up and ruining the game
canvas.addEventListener("contextmenu", (e) => e.preventDefault());

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

// 7. Mathematical Engine Physics & Tilemap Collisions
// 7. Mathematical Engine Physics & Solid Block Collisions
function updatePhysics() {
    // 1. Horizontal Acceleration & Friction
    if (keys.a) {
        player.velocityX -= player.speed;
        player.facingRight = false;
    }
    if (keys.d) {
        player.velocityX += player.speed;
        player.facingRight = true;
    }

    player.velocityX *= player.friction;

    if (player.velocityX > player.maxSpeed) player.velocityX = player.maxSpeed;
    if (player.velocityX < -player.maxSpeed) player.velocityX = -player.maxSpeed;

    // 2. Vertical Gravity & Jumping
    player.velocityY += player.gravity;

    if (keys[" "] && player.isGrounded) {
        player.velocityY = player.jumpStrength;
        player.isGrounded = false;
    }

    // X-Axis Movement & Collision Resolution
    player.x += player.velocityX;
    platforms.forEach((platform) => {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        ) {
            if (player.velocityX > 0) {
                player.x = platform.x - player.width;
                player.velocityX = 0;
            } else if (player.velocityX < 0) {
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    });

    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    } else if (player.x + player.width > levelWidth) {
        player.x = levelWidth - player.width;
        player.velocityX = 0;
    }

    // Y-Axis Movement & Collision Resolution
    player.y += player.velocityY;
    player.isGrounded = false;

    platforms.forEach((platform) => {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        ) {
            if (player.velocityY > 0) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
            } else if (player.velocityY < 0) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
        }
    });

    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
    }

    // Camera follow mechanics and limits
    camera.x = player.x + player.width / 2 - canvas.width / 2;
    if (camera.x < 0) camera.x = 0;
    if (camera.x > levelWidth - canvas.width) camera.x = levelWidth - canvas.width;

    // 3. AI-Procedural Room Transition: Hitting the Right Edge
    // 3. AI-Procedural Room Transition: Hitting the Right Edge
    if (player.x + player.width >= levelWidth && !isTransitioning) {
        isTransitioning = true;
        player.velocityX = 0;
        player.velocityY = 0;

        // Advance room progression tracking counter
        levelCount++;

        // Shift route to Mirror Boss encounter logic once player hits the 4th room threshold
        let endpoint = levelCount >= 4 ? "/api/generate-boss-level" : "/api/generate-level";
        console.log(`[Fractured Mind] Compiling dynamic matrix grid via AI... Loading Room ${levelCount}. Route: ${endpoint}`);

        // Clean out active actor instances and parameters from the previous level matrix
        ghosts.length = 0;
        projectiles.length = 0;
        cracks.length = 0;
        upgradesOnMap.length = 0; // Reset loose drops on previous screen

        // Execute unified endpoint handshake payload extraction
        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ difficulty: "Medium" }),
        })
            .then((response) => response.json())
            .then((aiData) => {
                // If the server explicitly sent an error message back
                if (aiData.error) {
                    alert("System anomaly detected: " + aiData.error);
                    window.location.href = "/"; // Kick them back to login
                    return;
                }
                // Override map architecture grids with response matrix dimensions
                if (aiData.grid && Array.isArray(aiData.grid)) {
                    levelGrid = aiData.grid;
                    gridRows = levelGrid.length;
                    gridCols = levelGrid[0].length;
                    tileWidth = canvas.width / viewportCols;
                    tileHeight = canvas.height / gridRows;
                    levelWidth = gridCols * tileWidth;
                    levelHeight = gridRows * tileHeight;
                }

                // Re-compile platforms and NPCs layout boundaries
                compileStructuralBlocks();

                // --- BRANCH A: PROCESS BOSS TELEMETRY ENCOUNTER ---
                if (aiData.bossTelemetry) {
                    boss = {
                        x: tileWidth * 20, // Instantiate reflection exactly in center court of room
                        y: tileHeight * 5,
                        width: 30 * scaleX,
                        height: 30 * scaleY,
                        hp: aiData.bossTelemetry.health,
                        maxHp: aiData.bossTelemetry.maxHealth,
                        speed: aiData.bossTelemetry.speed * scaleX,
                        damage: aiData.bossTelemetry.damage,
                        abilities: aiData.bossTelemetry.abilities,
                        color: "#ff0000", // Crimson threat profile indicator mapping
                        velocityX: 0,
                        velocityY: 0,
                        isGrounded: false,
                        attackCooldown: 0
                    };
                    console.log("[Fractured Mind] WARNING: Mirror Boss entity initialized.", aiData.bossTelemetry);
                } 
                // --- BRANCH B: PROCESS STANDARD ADVENTURE LAYER ---
                else {
                    if (aiData.cracks && Array.isArray(aiData.cracks)) {
                        aiData.cracks.forEach((aiCrack) => {
                            cracks.push({
                                x: aiCrack.x,
                                y: aiCrack.y,
                                width: 60 * scaleX,
                                height: 80 * scaleY,
                                color: "#ff00ff",
                                spawnTimer: 0,
                                spawnRate: aiCrack.spawnRate,
                                isSealed: false,
                                sealProgress: 0,
                                sealMax: 120,
                            });
                        });
                    }

                    // 30% procedural probability baseline check to drop a physical upgrade asset
                    if (Math.random() > 0.7) {
                        const types = ["Prismatic Edge", "Speed Thrusters", "Quantum Core"];
                        upgradesOnMap.push({
                            x: tileWidth * 15,
                            y: tileHeight * 8,
                            width: 20 * scaleX,
                            height: 20 * scaleY,
                            type: types[Math.floor(Math.random() * types.length)],
                            color: "#00ffcc"
                        });
                    }
                    console.log(`[Fractured Mind] New layout built with ${cracks.length} cracks.`);
                }

                // Snap avatar vector boundaries back to starting baseline coordinates
                player.x = tileWidth * 3;
                player.y = canvas.height - tileHeight * 2;
                camera.x = 0;

                isTransitioning = false;
            })
            .catch((err) => {
                console.error("Procedural matrix load failed.", err);

                // Fallback escape hatch configuration to block runtime engine freezes
                player.x = tileWidth * 3;
                player.y = canvas.height - tileHeight * 2;
                camera.x = 0;
                isTransitioning = false;
            });
    }
}

// Sectional Title: Milestone 7 - Combat & AI Physics - 2026-05-19

function updateCombat() {
    if (meleeCooldown > 0) meleeCooldown--;
    if (rangedCooldown > 0) rangedCooldown--;

    // Determine what happens when the Left Mouse Button is clicked
    if (mouse.leftJustPressed) {
        // 1. RANGED ATTACK (If Right-Click is held to aim)
        // 1. RANGED ATTACK (If Right-Click is held to aim)
        if (mouse.rightDown && rangedCooldown === 0) {
            let worldMouseX = mouse.x + camera.x; // Shift mouse to world space

            // --- NEW: Check if we are aiming at a crack ---
            let aimingAtCrack = cracks.some((crack) => {
                return (
                    !crack.isSealed &&
                    worldMouseX > crack.x &&
                    worldMouseX < crack.x + crack.width &&
                    mouse.y > crack.y &&
                    mouse.y < crack.y + crack.height
                );
            });

            // Only fire the projectile if we are NOT aiming at a crack!
            if (!aimingAtCrack) {
                // Calculate the exact angle between the player and the mouse cursor
                let startX = player.x + player.width / 2;
                let startY = player.y + player.height / 2;
                let angle = Math.atan2(mouse.y - startY, worldMouseX - startX); // USES WORLD MOUSE

                let projectileSpeed = 12 * scaleX;

                projectiles.push({
                    x: startX,
                    y: startY,
                    width: 15 * scaleX,
                    height: 15 * scaleX, // Made it a square for angled visibility
                    velocityX: Math.cos(angle) * projectileSpeed,
                    velocityY: Math.sin(angle) * projectileSpeed,
                });
                rangedCooldown = 30;
            }
        }

        // 2. MELEE ATTACK (If Right-Click is NOT held)
        else if (!mouse.rightDown && meleeCooldown === 0) {
            // Figure out which way we are swinging based on inputs
            let swingDir = player.facingRight ? "right" : "left";
            if (keys.w) swingDir = "up";
            else if (keys.s && !player.isGrounded)
                swingDir = "down"; // Only swing down in air
            else if (keys.a) swingDir = "left";
            else if (keys.d) swingDir = "right";

            // Construct the hitbox based on direction
            let hX, hY, hW, hH;

            if (swingDir === "right") {
                hW = 40 * scaleX;
                hH = player.height + 20 * scaleY;
                hX = player.x + player.width;
                hY = player.y - 10 * scaleY;
            } else if (swingDir === "left") {
                hW = 40 * scaleX;
                hH = player.height + 20 * scaleY;
                hX = player.x - hW;
                hY = player.y - 10 * scaleY;
            } else if (swingDir === "up") {
                hW = player.width + 20 * scaleX;
                hH = 40 * scaleY;
                hX = player.x - 10 * scaleX;
                hY = player.y - hH;
            } else if (swingDir === "down") {
                hW = player.width + 20 * scaleX;
                hH = 40 * scaleY;
                hX = player.x - 10 * scaleX;
                hY = player.y + player.height;
            }

            activeMeleeHitbox = {
                x: hX,
                y: hY,
                width: hW,
                height: hH,
                duration: 15,
                direction: swingDir,
                hitEntities: [], // NEW: The "Hit List" to prevent double damage!
            };
            meleeCooldown = 40;
        }
    }

    // Process Active Melee Lingering & Tracking
    if (activeMeleeHitbox) {
        activeMeleeHitbox.duration--;

        // Keep the hitbox glued to the player as they move
        if (activeMeleeHitbox.direction === "right") {
            activeMeleeHitbox.x = player.x + player.width;
            activeMeleeHitbox.y = player.y - 10 * scaleY;
        } else if (activeMeleeHitbox.direction === "left") {
            activeMeleeHitbox.x = player.x - activeMeleeHitbox.width;
            activeMeleeHitbox.y = player.y - 10 * scaleY;
        } else if (activeMeleeHitbox.direction === "up") {
            activeMeleeHitbox.x = player.x - 10 * scaleX;
            activeMeleeHitbox.y = player.y - activeMeleeHitbox.height;
        } else if (activeMeleeHitbox.direction === "down") {
            activeMeleeHitbox.x = player.x - 10 * scaleX;
            activeMeleeHitbox.y = player.y + player.height;
        }

        if (activeMeleeHitbox.duration <= 0) activeMeleeHitbox = null;
    }

    // Move Projectiles
    for (let i = projectiles.length - 1; i >= 0; i--) {
        let p = projectiles[i];
        p.x += p.velocityX;
        p.y += p.velocityY; // Now moving on both X and Y axes!

        // NEW: Check against the camera's position instead of absolute 0
        if (
            p.x < camera.x ||
            p.x > camera.x + canvas.width ||
            p.y < 0 ||
            p.y > canvas.height
        ) {
            projectiles.splice(i, 1);
        }
    }

    // Reset the click trigger at the very end of the combat frame
    mouse.leftJustPressed = false;
}

function updateGhosts() {
    // 1. Process Minor Ghost Entities Only
    for (let i = ghosts.length - 1; i >= 0; i--) {
        let ghost = ghosts[i];

        // Pathfinding: Direct Homing Vector
        let dx = player.x + player.width / 2 - (ghost.x + ghost.width / 2);
        let dy = player.y + player.height / 2 - (ghost.y + ghost.height / 2);
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            ghost.x += (dx / distance) * ghost.speed;
            ghost.y += (dy / distance) * ghost.speed;
        }

        // Ghost Damages Player
        if (player.invincibilityTimer > 0) player.invincibilityTimer--;

        if (
            player.invincibilityTimer === 0 &&
            ghost.x < player.x + player.width &&
            ghost.x + ghost.width > player.x &&
            ghost.y < player.y + player.height &&
            ghost.y + ghost.height > player.y
        ) {
            player.currentHealth -= 10;
            player.corruptionLevel = Math.min(100, player.corruptionLevel + 15);
            player.invincibilityTimer = 60;

            cracks.forEach((crack) => (crack.sealProgress = 0));

            player.velocityY = -6 * scaleY; 
            player.velocityX = player.x < ghost.x ? -10 * scaleX : 10 * scaleX;

            if (player.currentHealth <= 0) {
                alert("SYSTEM FAILURE: Vital signs lost. Memory fragmented.");
                player.x = tileWidth * 3;
                player.y = canvas.height - tileHeight * 2;
                camera.x = 0;
                player.currentHealth = player.maxHealth;
                player.corruptionLevel = 0;
            }
        }

        // Minor Ghost Combat Resolution: Melee Hits
        if (
            activeMeleeHitbox &&
            ghost.x < activeMeleeHitbox.x + activeMeleeHitbox.width &&
            ghost.x + ghost.width > activeMeleeHitbox.x &&
            ghost.y < activeMeleeHitbox.y + activeMeleeHitbox.height &&
            ghost.y + ghost.height > activeMeleeHitbox.y
        ) {
            if (!activeMeleeHitbox.hitEntities.includes(ghost)) {
                ghost.hp -= 10;
                activeMeleeHitbox.hitEntities.push(ghost);

                let knockbackForce = 20 * scaleX;
                if (activeMeleeHitbox.direction === "right") ghost.x += knockbackForce;
                if (activeMeleeHitbox.direction === "left") ghost.x -= knockbackForce;
                if (activeMeleeHitbox.direction === "up") ghost.y -= knockbackForce;
                if (activeMeleeHitbox.direction === "down") {
                    ghost.y += knockbackForce;
                    player.velocityY = player.jumpStrength * 0.8; // Pogo mechanic
                }
            }
        }

        // Minor Ghost Combat Resolution: Projectile Hits
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            if (
                ghost.x < p.x + p.width &&
                ghost.x + ghost.width > p.x &&
                ghost.y < p.y + p.height &&
                ghost.y + ghost.height > p.y
            ) {
                ghost.hp -= 5;
                projectiles.splice(j, 1);
            }
        }

        // Death Check for Minor Ghost
        if (ghost.hp <= 0) {
            ghosts.splice(i, 1);
            player.corruptionLevel = Math.max(0, player.corruptionLevel - 5);
        }
    }

    // 2. OUTSIDE THE LOOP: Process Boss Combat Resolution Inderpendently
    if (boss) {
        // Handle Melee Sword Hits on the Boss Entity
        if (activeMeleeHitbox) {
            if (
                boss.x < activeMeleeHitbox.x + activeMeleeHitbox.width &&
                boss.x + boss.width > activeMeleeHitbox.x &&
                boss.y < activeMeleeHitbox.y + activeMeleeHitbox.height &&
                boss.y + boss.height > activeMeleeHitbox.y
            ) {
                if (!activeMeleeHitbox.hitEntities.includes(boss)) {
                    boss.hp -= 25; // Slices deal 25 combat value
                    activeMeleeHitbox.hitEntities.push(boss);

                    if (boss.hp <= 0) {
                        alert("THE MIRROR SHATTERS. Dynamic loop terminated. Mind Restored.");
                        boss = null;
                        window.location.href = "/";
                    }
                }
            }
        }

        // Handle Projectile Contacts on the Boss Entity
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            if (
                boss.x < p.x + p.width &&
                boss.x + boss.width > p.x &&
                boss.y < p.y + p.height &&
                boss.y + boss.height > p.y
            ) {
                boss.hp -= 12; // Projectiles deal 12 combat value
                projectiles.splice(j, 1);

                if (boss.hp <= 0) {
                    alert("THE MIRROR SHATTERS. Dynamic loop terminated. Mind Restored.");
                    boss = null;
                    window.location.href = "/";
                }
            }
        }
    }
}

function updateCracks() {
    cracks.forEach((crack) => {
        if (crack.isSealed) return; // Skip logic if already sealed

        // Spawn Ghosts
        crack.spawnTimer++;
        if (crack.spawnTimer >= crack.spawnRate) {
            ghosts.push({
                x: crack.x + crack.width / 2,
                y: crack.y + crack.height / 2,
                width: 25 * scaleX,
                height: 35 * scaleY,
                hp: 30,
                speed: 1.5 * scaleX,
                hitThisSwing: false,
            });
            crack.spawnTimer = 0;
        }

        // Check if player is penalized
        player.isLockedOut = player.corruptionLevel >= 100;

        // --- LASER SEALING LOGIC (With Lockout Check) ---
        // Verify they are aiming, firing, AND not locked out
        if (!player.isLockedOut && mouse.rightDown && mouse.leftDown) {
            let worldMouseX = mouse.x + camera.x; // Shift mouse to world space

            // Check if hovering over crack
            if (
                worldMouseX > crack.x &&
                worldMouseX < crack.x + crack.width &&
                mouse.y > crack.y &&
                mouse.y < crack.y + crack.height
            ) {
                crack.sealProgress++;

                if (crack.sealProgress >= crack.sealMax) {
                    crack.isSealed = true;
                    // Massive corruption cleanse for sealing a crack!
                    player.corruptionLevel = Math.max(
                        0,
                        player.corruptionLevel - 20,
                    );
                    console.log("[Fractured Mind] Anomaly Sealed via Laser.");
                }
            } else {
                crack.sealProgress = 0;
            }
        } else {
            crack.sealProgress = 0;
        }
    });
}

function updateUpgrades() {
    for (let i = upgradesOnMap.length - 1; i >= 0; i--) {
        let upg = upgradesOnMap[i];

        // Dynamic AABB Overlap check against Player avatar block bounds
        if (
            player.x < upg.x + upg.width && player.x + player.width > upg.x &&
            player.y < upg.y + upg.height && player.y + player.height > upg.y
        ) {
            console.log(`[Progression Synchronizer] Upgrade Secured: ${upg.type}`);

            // Dispatch synchronization handshake packet to flat-file database backend
            fetch('/api/collect-upgrade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ upgradeName: upg.type })
            });

            // Instantaneous local avatar stat injection overrides
            if (upg.type === "Quantum Core") {
                player.maxHealth += 25;
                player.currentHealth = player.maxHealth; // Restore vital status thresholds
            } else if (upg.type === "Speed Thrusters") {
                player.speed += 0.15 * scaleX;
                player.maxSpeed += 1.5 * scaleX;
            }

            upgradesOnMap.splice(i, 1);
        }
    }
}

function updateBossAI() {
    if (!boss) return; // Exit loop processing routine if entity is clear

    // Apply baseline environmental gravity velocity vector to boss entity
    boss.velocityY += player.gravity;

    // Rudimentary absolute tracking pathfinding computation layout
    let dx = (player.x + player.width / 2) - (boss.x + boss.width / 2);
    boss.velocityX = (dx > 0) ? boss.speed : -boss.speed;

    // --- WEAPONIZED COPY ABILITY A: SPEED THRUSTERS/DASH SPRINT ---
    if (boss.abilities.hasDashSprint && Math.abs(dx) > 250 * scaleX) {
        boss.velocityX *= 2.2; // Accelerate traversal boundaries instantly
    }

    // --- WEAPONIZED COPY ABILITY B: QUANTUM CORE/HEALING SYSTEM ---
    if (boss.abilities.hasHealingCore && boss.hp < boss.maxHp) {
        boss.hp += 0.04; // Run steady incremental health regeneration state
    }

    // Process horizontal translations and bounding limits
    boss.x += boss.velocityX;
    if (boss.x < 0) boss.x = 0;
    if (boss.x + boss.width > levelWidth) boss.x = levelWidth - boss.width;

    // Process vertical translations and static platform matrix intersections
    boss.y += boss.velocityY;
    boss.isGrounded = false;

    platforms.forEach((platform) => {
        if (boss.x < platform.x + platform.width && boss.x + boss.width > platform.x &&
            boss.y < platform.y + platform.height && boss.y + boss.height > platform.y) {
            if (boss.velocityY > 0) {
                boss.y = platform.y - boss.height;
                boss.velocityY = 0;
                boss.isGrounded = true;
            }
        }
    });

    // Mirror jump command patterns if player tracks to an elevated tile platform height
    if (boss.isGrounded && player.y < boss.y - 40 * scaleY) {
        boss.velocityY = player.jumpStrength * 1.05;
    }

    // Process internal weapon attack execution cooldown states
    if (boss.attackCooldown > 0) boss.attackCooldown--;

    // --- WEAPONIZED COPY ABILITY C: PRISMATIC EDGE RANGE MULTIPLIER ---
    let threatRange = boss.abilities.hasExtendedRange ? 110 * scaleX : 55 * scaleX;

    if (boss.attackCooldown === 0 && Math.abs(dx) < threatRange && Math.abs(player.y - boss.y) < 80 * scaleY) {
        if (player.invincibilityTimer === 0) {
            player.currentHealth -= boss.damage;
            player.invincibilityTimer = 60;

            // Apply knockback vectors to the player
            player.velocityY = -6 * scaleY;
            player.velocityX = player.x < boss.x ? -10 * scaleX : 10 * scaleX;

            boss.attackCooldown = 90; // Provide 1.5 seconds recovery time before boss swings again
        }
    }
}

// 8. Canvas Graphics Painter Pipeline
// 8. Canvas Graphics Painter Pipeline
function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    ctx.save(); // --- SAVES THE SCREEN STATE ---
    ctx.translate(-camera.x, 0); // --- MOVES THE CAMERA ---

    // Draw compiled structural tiles from array
    ctx.shadowBlur = 0;
    platforms.forEach((platform) => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Highlight grid borders to make the blocks visually distinct
        ctx.strokeStyle = "#333344";
        ctx.lineWidth = 1;
        ctx.strokeRect(platform.x, platform.y, platform.width, platform.height);
    });

    // Draw Memory Entities (NPCs)
    npcs.forEach((npc) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffff00";
        ctx.fillStyle = npc.color;
        ctx.fillRect(npc.x, npc.y, npc.width, npc.height);

        let dx = player.x + player.width / 2 - (npc.x + npc.width / 2);
        let dy = player.y + player.height / 2 - (npc.y + npc.height / 2);
        if (Math.sqrt(dx * dx + dy * dy) < 100 * scaleX) {
            ctx.shadowBlur = 0; 
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${14 * scaleX}px 'Courier New', monospace`;
            ctx.textAlign = "center";
            // FIX: Updated text string to match the registered keyboard configuration file ['E']
            ctx.fillText("[E] Establish Link", npc.x + npc.width / 2, npc.y - 15 * scaleY);
        }
    });

    // Draw Cracks & Sealing Progress Bars
    cracks.forEach((crack) => {
        if (!crack.isSealed) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = crack.color;
            ctx.fillStyle = crack.color;
            ctx.beginPath();
            ctx.moveTo(crack.x, crack.y);
            ctx.lineTo(crack.x + crack.width / 2, crack.y + crack.height / 3);
            ctx.lineTo(crack.x + crack.width / 4, crack.y + crack.height / 2);
            ctx.lineTo(crack.x + crack.width, crack.y + crack.height);
            ctx.lineTo(crack.x + crack.width / 3, crack.y + crack.height / 1.5);
            ctx.closePath();
            ctx.fill();

            // NEW VISUAL FEEDBACK: Render Progress Bar if actively being sealed
            if (crack.sealProgress > 0) {
                ctx.shadowBlur = 0;
                // Background Bar
                ctx.fillStyle = "#222222";
                ctx.fillRect(crack.x, crack.y - 15 * scaleY, crack.width, 6 * scaleY);
                // Active Fill
                ctx.fillStyle = "#00ffff";
                ctx.fillRect(crack.x, crack.y - 15 * scaleY, crack.width * (crack.sealProgress / crack.sealMax), 6 * scaleY);
            }
        }
    });

    // Draw Upgrades on Map
    upgradesOnMap.forEach(upg => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = upg.color;
        ctx.fillStyle = upg.color;
        ctx.beginPath();
        ctx.moveTo(upg.x + upg.width/2, upg.y);
        ctx.lineTo(upg.x + upg.width, upg.y + upg.height/2);
        ctx.lineTo(upg.x + upg.width/2, upg.y + upg.height);
        ctx.lineTo(upg.x, upg.y + upg.height/2);
        ctx.closePath();
        ctx.fill();
    });

    // Draw Mirror Boss
    if (boss) {
        ctx.shadowBlur = 20;
        ctx.shadowColor = boss.color;
        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);

        // Boss Health Bar
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#222222";
        ctx.fillRect(boss.x - 10, boss.y - 20, boss.width + 20, 10);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(boss.x - 10, boss.y - 20, (boss.width + 20) * (boss.hp / boss.maxHp), 10);

        // FIX: Added optional chaining safety checks to guard engine loop cycles against undefined AI objects
        if (boss.abilities && boss.abilities.hasExtendedRange) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 2;
            ctx.strokeRect(boss.x - 30, boss.y - 30, boss.width + 60, boss.height + 60);
        }
    }

    // Draw Ghosts
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff4444";
    ctx.fillStyle = "rgba(255, 68, 68, 0.7)"; 
    ghosts.forEach((ghost) => ctx.fillRect(ghost.x, ghost.y, ghost.width, ghost.height));

    // --- DRAW AIMING & FIRING LASER SIGHT ---
    if (mouse.rightDown) {
        // Calculate if the crosshair is specifically hovering over an unsealed crack
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y;

        const isAimingAtCrack = cracks.some(crack => {
            return !crack.isSealed &&
                   worldMouseX >= crack.x &&
                   worldMouseX <= crack.x + crack.width &&
                   worldMouseY >= crack.y &&
                   worldMouseY <= crack.y + crack.height;
        });

        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
        ctx.lineTo(worldMouseX, worldMouseY);

        // The beam only goes full-power if firing AND properly aligned with a crack target
        if (mouse.leftDown && !player.isLockedOut && isAimingAtCrack) {
            ctx.shadowBlur = 15;
            ctx.shadowColor = "#00ffff";
            ctx.strokeStyle = "rgba(0, 255, 255, 0.9)"; // Solid hot beam
            ctx.lineWidth = 4 * scaleX;
            ctx.setLineDash([]); // Continuous beam
        } else {
            ctx.shadowBlur = 0;
            ctx.strokeStyle = "rgba(0, 255, 255, 0.4)"; // Faint tracking sight
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]); // Dashed guide line
        }
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash state for subsequent draw calls
    }

    // Draw Ranged Projectiles
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffff";
    ctx.fillStyle = "#ffffff";
    projectiles.forEach((p) => ctx.fillRect(p.x, p.y, p.width, p.height));

    // Draw Melee Arc
    if (activeMeleeHitbox) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ffffff";
        ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
        ctx.fillRect(activeMeleeHitbox.x, activeMeleeHitbox.y, activeMeleeHitbox.width, activeMeleeHitbox.height);
    }

    // Draw Player Avatar
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    ctx.restore(); // --- RESTORES SCREEN FOR UI DRAWING ---

    // UI Overlays (Health Bar)
    ctx.shadowBlur = 0; 
    ctx.fillStyle = "#222222";
    ctx.fillRect(20 * scaleX, 20 * scaleY, 200 * scaleX, 15 * scaleY); 
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(20 * scaleX, 20 * scaleY, 200 * scaleX * (player.currentHealth / player.maxHealth), 15 * scaleY);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(20 * scaleX, 20 * scaleY, 200 * scaleX, 15 * scaleY);

    // UI Overlays (Corruption Bar)
    ctx.fillStyle = "#222222";
    ctx.fillRect(20 * scaleX, 45 * scaleY, 200 * scaleX, 15 * scaleY);
    ctx.fillStyle = "#8a2be2";
    ctx.fillRect(20 * scaleX, 45 * scaleY, 200 * scaleX * (player.corruptionLevel / 100), 15 * scaleY);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(20 * scaleX, 45 * scaleY, 200 * scaleX, 15 * scaleY);
}

function gameLoop() {
    // CRITICAL FIX: Halt standard entity cycles if transitioning OR chatting
    if (!isTransitioning && !isChatting) {
        updatePhysics();
        updateCombat();
        updateGhosts();
        updateCracks();
        updateUpgrades(); // <--- REGISTERED IN PROCESSING FLOW
        updateBossAI();   // <--- REGISTERED IN PROCESSING FLOW
    }
    renderGraphics(); 
    requestAnimationFrame(gameLoop);
}

// Run engine initialization
gameLoop();

// Sectional Title: Milestone 9 - AI Dialogue Logic - 2026-05-19

const chatOverlay = document.getElementById("ai-chat-overlay");
const chatInput = document.getElementById("chat-input");
const chatHistory = document.getElementById("chat-history");
const sendBtn = document.getElementById("chat-send-btn");



// Toggle Chat with the 'T' key
// Toggle Chat with the 'T' key ONLY when near an NPC
window.addEventListener("keydown", (e) => {
        if ((e.key.toLowerCase() === "t" || e.key.toLowerCase() === "e") && !isChatting) {
        // --- NEW: Proximity Check ---
        let isNearNPC = false;

        npcs.forEach((npc) => {
            let dx = player.x + player.width / 2 - (npc.x + npc.width / 2);
            let dy = player.y + player.height / 2 - (npc.y + npc.height / 2);
            let distance = Math.sqrt(dx * dx + dy * dy);

            // If player is within interact range
            if (distance < 100 * scaleX) {
                isNearNPC = true;
            }
        });

        // Only open chat if the check passed!
        if (isNearNPC) {
            e.preventDefault();
            isChatting = true;
            chatOverlay.style.display = "flex";
            chatInput.focus();

            // Zero out player momentum
            player.velocityX = 0;
            keys.w = keys.a = keys.s = keys.d = keys[" "] = false;
        }
    }
    // Close Chat with Escape
    else if (e.key === "Escape" && isChatting) {
        closeChat();
    }
});

function closeChat() {
    isChatting = false;
    chatOverlay.style.display = "none";
    chatInput.value = ""; // Clear input field buffer
}

// Send Message Logic
async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Display Player Text
    chatHistory.innerHTML += `<p class="player-text"><strong>You:</strong> ${text}</p>`;
    chatInput.value = ""; // Clear box
    chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll down

    // Disable input while waiting for the AI
    chatInput.disabled = true;
    chatInput.placeholder = "Awaiting mental link...";

    try {
        const response = await fetch("/api/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                message: text,
                // EJS compiles template objects into plain text; safely pull from window variables or use the standard payload key 
                profile: typeof profile !== 'undefined' ? profile : null, 
            }),
        });

        const data = await response.json();

        // Display AI Text
        chatHistory.innerHTML += `<p class="ai-text"><strong>Memory Entity:</strong> ${data.response}</p>`;
    } catch (err) {
        chatHistory.innerHTML += `<p style="color:red;">[SYSTEM ERROR: CONNECTION LOST]</p>`;
    }

    // Re-enable input
    chatInput.disabled = false;
    chatInput.placeholder = "Transmit thought... (Press Enter to send)";
    chatInput.focus();
    chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Event Listeners for the Chat Box
sendBtn.addEventListener("click", sendChatMessage);
chatInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendChatMessage();
});

// VERY IMPORTANT: Prevent WASD keys from moving the player WHILE they are typing in the chat box!
window.addEventListener("keydown", (e) => {
    // CRITICAL FIX: If the player is focused on typing in the chat input box, 
    // do not flag game controls!
    if (document.activeElement === chatInput) return;

    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener("keyup", (e) => {
    if (document.activeElement === chatInput) return;

    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});
