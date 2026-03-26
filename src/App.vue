<template>
  <div class="app-wrapper">
    <header class="navbar">
      <div class="logo">
        <span class="icon">👑</span>
        <span class="title">网络图一键生成 <span class="badge">PRO</span></span>
        <span class="subtitle">标书高规格工业版</span>
      </div>
      <div class="toolbar">
        <div class="zoom-controls">
          <button @click="zoom = Math.max(0.3, zoom - 0.1)" title="缩小">－</button>
          <span class="zoom-level">{{ Math.round(zoom * 100) }}%</span>
          <button @click="zoom = Math.min(2, zoom + 0.1)" title="放大">＋</button>
        </div>
        
        <div class="export-group">
          <button class="btn-export png-btn" @click="exportToPng" title="适合直接插入 Word/PPT">
            <span class="btn-icon">🖼️</span> 高清 PNG
          </button>
          <button class="btn-export svg-btn" @click="exportToSvg" title="无损矢量图，适合专业排版软件，放大不模糊">
            <span class="btn-icon">📐</span> 矢量 SVG
          </button>
        </div>
      </div>
    </header>

    <main class="main-layout">
      <aside class="sidebar">
        <div class="section-header">
          <label class="section-title">📝 工程数据源</label>
          <div class="mode-toggle">
            <button :class="{ active: inputMode === 'text' }" @click="setMode('text')">代码</button>
            <button :class="{ active: inputMode === 'table' }" @click="setMode('table')">表格</button>
          </div>
        </div>

        <div class="input-container">
          <textarea 
            v-if="inputMode === 'text'" 
            v-model="rawData" 
            class="data-input text-mode" 
            spellcheck="false"
            placeholder="格式: 代码, 时间, 紧前工作&#10;如: A, 2, -">
          </textarea>
          
          <div v-if="inputMode === 'table'" class="data-input table-mode-container">
            <table class="data-table">
              <thead>
                <tr>
                  <th width="25%">工作</th>
                  <th width="25%">时间</th>
                  <th width="40%">紧前</th>
                  <th width="10%"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(row, idx) in tableData" :key="idx">
                  <td><input v-model="row.id" type="text" placeholder="A" /></td>
                  <td><input v-model="row.dur" type="number" placeholder="0" /></td>
                  <td><input v-model="row.pre" type="text" placeholder="-" /></td>
                  <td><button class="btn-del" @click="removeRow(idx)" title="删除此行">✕</button></td>
                </tr>
              </tbody>
            </table>
            <button class="btn-add-row" @click="addRow">+ 新增一项工作</button>
          </div>
        </div>
        
        <button class="btn-generate" @click="generateGraph">
          ⚡✅一键生成🐉
        </button>

        <div class="rules-card">
          <h4>引擎特性报告</h4>
          <ul>
            <li><b>多源交集汇合</b>：严密拓扑，解决依赖丢失。</li>
            <li><b>L型避让路由</b>：全图横平竖直，完美规避重叠。</li>
            <li><b>数据双模录入</b>：文本与表格双向实时同步。</li>
            <li><b>🌟 标书级导出</b>：新增无损 SVG 矢量格式。</li>
            <li><b>高规格工业UI</b>：沉浸式点阵画布与拟态面板。</li>
          </ul>
        </div>
        <div v-if="errorMsg" class="error-msg">
          <span class="error-icon">⚠️</span> {{ errorMsg }}
        </div>
      </aside>

      <section class="canvas-container" 
               ref="canvasContainerRef"
               :class="{ 'is-dragging': isDragging }"
               @mousedown="startDrag"
               @mousemove="doDrag"
               @mouseup="stopDrag"
               @mouseleave="stopDrag"
               @wheel.prevent="handleWheel">
        <div class="svg-scaler" :style="{ transform: `scale(${zoom})`, transformOrigin: '0 0' }">
          <svg width="3200" height="1600" ref="svgRef" class="network-svg">
            <rect width="100%" height="100%" fill="#ffffff" />
            
            <defs>
              <marker id="arrow-black" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#0f172a" />
              </marker>
              <marker id="arrow-red" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
                <polygon points="0 0, 10 3.5, 0 7" fill="#ef4444" />
              </marker>
            </defs>
            
            <g v-for="e in graph.edges" :key="e.id">
              <path :d="getRulePath(e)" 
                :stroke="e.isCritical ? '#ef4444' : '#0f172a'" 
                :stroke-width="e.isCritical ? 4.5 : 3.5"
                :stroke-dasharray="e.isDummy ? '8,6' : '0'"
                fill="none" 
                :marker-end="e.isCritical ? 'url(#arrow-red)' : 'url(#arrow-black)'" />
              
              <g v-if="!e.isDummy" :transform="`translate(${e.labelX}, ${e.labelY})`">
                <text dy="-12" text-anchor="middle" font-size="18px" font-weight="900" :fill="e.isCritical ? '#ef4444' : '#0f172a'">
                  {{ e.label }}
                </text>
                <text dy="22" text-anchor="middle" font-size="14px" font-weight="bold" fill="#334155" font-family="monospace">
                  {{ e.dur }}
                </text>
              </g>
            </g>

            <g v-for="n in graph.nodes" :key="`node-${n.displayId}`" :transform="`translate(${n.x}, ${n.y})`">
              <circle r="22" fill="#ffffff" stroke="#0f172a" stroke-width="2.5" />
              <text dy=".35em" text-anchor="middle" font-size="16px" font-weight="900" fill="#0f172a" font-family="monospace">{{ n.displayId }}</text>
            </g>
          </svg>
        </div>
      </section>
    </main>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const rawData = ref('A, 2, -\nB, 3, A\nC, 2, A\nD, 3, B\nE, 2, B, C\nF, 4, C\nG, 2, D\nH, 5, D, E');
