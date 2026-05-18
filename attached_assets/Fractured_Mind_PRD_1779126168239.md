# **Comprehensive Master Project Requirements Document (PRD)**

## **1\. Project Overview & Identity**

* **Project Name:** Fractured Mind  
* **Tech Stack:** Node.js, Express (Backend API), EJS (Template Engine), Vanilla JavaScript (HTML5 Canvas & Client Logic), CSS, Replit (Development Ecosystem), Groq SDK (AI Integration), GitHub (Version Control).  
* **Concept:** A 2D narrative-driven web platformer where players navigate fragmented, abstract memories. Players encounter reality anomalies—large structural cracks in the sky that continuously spawn hostile ghosts. Armed with a "prismatic bladester," the player must eliminate threats, interact with memory fragments, and repair their shattered psyche.  
* **Product Purpose:** To provide an atmospheric, highly replayable platforming experience that demonstrates advanced state preservation, relational file-based databases, conditional rendering systems, and deep integration of large language models for runtime content generation.

---

## **2\. Technical Architecture & Mandatory Views**

The application comprises exactly eight (8) distinct EJS views served by the Express backend router. Pop-ups, contextual cards, or simple interactive frames do not count toward this total.

| \# | Filename | Purpose & Access Control | Core Interactive Elements |
| :---- | :---- | :---- | :---- |
| 1 | index.ejs | **Home / Login:** Public entry point for user authentication. | Login submission form, links to registration, application concept summary display. |
| 2 | register.ejs | **Profile Creation:** Public user intake form. | Multi-field extended profile signup form capturing basic account details and target custom vectors. |
| 3 | game.ejs | **Core Game Interface:** Authenticated session required. | HTML5 Canvas container, real-time Corruption Bar UI, health indicators, contextual overlay for NPC text dialogue input. |
| 4 | dev-log.ejs | **Checkpoints Page:** Publicly viewable development log. | Tabular view parsing and displaying the development lifecycle milestones, complete with verified commit links and student reflections. |
| 5 | admin.ejs | **Admin Dashboard:** Access-restricted. Requires explicit administrative session. | Global telemetry parsing pane tracking cross-user stats (e.g., total registered profiles, collective entities eliminated, global average runtimes). |
| 6 | admin-update.ejs | **Administrative Control Center:** Access-restricted. | Input lookup utility to modify specific player json files, overwrite stat data fields, or call permanent deletion routines. |
| 7 | search.ejs | **Profile Search Engine:** Authenticated session required. | Search bar query interface parsing users. Conditional logic embeds an administrative account deletion flag visible *only* to the authorized administrator. |
| 8 | leaderboard.ejs | **Global Leaderboard:** Authenticated session required. | High-score table dynamically reading, sorting, and ranking entries based on performance parameters (run duration, cracks sealed, entities destroyed). |

---

## **3\. Database & Relational JSON Framework**

Data storage utilizes six (6) server-side JSON flat files located strictly within a secured /data/ subdirectory. To ensure immediate viability and satisfy academic validation criteria, every data file contains at least five (5) records, at least four (4) distinct properties per record, and structural foreign key linkages.

Plaintext

```
data/
├── users.json          # Core credentials mapping
├── profiles.json       # Extended profile metadata
├── player.json         # Real-time state metrics and upgrade tracking
├── levels.json         # Static fallback map geometry grids
├── leaderboard.json    # Aggregated run completions
└── admin.json          # System settings and global variables
```

### **Relational Schema Blueprint**

#### **A. users.json (Authentication Baseline)**

* Establishes the primary account record.  
* Fields: id (String UUID), username (String, unique key), password (String, hashed/masked), createdAt (Timestamp).

#### **B. profiles.json (Extended Demographic Registry)**

* Links directly to users.json via the unique username string (Foreign Key connection).  
* Fields: id (String UUID), username (String), email (String), avatarUrl (String), bio (String), auraColor (String), mindState (String), combatStyle (String), coreMemory (Text).

#### **C. player.json (Active Run Telemetry)**

* Links directly to users.json via the unique username string (Foreign Key connection). Tracks running variable states updated implicitly by in-game progress.  
* Fields: id (String UUID), username (String), currentHealth (Integer), maxHealth (Integer), corruptionLevel (Integer), movementSpeed (Integer), unlockedUpgrades (Array of Strings), accumulatedKarma (Float), totalKills (Integer), cracksClosed (Integer), activeRunDuration (Float).

#### **D. levels.json (Environmental Configuration Matrices)**

* Holds structural fallback configurations. Contains a static, hardcoded grid representing a default flat level used for physics verification before running procedural AI adjustments.  
* Fields: id (String UUID), levelIdentifier (String), tileGrid (2D Array of Integers representing layout tiles), upgradeSpawnCoordinates (Array of Objects), spawnPoint (Object x, y).

#### **E. leaderboard.json (Competitive Metrics Ledger)**

* Stores historically preserved run summaries linked via the standard username parameter.  
* Fields: id (String UUID), username (String), completedDifficulty (String), totalRuntime (Float), finalScore (Integer), completionDate (Timestamp).

