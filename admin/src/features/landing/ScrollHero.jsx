import { useEffect, useRef, useState } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';

const FRAME_COUNT = 173;
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

    // Smooth scroll for frame interpolation
    const smoothProgress = useSpring(scrollYProgress, {
        stiffness: 100, // Reduced stiffness for smoother scrubbing
        damping: 30,    // Higher damping to prevent jitter
        restDelta: 0.001
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
                        // Skip frame if error, or handle gracefully (maybe reuse prev frame)
                        console.error('Failed to load frame', i);
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
        <div ref={containerRef} className="relative h-[400vh] bg-[#003366]"> {/* 400vh scroll track */}

            {/* Loading Screen */}
            {isLoading && (
                <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#003366] text-white">
                    <div className="w-16 h-16 mb-4 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    <p className="font-mono text-sm opacity-70">
                        Loading Experience... {Math.round((imagesLoaded / FRAME_COUNT) * 100)}%
                    </p>
                </div>
            )}

            {/* Sticky Canvas Container */}
            <div className="sticky top-0 left-0 w-full h-screen overflow-hidden">
                <canvas
                    ref={canvasRef}
                    className="block w-full h-full object-cover"
                />

                {/* Scroll Prompt (Only visible at start) */}
                <motion.div
                    style={{ opacity: useTransform(scrollYProgress, [0, 0.1], [1, 0]) }}
                    className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
                >
                    <span className="text-white/60 text-xs uppercase tracking-[0.2em]">Scroll to Explore</span>
                    <div className="w-[1px] h-12 bg-gradient-to-b from-white/0 via-white/50 to-white/0 animate-pulse" />
                </motion.div>
            </div>

        </div>
    );
}
