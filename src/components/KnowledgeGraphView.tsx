import React, { useState, useEffect } from 'react';
import { GraphNode, GraphLink } from '../types';
import { api, TimelineEvent } from '../services/api';

export const KnowledgeGraphView: React.FC = () => {
  const [nodes, setNodes] = useState<GraphNode[]>([]);
  const [links, setLinks] = useState<GraphLink[]>([]);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [timelineTopics, setTimelineTopics] = useState<string[]>([]);
  const [selectedTimelineTopic, setSelectedTimelineTopic] = useState<string | null>(null);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [isLoadingTimeline, setIsLoadingTimeline] = useState<boolean>(false);

  useEffect(() => {
    Promise.all([
      fetch('/api/knowledge-graph')
        .then((res) => res.json())
        .then((data) => {
          if (data.success) {
            setNodes(data.nodes || []);
            setLinks(data.links || []);
            if (data.nodes && data.nodes.length > 0) {
              setSelectedNode(data.nodes[0]);
            }
          }
        }),
      api.fetchTimelineTopics().then((data) => {
        if (data.success) {
          setTimelineTopics(data.topics || []);
          if (data.topics && data.topics.length > 0) {
            setSelectedTimelineTopic(data.topics[0]);
          }
        }
      }).catch(() => {}),
    ])
      .catch((err) => console.error('Failed to load Knowledge Graph:', err))
      .finally(() => setIsLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedTimelineTopic) return;
    setIsLoadingTimeline(true);
    api.fetchTimeline(selectedTimelineTopic)
      .then((data) => {
        if (data.success) {
          setTimelineEvents(data.events || []);
        }
      })
      .catch(() => setTimelineEvents([]))
      .finally(() => setIsLoadingTimeline(false));
  }, [selectedTimelineTopic]);

  return (
    <main className="max-w-[1440px] mx-auto px-4 md:px-10 py-6 pb-28 flex flex-col gap-8">
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl border border-white/12 relative overflow-hidden bg-gradient-to-r from-[#121124] via-[#1a1836] to-[#121124]">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 z-10 relative">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-[#00D1FF]/20 text-[#00D1FF] border border-[#00D1FF]/30 text-xs font-mono-caps font-bold">
                NEO4J GRAPH DATABASE
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#EA4C89]/20 text-[#EA4C89] border border-[#EA4C89]/30 text-xs font-mono-caps font-bold">
                ENTITY DISCOVERY
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-sora font-extrabold text-white">
              Interactive Knowledge Graph
            </h1>
            <p className="text-sm font-hanken text-[#bbc9cf] mt-1 max-w-2xl">
              Explore real-time semantic relationships mapping institutions, policies, constitutional schemes, and current events across global news feeds.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block font-mono-caps text-xs">
              <span className="text-[#bbc9cf] block">Nodes Indexed</span>
              <span className="text-white font-extrabold text-lg">{nodes.length} Entities</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Graph Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive SVG Canvas */}
        <div className="lg:col-span-2 glass-panel p-6 rounded-3xl border border-white/12 bg-[#0d0c1c] min-h-[480px] flex flex-col relative overflow-hidden">
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-[#00D1FF]">hub</span>
              <h3 className="font-sora font-bold text-white text-base">Entity Network Matrix</h3>
            </div>
            <span className="text-xs font-mono-caps text-[#bbc9cf] flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-[#00D1FF] animate-ping"></span> Live Neo4j Sync
            </span>
          </div>

          {isLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-[#00D1FF] animate-spin">sync</span>
            </div>
          ) : (
            <div className="flex-1 relative min-h-[380px] flex items-center justify-center">
              <svg className="w-full h-full min-h-[360px] max-h-[440px]" viewBox="0 0 800 400">
                {/* Connections / Links */}
                {links.map((link, idx) => {
                  const sourceNode = nodes.find((n) => n.id === link.source);
                  const targetNode = nodes.find((n) => n.id === link.target);
                  if (!sourceNode || !targetNode) return null;

                  // Simple radial/circle positioning math
                  const sIdx = nodes.indexOf(sourceNode);
                  const tIdx = nodes.indexOf(targetNode);
                  const sAngle = (sIdx / nodes.length) * 2 * Math.PI;
                  const tAngle = (tIdx / nodes.length) * 2 * Math.PI;
                  const cx = 400, cy = 200, radius = 140;

                  const x1 = cx + radius * Math.cos(sAngle);
                  const y1 = cy + radius * Math.sin(sAngle);
                  const x2 = cx + radius * Math.cos(tAngle);
                  const y2 = cy + radius * Math.sin(tAngle);

                  return (
                    <g key={idx}>
                      <line
                        x1={x1}
                        y1={y1}
                        x2={x2}
                        y2={y2}
                        stroke="#00D1FF"
                        strokeOpacity="0.35"
                        strokeWidth="1.5"
                        strokeDasharray="4,4"
                      />
                    </g>
                  );
                })}

                {/* Nodes */}
                {nodes.map((node, idx) => {
                  const angle = (idx / nodes.length) * 2 * Math.PI;
                  const cx = 400, cy = 200, radius = 140;
                  const x = cx + radius * Math.cos(angle);
                  const y = cy + radius * Math.sin(angle);
                  const isSelected = selectedNode?.id === node.id;

                  const colorMap: Record<string, string> = {
                    Organization: '#00D1FF',
                    Policy: '#EA4C89',
                    Scheme: '#34D399',
                    Event: '#F59E0B',
                    Person: '#A855F7',
                  };
                  const color = colorMap[node.type] || '#00D1FF';

                  return (
                    <g
                      key={node.id}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer transition-transform duration-300 hover:scale-110"
                    >
                      <circle
                        cx={x}
                        cy={y}
                        r={isSelected ? 18 : 12}
                        fill={color}
                        fillOpacity={isSelected ? "0.9" : "0.6"}
                        stroke={isSelected ? "#FFFFFF" : color}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="shadow-[0_0_15px_rgba(0,209,255,0.6)]"
                      />
                      <text
                        x={x}
                        y={y + 26}
                        fill="#FFFFFF"
                        fontSize="10"
                        fontWeight="600"
                        textAnchor="middle"
                        className="pointer-events-none drop-shadow-md font-sora"
                      >
                        {node.label.length > 16 ? `${node.label.slice(0, 14)}...` : node.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>
          )}
        </div>

        {/* Selected Entity Details Panel */}
        <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-[#121124] flex flex-col justify-between gap-6">
          <div>
            <div className="flex items-center justify-between pb-3 border-b border-white/10 mb-4">
              <span className="text-xs font-mono-caps text-[#bbc9cf]">Entity Inspector</span>
              {selectedNode && (
                <span className="px-2 py-0.5 rounded text-[10px] font-mono-caps font-bold bg-white/10 text-[#00D1FF] border border-[#00D1FF]/30">
                  {selectedNode.type}
                </span>
              )}
            </div>

            {selectedNode ? (
              <div className="flex flex-col gap-4">
                <h2 className="text-xl font-sora font-extrabold text-white">{selectedNode.label}</h2>
                <p className="text-xs font-hanken text-[#bbc9cf] leading-relaxed bg-[#1a1932] p-4 rounded-xl border border-white/10">
                  {selectedNode.details}
                </p>

                <div className="flex flex-col gap-2 mt-2">
                  <h4 className="text-xs font-mono-caps text-[#00D1FF] font-bold">Direct Relationships:</h4>
                  {links
                    .filter((l) => l.source === selectedNode.id || l.target === selectedNode.id)
                    .map((l, i) => {
                      const otherId = l.source === selectedNode.id ? l.target : l.source;
                      const otherNode = nodes.find((n) => n.id === otherId);
                      return (
                        <div
                          key={i}
                          onClick={() => otherNode && setSelectedNode(otherNode)}
                          className="flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 cursor-pointer text-xs transition-colors"
                        >
                          <span className="text-white font-medium">{otherNode?.label}</span>
                          <span className="text-[10px] font-mono-caps text-[#EA4C89] font-bold">
                            {l.relationship}
                          </span>
                        </div>
                      );
                    })}
                </div>
              </div>
            ) : (
              <p className="text-xs text-[#bbc9cf]">Click on any node in the graph to view entity details.</p>
            )}
          </div>

          <div className="pt-4 border-t border-white/10 text-[11px] font-mono-caps text-[#bbc9cf] flex items-center justify-between">
            <span>Graph Version: v2.4</span>
            <span className="text-[#00D1FF]">pgvector + Neo4j Synced</span>
          </div>
        </div>
      </div>

      {/* AI Timeline Builder Section */}
      <div className="glass-panel p-6 rounded-3xl border border-white/12 bg-[#0d0c1c]">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-[#EA4C89]">timeline</span>
            <h3 className="font-sora font-bold text-white text-base">AI Event Timeline</h3>
          </div>
          <span className="text-xs font-mono-caps text-[#bbc9cf]">
            {timelineTopics.length} Topics Tracked
          </span>
        </div>

        {timelineTopics.length > 0 ? (
          <>
            <div className="flex flex-wrap gap-2 mb-4">
              {timelineTopics.map((topic) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTimelineTopic(topic)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-mono-caps font-bold border transition-colors ${
                    selectedTimelineTopic === topic
                      ? 'bg-[#EA4C89]/20 text-[#EA4C89] border-[#EA4C89]/40'
                      : 'bg-white/5 text-[#bbc9cf] border-white/10 hover:bg-white/10'
                  }`}
                >
                  {topic}
                </button>
              ))}
            </div>

            {isLoadingTimeline ? (
              <div className="flex items-center justify-center py-8">
                <span className="material-symbols-outlined text-3xl text-[#EA4C89] animate-spin">sync</span>
              </div>
            ) : timelineEvents.length > 0 ? (
              <div className="relative pl-6 border-l-2 border-[#EA4C89]/30 flex flex-col gap-4">
                {timelineEvents.map((event) => (
                  <div key={event.id} className="relative">
                    <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-[#EA4C89] border-2 border-[#0d0c1c]"></div>
                    <div className="flex flex-col gap-1">
                      <span className="text-xs font-mono-caps text-[#EA4C89] font-bold">
                        {event.event_date || 'Date N/A'}
                      </span>
                      <h4 className="text-sm font-sora font-bold text-white">{event.event_title}</h4>
                      <p className="text-xs font-hanken text-[#bbc9cf] leading-relaxed">
                        {event.event_description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#bbc9cf] py-4">
                No timeline events yet for this topic. Run the knowledge engine to generate timelines.
              </p>
            )}
          </>
        ) : (
          <p className="text-xs text-[#bbc9cf] py-4">
            No timelines built yet. The AI knowledge engine automatically builds timelines when articles are processed.
          </p>
        )}
      </div>
    </main>
  );
};
