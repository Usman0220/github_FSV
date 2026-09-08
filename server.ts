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

interface CachedItem<T> {
  data: T;
  timestamp: number;
}

const profileCache = new Map<string, CachedItem<GitHubUserScraped>>();
const htmlPageCache = new Map<string, CachedItem<string>>();
const CACHE_TTL_MS = 3 * 60 * 1000; // 3 minutes cache

async function scrapeUserProfile(username: string): Promise<GitHubUserScraped | null> {
  const cacheKey = username.toLowerCase();
  const cached = profileCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

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

  const profile: GitHubUserScraped = {
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

  profileCache.set(cacheKey, { data: profile, timestamp: Date.now() });
  return profile;
}

async function fetchGitHubFollowersHtml(username: string, page: number): Promise<string | null> {
  const cacheKey = `${username.toLowerCase()}:followers:${page}`;
  const cached = htmlPageCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  try {
    const url = `https://github.com/${encodeURIComponent(username)}?tab=followers&page=${page}`;
    const res = await fetch(url, { headers: DEFAULT_HEADERS });
    if (!res.ok) return null;
    const html = await res.text();
    htmlPageCache.set(cacheKey, { data: html, timestamp: Date.now() });
    return html;
  } catch (err) {
    console.error(`Error fetching followers page ${page} for ${username}:`, err);
    return null;
  }
}

function parseFollowersFromHtml(html: string): { followers: string[]; profiles: ScrapedFollowerProfile[] } {
  const followers: string[] = [];
  const profiles: ScrapedFollowerProfile[] = [];
  const seen = new Set<string>();

  const itemRegex = /<div class="d-table table-fixed[^>]*>([\s\S]*?)<\/div>\s*<\/div>/g;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(html)) !== null) {
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
      }
    }
  }

  return { followers, profiles };
}

async function scrapeUserFollowers(
  username: string,
  limit: number = 20,
  batchPage: number = 1
): Promise<{ followers: string[]; profiles: ScrapedFollowerProfile[]; page: number; nextPage: number; hasMore: boolean }> {
  const p = Math.max(1, batchPage);
  const l = Math.max(1, limit);
  const targetStartIndex = (p - 1) * l;
  const targetEndIndex = targetStartIndex + l;

  // GitHub followers tab contains 50 items per HTML page
  const startHtmlPage = Math.floor(targetStartIndex / 50) + 1;
  const endHtmlPage = Math.floor((targetEndIndex - 1) / 50) + 1;

  const allFollowers: string[] = [];
  const allProfiles: ScrapedFollowerProfile[] = [];
  const seen = new Set<string>();

  for (let hp = startHtmlPage; hp <= endHtmlPage; hp++) {
    const html = await fetchGitHubFollowersHtml(username, hp);
    if (!html) break;

    const parsed = parseFollowersFromHtml(html);
    if (parsed.followers.length === 0) break;

    for (let i = 0; i < parsed.followers.length; i++) {
      const u = parsed.followers[i];
      if (!seen.has(u.toLowerCase())) {
        seen.add(u.toLowerCase());
        allFollowers.push(u);
        allProfiles.push(parsed.profiles[i]);
      }
    }

    if (parsed.followers.length < 50) {
      break;
    }
  }

  const baseOffset = (startHtmlPage - 1) * 50;
  const sliceStart = Math.max(0, targetStartIndex - baseOffset);
  const sliceEnd = sliceStart + l;

  const slicedFollowers = allFollowers.slice(sliceStart, sliceEnd);
  const slicedProfiles = allProfiles.slice(sliceStart, sliceEnd);

  return {
    followers: slicedFollowers,
    profiles: slicedProfiles,
    page: p,
    nextPage: p + 1,
    hasMore: slicedFollowers.length === l,
  };
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
    const rawPage = parseInt(req.query.page as string || '1', 10);
    const page = isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;

    if (!username) {
      res.status(400).json({ error: 'Username is required' });
      return;
    }

    try {
      const { followers, profiles, nextPage, hasMore } = await scrapeUserFollowers(username, limit, page);
      res.json({ followers, profiles, count: followers.length, page, nextPage, hasMore });
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
