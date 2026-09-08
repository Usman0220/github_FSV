import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { Sidebar } from './components/Sidebar';
import { GraphCanvas } from './components/GraphCanvas';
import { NodeInspector } from './components/NodeInspector';
import { 
  NetworkNodeData, 
  NetworkEdgeData, 
  CrawlOptions, 
  CrawlLog, 
  RateLimitInfo, 
  GitHubUser 
} from './types';
import { crawlerService, parseGitHubInput } from './services/githubCrawler';

export default function App() {
  const [showSidebar, setShowSidebar] = useState(true);
  const [options, setOptions] = useState<CrawlOptions>(() => ({
    startUser: 'https://github.com/Usman0220',
    token: typeof window !== 'undefined' ? localStorage.getItem('gh_token') || '' : '',
    depth: 2,
    limit: 10,
    enablePhysics: true,
  }));

  const [nodes, setNodes] = useState<NetworkNodeData[]>([]);
  const [edges, setEdges] = useState<NetworkEdgeData[]>([]);
  const [logs, setLogs] = useState<CrawlLog[]>([]);
  const [isCrawling, setIsCrawling] = useState(false);
  const [activeScrapingUser, setActiveScrapingUser] = useState<string | null>(null);
  const [rateLimit, setRateLimit] = useState<RateLimitInfo>({
    remaining: null,
    limit: null,
    resetTime: null,
  });

  // Selected User for Node Inspector
  const [selectedUser, setSelectedUser] = useState<Partial<GitHubUser> | null>(null);
  const [inGraphFollowers, setInGraphFollowers] = useState<string[]>([]);
  const [inGraphFollowing, setInGraphFollowing] = useState<string[]>([]);

  // Update options helper with token storage
  const handleUpdateOptions = (newOpts: Partial<CrawlOptions>) => {
    if (newOpts.token !== undefined && typeof window !== 'undefined') {
      localStorage.setItem('gh_token', newOpts.token);
    }
    setOptions((prev) => ({ ...prev, ...newOpts }));
  };

  // Add Log helper
  const addLog = useCallback((log: CrawlLog) => {
    setLogs((prev) => [...prev, log]);
  }, []);

  // Clear Logs
  const handleClearLogs = () => {
    setLogs([]);
  };

  // Add or update node
  const handleNodeDiscovered = useCallback(
    (user: Partial<GitHubUser>, isRoot: boolean, level: number) => {
      if (!user.login) return;
      const login = user.login;

      setNodes((prevNodes) => {
        const existingIndex = prevNodes.findIndex((n) => n.id.toLowerCase() === login.toLowerCase());
        const size = isRoot ? 38 : level <= 2 ? 26 : 18;
        const borderWidth = isRoot ? 3 : 2;
        const borderColor = isRoot ? '#238636' : '#58a6ff';

        const newNode: NetworkNodeData = {
          id: login,
          label: login,
          shape: 'circularImage',
          image: user.avatar_url || `https://avatars.githubusercontent.com/u/${user.id || 0}?v=4`,
          size,
          borderWidth,
          level,
          color: {
            border: borderColor,
            background: '#161b22',
            highlight: {
              border: isRoot ? '#3fb950' : '#79c0ff',
              background: '#1f6feb',
            },
          },
          userDetails: {
            login: user.login!,
            id: user.id || 0,
            avatar_url: user.avatar_url || `https://avatars.githubusercontent.com/u/${user.id || 0}?v=4`,
            html_url: user.html_url || `https://github.com/${user.login}`,
            name: user.name,
            bio: user.bio,
            company: user.company,
            location: user.location,
            blog: user.blog,
            public_repos: user.public_repos,
            followers: user.followers,
            following: user.following,
          },
        };

        if (existingIndex >= 0) {
          // Merge details
          const updated = [...prevNodes];
          updated[existingIndex] = {
            ...updated[existingIndex],
            ...newNode,
            userDetails: {
              ...updated[existingIndex].userDetails,
              ...newNode.userDetails,
            },
          };
          return updated;
        } else {
          return [...prevNodes, newNode];
        }
      });
    },
    []
  );

  // Add edge
  const handleEdgeDiscovered = useCallback((from: string, to: string) => {
    setEdges((prevEdges) => {
      const exists = prevEdges.some(
        (e) => e.from.toLowerCase() === from.toLowerCase() && e.to.toLowerCase() === to.toLowerCase()
      );
      if (exists) return prevEdges;

      return [
        ...prevEdges,
        {
          id: `edge-${from}-${to}`,
          from,
          to,
          title: `@${from} follows @${to}`,
          color: {
            color: 'rgba(88, 166, 255, 0.45)',
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
        },
      ];
    });
  }, []);

  // Start Crawl
  const handleStartCrawl = useCallback(async () => {
    if (isCrawling) return;

    const parsedTarget = parseGitHubInput(options.startUser);
    if (!parsedTarget) {
      addLog({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: '❌ Please enter a valid GitHub username or URL.',
        type: 'error',
      });
      return;
    }

    // Reset previous graph
    setNodes([]);
    setEdges([]);
    setSelectedUser(null);
    setIsCrawling(true);
    setActiveScrapingUser(parsedTarget);

    try {
      await crawlerService.crawlNetwork(
        {
          startUser: options.startUser,
          token: options.token,
          depth: options.depth,
          limit: options.limit,
        },
        {
          onNode: handleNodeDiscovered,
          onEdge: handleEdgeDiscovered,
          onLog: addLog,
          onRateLimit: setRateLimit,
          onProgress: (currentUser) => {
            setActiveScrapingUser(currentUser);
          },
          onFinish: () => {
            setIsCrawling(false);
            setActiveScrapingUser(null);
          },
        }
      );
    } catch (err) {
      addLog({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: `❌ Crawl Error: ${(err as Error)?.message || 'Unknown error'}`,
        type: 'error',
      });
      setIsCrawling(false);
      setActiveScrapingUser(null);
    }
  }, [options, isCrawling, handleNodeDiscovered, handleEdgeDiscovered, addLog]);

  // Stop Crawl / Halt Scraping
  const handleStopCrawl = useCallback(() => {
    crawlerService.abort();
    setIsCrawling(false);
    setActiveScrapingUser(null);
  }, []);

  // Expand single user followers
  const handleExpandUser = async (username: string) => {
    addLog({
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message: `🌱 Expanding follower network for: @${username}...`,
      type: 'info',
    });

    try {
      const res = await crawlerService.fetchFollowers(username, options.limit, options.token);
      if (res.rateLimit) setRateLimit(res.rateLimit);

      if (res.followers.length === 0) {
        addLog({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          message: `ℹ️ @${username} has 0 followers (or follower list is empty).`,
          type: 'info',
        });
        return;
      }

      for (let i = 0; i < res.followers.length; i++) {
        const followerLogin = res.followers[i];
        const profile = res.followerProfiles[i] || {
          login: followerLogin,
          avatar_url: `https://avatars.githubusercontent.com/u/0?v=4`,
          html_url: `https://github.com/${followerLogin}`,
        };

        handleNodeDiscovered(profile, false, 3);
        handleEdgeDiscovered(followerLogin, username);
      }

      addLog({
        id: Math.random().toString(),
        timestamp: new Date().toLocaleTimeString(),
        message: `✅ Added ${res.followers.length} real followers for @${username}`,
        type: 'success',
      });
    } catch (err) {
      if ((err as Error)?.message === 'RATE_LIMIT') {
        addLog({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          message: `🛑 GitHub API Rate Limit reached while expanding @${username}. Please add a PAT in the sidebar.`,
          type: 'error',
        });
      } else {
        addLog({
          id: Math.random().toString(),
          timestamp: new Date().toLocaleTimeString(),
          message: `⚠️ Could not expand @${username}: ${(err as Error)?.message || 'Failed to fetch'}`,
          type: 'warn',
        });
      }
    }
  };

  // Set Root & Re-crawl
  const handleSetRootUser = (username: string) => {
    handleUpdateOptions({ startUser: username });
    setTimeout(() => {
      handleStartCrawl();
    }, 100);
  };

  // Focus node
  const handleFocusNode = (username: string) => {
    const found = nodes.find((n) => n.id.toLowerCase() === username.toLowerCase());
    if (found && found.userDetails) {
      // Find in-graph connections
      const followers: string[] = [];
      const following: string[] = [];
      edges.forEach((e) => {
        if (e.to.toLowerCase() === username.toLowerCase()) followers.push(e.from);
        if (e.from.toLowerCase() === username.toLowerCase()) following.push(e.to);
      });
      setSelectedUser(found.userDetails);
      setInGraphFollowers(followers);
      setInGraphFollowing(following);
    }
  };

  // Reset graph
  const handleResetGraph = () => {
    crawlerService.abort();
    setIsCrawling(false);
    setNodes([]);
    setEdges([]);
    setSelectedUser(null);
    addLog({
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message: '🧹 Network graph cleared.',
      type: 'info',
    });
  };

  // Import graph data
  const handleImportGraph = (data: { nodes: NetworkNodeData[]; edges: NetworkEdgeData[] }) => {
    crawlerService.abort();
    setIsCrawling(false);
    setNodes(data.nodes);
    setEdges(data.edges);
    setSelectedUser(null);
    addLog({
      id: Math.random().toString(),
      timestamp: new Date().toLocaleTimeString(),
      message: `📥 Imported graph with ${data.nodes.length} nodes and ${data.edges.length} edges.`,
      type: 'success',
    });
  };

  // Initial Auto-Load so user immediately sees a working graph on start!
  useEffect(() => {
    handleStartCrawl();
  }, []);

  return (
    <div className="flex flex-col w-screen h-screen bg-[#0d1117] text-[#c9d1d9] overflow-hidden font-sans">
      {/* Top Header */}
      <Header
        nodes={nodes}
        edges={edges}
        onResetGraph={handleResetGraph}
        onImportGraph={handleImportGraph}
        showSidebar={showSidebar}
        onToggleSidebar={() => setShowSidebar((prev) => !prev)}
        isCrawling={isCrawling}
        onStopCrawl={handleStopCrawl}
        activeScrapingUser={activeScrapingUser}
      />

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Control Sidebar */}
        {showSidebar && (
          <Sidebar
            options={options}
            onChangeOptions={handleUpdateOptions}
            onStartCrawl={handleStartCrawl}
            onStopCrawl={handleStopCrawl}
            isCrawling={isCrawling}
            activeScrapingUser={activeScrapingUser}
            logs={logs}
            onClearLogs={handleClearLogs}
            rateLimit={rateLimit}
            stats={{
              totalNodes: nodes.length,
              totalEdges: edges.length,
            }}
          />
        )}

        {/* Center / Right Network Graph Canvas */}
        <div className="flex-1 h-full relative overflow-hidden">
          <GraphCanvas
            nodes={nodes}
            edges={edges}
            enablePhysics={options.enablePhysics}
            onTogglePhysics={(enabled) => handleUpdateOptions({ enablePhysics: enabled })}
            onSelectUser={(user, followers, following) => {
              setSelectedUser(user);
              setInGraphFollowers(followers);
              setInGraphFollowing(following);
            }}
            onExpandUser={handleExpandUser}
            isCrawling={isCrawling}
            onStopCrawl={handleStopCrawl}
            activeScrapingUser={activeScrapingUser}
          />

          {/* User Details Inspector Drawer */}
          {selectedUser && (
            <NodeInspector
              user={selectedUser}
              inGraphFollowers={inGraphFollowers}
              inGraphFollowing={inGraphFollowing}
              onClose={() => setSelectedUser(null)}
              onExpandUser={handleExpandUser}
              onSetRootUser={handleSetRootUser}
              onFocusNode={handleFocusNode}
            />
          )}
        </div>
      </div>
    </div>
  );
}
