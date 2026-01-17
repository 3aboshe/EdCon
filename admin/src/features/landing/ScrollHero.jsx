import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useScroll, useTransform, useSpring } from 'framer-motion';

// ============================================================================
// CONFIGURATION & AESTHETICS
// ============================================================================

const FRAME_COUNT = 213;
const IMAGE_PATH_PREFIX = '/hero-assets/animation/ezgif-frame-';
const BG_COLOR = '#0A1930'; // Darker, more premium navy

// ============================================================================
// CONTENT DATA
// ============================================================================

const HERO_SECTIONS = [
    {
        id: 'intro',
        range: [0, 0.22],
        title: 'REDEFINING',
        highlight: 'EDUCATION',
        subtitle: 'The ultimate ecosystem for modern educational management.',
    },
    {
        id: 'intelligence',
        range: [0.28, 0.48],
        title: 'DATA',
        highlight: 'INTELLIGENCE',
        subtitle: 'Real-time performance analytics that empower decision making.',
    },
    {
        id: 'connection',
        range: [0.52, 0.72],
        title: 'SEAMLESS',
        highlight: 'CONNECTION',
        subtitle: 'Bridging the gap between schools, parents, and students.',
    },
    {
        id: 'future',
        range: [0.78, 0.95],
        title: 'THE',
        highlight: 'FUTURE',
        subtitle: 'Start your transformation with EdCona today.',
        isFinal: true
    },
];

// ============================================================================
// LOADING COMPONENT
// ============================================================================

function LuxuryLoader({ progress }) {
    return (
        <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] } }}
            style={{
                position: 'fixed',
                inset: 0,
                zIndex: 200,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                background: BG_COLOR,
            }}
        >
            <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.8 }}
                style={{ position: 'relative', textAlign: 'center' }}
            >
                <img src="/logowhite.png" alt="EdCona" style={{ width: 80, height: 'auto', marginBottom: '2rem' }} />
                <div
                    style={{
                        position: 'absolute',
                        bottom: -40,
                        left: '50%',
                        transform: 'translateX(-50%)',
                        width: 120,
                        height: 2,
                        background: 'rgba(255,255,255,0.1)',
                        overflow: 'hidden'
                    }}
                >
                    <motion.div
                        animate={{ width: `${progress}%` }}
                        style={{ height: '100%', background: 'white' }}
                    />
                </div>
            </motion.div>
            <motion.p
                style={{
                    marginTop: '4rem',
                    fontSize: '0.7rem',
                    letterSpacing: '0.3em',
                    color: 'rgba(255,255,255,0.4)',
                    textTransform: 'uppercase'
                }}
            >
                Initializing Experience
            </motion.p>
        </motion.div>
    );
}

// ============================================================================
// HERO CONTENT COMPONENT
// ============================================================================

