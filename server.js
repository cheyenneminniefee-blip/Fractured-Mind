// Sectional Title: Correct Express Architecture Order - 2026-05-18

// 1. Imports & Setup
const express = require('express');
const path = require('path');
// Sectional Title: File System and Utility Dependencies - 2026-05-18
const fs = require('fs');
const crypto = require('crypto');

// Define the exact path to your database file
const usersDbPath = path.join(__dirname, 'data', 'users.json');
// Sectional Title: Extended Database Paths Initialization - 2026-05-18
const profilesDbPath = path.join(__dirname, 'data', 'profiles.json');
const gamestateDbPath = path.join(__dirname, 'data', 'gamestate.json');
const app = express();
const PORT = process.env.PORT || 3000;

// 2. Middleware (MUST come before routes!)
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// Sectional Title: Session Middleware Integration - 2026-05-18
app.use(express.urlencoded({ extended: true }));                  

// 2.5 Initialize Session Backpacks (Must be before routes!)
const session = require('express-session');
app.use(session({
    secret: 'fractured-mind-secret-key', 
    resave: false,
    saveUninitialized: false
}));

require('dotenv').config(); // Loads your .env variables
const Groq = require("groq-sdk");
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Ensure your express app can parse JSON bodies
app.use(express.json());

// Sectional Title: Root Route Handling for Home/Login Page - 2026-05-18
app.get('/', (req, res) => {
    res.render('index');
});
// Sectional Title: Public Navigation Routes (Register & Dev-Log) - 2026-05-18
app.get('/register', (req, res) => {
    res.render('register');
});

app.get('/dev-log', (req, res) => {
    res.render('dev-log');
});

app.get('/search', (req, res) => {
    res.render('search');
});

app.get('/leaderboard', (req, res) => {
    res.render('leaderboard');
});
// Sectional Title: Administrative Control Dashboard Routes - 2026-05-18
app.get('/admin', (req, res) => {
    res.render('admin');
});

app.get('/admin-update', (req, res) => {
    res.render('admin-update');
});

// Sectional Title: Registration POST Route Stub - 2026-05-18
// Sectional Title: Registration Logic & File Writing - 2026-05-18
app.post('/auth/register', (req, res) => {
    const { username, password } = req.body;

    // 1. Generate the required schema properties
    const userId = crypto.randomUUID();
    const timestamp = new Date().toISOString();

    // 2. Read the current database
    let usersDb = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));

    // 3. Construct the new user record
    const newUserRecord = {
        id: userId,
        username: username,
        password: password, // In production this would be hashed
        createdAt: timestamp
    };

    // 4. Append and save the updated file
    usersDb.push(newUserRecord);
    fs.writeFileSync(usersDbPath, JSON.stringify(usersDb, null, 2));
    // Sectional Title: Extended Profile Registration Logic - 2026-05-18
    // 1. Extract ALL profile and narrative specifics from the form
    const { email, auraColor, mindState, coreMemory, avatarUrl, bio, combatStyle } = req.body;

    // 2. Read existing relational databases (Keep your existing code here!)
    let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, 'utf8'));
    let gamestateDb = JSON.parse(fs.readFileSync(gamestateDbPath, 'utf8'));

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
        coreMemory: coreMemory
    });

    // 4. Construct and append the new Game State record with default starting values
    gamestateDb.push({
        id: crypto.randomUUID(),
        userId: userId,
        currentLevel: 1,
        totalAnomaliesSealed: 0,
        weaponUpgrades: [],
        sanityLevel: 100,
        lastSaved: timestamp
    });

    // 5. Save everything to the physical files
    fs.writeFileSync(profilesDbPath, JSON.stringify(profilesDb, null, 2));
    fs.writeFileSync(gamestateDbPath, JSON.stringify(gamestateDb, null, 2));
    // Redirect to login
    res.redirect('/');
});

