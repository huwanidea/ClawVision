const http = require('http');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { exec } = require('child_process');

const PORT = 18790;
const clawDir = path.join(os.homedir(), '.openclaw');

// 完整的 HTML + Vue3 + D3 前端代码被嵌入在此处
const HTML_UI = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>OpenClaw 智能体全息控制台</title>
  <script src="https://unpkg.com/vue@3/dist/vue.global.js"></script>
  <script src="https://d3js.org/d3.v7.min.js"></script>
  <script src="https://unpkg.com/axios/dist/axios.min.js"></script>
  <style>
    :root { --bg-color: #f4f6f9; --panel-bg: #ffffff; --text-color: #333333; --border-color: #e1e4e8; --accent-color: #3498db; --agent-color: #004E89; --skill-color: #E9724C; }
    body, html { margin: 0; padding: 0; height: 100%; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: var(--bg-color); overflow: hidden; }
    #app { display: flex; height: 100vh; flex-direction: column; }
    .navbar { height: 60px; background: #fff; border-bottom: 1px solid var(--border-color); display: flex; align-items: center; justify-content: space-between; padding: 0 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.05); z-index: 10; }
    .nav-brand { font-size: 20px; font-weight: bold; color: var(--agent-color); display: flex; align-items: center; gap: 10px; }
    .btn { padding: 6px 15px; background: var(--accent-color); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background 0.2s; }
    .btn:hover { background: #2980b9; }
    .main-container { display: flex; flex: 1; overflow: hidden; position: relative; }
    .graph-container { flex: 1; position: relative; display: flex; flex-direction: column; background: #fafbfc; }
    .graph-svg { width: 100%; height: 100%; }
    .detail-panel { width: 400px; background: var(--panel-bg); border-left: 1px solid var(--border-color); display: flex; flex-direction: column; box-shadow: -2px 0 10px rgba(0,0,0,0.05); transition: width 0.3s ease; }
    .panel-header { padding: 15px 20px; border-bottom: 1px solid var(--border-color); display: flex; justify-content: space-between; align-items: center; background: #f8f9fa; }
    .panel-title { font-weight: 600; font-size: 16px; margin: 0; }
    .close-btn { cursor: pointer; color: #888; font-size: 20px; border: none; background: transparent; padding: 0; }
    .close-btn:hover { color: #333; }
    .panel-content { flex: 1; overflow-y: auto; padding: 20px; }
    .form-group { margin-bottom: 15px; }
    .form-group label { display: block; margin-bottom: 5px; font-size: 13px; color: #666; font-weight: 500; }
    .form-group input, .form-group textarea { width: 100%; padding: 8px; border: 1px solid var(--border-color); border-radius: 4px; font-family: inherit; font-size: 14px; box-sizing: border-box; }
    .form-group input:focus, .form-group textarea:focus { outline: none; border-color: var(--accent-color); }
    .form-group textarea { resize: vertical; min-height: 80px; }
    .badge { display: inline-block; padding: 4px 8px; font-size: 12px; border-radius: 12px; font-weight: bold; color: white; }
    .badge.agent { background: var(--agent-color); }
    .badge.skill { background: var(--skill-color); }
    .panel-footer { padding: 15px 20px; border-top: 1px solid var(--border-color); display: flex; justify-content: flex-end; gap: 10px; background: #f8f9fa; }
    .loading-overlay { position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: rgba(255,255,255,0.8); display: flex; justify-content: center; align-items: center; font-size: 18px; color: var(--accent-color); z-index: 50; }
    .legend { position: absolute; bottom: 20px; left: 20px; background: rgba(255,255,255,0.9); padding: 10px 15px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); border: 1px solid var(--border-color); pointer-events: none; }
    .legend-item { display: flex; align-items: center; margin-bottom: 5px; font-size: 13px; color: #555; }
    .legend-color { width: 12px; height: 12px; border-radius: 50%; margin-right: 8px; }
  </style>
</head>
<body>
  <div id="app">
    <div class="navbar">
      <div class="nav-brand">
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>
        OpenClaw 智能沙盘枢纽
      </div>
      <div>
        <button class="btn" @click="fetchData(true)">↺ 强制实时刷新图谱</button>
      </div>
    </div>

    <div class="main-container">
      <div class="graph-container" ref="graphContainer">
        <div v-show="loading" class="loading-overlay">正在扫描龙虾核心网关架构...</div>
        <svg ref="graphSvg" class="graph-svg"></svg>
        
        <div class="legend">
          <div class="legend-item"><div class="legend-color" style="background: #8E44AD"></div>Main Agent (主控大脑)</div>
          <div class="legend-item"><div class="legend-color" style="background: var(--agent-color)"></div>Agent (后备/专家模型)</div>
          <div class="legend-item"><div class="legend-color" style="background: var(--skill-color)"></div>Skill (技能/工具)</div>
        </div>
      </div>

      <div class="detail-panel" v-show="selectedNode">
        <div class="panel-header">
          <h3 class="panel-title"><span class="badge" :class="selectedNode?.type?.toLowerCase()">{{ selectedNode?.type }}</span> 属性面板</h3>
          <button class="close-btn" @click="closePanel">&times;</button>
        </div>
        <div class="panel-content" v-if="selectedNode">
          <div class="form-group"><label>节点 ID (只读)</label><input type="text" :value="selectedNode.id" disabled style="background:#f0f0f0;"></div>
          <div class="form-group"><label>展示名称 Name</label><input type="text" v-model="editForm.name"></div>
          <div class="form-group" v-if="selectedNode.type === 'Agent' || selectedNode.type === 'MainAgent'"><label>身份设定 / 说明</label><textarea v-model="editForm.description"></textarea></div>
          <div class="form-group" v-if="selectedNode.type === 'Agent' || selectedNode.type === 'MainAgent'"><label>关联大模型 (Model)</label><input type="text" v-model="editForm.model" disabled style="background:#f0f0f0;"></div>
          <div class="form-group" v-if="selectedNode.type === 'Skill'"><label>功能描述 (Description)</label><textarea v-model="editForm.description"></textarea></div>
          <div class="form-group" v-if="selectedNode.type === 'Skill'"><label>调用动作 (Action)</label><input type="text" v-model="editForm.actionName" disabled style="background:#f0f0f0;"></div>
        </div>
        <div class="panel-footer">
          <button class="btn" style="background:#95a5a6;" @click="closePanel">关闭面板</button>
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
        const editForm = ref({});

        const fetchData = async () => {
          loading.value = true;
          try {
            // 调用本地自建 Node API，拉取最新的龙虾硬盘数据
            const response = await axios.get('/api/graph');
            const data = response.data;
            rawNodes.value = data.nodes;
            rawLinks.value = data.links;
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
            svg.selectAll('.node circle').attr('stroke', '#fff').attr('stroke-width', 2.5);
            svg.selectAll('.link line').attr('stroke', '#C0C0C0').attr('stroke-opacity', 0.6).attr('stroke-width', 1.5);
          }
        };

        const renderGraph = () => {
          if (!graphSvg.value || rawNodes.value.length === 0) return;
          if (simulation) simulation.stop();
          
          const svg = d3.select(graphSvg.value);
          svg.selectAll('*').remove();
          
          const width = graphContainer.value.clientWidth;
          const height = graphContainer.value.clientHeight;
          svg.attr('viewBox', [0, 0, width, height]);

          const nodes = rawNodes.value.map(d => ({...d}));
          const links = rawLinks.value.map(d => ({...d}));

          const colors = { 'MainAgent': '#8E44AD', 'Agent': '#004E89', 'Skill': '#E9724C' };

          simulation = d3.forceSimulation(nodes)
            .force('link', d3.forceLink(links).id(d => d.id).distance(160))
            .force('charge', d3.forceManyBody().strength(-600))
            .force('center', d3.forceCenter(width / 2, height / 2))
            .force('collide', d3.forceCollide(60));

          const g = svg.append('g');
          svg.call(d3.zoom().extent([[0, 0], [width, height]]).scaleExtent([0.3, 4]).on('zoom', e => g.attr('transform', e.transform)));
          
          const linkGroup = g.append('g').attr('class', 'links');
          const linkElements = linkGroup.selectAll('.link').data(links).enter().append('g').attr('class', 'link');
          const linkPaths = linkElements.append('line').attr('stroke', '#C0C0C0').attr('stroke-opacity', 0.6).attr('stroke-width', 1.5);
          const linkLabels = linkElements.append('text').text(d => d.type).attr('font-size', '10px').attr('fill', '#888').attr('text-anchor', 'middle').attr('dy', -5);

          const nodeGroup = g.append('g').attr('class', 'nodes');
          const nodeElements = nodeGroup.selectAll('.node').data(nodes).enter().append('g').attr('class', 'node')
            .style('cursor', 'pointer')
            .call(d3.drag().on('start', dragstarted).on('drag', dragged).on('end', dragended))
            .on('click', (event, d) => {
              event.stopPropagation();
              selectedNode.value = d;
              editForm.value = { ...d };
              svg.selectAll('.node circle').attr('stroke', '#fff').attr('stroke-width', 2.5);
              linkPaths.attr('stroke', '#C0C0C0').attr('stroke-opacity', 0.6).attr('stroke-width', 1.5);
              d3.select(event.currentTarget).select('circle').attr('stroke', '#3498db').attr('stroke-width', 4);
              linkPaths.filter(l => l.source.id === d.id || l.target.id === d.id).attr('stroke', '#3498db').attr('stroke-opacity', 1).attr('stroke-width', 2.5);
            });

          nodeElements.append('circle')
            .attr('r', d => d.type === 'MainAgent' ? 24 : (d.type === 'Agent' ? 16 : 10))
            .attr('fill', d => colors[d.type] || '#999')
            .attr('stroke', '#fff')
            .attr('stroke-width', 2.5)
            .style('filter', 'drop-shadow(0px 2px 4px rgba(0,0,0,0.15))');

          nodeElements.append('text').attr('dx', 24).attr('dy', 4).text(d => d.name).attr('font-size', '13px').attr('font-weight', 'bold').attr('fill', '#333');
          nodeElements.append('text').attr('dx', 24).attr('dy', 20).text(d => (d.type === 'Agent' || d.type === 'MainAgent') ? \`@\${d.model}\` : d.actionName).attr('font-size', '11px').attr('fill', '#888');

          svg.on('click', closePanel);

          simulation.on('tick', () => {
            linkPaths.attr('x1', d => d.source.x).attr('y1', d => d.source.y).attr('x2', d => d.target.x).attr('y2', d => d.target.y);
            linkLabels.attr('x', d => (d.source.x + d.target.x) / 2).attr('y', d => (d.source.y + d.target.y) / 2);
            nodeElements.attr('transform', d => \`translate(\${d.x},\${d.y})\`);
          });

          function dragstarted(event, d) { if (!event.active) simulation.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; }
          function dragged(event, d) { d.fx = event.x; d.fy = event.y; }
          function dragended(event, d) { if (!event.active) simulation.alphaTarget(0); d.fx = null; d.fy = null; }
        };

        onMounted(() => {
          fetchData();
          window.addEventListener('resize', () => { if(graphSvg.value) renderGraph(); });
          // 每隔 5 秒自动静默拉取一次最新图谱数据 (取代外部文件循环监测)
          pollingTimer = setInterval(() => { 
             axios.get('/api/graph').then(res => { 
                if (res.data && res.data.nodes.length > 0) {
                   rawNodes.value = res.data.nodes; 
                   rawLinks.value = res.data.links; 
                   // 若之前为空则直接渲染
                   if(d3.select(graphSvg.value).selectAll('.node').empty()) renderGraph();
                }
             }).catch(err => console.error(err));
          }, 5000);
        });

        return { loading, graphSvg, graphContainer, selectedNode, editForm, fetchData, closePanel };
      }
    }).mount('#app');
  </script>
</body>
</html>`;

// 解析数据的 API 路由函数
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
    }
  }

  const primaryModelId = openclawJson.agents?.defaults?.model?.primary?.split('/').pop();
  const fallbackModelIds = openclawJson.agents?.defaults?.model?.fallbacks?.map(f => f.split('/').pop()) || [];
  
  const nodes = [];
  const links = [];

  if (primaryModelId) {
    const def = modelDefs[primaryModelId] || { name: primaryModelId };
    nodes.push({ id: primaryModelId, name: '主控大脑 Orchestrator', type: 'MainAgent', description: def.name + ' (Core Brain)', model: primaryModelId, status: 'active' });
  }

  for (const fId of fallbackModelIds) {
    const def = modelDefs[fId] || { name: fId };
    nodes.push({ id: fId, name: def.name || fId, type: 'Agent', description: '后备专属模型专家', model: fId, status: 'active' });
    if (primaryModelId) {
      links.push({ source: primaryModelId, target: fId, type: 'DELEGATES_TO' });
    }
  }

  const skillsDir = path.join(clawDir, 'workspace', 'skills');
  if (fs.existsSync(skillsDir)) {
    const skills = fs.readdirSync(skillsDir, { withFileTypes: true })
      .filter(dirent => dirent.isDirectory())
      .map(dirent => dirent.name);

    for (let i = 0; i < skills.length; i++) {
        const skill = skills[i];
        nodes.push({
            id: 'skill_' + skill,
            name: skill.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            type: 'Skill',
            description: `本地工作流插件: ${skill}`,
            actionName: skill,
            status: 'active'
        });
        if (primaryModelId) links.push({ source: primaryModelId, target: 'skill_' + skill, type: 'HAS_SKILL' });
        if (fallbackModelIds.length > 0) {
            const randomFallback = fallbackModelIds[i % fallbackModelIds.length];
            links.push({ source: randomFallback, target: 'skill_' + skill, type: 'HAS_SKILL' });
        }
    }
  }
  return { nodes, links };
}

// 建立内置 HTTP Server
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
  console.log(`OpenClaw 独立视觉沙盘服务已启动 [端口: ${PORT}]`);
  console.log('后台将每隔 5 秒隐式拉取您的龙虾数据...');
  console.log('===================================================');
  console.log('如果浏览器没有自动打开，请手动访问: http://127.0.0.1:' + PORT);
  
  // 自动打开浏览器
  const startCmd = process.platform === 'win32' ? 'start' : (process.platform === 'darwin' ? 'open' : 'xdg-open');
  exec(`${startCmd} http://127.0.0.1:${PORT}`);
});
