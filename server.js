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
app.use(express.urlencoded({ extended: true })); // <--- Check this!
app.use(express.json());                         // <--- Check this!
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
// Sectional Title: Core Game, Search, and Leaderboard Route Stubs - 2026-05-18
app.get('/game', (req, res) => {
    res.render('game');
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
    // Sectional Title: Profile and Game State Initialization - 2026-05-18
    // 1. Extract narrative specifics from the form
    const { auraColor, mindState, coreMemory } = req.body;

    // 2. Read existing relational databases
    let profilesDb = JSON.parse(fs.readFileSync(profilesDbPath, 'utf8'));
    let gamestateDb = JSON.parse(fs.readFileSync(gamestateDbPath, 'utf8'));

    // 3. Construct and append the new Profile record
    profilesDb.push({
        id: crypto.randomUUID(),
        userId: userId, // This links directly to the users.json record!
        username: username,
        auraColor: auraColor,
        mindState: mindState,
        coreMemory: coreMemory,
        joinedDate: timestamp
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

app.listen(PORT, () => {
    console.log(`[Fractured Mind] Server successfully initialized on port ${PORT}`);
});