const inputMode = ref('text'); 
const tableData = ref([]);

const syncToTable = () => {
  const lines = rawData.value.trim().split('\n').filter(l => l.trim());
  tableData.value = lines.map(line => {
    const p = line.split(/[,，;；]/).map(x => x.trim());
    return { id: p[0] || '', dur: p[1] || '', pre: p.slice(2).join(', ') || '-' };
  });
  if (tableData.value.length === 0) addRow();
};

const syncToText = () => {
  rawData.value = tableData.value
    .filter(row => row.id.trim() !== '') 
    .map(row => `${row.id.trim()}, ${row.dur === '' ? '0' : row.dur}, ${row.pre.trim() || '-'}`)
    .join('\n');
};

const setMode = (mode) => {
  if (inputMode.value === mode) return;
  if (mode === 'table') { syncToTable(); } else { syncToText(); }
  inputMode.value = mode;
};

const addRow = () => tableData.value.push({ id: '', dur: '', pre: '' });
const removeRow = (idx) => tableData.value.splice(idx, 1);

const zoom = ref(0.9);
const svgRef = ref(null);
const graph = ref({ nodes: [], edges: [] });
const errorMsg = ref('');

const canvasContainerRef = ref(null);
const isDragging = ref(false);
const startX = ref(0);
const startY = ref(0);
const scrollLeft = ref(0);
const scrollTop = ref(0);

const handleWheel = (e) => {
  const delta = e.deltaY > 0 ? -0.05 : 0.05;
  zoom.value = Math.max(0.1, Math.min(3, zoom.value + delta));
};

const startDrag = (e) => {
  isDragging.value = true;
  startX.value = e.pageX - canvasContainerRef.value.offsetLeft;
  startY.value = e.pageY - canvasContainerRef.value.offsetTop;
  scrollLeft.value = canvasContainerRef.value.scrollLeft;
  scrollTop.value = canvasContainerRef.value.scrollTop;
};

const stopDrag = () => { isDragging.value = false; };

const doDrag = (e) => {
  if (!isDragging.value) return;
  e.preventDefault();
  const x = e.pageX - canvasContainerRef.value.offsetLeft;
  const y = e.pageY - canvasContainerRef.value.offsetTop;
  const walkX = (x - startX.value) * 1.2; 
  const walkY = (y - startY.value) * 1.2;
  canvasContainerRef.value.scrollLeft = scrollLeft.value - walkX;
  canvasContainerRef.value.scrollTop = scrollTop.value - walkY;
};

