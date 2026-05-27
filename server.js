// 1. Imports & Setup
const express = require("express");
const path = require("path");
const fs = require("fs");
const crypto = require("crypto");

// 2. Initialize the App and Server Constants (MOVED UP HERE)
const app = express();
const PORT = process.env.PORT || 3000;

// Define the exact paths to your database files (MOVED UP HERE)
const usersDbPath = path.join(__dirname, "data", "users.json");
const profilesDbPath = path.join(__dirname, "data", "profiles.json");
const gamestateDbPath = path.join(__dirname, "data", "gamestate.json");

// 3. Now you can safely use "app" for your routes!
app.get("/api/test-live", (req, res) => {
    res.json({ status: "Server is reading new changes!" });
});

// 2. Middleware (MUST come before routes!)
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
// Sectional Title: Session Middleware Integration - 2026-05-18
app.use(express.urlencoded({ extended: true }));

// 2.5 Initialize Session Backpacks (Must be before routes!)
const session = require("express-session");
app.use(
    session({
        secret: "fractured-mind-secret-key",
        resave: false,
        saveUninitialized: false,
    }),
);

require("dotenv").config(); // Loads your .env variables
const Groq = require("groq-sdk");

// Force dotenv to look in the exact same directory as server.js
require("dotenv").config({ path: path.join(__dirname, ".env") });

// Log it to the console so you can physically see if it loaded!
console.log("Did the key load? ", process.env.GROQ_API_KEY ? "YES" : "NO");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Ensure your express app can parse JSON bodies
app.use(express.json());


// Sectional Title: Root Route Handling for Home/Login Page - 2026-05-18
app.get("/", (req, res) => {
    let announcementText = "";
    try {
        const adminPath = path.join(__dirname, "data", "admin.json");
        if (fs.existsSync(adminPath)) {
            let adminData = JSON.parse(fs.readFileSync(adminPath, "utf8"));
            announcementText = adminData.announcementText || "";
        }
    } catch(e) {}

    res.render("index", { announcementText });
});
// Sectional Title: Public Navigation Routes (Register & Dev-Log) - 2026-05-18
app.get("/register", (req, res) => {
    res.render("register");
});

app.get("/dev-log", (req, res) => {
    res.render("dev-log");
});

// Sectional Title: Public Profile Search & Admin Moderation - Checkpoint 13
app.get("/search", (req, res) => {
    // 1. Grab the search query from the URL (e.g., /search?q=playerOne)
    const searchQuery = req.query.q ? req.query.q.toLowerCase() : "";
    let results = [];

    // 2. If a search was executed, filter the database
    if (searchQuery) {
        try {
            let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, "utf8"));

            // Find all profiles where the username partially or exactly matches the query
            results = profilesDb.filter((profile) => 
                profile.username.toLowerCase().includes(searchQuery)
            );
        } catch (err) {
            console.error("[Search Module] Error reading profiles database:", err);
        }
    }

    // 3. Security Check: Is the person conducting the search an Admin?
    const isAdmin = req.session && req.session.isAdmin === true;

    // 4. Render the page with the search results and the admin authorization flag
    res.render("search", { 
        results: results, 
        searchQuery: searchQuery, 
        isAdmin: isAdmin 
    });
});

