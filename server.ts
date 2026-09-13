import express from 'express';
import { createServer as createViteServer } from 'vite';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import { DatabaseSync } from 'node:sqlite';
import readline from 'readline';
import { Readable } from 'stream';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Initialize DB
const dbDir = join(__dirname, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}
const dbPath = join(dbDir, 'database.sqlite');
const db = new DatabaseSync(dbPath);

db.exec(`
  CREATE TABLE IF NOT EXISTS requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    tmdb_id INTEGER NOT NULL,
    media_type TEXT NOT NULL,
    title TEXT NOT NULL,
    poster_path TEXT,
    overview TEXT,
    release_date TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    is_admin INTEGER NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

// Insert default admin if no users exist
const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get() as { count: number };
if (userCount.count === 0) {
  // default admin: admin / admin
  db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)').run('admin', 'admin', 1);
}


const isProduction = process.env.NODE_ENV === 'production';
const PORT = process.env.PORT || 3000;

async function sendTelegramNotification(title: string, mediaType: string) {
  let token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  if (!token || !chatId) return;

  // Si el usuario copió todo el mensaje de BotFather por error, extraer solo el token
  const tokenMatch = token.match(/(\d+:[a-zA-Z0-9_-]+)/);
  if (tokenMatch) {
    token = tokenMatch[1];
  }

  const url = `https://api.telegram.org/bot${token}/sendMessage`;
  const typeLabel = mediaType === 'movie' ? 'Película' : 'Serie';
  const text = `🎬 *Nueva Solicitud*\n\n*Tipo:* ${typeLabel}\n*Título:* ${title}\n\nRevisa el panel de administración.`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text,
        parse_mode: 'Markdown'
      })
    });
    
    if (!response.ok) {
      const data = await response.text();
      console.error('Telegram API Error:', response.status, data);
    } else {
      console.log('Telegram message sent successfully to', chatId);
    }
  } catch (error) {
    console.error('Error sending telegram notification:', error);
  }
}

function extractBaseTitle(rawTitle: string) {
  let title = rawTitle;
  
  // Remove prefixes like "EN| ", "ES| ", "[EN] ", etc.
  title = title.replace(/^(?:[A-Z]{2,3}\|)\s*/i, '');
  title = title.replace(/^(?:\[[A-Z]{2,3}\])\s*/i, '');
  
  // Remove season/episode markers and everything after it
  // matches S01 E01, S01E01, S1E1, T01 E01, Season 1
  const seMatch = title.match(/\b([ST]\d+\s*E\d+|Season\s*\d+)/i);
  if (seMatch && seMatch.index !== undefined) {
    title = title.substring(0, seMatch.index);
  }
  
  return title;
}

function normalizeTitle(title: string) {
  if (!title) return '';
  return title
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // remove accents
    .replace(/\(\d{4}\)|\[\d{4}\]/g, '') // remove years like (2023)
    .replace(/[^\w\s]/gi, ' ') // replace special chars with space
    .replace(/\s+/g, ' ')
    .trim();
}

let cachedLibraryTitles: Set<string> | null = null;
let lastCacheTime = 0;
const CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hours

