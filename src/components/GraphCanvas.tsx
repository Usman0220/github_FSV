import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Network, Options } from 'vis-network';
import { DataSet } from 'vis-data';
import { 
  ZoomIn, 
  ZoomOut, 
  Maximize2, 
  Play, 
  Pause, 
  Search, 
  Compass, 
  Download, 
  Sparkles,
  X,
  Hand,
  Move,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  RotateCcw,
  Crosshair,
  Square
} from 'lucide-react';
import { NetworkNodeData, NetworkEdgeData, GitHubUser } from '../types';

interface GraphCanvasProps {
  nodes: NetworkNodeData[];
  edges: NetworkEdgeData[];
  enablePhysics: boolean;
  onTogglePhysics: (enabled: boolean) => void;
  onSelectUser: (user: Partial<GitHubUser>, inGraphFollowers: string[], inGraphFollowing: string[]) => void;
  onExpandUser?: (username: string) => void;
  isCrawling?: boolean;
  onStopCrawl?: () => void;
  activeScrapingUser?: string | null;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  enablePhysics,
  onTogglePhysics,
  onSelectUser,
  isCrawling = false,
  onStopCrawl,
  activeScrapingUser,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const networkRef = useRef<Network | null>(null);
  const nodesDataSetRef = useRef<DataSet<any> | null>(null);
  const edgesDataSetRef = useRef<DataSet<any> | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<NetworkNodeData[]>([]);
  const [layoutMode, setLayoutMode] = useState<'forceAtlas2' | 'repulsion' | 'hierarchical'>('forceAtlas2');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [interactionMode, setInteractionMode] = useState<'pan' | 'nodes'>('pan');
  const [showNavHelp, setShowNavHelp] = useState(true);

  // Pan camera helper
  const panCamera = useCallback((deltaX: number, deltaY: number) => {
    if (!networkRef.current) return;
    const currentPos = networkRef.current.getViewPosition();
    networkRef.current.moveTo({
      position: {
        x: currentPos.x + deltaX,
        y: currentPos.y + deltaY,
      },
      animation: {
        duration: 250,
        easingFunction: 'easeInOutQuad',
      },
    });
  }, []);

  // Zoom controls
  const handleZoomIn = useCallback(() => {
    if (!networkRef.current) return;
    const currentScale = networkRef.current.getScale();
    networkRef.current.moveTo({
      scale: currentScale * 1.3,
      animation: { duration: 250, easingFunction: 'easeInOutQuad' },
    });
  }, []);

  const handleZoomOut = useCallback(() => {
    if (!networkRef.current) return;
    const currentScale = networkRef.current.getScale();
    networkRef.current.moveTo({
      scale: currentScale / 1.3,
      animation: { duration: 250, easingFunction: 'easeInOutQuad' },
    });
  }, []);

  const handleFit = useCallback(() => {
    if (!networkRef.current) return;
    networkRef.current.fit({
      animation: { duration: 500, easingFunction: 'easeInOutQuad' },
    });
  }, []);

  // Keyboard navigation for panning and zooming
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      if (activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(activeElement.tagName)) {
        return;
      }

      const panStep = 120;
      switch (e.key) {
        case 'ArrowUp':
        case 'w':
        case 'W':
          e.preventDefault();
          panCamera(0, -panStep);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          e.preventDefault();
          panCamera(0, panStep);
          break;
        case 'ArrowLeft':
        case 'a':
        case 'A':
          e.preventDefault();
          panCamera(-panStep, 0);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          e.preventDefault();
          panCamera(panStep, 0);
          break;
        case '+':
        case '=':
          e.preventDefault();
          handleZoomIn();
          break;
        case '-':
        case '_':
          e.preventDefault();
          handleZoomOut();
          break;
        case 'r':
        case 'R':
        case ' ':
          e.preventDefault();
          handleFit();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [panCamera, handleZoomIn, handleZoomOut, handleFit]);