// Sectional Title: Admin Moderation - Terminate Neural Link
app.post("/admin/terminate", (req, res) => {
    // 1. Ultimate Security Guard: Verify they are actually an Admin!
    if (!req.session || !req.session.isAdmin) {
        console.log("[Admin Security] Unauthorized termination attempt blocked.");
        return res.redirect("/"); 
    }

    // 2. Grab the target user's ID from the hidden input in our form
    const targetUserId = req.body.userId;

    if (!targetUserId) {
        console.log("[Moderation] Termination failed: No user ID provided.");
        return res.redirect("/search");
    }

    try {
        console.log(`[Moderation] Initiating termination protocol for User ID: ${targetUserId}`);

        // 3. Read ALL relational databases
        let usersDb = JSON.parse(fs.readFileSync(usersDbPath, "utf8"));
        let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, "utf8"));
        let gamestateDb = JSON.parse(fs.readFileSync(gamestateDbPath, "utf8"));

        let playerDb = [];
        if (fs.existsSync(playerDbPath)) {
            playerDb = JSON.parse(fs.readFileSync(playerDbPath, "utf8"));
        }

        // 4. Filter out the targeted user from every single database
        // Note: users.json uses 'id', while the others use 'userId'
        usersDb = usersDb.filter(user => user.id !== targetUserId);
        profilesDb = profilesDb.filter(profile => profile.userId !== targetUserId);
        gamestateDb = gamestateDb.filter(state => state.userId !== targetUserId);
        playerDb = playerDb.filter(player => player.userId !== targetUserId && player.id !== targetUserId); 

        // 5. Save the scrubbed arrays back to the physical files
        fs.writeFileSync(usersDbPath, JSON.stringify(usersDb, null, 2));
        fs.writeFileSync(profilesDbPath, JSON.stringify(profilesDb, null, 2));
        fs.writeFileSync(gamestateDbPath, JSON.stringify(gamestateDb, null, 2));

        if (fs.existsSync(playerDbPath)) {
            fs.writeFileSync(playerDbPath, JSON.stringify(playerDb, null, 2));
        }

        console.log(`[Moderation] Neural Link Terminated. All records scrubbed.`);
    } catch (error) {
        console.error("[Moderation Error] Failed to complete data scrub:", error);
    }

    // 6. Redirect the admin back to the search page so they can keep working
    res.redirect("/search");
});

// Sectional Title: Aggregated Global Leaderboard Route
        // Sectional Title: Aggregated Global Leaderboard Route
        app.get("/leaderboard", (req, res) => {
            // 1. Helper to safely read files
            const readJsonSafe = (fileName) => {
                try {
                    const filePath = path.join(__dirname, "data", fileName);
                    if (fs.existsSync(filePath)) {
                        return JSON.parse(fs.readFileSync(filePath, "utf8"));
                    }
                } catch (err) {
                    console.error(`Error reading ${fileName}:`, err);
                }
                return [];
            };

            // 2. Load the raw run histories and player states
            const rawRuns = readJsonSafe("leaderboard.json");
            const playerStats = readJsonSafe("player.json");

            // 3. Aggregate data per player (Not per run!)
            const aggregatedData = {};

            rawRuns.forEach((run) => {
                const uname = run.username || "Unknown Entity";

                // If this player isn't in our grouped list yet, add them with baseline stats
                if (!aggregatedData[uname]) {
                    aggregatedData[uname] = {
                        username: uname,
                        totalRuns: 0,
                        victories: 0,
                        highestScore: 0,
                        highestLevel: 0,
                        shortestTime: Infinity, 
                        lowestCorruption: 100 // Default max corruption
                    };
                }

                let p = aggregatedData[uname];

                // Tally totals
                p.totalRuns++;
                if (run.gameCompleted) p.victories++;

                // Find "Bests"
                if (run.finalScore > p.highestScore) p.highestScore = run.finalScore;
                if (run.levelsCompleted > p.highestLevel) p.highestLevel = run.levelsCompleted;
                if (run.totalRuntime && run.totalRuntime < p.shortestTime) p.shortestTime = run.totalRuntime;
            });

            // 4. Cross-reference player.json to grab their lowest corruption & total kills
            playerStats.forEach((player) => {
                const uname = player.username;
                if (aggregatedData[uname]) {
                    // If they have a corruption level lower than our current record, update it
                    if (player.corruptionLevel !== undefined && player.corruptionLevel < aggregatedData[uname].lowestCorruption) {
                        aggregatedData[uname].lowestCorruption = player.corruptionLevel;
                    }
                    aggregatedData[uname].totalKills = player.totalKills || 0;
                }
            });

            // 5. Clean up the data array for the frontend
            const leaderboardArray = Object.values(aggregatedData).map(p => {
                // If they never recorded a valid time, set it to 0 instead of Infinity
                if (p.shortestTime === Infinity) p.shortestTime = 0; 
                return p;
            });

            // 6. Pass the compiled array as a JSON string to the frontend EJS
            res.render("leaderboard", { 
                leaderboardData: JSON.stringify(leaderboardArray) 
            });
        });
