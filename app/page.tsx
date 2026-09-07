'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Box, ChevronDown, ChevronRight, Columns3, Eye, EyeOff, Layers, Maximize2, Moon, Move, PlayCircle, RotateCcw, Ruler, Sun, X, ZoomIn, ZoomOut } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import type { ViewerAPI } from './viewer';
import { publicAsset } from '@/lib/public-asset';

const views = [
  { key: 'overall', label: '全景', title: '建筑全貌' },
  { key: 'front', label: '正面', title: '南立面' },
  { key: 'hall', label: '一层大厅', title: '一层大厅' },
  { key: 'bracket', label: '斗拱近景', title: '檐下斗拱' },
  { key: 'side', label: '侧面', title: '东立面' },
  { key: 'back', label: '背面', title: '北立面' },
  { key: 'top', label: '俯视', title: '俯瞰屋顶' },
  { key: 'upper', label: '二层梁架', title: '二层梁架' },
  { key: 'stairs', label: '室内楼梯', title: '盘旋楼梯' },
  { key: 'vault', label: '十字券洞', title: '十字券洞' },
  { key: 'finial', label: '鎏金宝顶', title: '鎏金宝顶' },
];

export default function Home() {
  const host = useRef<HTMLDivElement>(null);
  const api = useRef<ViewerAPI | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const [ready, setReady] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState('');
  const [fallback, setFallback] = useState(false);
  const [camera, setCamera] = useState('overall');
  const [roofs, setRoofs] = useState(true);
  const [doors, setDoors] = useState(true);
  const [dimensions, setDimensions] = useState(false);
  const [night, setNight] = useState(false);
  const [spin, setSpin] = useState(false);
  const [explode, setExplode] = useState(0);
  const [panel, setPanel] = useState(true);
  const [allViews, setAllViews] = useState(false);
  const [focused, setFocused] = useState(false);
  const activeView = views.find(view => view.key === camera)!;
  const disabled = !ready || fallback;

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => { if (event.key === 'Escape') setFocused(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    const compact = window.matchMedia('(max-width: 520px)');
    const updatePanel = () => setPanel(!compact.matches);
    updatePanel();
    compact.addEventListener('change', updatePanel);
    return () => compact.removeEventListener('change', updatePanel);
  }, []);

  useEffect(() => {
    let disposed = false;
    import('./viewer').then(async ({ createViewer }) => {
      if (!host.current || disposed) return;
      const viewer = await createViewer(host.current, {
        onLoad: () => { if (!disposed) setReady(true); },
        onProgress: value => { if (!disposed) setProgress(value); },
        onError: message => { if (!disposed) setError(message); },
      });
      if (disposed) viewer.dispose();
      else api.current = viewer;
    }).catch((cause: unknown) => {
      console.error('钟楼展示初始化失败', cause);
      if (!disposed) { setError('三维展示初始化失败，可重新加载后重试。'); setFallback(true); setReady(true); }
    });
    return () => { disposed = true; api.current?.dispose(); api.current = null; };
  }, []);

  function view(key: string) { setCamera(key); setSpin(false); api.current?.camera(key); }
  function reset() {
    setCamera('overall'); setRoofs(true); setDoors(true); setDimensions(false);
    setNight(false); setSpin(false); setExplode(0); api.current?.reset();
  }
  function toggle(key: string, value: boolean, setter: (value: boolean) => void) {
    setter(value); api.current?.set(key, value);
  }
  function enter() { view('hall'); setAllViews(true); }

  return <div className={`exhibition${night ? ' is-night' : ''}${focused ? ' is-focused' : ''}`}>
    <header className="site-header">
      <button className="brand" onClick={reset} aria-label="西安钟楼，返回全景">
        <img className="brand-seal" src={publicAsset('favicon.svg')} alt="" width="46" height="46" />
        <span>西安钟楼</span>
      </button>
      <nav className="mode-nav" aria-label="浏览模式">
        <button aria-pressed={!focused} onClick={() => setFocused(false)}>建筑概览</button>
        <button aria-pressed={focused} onClick={() => setFocused(true)}>专注浏览</button>
      </nav>
      <button className="about-link" onClick={() => dialog.current?.showModal()}>复原说明 <ArrowRight size={14} /></button>
    </header>

    <main className="exhibit-main">
      <section className="introduction" aria-labelledby="tower-title">
        <h1 id="tower-title">西安钟楼</h1>
        <p className="english-title">XI’AN BELL TOWER</p>
        <div className="intro-rule" />
        <p className="era">明 · 洪武十七年 / 1384</p>
        <p className="description">重檐三滴水，四角攒尖顶。</p>
        <button className="enter-button" onClick={enter} disabled={!ready}>走进建筑 <ArrowRight size={22} strokeWidth={1.2} /></button>
        <dl className="metrics"><div><dt>建筑总高</dt><dd>36 <small>m</small></dd></div><div><dt>基座边长</dt><dd>35.5 <small>m</small></dd></div></dl>
        <img className="tower-sketch" src={publicAsset('images/tower-sketch.png')} alt="" width="280" height="140" />
      </section>

      <section className="model-stage" aria-label="西安钟楼三维模型">
        <div ref={host} className="canvas-wrap" />
        {fallback && <div className="render-fallback"><img src={publicAsset(`model/views/${camera}.jpg`)} alt={`${activeView.title}：模型渲染图`} /><p>{error} 当前显示静态预览。</p><button onClick={() => location.reload()}>重新加载三维模型</button></div>}
        {!ready && <div className="loading" role="status">{error ? <><strong>模型暂时无法显示</strong><p>{error}</p><button onClick={() => location.reload()}>重新加载</button></> : <><span className="spinner" /><span>正在载入建筑与材质{progress > 0 ? ` ${progress}%` : ''}</span><p>初次相见，稍候片刻</p></>}</div>}
        <div className="view-caption" aria-live="polite">{camera !== 'overall' && activeView.title}</div>
      </section>

      <aside className="inspector" aria-label="构件控制">
        <button className="panel-heading" aria-expanded={panel} aria-controls="component-controls" onClick={() => setPanel(!panel)}><Layers size={22} strokeWidth={1.3} /><span>构件控制</span><ChevronDown size={18} className={panel ? '' : 'collapsed'} /></button>
        {panel && <div className="control-panel" id="component-controls">
          <button className="control-row" aria-label="屋顶与屋檐" aria-pressed={roofs} disabled={disabled} onClick={() => toggle('roofs', !roofs, setRoofs)}><Columns3 size={16} /><span>屋顶与屋檐</span>{roofs ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          <button className="control-row" aria-label="门窗围护" aria-pressed={doors} disabled={disabled} onClick={() => toggle('doors', !doors, setDoors)}><Box size={16} /><span>门窗围护</span>{doors ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          <button className="control-row" aria-label="尺寸标注" aria-pressed={dimensions} disabled={disabled} onClick={() => toggle('dimensions', !dimensions, setDimensions)}><Ruler size={16} /><span>尺寸标注</span>{dimensions ? <Eye size={18} /> : <EyeOff size={18} />}</button>
          <div className="explode-control"><label htmlFor="explode"><Maximize2 size={16} />分层展开 <span>{explode}%</span></label><input id="explode" type="range" min="0" max="100" step="1" value={explode} disabled={disabled} onChange={event => { const value = Number(event.target.value); setExplode(value); api.current?.explode(value); }} /></div>
          <div className="lighting-control">
            <label className="switch-row" htmlFor="night">{night ? <Moon size={16} /> : <Sun size={16} />}夜间灯光<Switch id="night" checked={night} disabled={disabled} onCheckedChange={value => toggle('night', value, setNight)} /></label>
          </div>
        </div>}
      </aside>

    </main>
    <footer className="viewer-dock" aria-label="模型浏览工具">
      <nav className={`view-gallery${allViews ? ' is-expanded' : ''}`} id="view-gallery" aria-label="建筑视角">
        <button className="views-toggle" aria-expanded={allViews} aria-controls="view-gallery-track" onClick={() => setAllViews(!allViews)}>{allViews ? '常用视角' : '全部视角'}<ChevronRight size={14} /></button>
        <div className="thumbnail-track" id="view-gallery-track">{(allViews ? views : views.slice(0, 4)).map(item => <button key={item.key} className={`view-thumbnail${camera === item.key ? ' active' : ''}`} disabled={!ready} aria-pressed={camera === item.key} onClick={() => view(item.key)}><span className="thumbnail-image"><img src={publicAsset(`model/views/${item.key}.jpg`)} alt="" width="180" height="140" /></span><span>{item.label}</span></button>)}</div>
      </nav>

      <div className="navigation-tools">
        <div className="orbit-toolbar" aria-label="模型操作">
          <button disabled={disabled} onClick={() => api.current?.zoom(.9)} aria-label="放大模型"><ZoomIn size={21} strokeWidth={1.3} />放大</button>
          <button className="zoom-out" disabled={disabled} onClick={() => api.current?.zoom(1/.9)} aria-label="缩小模型"><ZoomOut size={20} strokeWidth={1.3} /></button>
          <button disabled={disabled} onClick={() => view('overall')} title="让完整建筑重新进入画面"><Maximize2 size={18} />完整入画</button>
          <button disabled={!ready} onClick={reset}><RotateCcw size={21} strokeWidth={1.3} />复位</button>
        </div>
        <label className="auto-rotate" htmlFor="spin"><PlayCircle size={19} strokeWidth={1.3} /><span>自动旋转</span><Switch id="spin" checked={spin} disabled={disabled} onCheckedChange={value => toggle('spin', value, setSpin)} /></label>
      </div>
      <p className="gesture-hint"><Move size={12} />{fallback ? '点击缩略图切换视角' : '拖动旋转 · 滚轮缩放 · 右键平移'}</p>
    </footer>

    <dialog className="about-dialog" ref={dialog} aria-labelledby="about-title" onClick={event => { if (event.target === event.currentTarget) dialog.current?.close(); }}>
      <button className="dialog-close" aria-label="关闭复原说明" onClick={() => dialog.current?.close()}><X size={22} /></button>
      <p className="dialog-eyebrow">XI’AN BELL TOWER</p><h2 id="about-title">关于这座钟楼</h2>
      <p>模型采用 1:1 尺度，1 单位为 1 米。基座主体边长 35.5 米，建筑总高 36 米。</p>
      <p>整体尺度依据公开资料；楼梯走向、斗拱节点、屋面曲线及局部雕饰属于研究性推定。本模型用于建筑展示与研究示意，非修缮施工测绘图。</p>
      <span className="dialog-footnote">两层楼阁 · 三重檐 · 四角攒尖顶</span>
    </dialog>
  </div>;
}