  // Initialize Vis Network
  useEffect(() => {
    if (!containerRef.current) return;

    const nodesDataSet = new DataSet<any>([]);
    const edgesDataSet = new DataSet<any>([]);
    nodesDataSetRef.current = nodesDataSet;
    edgesDataSetRef.current = edgesDataSet;

    const options: Options = {
      nodes: {
        borderWidth: 2,
        borderWidthSelected: 4,
        color: {
          border: '#30363d',
          background: '#161b22',
          highlight: {
            border: '#58a6ff',
            background: '#1f6feb',
          },
          hover: {
            border: '#58a6ff',
            background: '#238636',
          },
        },
        font: {
          color: '#c9d1d9',
          size: 13,
          face: 'Plus Jakarta Sans, -apple-system, BlinkMacSystemFont, sans-serif',
          strokeWidth: 3,
          strokeColor: '#0d1117',
        },
      },
      edges: {
        width: 1.5,
        color: {
          color: 'rgba(56, 139, 253, 0.25)',
          highlight: '#58a6ff',
          hover: '#79c0ff',
          opacity: 0.6,
        },
        arrows: {
          to: {
            enabled: true,
            scaleFactor: 0.6,
          },
        },
        smooth: {
          enabled: true,
          type: 'continuous',
          roundness: 0.4,
        },
      },
      physics: {
        enabled: enablePhysics,
        solver: 'forceAtlas2Based',
        forceAtlas2Based: {
          gravitationalConstant: -45,
          centralGravity: 0.008,
          springLength: 95,
          springConstant: 0.06,
          damping: 0.45,
          avoidOverlap: 0.75,
        },
        stabilization: {
          enabled: true,
          iterations: 120,
          updateInterval: 25,
        },
      },
      interaction: {
        dragNodes: false, // Starts in Pan Canvas mode for effortless movement!
        dragView: true,
        zoomView: true,
        hover: true,
        tooltipDelay: 150,
        hideEdgesOnDrag: false,
        navigationButtons: false,
        keyboard: false, // Handled customly above
        multiselect: false,
        selectable: true,
      },
    };

    const network = new Network(
      containerRef.current,
      { nodes: nodesDataSet, edges: edgesDataSet },
      options
    );

    networkRef.current = network;

    // Node click handler
    network.on('click', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        const selectedId = params.nodes[0];
        const rawNode = nodesDataSet.get(selectedId) as any;
        const nodeItem = Array.isArray(rawNode) ? rawNode[0] : rawNode;
        if (nodeItem && nodeItem.userDetails) {
          const currentEdges = (edgesDataSet.get() || []) as any[];
          const inGraphFollowers: string[] = [];
          const inGraphFollowing: string[] = [];

          currentEdges.forEach((edge: any) => {
            if (edge.to === selectedId) {
              inGraphFollowers.push(edge.from);
            }
            if (edge.from === selectedId) {
              inGraphFollowing.push(edge.to);
            }
          });

          onSelectUser(nodeItem.userDetails, inGraphFollowers, inGraphFollowing);
        }
      }
    });

    // Double click to focus
    network.on('doubleClick', (params) => {
      if (params.nodes && params.nodes.length > 0) {
        network.focus(params.nodes[0], {
          scale: 1.4,
          animation: {
            duration: 700,
            easingFunction: 'easeInOutQuad',
          },
        });
      }
    });

