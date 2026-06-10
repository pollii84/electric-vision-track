'use client';

import { useState, useRef, useEffect } from 'react';
import Layout from '@/components/Layout';
import { useI18n } from '@/lib/i18n';
import { useToast } from '@/contexts/ToastContext';

// Site drawings mapping (populated from Firestore in production)
const SITE_DRAWINGS = {};

const INITIAL_PINS = [];

const INITIAL_TASKS = [];

// Site documents and permits (populated from Firestore in production)
const SITE_DOCUMENTS = {};

export default function PlanViewerPage() {
  const { t } = useI18n();
  const { addToast } = useToast();

  const [selectedSiteId, setSelectedSiteId] = useState('');
  const [selectedDrawing, setSelectedDrawing] = useState(null);
  const [tasks, setTasks] = useState(INITIAL_TASKS);
  const [pins, setPins] = useState(INITIAL_PINS);
  const [selectedPin, setSelectedPin] = useState(null);
  
  // Interactive Canvas Canvas Control
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isDrag, setIsDrag] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  
  // Mode controls
  const [pinMode, setPinMode] = useState(false); // Enable to drop task pin
  const [clickCoords, setClickCoords] = useState(null);
  const [showPinModal, setShowPinModal] = useState(false);
  const [taskToPinId, setTaskToPinId] = useState('');
  
  // Sidebar drawer info
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState(null);
  
  // Camera capture simulation
  const [showCameraSim, setShowCameraSim] = useState(false);
  const [simulatedPhotoUrl, setSimulatedPhotoUrl] = useState('');
  
  // Change Order Modal
  const [showChangeOrderModal, setShowChangeOrderModal] = useState(false);
  const [coHours, setCoHours] = useState('');
  const [coMaterials, setCoMaterials] = useState('');
  const [coMaterialQty, setCoMaterialQty] = useState('1');
  const [coReason, setCoReason] = useState('');

  const containerRef = useRef(null);

  // Sync active site draw selection
  useEffect(() => {
    const drawings = SITE_DRAWINGS[selectedSiteId] || [];
    setSelectedDrawing(drawings.length > 0 ? drawings[0] : null);
    setSelectedPin(null);
    setDrawerOpen(false);
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [selectedSiteId]);

  const handleZoom = (factor) => {
    setZoom((z) => Math.max(0.5, Math.min(4, z * factor)));
  };

  const handleResetZoom = () => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  };

  // Drag logic for Panning
  const handleMouseDown = (e) => {
    if (pinMode) return;
    setIsDrag(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e) => {
    if (!isDrag) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y
    });
  };

  const handleMouseUp = () => {
    setIsDrag(false);
  };

  const handleCanvasClick = (e) => {
    if (!pinMode) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setClickCoords({ x, y });
    
    // Check if there are unpinned tasks for this site
    const unpinnedTasks = tasks.filter(
      (t) => t.siteId === selectedSiteId && !pins.some((p) => p.taskId === t.id)
    );

    if (unpinnedTasks.length === 0) {
      addToast(t('planViewer.noTasksToPin'), 'warning');
      setPinMode(false);
      return;
    }

    setTaskToPinId(unpinnedTasks[0].id);
    setShowPinModal(true);
  };

  const handleSavePin = () => {
    if (!taskToPinId || !clickCoords) return;

    const newPin = {
      id: `pin-${Date.now()}`,
      drawingId: selectedDrawing.id,
      taskId: taskToPinId,
      x: parseFloat(clickCoords.x.toFixed(2)),
      y: parseFloat(clickCoords.y.toFixed(2))
    };

    setPins((prev) => [...prev, newPin]);
    
    // Update task's pin coordinate details
    setTasks((prev) =>
      prev.map((t) => (t.id === taskToPinId ? { ...t, pinCoords: { x: newPin.x, y: newPin.y } } : t))
    );

    addToast('Task successfully pinned to drawing!', 'success');
    setShowPinModal(false);
    setPinMode(false);
    setClickCoords(null);
  };

  const handlePinClick = (pin, e) => {
    e.stopPropagation();
    const task = tasks.find((t) => t.id === pin.taskId);
    if (task) {
      setDrawerTask(task);
      setSelectedPin(pin.id);
      setDrawerOpen(true);
    }
  };

  const handleSimulatePhoto = () => {
    setShowCameraSim(true);
    setSimulatedPhotoUrl('');
  };

  const handleCapturePhoto = () => {
    // Generate a random wiring box / electrical photo mock URL
    const demoPhotos = [
      'https://images.unsplash.com/photo-1581092160607-ee22621dd758?auto=format&fit=crop&w=400&q=80', // Control Panel wires
      'https://images.unsplash.com/photo-1621905251189-08b45d6a269e?auto=format&fit=crop&w=400&q=80', // Outlet installation
      'https://images.unsplash.com/photo-1473341304170-971dccb5ac1e?auto=format&fit=crop&w=400&q=80'  // Cable lines conduit
    ];
    const snapped = demoPhotos[Math.floor(Math.random() * demoPhotos.length)];
    setSimulatedPhotoUrl(snapped);
  };

  const handleSavePhoto = () => {
    if (!simulatedPhotoUrl || !drawerTask) return;
    
    setTasks((prev) =>
      prev.map((t) =>
        t.id === drawerTask.id
          ? { ...t, photos: [...(t.photos || []), { url: simulatedPhotoUrl, date: new Date().toLocaleDateString() }] }
          : t
      )
    );

    // Sync active drawer task state
    setDrawerTask((prev) => ({
      ...prev,
      photos: [...(prev.photos || []), { url: simulatedPhotoUrl, date: new Date().toLocaleDateString() }]
    }));

    addToast(t('tasksAdditions.photoCaptured'), 'success');
    setShowCameraSim(false);
  };

  const handleSaveChangeOrder = () => {
    if (!coHours && !coMaterials) return;

    const newCO = {
      id: `co-${Date.now()}`,
      hours: Number(coHours) || 0,
      material: coMaterials || 'N/A',
      materialQty: Number(coMaterialQty) || 0,
      reason: coReason || 'Change of scope requested by engineer',
      date: new Date().toLocaleDateString()
    };

    setTasks((prev) =>
      prev.map((t) =>
        t.id === drawerTask.id
          ? { ...t, changeOrders: [...(t.changeOrders || []), newCO] }
          : t
      )
    );

    setDrawerTask((prev) => ({
      ...prev,
      changeOrders: [...(prev.changeOrders || []), newCO]
    }));

    // If stock material is designated, we trigger simulated restocking warehouse logs decrement / event
    if (coMaterials) {
      // Dispatch custom localstorage notifier to update stock safety logs
      try {
        const stored = localStorage.getItem('ev-warehouse-stocks');
        if (stored) {
          const warehouse = JSON.parse(stored);
          const matchedItem = warehouse.find(
            (w) => w.name.toLowerCase().includes(coMaterials.toLowerCase()) || coMaterials.toLowerCase().includes(w.name.toLowerCase())
          );
          if (matchedItem) {
            matchedItem.qty = Math.max(0, matchedItem.qty - (Number(coMaterialQty) || 1));
            localStorage.setItem('ev-warehouse-stocks', JSON.stringify(warehouse));
          }
        }
      } catch (err) {
        console.error(err);
      }
    }

    addToast('Task Change Order recorded successfully! Stock inventory and timesheet overhead adjusted.', 'success');
    setShowChangeOrderModal(false);
    setCoHours('');
    setCoMaterials('');
    setCoMaterialQty('1');
    setCoReason('');
  };

  // Filter site unpinned tasks to choose from in Pin Selection dropdown
  const siteUnpinnedTasks = tasks.filter(
    (t) => t.siteId === selectedSiteId && !pins.some((p) => p.taskId === t.id)
  );

  return (
    <Layout>
      {/* Page Header */}
      <div className="page-header">
        <h1>📐 {t('planViewer.title')}</h1>
        
        {/* Selector selectors */}
        <div className="page-header-actions" style={{ display: 'flex', gap: 12 }}>
          <select
            value={selectedSiteId}
            onChange={(e) => setSelectedSiteId(e.target.value)}
            className="form-select"
            style={{ minWidth: 160 }}
          >
            {Object.keys(SITE_DRAWINGS).length === 0 && (
              <option value="">No sites available</option>
            )}
            {Object.keys(SITE_DRAWINGS).map((siteId) => (
              <option key={siteId} value={siteId}>🏗️ Site {siteId}</option>
            ))}
          </select>

          <select
            value={selectedDrawing?.id || ''}
            onChange={(e) => {
              const drawings = SITE_DRAWINGS[selectedSiteId] || [];
              const d = drawings.find((dw) => dw.id === e.target.value);
              if (d) {
                setSelectedDrawing(d);
                setSelectedPin(null);
                setDrawerOpen(false);
              }
            }}
            className="form-select"
            style={{ minWidth: 200 }}
          >
            {(!SITE_DRAWINGS[selectedSiteId] || SITE_DRAWINGS[selectedSiteId].length === 0) && (
              <option value="">No drawings available</option>
            )}
            {(SITE_DRAWINGS[selectedSiteId] || []).map((dw) => (
              <option key={dw.id} value={dw.id}>
                {dw.name}
              </option>
            ))}
          </select>

          <button
            onClick={() => setPinMode(!pinMode)}
            className={`btn ${pinMode ? 'btn-primary' : 'btn-secondary'}`}
            style={{ display: 'flex', alignItems: 'center', gap: 6 }}
          >
            📍 {pinMode ? 'Cancel Pinning' : t('planViewer.pinTask')}
          </button>
        </div>
      </div>

      {pinMode && (
        <div style={{
          padding: '10px 14px',
          background: 'rgba(255, 202, 0, 0.1)',
          border: '1px solid rgba(255, 202, 0, 0.2)',
          color: 'var(--clr-primary)',
          borderRadius: 'var(--radius-sm)',
          marginBottom: 16,
          fontSize: 'var(--fs-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}>
          💡 <strong>{t('planViewer.clickToPin')}</strong>. {t('planViewer.pinInstructions')}
        </div>
      )}

      {/* Main Workspace Frame */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gap: 16 }} className="plan-viewer-grid">
        
        {/* Left Side: Drawing canvas view */}
        <div
          ref={containerRef}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{
            position: 'relative',
            background: 'var(--clr-bg-deep)',
            border: '1px solid var(--clr-border)',
            borderRadius: 'var(--radius-md)',
            height: '620px',
            overflow: 'hidden',
            cursor: pinMode ? 'crosshair' : isDrag ? 'grabbing' : 'grab',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            userSelect: 'none'
          }}
        >
          {/* Zoom/Pan Controls Bar overlay */}
          <div style={{
            position: 'absolute',
            bottom: 16,
            left: 16,
            display: 'flex',
            gap: 4,
            zIndex: 10,
            background: 'rgba(15, 17, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '6px',
            borderRadius: 'var(--radius-sm)'
          }}>
            <button className="btn btn-secondary btn-sm" onClick={() => handleZoom(1.2)} style={{ padding: '6px 10px' }} title={t('planViewer.zoomIn')}>➕</button>
            <button className="btn btn-secondary btn-sm" onClick={() => handleZoom(0.8)} style={{ padding: '6px 10px' }} title={t('planViewer.zoomOut')}>➖</button>
            <button className="btn btn-secondary btn-sm" onClick={handleResetZoom} style={{ padding: '6px 10px' }} title={t('planViewer.reset')}>🔄</button>
          </div>

          <div style={{
            position: 'absolute',
            top: 16,
            left: 16,
            zIndex: 10,
            background: 'rgba(15, 17, 26, 0.8)',
            backdropFilter: 'blur(8px)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            padding: '4px 8px',
            borderRadius: 'var(--radius-sm)',
            fontSize: 'var(--fs-xs)',
            color: 'var(--clr-text-muted)'
          }}>
            🔍 Zoom: {Math.round(zoom * 100)}%
          </div>

          {/* Interactive Transformable Container */}
          <div
            onMouseDown={handleMouseDown}
            onClick={handleCanvasClick}
            style={{
              position: 'relative',
              width: '100%',
              height: '100%',
              transform: `scale(${zoom}) translate(${pan.x}px, ${pan.y}px)`,
              transformOrigin: 'center center',
              transition: isDrag ? 'none' : 'transform 0.15s ease-out',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            {/* 1. CAD DWG Simulator Vector Layer */}
            {selectedDrawing?.type === 'dwg' && (
              <div style={{
                width: '90%',
                height: '90%',
                background: '#0B0D13',
                border: '2px solid #232731',
                borderRadius: 'var(--radius-sm)',
                position: 'relative',
                boxShadow: 'inset 0 0 24px rgba(0,255,202,0.05)',
                overflow: 'hidden'
              }}>
                {/* CAD Grid Backdrop */}
                <svg width="100%" height="100%" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 255, 255, 0.05)" strokeWidth="1" />
                    </pattern>
                  </defs>
                  <rect width="100%" height="100%" fill="url(#grid)" />
                  
                  {/* Neon CAD Overlays */}
                  <polyline points="50,150 250,150 250,300 100,300" fill="none" stroke="#00FFCC" strokeWidth="2" strokeDasharray="5,5" />
                  <polyline points="250,150 500,150 500,420 300,420" fill="none" stroke="#FFCC00" strokeWidth="2" />
                  <circle cx="250" cy="150" r="8" fill="none" stroke="#FF3366" strokeWidth="2" />
                  <circle cx="500" cy="150" r="10" fill="none" stroke="#00CCFF" strokeWidth="2" />
                  
                  {/* Electrical Symbol Mocks */}
                  <g transform="translate(100, 150)">
                    <circle cx="0" cy="0" r="12" fill="none" stroke="#00FFCC" strokeWidth="2" />
                    <line x1="-12" y1="-12" x2="12" y2="12" stroke="#00FFCC" strokeWidth="2" />
                    <line x1="12" y1="-12" x2="-12" y2="12" stroke="#00FFCC" strokeWidth="2" />
                  </g>
                  <g transform="translate(300, 300)">
                    <rect x="-10" y="-15" width="20" height="30" fill="none" stroke="#FFCC00" strokeWidth="2" />
                    <text x="-6" y="5" fill="#FFCC00" fontSize="12" fontFamily="monospace" fontWeight="bold">M</text>
                  </g>
                  <g transform="translate(420, 280)">
                    <path d="M-10,0 L10,0 M0,-10 L0,10" fill="none" stroke="#00CCFF" strokeWidth="2" />
                    <circle cx="0" cy="0" r="6" fill="#0b0d13" stroke="#00CCFF" strokeWidth="2" />
                  </g>
                </svg>
                <div style={{ position: 'absolute', bottom: 12, right: 12, fontSize: '10px', color: '#00FFCC', fontFamily: 'monospace', opacity: 0.6 }}>
                  📐 AUTOCAD LAYER ENABLED | GRID: 2.5m
                </div>
              </div>
            )}

            {/* 2. PDF Wiring Diagram Backdrop */}
            {selectedDrawing?.type === 'pdf' && (
              <div style={{
                width: '85%',
                height: '85%',
                background: '#1A1E29',
                border: '2px solid #2D3344',
                borderRadius: 'var(--radius-sm)',
                padding: 24,
                boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 8 }}>
                  <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--clr-text-secondary)' }}>ELECTRICVISION SCHEMATICS CO.</span>
                  <span style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>REV: 4.1a</span>
                </div>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {/* Schematic Mock Blocks */}
                  <svg width="240" height="180" viewBox="0 0 240 180" style={{ opacity: 0.7 }}>
                    <rect x="10" y="20" width="60" height="120" fill="none" stroke="var(--clr-text-secondary)" strokeWidth="2" />
                    <text x="22" y="85" fill="var(--clr-text-secondary)" fontSize="10">PANEL A</text>
                    <rect x="160" y="50" width="70" height="60" fill="none" stroke="var(--clr-text-secondary)" strokeWidth="2" />
                    <text x="175" y="85" fill="var(--clr-text-secondary)" fontSize="10">LOAD BUS</text>
                    <path d="M 70 50 L 160 50 M 70 80 L 160 80 M 70 110 L 160 110" fill="none" stroke="var(--clr-primary)" strokeWidth="2" />
                    <circle cx="115" cy="50" r="4" fill="var(--clr-primary)" />
                    <circle cx="115" cy="80" r="4" fill="var(--clr-primary)" />
                    <circle cx="115" cy="110" r="4" fill="var(--clr-primary)" />
                  </svg>
                </div>
                <div style={{ fontSize: '9px', color: 'var(--clr-text-muted)', borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6, display: 'flex', justifyContent: 'space-between' }}>
                  <span>DWG REFERENCE NO: D-992-B</span>
                  <span>CONFIDENTIAL</span>
                </div>
              </div>
            )}

            {/* 3. PNG Image Floor Plan Backdrop */}
            {selectedDrawing?.type === 'png' && (
              <div style={{
                width: '80%',
                height: '80%',
                background: '#1F2433',
                border: '2px dashed var(--clr-border)',
                borderRadius: 'var(--radius-sm)',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)'
              }}>
                <svg width="300" height="200" viewBox="0 0 300 200" style={{ opacity: 0.8 }}>
                  <rect x="10" y="10" width="280" height="180" fill="none" stroke="var(--clr-border)" strokeWidth="2" />
                  <line x1="100" y1="10" x2="100" y2="190" stroke="var(--clr-border)" strokeWidth="2" />
                  <line x1="200" y1="10" x2="200" y2="190" stroke="var(--clr-border)" strokeWidth="2" />
                  <line x1="100" y1="100" x2="290" y2="100" stroke="var(--clr-border)" strokeWidth="2" />
                  
                  <text x="25" y="100" fill="var(--clr-text-muted)" fontSize="12">LIVING</text>
                  <text x="135" y="60" fill="var(--clr-text-muted)" fontSize="12">BATH</text>
                  <text x="135" y="150" fill="var(--clr-text-muted)" fontSize="12">HALL</text>
                  <text x="225" y="60" fill="var(--clr-text-muted)" fontSize="12">BED 1</text>
                  <text x="225" y="150" fill="var(--clr-text-muted)" fontSize="12">BED 2</text>
                </svg>
              </div>
            )}

            {/* Render overlay pins on blueprint */}
            {pins
              .filter((p) => p.drawingId === selectedDrawing?.id)
              .map((pin) => {
                const task = tasks.find((t) => t.id === pin.taskId);
                const isSelected = selectedPin === pin.id;
                
                let pinColor = 'var(--clr-primary)';
                if (task?.priority === 'high') pinColor = 'var(--clr-danger)';
                if (task?.priority === 'medium') pinColor = 'var(--clr-warning)';
                if (task?.status === 'completed') pinColor = 'var(--clr-success)';

                return (
                  <button
                    key={pin.id}
                    onClick={(e) => handlePinClick(pin, e)}
                    style={{
                      position: 'absolute',
                      left: `${pin.x}%`,
                      top: `${pin.y}%`,
                      transform: 'translate(-50%, -50%)',
                      width: isSelected ? '34px' : '26px',
                      height: isSelected ? '34px' : '26px',
                      borderRadius: '50%',
                      background: pinColor,
                      border: '3px solid #FFF',
                      boxShadow: '0 0 16px rgba(0,0,0,0.6), 0 0 8px ' + pinColor,
                      color: '#FFF',
                      fontSize: '11px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: isSelected ? 20 : 15,
                      transition: 'all 0.2s ease'
                    }}
                    title={task?.title || 'Pinned Task'}
                  >
                    {task?.priority === 'high' ? '⚠️' : '📍'}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Right Side: Site Documents directory */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Document Section */}
          <div className="glass-card" style={{ padding: 'var(--sp-md)', height: '100%', overflowY: 'auto' }}>
            <h3 style={{ fontSize: 'var(--fs-md)', marginBottom: 'var(--sp-md)', display: 'flex', alignItems: 'center', gap: 8 }}>
              📁 {t('planViewer.attachments')}
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(!SITE_DRAWINGS[selectedSiteId] || SITE_DRAWINGS[selectedSiteId].length === 0) ? (
                <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>No drawings available for this site.</p>
              ) : (
                SITE_DRAWINGS[selectedSiteId].map((doc) => (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setSelectedDrawing(doc);
                      setSelectedPin(null);
                      setDrawerOpen(false);
                    }}
                    className={`clickable`}
                    style={{
                      padding: '10px 12px',
                      borderRadius: 'var(--radius-sm)',
                      border: '1px solid ' + (selectedDrawing?.id === doc.id ? 'var(--clr-primary)' : 'var(--clr-border)'),
                      background: selectedDrawing?.id === doc.id ? 'var(--clr-primary-subtle)' : 'rgba(255, 255, 255, 0.02)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 4,
                      cursor: 'pointer'
                    }}
                  >
                    <span className="font-semibold text-sm" style={{ color: selectedDrawing?.id === doc.id ? 'var(--clr-primary)' : 'var(--clr-text)' }}>
                      {doc.name}
                    </span>
                    <span style={{ fontSize: '10px', color: 'var(--clr-text-muted)' }}>
                      {doc.type === 'dwg' ? t('planViewer.docTypeDwg') : doc.type === 'pdf' ? t('planViewer.docTypePdf') : t('planViewer.docTypePng')}
                    </span>
                  </div>
                ))
              )}
            </div>

            <hr style={{ border: 'none', borderTop: '1px solid var(--clr-border)', margin: '20px 0' }} />

            {/* Permits & Approvals */}
            <h4 style={{ fontSize: 'var(--fs-sm)', textTransform: 'uppercase', color: 'var(--clr-text-muted)', marginBottom: 12 }}>
              📜 Permits & Directives
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {(!SITE_DOCUMENTS[selectedSiteId] || SITE_DOCUMENTS[selectedSiteId].length === 0) ? (
                <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>No permits or documents for this site.</p>
              ) : (
                SITE_DOCUMENTS[selectedSiteId].map((doc, idx) => (
                  <div key={idx} style={{ padding: '8px 10px', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--clr-border)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-xs)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="font-medium">{doc.name}</span>
                      <span className={`badge ${doc.status === 'Approved' || doc.status === 'Active' ? 'badge-success' : 'badge-neutral'}`} style={{ fontSize: '8px', padding: '1px 4px' }}>
                        {doc.status}
                      </span>
                    </div>
                    <div style={{ color: 'var(--clr-text-muted)', fontSize: '9px' }}>Added: {doc.date}</div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Task Details Side Drawer Panel */}
      {drawerOpen && drawerTask && (
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          width: '420px',
          height: '100vh',
          background: 'var(--clr-bg)',
          borderLeft: '1px solid var(--clr-border)',
          boxShadow: '-8px 0 32px rgba(0,0,0,0.5)',
          zIndex: 100,
          display: 'flex',
          flexDirection: 'column',
          animation: 'slideIn 0.25s ease-out'
        }}>
          {/* Drawer Header */}
          <div style={{ padding: '20px', borderBottom: '1px solid var(--clr-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ margin: 0, fontSize: 'var(--fs-md)' }}>📋 {t('planViewer.taskDetails')}</h3>
            <button
              className="btn btn-ghost"
              onClick={() => {
                setDrawerOpen(false);
                setSelectedPin(null);
              }}
              style={{ fontSize: 18, padding: 6 }}
            >
              ✕
            </button>
          </div>

          {/* Drawer Body */}
          <div style={{ padding: '20px', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                <span className={`badge ${drawerTask.priority === 'high' ? 'badge-danger' : drawerTask.priority === 'medium' ? 'badge-warning' : 'badge-neutral'}`}>
                  {drawerTask.priority.toUpperCase()}
                </span>
                <span style={{ fontSize: '12px', color: 'var(--clr-text-muted)' }}>ID: #{drawerTask.id}</span>
              </div>
              <h4 style={{ margin: 0, fontSize: 'var(--fs-base)', fontWeight: 700 }}>{drawerTask.title}</h4>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--clr-border)', fontSize: 'var(--fs-sm)' }}>
              <strong>{t('planViewer.status')}:</strong> <span style={{ textTransform: 'uppercase', fontSize: '11px', color: 'var(--clr-primary)' }}>{drawerTask.status.replace('_', ' ')}</span>
              <br />
              <strong style={{ display: 'inline-block', marginTop: 6 }}>{t('planViewer.assignedTo')}:</strong> {drawerTask.workerName}
              <br />
              <strong style={{ display: 'inline-block', marginTop: 6 }}>Due Date:</strong> {drawerTask.dueDate}
            </div>

            <div>
              <h5 style={{ margin: '0 0 6px 0', fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>Description</h5>
              <p style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text-muted)', lineHeight: 1.5 }}>
                {drawerTask.desc}
              </p>
            </div>

            {/* Task Change Orders Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h5 style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>⚠️ Change Orders ({drawerTask.changeOrders?.length || 0})</h5>
                <button className="btn btn-secondary btn-xs" onClick={() => setShowChangeOrderModal(true)}>
                  + Log Change
                </button>
              </div>

              {drawerTask.changeOrders && drawerTask.changeOrders.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {drawerTask.changeOrders.map((co) => (
                    <div key={co.id} style={{ padding: 10, background: 'rgba(255,202,0,0.03)', border: '1px solid rgba(255,202,0,0.15)', borderRadius: 'var(--radius-sm)', fontSize: 'var(--fs-xs)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: 4 }}>
                        <span style={{ color: 'var(--clr-primary)' }}>+{co.hours}h Man-Hours</span>
                        <span>{co.date}</span>
                      </div>
                      <div style={{ color: 'var(--clr-text-secondary)', marginBottom: 2 }}>Material: {co.material} (Qty: {co.materialQty})</div>
                      <div style={{ color: 'var(--clr-text-muted)', fontStyle: 'italic' }}>Reason: "{co.reason}"</div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>No change orders logged for this task.</p>
              )}
            </div>

            {/* Task Progress Photos Section */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <h5 style={{ margin: 0, fontSize: 'var(--fs-sm)', color: 'var(--clr-text-secondary)' }}>📸 Progress Photos ({drawerTask.photos?.length || 0})</h5>
                <button className="btn btn-secondary btn-xs" onClick={handleSimulatePhoto}>
                  {t('tasksAdditions.addPhoto')}
                </button>
              </div>

              {drawerTask.photos && drawerTask.photos.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8 }}>
                  {drawerTask.photos.map((ph, index) => (
                    <div key={index} style={{ position: 'relative', borderRadius: 'var(--radius-sm)', overflow: 'hidden', border: '1px solid var(--clr-border)' }}>
                      <img src={ph.url} alt="Task progress check" style={{ width: '100%', height: '100px', objectFit: 'cover' }} />
                      <div style={{ position: 'absolute', bottom: 0, width: '100%', padding: '2px 6px', background: 'rgba(0,0,0,0.6)', fontSize: '8px', color: '#FFF', display: 'flex', justifyContent: 'space-between' }}>
                        <span>Captured</span>
                        <span>{ph.date}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ margin: 0, fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)' }}>No progress photos uploaded yet.</p>
              )}
            </div>
          </div>

          {/* Drawer Footer Actions */}
          <div style={{ padding: '20px', borderTop: '1px solid var(--clr-border)', display: 'flex', gap: 10 }}>
            <button
              className="btn btn-primary"
              style={{ flex: 1 }}
              onClick={() => {
                window.location.href = `/tasks`;
              }}
            >
              {t('planViewer.openTask')}
            </button>
          </div>
        </div>
      )}

      {/* Select Task to Pin Modal Dialog */}
      {showPinModal && (
        <div className="modal-backdrop" onClick={() => setShowPinModal(false)} role="dialog" aria-modal="true">
          <div className="modal modal-sm" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{t('planViewer.selectTaskToPin')}</h3>
              <button className="modal-close" onClick={() => setShowPinModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 'var(--fs-xs)', color: 'var(--clr-text-muted)', marginBottom: 12 }}>
                Select an unpinned task for this site to attach at the clicked coordinate.
              </p>
              <div className="form-group">
                <label className="form-label" htmlFor="pin-task-select">Task</label>
                <select
                  id="pin-task-select"
                  className="form-select"
                  value={taskToPinId}
                  onChange={(e) => setTaskToPinId(e.target.value)}
                >
                  {siteUnpinnedTasks.map((t) => (
                    <option key={t.id} value={t.id}>
                      [{t.priority.toUpperCase()}] {t.title}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowPinModal(false)}>{t('common.buttons.cancel')}</button>
              <button className="btn btn-primary" onClick={handleSavePin}>Pin Task</button>
            </div>
          </div>
        </div>
      )}

      {/* Camera Simulator Modal Overlay */}
      {showCameraSim && (
        <div className="modal-backdrop" onClick={() => setShowCameraSim(false)} role="dialog" aria-modal="true">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">📷 Camera Simulation Capture</h3>
              <button className="modal-close" onClick={() => setShowCameraSim(false)}>✕</button>
            </div>
            <div className="modal-body" style={{ textAlign: 'center' }}>
              <div style={{
                width: '100%',
                height: '240px',
                background: '#000',
                borderRadius: 'var(--radius-sm)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {simulatedPhotoUrl ? (
                  <img src={simulatedPhotoUrl} alt="Captured check box" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ color: 'var(--clr-text-muted)' }}>
                    <span>[CAMERA VIEWFINDER ACTIVE]</span>
                  </div>
                )}
              </div>

              {!simulatedPhotoUrl ? (
                <button className="btn btn-primary" onClick={handleCapturePhoto}>
                  📸 Snap Simulated Photo
                </button>
              ) : (
                <div style={{ display: 'flex', justifyCenter: 'center', gap: 10 }}>
                  <button className="btn btn-secondary" onClick={() => setSimulatedPhotoUrl('')}>
                    Retake
                  </button>
                  <button className="btn btn-primary" onClick={handleSavePhoto}>
                    Keep & Upload
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Log Change Order Modal Overlay */}
      {showChangeOrderModal && (
        <div className="modal-backdrop" onClick={() => setShowChangeOrderModal(false)} role="dialog" aria-modal="true">
          <div className="modal modal-md" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🛠️ {t('tasksAdditions.createChangeOrder')}</h3>
              <button className="modal-close" onClick={() => setShowChangeOrderModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label" htmlFor="co-hours">{t('tasksAdditions.changeOrderManHours')}</label>
                <input
                  id="co-hours"
                  type="number"
                  className="form-input"
                  value={coHours}
                  onChange={(e) => setCoHours(e.target.value)}
                  placeholder="e.g. 5"
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
                <div className="form-group">
                  <label className="form-label" htmlFor="co-material">{t('tasksAdditions.changeOrderMaterials')}</label>
                  <input
                    id="co-material"
                    type="text"
                    className="form-input"
                    value={coMaterials}
                    onChange={(e) => setCoMaterials(e.target.value)}
                    placeholder="e.g. Copper Wire NYM 3x2.5"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label" htmlFor="co-qty">Quantity</label>
                  <input
                    id="co-qty"
                    type="number"
                    className="form-input"
                    value={coMaterialQty}
                    onChange={(e) => setCoMaterialQty(e.target.value)}
                    placeholder="e.g. 10"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="co-reason">{t('tasksAdditions.changeOrderReason')}</label>
                <textarea
                  id="co-reason"
                  className="form-input"
                  value={coReason}
                  onChange={(e) => setCoReason(e.target.value)}
                  placeholder="e.g. Site supervisor requested routing cable around the concrete beam."
                  rows={3}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowChangeOrderModal(false)}>
                {t('common.buttons.cancel')}
              </button>
              <button className="btn btn-primary" onClick={handleSaveChangeOrder}>
                {t('tasksAdditions.submitChangeOrder')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Custom Styles slide-in overlay */}
      <style jsx global>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 1024px) {
          .plan-viewer-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </Layout>
  );
}
