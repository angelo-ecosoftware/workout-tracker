import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import productLinkHandler from "./api/product-link.js";
import barcodeLookupHandler from "./api/barcode-lookup.js";
import groceryListHandler from "./api/grocery-list.js";
import reportMissingProductHandler from "./api/report-missing-product.js";
import blockIpHandler from "./api/block-ip.js";
import exerciseThumbnailHandler from "./api/exercise-thumbnail.js";
import geminiHelloHandler from "./api/gemini-hello.js";
import generateRoutineHandler from "./api/generate-routine.js";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Set up standard express body parser middleware
  app.use(express.json());

  // API 1: Healthcheck
  app.get("/api/health", (_req, res) => {
    res.json({ status: "healthy", timestamp: new Date().toISOString() });
  });

  // API 2: Shared Grocery List Proxy (CORS-safe server-side bridge)
  const handleGroceryList = async (req: express.Request, res: express.Response) => {
    return groceryListHandler(req as any, res as any);
  };

  app.all("/api/grocery-list", handleGroceryList);
  app.all("/api/shared-grocery-list", handleGroceryList);
  app.all("/api/ah-shared-list", handleGroceryList);

  // API 3-5: Reuse the Vercel handlers in the local Express runtime so
  // validation, status codes, and error behavior cannot drift by deployment.
  const adaptVercelHandler = (handler: (req: any, res: any) => unknown) =>
    (req: express.Request, res: express.Response) => handler(req, res);

  const handleProductLink = adaptVercelHandler(productLinkHandler);
  app.all("/api/product-link", handleProductLink);
  app.all("/api/ah-product-link", handleProductLink);

  const handleBarcodeLookup = adaptVercelHandler(barcodeLookupHandler);
  app.all("/api/barcode-lookup", handleBarcodeLookup);

  const handleReportMissingProduct = adaptVercelHandler(reportMissingProductHandler);
  app.all("/api/report-missing-product", handleReportMissingProduct);

  // API 6: Honeypot & Bot Defense IP / Device Block Handler
  const handleBlockIp = async (req: express.Request, res: express.Response) => {
    return blockIpHandler(req as any, res as any);
  };

  app.all("/api/block-ip", handleBlockIp);

  // API 6b: Cached static first-frame thumbnails for exercise catalog GIFs
  app.get("/api/exercise-thumbnail", (req, res) => {
    return exerciseThumbnailHandler(req as any, res as any);
  });

  // API 6c: Small Gemini connectivity test
  app.post("/api/gemini-hello", (req, res) => {
    return geminiHelloHandler(req as any, res as any);
  });

  // API 6d: Authenticated AI routine generation and user-scoped cache
  app.all("/api/generate-routine", (req, res) => {
    return generateRoutineHandler(req as any, res as any);
  });

  // API 7: Master Exercises Catalog Database Proxy
  app.get("/api/exercises", async (_req, res) => {
    try {
      const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || "";
      const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";
      if (!supabaseUrl || !supabaseAnonKey) {
        return res.status(500).json({ error: "Missing Supabase configuration" });
      }
      const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
      const allExercises: any[] = [];
      let from = 0;
      const pageSize = 1000;

      while (true) {
        const { data, error } = await supabaseClient
          .from("exercises")
          .select("id, name, type, target_sets, target_rep_min, target_rep_max, category, image_url, is_custom")
          .order("name", { ascending: true })
          .range(from, from + pageSize - 1);

        if (error) {
          return res.status(500).json({ error: error.message });
        }
        if (!data || data.length === 0) break;
        allExercises.push(...data);
        if (data.length < pageSize) break;
        from += pageSize;
      }

      return res.status(200).json({ success: true, count: allExercises.length, exercises: allExercises });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Failed to fetch exercises" });
    }
  });

  // Vite static middleware mount path routing
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));

    app.get("/sitemap.xml", (_req, res) => {
      res.setHeader("Content-Type", "application/xml; charset=utf-8");
      const candidates = [
        path.join(distPath, "sitemap.xml"),
        path.join(process.cwd(), "public", "sitemap.xml"),
      ];
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }
      return res.status(404).send("Not found");
    });

    app.get("/robots.txt", (_req, res) => {
      res.setHeader("Content-Type", "text/plain; charset=utf-8");
      const candidates = [
        path.join(distPath, "robots.txt"),
        path.join(process.cwd(), "public", "robots.txt"),
      ];
      for (const filePath of candidates) {
        if (fs.existsSync(filePath)) {
          return res.sendFile(filePath);
        }
      }
      return res.status(404).send("Not found");
    });

    // SPA catch-all for React frontend routers
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Kinisia Engine] Active. Listening on http://localhost:${PORT}`);
  });
}

startServer();
