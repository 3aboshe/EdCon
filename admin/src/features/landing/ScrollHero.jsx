import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, animate } from 'framer-motion';

// ============================================================================
// CONFIGURATION & AESTHETICS
// ============================================================================

const FRAME_COUNT = 213;
const IMAGE_PATH_PREFIX = '/hero-assets/animation/ezgif-frame-';
const BG_COLOR = '#0A1930';

const HERO_STAGES = [
    {
        id: 'intro',
        targetProgress: 0,
        title: 'REDEFINING',
        highlight: 'EDUCATION',
        subtitle: 'The ultimate ecosystem for modern educational management.',
        align: 'center',
    },
    {
        id: 'intelligence',
        targetProgress: 0.33,
        title: 'DATA',
        highlight: 'INTELLIGENCE',
        subtitle: 'Real-time performance analytics that empower decision making.',
        align: 'left',
    },
    {
        id: 'connection',
        targetProgress: 0.66,
        title: 'SEAMLESS',
        highlight: 'CONNECTION',
        subtitle: 'Bridging the gap between schools, parents, and students.',
        align: 'right',
    },
    {
        id: 'future',
        targetProgress: 1.0,
        title: 'THE',
        highlight: 'FUTURE',
        subtitle: 'Start your transformation with EdCona today.',
        align: 'center',
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

            <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => window.location.href = '/login'}
                style={{
                    marginTop: '2rem',
                    padding: '0.9rem 1.8rem',
                    background: 'transparent',
                    color: 'white',
                    border: '1px solid rgba(255,255,255,0.4)',
                    borderRadius: '999px',
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                }}
            >
                Login Now
            </motion.button>
        </motion.div>
    );
}

// ============================================================================
// HERO CONTENT COMPONENT
// ============================================================================

