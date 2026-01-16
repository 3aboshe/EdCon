import PublicNavbar from '../../components/common/PublicNavbar';
import ScrollHero from './ScrollHero';

export default function LandingPage() {
    return (
        <main style={{ backgroundColor: '#003366', minHeight: '100vh' }}>
            <PublicNavbar />
            <ScrollHero />

            {/* Content below the scroll animation */}
            <section style={{
                position: 'relative',
                zIndex: 10,
                backgroundColor: '#002244',
                padding: '6rem 1.5rem',
            }}>
                <div style={{ maxWidth: '1280px', margin: '0 auto', textAlign: 'center' }}>
                    <h2 style={{
                        fontSize: 'clamp(2rem, 5vw, 3rem)',
                        fontWeight: 700,
                        color: 'white',
                        marginBottom: '1.5rem',
                    }}>
                        Bridging the Gap
                    </h2>
                    <p style={{
                        fontSize: '1.125rem',
                        color: 'rgba(255,255,255,0.7)',
                        maxWidth: '640px',
                        margin: '0 auto',
                        lineHeight: 1.7,
                    }}>
                        EdCona seamlessly connects educators and parents, ensuring that every student's journey is supported by a unified community.
                    </p>

                    <div style={{
                        marginTop: '3rem',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '2rem',
                    }}>
                        {[
                            { title: "Real-time Updates", desc: "Instantly know about attendance, grades, and behavior." },
                            { title: "Direct Communication", desc: "Chat directly with teachers without barriers." },
                            { title: "Performance Analytics", desc: "Visualize progress with intuitive dashboards." }
                        ].map((item, i) => (
                            <div key={i} style={{
                                padding: '2rem',
                                borderRadius: '1rem',
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.1)',
                                transition: 'all 0.3s',
                            }}>
                                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'white', marginBottom: '0.75rem' }}>
                                    {item.title}
                                </h3>
                                <p style={{ color: 'rgba(255,255,255,0.6)' }}>{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer style={{
                backgroundColor: '#001a33',
                color: 'rgba(255,255,255,0.4)',
                padding: '3rem 0',
                textAlign: 'center',
                fontSize: '0.875rem',
            }}>
                <p>&copy; {new Date().getFullYear()} EdCona. All rights reserved.</p>
            </footer>
        </main>
    );
}
