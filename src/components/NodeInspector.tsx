import React from 'react';
import { 
  X, 
  ExternalLink, 
  MapPin, 
  Building2, 
  Link as LinkIcon, 
  BookOpen, 
  Users, 
  UserPlus, 
  Compass, 
  Share2,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { GitHubUser } from '../types';

interface NodeInspectorProps {
  user: Partial<GitHubUser> | null;
  inGraphFollowers: string[];
  inGraphFollowing: string[];
  onClose: () => void;
  onExpandUser: (username: string) => void;
  onSetRootUser: (username: string) => void;
  onFocusNode: (username: string) => void;
  isExpanding?: boolean;
  isSettingRoot?: boolean;
  expansionBatch?: number;
  batchLimit?: number;
}

export const NodeInspector: React.FC<NodeInspectorProps> = ({
  user,
  inGraphFollowers,
  inGraphFollowing,
  onClose,
  onExpandUser,
  onSetRootUser,
  onFocusNode,
  isExpanding = false,
  isSettingRoot = false,
  expansionBatch = 1,
  batchLimit = 10,
}) => {
  if (!user) return null;

  return (
    <div className="absolute right-4 top-16 bottom-4 w-84 max-w-full bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] rounded-2xl shadow-2xl flex flex-col z-30 overflow-hidden text-xs animate-in fade-in slide-in-from-right-4 duration-200">
      {/* Top Header */}
      <div className="flex items-center justify-between p-3.5 border-b border-[#30363d] bg-[#1c2128]">
        <div className="flex items-center gap-2 min-w-0">
          <span className="font-semibold text-[#8b949e] uppercase tracking-wider text-[10px]">
            Node Inspector
          </span>
          {user.login && (
            <span className="px-1.5 py-0.5 rounded bg-[#21262d] text-[#58a6ff] text-[10px] font-mono truncate max-w-[130px]">
              @{user.login}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#30363d] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* User Profile Card */}
      <div className="p-4 overflow-y-auto space-y-4 flex-1">
        <div className="flex items-start gap-3">
          <img
            src={user.avatar_url || `https://avatars.githubusercontent.com/u/${user.id || 0}?v=4`}
            alt={user.login || 'User'}
            className="w-14 h-14 rounded-full border-2 border-[#58a6ff] object-cover shrink-0 shadow-md"
          />
          <div className="min-w-0 flex-1">
            <h2 className="text-base font-bold text-[#f0f6fc] truncate leading-snug">
              {user.name || user.login}
            </h2>
            <p className="text-xs text-[#58a6ff] font-mono truncate">@{user.login}</p>
            <a
              href={user.html_url || `https://github.com/${user.login}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 mt-1 text-[11px] text-[#8b949e] hover:text-[#58a6ff] transition-colors"
            >
              <span>View on GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-[#c9d1d9] leading-relaxed bg-[#0d1117] p-2.5 rounded-lg border border-[#30363d]/60">
            {user.bio}
          </p>
        )}

        {/* Meta Info: Company, Location, Blog */}
        <div className="space-y-1.5 text-[11px] text-[#8b949e]">
          {user.company && (
            <div className="flex items-center gap-2 truncate">
              <Building2 className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
              <span className="truncate">{user.company}</span>
            </div>
          )}
          {user.location && (
            <div className="flex items-center gap-2 truncate">
              <MapPin className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
              <span className="truncate">{user.location}</span>
            </div>
          )}
          {user.blog && (
            <div className="flex items-center gap-2 truncate">
              <LinkIcon className="w-3.5 h-3.5 text-[#8b949e] shrink-0" />
              <a
                href={user.blog.startsWith('http') ? user.blog : `https://${user.blog}`}
                target="_blank"
                rel="noreferrer"
                className="text-[#58a6ff] hover:underline truncate"
              >
                {user.blog}
              </a>
            </div>
          )}
        </div>

        {/* GitHub Stats */}
        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
            <p className="text-sm font-bold text-[#f0f6fc] font-mono">{user.public_repos ?? '—'}</p>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Repos</p>
          </div>
          <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
            <p className="text-sm font-bold text-[#f0f6fc] font-mono">{user.followers ?? '—'}</p>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Followers</p>
          </div>
          <div className="bg-[#0d1117] p-2 rounded-lg border border-[#30363d]">
            <p className="text-sm font-bold text-[#f0f6fc] font-mono">{user.following ?? '—'}</p>
            <p className="text-[10px] text-[#8b949e] mt-0.5">Following</p>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-1">
          <button
            onClick={() => user.login && onExpandUser(user.login)}
            disabled={isExpanding}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 text-white font-semibold rounded-lg shadow-sm transition-all ${
              isExpanding
                ? 'bg-[#238636]/60 cursor-wait opacity-90'
                : 'bg-[#238636] hover:bg-[#2ea44f] active:scale-[0.98]'
            }`}
          >
            {isExpanding ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Fetching Batch #{expansionBatch}...</span>
              </>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>
                  {expansionBatch > 1
                    ? `Expand Next (+${batchLimit} new followers)`
                    : `Expand Followers (+${batchLimit} new)`}
                </span>
              </>
            )}
          </button>
          <button
            onClick={() => user.login && onSetRootUser(user.login)}
            disabled={isExpanding || isSettingRoot}
            className={`w-full flex items-center justify-center gap-2 py-2 px-3 font-medium rounded-lg border transition-all ${
              isSettingRoot
                ? 'bg-[#1f6feb]/20 text-[#58a6ff] border-[#1f6feb]/50 cursor-wait'
                : 'bg-[#21262d] hover:bg-[#30363d] text-[#c9d1d9] border-[#30363d] active:scale-[0.98]'
            } disabled:opacity-50`}
          >
            {isSettingRoot ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#58a6ff]" />
                <span>Setting @{user.login} as Root...</span>
              </>
            ) : (
              <>
                <Compass className="w-3.5 h-3.5 text-[#58a6ff]" />
                <span>Set @{user.login} as Root & Re-crawl</span>
              </>
            )}
          </button>
        </div>

        {/* Active In-Graph Connections */}
        <div className="space-y-3 pt-2 border-t border-[#30363d]">
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-[#c9d1d9] flex items-center gap-1">
                <Users className="w-3 h-3 text-[#58a6ff]" /> In-Graph Followers
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {inGraphFollowers.length}
              </span>
            </div>
            {inGraphFollowers.length === 0 ? (
              <p className="text-[11px] text-[#8b949e] italic">No followers currently in graph</p>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {inGraphFollowers.map((follower) => (
                  <button
                    key={follower}
                    onClick={() => onFocusNode(follower)}
                    className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[11px] font-mono text-[#58a6ff] hover:bg-[#1f6feb]/20 hover:border-[#58a6ff] transition-colors"
                  >
                    @{follower}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-semibold text-[#c9d1d9] flex items-center gap-1">
                <ArrowRight className="w-3 h-3 text-[#3fb950]" /> In-Graph Following
              </span>
              <span className="text-[10px] font-mono text-[#8b949e]">
                {inGraphFollowing.length}
              </span>
            </div>
            {inGraphFollowing.length === 0 ? (
              <p className="text-[11px] text-[#8b949e] italic">Not following any user in graph</p>
            ) : (
              <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto pr-1">
                {inGraphFollowing.map((following) => (
                  <button
                    key={following}
                    onClick={() => onFocusNode(following)}
                    className="px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[11px] font-mono text-[#3fb950] hover:bg-[#238636]/20 hover:border-[#3fb950] transition-colors"
                  >
                    @{following}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