// Sectional Title: Administrative Control Dashboard Routes - 2026-05-18
app.get("/admin", (req, res) => {
    // 1. Security Check: Block access if not logged in as admin
    if (!req.session || !req.session.isAdmin) {
        console.log("[Admin Security] Unauthorized view attempt on /admin blocked.");
        return res.redirect("/"); 
    }

    // 2. Helper to safely read flat JSON databases without crashing
    const readJsonSafe = (fileName) => {
        try {
            const filePath = path.join(__dirname, "data", fileName);
            if (fs.existsSync(filePath)) {
                return JSON.parse(fs.readFileSync(filePath, "utf8"));
            }
        } catch (err) {
            console.error(`Error reading ${fileName}:`, err);
        }
        return []; // Return empty array if file is missing
    };

    // 3. Load all relational databases
    const users = readJsonSafe("users.json");
    const leaderboard = readJsonSafe("leaderboard.json");
    const playerStats = readJsonSafe("player.json");

    // Parse Admin Settings (with a safe fallback if the file doesn't exist yet)
    let adminConfig = { systemMaintenanceMode: false, globalSpawnRateMultiplier: 1.0, announcementText: "All systems online." };
    try {
        const adminPath = path.join(__dirname, "data", "admin.json");
        if (fs.existsSync(adminPath)) {
            let parsed = JSON.parse(fs.readFileSync(adminPath, "utf8"));
            adminConfig = Array.isArray(parsed) ? parsed[0] : parsed;
        }
    } catch(e) {}

    // 4. Compute Dashboard Telemetry Metrics
    const totalAccounts = users.length;
    const totalRunsGlobally = leaderboard.length;

    const gameBeatenCount = leaderboard.filter((run) => {
        return run.levelsCompleted >= 5 || run.gameCompleted === true || run.finalScore >= 500;
    }).length;

    let cumulativeEntitiesEliminated = 0;
    let cumulativeCracksSealed = 0;
    let runningTotalCorruption = 0;
    let criticalOverloadLockouts = 0;

    playerStats.forEach((player) => {
        cumulativeEntitiesEliminated += (player.totalKills || 0);
        cumulativeCracksSealed += (player.cracksClosed || 0);
        runningTotalCorruption += (player.corruptionLevel || 0);

        if (player.corruptionLevel >= 100) criticalOverloadLockouts++;
    });

    const averageCorruptionLevel = playerStats.length > 0 
        ? (runningTotalCorruption / playerStats.length).toFixed(1) 
        : "0.0";

    // 5. Package the data object
    const telemetry = {
        totalAccounts,
        totalRunsGlobally,
        gameBeatenCount,
        cumulativeEntitiesEliminated,
        cumulativeCracksSealed,
        criticalOverloadLockouts,
        averageCorruptionLevel,
        systemStatus: adminConfig
    };

    // 6. Render the view AND pass the telemetry data to it!
    res.render("admin", { telemetry });
});

// Sectional Title: Serve the Admin Update Form View
app.get("/admin/update", (req, res) => {
    // Block access if the user hasn't successfully logged in as an admin
    if (!req.session || !req.session.isAdmin) {
        console.log("[Admin Security] Unauthorized view attempt on /admin/update blocked.");
        return res.redirect("/"); // Kick them back to the login screen
    }

    // Serve the admin-update.ejs file
    res.render("admin-update");
});

// Sectional Title: Save Admin Configurations
app.post("/admin/update", (req, res) => {
    if (!req.session || !req.session.isAdmin) return res.redirect("/");

    const adminPath = path.join(__dirname, "data", "admin.json");

    // Parse the numbers from the form payload
    const newConfig = {
        levelsUntilBoss: parseInt(req.body.levelsUntilBoss) || 4,
        playerMaxHealth: parseInt(req.body.playerMaxHealth) || 100,
        playerMeleeDamage: parseInt(req.body.playerMeleeDamage) || 10,
        enemyBaseHealth: parseInt(req.body.enemyBaseHealth) || 30,
        enemyDamage: parseInt(req.body.enemyDamage) || 10,
        announcementText: req.body.announcementText || ""
    };

    fs.writeFileSync(adminPath, JSON.stringify(newConfig, null, 2));
    console.log("[Admin] Game engine configurations updated.");

    res.redirect("/admin"); // Redirect back to the dashboard upon success
});

