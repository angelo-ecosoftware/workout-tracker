import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { scrapeProductFromUrl } from "./api/scraperRegistry.js";

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
    const listId = req.query.listId || req.body?.listId;
    if (!listId || typeof listId !== "string") {
      return res.status(400).json({ error: "Missing required parameter: listId" });
    }

    try {
      // 1. Get anonymous guest token from Albert Heijn Mobile Auth
      const authRes = await fetch("https://api.ah.nl/mobile-auth/v1/auth/token/anonymous", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "Appie/8.8.2 iOS/17.0",
        },
        body: JSON.stringify({ clientId: "appie" }),
      });

      if (!authRes.ok) {
        const errTxt = await authRes.text();
        return res.status(authRes.status).json({
          error: `Mobile Auth failed (${authRes.status})`,
          details: errTxt,
        });
      }

      const authData = (await authRes.json()) as { access_token?: string };
      const token = authData.access_token;
      if (!token) {
        return res.status(502).json({ error: "No access token received from Mobile Auth" });
      }

      // 2. Query GraphQL for the shared grocery list
      const query = `
        query sharedList($groceryListId: String!) {
          groceryList(id: $groceryListId) {
            statusCode
            groceryList {
              groceryItems {
                quantity
                product {
                  id
                  title
                  brand
                  webPath
                  salesUnitSize
                }
              }
            }
          }
        }
      `;

      const gqlRes = await fetch("https://api.ah.nl/graphql", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          "User-Agent": "Appie/8.8.2 iOS/17.0",
          "x-application": "AH-ShoppingList-Next",
        },
        body: JSON.stringify({
          operationName: "sharedList",
          variables: { groceryListId: listId },
          query,
        }),
      });

      if (!gqlRes.ok) {
        const errTxt = await gqlRes.text();
        return res.status(gqlRes.status).json({
          error: `GraphQL request failed (${gqlRes.status})`,
          details: errTxt,
        });
      }

      const gqlData = (await gqlRes.json()) as any;
      if (gqlData.errors && gqlData.errors.length > 0) {
        return res.status(400).json({
          error: gqlData.errors[0]?.message || "GraphQL Query Error",
          details: gqlData.errors,
        });
      }

      const items = gqlData?.data?.groceryList?.groceryList?.groceryItems || [];
      const products = items.map((item: any) => ({
        id: item.product?.id,
        title: item.product?.title || "Unknown Product",
        brand: item.product?.brand || "",
        webPath: item.product?.webPath || "",
        salesUnitSize: item.product?.salesUnitSize || "",
        quantity: item.quantity || 1,
      }));

      return res.status(200).json({
        success: true,
        listId,
        totalItems: products.length,
        products,
      });
    } catch (err: any) {
      console.error("Shared List Proxy Error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch shared list" });
    }
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
      return res.status(500).json({ error: err.message || "Failed to parse product link" });
    }
  };

  app.all("/api/product-link", handleProductLink);
  app.all("/api/ah-product-link", handleProductLink);

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