function SectionText({ section, animationProgress, activeIndex, index }) {
    const isVisible = activeIndex === index;

    // Discrete ranges for title opacity transitions
    const startRange = index === 0 ? -0.1 : (HERO_STAGES[index - 1].targetProgress + HERO_STAGES[index].targetProgress) / 2;
    const endRange = index === HERO_STAGES.length - 1 ? 1.1 : (HERO_STAGES[index].targetProgress + HERO_STAGES[index + 1].targetProgress) / 2;

    const opacity = useTransform(animationProgress, [startRange, HERO_STAGES[index].targetProgress, endRange], [0, 1, 0]);
    const y = useTransform(animationProgress, [startRange, HERO_STAGES[index].targetProgress, endRange], [40, 0, -40]);

    const isLeft = section.align === 'left';
    const isRight = section.align === 'right';

    return (
        <motion.div
            style={{
                position: 'absolute',
                inset: 0,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isLeft ? 'flex-start' : isRight ? 'flex-end' : 'center',
                justifyContent: 'center',
                textAlign: isLeft ? 'left' : isRight ? 'right' : 'center',
                zIndex: 20,
                opacity,
                y,
                pointerEvents: isVisible ? 'auto' : 'none',
                padding: '0 8vw'
            }}
        >
            <h2 style={{
                fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                fontWeight: 900,
                color: 'white',
                lineHeight: 0.9,
                margin: 0,
                letterSpacing: '-0.04em',
                fontFamily: 'Inter, system-ui, sans-serif',
                textShadow: '0 10px 30px rgba(0,0,0,0.5)'
            }}>
                {section.title}
            </h2>
            <h2 style={{
                fontSize: 'clamp(2.5rem, 8vw, 6rem)',
                fontWeight: 900,
                color: 'white',
                background: 'linear-gradient(180deg, #fff 40%, rgba(255,255,255,0.4) 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                lineHeight: 0.9,
                margin: '0.2rem 0',
                letterSpacing: '-0.04em',
                fontFamily: 'Inter, system-ui, sans-serif',
                filter: 'drop-shadow(0 10px 20px rgba(0,0,0,0.4))'
            }}>
                {section.highlight}
            </h2>
            <p style={{
                fontSize: 'clamp(0.8rem, 1.2vw, 1rem)',
                color: 'rgba(255,255,255,0.8)',
                maxWidth: '450px',
                marginTop: '2.5rem',
                lineHeight: 1.6,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                fontWeight: 700,
                borderLeft: isLeft ? '2px solid white' : 'none',
                borderRight: isRight ? '2px solid white' : 'none',
                padding: isLeft ? '0 0 0 1.5rem' : isRight ? '0 1.5rem 0 0' : '0',
            }}>
                {section.subtitle}
            </p>

            {section.isFinal && (
                <motion.button
                    style={{
                        marginTop: '4rem',
                        padding: '1.2rem 3rem',
                        background: 'white',
                        color: BG_COLOR,
                        border: 'none',
                        fontWeight: 900,
                        letterSpacing: '0.2em',
                        textTransform: 'uppercase',
                        fontSize: '0.75rem',
                        cursor: 'pointer',
                        boxShadow: '0 20px 40px rgba(0,0,0,0.3)',
                    }}
                    whileHover={{ scale: 1.05, boxShadow: '0 25px 50px rgba(0,0,0,0.4)' }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/login'}
                >
                    Get Started
                </motion.button>
            )}
        </motion.div>
    );
}

// ============================================================================
// STAGE INDICATOR COMPONENT
// ============================================================================

function StageIndicator({ activeIndex }) {
    return (
        <div
            style={{
                position: 'fixed',
                right: '4rem',
                top: '50%',
                transform: 'translateY(-50%)',
                display: 'flex',
                flexDirection: 'column',
                gap: '1.5rem',
                zIndex: 50,
            }}
        >
            {HERO_STAGES.map((_, i) => (
                <div
                    key={i}
                    style={{
                        width: activeIndex === i ? '24px' : '8px',
                        height: '8px',
                        borderRadius: '4px',
                        background: activeIndex === i ? 'white' : 'rgba(255,255,255,0.3)',
                        transition: 'all 0.6s cubic-bezier(0.22, 1, 0.36, 1)',
                    }}
                />
            ))}
        </div>
    );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export default function ScrollHero() {
    const containerRef = useRef(null);
    const canvasRef = useRef(null);
    const [images, setImages] = useState([]);
    const [loadedCount, setLoadedCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [activeStage, setActiveStage] = useState(0);
    const [isHeroActive, setIsHeroActive] = useState(true);

    const animationProgress = useMotionValue(0);
    const smoothProgress = useSpring(animationProgress, {
        stiffness: 80,
        damping: 30,
        restDelta: 0.001
    });

    const isAnimating = useRef(false);
    const lastScrollTime = useRef(0);

    // Image Preloader
    useEffect(() => {
        let isCancelled = false;
        const loadedImgArray = [];
        let count = 0;

        const preloadImages = async () => {
            const promises = Array.from({ length: FRAME_COUNT }).map((_, i) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    const frameNum = (i + 1).toString().padStart(3, '0');
                    img.src = `${IMAGE_PATH_PREFIX}${frameNum}.jpg`;

                    img.onload = () => {
                        if (isCancelled) return resolve();
                        loadedImgArray[i] = img;
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
                setImages(loadedImgArray);
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
        ctx.drawImage(img, offsetX, offsetY, drawW, drawH);

        // Vignette Overlay
        const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width / 1);
        grad.addColorStop(0, 'rgba(10, 25, 48, 0.1)');
        grad.addColorStop(1, 'rgba(10, 25, 48, 0.8)');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
    }, [images]);

    // Stage Navigation
    const goToStage = useCallback((index) => {
        if (isAnimating.current || index < 0 || index >= HERO_STAGES.length) return;

        isAnimating.current = true;
        setActiveStage(index);

        animate(animationProgress, HERO_STAGES[index].targetProgress, {
            duration: 1.2,
            ease: [0.22, 1, 0.36, 1],
            onComplete: () => {
                isAnimating.current = false;
                if (index === HERO_STAGES.length - 1) {
                    // Allow scroll exit after a small delay
                    setTimeout(() => setIsHeroActive(false), 500);
                } else {
                    setIsHeroActive(true);
                }
            }
        });
    }, [animationProgress]);

    // Handle Wheel Events for Controlled Snapping
    useEffect(() => {
        if (isLoading) return;

        const handleWheel = (e) => {
            // Check if we are at the top of the page
            const isAtTop = window.scrollY < 10;

            if (!isHeroActive && isAtTop && e.deltaY < 0) {
                // Return to hero if scrolling up from top
                setIsHeroActive(true);
            }

            if (!isHeroActive) return;

            const now = Date.now();
            if (now - lastScrollTime.current < 800 || isAnimating.current) {
                e.preventDefault();
                return;
            }

            if (Math.abs(e.deltaY) > 20) {
                e.preventDefault();
                lastScrollTime.current = now;

                if (e.deltaY > 0) {
                    // Scroll Down
                    if (activeStage < HERO_STAGES.length - 1) {
                        goToStage(activeStage + 1);
                    } else {
                        // Exit Hero
                        setIsHeroActive(false);
                        // Re-enable scroll by letting the event pass in next cycle
                    }
                } else {
                    // Scroll Up
                    if (activeStage > 0) {
                        goToStage(activeStage - 1);
                    }
                }
            }
        };

        window.addEventListener('wheel', handleWheel, { passive: false });
        return () => window.removeEventListener('wheel', handleWheel);
    }, [isLoading, activeStage, goToStage, isHeroActive]);

    // Body Scroll Locking
    useEffect(() => {
        if (isHeroActive) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isHeroActive]);

    // Handle Resize
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

    // Draw frame on animation
    useEffect(() => {
        return smoothProgress.on("change", (latest) => {
            render(latest);
        });
    }, [render, smoothProgress]);

    // Initial draw
    useEffect(() => {
        if (!isLoading && images.length > 0) {
            render(smoothProgress.get());
        }
    }, [isLoading, images, render, smoothProgress]);

    const loadingProgress = (loadedCount / FRAME_COUNT) * 100;

    return (
        <section
            ref={containerRef}
            style={{
                position: 'relative',
                height: '100vh',
                background: BG_COLOR,
                zIndex: isHeroActive ? 100 : 1
            }}
        >
            <AnimatePresence>
                {isLoading && <LuxuryLoader progress={loadingProgress} />}
            </AnimatePresence>

            <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
                zIndex: 10,
                pointerEvents: isHeroActive ? 'auto' : 'none',
                opacity: isHeroActive ? 1 : 0,
                transition: 'opacity 0.8s ease'
            }}>
                <canvas
                    ref={canvasRef}
                    style={{
                        width: '100vw',
                        height: '100vh',
                        display: 'block'
                    }}
                />

                {/* Grid Overlay */}
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage: 'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
                    backgroundSize: '100px 100px',
                    pointerEvents: 'none',
                    zIndex: 15
                }} />

                {/* Section Content */}
                {HERO_STAGES.map((section, idx) => (
                    <SectionText
                        key={section.id}
                        index={idx}
                        section={section}
                        animationProgress={smoothProgress}
                        activeIndex={activeStage}
                    />
                ))}

                {/* Stage Indicator */}
                <StageIndicator activeIndex={activeStage} />

                {/* Scroll Hint */}
                <AnimatePresence>
                    {!isLoading && activeStage === 0 && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            style={{
                                position: 'absolute',
                                bottom: '3rem',
                                left: '50%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                                gap: '0.5rem',
                                zIndex: 30,
                            }}
                        >
                            <motion.span style={{ fontSize: '0.65rem', letterSpacing: '0.2em', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase' }}>
                                Scroll to explore
                            </motion.span>
                            <motion.div
                                animate={{ y: [0, 8, 0] }}
                                transition={{ duration: 1.5, repeat: Infinity }}
                                style={{
                                    width: '20px',
                                    height: '32px',
                                    border: '2px solid rgba(255,255,255,0.3)',
                                    borderRadius: '10px',
                                    display: 'flex',
                                    justifyContent: 'center',
                                    paddingTop: '6px'
                                }}
                            >
                                <div style={{ width: '4px', height: '8px', background: 'white', borderRadius: '2px' }} />
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Invisible spacer to maintain layout flow if needed */}
            <div style={{ height: '100vh' }} />
        </section>
    );
}