// Sectional Title: Registration POST Route Stub - 2026-05-18
// Sectional Title: Registration Logic & File Writing - 2026-05-18
app.post("/auth/register", (req, res) => {
    const { username, password } = req.body;

    // 1. Generate the required schema properties
    const userId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 2. Read the current database
    let usersDb = JSON.parse(fs.readFileSync(usersDbPath, "utf8"));

    // 3. Construct the new user record
    const newUserRecord = {
        id: userId,
        username: username,
        password: password, // In production this would be hashed
        createdAt: timestamp,
    };

    // 4. Append and save the updated file
    usersDb.push(newUserRecord);
    fs.writeFileSync(usersDbPath, JSON.stringify(usersDb, null, 2));
    // Sectional Title: Extended Profile Registration Logic - 2026-05-18
    // 1. Extract ALL profile and narrative specifics from the form
    const {
        email,
        auraColor,
        mindState,
        coreMemory,
        avatarUrl,
        bio,
        combatStyle,
    } = req.body;

    // 2. Read existing relational databases (Keep your existing code here!)
    let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, "utf8"));
    let gamestateDb = JSON.parse(fs.readFileSync(gamestateDbPath, "utf8"));

    // 3. Construct and append the full Profile record
    profilesDb.push({
        id: crypto.randomUUID(),
        userId: userId,
        username: username,
        email: email,
        avatarUrl: avatarUrl,
        bio: bio,
        auraColor: auraColor,
        mindState: mindState,
        combatStyle: combatStyle,
        coreMemory: coreMemory,
    });

    // 4. Construct and append the new Game State record with default starting values
    gamestateDb.push({
        id: crypto.randomUUID(),
        userId: userId,
        currentLevel: 1,
        totalAnomaliesSealed: 0,
        weaponUpgrades: [],
        sanityLevel: 100,
        lastSaved: timestamp,
    });

    // 5. Save everything to the physical files
    fs.writeFileSync(profilesDbPath, JSON.stringify(profilesDb, null, 2));
    fs.writeFileSync(gamestateDbPath, JSON.stringify(gamestateDb, null, 2));
    // Redirect to login
    res.redirect("/");
});

// Sectional Title: Login Authentication Route - 2026-05-18
app.post("/auth/login", (req, res) => {
    const { username, password } = req.body;

    // 1. CHOOSE YOUR ADMINISTRATIVE CREDENTIALS
    const ADMIN_USERNAME = "391428";
    const ADMIN_PASSWORD = "cm012411";

    // 2. INTERCEPT AND EVALUATE FOR ADMINISTRATIVE OVERRIDE
    if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
        console.log(`[Fractured Mind] Administrative security override successful.`);
        req.session.userId = "admin-root-id";
        req.session.isAdmin = true; // Inject secure permission flag into session
        return res.redirect("/admin"); // Reroute straight to dashboard
    }

    // 3. FALLBACK FOR STANDARD USER PROFILES (Your existing database search)
    let usersDb = JSON.parse(fs.readFileSync(usersDbPath, "utf8"));
    const validUser = usersDb.find(
        (user) => user.username === username && user.password === password,
    );

    if (validUser) {
        console.log(
            `[Fractured Mind] Synchronization successful for: ${validUser.username}`,
        );
        req.session.userId = validUser.id;
        req.session.isAdmin = false; // Ensure standard users don't inherit admin rights
        res.redirect("/game");
    } else {
        console.log(`[Fractured Mind] Failed synchronization attempt.`);
        res.redirect("/");
    }
});

// Define the path to your player database as defined in the PRD
const playerDbPath = path.join(__dirname, "data", "player.json");