// Sectional Title: Login Authentication Route - 2026-05-18
app.post('/auth/login', (req, res) => {
    const { username, password } = req.body;
    let usersDb = JSON.parse(fs.readFileSync(usersDbPath, 'utf8'));
    const validUser = usersDb.find(user => user.username === username && user.password === password);

    if (validUser) {
        console.log(`[Fractured Mind] Synchronization successful for: ${validUser.username}`);
        req.session.userId = validUser.id; 
        res.redirect('/game'); 
    } else {
        console.log(`[Fractured Mind] Failed synchronization attempt.`);
        res.redirect('/'); 
    }
}); 

// --- MILESTONE 9: AI Dialogue Generation Endpoint ---
app.post('/api/chat', async (req, res) => {
    try {
        const playerMessage = req.body.message;
        const playerProfile = req.body.profile;

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `You are a native, lore-accurate memory entity in the abstract space of 'Fractured Mind'. 
                              The player's mind is shattered. Speak cryptically but provide hints about sealing anomalies (cracks) and avoiding ghosts. 
                              CRITICAL RULE: You must restrict your output to a maximum of three (3) sentences. No exceptions.`
                },
                {
                    role: "user",
                    content: playerMessage
                }
            ],
            model: "llama-3.1-8b-instant", 
            temperature: 0.7
        });

        const reply = chatCompletion.choices[0]?.message?.content || "The memory entity remains silent.";
        res.json({ response: reply });

    } catch (error) {
        console.error("Groq API Error:", error);
        res.status(500).json({ error: "Failed to connect to the memory matrix." });
    }
});

