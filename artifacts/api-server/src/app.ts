import dotenv from "dotenv";
import path from "path"; // 1. Added path utility for secure directory mapping

// Look at the error log: your root directory is explicitly at /home/runner/workspace
dotenv.config({ path: "/home/runner/workspace/.env" });

import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes"; 
import { logger } from "./lib/logger";

const app: Express = express();

// =================================================================
// TEMPLATE ENGINE & ASSET CONFIGURATION (REQUIRED FOR CHECKPOINT 12)
// =================================================================
// Tell Express to use EJS for rendering HTML views
app.set("view engine", "ejs");

// Point Express to the directory containing your template views
app.set("views", path.join(process.cwd(), "views"));

// Serve static assets (CSS, client-side Canvas JS, images) from the public folder
app.use(express.static(path.join(process.cwd(), "public")));

// =================================================================
// MIDDLEWARES
// =================================================================
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// =================================================================
// ROUTE MOUNTING
// =================================================================
// Mount at "/api" so routes match the proxy path prefix (paths are not rewritten by proxy).
app.use("/api", router);

export default app;