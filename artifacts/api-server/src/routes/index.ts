import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
import crypto from "crypto";
import fs from "fs";
import path from "path";

const router = Router();

// --- THE FIX: Initialize the Groq client ---
// This assumes you have your GROQ_API_KEY set in your .env file
const groq = new Groq();

// Define data directory path relative to working directory
const DATA_DIR = path.join(process.cwd(), "data");

// Safe file parser utility to guarantee zero server crashes if a JSON file is missing or empty
const readJsonFile = (filename: string): any[] => {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    const filePath = path.join(DATA_DIR, filename);
    if (!fs.existsSync(filePath)) return [];
    const rawData = fs.readFileSync(filePath, "utf-8");
    return JSON.parse(rawData || "[]");
  } catch (error) {
    console.error(`[Admin Parser] Error reading ${filename}:`, error);
    return [];
  }
};

// Safe configuration reader for administrative control states
const readAdminConfig = (): any => {
  try {
    const filePath = path.join(DATA_DIR, "admin.json");
    if (!fs.existsSync(filePath)) {
      return {
        systemMaintenanceMode: false,
        globalSpawnRateMultiplier: 1.0,
        announcementText: "All systems online.",
      };
    }
    const rawData = fs.readFileSync(filePath, "utf-8");
    const parsed = JSON.parse(rawData || "{}");
    return Array.isArray(parsed) ? parsed[0] : parsed;
  } catch (error) {
    return {
      systemMaintenanceMode: false,
      globalSpawnRateMultiplier: 1.0,
      announcementText: "All systems online.",
    };
  }
};

// --- NEW: ADMINISTRATIVE TELEMETRY DASHBOARD ROUTE ---
router.get("/admin", (req: Request, res: Response) => {
  // 1. Gather all raw flat file collections
  const users = readJsonFile("users.json");
  const leaderboard = readJsonFile("leaderboard.json");
  const playerStats = readJsonFile("player.json");
  const adminConfig = readAdminConfig();

  // 2. Metrics Aggregation Logic
  const totalAccounts = users.length;
  const totalRunsGlobally = leaderboard.length;

  // Hardcoded Victory Threshold: Count any run where level completion is >= 5, or difficulty was Hard, or final score matches win criteria
  const gameBeatenCount = leaderboard.filter((run: any) => {
    return (
      run.levelsCompleted >= 5 ||
      run.gameCompleted === true ||
      run.finalScore >= 500
    );
  }).length;

  // Contextual Combat & Psychological Metadata
  let cumulativeEntitiesEliminated = 0;
  let cumulativeCracksSealed = 0;
  let runningTotalCorruption = 0;
  let criticalOverloadLockouts = 0;

  playerStats.forEach((player: any) => {
    cumulativeEntitiesEliminated += player.totalKills || 0;
    cumulativeCracksSealed += player.cracksClosed || 0;
    runningTotalCorruption += player.corruptionLevel || 0;

    // Count how many players are in an active 100% Corruption Lockout state
    if (player.corruptionLevel >= 100) {
      criticalOverloadLockouts++;
    }
  });

  const averageCorruptionLevel =
    playerStats.length > 0
      ? (runningTotalCorruption / playerStats.length).toFixed(1)
      : "0.0";

  // Package computed data for explicit presentation inside views/admin.ejs
  const telemetry = {
    totalAccounts,
    totalRunsGlobally,
    gameBeatenCount,
    cumulativeEntitiesEliminated,
    cumulativeCracksSealed,
    criticalOverloadLockouts,
    averageCorruptionLevel,
    systemStatus: adminConfig,
  };

  // Render out structured template and forward dashboard parameters
  res.render("admin", { telemetry });
});

