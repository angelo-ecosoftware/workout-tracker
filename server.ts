import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { scrapeProductFromUrl } from "./api/scraperRegistry.js";
import { resolveAlbertHeijnBarcode } from "./api/barcode-lookup.js";
import groceryListHandler from "./api/grocery-list.js";
import blockIpHandler from "./api/block-ip.js";

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

  // API 3: Dynamic Product Link Scraper (AH, Jumbo, etc.)
  const handleProductLink = async (req: express.Request, res: express.Response) => {
    const rawUrl = (req.query.url || req.body?.url) as string;
    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).json({ error: "Missing required parameter: url" });
    }

    try {
      const product = await scrapeProductFromUrl(rawUrl);
      return res.status(200).json({
        success: true,
        product,
      });
    } catch (err: any) {
      console.error("Product Link Scraper Error:", err);
      const isClientError =
        err.message?.includes('not permitted') ||
        err.message?.includes('forbidden') ||
        err.message?.includes('Invalid URL') ||
        err.message?.includes('Only HTTP');
      const statusCode = isClientError ? 400 : 500;
      return res.status(statusCode).json({ error: err.message || "Failed to parse product link" });
    }
  };

  app.all("/api/product-link", handleProductLink);
  app.all("/api/ah-product-link", handleProductLink);

  // API 4: Supermarket Barcode Lookup (Albert Heijn GTIN + FIR nutrition table)
  const handleBarcodeLookup = async (req: express.Request, res: express.Response) => {
    const barcode = (req.query.barcode || req.body?.barcode) as string;
    if (!barcode || typeof barcode !== "string") {
      return res.status(400).json({ error: "Missing required parameter: barcode" });
    }

    try {
      const product = await resolveAlbertHeijnBarcode(barcode);
      if (!product) {
        return res.status(404).json({ error: `Barcode ${barcode} not found` });
      }
      return res.status(200).json(product);
    } catch (err: any) {
      console.error("Barcode Lookup Error:", err);
      return res.status(500).json({ error: err.message || "Failed to lookup barcode" });
    }
  };

  app.all("/api/barcode-lookup", handleBarcodeLookup);

  // API 5: Missing Product / Barcode Developer Report
  const handleReportMissingProduct = async (req: express.Request, res: express.Response) => {
    const barcode = (req.query.barcode || req.body?.barcode || "") as string;
    const name = (req.query.name || req.body?.name || "") as string;
    const brand = (req.query.brand || req.body?.brand || "") as string;
    const store = (req.query.store || req.body?.store || "") as string;
    const notes = (req.query.notes || req.body?.notes || "") as string;
    const userId = (req.query.userId || req.body?.userId || "anonymous") as string;

    if (!barcode && !name) {
      return res.status(400).json({ error: "Please provide at least a barcode or product name to report." });
    }

    const report = {
      id: `report_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      barcode: barcode.trim() || undefined,
      name: name.trim() || undefined,
      brand: brand.trim() || undefined,
      store: store.trim() || undefined,
      notes: notes.trim() || undefined,
      userId,
      timestamp: new Date().toISOString(),
      status: "received",
    };

    console.log("[Missing Product Report Received by Developer API]:", JSON.stringify(report, null, 2));

    return res.status(200).json({
      success: true,
      message: "Missing product report successfully submitted to developer API for indexing.",
      report,
    });
  };

  app.all("/api/report-missing-product", handleReportMissingProduct);

  // API 6: Honeypot & Bot Defense IP / Device Block Handler
  const handleBlockIp = async (req: express.Request, res: express.Response) => {
    return blockIpHandler(req as any, res as any);
  };

  app.all("/api/block-ip", handleBlockIp);

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
    // SPA catch-all for React frontend routers
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Personal Gym Tracker Engine] Active. Listening on http://localhost:${PORT}`);
  });
}

startServer();
