import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

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

  // API 2: Albert Heijn Shared Grocery List Proxy (CORS-safe server-side bridge)
  app.all("/api/ah-shared-list", async (req, res) => {
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
          error: `AH Mobile Auth failed (${authRes.status})`,
          details: errTxt,
        });
      }

      const authData = (await authRes.json()) as { access_token?: string };
      const token = authData.access_token;
      if (!token) {
        return res.status(502).json({ error: "No access token received from AH Mobile Auth" });
      }

      // 2. Query Albert Heijn GraphQL for the shared grocery list
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
          error: `AH GraphQL request failed (${gqlRes.status})`,
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
      console.error("AH Shared List Proxy Error:", err);
      return res.status(500).json({ error: err.message || "Failed to fetch AH shared list" });
    }
  });

  // API 3: Albert Heijn Single Product Link Scraper (Extracts exact official 100g macros)
  app.all("/api/ah-product-link", async (req, res) => {
    let rawUrl = (req.query.url || req.body?.url) as string;
    if (!rawUrl || typeof rawUrl !== "string") {
      return res.status(400).json({ error: "Missing required parameter: url" });
    }

    try {
      let targetUrl = rawUrl.trim();
      if (!targetUrl.startsWith("http")) {
        // e.g. wi441199 or /producten/product/...
        if (targetUrl.startsWith("wi")) {
          targetUrl = `https://www.ah.nl/producten/product/${targetUrl}`;
        } else if (targetUrl.startsWith("/")) {
          targetUrl = `https://www.ah.nl${targetUrl}`;
        } else {
          targetUrl = `https://www.ah.nl/producten/product/${targetUrl}`;
        }
      }

      const pageRes = await fetch(targetUrl, {
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        },
      });

      if (!pageRes.ok) {
        return res.status(pageRes.status).json({
          error: `Could not load AH product page (status ${pageRes.status})`,
        });
      }

      const html = await pageRes.text();

      // 1. Extract Title & Brand from JSON-LD
      let title = "Product";
      let brand = "AH";
      const jsonLdMatch = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/);
      if (jsonLdMatch) {
        try {
          const parsed = JSON.parse(jsonLdMatch[1]);
          if (parsed.name) {
            title = parsed.name
              .replace(/\s*bestellen\s*\|\s*Albert Heijn/i, "")
              .replace(/\s*\|\s*Albert Heijn/i, "")
              .trim();
          }
          if (parsed.brand && typeof parsed.brand === "string") brand = parsed.brand;
          else if (parsed.brand?.name) brand = parsed.brand.name;
        } catch (e) {}
      }

      // 2. Extract 100g/100ml Nutrition Table
      let kcalPer100g = 0;
      let proteinPer100g = 0;
      let carbsPer100g = 0;
      let sugarPer100g = 0;
      let fatPer100g = 0;
      let fiberPer100g = 0;

      const start = html.indexOf("Voedingswaarden");
      if (start !== -1) {
        const end = html.indexOf("</table>", start);
        const tableSection = html.slice(start, end !== -1 ? end + 8 : start + 6000);
        const rows = tableSection.split(/<\/tr>/i);

        for (const r of rows) {
          const cleaned = r.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().toLowerCase();
          let m;

          if (cleaned.startsWith("energie") && cleaned.indexOf("referentie") === -1) {
            m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*kcal/);
            if (m) kcalPer100g = parseFloat(m[1].replace(",", "."));
          }
          if (cleaned.startsWith("vet ") || cleaned.startsWith("vetten ")) {
            m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
            if (m) fatPer100g = parseFloat(m[1].replace(",", "."));
          }
          if (cleaned.startsWith("waarvan suikers")) {
            m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
            if (m) sugarPer100g = parseFloat(m[1].replace(",", "."));
          }
          if (cleaned.startsWith("koolhydraten")) {
            m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
            if (m) carbsPer100g = parseFloat(m[1].replace(",", "."));
          }
          if (cleaned.startsWith("eiwit")) {
            m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
            if (m) proteinPer100g = parseFloat(m[1].replace(",", "."));
          }
          if (cleaned.startsWith("voedingsvezel") || cleaned.startsWith("vezel")) {
            m = cleaned.match(/(\d+(?:[.,]\d+)?)\s*g/);
            if (m) fiberPer100g = parseFloat(m[1].replace(",", "."));
          }
        }
      }

      return res.status(200).json({
        success: true,
        product: {
          id: `ah_${Date.now()}`,
          name: title,
          brand,
          servingUnit: html.toLowerCase().includes("per 100 milliliter") ? "ml" : "gram",
          kcalPer100g,
          proteinPer100g,
          carbsPer100g,
          sugarPer100g,
          fatPer100g,
          fiberPer100g,
          sourceUrl: targetUrl,
        },
      });
    } catch (err: any) {
      console.error("AH Product Link Scraper Error:", err);
      return res.status(500).json({ error: err.message || "Failed to extract AH product data" });
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
