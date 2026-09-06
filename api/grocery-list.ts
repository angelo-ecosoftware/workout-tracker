import type { VercelRequest, VercelResponse } from '@vercel/node';
import { scrapeProductFromUrl, ProductScraperResult } from './scraperRegistry.js';

export const config = {
  runtime: 'nodejs',
};

export interface ExtractedGroceryItem {
  id?: string | number;
  title: string;
  brand: string;
  webPath?: string;
  salesUnitSize?: string;
  quantity?: number;
  nutrition?: ProductScraperResult | null;
}

/**
 * Extracts clean list identifier or UUID from any raw Albert Heijn URL or string.
 */
export function extractAlbertHeijnListId(rawInput: string): string {
  if (!rawInput) return '';
  const clean = rawInput.trim();

  // 1. Check for standard UUID pattern in string
  const uuidMatch = clean.match(/([a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12})/i);
  if (uuidMatch) return uuidMatch[1];

  // 2. Check for gedeelde-lijst/xxx, mijnlijst/gedeelde-lijst/xxx, shared-list/xxx
  const pathMatch = clean.match(/(?:gedeelde-lijst|shared-list|shopping-list|mijnlijst\/gedeelde-lijst)\/([a-zA-Z0-9_-]+)/i);
  if (pathMatch) return pathMatch[1].split('?')[0].split('#')[0];

  // 3. Fallback: strip query params and hash
  return clean.split('?')[0].split('#')[0].replace(/\/+$/, '');
}

/**
 * Fetches an anonymous guest bearer token from Albert Heijn Mobile Auth service.
 */
async function fetchAhMobileAnonymousToken(): Promise<{ token: string | null; error?: string; status?: number }> {
  try {
    const authRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Appie/8.8.2 iOS/17.0',
        'Host': 'api.ah.nl',
      },
      body: JSON.stringify({ clientId: 'appie' }),
    });

    if (!authRes.ok) {
      const errTxt = await authRes.text();
      return { token: null, error: `AH Mobile Auth failed (${authRes.status}): ${errTxt}`, status: authRes.status };
    }
    const authData = (await authRes.json()) as { access_token?: string };
    if (!authData.access_token) {
      return { token: null, error: 'No access token received from AH Mobile Auth', status: 502 };
    }
    return { token: authData.access_token };
  } catch (err: unknown) {
    console.warn('AH Mobile Auth request failed:', err);
    return { token: null, error: err instanceof Error ? err.message : 'Mobile Auth request network error', status: 502 };
  }
}

/**
 * Strategy 1: Query AH GraphQL for sharedList
 */
async function queryAhSharedListGraphQL(token: string, listId: string): Promise<{ items: ExtractedGroceryItem[] | null; error?: string; status?: number }> {
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

  try {
    const gqlRes = await fetch('https://api.ah.nl/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Appie/8.8.2 iOS/17.0',
        'x-application': 'AH-ShoppingList-Next',
      },
      body: JSON.stringify({
        operationName: 'sharedList',
        variables: { groceryListId: listId },
        query,
      }),
    });

    if (!gqlRes.ok) {
      return { items: null, status: gqlRes.status, error: `GraphQL HTTP error (${gqlRes.status})` };
    }
    const gqlData = (await gqlRes.json()) as any;
    if (gqlData.errors && gqlData.errors.length > 0) {
      return { items: null, status: 400, error: gqlData.errors[0]?.message || 'GraphQL Query Error' };
    }
    const items = gqlData?.data?.groceryList?.groceryList?.groceryItems;
    if (Array.isArray(items) && items.length > 0) {
      const mapped = items.map((item: any) => ({
        id: item.product?.id,
        title: item.product?.title || 'Unknown Product',
        brand: item.product?.brand || 'Albert Heijn',
        webPath: item.product?.webPath || (item.product?.id ? `/producten/product/wi${item.product.id}/product` : undefined),
        salesUnitSize: item.product?.salesUnitSize || '',
        quantity: Number(item.quantity) || 1,
      }));
      return { items: mapped };
    }
  } catch (err: unknown) {
    console.warn('GraphQL sharedList query failed:', err);
  }
  return { items: null };
}

/**
 * Strategy 2: Query AH GraphQL for favoriteListPreviews
 */
