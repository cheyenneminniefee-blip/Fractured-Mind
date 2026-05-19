// Sectional Title: Platform Object Generation & Collision Resolution - 2026-05-18

// 1. Core Engine Canvas Setup
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");
const container = document.getElementById("game-container");

// 2. Dynamic Resolution Matcher
canvas.width = container.clientWidth - 4;
canvas.height = container.clientHeight - 4;

// 3. Fetch relational data from EJS handoff
const userProfile = window.GAME_STATE.playerProfile;

// 4. Consolidated Platformer Player Object
const player = {
    x: canvas.width / 2 - 15,
    y: canvas.height - 100, // Spawn slightly above the floor
    width: 30,
    height: 30,
    color: userProfile.auraColor || "#ffffff",
    speed: 0.8,
    maxSpeed: 6,
    velocityX: 0,
    velocityY: 0,
    friction: 0.85,
    gravity: 0.6,
    jumpStrength: -23, 
    isGrounded: false
};

// 5. Dynamic Platform Array Layout
// We calculate X and Y positions proportionally so they scale seamlessly across different resolutions
const platforms = [
    { 
        x: canvas.width * 0.15, 
        y: canvas.height * 0.75, 
        width: canvas.width * 0.25, 
        height: 15, 
        color: "#2a2a35" 
    },
    { 
        x: canvas.width * 0.60, 
        y: canvas.height * 0.60, 
        width: canvas.width * 0.25, 
        height: 15, 
        color: "#2a2a35" 
    },
    { 
        x: canvas.width * 0.35, 
        y: canvas.height * 0.40, 
        width: canvas.width * 0.30, 
        height: 15, 
        color: "#2a2a35" 
    }
];

// 6. Track Keyboard Input State
const keys = {
    w: false,
    a: false,
    s: false,
    d: false,
    ' ': false
};

window.addEventListener("keydown", (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = true;
});

window.addEventListener("keyup", (e) => {
    const key = e.key.toLowerCase();
    if (key in keys) keys[key] = false;
});

// 7. Mathematical Engine Physics & Advanced Collisions
function updatePhysics() {
    // Apply horizontal acceleration forces
    if (keys.a) player.velocityX -= player.speed;
    if (keys.d) player.velocityX += player.speed;

    // Apply friction drag
    player.velocityX *= player.friction;

    // Clamp running velocities
    if (player.velocityX > player.maxSpeed) player.velocityX = player.maxSpeed;
    if (player.velocityX < -player.maxSpeed) player.velocityX = -player.maxSpeed;

    // Apply constant downward gravity acceleration
    player.velocityY += player.gravity;

    // Trigger jump matrix if grounded and inputs match
    if ((keys.w || keys[' ']) && player.isGrounded) {
        player.velocityY = player.jumpStrength;
        player.isGrounded = false; 
    }

    // Mutate position tracking vectors
    player.x += player.velocityX;
    player.y += player.velocityY;

    // Reset grounded flag before calculating structural obstructions
    player.isGrounded = false;

    // AABB Platform Collision Processing (Solid Surfaces)
    platforms.forEach(platform => {
        // Condition A: Verify horizontal axis intersection
        const matchHorizontal = player.x + player.width > platform.x && player.x < platform.x + platform.width;

        // Condition B: Verify vertical bounding line intersection
        const matchVertical = player.y + player.height >= platform.y && player.y + player.height - player.velocityY <= platform.y + 6;

        // Resolve collision if falling onto a platform from above
        if (matchHorizontal && matchVertical && player.velocityY >= 0) {
            player.y = platform.y - player.height; // Snap smoothly to the surface
            player.velocityY = 0;                  // Cancel kinetic falling energy
            player.isGrounded = true;              // Restore jumping structural privileges
        }
    });

    // Boundary Collisions: Main Canvas Floor
    if (player.y + player.height >= canvas.height) {
        player.y = canvas.height - player.height; 
        player.velocityY = 0; 
        player.isGrounded = true; 
    }

    // Boundary Collisions: Left & Right Structural Screen Bounds
    if (player.x < 0) {
        player.x = 0;
        player.velocityX = 0;
    } else if (player.x + player.width > canvas.width) {
        player.x = canvas.width - player.width;
        player.velocityX = 0;
    }
}

// 8. Canvas Graphics Painter Pipeline
function renderGraphics() {
    // Wipe layout clean before paint cycle execution
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Turn off lighting effects for environment objects to preserve performance
    ctx.shadowBlur = 0;

    // Draw Static Structural Platforms
    platforms.forEach(platform => {
        ctx.fillStyle = platform.color;
        ctx.fillRect(platform.x, platform.y, platform.width, platform.height);

        // Draw a subtle design line across the top edge of each platform
        ctx.fillStyle = "#444455";
        ctx.fillRect(platform.x, platform.y, platform.width, 2);
    });

    // Draw Player Avatar Square with Cyberpunk Glow Matrix
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

// Execute core loop engine
gameLoop();