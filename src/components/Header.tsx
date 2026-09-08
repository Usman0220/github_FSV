import React, { useState } from 'react';
import { 
  Share2, 
  Download, 
  Upload, 
  HelpCircle, 
  Sparkles, 
  RotateCcw,
  Check,
  Github,
  SlidersHorizontal,
  Square
} from 'lucide-react';
import { NetworkNodeData, NetworkEdgeData } from '../types';

interface HeaderProps {
  nodes: NetworkNodeData[];
  edges: NetworkEdgeData[];
  onResetGraph: () => void;
  onImportGraph: (data: { nodes: NetworkNodeData[]; edges: NetworkEdgeData[] }) => void;
  showSidebar: boolean;
  onToggleSidebar: () => void;
  isCrawling?: boolean;
  onStopCrawl?: () => void;
  activeScrapingUser?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  nodes,
  edges,
  onResetGraph,
  onImportGraph,
  showSidebar,
  onToggleSidebar,
  isCrawling = false,
  onStopCrawl,
  activeScrapingUser,
}) => {
  const [showHelp, setShowHelp] = useState(false);
  const [copied, setCopied] = useState(false);

  // Export JSON
  const handleExportJSON = () => {
    const data = JSON.stringify({ nodes, edges }, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `github-network-matrix-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.nodes && parsed.edges) {
          onImportGraph(parsed);
        }
      } catch (err) {
        alert('Invalid graph JSON file.');
      }
    };
    reader.readAsText(file);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <header className="h-14 border-b border-[#30363d] bg-[#161b22] px-4 flex items-center justify-between shrink-0 z-30 gap-2">
        {/* Left branding */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleSidebar}
            title={showSidebar ? 'Hide Controls' : 'Show Controls'}
            className="p-1.5 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-[#30363d] transition-colors"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <Github className="w-5 h-5 text-white" />
            <span className="font-bold text-sm text-[#f0f6fc] tracking-tight">GitHub Network Matrix</span>
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#58a6ff]/15 text-[#58a6ff] border border-[#58a6ff]/30">
              Web Edition
            </span>
          </div>
        </div>

        {/* Center: Scraping Status & Halt Scraping Button */}
        {isCrawling && onStopCrawl && (
          <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-[#da3633]/15 border border-[#da3633]/40 shadow-sm animate-in fade-in">
            <span className="relative flex h-2.5 w-2.5 shrink-0">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f85149] opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#da3633]" />
            </span>
            <div className="hidden md:flex items-center gap-1.5 text-xs text-[#f0f6fc]">
              <span className="text-[#8b949e]">Scraping:</span>
              <span className="font-mono font-semibold text-[#f85149] max-w-[130px] truncate">
                {activeScrapingUser ? `@${activeScrapingUser}` : 'Network'}
              </span>
            </div>
            <button
              onClick={onStopCrawl}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#da3633] hover:bg-[#f85149] active:scale-95 text-white font-bold text-xs rounded-md shadow transition-all cursor-pointer"
              title="Immediately halt active scraping"
            >
              <Square className="w-3.5 h-3.5 fill-white" />
              <span>Halt Scraping</span>
            </button>
          </div>
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Reset */}
          <button
            onClick={onResetGraph}
            title="Clear & Reset Graph"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Reset</span>
          </button>

          {/* Import */}
          <label
            title="Import Graph JSON"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent hover:border-[#30363d] cursor-pointer transition-colors"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Import</span>
            <input type="file" accept=".json" onChange={handleFileUpload} className="hidden" />
          </label>

          {/* Export JSON */}
          <button
            onClick={handleExportJSON}
            disabled={nodes.length === 0}
            title="Export Graph as JSON"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition-colors disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Export JSON</span>
          </button>

          {/* Share */}
          <button
            onClick={handleShare}
            title="Copy App URL"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] border border-transparent hover:border-[#30363d] transition-colors"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-[#3fb950]" /> : <Share2 className="w-3.5 h-3.5" />}
            <span className="hidden md:inline">{copied ? 'Copied' : 'Share'}</span>
          </button>

          {/* Help / Guide */}
          <button
            onClick={() => setShowHelp(true)}
            title="About & Guide"
            className="p-1.5 rounded-md text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] transition-colors"
          >
            <HelpCircle className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Guide Dialog */}
      {showHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#161b22] border border-[#30363d] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#30363d]">
              <div className="flex items-center gap-2">
                <Github className="w-5 h-5 text-[#58a6ff]" />
                <h3 className="font-bold text-base text-[#f0f6fc]">About GitHub Network Matrix</h3>
              </div>
              <button
                onClick={() => setShowHelp(false)}
                className="text-[#8b949e] hover:text-[#f0f6fc] text-sm"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs text-[#c9d1d9] leading-relaxed">
              <p>
                <strong>GitHub Network Matrix</strong> visualizes interactive social graphs of GitHub users and their followers.
                It maps connections, developer clusters, and relationship dynamics in real-time.
              </p>

              <div className="bg-[#0d1117] p-3 rounded-lg border border-[#30363d] space-y-2">
                <p className="font-semibold text-[#58a6ff]">Core Features:</p>
                <ul className="list-disc pl-4 space-y-1 text-[#8b949e]">
                  <li>
                    <span className="text-[#c9d1d9]">Real-time Crawling:</span> Explores followers up to specified depths.
                  </li>
                  <li>
                    <span className="text-[#c9d1d9]">ForceAtlas2 Physics:</span> Live force-directed node repulsion and stabilization.
                  </li>
                  <li>
                    <span className="text-[#c9d1d9]">Node Inspector:</span> Click any developer node to view detailed profile statistics, bio, and in-graph connections.
                  </li>
                  <li>
                    <span className="text-[#c9d1d9]">Export & Import:</span> Save your interactive matrix graph as PNG or portable JSON.
                  </li>
                </ul>
              </div>

              <div className="p-2.5 rounded bg-[#1f6feb]/10 border border-[#1f6feb]/30 text-[11px] text-[#79c0ff]">
                💡 Tip: Provide an optional GitHub Personal Access Token (PAT) to increase GitHub API rate limits from 60 to 5,000 requests/hour.
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setShowHelp(false)}
                className="px-4 py-2 bg-[#238636] hover:bg-[#2ea44f] text-white font-semibold rounded-lg text-xs transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