// --- MILESTONE 8 & 11: Upgrade Collection & Auto-Save Tracking ---
app.post("/api/collect-upgrade", (req, res) => {
    try {
        if (!req.session.userId) {
            return res
                .status(401)
                .json({ error: "Unauthorized session tracking." });
        }

        const { upgradeName } = req.body;

        // 1. Read existing Gamestate Database
        let gamestateDb = JSON.parse(fs.readFileSync(gamestateDbPath, "utf8"));
        let playerState = gamestateDb.find(
            (g) => g.userId === req.session.userId,
        );

        if (!playerState) {
            return res
                .status(404)
                .json({ error: "Active telemetry profile not found." });
        }

        // 2. Prevent duplicates and save to weaponUpgrades array
        if (!playerState.weaponUpgrades) playerState.weaponUpgrades = [];

        if (!playerState.weaponUpgrades.includes(upgradeName)) {
            playerState.weaponUpgrades.push(upgradeName);
            // Auto-Save operation writing directly back to the flat-file database
            fs.writeFileSync(
                gamestateDbPath,
                JSON.stringify(gamestateDb, null, 2),
            );
        }

        res.json({
            message: `Successfully synchronized upgrade: ${upgradeName}`,
        });
    } catch (error) {
        console.error("Upgrade Collection Error:", error.message);
        res.status(500).json({
            error: "Failed to secure state preservation update.",
        });
    }
});

// --- MILESTONE 11: Mirror Boss Logic & End-Game Encounter Matrix ---
// --- MILESTONE 11: Mirror Boss Logic & End-Game Encounter Matrix ---
// --- MILESTONE 11: Mirror Boss Logic & End-Game Encounter Matrix ---
app.post("/api/generate-boss-level", async (req, res) => {
    // 1. Build the Arena first so it ALWAYS exists, even if the server fails
    const bossEncounterGrid = Array(12)
        .fill(null)
        .map((_, rowIndex) => {
            if (rowIndex === 11) return Array(40).fill(1); // Solid floor
            if (rowIndex >= 0 && rowIndex <= 2) return Array(40).fill(0); // Top 3 air clearance

            const row = Array(40).fill(0);
            row[0] = 1; // Containment wall Left
            row[39] = 1; // Containment wall Right

            if (rowIndex === 8) {
                for (let col = 12; col <= 27; col++) row[col] = 1;
            }
            if (rowIndex === 5) {
                for (let col = 4; col <= 10; col++) row[col] = 1;
                for (let col = 29; col <= 35; col++) row[col] = 1;
            }
            return row;
        });

    try {
        if (!req.session.userId) {
            throw new Error(
                "Session wiped/Unauthorized. Reverting to fallback boss.",
            );
        }

        let gamestateDb = JSON.parse(fs.readFileSync(gamestateDbPath, "utf8"));
        let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, "utf8"));

        let playerState = gamestateDb.find(
            (g) => g.userId === req.session.userId,
        );
        let playerProfile = profilesDb.find(
            (p) => p.userId === req.session.userId,
        );

        // Safeguard against older save files that don't have weaponUpgrades yet
        let upgrades =
            playerState && playerState.weaponUpgrades
                ? playerState.weaponUpgrades
                : [];
        let sanity = playerState ? playerState.sanityLevel : 100;
        let username = playerProfile ? playerProfile.username : "Reflection";

        let bossHealth = 150;
        let bossSpeed = 5;
        let bossBaseDamage = 15;
        let bossAbilities = {
            hasExtendedRange: false,
            hasDashSprint: false,
            hasHealingCore: false,
        };

        upgrades.forEach((upgrade) => {
            if (upgrade === "Prismatic Edge") {
                bossBaseDamage += 10;
                bossAbilities.hasExtendedRange = true;
            }
            if (upgrade === "Speed Thrusters") {
                bossSpeed += 3;
                bossAbilities.hasDashSprint = true;
            }
            if (upgrade === "Quantum Core") {
                bossHealth += 75;
                bossAbilities.hasHealingCore = true;
            }
        });

        const clampedSanity = Math.max(0, Math.min(100, sanity));
        const inverseSanityMultiplier = 1 + (100 - clampedSanity) / 50;
        const finalCalculatedDamage = Math.round(
            bossBaseDamage * inverseSanityMultiplier,
        );

        res.json({
            grid: bossEncounterGrid,
            bossTelemetry: {
                name: `Mirror Reflection of ${username}`,
                health: bossHealth,
                maxHealth: bossHealth,
                speed: bossSpeed,
                damage: finalCalculatedDamage,
                abilities: bossAbilities,
                copiedUpgrades: upgrades,
            },
        });
    } catch (error) {
        console.warn("Mirror Boss Compilation Warning:", error.message);

        // SAFE FALLBACK: If authentication drops or database errors occur,
        // return the baseline boss instead of breaking the game loop!
        res.json({
            grid: bossEncounterGrid,
            bossTelemetry: {
                name: "Corrupted Memory",
                health: 150,
                maxHealth: 150,
                speed: 5,
                damage: 15,
                abilities: {
                    hasExtendedRange: false,
                    hasDashSprint: false,
                    hasHealingCore: false,
                },
                copiedUpgrades: [],
            },
        });
    }
});

