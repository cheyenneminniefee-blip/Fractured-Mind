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

// 3. Grid Configuration (12 Rows x 20 Columns Matrix)
// 0 = Open Air Workspace, 1 = Solid Cybernetic Ground Structure
// Sectional Title: Dynamic Physics Scaling Architecture - 2026-05-19

// Sectional Title: Adding Win Conditions to the Grid Engine - 2026-05-19

// 3. Grid Configuration (0 = Air, 1 = Wall, 2 = Goal Portal, 4 = Memory Entity NPC)
const levelGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 4, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1], // Added '4' right here!
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

// MUST BE CALCULATED BEFORE COMBAT ARRAYS
const gridRows = levelGrid.length;
const gridCols = levelGrid[0].length;
const tileWidth = canvas.width / gridCols;
const tileHeight = canvas.height / gridRows;

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

// 4. Structural Array Compilers
const platforms = [];
const goals = []; // New array specifically for extraction points
const npcs = [];

for (let row = 0; row < gridRows; row++) {
    for (let col = 0; col < gridCols; col++) {
        // If it's a 1, build a solid wall
        if (levelGrid[row][col] === 1) {
            platforms.push({
                x: col * tileWidth,
                y: row * tileHeight,
                width: tileWidth,
                height: tileHeight,
                color: "#1f1f2e",
            });
        }
        // If it's a 2, build a Goal block
        // If it's a 2, build a Goal block
        else if (levelGrid[row][col] === 2) {
            goals.push({
                x: col * tileWidth,
                y: row * tileHeight,
                width: tileWidth,
                height: tileHeight,
                color: "#00ffcc", 
            });
        }
        // NEW: If it's a 4, build a Memory Entity NPC
        else if (levelGrid[row][col] === 4) {
            npcs.push({
                x: col * tileWidth,
                y: row * tileHeight,
                width: tileWidth,
                height: tileHeight,
                color: "#ffff00", // Yellow aura for the NPC
            });
        }
    }
}

// 5. Responsive Platformer Player Object
const player = {
    x: canvas.width / 2 - 12.5 * scaleX,
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
        player.facingRight = false; // Looking left
    }
    if (keys.d) {
        player.velocityX += player.speed;
        player.facingRight = true; // Looking right
    }

    player.velocityX *= player.friction;

    if (player.velocityX > player.maxSpeed) player.velocityX = player.maxSpeed;
    if (player.velocityX < -player.maxSpeed)
        player.velocityX = -player.maxSpeed;

    // 2. Vertical Gravity & Jumping
    player.velocityY += player.gravity;

    // Only the Spacebar will trigger a jump now
    if (keys[" "] && player.isGrounded) {
        player.velocityY = player.jumpStrength;
        player.isGrounded = false;
    }

    // --- STEP A: X-Axis Movement & Collision Resolution ---
    player.x += player.velocityX;

    platforms.forEach((platform) => {
        // Standard AABB Overlap Check
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        ) {
            // If moving right, push player to the left edge of the block
            if (player.velocityX > 0) {
                player.x = platform.x - player.width;
                player.velocityX = 0;
            }
            // If moving left, push player to the right edge of the block
            else if (player.velocityX < 0) {
                player.x = platform.x + platform.width;
                player.velocityX = 0;
            }
        }
    });

    // Outer Boundary Collisions: Left & Right Walls
    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velocityX = 0;
    }

    // --- STEP B: Y-Axis Movement & Collision Resolution ---
    player.y += player.velocityY;
    player.isGrounded = false; // Reset before checking floors

    platforms.forEach((platform) => {
        // Standard AABB Overlap Check (Using updated Y coordinates)
        if (
            player.x < platform.x + platform.width &&
            player.x + player.width > platform.x &&
            player.y < platform.y + platform.height &&
            player.y + player.height > platform.y
        ) {
            // If falling down, snap to the top of the block (Floor)
            if (player.velocityY > 0) {
                player.y = platform.y - player.height;
                player.velocityY = 0;
                player.isGrounded = true;
            }
            // If jumping up, snap to the bottom of the block (Ceiling)
            else if (player.velocityY < 0) {
                player.y = platform.y + platform.height;
                player.velocityY = 0;
            }
        }
    });

    // Outer Boundary Collisions: Main Canvas Floor
    if (player.y + player.height > canvas.height) {
        player.y = canvas.height - player.height;
        player.velocityY = 0;
        player.isGrounded = true;
    }
    // --- STEP C: Goal Collision Detection ---
    goals.forEach((goal) => {
        if (
            player.x < goal.x + goal.width &&
            player.x + player.width > goal.x &&
            player.y < goal.y + goal.height &&
            player.y + player.height > goal.y
        ) {
            // WIN CONDITION TRIGGERED!
            alert("SYSTEM OVERRIDE: Level Complete.");

            // Reset player to the starting point to "restart" the level for now
            player.x = canvas.width / 2 - 12.5 * scaleX;
            player.y = canvas.height - tileHeight * 2;
            player.velocityX = 0;
            player.velocityY = 0;
        }
    });
}