const getSetKey = (arr) => (arr || []).slice().sort().join(',');

const generateGraph = () => {
  errorMsg.value = '';
  if (inputMode.value === 'table') { syncToText(); }

  try {
    const lines = rawData.value.trim().split('\n').filter(l => l.trim());
    const tasks = lines.map(line => {
      const p = line.split(/[,，;；]/).map(x => x.trim());
      return { id: p[0], dur: parseInt(p[1]) || 0, pre: (p[2]==='-' || !p[2]) ? [] : p.slice(2).join(',').split(/[,，/ ]/).filter(x=>x) };
    }).filter(t => t.id);

    if (!tasks.length) return;

    const visited = new Set(), recStack = new Set();
    const checkCycle = (nodeId) => {
        visited.add(nodeId); recStack.add(nodeId);
        const task = tasks.find(t => t.id === nodeId);
        if (task) {
            for (const preId of task.pre) {
                if (!visited.has(preId)) { if (checkCycle(preId)) return true; } 
                else if (recStack.has(preId)) return true;
            }
        }
        recStack.delete(nodeId); return false;
    };
    for (const t of tasks) if (!visited.has(t.id)) if (checkCycle(t.id)) throw new Error(`检测到逻辑死循环: ${t.id}`);

    tasks.forEach(t => t.succ = []);
    tasks.forEach(t => { t.pre.forEach(pId => { const p = tasks.find(x => x.id === pId); if (p) p.succ.push(t.id); }); });

    tasks.forEach(t => {
        if (t.pre.length === 0) { t.startSet = ['START']; } 
        else {
            let intersect = null;
            for (let i = 0; i < t.pre.length; i++) {
                const pTask = tasks.find(x => x.id === t.pre[i]);
                if (pTask) {
                    if (intersect === null) { intersect = pTask.succ.slice(); } 
                    else { intersect = intersect.filter(x => pTask.succ.includes(x)); }
                }
            }
            t.startSet = intersect || [];
        }
    });

    const uniqueSets = new Map();
    tasks.forEach(t => {
        uniqueSets.set(getSetKey(t.succ), t.succ.slice().sort());
        if (t.startSet[0] !== 'START') uniqueSets.set(getSetKey(t.startSet), t.startSet.slice().sort());
    });
    uniqueSets.set('START', ['START']);

    const nodesMap = new Map();
    let nCounter = 1;
    uniqueSets.forEach((setArr, key) => { 
        nodesMap.set(key, { internalId: nCounter++, key, setArr, es: 0, lf: Infinity, trackIndex: null, layer: 0, backwardLayer: 0, visLayer: 0, inEdges: [], outEdges: [] }); 
    });

    const edges = [];
    let dId = 1;

    tasks.forEach(t => {
        const sNode = t.startSet[0] === 'START' ? nodesMap.get('START') : nodesMap.get(getSetKey(t.startSet));
        const eNode = nodesMap.get(getSetKey(t.succ));
        if (sNode && eNode) {
            const edge = { id: t.id, label: t.id, dur: t.dur, source: sNode, target: eNode, isDummy: false, isCritical: false };
            edges.push(edge);
            sNode.outEdges.push(edge); eNode.inEdges.push(edge);
        }
    });

    const setNodes = Array.from(nodesMap.values());
    for(let i=0; i<setNodes.length; i++) {
        for(let j=0; j<setNodes.length; j++) {
            if (i === j || setNodes[i].key === 'START' || setNodes[j].key === 'START') continue; 
            const nA = setNodes[i], nB = setNodes[j];
            if (nB.setArr.length === 0) continue; 
            if (nB.setArr.every(x => nA.setArr.includes(x)) && nA.setArr.length > nB.setArr.length) {
                let hasInt = false;
                for(let k=0; k<setNodes.length; k++) {
                    if (k === i || k === j || setNodes[k].key === 'START') continue;
                    const nC = setNodes[k];
                    if (nC.setArr.every(x => nA.setArr.includes(x)) && nB.setArr.every(x => nC.setArr.includes(x)) && nA.setArr.length > nC.setArr.length && nC.setArr.length > nB.setArr.length) { hasInt = true; break; }
                }
                if (!hasInt) {
                    const edge = { id: `D-${dId++}`, label: '', dur: 0, source: nA, target: nB, isDummy: true, isCritical: false };
                    edges.push(edge);
                    nA.outEdges.push(edge); nB.inEdges.push(edge);
                }
            }
        }
    }

    const nodes = Array.from(nodesMap.values());

    const seenPairs = new Set();
    const newEdges = [], newNodes = [];
    edges.forEach(e => {
        if (e.isDummy) return;
        const key = e.source.internalId + '-' + e.target.internalId;
        if (seenPairs.has(key)) {
            const mN = { internalId: nCounter++, layer: 0, backwardLayer: 0, visLayer: 0, trackIndex: null, setArr: [], es: 0, lf: Infinity, inEdges: [], outEdges: [] };
            newNodes.push(mN);
            const d = { id: `D_sp_${e.id}`, label: '', dur: 0, source: mN, target: e.target, isDummy: true, isCritical: false };
            e.target = mN; newEdges.push(d);
            mN.outEdges.push(d); e.target.inEdges.push(d);
        } else { seenPairs.add(key); }
    });
    nodes.push(...newNodes); edges.push(...newEdges);

    const leafNodes = nodes.filter(n => n.outEdges.length === 0);
    if (leafNodes.length > 1) {
        const finalN = { internalId: nCounter++, key: 'FINAL', setArr: [], layer: 0, backwardLayer: 0, visLayer: 0, es: 0, lf: Infinity, trackIndex: null, inEdges: [], outEdges: [] };
        nodes.push(finalN);
        leafNodes.forEach(ln => {
            const d = { id: `D_FIN_${dId++}`, label: '', dur: 0, source: ln, target: finalN, isDummy: true, isCritical: false };
            edges.push(d);
            ln.outEdges.push(d); finalN.inEdges.push(d);
        });
    }

    nodes.forEach(n => n.inDegree = n.inEdges.length);
    const sorted = [];
    const queue = nodes.filter(n => n.inDegree === 0);
    while(queue.length > 0) {
        const u = queue.shift();
        sorted.push(u);
        u.outEdges.forEach(e => { e.target.inDegree--; if (e.target.inDegree === 0) queue.push(e.target); });
    }

    nodes.forEach(n => n.layer = 0);
    sorted.forEach(n => { n.outEdges.forEach(e => { const inc = e.isDummy ? 0 : 1; e.target.layer = Math.max(e.target.layer, n.layer + inc); }); });
    const maxLayer = Math.max(...nodes.map(n => n.layer));
    nodes.forEach(n => n.backwardLayer = maxLayer);
    [...sorted].reverse().forEach(n => { if (n.outEdges.length > 0) { n.backwardLayer = Math.min(...n.outEdges.map(e => e.target.backwardLayer - (e.isDummy ? 0 : 1))); } });

    nodes.forEach(n => n.es = 0);
    sorted.forEach(n => { n.outEdges.forEach(e => { e.target.es = Math.max(e.target.es, n.es + e.dur); }); });
    const maxTime = Math.max(...nodes.map(n=>n.es));
    nodes.forEach(n => n.lf = maxTime);
    [...sorted].reverse().forEach(n => { n.inEdges.forEach(e => { e.source.lf = Math.min(e.source.lf, e.target.lf - e.dur); }); });
    
    edges.forEach(e => { const tf = e.target.lf - e.source.es - e.dur; e.isCritical = (tf === 0); });

    nodes.forEach(n => { n.visLayer = (n.lf - n.es === 0) ? n.layer : n.backwardLayer; });

    nodes.forEach(n => n.trackIndex = null);
    sorted.forEach(n => {
        if (n.trackIndex !== null) return;
        const realIns = n.inEdges.filter(e => !e.isDummy);
        const allIns = n.inEdges;
        if (realIns.length === 1) {
            const sNode = realIns[0].source;
            const siblings = sNode.outEdges.filter(e => !e.isDummy);
            if (siblings.length > 1) {
                siblings.sort((a,b) => a.id.localeCompare(b.id)); 
                const idx = siblings.indexOf(realIns[0]);
                const step = siblings.length === 2 ? 2 : 1; 
                n.preferredTrack = (sNode.trackIndex || 0) + (idx - (siblings.length - 1) / 2) * step;
            } else { n.preferredTrack = sNode.trackIndex || 0; }
        } else if (allIns.length > 0) {
            n.preferredTrack = allIns.reduce((acc, e) => acc + (e.source.trackIndex || 0), 0) / allIns.length;
        } else { n.preferredTrack = 0; }
        
        n.trackIndex = Math.round(n.preferredTrack);
        let offset = 0;
        const hasColl = (t) => nodes.some(o => o.visLayer === n.visLayer && o !== n && o.trackIndex === t);
        while (hasColl(n.trackIndex)) {
            offset++;
            if (!hasColl(Math.round(n.preferredTrack) - offset)) { n.trackIndex = Math.round(n.preferredTrack) - offset; break; }
            if (!hasColl(Math.round(n.preferredTrack) + offset)) { n.trackIndex = Math.round(n.preferredTrack) + offset; break; }
        }
    });

    const X_SPACING = 200, GRID_Y = 160, CENTER_Y = 500; 
    nodes.forEach(n => {
        n.x = n.visLayer * X_SPACING + 100;
        n.y = CENTER_Y + n.trackIndex * GRID_Y;
    });

    nodes.sort((a,b) => a.x - b.x || a.y - b.y).forEach((n, i) => n.displayId = i + 1);
    graph.value = { nodes, edges };
  } catch (err) { errorMsg.value = err.message; }
};