async function getLibraryTitles() {
  const url = process.env.M3U_PLAYLIST_URL;
  if (!url) return new Set<string>();

  if (cachedLibraryTitles && (Date.now() - lastCacheTime < CACHE_TTL)) {
    return cachedLibraryTitles;
  }

  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch M3U');
    if (!response.body) throw new Error('No body in M3U response');

    const titles = new Set<string>();
    
    // We stream the response instead of loading it entirely into RAM
    const nodeStream = Readable.fromWeb(response.body as any);
    const rl = readline.createInterface({
      input: nodeStream,
      crlfDelay: Infinity
    });

    for await (const line of rl) {
      if (line.startsWith('#EXTINF:')) {
        const parts = line.split(',');
        if (parts.length > 1) {
          const rawTitle = parts[parts.length - 1].trim();
          titles.add(normalizeTitle(extractBaseTitle(rawTitle)));
        }
      }
    }
    
    cachedLibraryTitles = titles;
    lastCacheTime = Date.now();
    return titles;
  } catch (error) {
    console.error('Error fetching M3U playlist:', error);
    return cachedLibraryTitles || new Set<string>();
  }
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Routes
  app.get('/api/search', async (req, res) => {
    try {
      const query = req.query.q;
      const apiKey = process.env.TMDB_API_KEY;
      if (!apiKey) {
        return res.status(500).json({ error: 'Falta configurar TMDB_API_KEY en los Secrets.' });
      }
      
      const isBearer = apiKey.length > 50;
      const url = isBearer 
        ? `https://api.themoviedb.org/3/search/multi?query=${encodeURIComponent(String(query))}&language=es-ES&page=1`
        : `https://api.themoviedb.org/3/search/multi?api_key=${apiKey}&query=${encodeURIComponent(String(query))}&language=es-ES&page=1`;
        
      const headers = isBearer 
        ? { Authorization: `Bearer ${apiKey}`, accept: 'application/json' }
        : { accept: 'application/json' };

      const response = await fetch(url, { headers });
      
      const contentType = response.headers.get("content-type");
      let data: any = {};
      if (contentType && contentType.indexOf("application/json") !== -1) {
        data = await response.json();
      } else {
        const text = await response.text();
        console.error('TMDB API Returned Non-JSON:', text.substring(0, 200));
        return res.status(500).json({ error: 'Respuesta no válida de TMDB (Servicio no disponible)' });
      }
      
      if (!response.ok) {
        console.error('TMDB API Error:', data);
        return res.status(500).json({ error: `Error TMDB: ${data.status_message || 'Desconocido'}` });
      }
      
      const libraryTitles = await getLibraryTitles();
      
      const checkRequests = db.prepare('SELECT tmdb_id, created_at FROM requests').all() as any[];
      const requestedMap = new Map();
      checkRequests.forEach(r => {
        requestedMap.set(Number(r.tmdb_id), r.created_at);
      });

      // Filter out people, only return movies and tv shows
      const results = (data.results || [])
        .filter((item: any) => item.media_type === 'movie' || item.media_type === 'tv')
        .map((item: any) => {
          const title = item.title || item.name;
          const normalized = normalizeTitle(title);
          const globalReqDate = requestedMap.get(Number(item.id));
          return {
            ...item,
            is_available: libraryTitles.has(normalized),
            global_requested: !!globalReqDate,
            global_requested_date: globalReqDate
          };
        });
        
      res.json(results);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Error interno conectando con TMDB' });
    }
  });

  app.get('/api/requests', (req, res) => {
    try {
      const stmt = db.prepare('SELECT * FROM requests ORDER BY created_at DESC');
      const requests = stmt.all();
      res.json(requests);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/requests', async (req, res) => {
    try {
      const { tmdb_id, media_type, title, poster_path, overview, release_date } = req.body;
      
      // Check if it already exists
      const checkStmt = db.prepare('SELECT id FROM requests WHERE tmdb_id = ? AND media_type = ?');
      const existing = checkStmt.get(tmdb_id, media_type);
      if (existing) {
        return res.status(400).json({ error: 'Esta solicitud ya existe.' });
      }

      const stmt = db.prepare(`
        INSERT INTO requests (tmdb_id, media_type, title, poster_path, overview, release_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `);
      const result = stmt.run(tmdb_id, media_type, title, poster_path || '', overview || '', release_date || '');
      
      // Notify Telegram
      await sendTelegramNotification(title, media_type);

      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.patch('/api/requests/:id', (req, res) => {
    try {
      const { status } = req.body;
      const { id } = req.params;
      const stmt = db.prepare('UPDATE requests SET status = ? WHERE id = ?');
      stmt.run(status, id);
      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  // Simple auth/users API
  app.post('/api/login', (req, res) => {
    try {
      const { username, password } = req.body;
      const stmt = db.prepare('SELECT id, username, is_admin FROM users WHERE username = ? AND password = ?');
      const user = stmt.get(username, password);
      
      if (!user) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }
      
      res.json({ user });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.get('/api/users', (req, res) => {
    try {
      const stmt = db.prepare('SELECT id, username, is_admin, created_at FROM users ORDER BY created_at DESC');
      const users = stmt.all();
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.post('/api/users', (req, res) => {
    try {
      const { username, password, is_admin } = req.body;
      
      const checkStmt = db.prepare('SELECT id FROM users WHERE username = ?');
      const existing = checkStmt.get(username);
      if (existing) {
        return res.status(400).json({ error: 'El usuario ya existe' });
      }

      const stmt = db.prepare('INSERT INTO users (username, password, is_admin) VALUES (?, ?, ?)');
      const result = stmt.run(username, password, is_admin ? 1 : 0);
      
      res.json({ id: result.lastInsertRowid, success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Database error' });
    }
  });

  app.delete('/api/users/:id', (req, res) => {
    try {
      const { id } = req.params;
      const stmt = db.prepare('DELETE FROM users WHERE id = ?');
      stmt.run(id);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ error: 'Database error' });
    }
  });

  if (!isProduction) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    // In production, server.js is in dist/ and static assets are also in dist/
    app.use(express.static(__dirname));
    app.get('*', (req, res) => {
      if (req.path.startsWith('/api/')) {
         return res.status(404).json({error: 'Not found'});
      }
      res.sendFile(join(__dirname, 'index.html'));
    });
  }

  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