// Sectional Title: Milestone 7 - Combat & AI Physics - 2026-05-19

function updateCombat() {
    if (meleeCooldown > 0) meleeCooldown--;
    if (rangedCooldown > 0) rangedCooldown--;

    // Determine what happens when the Left Mouse Button is clicked
    if (mouse.leftJustPressed) {
        // 1. RANGED ATTACK (If Right-Click is held to aim)
        if (mouse.rightDown && rangedCooldown === 0) {
            // --- NEW: Check if we are aiming at a crack ---
            let aimingAtCrack = cracks.some((crack) => {
                return (
                    !crack.isSealed &&
                    mouse.x > crack.x &&
                    mouse.x < crack.x + crack.width &&
                    mouse.y > crack.y &&
                    mouse.y < crack.y + crack.height
                );
            });

            // Only fire the projectile if we are NOT aiming at a crack!
            if (!aimingAtCrack) {
                // Calculate the exact angle between the player and the mouse cursor
                let startX = player.x + player.width / 2;
                let startY = player.y + player.height / 2;
                let angle = Math.atan2(mouse.y - startY, mouse.x - startX);

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

        if (p.x < 0 || p.x > canvas.width || p.y < 0 || p.y > canvas.height) {
            projectiles.splice(i, 1);
        }
    }

    // Reset the click trigger at the very end of the combat frame
    mouse.leftJustPressed = false;
}

function updateGhosts() {
    for (let i = ghosts.length - 1; i >= 0; i--) {
        let ghost = ghosts[i];

        // 1. Pathfinding: Direct Homing Vector
        let dx = player.x + player.width / 2 - (ghost.x + ghost.width / 2);
        let dy = player.y + player.height / 2 - (ghost.y + ghost.height / 2);
        let distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 0) {
            ghost.x += (dx / distance) * ghost.speed;
            ghost.y += (dy / distance) * ghost.speed;
        }

        // --- NEW: GHOST DAMAGES PLAYER ---
        // Decrease invincibility frames every tick
        if (player.invincibilityTimer > 0) player.invincibilityTimer--;

        // Check if ghost is touching the player
        if (player.invincibilityTimer === 0 &&
            ghost.x < player.x + player.width && ghost.x + ghost.width > player.x &&
            ghost.y < player.y + player.height && ghost.y + ghost.height > player.y) {

            // Take 10 Damage and gain 15 Corruption
            player.currentHealth -= 10;
            player.corruptionLevel = Math.min(100, player.corruptionLevel + 15);
            player.invincibilityTimer = 60; // 1 second of invincibility (60 frames)

            // Interrupt any crack sealing progress!
            cracks.forEach(crack => crack.sealProgress = 0);

            // Knock the player backward
            player.velocityY = -6 * scaleY; // Pop them into the air
            player.velocityX = (player.x < ghost.x) ? -10 * scaleX : 10 * scaleX;

            // Check for Fail State (Death)
            if (player.currentHealth <= 0) {
                alert("SYSTEM FAILURE: Vital signs lost. Memory fragmented.");

                // Reset Level / Stats
                player.x = canvas.width / 2 - 12.5 * scaleX;
                player.y = canvas.height - tileHeight * 2;
                player.currentHealth = player.maxHealth;
                player.corruptionLevel = 0;
            }
        }

        // 2. Combat Resolution: Melee Hits
        if (
            activeMeleeHitbox &&
            ghost.x < activeMeleeHitbox.x + activeMeleeHitbox.width &&
            ghost.x + ghost.width > activeMeleeHitbox.x &&
            ghost.y < activeMeleeHitbox.y + activeMeleeHitbox.height &&
            ghost.y + ghost.height > activeMeleeHitbox.y
        ) {
            // Check the "Hit List" array. If the ghost isn't in it, hit them!
            if (!activeMeleeHitbox.hitEntities.includes(ghost)) {
                ghost.hp -= 10;
                activeMeleeHitbox.hitEntities.push(ghost); // Add them to the list!

                // Knockback effect
                let knockbackForce = 20 * scaleX;
                if (activeMeleeHitbox.direction === "right")
                    ghost.x += knockbackForce;
                if (activeMeleeHitbox.direction === "left")
                    ghost.x -= knockbackForce;
                if (activeMeleeHitbox.direction === "up")
                    ghost.y -= knockbackForce;
                if (activeMeleeHitbox.direction === "down")
                    ghost.y += knockbackForce;
                // --- NEW: HOLLOW KNIGHT POGO MECHANIC ---
                // If we hit them with a downward slash, launch the player up!
                if (activeMeleeHitbox.direction === "down") {
                    // You can multiply this by a decimal (like 0.8) if you want a shorter pogo
                    player.velocityY = player.jumpStrength * 0.8;
                }
            }
        }

        // 3. Combat Resolution: Projectile Hits
        for (let j = projectiles.length - 1; j >= 0; j--) {
            let p = projectiles[j];
            if (
                ghost.x < p.x + p.width &&
                ghost.x + ghost.width > p.x &&
                ghost.y < p.y + p.height &&
                ghost.y + ghost.height > p.y
            ) {
                ghost.hp -= 5;
                projectiles.splice(j, 1); // Destroy projectile on impact
            }
        }

        // 4. Death Check
        if (ghost.hp <= 0) {
            ghosts.splice(i, 1); // Eliminate ghost
            // Decrease corruption by 5 when killing a ghost
            player.corruptionLevel = Math.max(0, player.corruptionLevel - 5); 
        }
    }
}

function updateCracks() {
    cracks.forEach((crack) => {
        if (crack.isSealed) return; // Skip logic if already sealed

        // Spawn Ghosts (Unchanged)
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
        player.isLockedOut = (player.corruptionLevel >= 100);

        // --- NEW: LASER SEALING LOGIC (With Lockout Check) ---
        // Verify they are aiming, firing, AND not locked out
        if (!player.isLockedOut && mouse.rightDown && mouse.leftDown) {

            // Check if hovering over crack
            if (mouse.x > crack.x && mouse.x < crack.x + crack.width &&
                mouse.y > crack.y && mouse.y < crack.y + crack.height) {

                crack.sealProgress++;

                if (crack.sealProgress >= crack.sealMax) {
                    crack.isSealed = true;
                    // Massive corruption cleanse for sealing a crack!
                    player.corruptionLevel = Math.max(0, player.corruptionLevel - 20);
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

// 8. Canvas Graphics Painter Pipeline
function renderGraphics() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

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

    // Draw the Goal Portals with a glowing effect
    ctx.shadowBlur = 20;
    ctx.shadowColor = "#00ffcc";
    goals.forEach((goal) => {
        ctx.fillStyle = goal.color;
        ctx.fillRect(goal.x, goal.y, goal.width, goal.height);
    });

    // --- NEW: Draw Memory Entities (NPCs) ---
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffff00";
    npcs.forEach(npc => {
        ctx.fillStyle = npc.color;
        ctx.fillRect(npc.x, npc.y, npc.width, npc.height);

        // Calculate distance for the UI prompt
        let dx = (player.x + player.width / 2) - (npc.x + npc.width / 2);
        let dy = (player.y + player.height / 2) - (npc.y + npc.height / 2);
        let distance = Math.sqrt(dx * dx + dy * dy);

        // If player is close, draw the interaction prompt
        if (distance < 100 * scaleX) {
            ctx.shadowBlur = 0; // Turn off glow for crisp text
            ctx.fillStyle = "#ffffff";
            ctx.font = `bold ${14 * scaleX}px 'Courier New', monospace`;
            ctx.textAlign = "center";
            ctx.fillText("[T] Establish Link", npc.x + (npc.width / 2), npc.y - (15 * scaleY));
        }
    });

    cracks.forEach((crack) => {
        if (!crack.isSealed) {
            ctx.shadowBlur = 20;
            ctx.shadowColor = crack.color;
            ctx.fillStyle = crack.color;
            // Drawing a jagged crack-like polygon instead of a basic square
            ctx.beginPath();
            ctx.moveTo(crack.x, crack.y);
            ctx.lineTo(crack.x + crack.width / 2, crack.y + crack.height / 3);
            ctx.lineTo(crack.x + crack.width / 4, crack.y + crack.height / 2);
            ctx.lineTo(crack.x + crack.width, crack.y + crack.height);
            ctx.lineTo(crack.x + crack.width / 3, crack.y + crack.height / 1.5);
            ctx.closePath();
            ctx.fill();

            if (crack.sealProgress > 0) {
                let barWidth = 60 * scaleX;
                let barHeight = 8 * scaleY;
                let barX = crack.x + crack.width / 2 - barWidth / 2;
                let barY = crack.y - 15 * scaleY;

                // Draw Dark Background Bar
                ctx.fillStyle = "#333333";
                ctx.fillRect(barX, barY, barWidth, barHeight);

                // Draw Cyan Fill Bar based on current progress
                ctx.fillStyle = "#00ffff";
                let fillWidth = barWidth * (crack.sealProgress / crack.sealMax);
                ctx.fillRect(barX, barY, fillWidth, barHeight);

                // Extra visual flair: Thicken the laser sight to a solid beam!
                ctx.beginPath();
                ctx.moveTo(
                    player.x + player.width / 2,
                    player.y + player.height / 2,
                );
                ctx.lineTo(mouse.x, mouse.y);
                ctx.strokeStyle = "#00ffff";
                ctx.lineWidth = 4; // Thick, powerful beam
                ctx.setLineDash([]); // Solid line instead of dotted
                ctx.stroke();
            }
        }
    });

    // Draw Ghosts
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#ff4444";
    ctx.fillStyle = "rgba(255, 68, 68, 0.7)"; // Semi-transparent red ghosts
    ghosts.forEach((ghost) => {
        ctx.fillRect(ghost.x, ghost.y, ghost.width, ghost.height);
    });
    // Draw Aiming Laser Sight
    if (mouse.rightDown) {
        ctx.beginPath();
        ctx.moveTo(player.x + player.width / 2, player.y + player.height / 2);
        ctx.lineTo(mouse.x, mouse.y);
        ctx.strokeStyle = "rgba(0, 255, 255, 0.4)"; // Faint cyan laser
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]); // Makes it a dotted line
        ctx.stroke();
        ctx.setLineDash([]); // Reset line dash for other drawings
    }
    // Draw Ranged Projectiles
    ctx.shadowBlur = 10;
    ctx.shadowColor = "#00ffff";
    ctx.fillStyle = "#ffffff";
    projectiles.forEach((p) => {
        ctx.fillRect(p.x, p.y, p.width, p.height);
    });

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

    // Draw Player Avatar Square with Glowing Aura
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);

    // --- NEW: DRAW UI OVERLAYS ---
    // 1. Health Bar (Red)
    ctx.shadowBlur = 0; // Turn off glow for crisp UI
    ctx.fillStyle = "#222222";
    ctx.fillRect(20 * scaleX, 20 * scaleY, 200 * scaleX, 15 * scaleY); // Background
    ctx.fillStyle = "#ff3333";
    ctx.fillRect(20 * scaleX, 20 * scaleY, (200 * scaleX) * (player.currentHealth / player.maxHealth), 15 * scaleY);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(20 * scaleX, 20 * scaleY, 200 * scaleX, 15 * scaleY);

    // 2. Corruption Bar (Purple)
    ctx.fillStyle = "#222222";
    ctx.fillRect(20 * scaleX, 45 * scaleY, 200 * scaleX, 15 * scaleY); // Background
    ctx.fillStyle = "#8a2be2"; 
    ctx.fillRect(20 * scaleX, 45 * scaleY, (200 * scaleX) * (player.corruptionLevel / 100), 15 * scaleY);
    ctx.strokeStyle = "#ffffff";
    ctx.strokeRect(20 * scaleX, 45 * scaleY, 200 * scaleX, 15 * scaleY);

    // 3. Lockout Warning Text
    if (player.isLockedOut) {
        ctx.fillStyle = "#ff00ff";
        ctx.font = `${16 * scaleX}px 'Courier New', monospace`;
        ctx.fillText("CRITICAL CORRUPTION: ANOMALY SEALING DISABLED", 20 * scaleX, 85 * scaleY);
    }
}

// 9. Master Frame Loop
function gameLoop() {
    updatePhysics();
    updateCombat();
    updateGhosts();
    updateCracks();
    renderGraphics();
    requestAnimationFrame(gameLoop);
}

// Run engine initialization
gameLoop();

// Sectional Title: Milestone 9 - AI Dialogue Logic - 2026-05-19

const chatOverlay = document.getElementById('ai-chat-overlay');
const chatInput = document.getElementById('chat-input');
const chatHistory = document.getElementById('chat-history');
const sendBtn = document.getElementById('chat-send-btn');

let isChatting = false;

// Toggle Chat with the 'T' key
// Toggle Chat with the 'T' key ONLY when near an NPC
window.addEventListener('keydown', (e) => {
    if (e.key.toLowerCase() === 't' && !isChatting) {

        // --- NEW: Proximity Check ---
        let isNearNPC = false;

        npcs.forEach(npc => {
            let dx = (player.x + player.width / 2) - (npc.x + npc.width / 2);
            let dy = (player.y + player.height / 2) - (npc.y + npc.height / 2);
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
            chatOverlay.style.display = 'flex';
            chatInput.focus();

            // Zero out player momentum
            player.velocityX = 0;
            keys.w = keys.a = keys.s = keys.d = keys[' '] = false; 
        }
    } 
    // Close Chat with Escape
    else if (e.key === 'Escape' && isChatting) {
        closeChat();
    }
});

function closeChat() {
    isChatting = false;
    chatOverlay.style.display = 'none';
    canvas.focus();
}

// Send Message Logic
async function sendChatMessage() {
    const text = chatInput.value.trim();
    if (!text) return;

    // Display Player Text
    chatHistory.innerHTML += `<p class="player-text"><strong>You:</strong> ${text}</p>`;
    chatInput.value = ''; // Clear box
    chatHistory.scrollTop = chatHistory.scrollHeight; // Auto-scroll down

    // Disable input while waiting for the AI
    chatInput.disabled = true;
    chatInput.placeholder = "Awaiting mental link...";

    try {
        const response = await fetch('/api/chat', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: text,
                profile: userProfile // Handing over the EJS profile data for context!
            })
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
sendBtn.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') sendChatMessage();
});

// VERY IMPORTANT: Prevent WASD keys from moving the player WHILE they are typing in the chat box!
window.addEventListener("keydown", (e) => {
    if (isChatting) return; // SKIP normal movement input if chatting!

    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener("keyup", (e) => {
    if (isChatting) return; // SKIP normal movement input if chatting!

    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});