import { GitHubUser, RateLimitInfo, CrawlLog } from '../types';

export function parseGitHubInput(val: string): string {
  if (!val) return '';
  const trimmed = val.trim();
  if (trimmed.includes('github.com/')) {
    try {
      const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
      const parts = parsed.pathname.replace(/^\/+|\/+$/g, '').split('/');
      if (parts.length > 0 && parts[0]) {
        return parts[0];
      }
    } catch {
      // Fallback regex if URL constructor fails
      const match = trimmed.match(/github\.com\/([a-zA-Z0-9-_]+)/);
      if (match && match[1]) return match[1];
    }
  }
  return trimmed.replace(/^@/, '');
}

export class GitHubCrawlerService {
  private abortController: AbortController | null = null;
  private isAborted = false;
  private userCache: Map<string, GitHubUser> = new Map();
  private followersCache: Map<string, string[]> = new Map();

  public abort(): void {
    this.isAborted = true;
    if (this.abortController) {
      this.abortController.abort();
    }
  }

  public getIsAborted(): boolean {
    return this.isAborted;
  }

  public clearCache(): void {
    this.userCache.clear();
    this.followersCache.clear();
  }

  public async fetchUserDetails(
    username: string,
    token?: string,
    signal?: AbortSignal
  ): Promise<{ user: GitHubUser | null; rateLimit?: RateLimitInfo }> {
    if (this.isAborted || signal?.aborted) {
      return { user: null };
    }

    if (this.userCache.has(username.toLowerCase())) {
      return { user: this.userCache.get(username.toLowerCase())! };
    }

    // 1. First attempt: Direct Web Scraper (No REST API rate limit!)
    try {
      const scrapeRes = await fetch(`/api/scrape/profile?username=${encodeURIComponent(username)}`, { signal });
      if (scrapeRes.ok) {
        const data = await scrapeRes.json();
        if (data.user) {
          const user: GitHubUser = {
            login: data.user.login,
            id: data.user.id,
            avatar_url: data.user.avatar_url,
            html_url: data.user.html_url,
            name: data.user.name,
            bio: data.user.bio,
            company: data.user.company,
            location: data.user.location,
            public_repos: data.user.public_repos ?? 0,
            public_gists: 0,
            followers: data.user.followers ?? 0,
            following: data.user.following ?? 0,
          };
          this.userCache.set(username.toLowerCase(), user);
          return { user };
        }
      }
    } catch {
      // If backend scraping request fails, fall through to REST API
    }

    // 2. Fallback: GitHub REST API
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers,
        signal,
      });

      const rateLimit: RateLimitInfo = {
        remaining: res.headers.get('x-ratelimit-remaining')
          ? parseInt(res.headers.get('x-ratelimit-remaining')!, 10)
          : null,
        limit: res.headers.get('x-ratelimit-limit')
          ? parseInt(res.headers.get('x-ratelimit-limit')!, 10)
          : null,
        resetTime: res.headers.get('x-ratelimit-reset')
          ? new Date(parseInt(res.headers.get('x-ratelimit-reset')!, 10) * 1000).toLocaleTimeString()
          : null,
      };

      if (!res.ok) {
        return { user: null, rateLimit };
      }

      const data = await res.json();
      const user: GitHubUser = {
        login: data.login,
        id: data.id,
        avatar_url: data.avatar_url || `https://avatars.githubusercontent.com/u/${data.id}`,
        html_url: data.html_url || `https://github.com/${data.login}`,
        name: data.name,
        bio: data.bio,
        company: data.company,
        location: data.location,
        blog: data.blog,
        public_repos: data.public_repos ?? 0,
        public_gists: data.public_gists ?? 0,
        followers: data.followers ?? 0,
        following: data.following ?? 0,
        created_at: data.created_at,
      };

      this.userCache.set(username.toLowerCase(), user);
      return { user, rateLimit };
    } catch (err: unknown) {
      if ((err as any)?.name === 'AbortError' || this.isAborted || signal?.aborted) {
        return { user: null };
      }
      return { user: null };
    }
  }

  public async fetchFollowers(
    username: string,
    limit: number,
    token?: string,
    signal?: AbortSignal,
    forceRefresh: boolean = false
  ): Promise<{ followers: string[]; followerProfiles: Partial<GitHubUser>[]; rateLimit?: RateLimitInfo }> {
    if (this.isAborted || signal?.aborted) {
      return { followers: [], followerProfiles: [] };
    }

    if (!forceRefresh && this.followersCache.has(username.toLowerCase())) {
      const cached = this.followersCache.get(username.toLowerCase())!;
      if (cached.length >= limit) {
        return { followers: cached.slice(0, limit), followerProfiles: [] };
      }
    }

    // 1. First attempt: Direct Web Scraper (No REST API rate limits!)
    try {
      const scrapeRes = await fetch(
        `/api/scrape/followers?username=${encodeURIComponent(username)}&limit=${limit}`,
        { signal }
      );
      if (scrapeRes.ok) {
        const data = await scrapeRes.json();
        if (Array.isArray(data.followers)) {
          this.followersCache.set(username.toLowerCase(), data.followers);
          return {
            followers: data.followers,
            followerProfiles: data.profiles || [],
          };
        }
      }
    } catch {
      // If backend scraping request fails, fall through to REST API
    }

    // 2. Fallback: GitHub REST API
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    try {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/followers?per_page=${Math.min(limit, 100)}`,
        { headers, signal }
      );

      const rateLimit: RateLimitInfo = {
        remaining: res.headers.get('x-ratelimit-remaining')
          ? parseInt(res.headers.get('x-ratelimit-remaining')!, 10)
          : null,
        limit: res.headers.get('x-ratelimit-limit')
          ? parseInt(res.headers.get('x-ratelimit-limit')!, 10)
          : null,
        resetTime: res.headers.get('x-ratelimit-reset')
          ? new Date(parseInt(res.headers.get('x-ratelimit-reset')!, 10) * 1000).toLocaleTimeString()
          : null,
      };

      if (!res.ok) {
        return { followers: [], followerProfiles: [], rateLimit };
      }

      const data = await res.json();
      const followerLogins: string[] = [];
      const profiles: Partial<GitHubUser>[] = [];

      if (Array.isArray(data)) {
        for (const item of data) {
          followerLogins.push(item.login);
          profiles.push({
            login: item.login,
            id: item.id,
            avatar_url: item.avatar_url,
            html_url: item.html_url,
          });
        }
      }

      this.followersCache.set(username.toLowerCase(), followerLogins);
      return { followers: followerLogins, followerProfiles: profiles, rateLimit };
    } catch (err: unknown) {
      if ((err as any)?.name === 'AbortError' || this.isAborted || signal?.aborted) {
        return { followers: [], followerProfiles: [] };
      }
      return { followers: [], followerProfiles: [] };
    }
  }

  public async crawlNetwork(
    options: {
      startUser: string;
      token?: string;
      depth: number;
      limit: number;
    },
    callbacks: {
      onNode: (user: Partial<GitHubUser>, isRoot: boolean, level: number) => void;
      onEdge: (from: string, to: string) => void;
      onLog: (log: CrawlLog) => void;
      onRateLimit: (info: RateLimitInfo) => void;
      onProgress?: (currentUser: string, currentDepth: number, queueRemaining: number) => void;
      onFinish: (summary: { totalNodes: number; totalEdges: number; wasHalted: boolean }) => void;
    }
  ): Promise<void> {
    this.isAborted = false;
    this.abortController = new AbortController();
    const signal = this.abortController.signal;

    const seen = new Set<string>();
    const createdEdges = new Set<string>();
    let isRateLimitedFallback = false;
    let wasHalted = false;

    const addLog = (message: string, type: CrawlLog['type'] = 'info') => {
      callbacks.onLog({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      });
    };

    const targetUser = parseGitHubInput(options.startUser);
    if (!targetUser) {
      addLog('❌ Please provide a valid GitHub username or profile URL.', 'error');
      callbacks.onFinish({ totalNodes: 0, totalEdges: 0, wasHalted: false });
      return;
    }

    addLog(`🚀 Starting real-time GitHub network crawl for: @${targetUser} (Depth: ${options.depth}, Limit: ${options.limit})`, 'info');

    // Queue holds items: { user: string, depth: number, isRoot: boolean }
    const queue: { user: string; depth: number; isRoot: boolean }[] = [
      { user: targetUser, depth: 1, isRoot: true },
    ];

    while (queue.length > 0) {
      if (this.isAborted || signal.aborted) {
        wasHalted = true;
        break;
      }

      const item = queue.shift()!;
      const currentLogin = item.user;

      if (seen.has(currentLogin.toLowerCase())) {
        continue;
      }
      seen.add(currentLogin.toLowerCase());

      callbacks.onProgress?.(currentLogin, item.depth, queue.length);
      addLog(`🔍 Fetching real GitHub profile for: @${currentLogin} [Level ${item.depth}]...`, 'info');

      let userProfile: GitHubUser | null = null;
      let followers: string[] = [];
      let followerProfiles: Partial<GitHubUser>[] = [];

      try {
        const uRes = await this.fetchUserDetails(currentLogin, options.token, signal);
        if (this.isAborted || signal.aborted) {
          wasHalted = true;
          break;
        }
        if (uRes.rateLimit) callbacks.onRateLimit(uRes.rateLimit);
        userProfile = uRes.user;

        if (!userProfile) {
          addLog(`⚠️ User @${currentLogin} not found on GitHub or profile inaccessible.`, 'warn');
          continue;
        }

        const fRes = await this.fetchFollowers(currentLogin, options.limit, options.token, signal);
        if (this.isAborted || signal.aborted) {
          wasHalted = true;
          break;
        }
        if (fRes.rateLimit) callbacks.onRateLimit(fRes.rateLimit);
        followers = fRes.followers;
        followerProfiles = fRes.followerProfiles;
      } catch (err: unknown) {
        if (this.isAborted || signal.aborted) {
          wasHalted = true;
          break;
        }
        addLog(`⚠️ Notice fetching @${currentLogin}: ${(err as Error)?.message || 'Continuing crawl...'}`, 'warn');
        continue;
      }

      if (this.isAborted || signal.aborted) {
        wasHalted = true;
        break;
      }

      // Emit authenticated node
      callbacks.onNode(userProfile, item.isRoot, item.depth);

      if (followers.length === 0) {
        addLog(`ℹ️ @${userProfile.login} has 0 followers (or follower list is empty).`, 'info');
      } else {
        addLog(`✨ Discovered @${userProfile.login} (${followers.length} real followers linked)`, 'success');
      }

      // Process real followers
      for (let i = 0; i < followers.length; i++) {
        if (this.isAborted || signal.aborted) {
          wasHalted = true;
          break;
        }

        const followerLogin = followers[i];
        const profile = followerProfiles[i] || {
          login: followerLogin,
          avatar_url: `https://avatars.githubusercontent.com/u/0?v=4`,
          html_url: `https://github.com/${followerLogin}`,
        };

        // Add real follower node stub
        callbacks.onNode(profile, false, item.depth + 1);

        // Edge direction: follower follows currentLogin (follower -> currentLogin)
        const edgeKey = `${followerLogin.toLowerCase()}->${currentLogin.toLowerCase()}`;
        if (!createdEdges.has(edgeKey)) {
          createdEdges.add(edgeKey);
          callbacks.onEdge(followerLogin, currentLogin);
        }

        // Add to queue if depth allows
        if (item.depth < options.depth && !seen.has(followerLogin.toLowerCase())) {
          queue.push({
            user: followerLogin,
            depth: item.depth + 1,
            isRoot: false,
          });
        }
      }

      if (this.isAborted || signal.aborted) {
        wasHalted = true;
        break;
      }

      // Responsive delay that cancels immediately on abort
      await new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), 150);
        if (signal.aborted || this.isAborted) {
          clearTimeout(timer);
          resolve();
          return;
        }
        const onAbort = () => {
          clearTimeout(timer);
          resolve();
        };
        signal.addEventListener('abort', onAbort, { once: true });
      });

      if (this.isAborted || signal.aborted) {
        wasHalted = true;
        break;
      }
    }

    if (wasHalted || this.isAborted || signal.aborted) {
      addLog(`⏹️ Scraping halted. Displaying ${seen.size} verified nodes and ${createdEdges.size} genuine edges.`, 'warn');
      callbacks.onFinish({
        totalNodes: seen.size,
        totalEdges: createdEdges.size,
        wasHalted: true,
      });
    } else {
      addLog(`✅ Verified Graph Complete! Visualizing ${seen.size} authentic nodes and ${createdEdges.size} edges.`, 'success');
      callbacks.onFinish({
        totalNodes: seen.size,
        totalEdges: createdEdges.size,
        wasHalted: false,
      });
    }

    this.abortController = null;
    this.isAborted = false;
  }
}

export const crawlerService = new GitHubCrawlerService();
