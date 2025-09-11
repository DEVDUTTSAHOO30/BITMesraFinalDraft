// app/chatbot/components/AnimatedBackground.js

export default function AnimatedBackground() {
    return (
        <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/5 right-1/5 w-[500px] h-[500px] bg-gradient-to-br from-orange-500/8 via-orange-600/4 to-transparent rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/5 left-1/5 w-[400px] h-[400px] bg-gradient-to-tr from-orange-400/6 via-white/2 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>

            <div className="absolute inset-0 opacity-[0.03]">
                <div className="w-full h-full grid-pattern"></div>
            </div>

            {[...Array(20)].map((_, i) => (
                <div
                    key={i}
                    className="absolute animate-float-particle"
                    style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${Math.random() * 8}s`,
                        animationDuration: `${6 + Math.random() * 6}s`,
                    }}
                >
                    <div
                        className={`rounded-full ${i % 4 === 0
                            ? "w-1 h-1 bg-orange-400/30"
                            : i % 4 === 1
                                ? "w-2 h-2 bg-orange-500/20"
                                : i % 4 === 2
                                    ? "w-1.5 h-1.5 bg-white/15"
                                    : "w-0.5 h-0.5 bg-orange-300/40"
                            }`}
                    ></div>
                </div>
            ))}
        </div>
    );
}