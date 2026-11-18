import re

src_path = r'C:\Users\USER\.gemini\antigravity\scratch\tokyo_disney_helper\server\api.ts'
dst_path = r'C:\Users\USER\.gemini\antigravity\scratch\tokyo_disney_helper\api\index.ts'

with open(src_path, 'r', encoding='utf-8') as f:
    code = f.read()

# Replace any __dirname or import.meta.url logic
safe_path = """const DATA_DIR = process.env.VERCEL ? path.join('/tmp', 'data') : path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'store.json');"""

code = re.sub(r'// 跨環境安全取得路徑[\s\S]*?const DB_FILE = path\.join\(DATA_DIR, \'store\.json\'\);', safe_path, code)
code = re.sub(r'const __dirname = [\s\S]*?const DB_FILE = path\.join\(DATA_DIR, \'store\.json\'\);', safe_path, code)

# Clean up imports: remove fileURLToPath if unused
code = code.replace("import { fileURLToPath } from 'url';\n", "")

handler_code = """

export default async function handler(req: any, res: any) {
  try {
    const handled = await handleApiRequest(req, res);
    if (!handled) {
      sendJson(res, 404, { ok: false, error: 'API Not Found' });
    }
  } catch (err: any) {
    console.error('API Error:', err);
    sendJson(res, 500, { ok: false, error: err?.message || 'Server error' });
  }
}
"""

with open(dst_path, 'w', encoding='utf-8') as f:
    f.write(code + handler_code)

print("Generated standalone api/index.ts, length:", len(code + handler_code))