// --- MILESTONE 10: AI Procedural Generation Endpoint ---
    // --- MILESTONE 10: AI Procedural Generation Endpoint ---
    app.post('/api/generate-level', async (req, res) => {
        try {
            const difficulty = req.body.difficulty || "Medium"; 

            const completion = await groq.chat.completions.create({
                messages: [
                    {
                        role: "system",
                        content: `You are the backend procedural level compiler for the game 'Fractured Mind'.
                                  Your job is to return a raw JSON object containing BOTH a 2D room platform layout and an array of 'cracks'.

                                  RULES:
                                  1. Return ONLY valid JSON. No conversational text or markdown blocks.
                                  2. Expected schema layout:
                                     {
                                       "grid": [ [12 arrays representing rows, each containing exactly 40 integers] ],
                                       "cracks": [ {"x": number, "y": number, "spawnRate": number} ]
                                     }
                                  3. Matrix Layout Guidelines (12 rows x 40 columns):
                                     - 0 = Open Air Workspace, 1 = Solid Cybernetic Ground, 4 = Memory Entity NPC.
                                     - Add creative floating jumps/platforms using 1s throughout rows 3 to 10 so the player can climb. 
                                     - Place exactly one '4' element resting safely on top of a platform block (rows 3 to 10).

                                     CRITICAL QUANTITY LIMITS:
                                     - The TOTAL number of ground blocks (1s) across the entire 12x40 matrix MUST be between 60 and 90 tiles total.
                                     - (Since your floor row takes up exactly 40 tiles, this gives you a budget of 20 to 50 floating platform tiles across rows 3-10). Do not place more or fewer.`
                    },
                    {
                        role: "user",
                        content: `Generate a completely new, unique room layout matrix and crack sequence for ${difficulty} difficulty.`
                    }
                ],
                model: "llama-3.1-8b-instant",
                temperature: 0.5, 
                response_format: { type: "json_object" } 
            });

            let levelData = JSON.parse(completion.choices[0]?.message?.content);

            if (!levelData || !Array.isArray(levelData.grid) || !Array.isArray(levelData.cracks)) {
                throw new Error("AI returned malformed room matrix schema");
            }

            // --- BACKEND POST-PROCESSING SANITIZATION LAYER ---
            while (levelData.grid.length < 12) levelData.grid.push(Array(40).fill(0));
            levelData.grid = levelData.grid.slice(0, 12);

            let totalPlatforms = 0;
            let floatingPlatformCoords = [];

            for (let rowIndex = 0; rowIndex < 12; rowIndex++) {
                if (!Array.isArray(levelData.grid[rowIndex])) {
                    levelData.grid[rowIndex] = Array(40).fill(0);
                }
                while (levelData.grid[rowIndex].length < 40) levelData.grid[rowIndex].push(0);
                levelData.grid[rowIndex] = levelData.grid[rowIndex].slice(0, 40);

                // Force Sky Air (Rows 0, 1, 2)
                if (rowIndex === 0 || rowIndex === 1 || rowIndex === 2) {
                    levelData.grid[rowIndex] = Array(40).fill(0);
                }

                // Force Ground Floor (Row 11)
                if (rowIndex === 11) {
                    levelData.grid[rowIndex] = Array(40).fill(1);
                }

                // Count existing platforms and catalog where floating blocks are located
                for (let colIndex = 0; colIndex < 40; colIndex++) {
                    if (levelData.grid[rowIndex][colIndex] === 1) {
                        totalPlatforms++;
                        if (rowIndex >= 3 && rowIndex <= 10) {
                            floatingPlatformCoords.push({ r: rowIndex, c: colIndex });
                        }
                    }
                }
            }

            // --- ENFORCE ABSOLUTE MINIMUM AND MAXIMUM LIMITS ---
            const MIN_TOTAL_PLATFORMS = 60; // 40 for floor + 20 floating blocks minimum
            const MAX_TOTAL_PLATFORMS = 90; // 40 for floor + 50 floating blocks maximum

            // Case A: AI spawned too many blocks. Randomly remove platforms from rows 3-10
            while (totalPlatforms > MAX_TOTAL_PLATFORMS && floatingPlatformCoords.length > 0) {
                const randIndex = Math.floor(Math.random() * floatingPlatformCoords.length);
                const { r, c } = floatingPlatformCoords.splice(randIndex, 1)[0];

                // Check if NPC '4' is sitting directly above this block. If so, leave it so it doesn't fall!
                const objectAbove = (r > 0) ? levelData.grid[r - 1][c] : 0;

                if (levelData.grid[r][c] === 1 && objectAbove !== 4) {
                    levelData.grid[r][c] = 0;
                    totalPlatforms--;
                }
            }

            // Case B: AI spawned too few blocks. Randomly pad blocks out across rows 3-10
            let safetyCounter = 0;
            while (totalPlatforms < MIN_TOTAL_PLATFORMS && safetyCounter < 500) {
                safetyCounter++; // Prevents infinite loops if the map runs out of space
                const r = Math.floor(Math.random() * 8) + 3; // Rows 3 to 10
                const c = Math.floor(Math.random() * 40);

                if (levelData.grid[r][c] === 0) {
                    levelData.grid[r][c] = 1;
                    totalPlatforms++;
                }
            }

            // Return perfectly limited layout data back to client
            res.json(levelData);

        } catch (error) {
            console.error("Groq Level Gen Error:", error.message);
            const fallbackGrid = Array(12).fill(null).map((_, rowIndex) => 
                rowIndex === 11 ? Array(40).fill(1) : Array(40).fill(0)
            );
            fallbackGrid[10][5] = 4; 
            fallbackGrid[9][15] = 1; fallbackGrid[9][16] = 1; 

            res.json({ 
                grid: fallbackGrid,
                cracks: [{ x: 600, y: 120, spawnRate: 180 }] 
            });
        }
    });;

// Sectional Title: Fetching Session Profile for Game View - 2026-05-18
app.get('/game', (req, res) => {
    if (!req.session.userId) {
        console.log("[Fractured Mind] Unauthorized access attempt blocked.");
        return res.redirect('/'); 
    }

    let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, 'utf8'));
    const userProfile = profilesDb.find(profile => profile.userId === req.session.userId);

    if (!userProfile) {
        console.log(`[Fractured Mind] Warning: No profile found for userId: ${req.session.userId}`);
        return res.redirect('/'); 
    }

    res.render('game', { profile: userProfile });
});

app.listen(PORT, () => {
    console.log(`[Fractured Mind] Server successfully initialized on port ${PORT}`);
});