const getRulePath = (e) => {
  const s = e.source, t = e.target, r = 22; 
  if (!s || !t) return '';
  const dx = t.x - s.x; const dy = t.y - s.y;

  if (Math.abs(dy) < 1) {
    e.labelX = s.x + dx / 2; e.labelY = s.y;
    return `M ${s.x + r} ${s.y} L ${t.x - r} ${t.y}`;
  } else if (Math.abs(dx) < 1) {
    e.labelX = s.x; e.labelY = s.y + dy / 2;
    const sign = Math.sign(dy);
    return `M ${s.x} ${s.y + sign * r} L ${t.x} ${t.y - sign * r}`;
  } else {
    if (Math.abs(t.trackIndex) < Math.abs(s.trackIndex)) {
      const sign = Math.sign(dy);
      e.labelX = s.x + dx / 2; e.labelY = s.y;
      return `M ${s.x + r} ${s.y} L ${t.x} ${s.y} L ${t.x} ${t.y - sign * r}`;
    } else if (Math.abs(t.trackIndex) > Math.abs(s.trackIndex)) {
      const sign = Math.sign(dy);
      e.labelX = s.x + dx / 2; e.labelY = t.y;
      return `M ${s.x} ${s.y + sign * r} L ${s.x} ${t.y} L ${t.x - r} ${t.y}`;
    } else {
      const midX = s.x + dx / 2;
      e.labelX = (midX + t.x) / 2; e.labelY = t.y;
      return `M ${s.x + r} ${s.y} L ${midX} ${s.y} L ${midX} ${t.y} L ${t.x - r} ${t.y}`;
    }
  }
};

