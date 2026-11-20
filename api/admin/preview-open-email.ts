import previewHandler from '../preview-open-email';

export default async function handler(req: any, res: any) {
  return previewHandler(req, res);
}

