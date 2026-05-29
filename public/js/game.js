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
// NEW: Load the admin parameters with safe fallbacks
// NEW: Load the admin parameters with true property-level fallbacks
const sysConfig = {
    levelsUntilBoss: 4,
    playerMaxHealth: 100,
    playerMeleeDamage: 10,
    enemyBaseHealth: 30,
    enemyDamage: 10,
    // Overwrites the defaults above ONLY if the server provided specific properties
    ...(window.GAME_STATE.adminConfig || {}),
};

// Track active room loading transactions to guard against repetitive calls
let isTransitioning = false;
let isChatting = false;

// 3. Grid Configuration (0 = Air, 1 = Wall, 4 = Memory Entity NPC)
// Changed to 'let' to allow completely dynamic overwrite states!
let levelGrid = [
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
        0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        1, 1, 1, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
        0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        0, 1, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    ],
    [
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
        1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
    ],
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
let levelCount = 1;
const upgradesOnMap = [];
let boss = null;

// Add these to track the current run's stats!
let sessionKills = 0;
let sessionCracksClosed = 0;
let isVictoryTriggered = false; // Needed to prevent duplicate saves on boss death

// 4. Structural Array Compilers
const platforms = [];
const npcs = [];

const bossProjectiles = [];
let bossMeleeHitbox = null;

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
    maxHealth: sysConfig.playerMaxHealth,
    currentHealth: sysConfig.playerMaxHealth,
    corruptionLevel: 0, // Tracks 0 to 100
    isLockedOut: false, // Triggers when Corruption hits 100
    invincibilityTimer: 0, // Prevents instant multi-hit deaths

    // --- NEW: Dash & Wall-Jump Mechanics ---
    dashCooldown: 0, // Cooldown tracker in frames
    dashTimer: 0, // Tracks how long the active dash lasts
    isDashing: false, // Boolean state flag
    dashSpeed: 14 * scaleX, // Velocity applied during a dash
    isTouchingLeftWall: false, // Tracks wall collision from previous frame
    isTouchingRightWall: false, // Tracks wall collision from previous frame
};