async function queryAhFavoriteListGraphQL(token: string, listId: string): Promise<ExtractedGroceryItem[] | null> {
  const query = `
    query favoriteListPreviews($ids: [String!]!, $amountOfProducts: Int) {
      favoriteListV2(ids: $ids, amountOfProducts: $amountOfProducts) {
        id
        description
        sharedBy
        totalSize
        products {
          id
          title
          brand
          webPath
          salesUnitSize
        }
      }
    }
  `;

  try {
    const gqlRes = await fetch('https://api.ah.nl/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        'User-Agent': 'Appie/8.8.2 iOS/17.0',
        'x-application': 'AH-ShoppingList-Next',
      },
      body: JSON.stringify({
        operationName: 'favoriteListPreviews',
        variables: { ids: [listId], amountOfProducts: 100 },
        query,
      }),
    });

    if (!gqlRes || !gqlRes.ok) return null;
    const gqlData = (await gqlRes.json()) as any;
    const list = gqlData?.data?.favoriteListV2?.[0];
    if (list && Array.isArray(list.products) && list.products.length > 0) {
      return list.products.map((p: any) => ({
        id: p.id,
        title: p.title || 'Unknown Product',
        brand: p.brand || 'Albert Heijn',
        webPath: p.webPath || (p.id ? `/producten/product/wi${p.id}/product` : undefined),
        salesUnitSize: p.salesUnitSize || '',
        quantity: 1,
      }));
    }
  } catch (err: unknown) {
    console.warn('GraphQL favoriteListPreviews query failed:', err);
  }
  return null;
}

/**
 * Strategy 3: HTML Web Scraper fallback for mijnlijst/gedeelde-lijst/{id}
 */
async function scrapeAhSharedListHtml(listId: string): Promise<ExtractedGroceryItem[] | null> {
  const urlsToTry = [
    `https://www.ah.nl/mijnlijst/gedeelde-lijst/${listId}`,
    `https://www.ah.nl/gedeelde-lijst/${listId}`,
  ];

  for (const url of urlsToTry) {
    try {
      const res = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'nl-NL,nl;q=0.9',
        },
      });

      if (!res || !res.ok) continue;
      const html = await res.text();

      // Look for product links in the HTML
      const productLinkMatches = [...html.matchAll(/href=["'](\/producten\/product\/wi(\d+)\/([^"']+))["']/g)];
      if (productLinkMatches.length > 0) {
        const uniqueProducts = new Map<string, ExtractedGroceryItem>();
        for (const m of productLinkMatches) {
          const webPath = m[1];
          const productId = m[2];
          const rawSlug = m[3] || '';
          const title = decodeURIComponent(rawSlug).replace(/-/g, ' ').trim();
          if (!uniqueProducts.has(productId)) {
            uniqueProducts.set(productId, {
              id: productId,
              title: title || 'Albert Heijn Product',
              brand: 'Albert Heijn',
              webPath,
              salesUnitSize: '',
              quantity: 1,
            });
          }
        }
        if (uniqueProducts.size > 0) {
          return Array.from(uniqueProducts.values());
        }
      }
    } catch (err: unknown) {
      console.warn(`HTML scraper failed for ${url}:`, err);
    }
  }
  return null;
}

/**
 * Strategy 4: Scrapes shared list, recipe ingredients, or product links from Jumbo
 */
