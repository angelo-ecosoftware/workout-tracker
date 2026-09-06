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
  const isProductLink = /ah\.nl\/producten\/product|jumbo\.com\/producten|dirk\.nl\/boodschappen|plus\.nl\/product/i.test(rawInput);
  if (isProductLink) {
    try {
      const singleProduct = await scrapeProductFromUrl(rawInput.trim());
      const wrappedItem: ExtractedGroceryItem = {
        id: singleProduct.id,
        title: singleProduct.name,
        brand: singleProduct.brand || 'Albert Heijn',
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

  const listId = extractAlbertHeijnListId(rawInput);
  if (!listId) {
    return res.status(400).json({ error: 'Could not detect a valid Albert Heijn shared list ID or URL.' });
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
