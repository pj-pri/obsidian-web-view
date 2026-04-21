/* Lightweight force-directed graph using SVG + requestAnimationFrame */
window.GraphView = function GraphView({ nodes, links, activeId, onNodeClick, theme }) {
  const svgRef = React.useRef(null);
  const stateRef = React.useRef(null);
  const [tick, setTick] = React.useState(0);

  // Initialize positions
  React.useEffect(() => {
    const w = svgRef.current?.clientWidth || 400;
    const h = svgRef.current?.clientHeight || 400;
    const byId = {};
    const nodesState = nodes.map((n, i) => {
      const angle = (i / nodes.length) * Math.PI * 2;
      const r = Math.min(w, h) * 0.32;
      const node = {
        id: n.id,
        label: n.label,
        degree: n.degree || 1,
        x: w / 2 + Math.cos(angle) * r + (Math.random() - 0.5) * 20,
        y: h / 2 + Math.sin(angle) * r + (Math.random() - 0.5) * 20,
        vx: 0, vy: 0,
        fx: null, fy: null,
      };
      byId[n.id] = node;
      return node;
    });
    const linksState = links.map(l => ({
      source: byId[l.source],
      target: byId[l.target],
    })).filter(l => l.source && l.target);
    stateRef.current = { nodes: nodesState, links: linksState, w, h, zoom: 1, panX: 0, panY: 0 };
    setTick(t => t + 1);
  }, [nodes.length, links.length]);

  // Simulation loop
  React.useEffect(() => {
    let raf;
    let iters = 0;
    const step = () => {
      const s = stateRef.current;
      if (!s) { raf = requestAnimationFrame(step); return; }
      const { nodes: ns, links: ls, w, h } = s;
      const cx = w / 2, cy = h / 2;

      // Repulsion
      for (let i = 0; i < ns.length; i++) {
        const a = ns[i];
        for (let j = i + 1; j < ns.length; j++) {
          const b = ns[j];
          let dx = a.x - b.x, dy = a.y - b.y;
          let dist2 = dx * dx + dy * dy;
          if (dist2 < 0.01) { dx = Math.random() - 0.5; dy = Math.random() - 0.5; dist2 = 0.01; }
          const dist = Math.sqrt(dist2);
          const force = 1800 / dist2;
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          a.vx += fx; a.vy += fy;
          b.vx -= fx; b.vy -= fy;
        }
      }

      // Spring (links)
      ls.forEach(l => {
        const dx = l.target.x - l.source.x;
        const dy = l.target.y - l.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const desired = 90;
        const k = 0.02;
        const f = (dist - desired) * k;
        const fx = (dx / dist) * f;
        const fy = (dy / dist) * f;
        l.source.vx += fx; l.source.vy += fy;
        l.target.vx -= fx; l.target.vy -= fy;
      });

      // Center gravity
      ns.forEach(n => {
        n.vx += (cx - n.x) * 0.005;
        n.vy += (cy - n.y) * 0.005;
      });

      // Integrate with damping
      ns.forEach(n => {
        if (n.fx != null) { n.x = n.fx; n.y = n.fy; n.vx = 0; n.vy = 0; return; }
        n.vx *= 0.85;
        n.vy *= 0.85;
        n.x += n.vx;
        n.y += n.vy;
      });

      iters++;
      if (iters < 600) {
        setTick(t => t + 1);
        raf = requestAnimationFrame(step);
      }
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [tick === 0 ? 0 : Math.floor(tick / 1000)]); // restart if reinit

  // Drag handling
  const dragRef = React.useRef(null);
  const panRef = React.useRef(null);
  const onSvgMouseDown = (e) => {
    if (e.target.tagName !== 'circle') {
      panRef.current = { x: e.clientX, y: e.clientY, panX: stateRef.current.panX, panY: stateRef.current.panY };
    }
  };
  const onMouseMove = (e) => {
    if (dragRef.current) {
      const rect = svgRef.current.getBoundingClientRect();
      const node = dragRef.current.node;
      const s = stateRef.current;
      node.fx = (e.clientX - rect.left - s.panX) / s.zoom;
      node.fy = (e.clientY - rect.top - s.panY) / s.zoom;
      setTick(t => t + 1);
    } else if (panRef.current) {
      const s = stateRef.current;
      s.panX = panRef.current.panX + (e.clientX - panRef.current.x);
      s.panY = panRef.current.panY + (e.clientY - panRef.current.y);
      setTick(t => t + 1);
    }
  };
  const onMouseUp = () => {
    if (dragRef.current) {
      dragRef.current.node.fx = null;
      dragRef.current.node.fy = null;
    }
    dragRef.current = null;
    panRef.current = null;
  };
  React.useEffect(() => {
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  const onWheel = (e) => {
    e.preventDefault();
    const s = stateRef.current;
    if (!s) return;
    const rect = svgRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    const factor = e.deltaY < 0 ? 1.1 : 0.9;
    const newZoom = Math.max(0.2, Math.min(3, s.zoom * factor));
    // Keep pointer stable
    s.panX = mx - (mx - s.panX) * (newZoom / s.zoom);
    s.panY = my - (my - s.panY) * (newZoom / s.zoom);
    s.zoom = newZoom;
    setTick(t => t + 1);
  };

  const s = stateRef.current;
  return (
    <div className="graph-container">
      <svg
        ref={svgRef}
        onMouseDown={onSvgMouseDown}
        onWheel={onWheel}
      >
        {s && (
          <g transform={`translate(${s.panX},${s.panY}) scale(${s.zoom})`}>
            {s.links.map((l, i) => (
              <line
                key={i}
                x1={l.source.x} y1={l.source.y}
                x2={l.target.x} y2={l.target.y}
                stroke="var(--graph-link)"
                strokeWidth={1 / s.zoom}
                opacity={0.8}
              />
            ))}
            {s.nodes.map((n, i) => {
              const isActive = n.id === activeId;
              const r = Math.max(4, Math.min(14, 4 + Math.sqrt(n.degree) * 2));
              return (
                <g key={n.id}>
                  <circle
                    cx={n.x} cy={n.y} r={r}
                    fill={isActive ? 'var(--graph-node-active)' : 'var(--graph-node)'}
                    stroke={isActive ? 'var(--graph-node-active)' : 'transparent'}
                    strokeWidth={3 / s.zoom}
                    style={{ cursor: 'pointer' }}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      dragRef.current = { node: n, startX: e.clientX, startY: e.clientY, moved: false };
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onNodeClick && onNodeClick(n.id);
                    }}
                  />
                  {(s.zoom > 0.6 || isActive) && (
                    <text
                      x={n.x} y={n.y + r + 12}
                      fontSize={11 / Math.max(s.zoom, 0.8)}
                      textAnchor="middle"
                      fill="var(--graph-label)"
                      style={{ pointerEvents: 'none', userSelect: 'none' }}
                    >
                      {n.label.length > 24 ? n.label.slice(0, 22) + '…' : n.label}
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}
      </svg>
      <div className="graph-legend">
        <div className="lg-row"><span className="lg-dot" style={{background: 'var(--graph-node)'}}></span>Note</div>
        <div className="lg-row"><span className="lg-dot" style={{background: 'var(--graph-node-active)'}}></span>Current</div>
        <div className="lg-row" style={{color: 'var(--text-faint)', marginTop: 4}}>Scroll to zoom · drag nodes</div>
      </div>
    </div>
  );
};