async function scrapeJumboListHtml(urlOrId: string): Promise<ExtractedGroceryItem[] | null> {
  const targetUrl = urlOrId.startsWith('http') ? urlOrId : `https://www.jumbo.com/recepten/${urlOrId}`;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const productMatches = [...html.matchAll(/href=["'](\/producten\/[a-z0-9-]+-([0-9]+[a-z0-9]*))["']/gi)];
    if (productMatches.length > 0) {
      const itemsMap = new Map<string, ExtractedGroceryItem>();
      for (const m of productMatches) {
        const fullPath = m[1];
        const rawSku = m[2];
        const cleanSku = rawSku.replace(/[a-zA-Z]+$/, '');
        const slugTitle = fullPath
          .replace('/producten/', '')
          .replace(/-[0-9]+[a-z0-9]*$/i, '')
          .replace(/^jumbo-?/i, '')
          .replace(/-/g, ' ')
          .trim();
        if (!itemsMap.has(cleanSku)) {
          itemsMap.set(cleanSku, {
            id: `jumbo_${cleanSku}`,
            title: slugTitle || 'Jumbo Product',
            brand: 'Jumbo',
            webPath: fullPath,
            quantity: 1,
          });
        }
      }
      if (itemsMap.size > 0) {
        return Array.from(itemsMap.values());
      }
    }
  } catch (err: unknown) {
    console.warn('Jumbo list scraper error:', err);
  }
  return null;
}

/**
 * Strategy 5: Scrapes shared list or recipe ingredients from Dirk van den Broek
 */
async function scrapeDirkListHtml(urlOrId: string): Promise<ExtractedGroceryItem[] | null> {
  const targetUrl = urlOrId.startsWith('http') ? urlOrId : `https://www.dirk.nl/recepten/${urlOrId}`;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const productMatches = [...html.matchAll(/href=["'](\/boodschappen\/[a-z0-9-]+\/([0-9]+))["']/gi)];
    if (productMatches.length > 0) {
      const itemsMap = new Map<string, ExtractedGroceryItem>();
      for (const m of productMatches) {
        const fullPath = m[1];
        const rawId = m[2];
        const slugTitle = fullPath
          .split('/')
          .filter(Boolean)
          .slice(-2, -1)[0]
          ?.replace(/-/g, ' ')
          .trim();
        if (!itemsMap.has(rawId)) {
          itemsMap.set(rawId, {
            id: `dirk_${rawId}`,
            title: slugTitle || 'Dirk Product',
            brand: 'Dirk',
            webPath: fullPath,
            quantity: 1,
          });
        }
      }
      if (itemsMap.size > 0) {
        return Array.from(itemsMap.values());
      }
    }
  } catch (err: unknown) {
    console.warn('Dirk list scraper error:', err);
  }
  return null;
}

/**
 * Strategy 6: Scrapes shared list or recipe ingredients from PLUS Supermarkt
 */
async function scrapePlusListHtml(urlOrId: string): Promise<ExtractedGroceryItem[] | null> {
  const targetUrl = urlOrId.startsWith('http') ? urlOrId : `https://www.plus.nl/recepten/${urlOrId}`;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const productMatches = [...html.matchAll(/href=["'](\/product\/[a-z0-9-]+-([0-9]+))["']/gi)];
    if (productMatches.length > 0) {
      const itemsMap = new Map<string, ExtractedGroceryItem>();
      for (const m of productMatches) {
        const fullPath = m[1];
        const rawId = m[2];
        const slugTitle = fullPath
          .replace('/product/', '')
          .replace(/-[0-9]+$/i, '')
          .replace(/^plus-?/i, '')
          .replace(/-/g, ' ')
          .trim();
        if (!itemsMap.has(rawId)) {
          itemsMap.set(rawId, {
            id: `plus_${rawId}`,
            title: slugTitle || 'PLUS Product',
            brand: 'PLUS',
            webPath: fullPath,
            quantity: 1,
          });
        }
      }
      if (itemsMap.size > 0) {
        return Array.from(itemsMap.values());
      }
    }
  } catch (err: unknown) {
    console.warn('PLUS list scraper error:', err);
  }
  return null;
}

/**
 * Strategy 7: Scrapes recipes or product lists from Lidl Nederland
 */
async function scrapeLidlListHtml(urlOrId: string): Promise<ExtractedGroceryItem[] | null> {
  const targetUrl = urlOrId.startsWith('http') ? urlOrId : `https://www.lidl.nl/recepten/${urlOrId}`;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const productMatches = [...html.matchAll(/href=["'](\/p\/[a-z0-9-]+(?:\/p[0-9]+)?)["']/gi)];
    if (productMatches.length > 0) {
      const itemsMap = new Map<string, ExtractedGroceryItem>();
      for (const m of productMatches) {
        const fullPath = m[1];
        const slug = fullPath.split('/')[2] || 'lidl-product';
        const cleanTitle = slug.replace(/-/g, ' ').trim();
        if (!itemsMap.has(fullPath)) {
          itemsMap.set(fullPath, {
            id: `lidl_${slug}`,
            title: cleanTitle || 'Lidl Product',
            brand: 'Lidl',
            webPath: fullPath,
            quantity: 1,
          });
        }
      }
      if (itemsMap.size > 0) {
        return Array.from(itemsMap.values());
      }
    }
  } catch (err: unknown) {
    console.warn('Lidl list scraper error:', err);
  }
  return null;
}

/**
 * Strategy 8: Scrapes recipes or product lists from Aldi Nederland
 */
async function scrapeAldiListHtml(urlOrId: string): Promise<ExtractedGroceryItem[] | null> {
  const targetUrl = urlOrId.startsWith('http') ? urlOrId : `https://www.aldi.nl/recepten/${urlOrId}`;
  try {
    const res = await fetch(targetUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'nl-NL,nl;q=0.9',
      },
    });

    if (!res.ok) return null;
    const html = await res.text();

    const productMatches = [...html.matchAll(/href=["'](\/producten\/[a-z0-9-]+\/[a-z0-9-]+|\/p\/[a-z0-9-]+)["']/gi)];
    if (productMatches.length > 0) {
      const itemsMap = new Map<string, ExtractedGroceryItem>();
      for (const m of productMatches) {
        const fullPath = m[1];
        const segments = fullPath.split('/').filter(Boolean);
        const slug = segments[segments.length - 1] || 'aldi-product';
        const cleanTitle = slug.replace(/-/g, ' ').trim();
        if (!itemsMap.has(fullPath)) {
          itemsMap.set(fullPath, {
            id: `aldi_${slug}`,
            title: cleanTitle || 'Aldi Product',
            brand: 'Aldi',
            webPath: fullPath,
            quantity: 1,
          });
        }
      }
      if (itemsMap.size > 0) {
        return Array.from(itemsMap.values());
      }
    }
  } catch (err: unknown) {
    console.warn('Aldi list scraper error:', err);
  }
  return null;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Enable CORS headers for any consumer
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const rawInput = (req.query.listId as string) || (req.query.url as string) || (req.body && (req.body.listId || req.body.url)) || '';

  if (!rawInput || typeof rawInput !== 'string') {
    return res.status(400).json({ error: 'Missing required parameter: listId or url' });
  }

  // 1. Check if user accidentally pasted a single product link (e.g. ah.nl/producten/product/wi12345/...)
  const isProductLink = /ah\.nl\/producten\/product|jumbo\.com\/producten\/[a-z0-9-]+|dirk\.nl\/boodschappen\/[a-z0-9-]+\/\d+|plus\.nl\/product\/[a-z0-9-]+|lidl\.nl\/p\/[a-z0-9-]+|aldi\.nl\/(?:producten|p)\/[a-z0-9-]+/i.test(rawInput);
  if (isProductLink) {
    try {
      const singleProduct = await scrapeProductFromUrl(rawInput.trim());
      const wrappedItem: ExtractedGroceryItem = {
        id: singleProduct.id,
        title: singleProduct.name,
        brand: singleProduct.brand || 'Supermarket',
        salesUnitSize: singleProduct.servingUnit,
        quantity: 1,
        nutrition: singleProduct,
      };
      return res.status(200).json({
        success: true,
        listId: 'single_product',
        totalItems: 1,
        products: [wrappedItem],
      });
    } catch (singleErr: unknown) {
      console.warn('Single product fallback error:', singleErr);
    }
  }

  // 1.5. Check if the URL is from Jumbo, Dirk, or PLUS specifically
  if (rawInput.toLowerCase().includes('jumbo.com')) {
    const jumboItems = await scrapeJumboListHtml(rawInput.trim());
    if (jumboItems && jumboItems.length > 0) {
      const enrichedJumbo = await Promise.all(
        jumboItems.map(async (item) => {
          if (!item.webPath) return item;
          try {
            const productUrl = `https://www.jumbo.com${item.webPath}`;
            const nutrition = await scrapeProductFromUrl(productUrl);
            return {
              ...item,
              title: nutrition.name || item.title,
              brand: nutrition.brand || item.brand,
              nutrition,
            };
          } catch {
            return item;
          }
        })
      );
      return res.status(200).json({
        success: true,
        listId: 'jumbo_list',
        totalItems: enrichedJumbo.length,
        products: enrichedJumbo,
      });
    }
  }

  if (rawInput.toLowerCase().includes('dirk.nl')) {
    const dirkItems = await scrapeDirkListHtml(rawInput.trim());
    if (dirkItems && dirkItems.length > 0) {
      const enrichedDirk = await Promise.all(
        dirkItems.map(async (item) => {
          if (!item.webPath) return item;
          try {
            const productUrl = `https://www.dirk.nl${item.webPath}`;
            const nutrition = await scrapeProductFromUrl(productUrl);
            return {
              ...item,
              title: nutrition.name || item.title,
              brand: nutrition.brand || item.brand,
              nutrition,
            };
          } catch {
            return item;
          }
        })
      );
      return res.status(200).json({
        success: true,
        listId: 'dirk_list',
        totalItems: enrichedDirk.length,
        products: enrichedDirk,
      });
    }
  }

  if (rawInput.toLowerCase().includes('plus.nl')) {
    const plusItems = await scrapePlusListHtml(rawInput.trim());
    if (plusItems && plusItems.length > 0) {
      const enrichedPlus = await Promise.all(
        plusItems.map(async (item) => {
          if (!item.webPath) return item;
          try {
            const productUrl = `https://www.plus.nl${item.webPath}`;
            const nutrition = await scrapeProductFromUrl(productUrl);
            return {
              ...item,
              title: nutrition.name || item.title,
              brand: nutrition.brand || item.brand,
              nutrition,
            };
          } catch {
            return item;
          }
        })
      );
      return res.status(200).json({
        success: true,
        listId: 'plus_list',
        totalItems: enrichedPlus.length,
        products: enrichedPlus,
      });
    }
  }

  if (rawInput.toLowerCase().includes('lidl.nl')) {
    const lidlItems = await scrapeLidlListHtml(rawInput.trim());
    if (lidlItems && lidlItems.length > 0) {
      const enrichedLidl = await Promise.all(
        lidlItems.map(async (item) => {
          if (!item.webPath) return item;
          try {
            const productUrl = `https://www.lidl.nl${item.webPath}`;
            const nutrition = await scrapeProductFromUrl(productUrl);
            return {
              ...item,
              title: nutrition.name || item.title,
              brand: nutrition.brand || item.brand,
              nutrition,
            };
          } catch {
            return item;
          }
        })
      );
      return res.status(200).json({
        success: true,
        listId: 'lidl_list',
        totalItems: enrichedLidl.length,
        products: enrichedLidl,
      });
    }
  }

  if (rawInput.toLowerCase().includes('aldi.nl')) {
    const aldiItems = await scrapeAldiListHtml(rawInput.trim());
    if (aldiItems && aldiItems.length > 0) {
      const enrichedAldi = await Promise.all(
        aldiItems.map(async (item) => {
          if (!item.webPath) return item;
          try {
            const productUrl = item.webPath.startsWith('http') ? item.webPath : `https://www.aldi.nl${item.webPath}`;
            const nutrition = await scrapeProductFromUrl(productUrl);
            return {
              ...item,
              title: nutrition.name || item.title,
              brand: nutrition.brand || item.brand,
              nutrition,
            };
          } catch {
            return item;
          }
        })
      );
      return res.status(200).json({
        success: true,
        listId: 'aldi_list',
        totalItems: enrichedAldi.length,
        products: enrichedAldi,
      });
    }
  }

  const listId = extractAlbertHeijnListId(rawInput);
  if (!listId) {
    return res.status(400).json({ error: 'Could not detect a valid supermarket shared list ID or URL.' });
  }

  try {
    let extractedItems: ExtractedGroceryItem[] | null = null;
    let authError: string | undefined;
    let authStatus: number | undefined;
    let gqlError: string | undefined;
    let gqlStatus: number | undefined;

    // 2. Fetch Anonymous Mobile Token
    const authResult = await fetchAhMobileAnonymousToken();
    const token = authResult.token;
    authError = authResult.error;
    authStatus = authResult.status;

    // 3. Strategy 1: Try Mobile GraphQL sharedList
    if (token) {
      const gqlResult = await queryAhSharedListGraphQL(token, listId);
      extractedItems = gqlResult.items;
      gqlError = gqlResult.error;
      gqlStatus = gqlResult.status;
    }

    // 4. Strategy 2: Try Mobile GraphQL favoriteListPreviews
    if ((!extractedItems || extractedItems.length === 0) && token) {
      extractedItems = await queryAhFavoriteListGraphQL(token, listId);
    }

    // 5. Strategy 3: Try Web HTML scraper fallback
    if (!extractedItems || extractedItems.length === 0) {
      extractedItems = await scrapeAhSharedListHtml(listId);
    }

    if (!extractedItems || extractedItems.length === 0) {
      if (authError && authStatus && !token) {
        return res.status(authStatus).json({ error: authError });
      }
      if (gqlError && gqlStatus === 400) {
        return res.status(400).json({ error: gqlError });
      }
      return res.status(404).json({
        error: `The shared list (${listId}) could not be found or has expired in Albert Heijn's system. Please open the AH app, create a fresh shared list, and paste the new link.`,
      });
    }

    // 6. Enrich products with nutritional macro data in parallel using scrapeProductFromUrl
    const enrichedProducts = await Promise.all(
      extractedItems.map(async (item) => {
        if (!item.webPath) return item;
        try {
          const productUrl = item.webPath.startsWith('http') ? item.webPath : `https://www.ah.nl${item.webPath}`;
          const nutrition = await scrapeProductFromUrl(productUrl);
          return {
            ...item,
            title: nutrition.name || item.title,
            brand: nutrition.brand || item.brand,
            nutrition,
          };
        } catch {
          return item;
        }
      })
    );

    return res.status(200).json({
      success: true,
      listId,
      totalItems: enrichedProducts.length,
      products: enrichedProducts,
    });
  } catch (err: unknown) {
    console.error('Server error processing AH shared grocery list:', err);
    return res.status(500).json({
      error: err instanceof Error ? err.message : 'Internal server error resolving Albert Heijn shared list.',
    });
  }
}
