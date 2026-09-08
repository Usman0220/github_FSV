import express, { Request, Response } from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const PORT = 3000;

interface GitHubUserScraped {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name: string;
  bio?: string;
  company?: string;
  location?: string;
  public_repos: number;
  followers: number;
  following: number;
}

interface ScrapedFollowerProfile {
  login: string;
  name?: string;
  avatar_url: string;
  html_url: string;
}

const parseNumericStat = (str?: string): number => {
  if (!str) return 0;
  const clean = str.toLowerCase().replace(/,/g, '').trim();
  if (clean.endsWith('k')) return Math.round(parseFloat(clean) * 1000);
  if (clean.endsWith('m')) return Math.round(parseFloat(clean) * 1000000);
  return parseInt(clean, 10) || 0;
};

const DEFAULT_HEADERS = {
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
  'Cache-Control': 'no-cache',
  Pragma: 'no-cache',
};

async function scrapeUserProfile(username: string): Promise<GitHubUserScraped | null> {
  const url = `https://github.com/${encodeURIComponent(username)}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub responded with status ${res.status}`);
  }

  const html = await res.text();

  const nameMatch =
    html.match(/class="p-name[^"]*"[^>]*>([^<]+)<\/span>/i) ||
    html.match(/itemprop="name">\s*([^<]+)\s*<\/span>/i);

  const bioMatch =
    html.match(/class="p-note[^"]*"[^>]*>([\s\S]*?)<\/div>/i) ||
    html.match(/data-bio-text[^>]*>([\s\S]*?)<\/div>/i);

  const avatarMatch =
    html.match(/class="[^"]*avatar-user width-full[^"]*"[^>]*src="([^"]+)"/i) ||
    html.match(/class="[^"]*avatar-user[^"]*"[^>]*src="([^"]+)"/i) ||
    html.match(/itemprop="image" href="([^"]+)"/i);

  const followersMatch =
    html.match(/href="[^"]*\?tab=followers"[^>]*>[\s\S]*?<span class="text-bold[^"]*">([^<]+)<\/span>/i) ||
    html.match(/<span class="text-bold[^"]*">([^<]+)<\/span>\s*followers/i);

  const followingMatch =
    html.match(/href="[^"]*\?tab=following"[^>]*>[\s\S]*?<span class="text-bold[^"]*">([^<]+)<\/span>/i) ||
    html.match(/<span class="text-bold[^"]*">([^<]+)<\/span>\s*following/i);

  const reposMatch =
    html.match(/href="[^"]*\?tab=repositories"[^>]*>[\s\S]*?<span class="Counter[^"]*">([^<]+)<\/span>/i) ||
    html.match(/<span class="Counter[^"]*">([^<]+)<\/span>\s*repositories/i);

  const companyMatch =
    html.match(/itemprop="worksFor"[^>]*>[\s\S]*?<div[^>]*>([^<]+)<\/div>/i) ||
    html.match(/class="p-org"[^>]*>[\s\S]*?<div>([^<]+)<\/div>/i);

  const locationMatch =
    html.match(/itemprop="homeLocation"[^>]*>[\s\S]*?<span class="p-label">([^<]+)<\/span>/i) ||
    html.match(/class="p-label"[^>]*>([^<]+)<\/span>/i);

  const cleanBio = bioMatch ? bioMatch[1].replace(/<[^>]+>/g, '').trim() : '';
  const cleanAvatar = avatarMatch
    ? avatarMatch[1].replace(/&amp;/g, '&')
    : `https://avatars.githubusercontent.com/u/0?v=4`;

  return {
    login: username,
    id: Math.abs(hashCode(username)),
    avatar_url: cleanAvatar,
    html_url: `https://github.com/${username}`,
    name: nameMatch ? nameMatch[1].trim() : username,
    bio: cleanBio,
    company: companyMatch ? companyMatch[1].trim() : undefined,
    location: locationMatch ? locationMatch[1].trim() : undefined,
    followers: parseNumericStat(followersMatch ? followersMatch[1] : undefined),
    following: parseNumericStat(followingMatch ? followingMatch[1] : undefined),
    public_repos: parseNumericStat(reposMatch ? reposMatch[1] : undefined),
  };
}