// Sectional Title: Fetching Session Profile for Game View - 2026-05-18
// Sectional Title: Fetching Session Profile for Game View - 2026-05-18
app.get("/game", (req, res) => {
    if (!req.session.userId) {
        console.log("[Fractured Mind] Unauthorized access attempt blocked.");
        return res.redirect("/");
    }

    let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, "utf8"));
    const userProfile = profilesDb.find(
        (profile) => profile.userId === req.session.userId,
    );

    if (!userProfile) {
        console.log(
            `[Fractured Mind] Warning: No profile found for userId: ${req.session.userId}`,
        );
        return res.redirect("/");
    }

    // --- NEW: Fetch the live Admin Config to pass to the engine! ---
    let adminConfig = { 
        levelsUntilBoss: 4, 
        playerMaxHealth: 100, 
        playerMeleeDamage: 10, 
        enemyBaseHealth: 30, 
        enemyDamage: 10,
        announcementText: "All systems operational."
    };

    try {
        const adminPath = path.join(__dirname, "data", "admin.json");
        if (fs.existsSync(adminPath)) {
            let parsed = JSON.parse(fs.readFileSync(adminPath, "utf8"));
            adminConfig = Array.isArray(parsed) ? parsed[0] : parsed;
        }
    } catch(e) {
        console.error("Error reading admin.json:", e);
    }

    // --- NEW: Pass BOTH the profile and the adminConfig to the EJS template ---
    res.render("game", { 
        profile: userProfile, 
        adminConfig: adminConfig 
    });
});

// Route to completely clear the admin session and exit to homepage
app.get("/auth/logout", (req, res) => {
    req.session.destroy((err) => {
        if (err) console.error("Error clearing session:", err);
        res.redirect("/");
    });
});

// --- 404 TRAP DIAGNOSTIC ---
app.use((req, res) => {
    console.log(
        `[TARGET ACQUIRED] The server received a ${req.method} request to: ${req.originalUrl}`,
    );
    res.status(404).json({
        error: "Express looked for this route but couldn't find a match.",
        requestedPath: req.originalUrl,
        method: req.method,
    });
});

// Start the server and save it to a variable
const server = app.listen(PORT, () => {
    console.log(
        `[Fractured Mind] Server successfully initialized on port ${PORT}`,
    );
});

// --- ANTI-GHOST PROCESS LOGIC ---
// This safely closes the port when you stop the server or when it crashes

const cleanShutdown = () => {
    console.log("[Fractured Mind] Releasing port and shutting down...");
    server.close(() => {
        process.exit(0);
    });
};

// Listen for termination signals (like hitting the Stop button or Ctrl+C)
process.on("SIGINT", cleanShutdown);
process.on("SIGTERM", cleanShutdown);

// Listen for unexpected crashes so it still cleans up before dying
process.on("uncaughtException", (err) => {
    console.error("FATAL ERROR:", err.message);
    cleanShutdown();
});
