"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { isSignedIn, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    setMounted(true);
    
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLogoClick = () => {
    router.push('/');
  };

  if (!mounted || !isLoaded) {
    return (
      <header className="bg-black h-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center h-full">
          <div className="h-6 bg-gray-800/50 rounded w-40 animate-pulse"></div>
          <div className="h-8 bg-gray-800/50 rounded-full w-8 animate-pulse"></div>
        </div>
      </header>
    );
  }

  return (
    <>
      <header 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-700 ${
          scrolled 
            ? 'bg-black/90 backdrop-blur-xl shadow-2xl shadow-orange-500/20' 
            : 'bg-black/95 backdrop-blur-sm'
        }`}
      >
        {/* Refined Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          {/* Gradient accent line */}
          <div className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-orange-500 to-transparent transition-opacity duration-500 ${scrolled ? 'opacity-80' : 'opacity-40'}`}></div>
          
          {/* Minimal floating particles */}
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute w-0.5 h-0.5 bg-orange-400/25 rounded-full animate-float"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${25 + Math.random() * 50}%`,
                animationDelay: `${Math.random() * 8}s`,
                animationDuration: `${6 + Math.random() * 4}s`
              }}
            ></div>
          ))}

          {/* Subtle background glow */}
          <div className="absolute top-1/2 left-1/3 w-40 h-40 bg-orange-500/3 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 right-1/3 w-32 h-32 bg-white/2 rounded-full blur-2xl animate-pulse delay-1000"></div>
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center h-20">
          {/* Enhanced Logo Section */}
          <div className="flex items-center space-x-8">
            <div className="flex items-center space-x-3 group cursor-pointer" onClick={handleLogoClick}>
              {/* Animated Logo Icon */}
              <div className="relative">
                <div className={`w-11 h-11 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-500 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-6 ${scrolled ? 'shadow-lg shadow-orange-500/30' : 'shadow-md shadow-orange-500/20'}`}>
                  <div className="w-7 h-7 bg-black/90 rounded-xl flex items-center justify-center relative overflow-hidden">
                    {/* SVG Icon instead of emoji */}
                    <svg className="w-4 h-4 text-orange-400 group-hover:text-orange-300 transition-colors duration-300" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M7,15H9C9,16.08 10.37,17 12,17C13.63,17 15,16.08 15,15C15,13.9 13.96,13.5 11.76,12.97C9.64,12.44 7,11.78 7,9C7,7.21 8.47,5.69 10.5,5.18V3H13.5V5.18C15.53,5.69 17,7.21 17,9H15C15,7.92 13.63,7 12,7C10.37,7 9,7.92 9,9C9,10.1 10.04,10.5 12.24,11.03C14.36,11.56 17,12.22 17,15C17,16.79 15.53,18.31 13.5,18.82V21H10.5V18.82C8.47,18.31 7,16.79 7,15Z"/>
                    </svg>
                    
                    {/* Animated background pattern */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  </div>
                </div>
                
                {/* Enhanced glow effect */}
                <div className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-600 to-orange-500 rounded-2xl blur opacity-0 group-hover:opacity-40 transition-opacity duration-500 -z-10"></div>
              </div>

              {/* Enhanced Title */}
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent group-hover:from-orange-300 group-hover:via-white group-hover:to-orange-200 transition-all duration-500">
                  Expense Chatbot
                </h1>
                <div className="h-0.5 bg-gradient-to-r from-orange-500 via-orange-400 to-transparent rounded-full transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left"></div>
              </div>
            </div>

            {/* Navigation Menu - Only show when signed in */}
            {isSignedIn && (
              <nav className="hidden md:flex items-center space-x-6">
                <Link 
                  href="/expenseDash" 
                  className="relative group flex items-center space-x-2.5 px-4 py-2 text-gray-300 hover:text-white transition-all duration-300"
                >
                  <svg className="w-5 h-5 text-orange-400/80 group-hover:text-orange-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                  <span className="relative z-10 font-medium">Dashboard</span>
                  <div className="absolute inset-0 bg-gray-800/50 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"></div>
                  <div className="absolute inset-0 border border-orange-500/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-orange-500 to-orange-600 transition-all duration-500 group-hover:w-full"></div>
                </Link>
              </nav>
            )}
          </div>

          {/* User Section - Clean and Simple */}
          <div className="flex items-center space-x-4">
            {/* Mobile Dashboard Link - Only show when signed in */}
            {isSignedIn && (
              <Link 
                href="/expenseDash" 
                className="md:hidden relative group p-2 text-gray-300 hover:text-white transition-all duration-300"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-600/20 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </Link>
            )}

            {/* Enhanced User Button */}
            <div className="relative group">
              {/* Multi-layer glow effect */}
              <div className="absolute -inset-2 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-500 rounded-full blur opacity-0 group-hover:opacity-30 transition-all duration-500"></div>
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-600 to-orange-400 rounded-full blur-sm opacity-0 group-hover:opacity-50 transition-all duration-300"></div>
              
              {/* User Button Container */}
              <div className="relative bg-gradient-to-br from-gray-800 to-gray-900 p-1.5 rounded-full border border-gray-700 group-hover:border-orange-500/60 transition-all duration-300 group-hover:bg-gradient-to-br group-hover:from-gray-700 group-hover:to-gray-800 shadow-lg">
                <UserButton 
                  afterSignOutUrl="/"
                  appearance={{
                    elements: {
                      avatarBox: {
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        border: "2px solid transparent",
                        transition: "all 300ms ease",
                        "&:hover": {
                          borderColor: "#fb923c",
                          transform: "scale(1.05)"
                        }
                      },
                      userButtonPopoverCard: {
                        backgroundColor: "#111827",
                        border: "1px solid #374151",
                        borderRadius: "16px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(251, 146, 60, 0.1)",
                        backdropFilter: "blur(16px)"
                      },
                      userButtonPopoverActionButton: {
                        color: "#d1d5db",
                        "&:hover": {
                          color: "#ffffff",
                          backgroundColor: "#1f2937"
                        }
                      },
                      userButtonPopoverActionButtonText: {
                        color: "#d1d5db",
                        fontSize: "14px",
                        fontWeight: "500"
                      },
                      userButtonPopoverActionButtonIcon: {
                        color: "#fb923c"
                      },
                      userButtonPopoverFooter: "display: none"
                    }
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Bottom Accent */}
        <div className="relative h-px">
          <div className={`absolute inset-0 bg-gradient-to-r from-transparent via-orange-500 to-transparent transition-all duration-500 ${scrolled ? 'opacity-100 scale-x-100' : 'opacity-60 scale-x-75'}`}></div>
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent opacity-20"></div>
        </div>
      </header>

      {/* Spacer to prevent content overlap */}
      <div className="h-20"></div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { 
            transform: translateY(0px) translateX(0px); 
            opacity: 0.25;
          }
          33% { 
            transform: translateY(-8px) translateX(4px); 
            opacity: 0.5;
          }
          66% { 
            transform: translateY(-3px) translateX(-6px); 
            opacity: 0.3;
          }
        }
        
        .animate-float {
          animation: float 10s ease-in-out infinite;
        }

        /* Enhanced scrollbar styling */
        ::-webkit-scrollbar {
          width: 6px;
        }
        
        ::-webkit-scrollbar-track {
          background: linear-gradient(to bottom, #1f2937, #111827);
          border-radius: 3px;
        }
        
        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #fb923c, #f97316);
          border-radius: 3px;
          box-shadow: inset 0 0 3px rgba(0,0,0,0.3);
        }
        
        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #f97316, #ea580c);
        }

        /* Smooth backdrop blur transition */
        .backdrop-blur-xl {
          backdrop-filter: blur(24px);
        }

        .backdrop-blur-sm {
          backdrop-filter: blur(4px);
        }

        /* Custom UserButton hover effects */
        .cl-avatarBox {
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
        }

        .cl-avatarBox:hover {
          transform: scale(1.05) !important;
          box-shadow: 0 0 20px rgba(251, 146, 60, 0.4) !important;
        }

        /* Mobile optimizations */
        @media (max-width: 640px) {
          .backdrop-blur-xl {
            backdrop-filter: blur(16px);
          }
        }

        /* Accessibility and reduced motion */
        @media (prefers-reduced-motion: reduce) {
          .animate-float,
          .animate-pulse,
          .animate-ping {
            animation: none;
          }
          
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }

        /* High contrast mode support */
        @media (prefers-contrast: high) {
          .bg-gradient-to-r {
            background: #fb923c;
          }
        }
      `}</style>
    </>
  );
}