// 🌟 修改点 3：优化导出功能，保留原 PNG 导出
const exportToPng = () => {
  if(!svgRef.value) return;
  const svg = svgRef.value;
  const serializer = new XMLSerializer();
  const source = '<?xml version="1.0" standalone="no"?>\r\n' + serializer.serializeToString(svg);
  const canvas = document.createElement("canvas");
  canvas.width = svg.clientWidth * 2; canvas.height = svg.clientHeight * 2;
  const ctx = canvas.getContext("2d");
  const img = new Image();
  img.onload = () => {
    ctx.scale(2, 2); ctx.fillStyle = "white"; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0);
    const a = document.createElement("a"); a.download = `标书级网络图_高清版.png`;
    a.href = canvas.toDataURL("image/png"); a.click();
  };
  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(source)));
};

// 🌟 修改点 4：新增 SVG 矢量导出功能，极致清晰
const exportToSvg = () => {
  if(!svgRef.value) return;
  const svg = svgRef.value;
  const serializer = new XMLSerializer();
  let source = serializer.serializeToString(svg);
  // 添加 XML 声明，确保在专业设计软件中完美兼容
  if (!source.match(/^<\?xml/)) {
    source = '<?xml version="1.0" standalone="no"?>\r\n' + source;
  }
  const url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(source);
  const a = document.createElement("a");
  a.download = `标书级网络图_矢量版.svg`;
  a.href = url;
  a.click();
};