// --- AI Dialogue Generation Endpoint ---
router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerMessage = req.body.message;

    // FIX: Prevent fatal API crashes by intercepting empty/invalid inputs
    if (
      !playerMessage ||
      typeof playerMessage !== "string" ||
      playerMessage.trim() === ""
    ) {
      res.json({
        response: "The memory entity stares blankly. It requires input.",
      });
      return;
    }

    const chatCompletion = await groq.chat.completions.create({
      // ... [rest of your AI call remains the same]
      messages: [
        {
          role: "system",
          content: `You are a native, lore-accurate memory entity in the abstract space of 'Fractured Mind'. 
                    The player's mind is shattered. Speak cryptically but provide hints about sealing anomalies (cracks) and avoiding ghosts. 
                    CRITICAL RULE: You must restrict your output to a maximum of two (2) sentences. No exceptions.`,
        },
        {
          role: "user",
          content: playerMessage,
        },
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.7,
    });

    const reply =
      chatCompletion.choices[0]?.message?.content ||
      "The memory entity remains silent.";
    res.json({ response: reply });
  } catch (error) {
    console.error("Groq API Error:", error);
    res.status(500).json({ error: "Failed to connect to the memory matrix." });
  }
});

// --- CENTRAL DIFFICULTY ADJUSTER MATRIX ---
const difficultyConfig: Record<
  string,
  {
    maxCracks: number;
    minSpawnRate: number;
    maxSpawnRate: number;
    minTiles: number;
    maxTiles: number;
  }
> = {
  Easy: {
    maxCracks: 1,
    minSpawnRate: 240,
    maxSpawnRate: 300,
    minTiles: 55,
    maxTiles: 70,
  },
  Medium: {
    maxCracks: 2,
    minSpawnRate: 150,
    maxSpawnRate: 240,
    minTiles: 70,
    maxTiles: 85,
  },
  Hard: {
    maxCracks: 4,
    minSpawnRate: 90,
    maxSpawnRate: 150,
    minTiles: 85,
    maxTiles: 105,
  },
};

