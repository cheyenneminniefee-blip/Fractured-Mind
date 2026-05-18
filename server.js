// Sectional Title: Express Server Baseline Setup and Listener - 2026-05-18
const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`[Fractured Mind] Server successfully initialized on port ${PORT}`);
});