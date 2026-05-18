// Sectional Title: Express Server Baseline Setup and Listener - 2026-05-18
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;
// Sectional Title: Express View Engine and Static Middleware Configuration - 2026-05-18
const path = require('path');

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// Sectional Title: Root Route Handling for Home/Login Page - 2026-05-18
app.get('/', (req, res) => {
    res.render('index');
});

app.listen(PORT, () => {
    console.log(`[Fractured Mind] Server successfully initialized on port ${PORT}`);
});