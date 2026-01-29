'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { useState } from 'react';
import { ChevronDown, ChevronUp, Search, ArrowRight, BookOpen, GraduationCap, Monitor, X, PlayCircle, ExternalLink, MessageCircle, ZoomIn, ZoomOut } from 'lucide-react';
import { COLORS, ALL_PROGRAMS, REMOTE_CATEGORIES, FAQItem } from '@/data/landingData';

export default function Home() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const selectedProgramId = searchParams.get('program');
    const [faqSearch, setFaqSearch] = useState('');
    const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
    const [viewImage, setViewImage] = useState<string | null>(null);
    const [zoomScale, setZoomScale] = useState(1);

    const activeProgram = ALL_PROGRAMS.find(p => p.id === selectedProgramId);

    const handleProgramSelect = (programId: string) => {
        const program = ALL_PROGRAMS.find(p => p.id === programId);
        if (program?.loginRole === 'estudiante-remoto') {
            // Remote flows might go direct or show specific logic, for now we select it
            router.push(`?program=${programId}`);
        } else {
            router.push(`?program=${programId}`);
        }
    };

    const handleLogin = () => {
        if (!activeProgram) return;

        // Simulating login flow based on role (preserving original logic)
        localStorage.setItem('userRole', activeProgram.loginRole);

        if (activeProgram.loginRole === 'estudiante-remoto') {
            router.push('/login');
        } else {
            router.push('/login');
        }
    };

    // Filter FAQs
    const activeFaqs = activeProgram ? activeProgram.faqs : [];
    const filteredFaqs = activeFaqs.filter(faq => {
        // Logic handles both FAQItem structures (simple or with id/label)
        const titleMatch = (faq.title || (faq as any).label || '').toLowerCase().includes(faqSearch.toLowerCase());
        const descMatch = faq.description.toLowerCase().includes(faqSearch.toLowerCase());
        return titleMatch || descMatch;
    });

    return (
        <main style={{ minHeight: '100vh', background: '#f8fafc', position: 'relative', overflow: 'hidden' }}>

            {/* Dynamic Background Elements */}
            <div style={{
                position: 'absolute', top: '-10%', right: '-5%', width: '600px', height: '600px',
                background: 'linear-gradient(135deg, #FF6B26 0%, rgba(255, 107, 38, 0) 70%)',
                borderRadius: '50%', filter: 'blur(100px)', opacity: 0.15, zIndex: 0,
                animation: 'float1 20s infinite ease-in-out'
            }} />
            <div style={{
                position: 'absolute', bottom: '-10%', left: '-10%', width: '700px', height: '700px',
                background: 'linear-gradient(135deg, #003366 0%, rgba(0, 51, 102, 0) 70%)',
                borderRadius: '50%', filter: 'blur(120px)', opacity: 0.1, zIndex: 0,
                animation: 'float2 25s infinite ease-in-out'
            }} />

            {/* Header / Nav - Full Width Black Bar */}
            <header style={{
                width: '100%',
                background: COLORS.black,
                padding: '20px 40px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                position: 'fixed',
                top: 0,
                left: 0,
                zIndex: 100
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
                    <Image
                        src="/Facultdad.png"
                        alt="Facultad de Ingeniería"
                        width={200}
                        height={60}
                        style={{ objectFit: 'contain' }}
                    />
                    <div style={{ width: '1px', height: '40px', background: '#333' }}></div>
                    <span style={{ color: 'white', fontSize: '18px', fontWeight: 500, letterSpacing: '0.5px' }}>
                        Universidad Alberto Hurtado
                    </span>
                </div>
                <nav style={{ display: 'flex', gap: '40px' }}>
                    <button
                        onClick={() => {
                            localStorage.setItem('userRole', 'academico');
                            router.push('/login');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 0',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'white',
                            transition: 'color 0.2s',
                            borderBottom: '2px solid transparent'
                        }}
                        onMouseEnter={e => e.currentTarget.style.color = COLORS.orange}
                        onMouseLeave={e => e.currentTarget.style.color = 'white'}
                    >
                        Académicos
                    </button>
                    <button
                        onClick={() => {
                            localStorage.setItem('userRole', 'coordinador');
                            router.push('/login');
                        }}
                        style={{
                            background: 'none',
                            border: 'none',
                            padding: '8px 0',
                            cursor: 'pointer',
                            fontSize: '15px',
                            fontWeight: 600,
                            color: COLORS.orange,
                            borderBottom: `2px solid ${COLORS.orange}`
                        }}
                    >
                        Coordinación
                    </button>
                </nav>
            </header>

            <div className="container" style={{ position: 'relative', zIndex: 1, padding: '140px 24px 40px' }}>

                {/* Hero Section */}
                {!activeProgram ? (
                    <div style={{ maxWidth: '900px', margin: '0 auto', textAlign: 'center', animation: 'fadeIn 0.5s ease-out' }}>
                        <h2 style={{ fontSize: '56px', fontWeight: 900, color: COLORS.black, lineHeight: 1.1, marginBottom: '24px', letterSpacing: '-1px' }}>
                            Tus dudas se resuelven aquí <br /> <span style={{ color: COLORS.orange }}>Comienza  </span>
                        </h2>
                        <p style={{ fontSize: '18px', color: COLORS.grayMedium, maxWidth: '600px', margin: '0 auto 60px', lineHeight: 1.6 }}>
                            Bienvenido al sistema de resolución de dudas y gestión académica. Busca tu modalidad y carrera para descubrir cómo resolver tus preguntas frecuentes.
                        </p>

                        {/* Program Cards */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px', alignItems: 'stretch' }}>

                            {/* Card: Ingeniería Presencial */}
                            <div className="program-card" style={{
                                background: 'white', borderRadius: '24px', padding: '32px', textAlign: 'left',
                                border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                                cursor: 'default', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '16px', background: '#F0F9FF',
                                    color: '#003366', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '24px'
                                }}>
                                    <GraduationCap size={32} />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: COLORS.black, marginBottom: '8px' }}>Facultad de Ingeniería</h3>
                                <p style={{ fontSize: '14px', color: COLORS.grayMedium, lineHeight: 1.5, marginBottom: '32px' }}>

                                </p>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        localStorage.setItem('userRole', 'estudiante');
                                        router.push('/login');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: COLORS.black,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'background 0.2s'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.background = '#333'}
                                    onMouseLeave={e => e.currentTarget.style.background = COLORS.black}
                                >
                                    Ingresar a Portal <ArrowRight size={18} />
                                </button>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {ALL_PROGRAMS.filter(p => !p.isOnline).map(prog => (
                                        <button
                                            key={prog.id}
                                            onClick={() => handleProgramSelect(prog.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                background: 'white', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = '#003366'; e.currentTarget.style.background = '#F8FAFC'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                                        >
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.black }}>{prog.subtitle === 'Ciclo Básico' ? 'Plan Común' : prog.name.replace('Ingeniería Civil ', '')}</span>
                                            <ArrowRight size={16} color={COLORS.grayMedium} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Card: Online & Continuidad */}
                            <div className="program-card" style={{
                                background: 'white', borderRadius: '24px', padding: '32px', textAlign: 'left',
                                border: '1px solid rgba(0,0,0,0.05)', boxShadow: '0 10px 40px rgba(0,0,0,0.04)',
                                cursor: 'default', transition: 'all 0.3s ease', position: 'relative', overflow: 'hidden'
                            }}>
                                <div style={{
                                    width: '64px', height: '64px', borderRadius: '16px', background: '#FFF7ED',
                                    color: COLORS.orange, display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    marginBottom: '24px'
                                }}>
                                    <Monitor size={32} />
                                </div>
                                <h3 style={{ fontSize: '20px', fontWeight: 700, color: COLORS.black, marginBottom: '8px' }}>Programas Online</h3>
                                <p style={{ fontSize: '14px', color: COLORS.grayMedium, lineHeight: 1.5, marginBottom: '32px' }}>
                                    Industrial Online y Prosecución de Estudios (TNS).
                                </p>

                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        localStorage.setItem('userRole', 'estudiante-remoto');
                                        router.push('/login');
                                    }}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        background: COLORS.orange,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '12px',
                                        fontSize: '15px',
                                        fontWeight: 700,
                                        cursor: 'pointer',
                                        marginBottom: '24px',
                                        display: 'flex',
                                        justifyContent: 'center',
                                        alignItems: 'center',
                                        gap: '8px',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 4px 12px rgba(240, 100, 39, 0.2)'
                                    }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 16px rgba(240, 100, 39, 0.3)'; }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(240, 100, 39, 0.2)'; }}
                                >
                                    Ingresar a Portal<ArrowRight size={18} />
                                </button>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                    {ALL_PROGRAMS.filter(p => p.isOnline).map(prog => (
                                        <button
                                            key={prog.id}
                                            onClick={() => handleProgramSelect(prog.id)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                padding: '12px 16px', borderRadius: '12px', border: '1px solid #e2e8f0',
                                                background: 'white', cursor: 'pointer', transition: 'all 0.2s'
                                            }}
                                            onMouseEnter={e => { e.currentTarget.style.borderColor = COLORS.orange; e.currentTarget.style.background = '#FFF7ED'; }}
                                            onMouseLeave={e => { e.currentTarget.style.borderColor = '#e2e8f0'; e.currentTarget.style.background = 'white'; }}
                                        >
                                            <span style={{ fontSize: '14px', fontWeight: 600, color: COLORS.black }}>{prog.name}</span>
                                            <ArrowRight size={16} color={COLORS.grayMedium} />
                                        </button>
                                    ))}
                                </div>
                            </div>

                        </div>
                    </div>
                ) : (
                    // Focused Program View
                    <div style={{ maxWidth: '1000px', margin: '0 auto', animation: 'slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                        <button
                            onClick={() => router.push('/')}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 16px',
                                borderRadius: '30px', background: 'white', border: '1px solid #e2e8f0',
                                color: COLORS.grayMedium, fontSize: '13px', fontWeight: 600, cursor: 'pointer', marginBottom: '32px'
                            }}
                        >
                            <ArrowRight size={14} style={{ transform: 'rotate(180deg)' }} />
                            Volver al inicio
                        </button>

                        <div style={{
                            background: 'white', borderRadius: '32px', padding: '40px',
                            boxShadow: '0 20px 80px rgba(0,0,0,0.08)', position: 'relative', overflow: 'hidden'
                        }}>
                            {/* Decorative header shape */}
                            <div style={{
                                position: 'absolute', top: 0, left: 0, width: '100%', height: '8px',
                                background: activeProgram.isOnline ? COLORS.orange : COLORS.blueUAH
                            }} />

                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '40px' }}>
                                <div>
                                    <div style={{
                                        display: 'inline-flex', alignItems: 'center', gap: '8px',
                                        color: activeProgram.isOnline ? COLORS.orange : COLORS.blueUAH,
                                        fontWeight: 600, fontSize: '14px', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px'
                                    }}>
                                        {activeProgram.icon}
                                        {activeProgram.subtitle}
                                    </div>
                                    <h2 style={{ fontSize: '32px', fontWeight: 800, color: COLORS.black, marginBottom: '16px' }}>
                                        {activeProgram.name}
                                    </h2>
                                    <p style={{ fontSize: '16px', color: COLORS.grayMedium, maxWidth: '600px', lineHeight: 1.6 }}>
                                        {activeProgram.description}
                                    </p>
                                </div>

                                <button
                                    onClick={handleLogin}
                                    style={{
                                        padding: '16px 32px', borderRadius: '16px',
                                        background: activeProgram.isOnline ? COLORS.orange : COLORS.blueUAH,
                                        color: 'white', border: 'none', fontSize: '16px', fontWeight: 700,
                                        cursor: 'pointer', boxShadow: activeProgram.isOnline ? '0 10px 30px rgba(227, 82, 5, 0.3)' : '0 10px 30px rgba(0, 51, 102, 0.3)',
                                        transition: 'transform 0.2s', display: 'flex', alignItems: 'center', gap: '12px'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    Ingresar al Portal
                                    <ArrowRight size={20} />
                                </button>
                            </div>

                            {/* FAQ SEARCH & GRID */}
                            <div style={{ background: '#f8fafc', borderRadius: '24px', padding: '32px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <h3 style={{ fontSize: '18px', fontWeight: 700, color: COLORS.black }}>Preguntas Frecuentes</h3>

                                    <div style={{ position: 'relative', width: '300px' }}>
                                        <Search size={18} color={COLORS.grayMedium} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)' }} />
                                        <input
                                            type="text"
                                            placeholder="Buscar duda..."
                                            value={faqSearch}
                                            onChange={(e) => setFaqSearch(e.target.value)}
                                            style={{
                                                width: '100%', padding: '12px 16px 12px 48px', borderRadius: '12px',
                                                border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none'
                                            }}
                                            onFocus={e => e.target.style.borderColor = activeProgram.isOnline ? COLORS.orange : COLORS.blueUAH}
                                            onBlur={e => e.target.style.borderColor = '#e2e8f0'}
                                        />
                                    </div>
                                </div>

                                <div style={{ display: 'grid', gap: '16px' }}>
                                    {filteredFaqs.length > 0 ? (
                                        filteredFaqs.map((faq, index) => {
                                            const faqId = (faq as any).id || `faq-${index}`;
                                            const isExpanded = expandedCategory === faqId;

                                            return (
                                                <div key={faqId} style={{
                                                    background: 'white', borderRadius: '16px', border: '1px solid #e2e8f0', overflow: 'hidden',
                                                    transition: 'all 0.3s ease'
                                                }}>
                                                    <button
                                                        onClick={() => setExpandedCategory(isExpanded ? null : faqId)}
                                                        style={{
                                                            width: '100%', padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                                            background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left'
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                                            {/* Icon handling based on type */}
                                                            <div style={{
                                                                color: activeProgram.isOnline ? COLORS.orange : COLORS.blueUAH,
                                                                opacity: 0.8
                                                            }}>
                                                                {faq.icon ? faq.icon : <BookOpen size={24} />}
                                                            </div>
                                                            <div>
                                                                <h4 style={{ fontSize: '16px', fontWeight: 600, color: COLORS.black, marginBottom: '4px' }}>
                                                                    {(faq as any).label ? (faq as any).label : faq.title}
                                                                </h4>
                                                                <p style={{ fontSize: '13px', color: COLORS.grayMedium }}>{faq.description}</p>
                                                            </div>
                                                        </div>
                                                        {isExpanded ? <ChevronUp size={20} color={COLORS.grayMedium} /> : <ChevronDown size={20} color={COLORS.grayMedium} />}
                                                    </button>

                                                    {isExpanded && (
                                                        <div style={{ padding: '0 20px 24px', borderTop: '1px solid #f1f5f9', animation: 'fadeIn 0.3s' }}>
                                                            <div style={{ marginTop: '16px' }}>
                                                                {faq.generalResponse}
                                                            </div>
                                                            {faq.images && faq.images.length > 0 && (
                                                                <div style={{ marginTop: '20px', display: 'flex', flexWrap: 'wrap', gap: '16px', justifyContent: 'center' }}>
                                                                    {faq.images.map((img, i) => (
                                                                        <div
                                                                            key={i}
                                                                            onClick={(e) => { e.stopPropagation(); setViewImage(img); setZoomScale(1); }}
                                                                            style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e2e8f0', maxWidth: '100%', cursor: 'zoom-in', transition: 'transform 0.2s' }}
                                                                            onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'}
                                                                            onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
                                                                        >
                                                                            <Image
                                                                                src={img}
                                                                                alt={`Visual aid for ${faq.title}`}
                                                                                width={800}
                                                                                height={600}
                                                                                style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '300px', objectFit: 'contain' }}
                                                                            />
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            )}
                                                            <div style={{ marginTop: '24px', padding: '16px', background: '#F8FAFC', borderRadius: '12px' }}>
                                                                <h5 style={{ fontSize: '13px', fontWeight: 700, color: COLORS.grayDark, marginBottom: '12px', textTransform: 'uppercase' }}>Preguntas Relacionadas</h5>
                                                                <ul style={{ listStyle: 'none', padding: 0, display: 'grid', gap: '8px' }}>
                                                                    {faq.questions.map((q, idx) => (
                                                                        <li key={idx} style={{ display: 'flex', gap: '8px', fontSize: '14px', color: COLORS.grayMedium }}>
                                                                            <span style={{ color: activeProgram.isOnline ? COLORS.orange : COLORS.blueUAH }}>•</span>
                                                                            {q}
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })
                                    ) : (
                                        <div style={{ textAlign: 'center', padding: '40px', color: COLORS.grayMedium }}>
                                            No se encontraron resultados para tu búsqueda.
                                        </div>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                )}
            </div>

            <style jsx global>{`
                @keyframes float1 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(20px, -20px) scale(1.1); } 100% { transform: translate(0,0) scale(1); } }
                @keyframes float2 { 0% { transform: translate(0,0) scale(1); } 50% { transform: translate(-20px, 20px) scale(0.9); } 100% { transform: translate(0,0) scale(1); } }
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
            `}</style>

            {/* IMAGE ZOOM MODAL */}
            {viewImage && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
                    background: 'rgba(0,0,0,0.9)', zIndex: 9999, display: 'flex', flexDirection: 'column',
                    animation: 'fadeIn 0.2s'
                }}>
                    {/* Toolbar */}
                    <div style={{
                        display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '16px',
                        padding: '20px', position: 'absolute', top: 0, right: 0, zIndex: 10000
                    }}>
                        <button
                            onClick={() => setZoomScale(s => Math.max(0.5, s - 0.5))}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                        >
                            <ZoomOut size={24} />
                        </button>
                        <span style={{ color: 'white', fontWeight: 600, minWidth: '40px', textAlign: 'center' }}>{Math.round(zoomScale * 100)}%</span>
                        <button
                            onClick={() => setZoomScale(s => Math.min(3, s + 0.5))}
                            style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex' }}
                        >
                            <ZoomIn size={24} />
                        </button>
                        <button
                            onClick={() => setViewImage(null)}
                            style={{ background: 'white', border: 'none', color: 'black', padding: '12px', borderRadius: '50%', cursor: 'pointer', display: 'flex', marginLeft: '16px' }}
                        >
                            <X size={24} />
                        </button>
                    </div>

                    {/* Image Container with Scroll */}
                    <div style={{
                        flex: 1, overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '40px'
                    }} onClick={() => setViewImage(null)}>
                        <div style={{
                            transform: `scale(${zoomScale})`, transformOrigin: 'center', transition: 'transform 0.2s ease-out',
                            cursor: zoomScale > 1 ? 'grab' : 'default'
                        }}
                            onClick={e => e.stopPropagation()}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={viewImage}
                                alt="Zoomed view"
                                style={{ maxWidth: '100%', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 20px 50px rgba(0,0,0,0.5)' }}
                            />
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
