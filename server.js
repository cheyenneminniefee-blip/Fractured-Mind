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
app.use(express.json());                         

// 2.5 Initialize Session Backpacks (Must be before routes!)
const session = require('express-session');
app.use(session({
    secret: 'fractured-mind-secret-key', 
    resave: false,
    saveUninitialized: false
}));

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
    // Sectional Title: Corrected Login Authentication Route - 2026-05-18
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

// 2. Update your /game route to check for the session:
// Sectional Title: Fetching Session Profile for Game View - 2026-05-18
// Sectional Title: Secure Profile Fallback Handling - 2026-05-18
app.get('/game', (req, res) => {
    if (!req.session.userId) {
        console.log("[Fractured Mind] Unauthorized access attempt blocked.");
        return res.redirect('/'); 
    }

    let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, 'utf8'));
    const userProfile = profilesDb.find(profile => profile.userId === req.session.userId);

    // SAFETY GATE: If the user is logged in but has no profile entry, don't crash!
    if (!userProfile) {
        console.log(`[Fractured Mind] Warning: No profile found for userId: ${req.session.userId}`);
        return res.redirect('/'); // Redirect them to safety
    }

    res.render('game', { profile: userProfile });
});

app.listen(PORT, () => {
    console.log(`[Fractured Mind] Server successfully initialized on port ${PORT}`);
});