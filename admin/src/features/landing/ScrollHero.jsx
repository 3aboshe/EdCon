import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const FRAME_COUNT = 137;
const IMAGE_PATH_PREFIX = '/hero-assets/animation/frame_';

export default function ScrollHero() {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [images, setImages] = useState([]);
    const [imagesLoaded, setImagesLoaded] = useState(0);
    const [isLoading, setIsLoading] = useState(true);

    // Scroll Progress
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end end"]
    });

    // Much smoother scroll for frame interpolation (slower response)
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 30,  // Much lower stiffness for slower, smoother scrubbing
        damping: 50,    // Higher damping to prevent jitter
        restDelta: 0.0001
    });

    // Preload Images
    useEffect(() => {
        let loadedCount = 0;
        const loadedImages = [];

        const preloadImages = async () => {
            for (let i = 0; i < FRAME_COUNT; i++) {
                const img = new Image();
                const frameNum = i.toString().padStart(3, '0');
                img.src = `${IMAGE_PATH_PREFIX}${frameNum}.jpg`;

                await new Promise((resolve) => {
                    img.onload = () => {
                        loadedCount++;
                        setImagesLoaded(loadedCount);
                        loadedImages[i] = img;
                        if (loadedCount === FRAME_COUNT) {
                            setImages(loadedImages);
                            setIsLoading(false);
                        }
                        resolve();
                    };
                    img.onerror = () => {
                        console.error('Failed to load frame', i);
                        loadedCount++;
                        setImagesLoaded(loadedCount);
                        if (loadedCount === FRAME_COUNT) {
                            setImages(loadedImages);
                            setIsLoading(false);
                        }
                        resolve();
                    }
                });
            }
        };

        preloadImages();
    }, []);

    // Render Frame based on Scroll
    useEffect(() => {
        const renderFrame = (index) => {
            const canvas = canvasRef.current;
            if (!canvas || !images[index]) return;

            const ctx = canvas.getContext('2d');
            const img = images[index];

            // Maintain aspect ratio cover
            const canvasRatio = canvas.width / canvas.height;
            const imgRatio = img.width / img.height;

            let drawWidth, drawHeight, offsetX, offsetY;

            if (imgRatio > canvasRatio) {
                drawHeight = canvas.height;
                drawWidth = drawHeight * imgRatio;
                offsetY = 0;
                offsetX = (canvas.width - drawWidth) / 2;
            } else {
                drawWidth = canvas.width;
                drawHeight = drawWidth / imgRatio;
                offsetX = 0;
                offsetY = (canvas.height - drawHeight) / 2;
            }

            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
        };

        const unsubscribe = smoothProgress.on("change", (latest) => {
            if (images.length === 0) return;

            // Map 0-1 to 0-(FRAME_COUNT-1)
            const frameIndex = Math.min(
                FRAME_COUNT - 1,
                Math.floor(latest * FRAME_COUNT)
            );

            requestAnimationFrame(() => renderFrame(frameIndex));
        });

        // Initial render
        if (!isLoading && images.length > 0) {
            renderFrame(0);
        }

        // Handle Resize
        const handleResize = () => {
            if (canvasRef.current) {
                canvasRef.current.width = window.innerWidth;
                canvasRef.current.height = window.innerHeight;
                // Re-render current frame
                const currentProgress = smoothProgress.get();
                const frameIndex = Math.min(
                    FRAME_COUNT - 1,
                    Math.floor(currentProgress * FRAME_COUNT)
                );
                renderFrame(frameIndex);
            }
        }

        window.addEventListener('resize', handleResize);
        handleResize(); // Init size

        return () => {
            unsubscribe();
            window.removeEventListener('resize', handleResize);
        };

    }, [isLoading, images, smoothProgress]);


    return (
        <div
            ref={containerRef}
            style={{
                position: 'relative',
                height: '600vh', // Much longer scroll track for slower animation
                backgroundColor: '#003366'
            }}
        >
            {/* Loading Screen */}
            {isLoading && (
                <div style={{
                    position: 'fixed',
                    inset: 0,
                    zIndex: 50,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: '#003366',
                    color: 'white',
                }}>
                    <div style={{
                        width: '64px',
                        height: '64px',
                        marginBottom: '1rem',
                        border: '4px solid rgba(255,255,255,0.2)',
                        borderTopColor: 'white',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                    }} />
                    <p style={{ fontFamily: 'monospace', fontSize: '0.875rem', opacity: 0.7 }}>
                        Loading Experience... {Math.round((imagesLoaded / FRAME_COUNT) * 100)}%
                    </p>
                </div>
            )}

            {/* Sticky Canvas Container */}
            <div style={{
                position: 'sticky',
                top: 0,
                left: 0,
                width: '100%',
                height: '100vh',
                overflow: 'hidden',
            }}>
                <canvas
                    ref={canvasRef}
                    style={{ display: 'block', width: '100%', height: '100%', objectFit: 'cover' }}
                />

                {/* Scroll Prompt (Only visible at start) */}
                <motion.div
                    style={{
                        opacity: useTransform(scrollYProgress, [0, 0.05], [1, 0]),
                        position: 'absolute',
                        bottom: '40px',
                        left: '50%',
                        transform: 'translateX(-50%)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: '0.5rem',
                        pointerEvents: 'none',
                    }}
                >
                    <span style={{
                        color: 'rgba(255,255,255,0.6)',
                        fontSize: '0.75rem',
                        textTransform: 'uppercase',
                        letterSpacing: '0.2em'
                    }}>
                        Scroll to Explore
                    </span>
                    <div style={{
                        width: '1px',
                        height: '48px',
                        background: 'linear-gradient(to bottom, transparent, rgba(255,255,255,0.5), transparent)',
                        animation: 'pulse 2s ease-in-out infinite',
                    }} />
                </motion.div>
            </div>
        </div>
    );
}