onMounted(() => generateGraph());
</script>

<style scoped>
.app-wrapper { 
  height: 100vh; 
  width: 100vw; 
  max-width: 100%; 
  overflow: hidden; 
  display: flex; 
  flex-direction: column; 
  background: #f1f5f9; 
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; 
}

/* 顶级 Navbar */
.navbar { 
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%); 
  color: white; 
  padding: 14px 28px; 
  display: flex; justify-content: space-between; align-items: center; 
  box-shadow: 0 4px 20px rgba(0,0,0,0.15); 
  z-index: 20;
}
.logo { display: flex; align-items: center; gap: 8px; }
.logo .icon { font-size: 20px; }
.logo .title { font-size: 16px; font-weight: 800; letter-spacing: 0.5px; display: flex; align-items: center; gap: 6px;}
.logo .badge { background: #3b82f6; font-size: 10px; padding: 2px 6px; border-radius: 4px; font-weight: bold; letter-spacing: 1px;}
.logo .subtitle { font-size: 13px; color: #94a3b8; margin-left: 8px; border-left: 1px solid #475569; padding-left: 12px; font-weight: 500;}

/* 工具栏控制 */
.toolbar { display: flex; align-items: center; gap: 20px; }
.zoom-controls { display: flex; align-items: center; background: rgba(255,255,255,0.1); backdrop-filter: blur(8px); border-radius: 8px; overflow: hidden; border: 1px solid rgba(255,255,255,0.05); }
.zoom-controls button { background: transparent; color: white; border: none; padding: 8px 14px; cursor: pointer; font-weight: bold; transition: background 0.2s;}
.zoom-controls button:hover { background: rgba(255,255,255,0.15); }
.zoom-level { font-family: monospace; font-size: 13px; width: 48px; text-align: center; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); font-weight: bold;}

/* 🌟 修改点 5：按钮组样式 */
.export-group { display: flex; gap: 10px; }
.btn-export { background: #ffffff; color: #0f172a; border: none; padding: 8px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; display: flex; align-items: center; gap: 6px; transition: all 0.2s; box-shadow: 0 2px 10px rgba(0,0,0,0.1);}
.btn-export:hover { background: #f8fafc; transform: translateY(-1px); box-shadow: 0 4px 15px rgba(0,0,0,0.15);}
.btn-export .btn-icon { font-size: 14px; }
/* SVG 按钮做轻微强调 */
.svg-btn { background: #eff6ff; color: #1d4ed8; border: 1px solid #bfdbfe; }
.svg-btn:hover { background: #dbeafe; }

.main-layout { flex: 1; display: flex; overflow: hidden; width: 100%; }

/* 侧边栏面板 */
.sidebar { 
  width: 380px; 
  background: rgba(255, 255, 255, 0.95); 
  backdrop-filter: blur(12px); 
  border-right: 1px solid #e2e8f0; 
  padding: 28px; 
  display: flex; flex-direction: column; gap: 24px; 
  z-index: 10;
  box-shadow: 2px 0 20px rgba(0,0,0,0.02);
}

.section-header { display: flex; justify-content: space-between; align-items: center; }
.section-title { font-weight: 800; color: #0f172a; font-size: 15px; display: flex; align-items: center; gap: 6px;}

/* 切换开关 */
.mode-toggle { display: flex; background: #f1f5f9; border-radius: 8px; padding: 4px; box-shadow: inset 0 1px 3px rgba(0,0,0,0.05); }
.mode-toggle button { border: none; background: transparent; padding: 6px 16px; font-size: 13px; font-weight: 700; color: #64748b; cursor: pointer; transition: all 0.2s; border-radius: 6px;}
.mode-toggle button.active { background: white; color: #0f172a; box-shadow: 0 2px 6px rgba(0,0,0,0.08); }

/* 输入区统一样式 */
.input-container { flex-shrink: 0; }
.data-input { width: 100%; height: 260px; border: 1px solid #cbd5e1; border-radius: 10px; font-size: 14px; background: #ffffff; box-shadow: 0 2px 10px rgba(0,0,0,0.02); transition: border-color 0.2s;}
.data-input:focus-within { border-color: #3b82f6; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1); }
.text-mode { padding: 16px; font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, monospace; outline: none; line-height: 1.6; resize: vertical; color: #1e293b; }

.table-mode-container { overflow-y: auto; display: flex; flex-direction: column; }
.data-table { width: 100%; border-collapse: collapse; text-align: left; }
.data-table th { background: #f8fafc; padding: 10px; font-size: 12px; font-weight: 700; color: #475569; position: sticky; top: 0; z-index: 1; border-bottom: 1px solid #e2e8f0;}
.data-table td { padding: 4px; border-bottom: 1px solid #f1f5f9; }
.data-table input { width: 100%; border: 1px solid transparent; padding: 8px; border-radius: 6px; outline: none; transition: all 0.2s; font-family: monospace; color: #0f172a;}
.data-table input:focus { border: 1px solid #93c5fd; background: #eff6ff; }
.btn-del { border: none; background: transparent; color: #cbd5e1; cursor: pointer; font-weight: bold; width: 100%; font-size: 14px;}
.btn-del:hover { color: #ef4444; }
.btn-add-row { border: none; background: #f8fafc; color: #3b82f6; padding: 12px; cursor: pointer; font-weight: 700; font-size: 13px; margin-top: auto; border-radius: 0 0 10px 10px; border-top: 1px solid #e2e8f0;}
.btn-add-row:hover { background: #f1f5f9; }

/* 生成按钮 */
.btn-generate { 
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%); 
  color: white; border: none; padding: 14px; border-radius: 10px; 
  font-weight: 800; font-size: 15px; cursor: pointer; 
  box-shadow: 0 4px 15px rgba(59, 130, 246, 0.3); 
  transition: all 0.2s; 
}
.btn-generate:hover { transform: translateY(-2px); box-shadow: 0 6px 20px rgba(59, 130, 246, 0.4); }
.btn-generate:active { transform: translateY(0); }

/* 信息面板 */
.rules-card { background: #f8fafc; border-left: 4px solid #3b82f6; padding: 18px; border-radius: 8px; box-shadow: inset 0 0 0 1px #e2e8f0; }
.rules-card h4 { margin: 0 0 10px 0; color: #0f172a; font-size: 13px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.5px;}
.rules-card ul { padding-left: 18px; margin: 0; color: #475569; font-size: 13px; line-height: 1.7;}
.rules-card b { color: #1e293b; }

.error-msg { background: #fef2f2; color: #b91c1c; border-radius: 8px; border: 1px solid #fecaca; padding: 12px; font-size: 13px; font-weight: bold; display: flex; align-items: center; gap: 8px;}

/* 画布区 */
.canvas-container { 
  flex: 1; overflow: auto; padding: 60px; 
  background-color: #f1f5f9;
  background-image: radial-gradient(#cbd5e1 1.5px, transparent 1.5px);
  background-size: 24px 24px;
  cursor: grab;
}
.canvas-container.is-dragging { cursor: grabbing; user-select: none; }

/* SVG 画板容器 */
.svg-scaler { 
  display: inline-block; 
  background: white; 
  border-radius: 16px; 
  box-shadow: 0 20px 60px -15px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.02); 
  padding: 0; 
  transition: transform 0.05s ease-out; 
}
</style>