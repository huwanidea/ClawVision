const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = 18790;
const clawDir = path.join(os.homedir(), '.openclaw');

const HTML_UI = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>ClawVision 全息架构沙盘</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <style>
    :root { 
      --bg-color: #0f172a; 
      --panel-bg: rgba(30, 41, 59, 0.85); 
      --text-color: #f8fafc; 
      --text-muted: #94a3b8;
      --border-color: rgba(255, 255, 255, 0.1); 
      --accent-color: #38bdf8; 
      --agent-main: #c084fc; 
      --agent-fallback: #3b82f6; 
      --skill-color: #f97316;
      --memory-color: #10b981;
      --identity-color: #f59e0b;
    }
    body, html { margin: 0; padding: 0; height: 100%; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: var(--bg-color); color: var(--text-color); overflow: hidden; }
    #app { display: flex; height: 100vh; flex-direction: column; }
    
    .navbar { height: 60px; background: rgba(15, 23, 42, 0.9); backdrop-filter: blur(10px); border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 24px; z-index: 10; }
    .nav-brand { font-size: 20px; font-weight: 700; color: #fff; display: flex; align-items: center; gap: 12px; letter-spacing: 0.5px; }
    .nav-brand span { font-weight: 400; color: var(--text-muted); font-size: 14px; }
    
    .btn { padding: 8px 16px; background: rgba(56, 189, 248, 0.1); color: var(--accent-color); border: 1px solid rgba(56, 189, 248, 0.3); border-radius: 6px; cursor: pointer; font-size: 13px; font-weight: 600; transition: all 0.2s; }
    .btn:hover { background: rgba(56, 189, 248, 0.2); box-shadow: 0 0 10px rgba(56, 189, 248, 0.2); }
    
    .main-container { display: flex; flex: 1; overflow: hidden; position: relative; background: radial-gradient(circle at center, #1e293b 0%, #0f172a 100%); }
    .graph-container { flex: 1; position: relative; display: flex; flex-direction: column; }
    .graph-svg { width: 100%; height: 100%; }
    
    .detail-panel { width: 420px; background: var(--panel-bg); backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); border-left: 1px solid var(--border-color); display: flex; flex-direction: column; box-shadow: -5px 0 25px rgba(0,0,0,0.5); transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1); z-index: 20; }
    .panel-header { padding: 20px 24px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: flex-start; }
    .panel-title { font-weight: 600; font-size: 18px; margin: 0 0 8px 0; display: flex; align-items: center; gap: 10px; }
    .close-btn { cursor: pointer; color: var(--text-muted); font-size: 24px; line-height: 1; border: none; background: transparent; padding: 0; transition: color 0.2s; }
    .close-btn:hover { color: #fff; }
    
    .panel-content { flex: 1; overflow-y: auto; padding: 24px; }
    .panel-content::-webkit-scrollbar { width: 6px; }
    .panel-content::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 3px; }
    
    .prop-row { margin-bottom: 20px; }
    .prop-label { font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; color: var(--text-muted); margin-bottom: 6px; font-weight: 600; }
    .prop-value { font-size: 14px; line-height: 1.6; color: #e2e8f0; background: rgba(0,0,0,0.2); padding: 12px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.05); }
    
    .badge-grid { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 8px; }
    .badge-tag { padding: 4px 10px; font-size: 11px; border-radius: 4px; font-weight: 600; background: rgba(255,255,255,0.05); color: #cbd5e1; border: 1px solid rgba(255,255,255,0.1); }
    
    /* Dynamic type colors */
    .badge.mainagent { color: var(--agent-main); border-color: var(--agent-main); background: rgba(192, 132, 252, 0.1); }
    .badge.agent { color: var(--agent-fallback); border-color: var(--agent-fallback); background: rgba(59, 130, 246, 0.1); }
    .badge.skill { color: var(--skill-color); border-color: var(--skill-color); background: rgba(249, 115, 22, 0.1); }
    .badge.memory { color: var(--memory-color); border-color: var(--memory-color); background: rgba(16, 185, 129, 0.1); }
    .badge.identity { color: var(--identity-color); border-color: var(--identity-color); background: rgba(245, 158, 11, 0.1); }
    
    .loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(15,23,42,0.8); backdrop-filter: blur(4px); display: flex; flex-direction: column; gap: 15px; justify-content: center; align-items: center; font-size: 16px; color: var(--accent-color); z-index: 50; }
    .spinner { width: 40px; height: 40px; border: 3px solid rgba(56,189,248,0.2); border-top-color: var(--accent-color); border-radius: 50%; animation: spin 1s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    
    .legend { position: absolute; bottom: 24px; left: 24px; background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(8px); padding: 16px; border-radius: 12px; border: 1px solid var(--border-color); pointer-events: none; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 4px 20px rgba(0,0,0,0.3); }
    .legend-title { font-size: 11px; text-transform: uppercase; letter-spacing: 1px; color: var(--text-muted); margin-bottom: 4px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 6px; }
    .legend-item { display: flex; align-items: center; font-size: 13px; color: #cbd5e1; font-weight: 500; }
    .legend-color { width: 12px; height: 12px; border-radius: 50%; margin-right: 12px; box-shadow: 0 0 8px currentColor; }
  </style>
</head>
<body>
  <div id="app">
    <div class="navbar">
      <div class="nav-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
        ClawVision <span>全息架构图谱</span>
      </div>
      <div>
        <button class="btn" @click="fetchData(true)">↺ 强制全量同步</button>
      </div>
    </div>

    <div class="main-container">
      <div class="graph-container" ref="graphContainer">
        <div v-show="loading" class="loading-overlay">
          <div class="spinner"></div><div>正在扫描 OpenClaw 中枢及记忆库...</div>
        </div>
        <svg ref="graphSvg" class="graph-svg"></svg>
        
        <div class="legend">
          <div class="legend-title">系统拓扑图例</div>
          <div class="legend-item"><div class="legend-color" style="color: var(--agent-main); background: currentColor"></div>大脑中心 (Main Agent)</div>
          <div class="legend-item"><div class="legend-color" style="color: var(--agent-fallback); background: currentColor"></div>专家替身 (Fallback Agents)</div>
          <div class="legend-item"><div class="legend-color" style="color: var(--skill-color); background: currentColor"></div>工作流技能 (Skills)</div>
          <div class="legend-item"><div class="legend-color" style="color: var(--memory-color); background: currentColor"></div>长效记忆库 (Memory)</div>
          <div class="legend-item"><div class="legend-color" style="color: var(--identity-color); background: currentColor"></div>AI 人格指令 (Identity)</div>
        </div>
      </div>

      <div class="detail-panel" v-show="selectedNode" :style="{ transform: selectedNode ? 'translateX(0)' : 'translateX(100%)' }">
        <div class="panel-header">
          <div>
            <span class="badge-tag badge" :class="selectedNode?.type?.toLowerCase()">{{ selectedNode?.typeLabel || selectedNode?.type }}</span>
            <h3 class="panel-title" style="margin-top: 12px; color: #fff;">{{ selectedNode?.name }}</h3>
          </div>
          <button class="close-btn" @click="closePanel">&times;</button>
        </div>
        
        <div class="panel-content" v-if="selectedNode">
          
          <div class="prop-row" v-if="selectedNode.description">
            <div class="prop-label">说明 / 内容摘要</div>
            <div class="prop-value" style="white-space: pre-wrap;">{{ selectedNode.description }}</div>
          </div>
          
          <div class="prop-row" v-if="selectedNode.meta">
            <div class="prop-label">核心参数指标</div>
            <div class="badge-grid">
              <span class="badge-tag" v-for="(val, key) in selectedNode.meta" :key="key">{{ key }}: {{ val }}</span>
            </div>
          </div>

          <div class="prop-row" v-if="selectedNode.model">
            <div class="prop-label">基座大模型路径</div>
            <div class="prop-value" style="font-family: monospace; color: #93c5fd;">{{ selectedNode.model }}</div>
          </div>
          
          <div class="prop-row" v-if="selectedNode.id">
            <div class="prop-label">系统内部追踪标示 (UUID/Path)</div>
            <div class="prop-value" style="font-family: monospace; font-size: 12px; color: #64748b; background: rgba(0,0,0,0.3); border:none;">{{ selectedNode.id }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <script>
    const { createApp, ref, onMounted } = Vue;
    createApp({
      setup() {
        const loading = ref(false);
        const graphSvg = ref(null);
        const graphContainer = ref(null);
        let simulation = null;
        let pollingTimer = null;
        
        const rawNodes = ref([]);
        const rawLinks = ref([]);
        const selectedNode = ref(null);

        const fetchData = async () => {
          loading.value = true;
          try {
            const response = await axios.get('/api/graph');
            rawNodes.value = response.data.nodes;
            rawLinks.value = response.data.links;
            renderGraph();
          } catch (e) {
            console.error(e);
          } finally {
            loading.value = false;
          }
        };

        const closePanel = () => {
          selectedNode.value = null;
          if(graphSvg.value) {
            const svg = d3.select(graphSvg.value);
            svg.selectAll('.node circle')
               .attr('stroke', 'rgba(255,255,255,0.1)')
               .attr('stroke-width', 2);
            svg.selectAll('.link line')
               .attr('stroke', 'rgba(255,255,255,0.15)')
               .attr('stroke-width', 1.5)
               .style('filter', 'none');
          }
        };

        const renderGraph = () => {
          if (!graphSvg.value || rawNodes.value.length === 0) return;
          if (simulation) simulation.stop();
          
          const svg = d3.select(graphSvg.value);
          svg.selectAll('*').remove();
          
          // Definitions for glowing effects
          const defs = svg.append('defs');
          const filter = defs.append('filter').attr('id', 'glow');
          filter.append('feGaussianBlur').attr('stdDeviation', '3.5').attr('result', 'coloredBlur');
          const feMerge = filter.append('feMerge');
          feMerge.append('feMergeNode').attr('in', 'coloredBlur');
          feMerge.append('feMergeNode').attr('in', 'SourceGraphic');
          
          const width = graphContainer.value.clientWidth;
          const height = graphContainer.value.clientHeight;
          svg.attr('viewBox', [0, 0, width, height]);

          const nodes = rawNodes.value.map(d => ({...d}));
          const links = rawLinks.value.map(d => ({...d}));

          const colors = { 
            'MainAgent': '#c084fc', 
            'Agent': '#3b82f6', 
            'Skill': '#f97316',
            'Memory': '#10b981',
            'Identity': '#f59e0b'
          };

          simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(d => {
               if (d.type === 'CONSULTS_MEMORY') return 220;
               if (d.type === 'DEFINES_PERSONA') return 200;
               if (d.type === 'CALLS_TOOL') return 180;
               return 150;
            }))
            .force('charge', d3.forceManyBody().strength(-800))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide(70));

          const g = svg.append('g');
          svg.call(d3.zoom().extent([[0, 0], [width, height]]).scaleExtent([0.1, 4]).on('zoom', e => g.attr('transform', e.transform)));
          
          const linkGroup = g.append('g').attr('class', 'links');
          const linkElements = linkGroup.selectAll('.link').data(links).enter().append('g').attr('class', 'link');
          
          const linkPaths = linkElements.append('line')
            .attr('stroke', 'rgba(255,255,255,0.15)')
            .attr('stroke-opacity', 0.8)
            .attr('stroke-width', 1.5);
            
          const linkLabels = linkElements.append('text')
            .text(d => d.type.replace(/_/g, ' '))
            .attr('font-size', '10px')
            .attr('font-weight', '600')
            .attr('fill', 'rgba(255,255,255,0.3)')
            .attr('text-anchor', 'middle')
            .attr('dy', -5)
            .style('pointer-events', 'none');

          const nodeGroup = g.append('g').attr('class', 'nodes');
          const nodeElements = nodeGroup.selectAll('.node').data(nodes).enter().append('g').attr('class', 'node')
            .style('cursor', 'pointer')
            .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))
            .on('click', (event, d) => {
              event.stopPropagation();
              selectedNode.value = d;
              
              // Reset all styles
              svg.selectAll('.node circle')
                 .attr('stroke', 'rgba(255,255,255,0.1)')
                 .attr('stroke-width', 2);
              linkPaths.attr('stroke', 'rgba(255,255,255,0.15)').attr('stroke-width', 1.5).style('filter', 'none');
              linkLabels.attr('fill', 'rgba(255,255,255,0.3)');
              
              // Highlight selected
              const nodeColor = colors[d.type] || '#fff';
              d3.select(event.currentTarget).select('circle')
                .attr('stroke', '#fff')
                .attr('stroke-width', 4);
                
              linkPaths.filter(l => l.source.id === d.id || l.target.id === d.id)
                .attr('stroke', nodeColor)
                .attr('stroke-width', 3)
                .style('filter', 'url(#glow)');
                
              linkLabels.filter(l => l.source.id === d.id || l.target.id === d.id)
                .attr('fill', '#fff');
            });

          // Draw Node Circles
          nodeElements.append('circle')
            .attr('r', d => {
               if (d.type === 'MainAgent') return 28;
               if (d.type === 'Agent') return 20;
               if (d.type === 'Identity') return 24;
               return 16;
            })
            .attr('fill', d => colors[d.type] || '#999')
            .attr('stroke', 'rgba(255,255,255,0.1)')
            .attr('stroke-width', 2)
            .style('filter', 'drop-shadow(0px 4px 12px rgba(0,0,0,0.5))');

          // Node Titles
          nodeElements.append('text')
            .attr('dx', d => (d.type === 'MainAgent' ? 36 : 24))
            .attr('dy', 4)
            .text(d => d.name)
            .attr('font-size', '14px')
            .attr('font-weight', '600')
            .attr('fill', '#f1f5f9')
            .style('pointer-events', 'none')
            .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)');
          
          // Node Subtitles
          nodeElements.append('text')
            .attr('dx', d => (d.type === 'MainAgent' ? 36 : 24))
            .attr('dy', 22)
            .text(d => {
               if(d.type === 'Memory') return d.meta?.Size || '';
               if(d.type === 'Agent' || d.type === 'MainAgent') return d.model ? \`@\${d.model.split('/').pop()}\` : '';
               return d.meta?.Action || '';
            })
            .attr('font-size', '11px')
            .attr('fill', 'var(--text-muted)')
            .style('pointer-events', 'none');

          svg.on('click', closePanel);

          simulation.on('tick', () => {
            linkPaths.attr('x1', d => d.source.x)
                     .attr('y1', d => d.source.y)
                     .attr('x2', d => d.target.x)
                     .attr('y2', d => d.target.y);
            linkLabels.attr('x', d => (d.source.x + d.target.x) / 2)
                      .attr('y', d => (d.source.y + d.target.y) / 2);
            nodeElements.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
          });

          function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
          function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
          function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
        };

        onMounted(() => {
          fetchData();
          window.addEventListener('resize', () => { if(graphSvg.value) renderGraph(); });
          pollingTimer = setInterval(() => { 
             axios.get('/api/graph').then(res => { 
                if (res.data && res.data.nodes.length > 0) {
                   rawNodes.value = res.data.nodes; 
                   rawLinks.value = res.data.links; 
                   if(d3.select(graphSvg.value).selectAll('.node').empty()) renderGraph();
                }
             }).catch(err => console.error(err));
          }, 5000);
        });

        return { loading, graphSvg, graphContainer, selectedNode, fetchData, closePanel };
      }
    }).mount('#app');
  </script>
</body>
</html>`;

function getOpenClawData() {
  const openclawJsonPath = path.join(clawDir, 'openclaw.json');
  const modelsJsonPath = path.join(clawDir, 'agents', 'main', 'agent', 'models.json');
  
  if (!fs.existsSync(openclawJsonPath) || !fs.existsSync(modelsJsonPath)) {
      return { nodes: [], links: [] };
  }

  const openclawJson = JSON.parse(fs.readFileSync(openclawJsonPath, 'utf8'));
  const modelsJson = JSON.parse(fs.readFileSync(modelsJsonPath, 'utf8'));
  
  const modelDefs = {};
  for (const provider of Object.values(modelsJson.providers || {})) {
    for (const m of (provider.models || [])) {
      modelDefs[m.id] = m;
      modelDefs[m.id].providerName = provider.baseUrl || 'Unknown API';
    }
  }

  const primaryModelPath = openclawJson.agents?.defaults?.model?.primary || '';
  const primaryModelId = primaryModelPath.split('/').pop() || '';
  const fallbackModelIds = openclawJson.agents?.defaults?.model?.fallbacks?.map(f => f.split('/').pop()) || [];
  
  const nodes = [];
  const links = [];

  // ==========================
  // 1. Identity Rules Nodes
  // ==========================
  const agentsMdPath = path.join(clawDir, 'workspace', 'AGENTS.md');
  if (fs.existsSync(agentsMdPath)) {
    const content = fs.readFileSync(agentsMdPath, 'utf8');
    nodes.push({
      id: 'core_identity',
      name: 'AGENTS.md (灵魂协议)',
      type: 'Identity',
      typeLabel: 'Persona & Rules',
      description: content.substring(0, 300) + '...\\n(读取本地 Workspace)',
      meta: { 'Total Lines': content.split('\\n').length }
    });
    if (primaryModelId) links.push({ source: 'core_identity', target: primaryModelId, type: 'DEFINES_PERSONA' });
  }

  // ==========================
  // 2. Agents Build 
  // ==========================
  if (primaryModelId) {
    const def = modelDefs[primaryModelId] || { name: primaryModelId };
    nodes.push({ 
      id: primaryModelId, 
      name: def.name || primaryModelId, 
      type: 'MainAgent', 
      typeLabel: 'Main Orchestrator',
      description: '负责任务分发、长文理解与最终决策的中央协调者。核心指挥基座。', 
      model: primaryModelPath,
      meta: { 
        'Context Window': def.contextWindow ? (def.contextWindow/1000)+'K' : 'Unspecified',
        'Reasoning Enabled': def.reasoning ? 'Yes' : 'No',
        'Max Tokens': def.maxTokens || 'Auto'
      }
    });
  }

  for (const fId of fallbackModelIds) {
    const def = modelDefs[fId] || { name: fId };
    nodes.push({ 
      id: fId, 
      name: def.name || fId, 
      type: 'Agent', 
      typeLabel: 'Fallback Node',
      description: '当主神经元遇到频率限制、死锁或网络异常时，系统自动切入的专属备用模型。', 
      model: fId,
      meta: { 
        'Context Limit': def.contextWindow ? (def.contextWindow/1000)+'k' : 'Unknown'
      }
    });
    if (primaryModelId) {
      links.push({ source: primaryModelId, target: fId, type: 'FALLBACKS_TO' });
    }
  }

  // ==========================
  // 3. Workspace Memory
  // ==========================
  const memoryDir = path.join(clawDir, 'workspace', 'memory');
  if (fs.existsSync(memoryDir)) {
    const memories = fs.readdirSync(memoryDir).filter(f => f.endsWith('.md'));
    for (const mem of memories) {
      const memPath = path.join(memoryDir, mem);
      const stat = fs.statSync(memPath);
      const contentSample = fs.readFileSync(memPath, 'utf8').substring(0, 150).trim();
      
      const memId = 'mem_' + mem;
      nodes.push({
        id: memId,
        name: mem.replace('.md', ''),
        type: 'Memory',
        typeLabel: 'Long-term Memory',
        description: contentSample + '...',
        meta: { 
          'Size': (stat.size / 1024).toFixed(1) + ' KB',
          'Read/Write': 'Dynamic State' 
        }
      });
      if (primaryModelId) links.push({ source: primaryModelId, target: memId, type: 'CONSULTS_MEMORY' });
    }
  }

  // ==========================
  // 4. Skills Ecosystem
  // ==========================
  const skillsDir = path.join(clawDir, 'workspace', 'skills');
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true }).filter(d => d.isDirectory()).map(d => d.name);

    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        const skillId = 'skill_' + skill;
        
        // Deep parsing logic
        let desc = '执行本地底层或外部 API 工作流系统。';
        let ver = '1.0.0';
        try {
          const mdPath = path.join(skillsDir, skill, 'SKILL.md');
          if (fs.existsSync(mdPath)) {
             const mdContent = fs.readFileSync(mdPath, 'utf8');
             // Quick regex to find yaml description frontmatter
             const match = mdContent.match(/description:\\s*["'](.*?)["']/);
             if (match) desc = match[1];
          }
          const metaPath = path.join(skillsDir, skill, '_meta.json');
          if (fs.existsSync(metaPath)) {
             const meta = JSON.parse(fs.readFileSync(metaPath, 'utf8'));
             if (meta.version) ver = meta.version;
          }
        } catch(e) {}

        nodes.push({
            id: skillId,
            name: skill.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            type: 'Skill',
            typeLabel: 'Tool / Extension',
            description: desc,
            meta: { 'Version': ver, 'Action': skill }
        });
        
        if (primaryModelId) {
            links.push({ source: primaryModelId, target: skillId, type: 'CALLS_TOOL' });
        }
    }
  }
  
  return { nodes, links };
}

const server = http.createServer((req, res) => {
  if (req.url === '/') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(HTML_UI);
  } else if (req.url === '/api/graph') {
    try {
        const data = getOpenClawData();
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify(data));
    } catch(e) {
        res.writeHead(500);
        res.end(JSON.stringify({error: e.toString()}));
    }
  } else {
    res.writeHead(404);
    res.end('Not Found');
  }
});

server.listen(PORT, '127.0.0.1', () => {
  console.log('===================================================');
  console.log(`ClawVision 核心微服务正在监听端口: ${PORT}`);
  console.log('系统拓扑生成引擎 (包含 Identity, Memory, Skills) [Online]');
  console.log('===================================================');
  
  const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  exec(`${startCmd} http://127.0.0.1:${PORT}`);
});
