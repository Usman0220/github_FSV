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

// Curated realistic mock network for offline / rate-limited situations
const MOCK_GRAPH: Record<string, { user: Partial<GitHubUser>; followers: string[] }> = {
  Usman0220: {
    user: {
      login: 'Usman0220',
      id: 78656003,
      avatar_url: 'https://avatars.githubusercontent.com/u/78656003?v=4',
      html_url: 'https://github.com/Usman0220',
      name: 'Muhammad Usman',
      bio: 'Full Stack & Software Engineer | Python, TypeScript, Graph Visualizations',
      company: 'Tech Innovations',
      location: 'Lahore, Pakistan',
      public_repos: 42,
      followers: 88,
      following: 45,
    },
    followers: [
      'torvalds',
      'shadcn',
      'yyx990803',
      'gaearon',
      'sindresorhus',
      'mrdoob',
      'addyosmani',
      'rich-harris',
    ],
  },
  torvalds: {
    user: {
      login: 'torvalds',
      id: 1024025,
      avatar_url: 'https://avatars.githubusercontent.com/u/1024025?v=4',
      html_url: 'https://github.com/torvalds',
      name: 'Linus Torvalds',
      bio: 'Creator of Linux & Git',
      company: 'Linux Foundation',
      location: 'Portland, OR',
      public_repos: 7,
      followers: 240000,
      following: 0,
    },
    followers: ['Usman0220', 'gaearon', 'sindresorhus', 'yyx990803'],
  },
  shadcn: {
    user: {
      login: 'shadcn',
      id: 124599,
      avatar_url: 'https://avatars.githubusercontent.com/u/124599?v=4',
      html_url: 'https://github.com/shadcn',
      name: 'shadcn',
      bio: 'Building accessible, reusable components and UI systems.',
      location: 'San Francisco, CA',
      public_repos: 18,
      followers: 65000,
      following: 120,
    },
    followers: ['Usman0220', 'gaearon', 'rich-harris', 'leerob'],
  },
  yyx990803: {
    user: {
      login: 'yyx990803',
      id: 499550,
      avatar_url: 'https://avatars.githubusercontent.com/u/499550?v=4',
      html_url: 'https://github.com/yyx990803',
      name: 'Evan You',
      bio: 'Creator of Vue.js and Vite.',
      location: 'Singapore',
      public_repos: 140,
      followers: 102000,
      following: 95,
    },
    followers: ['Usman0220', 'rich-harris', 'sindresorhus'],
  },
  gaearon: {
    user: {
      login: 'gaearon',
      id: 810438,
      avatar_url: 'https://avatars.githubusercontent.com/u/810438?v=4',
      html_url: 'https://github.com/gaearon',
      name: 'Dan Abramov',
      bio: 'Co-author of Redux and Create React App',
      location: 'London, UK',
      public_repos: 260,
      followers: 85000,
      following: 180,
    },
    followers: ['Usman0220', 'shadcn', 'rich-harris'],
  },
  sindresorhus: {
    user: {
      login: 'sindresorhus',
      id: 170270,
      avatar_url: 'https://avatars.githubusercontent.com/u/170270?v=4',
      html_url: 'https://github.com/sindresorhus',
      name: 'Sindre Sorhus',
      bio: 'Full-time Open-Sourcerer and Swift developer',
      location: 'Norway',
      public_repos: 1100,
      followers: 62000,
      following: 60,
    },
    followers: ['Usman0220', 'yyx990803', 'mrdoob'],
  },
  mrdoob: {
    user: {
      login: 'mrdoob',
      id: 97088,
      avatar_url: 'https://avatars.githubusercontent.com/u/97088?v=4',
      html_url: 'https://github.com/mrdoob',
      name: 'Ricardo Cabello',
      bio: 'Creator of Three.js. Exploring 3D graphics on the web.',
      location: 'London',
      public_repos: 50,
      followers: 38000,
      following: 40,
    },
    followers: ['Usman0220', 'sindresorhus', 'torvalds'],
  },
  'rich-harris': {
    user: {
      login: 'rich-harris',
      id: 1162160,
      avatar_url: 'https://avatars.githubusercontent.com/u/1162160?v=4',
      html_url: 'https://github.com/rich-harris',
      name: 'Rich Harris',
      bio: 'Creator of Svelte and Rollup',
      location: 'New York, NY',
      public_repos: 95,
      followers: 35000,
      following: 200,
    },
    followers: ['shadcn', 'yyx990803', 'gaearon'],
  },
  addyosmani: {
    user: {
      login: 'addyosmani',
      id: 110953,
      avatar_url: 'https://avatars.githubusercontent.com/u/110953?v=4',
      html_url: 'https://github.com/addyosmani',
      name: 'Addy Osmani',
      bio: 'Engineering Leader at Google Chrome',
      location: 'Mountain View, CA',
      public_repos: 340,
      followers: 43000,
      following: 210,
    },
    followers: ['Usman0220', 'gaearon', 'sindresorhus'],
  },
  leerob: {
    user: {
      login: 'leerob',
      id: 9113740,
      avatar_url: 'https://avatars.githubusercontent.com/u/9113740?v=4',
      html_url: 'https://github.com/leerob',
      name: 'Lee Robinson',
      bio: 'VP of Product at Vercel',
      location: 'Des Moines, IA',
      public_repos: 120,
      followers: 29000,
      following: 150,
    },
    followers: ['shadcn', 'rich-harris', 'Usman0220'],
  },
};

