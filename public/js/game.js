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

// 3. Grid Configuration (0 = Air, 1 = Wall, 2 = Goal Portal)
const levelGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 2, 0, 0, 0], // Notice the '2' placed here!
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
];

const gridRows = levelGrid.length;
const gridCols = levelGrid[0].length;
const tileWidth = canvas.width / gridCols;
const tileHeight = canvas.height / gridRows;

const scaleX = tileWidth / 40;
const scaleY = tileHeight / 37.5;

// 4. Structural Array Compilers
const platforms = [];
const goals = []; // New array specifically for extraction points

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
        else if (levelGrid[row][col] === 2) {
            goals.push({
                x: col * tileWidth,
                y: row * tileHeight,
                width: tileWidth,
                height: tileHeight,
                color: "#00ffcc", // Bright neon cyan
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

    // Friction is a percentage multiplier (0.85), so it remains constant across all screens!
    friction: 0.85,
    isGrounded: false,
};

// 6. Track Keyboard Input State
const keys = { w: false, a: false, s: false, d: false, " ": false };

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
    if (keys.a) player.velocityX -= player.speed;
    if (keys.d) player.velocityX += player.speed;

    player.velocityX *= player.friction;

    if (player.velocityX > player.maxSpeed) player.velocityX = player.maxSpeed;
    if (player.velocityX < -player.maxSpeed)
        player.velocityX = -player.maxSpeed;

    // 2. Vertical Gravity & Jumping
    player.velocityY += player.gravity;

    if ((keys.w || keys[" "]) && player.isGrounded) {
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

    // Draw Player Avatar Square with Glowing Aura
    ctx.shadowBlur = 15;
    ctx.shadowColor = player.color;
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// 9. Master Frame Loop
function gameLoop() {
    updatePhysics();
    renderGraphics();
    requestAnimationFrame(gameLoop);
}

// Run engine initialization
gameLoop();