const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    " ": false,
    j: false, // Melee Attack
    k: false, // Ranged Attack
    e: false, // Interact / Seal Crack
    shift: false, // NEW: Dash trigger
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
function updatePhysics() {
    // 1. Tick down Cooldowns & Manage Dash State
    if (player.dashCooldown > 0) player.dashCooldown--;

    if (player.isDashing) {
        player.dashTimer--;
        player.velocityY = 0; // Freeze gravity while dashing
        if (player.dashTimer <= 0) {
            player.isDashing = false;
        }
    }

    // 2. Trigger Dash Input (Shift Key)
    if (keys.shift && player.dashCooldown === 0 && !player.isDashing) {
        player.isDashing = true;
        player.dashTimer = 10; // Dash lasts 10 frames (~0.16 seconds)
        player.dashCooldown = 150; // 5 seconds * 60 FPS = 300 frames cooldown
        player.velocityY = 0; // Reset vertical velocity
        player.velocityX = player.facingRight
            ? player.dashSpeed
            : -player.dashSpeed;
    }

    // 3. Horizontal Acceleration & Friction (Skipped if Dashing)
    if (!player.isDashing) {
        if (keys.a) {
            player.velocityX -= player.speed;
            player.facingRight = false;
        }
        if (keys.d) {
            player.velocityX += player.speed;
            player.facingRight = true;
        }

        player.velocityX *= player.friction;

        if (player.velocityX > player.maxSpeed)
            player.velocityX = player.maxSpeed;
        if (player.velocityX < -player.maxSpeed)
            player.velocityX = -player.maxSpeed;
    }

    // 4. Vertical Gravity (Skipped if Dashing)
    if (!player.isDashing) {
        player.velocityY += player.gravity;
    }

    // 5. Jumping & Wall-Jumping Logic
    if (keys[" "]) {
        if (player.isGrounded) {
            // Standard Ground Jump
            player.velocityY = player.jumpStrength;
            player.isGrounded = false;
        } else {
            // Wall-Jump Check (Only if in mid-air and hugging a wall)
            if (player.isTouchingLeftWall) {
                player.velocityY = player.jumpStrength * 0.9; // Jump upward
                player.velocityX = player.maxSpeed * 1.4; // Kick off to the right
                player.facingRight = true;
                player.isTouchingLeftWall = false; // Consume the wall touch
            } else if (player.isTouchingRightWall) {
                player.velocityY = player.jumpStrength * 0.9; // Jump upward
                player.velocityX = -player.maxSpeed * 1.4; // Kick off to the left
                player.facingRight = false;
                player.isTouchingRightWall = false; // Consume the wall touch
            }
        }
    }

    // Reset wall touch state flags right before re-evaluating collisions this frame
    player.isTouchingLeftWall = false;
    player.isTouchingRightWall = false;

    // X-Axis Movement & Collision Resolution
    player.x += player.velocityX;
    platforms.forEach((platform) => {
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height - 1 &&
            player.y + player.height > platform.y + 1
        ) {
            if (player.velocityX > 0) {
                player.x = platform.x - player.width;
                player.velocityX = 0;
                if (player.isDashing) player.isDashing = false; // Stop dash on impact
                if (!player.isGrounded) player.isTouchingRightWall = true; // Register wall contact
            } else if (player.velocityX < 0) {
                player.x = platform.x + platform.width;
                player.velocityX = 0;
                if (player.isDashing) player.isDashing = false; // Stop dash on impact
                if (!player.isGrounded) player.isTouchingLeftWall = true; // Register wall contact
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
            player.x < platform.x + platform.width - 1 &&
            player.x + player.width > platform.x + 1 &&
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
    if (camera.x > levelWidth - canvas.width)
        camera.x = levelWidth - canvas.width;

    // AI-Procedural Room Transition
    if (player.x + player.width >= levelWidth && !isTransitioning && !boss) {
        // ... (Keep your room transition fetch logic exactly as it was written) ...
        isTransitioning = true;
        player.velocityX = 0;
        player.velocityY = 0;
        levelCount++;
        let endpoint = "/api/generate-level";
        let timeForBoss = levelCount >= sysConfig.levelsUntilBoss;
        ghosts.length = 0;
        projectiles.length = 0;
        cracks.length = 0;
        upgradesOnMap.length = 0;

        fetch(endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ difficulty: "Medium", isBoss: timeForBoss }),
        })
            .then((response) => response.json())
            .then((aiData) => {
                if (aiData.error) {
                    alert("System anomaly detected: " + aiData.error);
                    window.location.href = "/";
                    return;
                }
                if (aiData.grid && Array.isArray(aiData.grid)) {
                    levelGrid = aiData.grid;
                    gridRows = levelGrid.length;
                    gridCols = levelGrid[0].length;
                    tileWidth = canvas.width / viewportCols;
                    tileHeight = canvas.height / gridRows;
                    levelWidth = gridCols * tileWidth;
                    levelHeight = gridRows * tileHeight;
                }
                compileStructuralBlocks();
                if (aiData.bossTelemetry) {
                    const corruptionScale = 1 + player.corruptionLevel / 100;
                    boss = {
                        x: tileWidth * 15,
                        y: tileHeight * 5,
                        width: 30 * scaleX,
                        height: 30 * scaleY,
                        hp: 500 + aiData.bossTelemetry.health * corruptionScale,
                        maxHp:
                            500 +
                            aiData.bossTelemetry.maxHealth * corruptionScale,
                        damage:
                            5 + aiData.bossTelemetry.damage * corruptionScale,
                        speed: aiData.bossTelemetry.speed * scaleX,
                        abilities: aiData.bossTelemetry.abilities,
                        color: "#ff0000",
                        velocityX: 0,
                        velocityY: 0,
                        isGrounded: false,
                        attackCooldown: 60,
                        facingRight: false,
                        isAttacking: false,
                    };
                } else {
                    if (aiData.cracks && Array.isArray(aiData.cracks)) {
                        aiData.cracks.forEach((aiCrack) => {
                            let rawRate =
                                aiCrack.spawnRate || aiCrack.spawn_rate || 180;
                            cracks.push({
                                x: aiCrack.x,
                                y: aiCrack.y,
                                width: 60 * scaleX,
                                height: 80 * scaleY,
                                color: "#ff00ff",
                                spawnTimer: 0,
                                spawnRate: Math.max(90, parseInt(rawRate)),
                                isSealed: false,
                                sealProgress: 0,
                                sealMax: 120,
                            });
                        });
                    }
                    if (Math.random() > 0.7) {
                        const types = [
                            "Prismatic Edge",
                            "Speed Thrusters",
                            "Quantum Core",
                        ];
                        upgradesOnMap.push({
                            x: tileWidth * 15,
                            y: tileHeight * 8,
                            width: 20 * scaleX,
                            height: 20 * scaleY,
                            type: types[
                                Math.floor(Math.random() * types.length)
                            ],
                            color: "#00ffcc",
                        });
                    }
                }
                player.x = tileWidth * 3;
                player.y = canvas.height - tileHeight * 2;
                camera.x = 0;
                isTransitioning = false;
            })
            .catch((err) => {
                console.error("Procedural matrix load failed.", err);
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

    // ==========================================
    // BOSS COMBAT PROCESSING & COLLISIONS
    // ==========================================
    if (boss) {
        // --- 1. Player Attacks Hitting Boss ---
        for (let i = projectiles.length - 1; i >= 0; i--) {
            let p = projectiles[i];
            if (
                p.x < boss.x + boss.width &&
                p.x + p.width > boss.x &&
                p.y < boss.y + boss.height &&
                p.y + p.height > boss.y
            ) {
                boss.hp -= 12;
                projectiles.splice(i, 1);

                // --- UNIFIED BOSS DEATH CHECK ---
                if (boss.hp <= 0 && !isVictoryTriggered) {
                    isVictoryTriggered = true;
                    boss.velocityX = 0;
                    boss.velocityY = 0;

                    triggerTerminalModal(
                        "// THE MIRROR SHATTERS",
                        "Dynamic loop terminated. Mind Restored.",
                        "victory",
                        () => {
                            // Save data and go to main menu
                            syncDataAndRedirect("/");
                        },
                    );
                    return;
                }
            }
        }

        if (activeMeleeHitbox) {
            if (
                activeMeleeHitbox.x < boss.x + boss.width &&
                activeMeleeHitbox.x + activeMeleeHitbox.width > boss.x &&
                activeMeleeHitbox.y < boss.y + boss.height &&
                activeMeleeHitbox.y + activeMeleeHitbox.height > boss.y
            ) {
                if (!activeMeleeHitbox.hitEntities.includes("boss")) {
                    boss.hp -= 25;
                    activeMeleeHitbox.hitEntities.push("boss");

                    // --- UNIFIED BOSS DEATH CHECK ---
                    if (boss.hp <= 0 && !isVictoryTriggered) {
                        isVictoryTriggered = true;
                        boss.velocityX = 0;
                        boss.velocityY = 0;

                        triggerTerminalModal(
                            "// THE MIRROR SHATTERS",
                            "Dynamic loop terminated. Mind Restored.",
                            "victory",
                            () => {
                                // Save data and go to main menu
                                syncDataAndRedirect("/");
                            },
                        );
                        return;
                    }
                }
            }
        }

        // --- 2. Boss Attacks Hitting Player ---
        for (let i = bossProjectiles.length - 1; i >= 0; i--) {
            let bp = bossProjectiles[i];
            bp.x += bp.velocityX;
            bp.y += bp.velocityY;

            if (
                bp.x < player.x + player.width &&
                bp.x + bp.width > player.x &&
                bp.y < player.y + player.height &&
                bp.y + bp.height > player.y
            ) {
                player.currentHealth -= bp.damage; // FIXED VARIABLE
                bossProjectiles.splice(i, 1);

                // Inside your damage/health check logic...
                if (player.currentHealth <= 0 && !isVictoryTriggered) {
                    isVictoryTriggered = true; // Reusing this flag prevents the modal from spawning 60 times a second

                    // Stop player movement
                    player.velocityX = 0;
                    player.velocityY = 0;

                    triggerTerminalModal(
                        "// CRITICAL SYSTEM FAILURE",
                        "Your signal was lost to the void. The cycle repeats.",
                        "failure",
                        () => {
                            // Save data and reload the run
                            syncDataAndRedirect("/game");
                        },
                    );
                }
                continue;
            }

            if (
                bp.x < camera.x ||
                bp.x > camera.x + canvas.width ||
                bp.y < 0 ||
                bp.y > canvas.height
            ) {
                bossProjectiles.splice(i, 1);
            }
        }

        if (bossMeleeHitbox) {
            bossMeleeHitbox.duration--;

            // --- FIXED: Differentiate tracking paths based on attack type ---
            if (bossMeleeHitbox.type === "up-melee") {
                // Center the up-slash horizontally over the boss and place it directly above them
                bossMeleeHitbox.x =
                    boss.x + boss.width / 2 - bossMeleeHitbox.width / 2;
                bossMeleeHitbox.y = boss.y - bossMeleeHitbox.height;
            } else {
                // Standard side-slash tracking path
                bossMeleeHitbox.x = boss.facingRight
                    ? boss.x + boss.width
                    : boss.x - bossMeleeHitbox.width;
                bossMeleeHitbox.y = boss.y - 10 * scaleY;
            }

            if (
                bossMeleeHitbox.x < player.x + player.width &&
                bossMeleeHitbox.x + bossMeleeHitbox.width > player.x &&
                bossMeleeHitbox.y < player.y + player.height &&
                bossMeleeHitbox.y + bossMeleeHitbox.height > player.y
            ) {
                if (!player.invincibilityTimer) {
                    player.currentHealth -= bossMeleeHitbox.damage; // FIXED VARIABLE
                    player.invincibilityTimer = 30;

                    // --- REPLACED PLAYER DEATH CHECK ---
                    // Inside your damage/health check logic...
                    if (player.currentHealth <= 0 && !isVictoryTriggered) {
                        isVictoryTriggered = true; // Reusing this flag prevents the modal from spawning 60 times a second

                        // Stop player movement
                        player.velocityX = 0;
                        player.velocityY = 0;

                        triggerTerminalModal(
                            "// CRITICAL SYSTEM FAILURE",
                            "Your signal was lost to the void. The cycle repeats.",
                            "failure",
                            () => {
                                // Save data and reload the run
                                syncDataAndRedirect("/game");
                            },
                        );
                    }
                }
            }
            if (bossMeleeHitbox.duration <= 0) bossMeleeHitbox = null;
        }
    }

    // Reset the click trigger at the very end of the combat frame
    mouse.leftJustPressed = false;
}

function updateGhosts() {
    // 1. Tick down invincibility ONCE per frame at the very start of the function
    if (player.invincibilityTimer > 0) player.invincibilityTimer--;

    // 2. Process Minor Ghost Entities
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
        if (
            player.invincibilityTimer === 0 &&
            ghost.x < player.x + player.width &&
            ghost.x + ghost.width > player.x &&
            ghost.y < player.y + player.height &&
            ghost.y + ghost.height > player.y
        ) {
            player.currentHealth -= sysConfig.enemyDamage;
            player.corruptionLevel = Math.min(100, player.corruptionLevel + 15);
            player.invincibilityTimer = 60;

            cracks.forEach((crack) => (crack.sealProgress = 0));

            player.velocityY = -6 * scaleY;
            player.velocityX = player.x < ghost.x ? -10 * scaleX : 10 * scaleX;

            // Inside your damage/health check logic...
            if (player.currentHealth <= 0 && !isVictoryTriggered) {
                isVictoryTriggered = true; // Reusing this flag prevents the modal from spawning 60 times a second

                // Stop player movement
                player.velocityX = 0;
                player.velocityY = 0;

                triggerTerminalModal(
                    "// CRITICAL SYSTEM FAILURE",
                    "Your signal was lost to the void. The cycle repeats.",
                    "failure",
                    () => {
                        // Save data and reload the run
                        syncDataAndRedirect("/game");
                    },
                );
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
                ghost.hp -= sysConfig.playerMeleeDamage;
                activeMeleeHitbox.hitEntities.push(ghost);

                let knockbackForce = 20 * scaleX;
                if (activeMeleeHitbox.direction === "right")
                    ghost.x += knockbackForce;
                if (activeMeleeHitbox.direction === "left")
                    ghost.x -= knockbackForce;
                if (activeMeleeHitbox.direction === "up")
                    ghost.y -= knockbackForce;
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
            sessionKills++;
            ghosts.splice(i, 1);
            player.corruptionLevel = Math.max(0, player.corruptionLevel - 5);
        }
    }

    // 2. OUTSIDE THE LOOP: Process Boss Combat Resolution Inderpendently
    if (boss) {
        // Inside updateCombat(), under the boss block:
        if (activeMeleeHitbox) {
            if (
                activeMeleeHitbox.x < boss.x + boss.width &&
                activeMeleeHitbox.x + activeMeleeHitbox.width > boss.x &&
                activeMeleeHitbox.y < boss.y + boss.height &&
                activeMeleeHitbox.y + activeMeleeHitbox.height > boss.y
            ) {
                // Use the boss object consistently for the hit list
                if (!activeMeleeHitbox.hitEntities.includes(boss)) {
                    boss.hp -= 25;
                    activeMeleeHitbox.hitEntities.push(boss);

                    // --- ADDED: POGO MECHANIC FOR BOSS ---
                    if (activeMeleeHitbox.direction === "down") {
                        player.velocityY = player.jumpStrength * 0.8; // Bounce off the boss!
                    }

                    // --- UNIFIED BOSS DEATH CHECK ---
                    if (boss.hp <= 0 && !isVictoryTriggered) {
                        isVictoryTriggered = true;
                        boss.velocityX = 0;
                        boss.velocityY = 0;

                        triggerTerminalModal(
                            "// THE MIRROR SHATTERS",
                            "Dynamic loop terminated. Mind Restored.",
                            "victory",
                            () => {
                                // Save data and go to main menu
                                syncDataAndRedirect("/");
                            },
                        );
                        return;
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

                // --- UNIFIED BOSS DEATH CHECK ---
                if (boss.hp <= 0 && !isVictoryTriggered) {
                    isVictoryTriggered = true;
                    boss.velocityX = 0;
                    boss.velocityY = 0;

                    triggerTerminalModal(
                        "// THE MIRROR SHATTERS",
                        "Dynamic loop terminated. Mind Restored.",
                        "victory",
                        () => {
                            // Save data and go to main menu
                            syncDataAndRedirect("/");
                        },
                    );
                    return;
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
                hp: sysConfig.enemyBaseHealth,
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
                    sessionCracksClosed++;
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

let isGamePausedForModal = false;

// Sectional Title: System Modal & UI Management

function triggerTerminalModal(titleText, messageText, theme, callback) {
    // 1. Grab the HTML elements from your EJS file
    const modalOverlay = document.getElementById("game-modal");
    const modalBox = modalOverlay.querySelector(".modal-box");
    const modalTitle = document.getElementById("modal-title");
    const modalMessage = document.getElementById("modal-message");
    const modalButton = document.getElementById("modal-button");

    // 2. Inject the dynamic text
    modalTitle.innerText = titleText;
    modalMessage.innerText = messageText;

    // 3. Apply the correct CSS theme ('victory' or 'failure')
    modalBox.className = "modal-box"; // Reset previous classes
    if (theme) modalBox.classList.add(theme);

    // 4. Force the game engine to pause using your existing flag
    isTransitioning = true;

    // 5. Reveal the modal overlay (overriding 'display: none')
    modalOverlay.style.display = "flex";

    // 6. Bind the callback to the button press!
    modalButton.onclick = () => {
        // Optional: Update button text to show the player something is happening
        modalButton.innerText = "SYNCING...";
        modalButton.style.pointerEvents = "none"; // Prevent double-clicking

        // Execute the syncDataAndRedirect function you passed in
        if (callback) {
            callback();
        }
    };
}

function updateUpgrades() {
    for (let i = upgradesOnMap.length - 1; i >= 0; i--) {
        let upg = upgradesOnMap[i];

        // Dynamic AABB Overlap check against Player avatar block bounds
        if (
            player.x < upg.x + upg.width &&
            player.x + player.width > upg.x &&
            player.y < upg.y + upg.height &&
            player.y + player.height > upg.y
        ) {
            console.log(
                `[Progression Synchronizer] Upgrade Secured: ${upg.type}`,
            );

            // Dispatch synchronization handshake packet to flat-file database backend
            fetch("/api/collect-upgrade", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ upgradeName: upg.type }),
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

function triggerBossRanged(dx, dy) {
    let startX = boss.x + boss.width / 2;
    let startY = boss.y + boss.height / 2;
    let angle = Math.atan2(dy, dx);
    let projectileSpeed = 10 * scaleX; // Slightly slower than player's lasers

    bossProjectiles.push({
        x: startX,
        y: startY,
        width: 15 * scaleX,
        height: 15 * scaleX,
        velocityX: Math.cos(angle) * projectileSpeed,
        velocityY: Math.sin(angle) * projectileSpeed,
        damage: boss.damage, // Scaled via corruption
    });
}

function triggerBossMelee() {
    let hW = 40 * scaleX;
    let hH = boss.height + 20 * scaleY;
    let hX = boss.facingRight ? boss.x + boss.width : boss.x - hW;
    let hY = boss.y - 10 * scaleY;

    bossMeleeHitbox = {
        type: "melee",
        x: hX,
        y: hY,
        width: hW,
        height: hH,
        duration: 15,
        damage: boss.damage * 1.5, // Swords hurt more than lasers
    };
}

function triggerBossUpMelee() {
    let hitX = boss.x - 20 * scaleX;
    let hitY = boss.y - 60 * scaleY;
    let hitW = boss.width + 40 * scaleX;
    let hitH = 60 * scaleY;

    // Spawn the persistent red slash animation box for 15 frames
    bossMeleeHitbox = {
        type: "up-melee",
        x: hitX,
        y: hitY,
        width: hitW,
        height: hitH,
        duration: 15,
        damage: boss.damage * 1.5,
    };

    // Immediate calculation check using the correct health variable
    if (
        player.x < hitX + hitW &&
        player.x + player.width > hitX &&
        player.y < hitY + hitH &&
        player.y + player.height > hitY
    ) {
        player.currentHealth -= boss.damage * 1.5; // Damage applied to real health property

        // Launch the player vertically and nudge horizontally
        player.velocityY = -12;
        player.velocityX = boss.facingRight ? 5 : -5;
    }
}

function updateBossAI() {
    if (!boss) return;

    boss.velocityY += 0.5 * scaleY;

    // Rudimentary absolute tracking pathfinding
    let dx = player.x + player.width / 2 - (boss.x + boss.width / 2);
    let dy = player.y + player.height / 2 - (boss.y + boss.height / 2);

    // --- FIXED: Only update tracking and facing direction if NOT attacking or telegraphing ---
    if (boss.telegraphTimer <= 0 && !bossMeleeHitbox) {
        boss.velocityX = dx > 0 ? boss.speed : -boss.speed;
        boss.facingRight = dx > 0; // Track facing direction for sword
    } else {
        boss.velocityX = 0; // Force full velocity freeze during actions
    }

    const abilities = boss.abilities || [];

    // --- WEAPONIZED COPY ABILITY A: SPEED THRUSTERS ---
    if (abilities.includes("Speed Thrusters") && Math.abs(dx) > 250 * scaleX) {
        boss.velocityX *= 2.2;
    }

    // --- WEAPONIZED COPY ABILITY B: QUANTUM CORE ---
    if (abilities.includes("Quantum Core") && boss.hp < boss.maxHp) {
        boss.hp += 0.04;
    }

    // X-Axis Movement & Collision
    boss.x += boss.velocityX;
    platforms.forEach((platform) => {
        if (
            boss.x < platform.x + platform.width &&
            boss.x + boss.width > platform.x &&
            boss.y < platform.y + platform.height - 1 &&
            boss.y + boss.height > platform.y + 1
        ) {
            if (boss.velocityX > 0) {
                boss.x = platform.x - boss.width;
            } else if (boss.velocityX < 0) {
                boss.x = platform.x + platform.width;
            }
        }
    });

    if (boss.x < 0) boss.x = 0;
    if (boss.x + boss.width > levelWidth) boss.x = levelWidth - boss.width;

    // Y-Axis Movement & Collision (The part that got cut off!)
    boss.y += boss.velocityY;
    boss.isGrounded = false;

    platforms.forEach((platform) => {
        if (
            boss.x < platform.x + platform.width - 1 &&
            boss.x + boss.width > platform.x + 1 &&
            boss.y < platform.y + platform.height &&
            boss.y + boss.height > platform.y
        ) {
            if (boss.velocityY > 0) {
                boss.y = platform.y - boss.height;
                boss.velocityY = 0;
                boss.isGrounded = true;
            } else if (boss.velocityY < 0) {
                boss.y = platform.y + platform.height;
                boss.velocityY = 0;
            }
        }
    });

    // ==========================================
    // BOSS ATTACK STATE MACHINE & TELEGRAPHING
    // ==========================================

    // 1. Process an active telegraph wind-up
    // 1. Process an active telegraph wind-up
    if (boss.telegraphTimer > 0) {
        boss.telegraphTimer--;
        boss.velocityX = 0; // Freeze the boss in place while they wind up!

        // When the wind-up finishes, execute the attack
        if (boss.telegraphTimer <= 0) {
            if (boss.pendingAttack === "melee") {
                triggerBossMelee();
                boss.attackCooldown = 50;
            }
            // === ADDED: UP-SLASH EXECUTION TRIGGER ===
            else if (boss.pendingAttack === "up-melee") {
                triggerBossUpMelee();
                boss.attackCooldown = 60;
            }
            // =========================================
            else if (boss.pendingAttack === "ranged") {
                // Recalculate aiming so it fires at where the player is NOW
                let currentDx =
                    player.x + player.width / 2 - (boss.x + boss.width / 2);
                let currentDy =
                    player.y + player.height / 2 - (boss.y + boss.height / 2);
                triggerBossRanged(currentDx, currentDy);
                boss.attackCooldown = 80;
            }
            boss.pendingAttack = null; // Clear the pending state
        }
    }
    // 2. Process cooldowns if not telegraphing
    else if (boss.attackCooldown > 0) {
        boss.attackCooldown--;
    }
    // 3. Decide to start a new attack
    else {
        let distanceToPlayer = Math.sqrt(dx * dx + dy * dy);

        // MELEE RANGE
        if (distanceToPlayer < 80 * scaleX) {
            boss.telegraphTimer = 30; // Half a second wind-up

            // --- ADDED: Check if player is above the boss ---
            if (player.y + player.height < boss.y + 20 * scaleY) {
                boss.pendingAttack = "up-melee";
            } else {
                boss.pendingAttack = "melee";
            }
        }
        // RANGED RANGE
        else if (distanceToPlayer < 400 * scaleX) {
            boss.telegraphTimer = 45;
            boss.pendingAttack = "ranged";
        }
    }
}

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
            ctx.fillText(
                "[E] Establish Link",
                npc.x + npc.width / 2,
                npc.y - 15 * scaleY,
            );
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
                ctx.fillRect(
                    crack.x,
                    crack.y - 15 * scaleY,
                    crack.width,
                    6 * scaleY,
                );
                // Active Fill
                ctx.fillStyle = "#00ffff";
                ctx.fillRect(
                    crack.x,
                    crack.y - 15 * scaleY,
                    crack.width * (crack.sealProgress / crack.sealMax),
                    6 * scaleY,
                );
            }
        }
    });

    // Draw Upgrades on Map
    upgradesOnMap.forEach((upg) => {
        ctx.shadowBlur = 15;
        ctx.shadowColor = upg.color;
        ctx.fillStyle = upg.color;
        ctx.beginPath();
        ctx.moveTo(upg.x + upg.width / 2, upg.y);
        ctx.lineTo(upg.x + upg.width, upg.y + upg.height / 2);
        ctx.lineTo(upg.x + upg.width / 2, upg.y + upg.height);
        ctx.lineTo(upg.x, upg.y + upg.height / 2);
        ctx.closePath();
        ctx.fill();
    });

    // Draw Mirror Boss (INSIDE renderGraphics)
    if (boss) {
        const abilities = boss.abilities || [];

        // --- VISUAL TELEGRAPH: DASH SPRINT ---
        if (abilities.includes("Speed Thrusters")) {
            ctx.shadowBlur = 30;
            ctx.shadowColor = "#00ffff";
        } else {
            ctx.shadowBlur = 20;
            ctx.shadowColor = boss.color;
        }

        ctx.fillStyle = boss.color;
        ctx.fillRect(boss.x, boss.y, boss.width, boss.height);
        // --- VISUAL TELEGRAPH: ATTACK WIND-UPS ---
        if (boss.telegraphTimer > 0) {
            // Flash the boss white to indicate danger
            if (Math.floor(Date.now() / 100) % 2 === 0) {
                ctx.fillStyle = "#ffffff";
            }

            if (boss.pendingAttack === "melee") {
                // Draw a yellow ghost-box where the sword will hit
                let hW = 40 * scaleX;
                let hH = boss.height + 20 * scaleY;
                let hX = boss.facingRight ? boss.x + boss.width : boss.x - hW;
                let hY = boss.y - 10 * scaleY;

                ctx.fillStyle = "rgba(255, 255, 0, 0.3)";
                ctx.fillRect(hX, hY, hW, hH);
            }
            // FIXED: Placed securely inside the active telegraphTimer block
            else if (boss.pendingAttack === "up-melee") {
                // Draw an orange warning box ABOVE the boss
                let hW = boss.width + 40 * scaleX;
                let hH = 60 * scaleY;
                let hX = boss.x - 20 * scaleX;
                let hY = boss.y - hH;

                ctx.fillStyle = "rgba(255, 165, 0, 0.4)";
                ctx.fillRect(hX, hY, hW, hH);
            } else if (boss.pendingAttack === "ranged") {
                // Draw a red targeting laser tracking the player
                ctx.beginPath();
                ctx.moveTo(boss.x + boss.width / 2, boss.y + boss.height / 2);
                ctx.lineTo(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                );
                ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
                ctx.lineWidth = 2;
                ctx.setLineDash([5, 5]);
                ctx.stroke();
                ctx.setLineDash([]);
            }
        }

        // Boss Health Bar (Fixed to prevent negative widths)
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#222222";
        ctx.fillRect(boss.x - 10, boss.y - 20, boss.width + 20, 10);
        ctx.fillStyle = "#ff0000";
        ctx.fillRect(
            boss.x - 10,
            boss.y - 20,
            (boss.width + 20) * Math.max(0, boss.hp / boss.maxHp),
            10,
        );

        // --- VISUAL TELEGRAPH: HEALING CORE ---
        if (abilities.includes("Quantum Core") && boss.hp < boss.maxHp) {
            ctx.strokeStyle = "rgba(0, 255, 100, 0.6)";
            ctx.lineWidth = 3;
            ctx.strokeRect(
                boss.x - 5,
                boss.y - 5,
                boss.width + 10,
                boss.height + 10,
            );
        }

        // --- VISUAL TELEGRAPH: PRISMATIC EDGE ---
        if (boss.abilities && boss.abilities.includes("Prismatic Edge")) {
            ctx.strokeStyle = "rgba(255, 0, 0, 0.4)";
            ctx.lineWidth = 2;
            ctx.strokeRect(
                boss.x - 30,
                boss.y - 30,
                boss.width + 60,
                boss.height + 60,
            );
        }
    }

    // Draw Ghosts
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff4444";
    ctx.fillStyle = "rgba(255, 68, 68, 0.7)";
    ghosts.forEach((ghost) =>
        ctx.fillRect(ghost.x, ghost.y, ghost.width, ghost.height),
    );

    // --- DRAW AIMING & FIRING LASER SIGHT ---
    if (mouse.rightDown) {
        // Calculate if the crosshair is specifically hovering over an unsealed crack
        const worldMouseX = mouse.x + camera.x;
        const worldMouseY = mouse.y;

        const isAimingAtCrack = cracks.some((crack) => {
            return (
                !crack.isSealed &&
                worldMouseX >= crack.x &&
                worldMouseX <= crack.x + crack.width &&
                worldMouseY >= crack.y &&
                worldMouseY <= crack.y + crack.height
            );
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
        ctx.fillRect(
            activeMeleeHitbox.x,
            activeMeleeHitbox.y,
            activeMeleeHitbox.width,
            activeMeleeHitbox.height,
        );
    }

    // Draw Player Avatar
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;

    if (player.invincibilityTimer > 0) {
        if (Math.floor(Date.now() / 100) % 2 === 0) {
            ctx.fillStyle = "rgba(255, 255, 255, 0.3)";
        } else {
            ctx.fillStyle = player.color;
        }
    } else {
        ctx.fillStyle = player.color;
    }
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // --- MOVED INSIDE THE CAMERA BLOCK ---
    // Draw Boss Projectiles
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff0000";
    ctx.fillStyle = "#ffffff";
    if (typeof bossProjectiles !== "undefined") {
        bossProjectiles.forEach((p) =>
            ctx.fillRect(p.x, p.y, p.width, p.height),
        );
    }

    // Draw Boss Melee Arc
    if (typeof bossMeleeHitbox !== "undefined" && bossMeleeHitbox) {
        ctx.shadowBlur = 15;
        ctx.shadowColor = "#ff0000";
        ctx.fillStyle = "rgba(255, 0, 0, 0.5)";
        ctx.fillRect(
            bossMeleeHitbox.x,
            bossMeleeHitbox.y,
            bossMeleeHitbox.width,
            bossMeleeHitbox.height,
        );
    }

    // Restore the canvas state HERE, before drawing static UI
    ctx.restore();

    // UI Overlays (Health Bar)
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#222222";
    ctx.fillRect(20 * scaleX, 20 * scaleY, 200 * scaleX, 15 * scaleY);
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(
        20 * scaleX,
        20 * scaleY,
        200 * scaleX * (player.currentHealth / player.maxHealth),
        15 * scaleY,
    );
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(20 * scaleX, 20 * scaleY, 200 * scaleX, 15 * scaleY);

    // UI Overlays (Corruption Bar)
    ctx.fillStyle = "#222222";
    ctx.fillRect(20 * scaleX, 45 * scaleY, 200 * scaleX, 15 * scaleY);
    ctx.fillStyle = "#8a2be2";
    ctx.fillRect(
        20 * scaleX,
        45 * scaleY,
        200 * scaleX * (player.corruptionLevel / 100),
        15 * scaleY,
    );
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
        updateBossAI(); // <--- REGISTERED IN PROCESSING FLOW
    }
    renderGraphics();
    requestAnimationFrame(gameLoop);
}

// Add this function to handle saving player data and redirecting
async function syncDataAndRedirect() {
    try {
        // 1. Prepare the player data to save
        const playerData = {
            userId: window.GAME_STATE.playerProfile.userId, // Ensure this matches the server's userId
            username: window.GAME_STATE.playerProfile.username,
            currentHealth: player.currentHealth,
            maxHealth: player.maxHealth,
            corruptionLevel: player.corruptionLevel,
            weaponUpgrades: [], // Add any upgrades the player has collected
            totalKills: 0, // Track total enemies killed
            cracksClosed: 0, // Track total cracks sealed
            levelsCompleted: levelCount,
        };

        // 2. Send the data to the server
        const response = await fetch("/save-player", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(playerData),
        });

        if (!response.ok) {
            throw new Error(`Failed to save player data: ${response.statusText}`);
        }

        const result = await response.json();
        console.log("Player data saved:", result.message);

        // 3. Redirect to the next page (e.g., home or leaderboard)
        window.location.href = "/";
    } catch (error) {
        console.error("Error saving player data:", error.message);
        // Fallback: Redirect even if saving fails
        window.location.href = "/";
    }
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
    if (
        (e.key.toLowerCase() === "t" || e.key.toLowerCase() === "e") &&
        !isChatting
    ) {
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
                profile: typeof profile !== "undefined" ? profile : null,
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
