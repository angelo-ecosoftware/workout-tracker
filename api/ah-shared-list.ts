export const config = {
  runtime: 'nodejs',
};

export default async function handler(req: any, res: any) {
  // Enable CORS headers for any consumer
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const listId = req.query.listId || (req.body && req.body.listId);

    if (!listId || typeof listId !== 'string') {
      return res.status(400).json({ error: 'Missing required parameter: listId' });
    }

    // 1. Get anonymous guest token from Albert Heijn Mobile Auth
    const authRes = await fetch('https://api.ah.nl/mobile-auth/v1/auth/token/anonymous', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Appie/8.8.2 iOS/17.0',
      },
      body: JSON.stringify({ clientId: 'appie' }),
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
      return res.status(502).json({ error: 'No access token received from AH Mobile Auth' });
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
      const errTxt = await gqlRes.text();
      return res.status(gqlRes.status).json({
        error: `AH GraphQL request failed (${gqlRes.status})`,
        details: errTxt,
      });
    }

    const gqlData = await gqlRes.json();
    if (gqlData.errors && gqlData.errors.length > 0) {
      return res.status(400).json({
        error: gqlData.errors[0]?.message || 'GraphQL Query Error',
        details: gqlData.errors,
      });
    }

    const items = gqlData?.data?.groceryList?.groceryList?.groceryItems || [];
    const products = items.map((item: any) => ({
      id: item.product?.id,
      title: item.product?.title || 'Unknown Product',
      brand: item.product?.brand || '',
      webPath: item.product?.webPath || '',
      salesUnitSize: item.product?.salesUnitSize || '',
      quantity: item.quantity || 1,
    }));

    return res.status(200).json({
      success: true,
      listId,
      totalItems: products.length,
      products,
    });
  } catch (err: any) {
    console.error('Server error fetching AH shared list:', err);
    return res.status(500).json({
      error: err.message || 'Internal server error fetching AH list',
    });
  }
}
