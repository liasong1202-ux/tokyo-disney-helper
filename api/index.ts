import { handleApiRequest } from '../server/api';

export default async function handler(req: any, res: any) {
  const handled = await handleApiRequest(req, res);
  if (!handled) {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(JSON.stringify({ ok: false, error: 'Not Found' }));
  }
}
