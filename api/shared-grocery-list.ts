import type { VercelRequest, VercelResponse } from '@vercel/node';
import handler from './grocery-list.js';

// Backward compatibility alias for /api/ah-shared-list
export default handler;
