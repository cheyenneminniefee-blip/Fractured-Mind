import { Router, Request, Response } from "express";
import Groq from "groq-sdk";
import crypto from "crypto";

const router = Router();

// Initialize Groq inside this workspace context
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// --- AI Dialogue Generation Endpoint ---
router.post("/chat", async (req: Request, res: Response): Promise<void> => {
  try {
    const playerMessage = req.body.message;

    const chatCompletion = await groq.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `You are a native, lore-accurate memory entity in the abstract space of 'Fractured Mind'. 
                              The player's mind is shattered. Speak cryptically but provide hints about sealing anomalies (cracks) and avoiding ghosts. 
                              CRITICAL RULE: You must restrict your output to a maximum of three (3) sentences. No exceptions.`,
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

// --- AI Procedural Level Generation Endpoint ---
router.post(
  "/generate-level",
  async (req: Request, res: Response): Promise<void> => {
    try {
      const difficulty = req.body.difficulty || "Medium";
      const randomSeed = crypto.randomUUID();

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
                              - (Since your floor row takes up exactly 40 tiles, this gives you a budget of 20 to 50 floating platform tiles across rows 3-10). Do not place more or fewer.`,
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

      // --- BACKEND POST-PROCESSING SANITIZATION LAYER ---
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
          if (levelData.grid[rowIndex][colIndex] === 1) {
            totalPlatforms++;
            if (rowIndex >= 3 && rowIndex <= 10) {
              floatingPlatformCoords.push({ r: rowIndex, c: colIndex });
            }
          }
        }
      }

      const MIN_TOTAL_PLATFORMS = 60;
      const MAX_TOTAL_PLATFORMS = 90;

      while (
        totalPlatforms > MAX_TOTAL_PLATFORMS &&
        floatingPlatformCoords.length > 0
      ) {
        const randIndex = Math.floor(
          Math.random() * floatingPlatformCoords.length,
        );
        const { r, c } = floatingPlatformCoords.splice(randIndex, 1)[0];
        const objectAbove = r > 0 ? levelData.grid[r - 1][c] : 0;
        if (levelData.grid[r][c] === 1 && objectAbove !== 4) {
          levelData.grid[r][c] = 0;
          totalPlatforms--;
        }
      }

      let safetyCounter = 0;
      while (totalPlatforms < MIN_TOTAL_PLATFORMS && safetyCounter < 500) {
        safetyCounter++;
        const r = Math.floor(Math.random() * 8) + 3;
        const c = Math.floor(Math.random() * 40);
        if (levelData.grid[r][c] === 0) {
          levelData.grid[r][c] = 1;
          totalPlatforms++;
        }
      }

      // --- CONVERT CRACK GRID COORDINATES TO PIXEL SPACE ---
      const TILE_SIZE = 50; // Match this to whatever tile size your game.js uses!

      if (Array.isArray(levelData.cracks)) {
        levelData.cracks = levelData.cracks.map((crack: any) => {
          // If the AI accidentally provided small grid-relative numbers (like 0-40)
          // rather than absolute canvas pixels, multiply them up!
          let pixelX = crack.x < 40 ? crack.x * TILE_SIZE : crack.x;
          let pixelY = crack.y < 12 ? crack.y * TILE_SIZE : crack.y;

          return {
            x: pixelX,
            y: pixelY,
            // Ensure spawnRate has a reasonable fallback frame count minimum
            spawnRate: crack.spawnRate || 180,
          };
        });
      }

      // Now return the safely converted telemetry to the client
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
