export interface GitHubUser {
  login: string;
  id: number;
  avatar_url: string;
  html_url: string;
  name?: string | null;
  bio?: string | null;
  company?: string | null;
  location?: string | null;
  blog?: string | null;
  public_repos?: number;
  public_gists?: number;
  followers?: number;
  following?: number;
  created_at?: string;
}

export interface NetworkNodeData {
  id: string;
  label: string;
  shape: 'circularImage' | 'image' | 'dot';
  image?: string;
  size: number;
  color?: {
    background?: string;
    border?: string;
    highlight?: {
      background?: string;
      border?: string;
    };
  };
  borderWidth?: number;
  title?: string;
  level?: number;
  font?: {
    color: string;
    size: number;
    face?: string;
    strokeWidth?: number;
    strokeColor?: string;
  };
  userDetails?: GitHubUser;
  inDegree?: number;
  outDegree?: number;
}

export interface NetworkEdgeData {
  id?: string;
  from: string;
  to: string;
  color?: {
    color?: string;
    highlight?: string;
    hover?: string;
    opacity?: number;
  } | string;
  arrows?: {
    to?: {
      enabled: boolean;
      scaleFactor?: number;
    };
  } | string;
  width?: number;
  dashes?: boolean;
}

export type FetchSpeed = 'turbo' | 'fast' | 'balanced' | 'safe';

export interface CrawlOptions {
  startUser: string;
  token?: string;
  depth: number;
  limit: number;
  enablePhysics: boolean;
  fetchSpeed?: FetchSpeed;
  fetchDelayMs?: number;
}

export interface CrawlLog {
  id: string;
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warn' | 'error';
}

export interface RateLimitInfo {
  remaining: number | null;
  limit: number | null;
  resetTime: string | null;
}