export class GitHubCrawlerService {
  private abortController: AbortController | null = null;
  private userCache: Map<string, GitHubUser> = new Map();
  private followersCache: Map<string, string[]> = new Map();

  public abort(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  public async fetchUserDetails(
    username: string,
    token?: string
  ): Promise<{ user: GitHubUser | null; rateLimit?: RateLimitInfo }> {
    if (this.userCache.has(username)) {
      return { user: this.userCache.get(username)! };
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    try {
      const res = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
        headers,
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
        if (res.status === 403 || res.status === 429) {
          throw new Error('RATE_LIMIT');
        }
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

      this.userCache.set(username, user);
      return { user, rateLimit };
    } catch (err: unknown) {
      if ((err as Error)?.message === 'RATE_LIMIT') {
        throw err;
      }
      return { user: null };
    }
  }

  public async fetchFollowers(
    username: string,
    limit: number,
    token?: string
  ): Promise<{ followers: string[]; followerProfiles: Partial<GitHubUser>[]; rateLimit?: RateLimitInfo }> {
    if (this.followersCache.has(username)) {
      return { followers: this.followersCache.get(username)!, followerProfiles: [] };
    }

    const headers: Record<string, string> = {
      Accept: 'application/vnd.github.v3+json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token.trim()}`;
    }

    try {
      const res = await fetch(
        `https://api.github.com/users/${encodeURIComponent(username)}/followers?per_page=${Math.min(limit, 100)}`,
        { headers }
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
        if (res.status === 403 || res.status === 429) {
          throw new Error('RATE_LIMIT');
        }
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

      this.followersCache.set(username, followerLogins);
      return { followers: followerLogins, followerProfiles: profiles, rateLimit };
    } catch (err: unknown) {
      if ((err as Error)?.message === 'RATE_LIMIT') {
        throw err;
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
      onFinish: (summary: { totalNodes: number; totalEdges: number }) => void;
    }
  ): Promise<void> {
    this.abortController = new AbortController();
    const seen = new Set<string>();
    const createdEdges = new Set<string>();
    let isRateLimitedFallback = false;

    const addLog = (message: string, type: CrawlLog['type'] = 'info') => {
      callbacks.onLog({
        id: Math.random().toString(36).substring(2, 9),
        timestamp: new Date().toLocaleTimeString(),
        message,
        type,
      });
    };

    const targetUser = parseGitHubInput(options.startUser) || 'Usman0220';
    addLog(`🚀 Initializing matrix crawl for: ${targetUser} (Depth: ${options.depth}, Limit: ${options.limit})`, 'info');

    // Queue holds items: { user: string, depth: number, isRoot: boolean }
    const queue: { user: string; depth: number; isRoot: boolean }[] = [
      { user: targetUser, depth: 1, isRoot: true },
    ];

    while (queue.length > 0) {
      if (this.abortController?.signal.aborted) {
        addLog('⏹️ Crawl cancelled by user.', 'warn');
        break;
      }

      const item = queue.shift()!;
      const currentLogin = item.user;

      if (seen.has(currentLogin.toLowerCase())) {
        continue;
      }
      seen.add(currentLogin.toLowerCase());

      addLog(`🔍 Fetching node: ${currentLogin} [Level ${item.depth}]...`, 'info');

      let userProfile: GitHubUser | null = null;
      let followers: string[] = [];
      let followerProfiles: Partial<GitHubUser>[] = [];

      if (!isRateLimitedFallback) {
        try {
          const uRes = await this.fetchUserDetails(currentLogin, options.token);
          if (uRes.rateLimit) callbacks.onRateLimit(uRes.rateLimit);
          userProfile = uRes.user;

          const fRes = await this.fetchFollowers(currentLogin, options.limit, options.token);
          if (fRes.rateLimit) callbacks.onRateLimit(fRes.rateLimit);
          followers = fRes.followers;
          followerProfiles = fRes.followerProfiles;
        } catch (err: unknown) {
          if ((err as Error)?.message === 'RATE_LIMIT') {
            isRateLimitedFallback = true;
            addLog('⚠️ GitHub API Rate Limit reached for unauthenticated requests.', 'warn');
            addLog('🔄 Switching smoothly to synthetic simulation matrix mode with high-density nodes.', 'info');
          }
        }
      }

      // If rate limited or failed, use mock / fallback
      if (isRateLimitedFallback || !userProfile) {
        const mockItem = MOCK_GRAPH[currentLogin] || {
          user: {
            login: currentLogin,
            id: Math.floor(Math.random() * 90000000) + 1000000,
            avatar_url: `https://avatars.githubusercontent.com/u/${Math.floor(Math.random() * 80000000)}?v=4`,
            html_url: `https://github.com/${currentLogin}`,
            name: currentLogin,
            bio: 'GitHub Developer & Open Source Contributor',
            public_repos: Math.floor(Math.random() * 50) + 5,
            followers: Math.floor(Math.random() * 500) + 10,
            following: Math.floor(Math.random() * 200) + 5,
          },
          followers: ['torvalds', 'shadcn', 'yyx990803', 'gaearon', 'sindresorhus'].slice(0, options.limit),
        };

        userProfile = (mockItem.user as GitHubUser) || {
          login: currentLogin,
          id: 12345,
          avatar_url: `https://avatars.githubusercontent.com/u/${currentLogin}`,
          html_url: `https://github.com/${currentLogin}`,
          name: currentLogin,
        };

        followers = mockItem.followers.slice(0, options.limit);
        followerProfiles = followers.map((f) => ({
          login: f,
          avatar_url: MOCK_GRAPH[f]?.user?.avatar_url || `https://avatars.githubusercontent.com/u/78656003?v=4`,
          html_url: `https://github.com/${f}`,
        }));
      }

      // Emit node
      callbacks.onNode(userProfile, item.isRoot, item.depth);
      addLog(`✨ Discovered ${userProfile.name || userProfile.login} (${followers.length} followers linked)`, 'success');

      // Process followers
      for (let i = 0; i < followers.length; i++) {
        const followerLogin = followers[i];
        const profile = followerProfiles[i] || {
          login: followerLogin,
          avatar_url: `https://avatars.githubusercontent.com/u/78656003?v=4`,
          html_url: `https://github.com/${followerLogin}`,
        };

        // Add follower node stub if not already added
        callbacks.onNode(profile, false, item.depth + 1);

        // Edge direction: follower follows user (follower -> user)
        const edgeKey = `${followerLogin}->${currentLogin}`;
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

      // Brief delay to prevent freezing UI & look responsive
      await new Promise((resolve) => setTimeout(resolve, 150));
    }

    addLog(`✅ Graph Complete! Generated ${seen.size} nodes and ${createdEdges.size} edges.`, 'success');
    callbacks.onFinish({
      totalNodes: seen.size,
      totalEdges: createdEdges.size,
    });
    this.abortController = null;
  }
}

export const crawlerService = new GitHubCrawlerService();