async function scrapeUserFollowers(
  username: string,
  limit: number = 20
): Promise<{ followers: string[]; profiles: ScrapedFollowerProfile[] }> {
  const followers: string[] = [];
  const profiles: ScrapedFollowerProfile[] = [];
  const seen = new Set<string>();
  let page = 1;
  // Calculate maximum pages to inspect to satisfy the requested limit
  const maxPages = Math.max(Math.ceil(limit / 25) + 3, 500);

  while (followers.length < limit && page <= maxPages) {
    const url = `https://github.com/${encodeURIComponent(username)}?tab=followers&page=${page}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });

    if (!res.ok) break;
    const html = await res.text();

    const itemRegex = /<div class="d-table table-fixed[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
    let match: RegExpExecArray | null;
    let foundInPage = 0;

    while ((match = itemRegex.exec(html)) !== null && followers.length < limit) {
      const block = match[1];
      const loginM =
        block.match(/data-hovercard-url="\/users\/([^/"]+)\/hovercard"/) ||
        block.match(/href="\/([a-zA-Z0-9_\-]+)"[^>]*data-hovercard-type="user"/);

      const imgM = block.match(/src="([^"]+)"/);
      const nameM =
        block.match(/<span class="[^"]*f4[^"]*">([^<]+)<\/span>/) ||
        block.match(/<span class="Link--primary[^"]*">([^<]+)<\/span>/);

      if (loginM && loginM[1]) {
        const login = loginM[1].trim();
        // Discard common GitHub navigation keywords if mismatched
        if (['features', 'security', 'enterprise', 'customer-stories', 'readme', 'topics'].includes(login.toLowerCase())) {
          continue;
        }

        if (!seen.has(login.toLowerCase())) {
          seen.add(login.toLowerCase());
          followers.push(login);
          profiles.push({
            login,
            name: nameM ? nameM[1].trim() : login,
            avatar_url: imgM
              ? imgM[1].replace(/&amp;/g, '&')
              : `https://avatars.githubusercontent.com/u/0?v=4`,
            html_url: `https://github.com/${login}`,
          });
          foundInPage++;
        }
      }
    }

    if (foundInPage === 0) break;
    page++;
  }

  return { followers, profiles };
}

function hashCode(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return hash;
}

async function startServer() {
  const app = express();
  app.use(express.json());

  // API Health Check
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ status: 'ok', engine: 'github-direct-web-scraper' });
  });

  // API Scraping: User Profile
  app.get('/api/scrape/profile', async (req: Request, res: Response) => {
    const username = (req.query.username as string || '').trim();
    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    try {
      const user = await scrapeUserProfile(username);
      if (!user) {
        res.status(404).json({ error: `User @${username} not found on GitHub` });
        return;
      }
      res.json({ user });
    } catch (err: unknown) {
      console.error(`Error scraping profile for ${username}:`, err);
      res.status(500).json({ error: (err as Error)?.message || 'Scraping failed' });
    }
  });

  // API Scraping: User Followers
  app.get('/api/scrape/followers', async (req: Request, res: Response) => {
    const username = (req.query.username as string || '').trim();
    const rawLimit = parseInt(req.query.limit as string || '10', 10);
    const limit = isNaN(rawLimit) || rawLimit < 1 ? 10 : rawLimit;

    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    try {
      const { followers, profiles } = await scrapeUserFollowers(username, limit);
      res.json({ followers, profiles, count: followers.length });
    } catch (err: unknown) {
      console.error(`Error scraping followers for ${username}:`, err);
      res.status(500).json({ error: (err as Error)?.message || 'Scraping followers failed' });
    }
  });

  // Vite middleware in dev; static in production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 GitHub Scraper Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
