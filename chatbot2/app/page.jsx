"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [animationStep, setAnimationStep] = useState(0);
  // ⚠️ IMPORTANT: Replace this placeholder with your actual authentication logic
  const isUserSignedIn = false; // Example: Replace with a check like `useAuth().isSignedIn`

  useEffect(() => {
    setMounted(true);
    
    // Simplified progressive animation
    const timers = [
      setTimeout(() => setAnimationStep(1), 300),
      setTimeout(() => setAnimationStep(2), 600),
      setTimeout(() => setAnimationStep(3), 900),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Refined Background Effects */}
      <div className="absolute inset-0">
        {/* Clean gradient orbs */}
        <div className="absolute top-1/4 -left-64 w-96 h-96 bg-gradient-to-r from-orange-500/12 to-orange-400/6 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 -right-64 w-80 h-80 bg-gradient-to-l from-orange-600/10 to-white/4 rounded-full blur-3xl animate-pulse delay-1000"></div>
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 opacity-[0.025]">
          <div 
            className="w-full h-full"
            style={{
              backgroundImage: `
                linear-gradient(rgba(251,146,60,0.4) 1px, transparent 1px),
                linear-gradient(90deg, rgba(251,146,60,0.4) 1px, transparent 1px)
              `,
              backgroundSize: '120px 120px'
            }}
          ></div>
        </div>

        {/* Floating particles */}
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-orange-400/20 rounded-full animate-float"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${8 + Math.random() * 4}s`
            }}
          ></div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen text-center px-6 py-20">
        <div className="max-w-5xl mx-auto space-y-16">
          
          {/* Logo/Icon */}
          <div className={`transition-all duration-800 ease-out ${animationStep >= 1 ? 'opacity-100 scale-100 translate-y-0' : 'opacity-0 scale-95 translate-y-12'}`}>
            <div className="relative w-40 h-40 mx-auto mb-12">
              <div className="absolute inset-0 bg-gradient-to-br from-orange-400 to-orange-600 rounded-[2.5rem] shadow-2xl shadow-orange-500/25 transform rotate-3"></div>
              <div className="relative w-full h-full bg-gradient-to-br from-orange-500 to-orange-700 rounded-[2.5rem] shadow-xl flex items-center justify-center hover:scale-105 transition-all duration-300 border border-orange-400/20">
                {/* Chart Icon */}
                <svg className="w-20 h-20 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                {/* Floating dollar sign */}
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-orange-400 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-lg animate-bounce">
                  $
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className={`space-y-12 transition-all duration-800 delay-200 ${animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            
            {/* Title Section */}
            <div className="space-y-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight">
                <span className="text-white block mb-2">Smart Expense</span>
                <span className="bg-gradient-to-r from-orange-400 via-orange-500 to-orange-300 bg-clip-text text-transparent block">
                  Management
                </span>
              </h1>
              <div className="flex items-center justify-center space-x-4">
                <div className="w-16 h-1 bg-gradient-to-r from-transparent to-orange-500 rounded-full"></div>
                <div className="w-8 h-1 bg-orange-400 rounded-full"></div>
                <div className="w-16 h-1 bg-gradient-to-l from-transparent to-orange-500 rounded-full"></div>
              </div>
            </div>

            {/* Subtitle */}
            <div className="space-y-4">
              <p className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed font-light">
                Track expenses and get intelligent insights with our AI-powered assistant.
              </p>
              <p className="text-lg text-orange-400 font-medium">
                Simple, secure, and smart.
              </p>
            </div>

            {/* Feature Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto mt-16">
              {[
                { 
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  ), 
                  label: "AI-Powered",
                  desc: "Smart analysis"
                },
                { 
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  ), 
                  label: "Real-time Insights",
                  desc: "Live tracking"
                },
                { 
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                    </svg>
                  ), 
                  label: "Secure & Private",
                  desc: "Data protection"
                },
                { 
                  icon: (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                  ), 
                  label: "Easy to Use",
                  desc: "Simple interface"
                }
              ].map((feature, i) => (
                <div
                  key={feature.label}
                  className="group p-6 bg-gray-900/40 backdrop-blur-sm border border-gray-700/50 rounded-3xl text-center hover:border-orange-500/40 hover:bg-gray-800/50 transition-all duration-500 hover:scale-105 animate-fade-in-up"
                  style={{animationDelay: `${0.4 + i * 0.1}s`}}
                >
                  <div className="text-orange-400 mb-4 group-hover:text-orange-300 transition-colors duration-300 flex justify-center group-hover:scale-110 transform transition-transform duration-300">
                    {feature.icon}
                  </div>
                  <h3 className="text-white font-semibold text-lg mb-2">{feature.label}</h3>
                  <p className="text-gray-400 text-sm group-hover:text-gray-300 transition-colors duration-300">{feature.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Call to Action */}
          <div className={`transition-all duration-800 delay-400 ${animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-12'}`}>
            <div className="flex flex-col items-center space-y-6">
              
              {/* Main CTA Button */}
              <Link 
                href={isUserSignedIn ? "/chatbot" : "/sign-in"} 
                className="group relative overflow-hidden inline-block"
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 rounded-2xl blur-lg opacity-40 group-hover:opacity-70 transition duration-500"></div>
                <div className="relative px-10 py-5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-500 text-white rounded-2xl font-semibold text-lg shadow-2xl shadow-orange-500/30 group-hover:shadow-orange-500/50 transform group-hover:-translate-y-1 group-hover:scale-105 transition-all duration-300 min-w-[200px]">
                  <span className="relative z-10 flex items-center justify-center gap-3">
                    {isUserSignedIn ? (
                      <>
                        <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        Continue to Chat
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                        </svg>
                        Get Started
                      </>
                    )}
                  </span>
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-400 via-orange-300 to-orange-400 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                </div>
              </Link>

              {/* Secondary Info */}
              <p className="text-gray-500 text-sm max-w-md mx-auto">
                {isUserSignedIn ? (
                  "Continue your expense tracking journey with AI assistance"
                ) : (
                  "Join thousands of users managing their expenses smarter"
                )}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.2;
          }
          50% { 
            transform: translateY(-20px) translateX(10px); 
            opacity: 0.4;
          }
        }

        @keyframes fade-in-up {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        .animate-float {
          animation: float 12s ease-in-out infinite;
        }

        .animate-fade-in-up {
          opacity: 0;
          animation: fade-in-up 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }

        /* Responsive improvements */
        @media (max-width: 640px) {
          .min-w-[160px] { 
            min-width: 140px; 
          }
          
          /* Ensure proper touch targets on mobile */
          .group {
            min-height: 44px;
          }
          
          /* Optimize text sizes for mobile */
          .text-3xl {
            line-height: 1.1;
          }
        }
        
        @media (max-width: 768px) {
          .min-w-[180px] { 
            min-width: 160px; 
          }
          
          .min-w-[200px] { 
            min-width: 180px; 
            padding-left: 1.5rem;
            padding-right: 1.5rem;
          }
        }
        
        /* Improve mobile landscape experience */
        @media (max-height: 500px) and (orientation: landscape) {
          .py-12 {
            padding-top: 1rem;
            padding-bottom: 1rem;
          }
          
          .space-y-10 > :not([hidden]) ~ :not([hidden]) {
            margin-top: 1.5rem;
          }
          
          .mb-6 {
            margin-bottom: 1rem;
          }
        }

        /* Reduced motion support */
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-bounce,
          .animate-pulse {
            animation: none;
          }
          
          .group:hover {
            transform: none !important;
          }
        }

        /* Improved focus states */
        a:focus-visible {
          outline: 2px solid #fb923c;
          outline-offset: 4px;
        }
      `}</style>
    </div>
  );
}