    return () => {
      network.destroy();
      networkRef.current = null;
    };
  }, []);

  // Update interaction mode (Pan Canvas vs Drag Nodes)
  useEffect(() => {
    if (!networkRef.current) return;
    networkRef.current.setOptions({
      interaction: {
        dragNodes: interactionMode === 'nodes',
        dragView: true,
        zoomView: true,
      },
    });
  }, [interactionMode]);

  // Synchronize nodes incrementally (NO clear() which breaks drag and resets camera!)
  useEffect(() => {
    if (!nodesDataSetRef.current) return;
    const currentData = nodesDataSetRef.current;
    
    // Format nodes for Vis.js
    const visNodes = nodes.map((n) => ({
      id: n.id,
      label: n.label,
      shape: n.image ? 'circularImage' : 'dot',
      image: n.image,
      brokenImage: 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png',
      size: n.size || 24,
      borderWidth: n.borderWidth || 2,
      color: n.color || {
        border: '#30363d',
        background: '#161b22',
        highlight: {
          border: '#58a6ff',
          background: '#1f6feb',
        },
      },
      font: n.font || {
        color: '#c9d1d9',
        size: 12,
        face: 'Plus Jakarta Sans',
        strokeWidth: 3,
        strokeColor: '#0d1117',
      },
      title: `<b>@${n.id}</b><br/>${n.userDetails?.name || ''}<br/>Followers: ${n.userDetails?.followers ?? '—'}`,
      userDetails: n.userDetails,
    }));

    if (visNodes.length === 0) {
      currentData.clear();
      return;
    }

    const newIds = new Set(visNodes.map((n) => n.id));
    const currentIds = currentData.getIds() as string[];
    const toRemove = currentIds.filter((id) => !newIds.has(id));
    
    if (toRemove.length > 0) {
      currentData.remove(toRemove);
    }
    currentData.update(visNodes);

    // Initial fit if we just populated nodes for the very first time
    if (networkRef.current && nodes.length > 0 && currentIds.length === 0) {
      setTimeout(() => {
        networkRef.current?.fit({ animation: { duration: 600, easingFunction: 'easeInOutQuad' } });
      }, 200);
    }
  }, [nodes]);

  // Synchronize edges incrementally
  useEffect(() => {
    if (!edgesDataSetRef.current) return;
    const currentEdges = edgesDataSetRef.current;

    const visEdges = edges.map((e, index) => ({
      id: e.id || `edge-${e.from}-${e.to}`,
      from: e.from,
      to: e.to,
      color: e.color || {
        color: 'rgba(56, 139, 253, 0.35)',
        highlight: '#58a6ff',
        hover: '#79c0ff',
      },
      arrows: {
        to: {
          enabled: true,
          scaleFactor: 0.5,
        },
      },
      width: 1.5,
    }));

    if (visEdges.length === 0) {
      currentEdges.clear();
      return;
    }

    const newEdgeIds = new Set(visEdges.map((e) => e.id));
    const currentEdgeIds = currentEdges.getIds() as string[];
    const toRemoveEdges = currentEdgeIds.filter((id) => !newEdgeIds.has(id));

    if (toRemoveEdges.length > 0) {
      currentEdges.remove(toRemoveEdges);
    }
    currentEdges.update(visEdges);
  }, [edges]);

  // Update physics setting
  useEffect(() => {
    if (!networkRef.current) return;
    networkRef.current.setOptions({
      physics: {
        enabled: enablePhysics,
      },
    });
  }, [enablePhysics]);

  // Update layout solver
  const handleLayoutChange = (mode: 'forceAtlas2' | 'repulsion' | 'hierarchical') => {
    setLayoutMode(mode);
    if (!networkRef.current) return;

    if (mode === 'hierarchical') {
      networkRef.current.setOptions({
        layout: {
          hierarchical: {
            enabled: true,
            direction: 'UD',
            sortMethod: 'directed',
            nodeSpacing: 160,
            levelSeparation: 150,
          },
        },
        physics: {
          hierarchicalRepulsion: {
            nodeDistance: 160,
          },
        },
      });
    } else if (mode === 'repulsion') {
      networkRef.current.setOptions({
        layout: { hierarchical: { enabled: false } },
        physics: {
          solver: 'repulsion',
          repulsion: {
            nodeDistance: 180,
            centralGravity: 0.1,
            springLength: 120,
            springStrength: 0.05,
          },
        },
      });
    } else {
      networkRef.current.setOptions({
        layout: { hierarchical: { enabled: false } },
        physics: {
          solver: 'forceAtlas2Based',
          forceAtlas2Based: {
            gravitationalConstant: -45,
            centralGravity: 0.008,
            springLength: 95,
            springConstant: 0.06,
            damping: 0.45,
            avoidOverlap: 0.75,
          },
        },
      });
    }
  };

  // Search node
  const handleSearchChange = (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    const lower = q.toLowerCase();
    const matched = nodes.filter(
      (n) => n.id.toLowerCase().includes(lower) || n.userDetails?.name?.toLowerCase().includes(lower)
    );
    setSearchResults(matched.slice(0, 6));
  };

  const handleSelectSearchResult = (node: NetworkNodeData) => {
    setSearchQuery(node.id);
    setSearchResults([]);
    if (!networkRef.current) return;
    networkRef.current.selectNodes([node.id]);
    networkRef.current.focus(node.id, {
      scale: 1.5,
      animation: { duration: 700, easingFunction: 'easeInOutQuad' },
    });

    if (node.userDetails) {
      onSelectUser(node.userDetails, [], []);
    }
  };

  // Export Canvas Image
  const handleExportPNG = () => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector('canvas');
    if (!canvas) return;

    const dataUrl = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = dataUrl;
    a.download = `github-network-${new Date().toISOString().slice(0, 10)}.png`;
    a.click();
  };

  return (
    <div
      className={`relative w-full h-full flex flex-col bg-[#0d1117] overflow-hidden select-none ${
        isFullscreen ? 'fixed inset-0 z-50' : ''
      }`}
    >
      {/* Floating Active Scraping Indicator & Immediate Halt Button */}
      {isCrawling && onStopCrawl && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-30 flex items-center gap-3 px-4 py-2 rounded-full bg-[#161b22]/95 backdrop-blur-md border border-[#da3633]/60 shadow-2xl pointer-events-auto animate-in fade-in slide-in-from-top-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#f85149] opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#da3633]" />
          </span>
          <span className="text-xs text-[#c9d1d9] whitespace-nowrap">
            Scraping followers for{' '}
            <strong className="text-[#58a6ff] font-mono">
              {activeScrapingUser ? `@${activeScrapingUser}` : 'target'}
            </strong>{' '}
            <span className="text-[#8b949e]">({nodes.length} nodes, {edges.length} edges)</span>
          </span>
          <button
            onClick={onStopCrawl}
            className="flex items-center gap-1.5 px-3 py-1 bg-[#da3633] hover:bg-[#f85149] active:scale-95 text-white font-bold text-xs rounded-full shadow-lg transition-all cursor-pointer"
            title="Immediately halt graph scraping"
          >
            <Square className="w-3 h-3 fill-white" />
            <span>Stop Scraping</span>
          </button>
        </div>
      )}

      {/* Top Floating Graph Toolbar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex flex-wrap items-center justify-between gap-3 pointer-events-none">
        {/* Left: Search Bar */}
        <div className="relative pointer-events-auto w-72 max-w-full">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] shadow-lg text-sm">
            <Search className="w-4 h-4 text-[#8b949e] shrink-0" />
            <input
              type="text"
              placeholder="Find user in matrix..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="w-full bg-transparent border-none outline-none text-[#c9d1d9] placeholder-[#8b949e] text-xs font-mono select-text"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSearchResults([]);
                }}
                className="text-[#8b949e] hover:text-[#c9d1d9]"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Search suggestions dropdown */}
          {searchResults.length > 0 && (
            <div className="absolute left-0 right-0 mt-1 py-1 bg-[#161b22] border border-[#30363d] rounded-lg shadow-2xl z-30 max-h-56 overflow-y-auto select-text">
              {searchResults.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleSelectSearchResult(item)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-[#21262d] transition-colors text-xs"
                >
                  <img
                    src={item.image || 'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'}
                    alt={item.id}
                    className="w-6 h-6 rounded-full border border-[#30363d] object-cover"
                  />
                  <div className="truncate">
                    <p className="font-semibold text-[#58a6ff] truncate">@{item.id}</p>
                    {item.userDetails?.name && (
                      <p className="text-[10px] text-[#8b949e] truncate">{item.userDetails.name}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Right: View, Navigation Modes & Toolbar */}
        <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[#161b22]/95 backdrop-blur-md border border-[#30363d] shadow-lg pointer-events-auto">
          {/* MOUSE MODE TOGGLE: Pan Canvas vs Move Nodes */}
          <div className="flex items-center gap-1 border-r border-[#30363d] pr-1.5 mr-1">
            <button
              onClick={() => setInteractionMode('pan')}
              title="Pan Mode: Click and drag anywhere to move camera smoothly"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-semibold transition-all ${
                interactionMode === 'pan'
                  ? 'bg-[#1f6feb] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              <Hand className="w-3.5 h-3.5" />
              <span>Pan View</span>
            </button>
            <button
              onClick={() => setInteractionMode('nodes')}
              title="Node Drag Mode: Click and drag nodes to reposition them"
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                interactionMode === 'nodes'
                  ? 'bg-[#238636] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              <Move className="w-3.5 h-3.5" />
              <span>Drag Nodes</span>
            </button>
          </div>

          {/* Layout solver selection */}
          <div className="hidden lg:flex items-center gap-1 border-r border-[#30363d] pr-1.5 mr-1">
            <button
              onClick={() => handleLayoutChange('forceAtlas2')}
              title="ForceAtlas2 Physics"
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                layoutMode === 'forceAtlas2'
                  ? 'bg-[#238636] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              ForceAtlas2
            </button>
            <button
              onClick={() => handleLayoutChange('repulsion')}
              title="Repulsion Layout"
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                layoutMode === 'repulsion'
                  ? 'bg-[#238636] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Repulsion
            </button>
            <button
              onClick={() => handleLayoutChange('hierarchical')}
              title="Tree / Hierarchical"
              className={`px-2 py-1 text-xs rounded-md font-medium transition-all ${
                layoutMode === 'hierarchical'
                  ? 'bg-[#238636] text-white shadow-sm'
                  : 'text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d]'
              }`}
            >
              Tree
            </button>
          </div>

          {/* Physics Toggle */}
          <button
            onClick={() => onTogglePhysics(!enablePhysics)}
            title={enablePhysics ? 'Pause Live Physics' : 'Resume Live Physics'}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
              enablePhysics
                ? 'text-[#3fb950] bg-[#238636]/15 hover:bg-[#238636]/25'
                : 'text-[#8b949e] bg-[#21262d] hover:text-[#c9d1d9]'
            }`}
          >
            {enablePhysics ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            <span className="hidden sm:inline">{enablePhysics ? 'Physics ON' : 'Physics OFF'}</span>
          </button>

          {/* Zoom & Fit controls */}
          <div className="flex items-center gap-0.5 border-l border-[#30363d] pl-1.5">
            <button
              onClick={handleZoomIn}
              title="Zoom In (+)"
              className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-md transition-colors"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              onClick={handleZoomOut}
              title="Zoom Out (-)"
              className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-md transition-colors"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              onClick={handleFit}
              title="Recenter & Fit View (R or Space)"
              className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] rounded-md transition-colors font-medium"
            >
              <Compass className="w-4 h-4" />
            </button>
            <button
              onClick={handleExportPNG}
              title="Export Canvas as PNG"
              className="p-1.5 text-[#8b949e] hover:text-[#58a6ff] hover:bg-[#21262d] rounded-md transition-colors"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen'}
              className="p-1.5 text-[#8b949e] hover:text-[#c9d1d9] hover:bg-[#21262d] rounded-md transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Network Canvas Container */}
      <div
        ref={containerRef}
        style={{ touchAction: 'none' }}
        className={`w-full h-full ${
          interactionMode === 'pan' ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'
        } bg-[#0d1117]`}
      />

      {/* FLOATING 4-WAY D-PAD / PAN CONTROLS (Bottom-Right) */}
      <div className="absolute bottom-5 right-5 z-20 flex flex-col items-center pointer-events-auto bg-[#161b22]/95 backdrop-blur-md p-2 rounded-2xl border border-[#30363d] shadow-2xl">
        <div className="text-[9px] font-mono uppercase text-[#8b949e] mb-1 font-semibold tracking-wider">
          Move Graph
        </div>
        
        {/* Directional Pad Grid */}
        <div className="grid grid-cols-3 gap-1 w-28 h-28 place-items-center">
          {/* Top Row: empty, UP, empty */}
          <div />
          <button
            onClick={() => panCamera(0, -140)}
            title="Pan Up (↑ or W)"
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] active:bg-[#1f6feb] text-[#c9d1d9] hover:text-white flex items-center justify-center transition-colors border border-[#30363d]"
          >
            <ChevronUp className="w-5 h-5" />
          </button>
          <div />

          {/* Middle Row: LEFT, CENTER/FIT, RIGHT */}
          <button
            onClick={() => panCamera(-140, 0)}
            title="Pan Left (← or A)"
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] active:bg-[#1f6feb] text-[#c9d1d9] hover:text-white flex items-center justify-center transition-colors border border-[#30363d]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={handleFit}
            title="Recenter & Fit (R or Space)"
            className="w-8 h-8 rounded-lg bg-[#1f6feb]/20 hover:bg-[#1f6feb] text-[#58a6ff] hover:text-white flex items-center justify-center transition-colors border border-[#1f6feb]/40"
          >
            <Crosshair className="w-4 h-4" />
          </button>
          <button
            onClick={() => panCamera(140, 0)}
            title="Pan Right (→ or D)"
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] active:bg-[#1f6feb] text-[#c9d1d9] hover:text-white flex items-center justify-center transition-colors border border-[#30363d]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          {/* Bottom Row: ZOOM OUT, DOWN, ZOOM IN */}
          <button
            onClick={handleZoomOut}
            title="Zoom Out (-)"
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] flex items-center justify-center transition-colors border border-[#30363d]"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => panCamera(0, 140)}
            title="Pan Down (↓ or S)"
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] active:bg-[#1f6feb] text-[#c9d1d9] hover:text-white flex items-center justify-center transition-colors border border-[#30363d]"
          >
            <ChevronDown className="w-5 h-5" />
          </button>
          <button
            onClick={handleZoomIn}
            title="Zoom In (+)"
            className="w-8 h-8 rounded-lg bg-[#21262d] hover:bg-[#30363d] text-[#8b949e] hover:text-[#c9d1d9] flex items-center justify-center transition-colors border border-[#30363d]"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Empty State Overlay */}
      {nodes.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center pointer-events-none">
          <div className="w-16 h-16 mb-4 rounded-2xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-[#58a6ff] shadow-2xl">
            <Sparkles className="w-8 h-8 animate-pulse" />
          </div>
          <h3 className="text-xl font-bold text-[#f0f6fc] tracking-tight">GitHub Network Matrix</h3>
          <p className="text-sm text-[#8b949e] max-w-md mt-2 leading-relaxed">
            Enter a GitHub profile username or URL in the sidebar and click{' '}
            <span className="text-[#3fb950] font-semibold">Generate Interactive Graph</span> to crawl followers and visualize the network matrix.
          </p>
        </div>
      )}

      {/* Helpful Movement Banner (Bottom Left) */}
      {showNavHelp && (
        <div className="absolute bottom-5 left-5 z-20 flex items-center gap-3 text-xs text-[#c9d1d9] bg-[#161b22]/95 backdrop-blur-md px-3.5 py-2.5 rounded-xl border border-[#30363d] shadow-xl max-w-lg">
          <div className="w-6 h-6 rounded-lg bg-[#1f6feb]/20 flex items-center justify-center text-[#58a6ff] shrink-0 font-bold">
            <Hand className="w-3.5 h-3.5" />
          </div>
          <div className="flex-1 text-[11px] leading-snug">
            <strong className="text-[#58a6ff]">Moving the Graph:</strong> Click and drag anywhere with your mouse • Scroll to zoom • Use the arrow keys (or W/A/S/D) • Or click the D-Pad buttons on the right.
          </div>
          <button
            onClick={() => setShowNavHelp(false)}
            title="Dismiss tip"
            className="text-[#8b949e] hover:text-[#c9d1d9] p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