function SectionText({ section, scrollProgress }) {
    const [start, end] = section.range;

    // Smooth opacity and Y transitions with wide visibility windows
    const opacity = useTransform(scrollProgress, [start, start + 0.04, end - 0.04, end], [0, 1, 1, 0]);
    const y = useTransform(scrollProgress, [start, start + 0.04, end - 0.04, end], [60, 0, 0, -60]);
    const scale = useTransform(scrollProgress, [start, end], [1.1, 0.9]);

    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                textAlign: 'center',
                zIndex: 20,
                opacity,
                y,
                scale,
                pointerEvents: 'none',
                padding: '0 2rem'
            }}
        >
            {/* High-contrast text with depth */}
            <h2 style={{
                fontSize: 'clamp(2.5rem, 12vw, 10rem)',
                fontWeight: 900,
                color: 'white',
                lineHeight: 0.85,
                margin: 0,
                letterSpacing: '-0.06em',
                fontFamily: 'system-ui, sans-serif',
                textShadow: '0 20px 60px rgba(0,0,0,0.8), 0 0 20px rgba(0,82,204,0.3)'
            }}>
                {section.title}
            </h2>
            <h2 style={{
                fontSize: 'clamp(2.5rem, 12vw, 10rem)',
                fontWeight: 900,
                color: 'white',
                background: 'linear-gradient(180deg, #fff 40%, rgba(255,255,255,0.4) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 0.85,
                margin: '0.5rem 0',
                letterSpacing: '-0.06em',
                fontFamily: 'system-ui, sans-serif',
                filter: 'drop-shadow(0 20px 40px rgba(0,0,0,0.8))'
            }}>
                {section.highlight}
            </h2>
            <p style={{
                fontSize: 'clamp(0.9rem, 1.4vw, 1.2rem)',
                color: 'white',
                maxWidth: '700px',
                marginTop: '4rem',
                lineHeight: 1.8,
                letterSpacing: '0.15em',
                textTransform: 'uppercase',
                fontWeight: 800,
                textShadow: '0 5px 15px rgba(0,0,0,1)',
                background: 'rgba(10, 25, 48, 0.6)',
                padding: '1rem 2rem',
                borderRadius: '2px',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.1)'
            }}>
                {section.subtitle}
            </p>

            {section.isFinal && (
                <motion.button
                    style={{
                        marginTop: '5rem',
                        padding: '1.5rem 4rem',
                        background: 'white',
                        color: BG_COLOR,
                        border: 'none',
                        fontWeight: 900,
                        letterSpacing: '0.3em',
                        textTransform: 'uppercase',
                        fontSize: '0.8rem',
                        cursor: 'pointer',
                        pointerEvents: 'auto',
                        boxShadow: '0 30px 60px rgba(0,0,0,0.5)',
                    }}
                    whileHover={{ scale: 1.1, boxShadow: '0 40px 80px rgba(0,0,0,0.6)' }}
                    whileTap={{ scale: 0.95 }}
                >
                    Initialize EdCona
                </motion.button>
            )}
        </motion.div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScrollHero() {
    const sectionRef = useRef(null);
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [loadedCount, setLoadedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"]
    });

    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 60,
        damping: 20,
        restDelta: 0.0001
    });

    // Robust Promise-based preloader
    useEffect(() => {
        let isCancelled = false;
        const loadedImages = [];
        let count = 0;

        const preloadImages = async () => {
            const promises = Array.from({ length: FRAME_COUNT }).map((_, i) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    const frameNum = (i + 1).toString().padStart(3, '0');
                    img.src = `${IMAGE_PATH_PREFIX}${frameNum}.jpg`;

                    img.onload = () => {
                        if (isCancelled) return resolve();
                        loadedImages[i] = img;
                        count++;
                        setLoadedCount(count);
                        resolve();
                    };

                    img.onerror = () => {
                        console.error(`Failed to load frame: ${frameNum}`);
                        if (isCancelled) return resolve();
                        count++;
                        setLoadedCount(count);
                        resolve();
                    };
                });
            });

            await Promise.all(promises);

            if (!isCancelled) {
                setImages(loadedImages);
                setIsLoading(false);
            }
        };

        preloadImages();

        return () => { isCancelled = true; };
    }, []);

    const render = useCallback((progress) => {
        const canvas = canvasRef.current;
        if (!canvas || images.length === 0) return;

        const ctx = canvas.getContext('2d', { alpha: false });
        const frameIndex = Math.min(
            FRAME_COUNT - 1,
            Math.floor(progress * (FRAME_COUNT - 1))
        );

        const img = images[frameIndex];
        if (!img) return;

        const { width, height } = canvas;
        const imgRatio = img.width / img.height;
        const canvasRatio = width / height;

        let drawW, drawH, offsetX, offsetY;

        if (imgRatio > canvasRatio) {
            drawW = height * imgRatio;
            drawH = height;
            offsetX = (width - drawW) / 2;
            offsetY = 0;
        } else {
            drawW = width;
            drawH = width / imgRatio;
            offsetX = 0;
            offsetY = (height - drawH) / 2;
        }

        ctx.fillStyle = BG_COLOR;
        ctx.fillRect(0, 0, width, height);
        ctx.globalAlpha = 1;
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        // Aesthetic Overlays: Strong Vignette for Readability
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 1);
        grad.addColorStop(0, 'rgba(10, 25, 48, 0.1)');
        grad.addColorStop(1, 'rgba(10, 25, 48, 0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }, [images]);

    useEffect(() => {
        return smoothProgress.on("change", (v) => {
            render(v);
        });
    }, [smoothProgress, render]);

    // Trigger initial render once loading is complete
    useEffect(() => {
        if (!isLoading && images.length > 0) {
            render(smoothProgress.get());
        }
    }, [isLoading, images, render, smoothProgress]);

    useEffect(() => {
        const handleResize = () => {
            const canvas = canvasRef.current;
            if (!canvas) return;
            const dpr = window.devicePixelRatio || 1;
            canvas.width = window.innerWidth * dpr;
            canvas.height = window.innerHeight * dpr;
            render(smoothProgress.get());
        };

        window.addEventListener('resize', handleResize);
        handleResize();
        return () => window.removeEventListener('resize', handleResize);
    }, [render, smoothProgress]);

    const loadingProgress = (loadedCount / FRAME_COUNT) * 100;

    return (
        <section ref={sectionRef} style={{ position: 'relative', height: '1200vh', background: BG_COLOR }}>
            <AnimatePresence>
                {isLoading && <LuxuryLoader progress={loadingProgress} />}
            </AnimatePresence>

            <div style={{
                position: 'sticky',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
                zIndex: 10
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100%',
                        height: '100%',
                        display: 'block',
                        objectFit: 'cover'
                    }}
                />

                {/* Minimalist Grid Pattern Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '100px 100px',
                    pointerEvents: 'none',
                    zIndex: 15
                }} />

                {/* Section Content */}
                {HERO_SECTIONS.map((section) => (
                    <SectionText
                        key={section.id}
                        section={section}
                        scrollProgress={smoothProgress}
                    />
                ))}

            </div>
        </section>
    );
}