#### **F. admin.json (Administrative Directives & Configuration Parameters)**

* Manages global app constants accessible by administrative updates.  
* Fields: id (String UUID), announcementText (String), systemMaintenanceMode (Boolean), globalSpawnRateMultiplier (Float), restrictedUsernames (Array of Strings).

---

## **4\. Canvas Mechanics & Technical Specifications**

* **Screen Area Constraints:** The game viewport occupies a large fixed wrapper that fills most of the display window. Individual rooms are structurally larger than the visible canvas window, requiring an active bounding coordinate evaluation framework.  
* **Camera Bounds Matrix:** The render loop features a camera tracking model tied directly to the player avatar coordinates. The camera viewport coordinates are mathematically clamped within the outer margins of the current room layout array, preventing rendering artifacts beyond world boundaries.  
* **Grid Tile Configuration:** Environmental assets are drawn on a strict uniform grid mapping 32x32 pixel squares.  
* **Character Dimensional Constraints:** The player avatar occupies a localized coordinate space scaled to either 64x32 or 64x64 pixels.  
* **Physics & Game Feel:** \* **Horizontal Axis:** Near-zero surface friction parameter prevents excessive horizontal sliding, ensuring highly precise platformer responsive stopping feedback. Acceleration constants and terminal horizontal velocities are managed natively in game.js.  
  * **Vertical Axis:** Upward impulse force equations and continuous gravity downward vectors dictate falling arcs and structural floor impacts.

---

## **5\. Core Gameplay Systems, Fail States, & Progression**

* **Combat Engine Specs:**  
  * **Prismatic Bladester Melee Range:** Striking hitbox registers swinging coverage extending outward from player model. Base close-quarters blade swing damage is strictly set to **10**.  
  * **Bladester Ranged Discharge:** Projectile paths check bounds continuously. Direct projectile impacts register a base damage value of **5**.  
* **Hostile Entity Logic (Ghosts):** Ghost entities possess **30** HP. Ghost pathfinding protocols skip platform block checks entirely; they pass directly through solid background terrain elements, moving on a direct path toward the active player coordinates.  
* **The Overloaded Corruption System:** Mental decay is tracked continuously by a top-center UI panel component.  
  * *Decreases:* Triggered upon ghost entity removal or successful sky crack resolution.  
  * *Increases:* Triggered when sustaining generic health point damage, or when moving through a transitional threshold while an active anomaly remains unresolved.  
  * *Abandonment Multiplier:* Transitioning away from a room containing an open anomaly flags that room array state. Re-entering an un-repaired room triggers a multiplying factor, spawning heavily increased quantities of anomalies.  
  * *Critical Overload Penalty State:* Should the metric reach 100% full capacity, the player does not drop dead. Instead, the game engine triggers an immediate feature lockout phase: for the remainder of the current run, the user is completely restricted from communicating with NPCs, sealing open sky cracks, or gathering level stat upgrades.  
* **Run Termination Framework (Fail States):** If player current health registers a zero (0) status, an explicit defeat flag triggers. The player loses the active run immediately and is automatically sent back to the introductory level, resetting active run data parameters.  
* **State Optimization (Auto-Save Operations):** To ensure total record synchronization, file serialization calls writing to player.json execute automatically when the user reaches a level boundaries exit point, minimizing session state tracking discrepancies.

---

## **6\. AI Integration Architecture ("The Dynamic Mind")**

The Express backend router uses the Groq SDK to construct a structured generation loop. The AI does not operate as a standalone chat assistant; it functions directly as an engine game master.

Plaintext

```
[User Chat / Navigation Action]
             │
             ▼
┌─────────────────────────┐
│        server.js        │ ◄─── Reads Player Profile, Metrics,
└────────────┬────────────┘      & Selected Difficulty Mode
             │
             ▼  Formats Strict Context Payload
┌─────────────────────────┐
│      Groq API SDK       │
└────────────┬────────────┘
             │
             ▼  Returns Deterministic JSON / Dialog Text
┌─────────────────────────┐
│    EJS Engine / Canvas  │ ───► Updates Game World & Stats
└─────────────────────────┘
```

### **A. Narrative Interactions & Dialogue Constraints**