// --- AI Procedural Level Generation Endpoint ---
router.post(
  "/generate-level",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const difficulty = req.body.difficulty || "Medium";
      const isBossLevel = req.body.isBoss === true; // NEW: Catch the boss flag from the frontend
      const randomSeed = crypto.randomUUID();

      // =================================================================
      // NEW: BOSS ARENA INTERCEPT
      // =================================================================
      if (isBossLevel) {
        console.log("[SYSTEM] Boss level requested. Bypassing AI generation.");

        // Create a symmetrical 12x40 combat arena
        const bossGrid = Array(12)
          .fill(null)
          .map((_, rowIndex) => {
            // Solid floor baseline
            if (rowIndex === 11) return Array(40).fill(1);

            // Add two elevated platforms for vertical dodging (Rows 6 and 8)
            if (rowIndex === 8) {
              const row = Array(40).fill(0);
              for (let i = 5; i < 12; i++) row[i] = 1; // Left platform
              for (let i = 28; i < 35; i++) row[i] = 1; // Right platform
              return row;
            }
            if (rowIndex === 5) {
              const row = Array(40).fill(0);
              for (let i = 15; i < 25; i++) row[i] = 1; // Center high platform
              return row;
            }
            // Open air for the rest
            return Array(40).fill(0);
          });

        // Immediately return the arena and exit the function early
        res.json({
          grid: bossGrid,
          cracks: [],
          bossTelemetry: {
            health: 200,
            maxHealth: 200,
            damage: 20,
            speed: 2,
            abilities: ["projectile", "melee"],
          },
        });
        return;
      }

      // Read explicit properties matching the current level difficulty
      const config = difficultyConfig[difficulty] || difficultyConfig["Medium"];

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
               - 0 = Open Air, 1 = Solid Ground, 4 = Memory Entity NPC.
               - PLATFORM ARCHITECTURE: Form clean, isolated, floating horizontal platform sections. Group floating platform tiles (1s) horizontally in distinct segments of 3 to 6 tiles wide.
               - NO VERTICAL CLUTTER: Do not scatter single, unconnected dots or stack platform tiles vertically to form tall blocks or walls. 
               - CLEAR JUMPING PATHS: Leave at least 2 empty rows of open air (0s) directly above every floating platform so the player can cleanly jump between them.
               - Rows 0, 1, and 2 must be entirely Open Air (0s). Row 11 is a solid baseline floor (all 1s).
               - Place exactly one '4' element resting safely on top of a floating platform block (rows 3 to 10).

            CRITICAL QUANTITY LIMITS FOR ${difficulty.toUpperCase()} DIFFICULTY:
            - The TOTAL number of ground blocks (1s) across the entire 12x40 matrix MUST be strictly between ${config.minTiles} and ${config.maxTiles} tiles (including the baseline floor).
            - Generate a minimum of 1 and a maximum of ${config.maxCracks} items in the "cracks" array.
            - The 'spawnRate' for cracks MUST be an integer between ${config.minSpawnRate} and ${config.maxSpawnRate} (lower frames increase difficulty spawn speed).`,
          },
          {
            role: "user",
            content: `Generate a completely new, unique room layout matrix and crack sequence for ${difficulty} difficulty. Use this unique mathematical seed to ensure the architectural layout is completely different from previous rooms: ${randomSeed}`,
          },
        ],
        model: "llama-3.1-8b-instant",
        temperature: 0.6,
        response_format: { type: "json_object" },
      });

      let rawContent = completion.choices[0]?.message?.content || "{}";
      rawContent = rawContent
        .replace(/```json/g, "")
        .replace(/```/g, "")
        .trim();

      let levelData = JSON.parse(rawContent);

      if (
        !levelData ||
        !Array.isArray(levelData.grid) ||
        !Array.isArray(levelData.cracks)
      ) {
        throw new Error("AI returned malformed room matrix schema");
      }

      // =================================================================
      // ABSOLUTE HARD-CODED CEILING: MAX 5 CRACKS PER LEVEL
      // =================================================================
      const ABSOLUTE_MAX_CRACKS = 5;

      if (!Array.isArray(levelData.cracks)) {
        levelData.cracks = [];
      }

      if (levelData.cracks.length > ABSOLUTE_MAX_CRACKS) {
        console.log(
          `[CRACK SECURITY] Truncating rogue anomalies from ${levelData.cracks.length} down to hard cap of ${ABSOLUTE_MAX_CRACKS}`,
        );
        levelData.cracks = levelData.cracks.slice(0, ABSOLUTE_MAX_CRACKS);
      }

      if (levelData.cracks.length === 0) {
        levelData.cracks.push({ x: 10 * 50, y: 5 * 50, spawnRate: 180 });
      }

      // =================================================================
      // 2. GRID CLEANUP & ROGUE TILE ELIMINATION
      // =================================================================
      while (levelData.grid.length < 12) {
        levelData.grid.push(Array(40).fill(0));
      }
      levelData.grid = levelData.grid.slice(0, 12);

      let totalPlatforms = 0;
      let floatingPlatformCoords: { r: number; c: number }[] = [];

      for (let rowIndex = 0; rowIndex < 12; rowIndex++) {
        if (!Array.isArray(levelData.grid[rowIndex])) {
          levelData.grid[rowIndex] = Array(40).fill(0);
        }
        while (levelData.grid[rowIndex].length < 40) {
          levelData.grid[rowIndex].push(0);
        }
        levelData.grid[rowIndex] = levelData.grid[rowIndex].slice(0, 40);

        if (rowIndex === 0 || rowIndex === 1 || rowIndex === 2) {
          levelData.grid[rowIndex] = Array(40).fill(0);
        }

        if (rowIndex === 11) {
          levelData.grid[rowIndex] = Array(40).fill(1);
        }

        for (let colIndex = 0; colIndex < 40; colIndex++) {
          let tileValue = levelData.grid[rowIndex][colIndex];

          if (tileValue !== 0 && tileValue !== 1 && tileValue !== 4) {
            levelData.grid[rowIndex][colIndex] = 0;
            tileValue = 0;
          }

          if (tileValue === 1) {
            totalPlatforms++;
            if (rowIndex >= 3 && rowIndex <= 10) {
              floatingPlatformCoords.push({ r: rowIndex, c: colIndex });
            }
          }
        }
      }

      // =================================================================
      // 3. SMART DELETION
      // =================================================================
      while (
        totalPlatforms > config.maxTiles &&
        floatingPlatformCoords.length > 0
      ) {
        const randIndex = Math.floor(
          Math.random() * floatingPlatformCoords.length,
        );
        const { r, c } = floatingPlatformCoords.splice(randIndex, 1)[0];

        for (let i = 0; i < 3; i++) {
          const targetCol = c + i;
          if (targetCol < 40 && levelData.grid[r][targetCol] === 1) {
            const objectAbove = r > 0 ? levelData.grid[r - 1][targetCol] : 0;
            if (objectAbove !== 4) {
              levelData.grid[r][targetCol] = 0;
              totalPlatforms--;
            }
          }
        }
      }

      // =================================================================
      // 4. SMART PLACEMENT
      // =================================================================
      let safetyCounter = 0;
      while (totalPlatforms < config.minTiles && safetyCounter < 100) {
        safetyCounter++;
        const r = Math.floor(Math.random() * 7) + 3;
        const c = Math.floor(Math.random() * 32) + 2;
        const platLength = Math.min(
          Math.floor(Math.random() * 3) + 3,
          config.minTiles - totalPlatforms,
        );

        let canPlace = true;
        for (let i = 0; i < platLength; i++) {
          if (
            levelData.grid[r][c + i] === 4 ||
            (r > 0 && levelData.grid[r - 1][c + i] === 4)
          ) {
            canPlace = false;
            break;
          }
        }

        if (canPlace) {
          for (let i = 0; i < platLength; i++) {
            if (levelData.grid[r][c + i] !== 1) {
              levelData.grid[r][c + i] = 1;
              totalPlatforms++;
            }
          }
        }
      }

      // =================================================================
      // 5. TRANSLATE VALIDATED CRACKS TO PIXEL SPACE
      // =================================================================
      const TILE_SIZE = 50;

      levelData.cracks = levelData.cracks.map((crack: any) => {
        let pixelX = crack.x < 40 ? crack.x * TILE_SIZE : crack.x;
        let pixelY = crack.y < 12 ? crack.y * TILE_SIZE : crack.y;

        let defaultMidpoint = Math.floor(
          (config.minSpawnRate + config.maxSpawnRate) / 2,
        );
        let rawSpawnRate = crack.spawnRate || defaultMidpoint;
        //  Fixed clean line:
        let safeSpawnRate = Math.max(
          config.minSpawnRate,
          Math.min(config.maxSpawnRate, rawSpawnRate),
        );

        return {
          x: pixelX,
          y: pixelY,
          spawnRate: safeSpawnRate,
        };
      });

      res.json(levelData);
    } catch (error) {
      console.error("Groq Level Gen Error:", error);

      const fallbackGrid = Array(12)
        .fill(null)
        .map((_, rowIndex) =>
          rowIndex === 11 ? Array(40).fill(1) : Array(40).fill(0),
        );

      const randomCol = Math.floor(Math.random() * 15) + 10;
      fallbackGrid[10][randomCol] = 4;
      fallbackGrid[9][randomCol - 1] = 1;
      fallbackGrid[9][randomCol] = 1;
      fallbackGrid[9][randomCol + 1] = 1;

      res.json({
        grid: fallbackGrid,
        cracks: [{ x: 400 + Math.random() * 400, y: 120, spawnRate: 180 }],
      });
    }
  },
);

export default router;
