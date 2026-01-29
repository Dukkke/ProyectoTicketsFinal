'use client';

import { useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { BookOpen, Lightbulb, ArrowLeft } from 'lucide-react';

// Malla images mapping
const mallas: Record<string, { title: string; image: string }> = {
    'industrial': {
        title: 'Ingeniería Civil Industrial (Diurno)',
        image: '/images/mallas/MallaIndustrial.jpeg'
    },
    'informatica': {
        title: 'Ingeniería Civil en Informática (Diurno)',
        image: '/images/mallas/MallaInformatica.jpeg'
    },
    'remota': {
        title: 'Ingeniería Civil Industrial (Remoto)',
        image: '/images/mallas/MallaRemota.jpeg'
    }
};

// Componente interno que usa useSearchParams
function MallaContent() {
    const searchParams = useSearchParams();
    const carrera = searchParams.get('carrera') || 'industrial';
    const [zoom, setZoom] = useState(1);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [startPos, setStartPos] = useState({ x: 0, y: 0 });

    const selectedMalla = mallas[carrera] || mallas['industrial'];

    const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
    const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
    const handleReset = () => { setZoom(1); setPosition({ x: 0, y: 0 }); };

    const handleMouseDown = (e: React.MouseEvent) => {
        setIsDragging(true);
        setStartPos({ x: e.clientX - position.x, y: e.clientY - position.y });
    };

    const handleMouseMove = (e: React.MouseEvent) => {
        if (!isDragging) return;
        setPosition({ x: e.clientX - startPos.x, y: e.clientY - startPos.y });
    };

    const handleMouseUp = () => setIsDragging(false);

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            fontFamily: "'Inter', sans-serif"
        }}>
            {/* HEADER */}
            <header style={{
                background: 'rgba(255,255,255,0.05)',
                backdropFilter: 'blur(10px)',
                padding: '16px 32px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <Link href="/" style={{ color: '#94a3b8', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <ArrowLeft size={16} /> Volver
                    </Link>
                    <h1 style={{ color: 'white', fontSize: '20px', fontWeight: '700' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}><BookOpen size={24} /> {selectedMalla.title}</span>
                    </h1>
                </div>

                {/* Carrera selector */}
                <div style={{ display: 'flex', gap: '8px' }}>
                    {Object.entries(mallas).map(([key, malla]) => (
                        <Link
                            key={key}
                            href={`/malla?carrera=${key}`}
                            style={{
                                padding: '8px 16px',
                                borderRadius: '8px',
                                background: carrera === key ? '#3b82f6' : 'rgba(255,255,255,0.1)',
                                color: carrera === key ? 'white' : '#94a3b8',
                                textDecoration: 'none',
                                fontSize: '13px',
                                fontWeight: '600',
                                transition: 'all 0.2s'
                            }}
                        >
                            {key === 'industrial' ? 'Industrial' : key === 'informatica' ? 'Informática' : 'Remota'}
                        </Link>
                    ))}
                </div>
            </header>

            {/* ZOOM CONTROLS */}
            <div style={{
                position: 'fixed',
                bottom: '32px',
                left: '50%',
                transform: 'translateX(-50%)',
                display: 'flex',
                gap: '8px',
                background: 'rgba(0,0,0,0.8)',
                backdropFilter: 'blur(10px)',
                padding: '12px 20px',
                borderRadius: '16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
                zIndex: 100
            }}>
                <button
                    onClick={handleZoomOut}
                    style={{
                        width: '40px', height: '40px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    −
                </button>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    padding: '0 16px',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    minWidth: '60px',
                    justifyContent: 'center'
                }}>
                    {Math.round(zoom * 100)}%
                </div>
                <button
                    onClick={handleZoomIn}
                    style={{
                        width: '40px', height: '40px',
                        borderRadius: '10px',
                        border: 'none',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        fontSize: '20px',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    +
                </button>
                <button
                    onClick={handleReset}
                    style={{
                        padding: '0 16px',
                        height: '40px',
                        borderRadius: '10px',
                        border: 'none',
                        background: '#3b82f6',
                        color: 'white',
                        fontSize: '13px',
                        fontWeight: '600',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                    }}
                >
                    Reset
                </button>
            </div>

            {/* IMAGE VIEWER */}
            <div
                style={{
                    width: '100%',
                    height: 'calc(100vh - 70px)',
                    overflow: 'hidden',
                    cursor: isDragging ? 'grabbing' : 'grab',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    position: 'relative'
                }}
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            >
                <img
                    src={selectedMalla.image}
                    alt={selectedMalla.title}
                    style={{
                        maxWidth: '100%',
                        maxHeight: '100%',
                        objectFit: 'contain',
                        transform: `scale(${zoom}) translate(${position.x / zoom}px, ${position.y / zoom}px)`,
                        transition: isDragging ? 'none' : 'transform 0.1s',
                        pointerEvents: 'none',
                        userSelect: 'none'
                    }}
                    draggable={false}
                />
            </div>

            {/* INSTRUCTIONS */}
            <div style={{
                position: 'fixed',
                top: '90px',
                right: '24px',
                background: 'rgba(59, 130, 246, 0.2)',
                backdropFilter: 'blur(10px)',
                padding: '12px 16px',
                borderRadius: '12px',
                color: '#93c5fd',
                fontSize: '12px',
                maxWidth: '200px'
            }}>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}><Lightbulb size={20} /> <strong>Tips:</strong> Usa los botones para hacer zoom. Arrastra la imagen para moverla.</div>
            </div>
        </div>
    );
}

// Loading fallback
function MallaLoading() {
    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(135deg, #0f172a, #1e293b)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white'
        }}>
            Cargando malla curricular...
        </div>
    );
}

// Componente principal con Suspense boundary
export default function MallaCurricularPage() {
    return (
        <Suspense fallback={<MallaLoading />}>
            <MallaContent />
        </Suspense>
    );
}
