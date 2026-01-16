import PublicNavbar from '../../components/common/PublicNavbar';
import ScrollHero from './ScrollHero';

export default function LandingPage() {
    return (
        <main className="bg-[#003366] min-h-screen">
            <PublicNavbar />
            <ScrollHero />

            {/* Content below the scroll animation (Optional, just to show where it ends) */}
            <section className="relative z-10 bg-white py-24 px-6 md:px-12">
                <div className="max-w-7xl mx-auto text-center">
                    <h2 className="text-4xl md:text-5xl font-bold text-[#003366] mb-6">
                        Bridging the Gap
                    </h2>
                    <p className="text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
                        EdCona seamlessly connects educators and parents, ensuring that every student's journey is supported by a unified community.
                    </p>

                    <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8">
                        {[
                            { title: "Real-time Updates", desc: "Instantly know about attendance, grades, and behavior." },
                            { title: "Direct Communication", desc: "Chat directly with teachers without barriers." },
                            { title: "Performance Analytics", desc: "Visualize progress with intuitive dashboards." }
                        ].map((item, i) => (
                            <div key={i} className="p-8 rounded-2xl bg-gray-50 border border-gray-100 hover:shadow-xl transition-shadow">
                                <h3 className="text-xl font-bold text-[#003366] mb-3">{item.title}</h3>
                                <p className="text-gray-500">{item.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Simple Footer */}
            <footer className="bg-[#001a33] text-white/40 py-12 text-center text-sm">
                <p>&copy; {new Date().getFullYear()} EdCona. All rights reserved.</p>
            </footer>
        </main>
    );
}
