import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, 
  Square, 
  Key, 
  Globe, 
  GitFork, 
  Users, 
  Activity, 
  Terminal, 
  Trash2, 
  Eye, 
  EyeOff, 
  ExternalLink,
  ChevronRight,
  Info,
  Zap,
  Gauge
} from 'lucide-react';
import { CrawlOptions, CrawlLog, RateLimitInfo, FetchSpeed } from '../types';

interface SidebarProps {
  options: CrawlOptions;
  onChangeOptions: (newOpts: Partial<CrawlOptions>) => void;
  onStartCrawl: () => void;
  onStopCrawl: () => void;
  isCrawling: boolean;
  activeScrapingUser?: string | null;
  logs: CrawlLog[];
  onClearLogs: () => void;
  rateLimit: RateLimitInfo;
  stats: {
    totalNodes: number;
    totalEdges: number;
  };
}

const PRESET_USERS = [
  { label: 'Usman0220', url: 'https://github.com/Usman0220' },
  { label: 'torvalds', url: 'https://github.com/torvalds' },
  { label: 'shadcn', url: 'https://github.com/shadcn' },
  { label: 'yyx990803', url: 'https://github.com/yyx990803' },
];

export const Sidebar: React.FC<SidebarProps> = ({
  options,
  onChangeOptions,
  onStartCrawl,
  onStopCrawl,
  isCrawling,
  activeScrapingUser,
  logs,
  onClearLogs,
  rateLimit,
  stats,
}) => {
  const [showToken, setShowToken] = useState(false);
  const [showTokenHelp, setShowTokenHelp] = useState(false);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="w-96 min-w-[340px] max-w-sm h-full bg-[#0d1117] border-r border-[#30363d] flex flex-col z-20 select-text">
      {/* Header */}
      <div className="p-4 border-b border-[#30363d] bg-[#161b22]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#238636] flex items-center justify-center text-white shadow-sm font-mono font-bold text-base">
              GH
            </div>
            <div>
              <h1 className="text-sm font-bold text-[#f0f6fc] tracking-tight">GitHub Explorer</h1>
              <p className="text-[11px] text-[#8b949e]">Follower Network Matrix</p>
            </div>
          </div>
          {isCrawling ? (
            <div className="flex items-center gap-1.5">
              <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#da3633]/20 text-[#f85149] border border-[#da3633]/40 animate-pulse">
                <span className="w-1.5 h-1.5 rounded-full bg-[#f85149]" />
                Scraping...
              </span>
              <button
                onClick={onStopCrawl}
                title="Halt scraping immediately"
                className="text-[10px] bg-[#da3633] hover:bg-[#f85149] text-white px-2 py-0.5 rounded font-bold transition-all cursor-pointer"
              >
                Halt
              </button>
            </div>
          ) : (
            <span className="flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#21262d] text-[#8b949e] border border-[#30363d]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8b949e]" />
              Ready
            </span>
          )}
        </div>

        {/* Live Matrix Counts */}
        <div className="grid grid-cols-2 gap-2 mt-3.5">
          <div className="bg-[#0d1117] px-3 py-2 rounded-lg border border-[#30363d]/80 flex items-center justify-between">
            <span className="text-[11px] text-[#8b949e] flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#58a6ff]" /> Nodes
            </span>
            <span className="text-sm font-bold text-[#f0f6fc] font-mono">{stats.totalNodes}</span>
          </div>
          <div className="bg-[#0d1117] px-3 py-2 rounded-lg border border-[#30363d]/80 flex items-center justify-between">
            <span className="text-[11px] text-[#8b949e] flex items-center gap-1.5">
              <GitFork className="w-3.5 h-3.5 text-[#3fb950]" /> Edges
            </span>
            <span className="text-sm font-bold text-[#f0f6fc] font-mono">{stats.totalEdges}</span>
          </div>
        </div>
      </div>

      {/* Main Settings Form */}
      <div className="p-4 space-y-4 overflow-y-auto flex-1 text-xs">
        {/* Target URL/User */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[#c9d1d9] flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#58a6ff]" />
              Target URL/User:
            </label>
          </div>
          <input
            type="text"
            value={options.startUser}
            onChange={(e) => onChangeOptions({ startUser: e.target.value })}
            placeholder="https://github.com/Usman0220"
            className="w-full px-3 py-2 bg-[#161b22] border border-[#30363d] rounded-md text-[#f0f6fc] placeholder-[#8b949e] font-mono text-xs focus:outline-none focus:border-[#58a6ff] transition-colors"
          />

          {/* Quick Presets */}
          <div className="flex items-center gap-1.5 flex-wrap pt-1">
            <span className="text-[10px] text-[#8b949e]">Presets:</span>
            {PRESET_USERS.map((preset) => (
              <button
                key={preset.label}
                onClick={() => onChangeOptions({ startUser: preset.url })}
                className={`px-2 py-0.5 rounded text-[11px] font-mono border transition-all ${
                  options.startUser === preset.url || options.startUser === preset.label
                    ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/50 font-bold'
                    : 'bg-[#21262d] text-[#8b949e] border-[#30363d] hover:text-[#c9d1d9] hover:bg-[#30363d]'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* GitHub Token */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[#c9d1d9] flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#e3b341]" />
              GitHub Token:
              <button
                type="button"
                onClick={() => setShowTokenHelp(!showTokenHelp)}
                className="text-[#8b949e] hover:text-[#c9d1d9]"
                title="Token information"
              >
                <Info className="w-3.5 h-3.5" />
              </button>
            </label>
            <span className="text-[10px] text-[#8b949e]">(Optional)</span>
          </div>

          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={options.token || ''}
              onChange={(e) => onChangeOptions({ token: e.target.value })}
              placeholder="ghp_xxxxxxxxxxxx"
              className="w-full px-3 py-2 pr-9 bg-[#161b22] border border-[#30363d] rounded-md text-[#f0f6fc] placeholder-[#8b949e] font-mono text-xs focus:outline-none focus:border-[#58a6ff] transition-colors"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8b949e] hover:text-[#c9d1d9]"
            >
              {showToken ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          </div>

          {showTokenHelp && (
            <div className="p-2.5 rounded bg-[#161b22] border border-[#30363d] text-[11px] text-[#8b949e] space-y-1">
              <p>
                <strong className="text-[#3fb950]">Direct Web Scraping:</strong> Active by default. Scrapes live GitHub profiles and follower pages directly without REST API rate limits.
              </p>
              <p>
                <strong className="text-[#c9d1d9]">GitHub PAT (Optional):</strong> You can optionally supply a token to access private follower graphs or REST endpoints.
              </p>
            </div>
          )}

          {/* Engine status display */}
          <div className="flex items-center justify-between text-[11px] text-[#8b949e] pt-0.5">
            <span>Scraping Engine:</span>
            <span className="font-mono text-[#3fb950] font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3fb950] inline-block" />
              Direct Web Scraper (No Limits)
            </span>
          </div>
        </div>

        {/* Options Row (Depth & Limit - Unrestricted) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          {/* Depth */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="crawl-depth-input" className="font-semibold text-[#c9d1d9] text-xs">
                Traversal Depth:
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                id="crawl-depth-input"
                type="number"
                min="1"
                step="1"
                value={options.depth}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeOptions({ depth: isNaN(val) ? 1 : Math.max(1, val) });
                }}
                className="w-full px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-[#f0f6fc] font-mono text-xs font-semibold focus:outline-none focus:border-[#58a6ff] transition-colors"
              />
            </div>
            {/* Quick depth presets */}
            <div className="flex items-center gap-1">
              {[1, 2, 3, 4, 5].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => onChangeOptions({ depth: d })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    options.depth === d
                      ? 'bg-[#238636] text-white font-bold'
                      : 'bg-[#161b22] hover:bg-[#21262d] text-[#8b949e]'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8b949e]">Any depth value (e.g. 1, 2, 5...)</p>
          </div>

          {/* Limit (Followers per node) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="crawl-limit-input" className="font-semibold text-[#c9d1d9] text-xs">
                Followers / Node:
              </label>
            </div>
            <div className="flex items-center gap-1.5">
              <input
                id="crawl-limit-input"
                type="number"
                min="1"
                step="1"
                value={options.limit}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  onChangeOptions({ limit: isNaN(val) ? 1 : Math.max(1, val) });
                }}
                className="w-full px-2.5 py-1.5 bg-[#161b22] border border-[#30363d] rounded text-[#f0f6fc] font-mono text-xs font-semibold focus:outline-none focus:border-[#58a6ff] transition-colors"
              />
            </div>
            {/* Quick limit presets */}
            <div className="flex items-center gap-1">
              {[5, 10, 25, 50, 100].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => onChangeOptions({ limit: l })}
                  className={`px-1.5 py-0.5 rounded text-[10px] font-mono transition-colors ${
                    options.limit === l
                      ? 'bg-[#238636] text-white font-bold'
                      : 'bg-[#161b22] hover:bg-[#21262d] text-[#8b949e]'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[#8b949e]">Any limit (e.g. 10, 50, 200...)</p>
          </div>
        </div>

        {/* Fetch Speed & Performance Section */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between">
            <label className="font-semibold text-[#c9d1d9] flex items-center gap-1.5 text-xs">
              <Zap className="w-3.5 h-3.5 text-[#e3b341]" />
              Fetch Speed:
            </label>
            <span className="font-mono text-[10px] text-[#58a6ff] bg-[#1f6feb]/15 px-1.5 py-0.5 rounded border border-[#1f6feb]/30">
              {options.fetchDelayMs !== undefined
                ? `${options.fetchDelayMs}ms delay`
                : options.fetchSpeed === 'turbo'
                ? '0ms (Instant)'
                : options.fetchSpeed === 'fast'
                ? '35ms (Fast)'
                : options.fetchSpeed === 'safe'
                ? '350ms (Paced)'
                : '120ms (Standard)'}
            </span>
          </div>

          {/* Speed Preset Buttons */}
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { id: 'turbo' as FetchSpeed, label: 'Turbo', icon: '⚡', delay: 0 },
              { id: 'fast' as FetchSpeed, label: 'Fast', icon: '🚀', delay: 35 },
              { id: 'balanced' as FetchSpeed, label: 'Normal', icon: '⚖️', delay: 120 },
              { id: 'safe' as FetchSpeed, label: 'Paced', icon: '🛡️', delay: 350 },
            ].map((sp) => {
              const isActive =
                options.fetchSpeed === sp.id ||
                (options.fetchDelayMs !== undefined && options.fetchDelayMs === sp.delay);
              return (
                <button
                  key={sp.id}
                  type="button"
                  onClick={() => onChangeOptions({ fetchSpeed: sp.id, fetchDelayMs: sp.delay })}
                  className={`py-1.5 px-1 rounded-md text-[11px] font-semibold flex flex-col items-center gap-0.5 border transition-all ${
                    isActive
                      ? 'bg-[#238636] text-white border-[#2ea44f] shadow-sm'
                      : 'bg-[#161b22] text-[#8b949e] border-[#30363d] hover:bg-[#21262d] hover:text-[#c9d1d9]'
                  }`}
                  title={`${sp.label} Speed: ${sp.delay}ms crawl delay`}
                >
                  <span className="text-xs">{sp.icon}</span>
                  <span className="text-[10px] leading-tight">{sp.label}</span>
                </button>
              );
            })}
          </div>

          {/* Precision delay slider for granular control */}
          <div className="flex items-center gap-2 pt-0.5">
            <input
              type="range"
              min="0"
              max="500"
              step="10"
              value={options.fetchDelayMs ?? (options.fetchSpeed === 'turbo' ? 0 : options.fetchSpeed === 'fast' ? 35 : options.fetchSpeed === 'safe' ? 350 : 120)}
              onChange={(e) => {
                const ms = parseInt(e.target.value, 10);
                let speed: FetchSpeed = 'balanced';
                if (ms === 0) speed = 'turbo';
                else if (ms <= 50) speed = 'fast';
                else if (ms >= 300) speed = 'safe';
                onChangeOptions({ fetchDelayMs: ms, fetchSpeed: speed });
              }}
              className="flex-1 h-1.5 bg-[#21262d] rounded-lg appearance-none cursor-pointer accent-[#238636]"
            />
            <span className="font-mono text-[10px] text-[#8b949e] w-12 text-right">
              {options.fetchDelayMs ?? (options.fetchSpeed === 'turbo' ? 0 : options.fetchSpeed === 'fast' ? 35 : options.fetchSpeed === 'safe' ? 350 : 120)}ms
            </span>
          </div>
        </div>

        {/* Physics Checkbox */}
        <div className="pt-2">
          <label className="flex items-center gap-2.5 p-2 rounded-lg bg-[#161b22] border border-[#30363d] cursor-pointer hover:border-[#58a6ff]/50 transition-colors">
            <input
              type="checkbox"
              checked={options.enablePhysics}
              onChange={(e) => onChangeOptions({ enablePhysics: e.target.checked })}
              className="w-4 h-4 rounded border-[#30363d] bg-[#0d1117] accent-[#238636] cursor-pointer"
            />
            <div className="flex-1">
              <p className="text-xs font-semibold text-[#c9d1d9]">Enable Live Physics</p>
              <p className="text-[10px] text-[#8b949e]">Real-time force-atlas node repulsion</p>
            </div>
          </label>
        </div>

        {/* Action Button: Generate / Stop */}
        <div className="pt-1">
          {isCrawling ? (
            <div className="space-y-2">
              <button
                onClick={onStopCrawl}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#da3633] hover:bg-[#f85149] text-white font-bold rounded-lg shadow-xl shadow-[#da3633]/25 border border-[#f85149]/40 transition-all active:scale-[0.98] cursor-pointer"
              >
                <Square className="w-4 h-4 fill-white animate-pulse" />
                <span>Stop / Halt Scraping</span>
              </button>
              {activeScrapingUser && (
                <div className="flex items-center justify-between px-3 py-1.5 rounded-md bg-[#161b22] border border-[#da3633]/30 text-[11px]">
                  <span className="text-[#8b949e]">Current target:</span>
                  <span className="font-mono font-semibold text-[#f85149]">@{activeScrapingUser}</span>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={() => onStartCrawl()}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#238636] hover:bg-[#2ea44f] text-white font-bold rounded-lg shadow-lg shadow-[#238636]/20 transition-all active:scale-[0.98] cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Generate Interactive Graph
            </button>
          )}
        </div>

        {/* Crawler Log Terminal */}
        <div className="pt-2 flex flex-col h-56">
          <div className="flex items-center justify-between pb-1.5">
            <span className="font-semibold text-[#c9d1d9] flex items-center gap-1.5 text-xs">
              <Terminal className="w-3.5 h-3.5 text-[#58a6ff]" />
              Crawler Log:
            </span>
            {logs.length > 0 && (
              <button
                onClick={onClearLogs}
                className="text-[10px] text-[#8b949e] hover:text-[#f85149] flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" /> Clear
              </button>
            )}
          </div>

          <div className="flex-1 bg-[#010409] border border-[#30363d] rounded-lg p-2.5 overflow-y-auto font-mono text-[11px] leading-relaxed space-y-1">
            {logs.length === 0 ? (
              <p className="text-[#8b949e] italic">Ready. Click "Generate Interactive Graph" to start.</p>
            ) : (
              logs.map((log) => (
                <div
                  key={log.id}
                  className={`break-words ${
                    log.type === 'error'
                      ? 'text-[#f85149]'
                      : log.type === 'warn'
                      ? 'text-[#e3b341]'
                      : log.type === 'success'
                      ? 'text-[#3fb950]'
                      : 'text-[#8b949e]'
                  }`}
                >
                  <span className="text-[#484f58] mr-1.5">[{log.timestamp}]</span>
                  {log.message}
                </div>
              ))
            )}
            <div ref={logEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};
