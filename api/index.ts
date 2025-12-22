import { createServer } from '../server/index.js';
import serverless from 'serverless-http';

const app = createServer();

export default async function handler(req: any, res: any) {
    console.log('[Vercel Entry] Request:', req.method, req.url);
    return app(req, res);
}