* **Role-Play Persona System:** The model receives strict system prompts forcing it to assume the exact point-of-view of a native, lore-accurate memory entity. The text generation must draw directly from existing contextual parameters provided by user input fields (e.g., parsing the user's saved coreMemory).  
* **Output Character Limits:** Text generation outputs are strictly limited to a maximum length of three (3) sentences.

### **B. Procedural Level Matrix Compilations**

* **Dynamic Grid Compilation:** When processing an exit boundary transition, the system forwards an execution prompt to Groq. The AI returns a structural map array modification instruction set that overlays content directly onto the primary spatial structural layouts established by the baseline grid configs from levels.json.  
* **Difficulty Scaling Protocols:** The level compiler reads the user's selected Difficulty Mode (Easy, Medium, Hard) along with active room abandonment penalties.  
  * **Easy:** Structural probability weights restrict anomaly occurrences to a low range baseline. Maximum anomaly entity count caps are strictly limited.  
  * **Medium:** Standard hazard calculations apply.  
  * **Hard:** Scaling functions maximize anomaly generation chances and permit maximum structural crack occurrences per room layout grid.

---

## **7\. Extended Profiles & Administrative Operations**

### **A. Extended Profile Structure (9 Required Fields)**

Every account mapping matches the criteria of Requirement 6 and Requirement 7 by storing and rendering exactly nine distinct data properties.

JSON

```
{
  "id": "usr_9921kXj92",
  "username": "playerOne",
  "email": "user@domain.com",
  "password_masked": "********",
  "bio": "Searching for lost threads of clarity.",
  "auraColor": "#8A2BE2",
  "mindState": "Melancholic",
  "combatStyle": "Agile Bladesman",
  "coreMemory": "The old lamppost under the autumn rain."
}
```

### **B. Administrative Authority Matrix**

* **Dashboard Metric Compilation (admin.ejs):** Parses raw transactional telemetry across the database folder to generate global product statistics.  
* **Administrative Modification Protocol (admin-update.ejs):** Provides functional utility inputs enabling an administrator to override structural data variables, correct anomalies, or manually rewrite core player values.  
* **Profile Search Moderation Feature (search.ejs):** General players can query active usernames to inspect public profiles. However, the EJS rendering template executes a conditional check against the active login token. If the active session matches the hardcoded administrator authorization token, a "Delete Account" button is rendered next to the target profile record. Clicking this triggers a POST transaction calling an extensive cleanup loop:

Plaintext

```
[Admin Deletion Trigger]
           │
           ├──► Erase account from users.json
           ├──► Erase data block from profiles.json
           └──► Wipe real-time metrics in player.json
```

---

## **8\. Academic Compliance Milestones (GitHub Checkpoints)**

To meet version control specifications, development follows a structured milestone path. Commits are logged in the \#XX-Descriptive-Title format. The execution history updates are displayed on dev-log.ejs, rendering tables for: *Checkpoint Name, Date of Completion, Absolute Commit Link Verification, and Dev Reflections.*

Plaintext

```
┌────────────────────────────────────────────────────────────────────────┐
│                          DEVELOPMENT TIMELINE                          │
├─────────┬──────────────────────┬─────────────┬─────────────────────────┤
│ ID      │ Milestone Name       │ Date        │ Verification Link       │
├─────────┼──────────────────────┼─────────────┼─────────────────────────┤
│ #01     │ Project Setup        │ 2026-05-10  │ [Commit #0128fa1...]    │
│ #02     │ Navigation Routing   │ 2026-05-11  │ [Commit #013bc41...]    │
│ ...     │ ...                  │ ...         │ ...                     │
└─────────┴──────────────────────┴─────────────┴─────────────────────────┘
```

*   
  **\#01-Project-Setup:** Initializes environment dependencies. Configures package.json, structural workspace paths (/data, /views, /public), and confirms basic listener status.  
* **\#02-Navigation-Routing:** Implements the core Express server pipeline. Establishes the boilerplate route handlers ensuring all eight (8) required EJS templates render without structural failures.  
* **\#03-User-Authentication:** Authors user record creation routines and verification pathways against users.json. Validates session state consistency across routes.  
* **\#04-Extended-Profiles:** Builds out extended form interfaces to capture and map all nine (9) required user fields directly inside profiles.json.  
* **\#05-Game-Engine-Physics:** Introduces HTML5 Canvas container tracking. Programs basic loop mechanics, coordinate updating, low-friction horizontal physics, and basic vertical gravity limits.  
* **\#06-Level-Grid-Rendering:** Programs parsing modules that read configuration maps out of levels.json. Verifies camera boundaries clamping calculations against the static Base Fallback Level.  
* **\#07-Combat-Anomalies:** Programs vector physics for bladester melee swings and projectile instances. Integrates ghost actor tracking routines with a default 30 HP baseline.  
* **\#08-Corruption-Bar-State:** Codes state variables that modify the tracking bar. Connects 100% capacity threshold limits to functional feature blockades, handles player health depletion, and builds auto-save functions.  
* **\#09-AI-Dialogue-Channel:** Establishes secure remote API handshakes via Groq SDK. Connects player chat input mechanics to lore prompts restricted to three-sentence outputs.  
* **\#10-AI-Procedural-Generation:** Codes room array transformations via Groq. Maps difficulty scaling weights (Easy, Medium, Hard) to enemy asset spawn configurations.  
* **\#11-Mirror-Boss-Logic:** Constructs the end-game encounter matrix. Programs upgrade duplication logic to copy player stats and scales boss damage variables using the inverse karma formula.  
* **\#12-Admin-Telemetry-Dashboard:** Connects the file systems parsing scripts to admin.ejs, establishing structural charts reflecting cumulative global database behaviors.  
* **\#13-Search-Moderation-System:** Constructs public lookup tools in search.ejs. Couples credential scanning algorithms with conditional EJS blocks to display admin account termination commands.  
* **\#14-Final-Project-Polish:** Executes general styling optimizations, normalizes CSS interfaces, corrects layout responsive bugs, and structures runtime assets for final production review.