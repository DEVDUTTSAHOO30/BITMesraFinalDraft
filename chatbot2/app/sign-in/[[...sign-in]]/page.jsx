"use client";

import { SignIn, useUser } from "@clerk/nextjs";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function SignInPage() {
  const { isLoaded, isSignedIn } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  // Handle redirection if the user is already logged in
  useEffect(() => {
    if (isLoaded && isSignedIn) {
      router.push("/chatbot");
    }
  }, [isLoaded, isSignedIn, router]);

  // Handle the custom loading animation
  useEffect(() => {
    if (!isLoaded || isSignedIn) {
      return;
    }

    const timer1 = setTimeout(() => setAnimationStep(1), 400);
    const timer2 = setTimeout(() => setAnimationStep(2), 900);
    const timer3 = setTimeout(() => setAnimationStep(3), 1400);
    const timer4 = setTimeout(() => {
      setAnimationStep(4);
      setIsLoading(false);
    }, 2200);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [isLoaded, isSignedIn]);

  // Show a blank loading screen while Clerk is loading, or if the user is already signed in and we are redirecting
  if (!isLoaded || isSignedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-900 to-black flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-full blur-xl animate-pulse"></div>
          <h1 className="relative text-white text-3xl font-bold px-8 py-4">Loading...</h1>
        </div>
      </div>
    );
  }

  // Enhanced loading animation
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black flex items-center justify-center relative overflow-hidden">
        {/* Enhanced Animated Background */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-orange-400/15 rounded-full blur-2xl animate-pulse delay-700"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-white/5 rounded-full blur-xl animate-ping"></div>
          
          {/* Animated grid overlay */}
          <div className="absolute inset-0 opacity-5">
            <div className="w-full h-full" style={{
              backgroundImage: `
                linear-gradient(rgba(249, 115, 22, 0.3) 1px, transparent 1px),
                linear-gradient(90deg, rgba(249, 115, 22, 0.3) 1px, transparent 1px)
              `,
              backgroundSize: '60px 60px',
              animation: 'grid-move 20s linear infinite'
            }}></div>
          </div>
        </div>

        {/* Loading Content */}
        <div className="relative z-10 text-center max-w-md mx-auto px-6">
          <div className={`mb-10 transition-all duration-1000 ${
            animationStep >= 1 ? 'opacity-100 scale-100' : 'opacity-0 scale-75'
          }`}>
            <div className="w-32 h-32 mx-auto mb-8 relative">
              <div className="absolute inset-0 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              <div className="absolute inset-2 border-2 border-orange-400/30 border-b-orange-400 rounded-full animate-spin animate-reverse delay-300"></div>
              <div className="absolute inset-6 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-500/50">
                <div className="w-16 h-16 bg-gradient-to-br from-black to-gray-900 rounded-full flex items-center justify-center">
                  <span className="text-orange-400 text-3xl animate-pulse">🔐</span>
                </div>
              </div>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black mb-4 bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent tracking-tight">
              Welcome Back
            </h1>
            <p className="text-gray-400 text-base sm:text-lg font-medium">Initializing secure connection</p>
          </div>

          <div className={`mb-10 transition-all duration-1000 delay-400 ${
            animationStep >= 2 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="grid grid-cols-1 gap-4 mb-6">
              {["Authenticating Identity", "Verifying Credentials", "Securing Session"].map((step, i) => (
                <div key={step} className={`flex items-center justify-between p-3 sm:p-4 rounded-2xl border transition-all duration-700 ${
                  animationStep >= i + 2 
                    ? 'bg-orange-500/10 border-orange-500/30 text-orange-300' 
                    : 'bg-gray-900/50 border-gray-800 text-gray-500'
                }`}>
                  <span className="font-medium text-sm sm:text-base">{step}</span>
                  <div className={`w-4 h-4 rounded-full transition-all duration-500 ${
                    animationStep >= i + 2
                      ? 'bg-orange-400 shadow-lg shadow-orange-400/50 animate-pulse'
                      : 'bg-gray-700'
                  }`}></div>
                </div>
              ))}
            </div>

            <div className="w-full max-w-sm mx-auto">
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>Progress</span>
                <span>{Math.min(animationStep * 25, 100)}%</span>
              </div>
              <div className="w-full h-2 bg-gray-900 rounded-full overflow-hidden border border-gray-800">
                <div
                  className="h-full bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 rounded-full transition-all duration-1500 ease-out relative"
                  style={{
                    width: animationStep >= 4 ? '100%' : `${Math.min(animationStep * 30, 90)}%`,
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-full animate-shimmer"></div>
                </div>
              </div>
            </div>
          </div>

          <div className={`transition-all duration-1000 delay-800 ${
            animationStep >= 3 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
          }`}>
            <div className="bg-gray-900/50 rounded-2xl p-4 sm:p-6 border border-gray-800 backdrop-blur-sm">
              <p className="text-white text-base sm:text-lg mb-4 font-medium">
                {animationStep === 1 && "Establishing secure tunnel..."}
                {animationStep === 2 && "Validating user permissions..."}
                {animationStep === 3 && "Preparing workspace environment..."}
                {animationStep >= 4 && "Access granted! Redirecting..."}
              </p>
              <div className="flex justify-center space-x-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="w-2 h-2 bg-orange-500 rounded-full animate-bounce"
                    style={{ animationDelay: `${i * 0.12}s` }}
                  ></div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      {/* Enhanced Background Effects */}
      <div className="absolute inset-0">
        <div className="absolute top-1/5 right-1/5 w-[600px] h-[600px] bg-gradient-to-bl from-orange-500/15 via-orange-600/8 to-transparent rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/5 left-1/5 w-[500px] h-[500px] bg-gradient-to-tr from-orange-400/12 via-white/3 to-transparent rounded-full blur-3xl animate-pulse delay-1000"></div>

        <div className="absolute inset-0 opacity-[0.02]">
          <div className="w-full h-full" style={{
            backgroundImage: `
              linear-gradient(rgba(249, 115, 22, 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgba(249, 115, 22, 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '80px 80px'
          }}></div>
        </div>

        {/* Enhanced floating particles */}
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-float-security"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 8}s`,
              animationDuration: `${6 + Math.random() * 4}s`
            }}
          >
            <div className={`rounded-full ${
              i % 3 === 0 ? 'w-1 h-1 bg-orange-400/40' :
              i % 3 === 1 ? 'w-2 h-2 bg-orange-500/30' :
              'w-1.5 h-1.5 bg-white/20'
            }`}></div>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 flex items-center justify-center min-h-screen p-4 sm:p-6">
        <div className="w-full max-w-sm sm:max-w-lg">
          {/* Enhanced Header */}
          <div className="text-center mb-8 sm:mb-12 animate-fade-in-up">
            <div className="inline-block relative mb-4 sm:mb-6">
              <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/30 to-orange-400/30 rounded-3xl blur-lg opacity-75"></div>
              <div className="relative p-3 sm:p-4 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 rounded-3xl shadow-2xl shadow-orange-500/25">
                <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-black to-gray-900 rounded-2xl flex items-center justify-center">
                  <span className="text-2xl sm:text-3xl">🔐</span>
                </div>
              </div>
            </div>
            <h1 className="text-4xl sm:text-6xl font-black mb-3 sm:mb-4 bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent tracking-tight">
              Sign In
            </h1>
            <p className="text-gray-400 text-lg sm:text-xl font-medium">Access your secure dashboard</p>
          </div>

          {/* Enhanced Clerk SignIn Component */}
          <div className="animate-fade-in-up animation-delay-300">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 rounded-2xl sm:rounded-3xl blur-lg opacity-20 group-hover:opacity-40 transition duration-1000"></div>
              <div className="relative bg-gradient-to-br from-gray-900/80 via-gray-900/60 to-gray-900/80 backdrop-blur-2xl border border-gray-700/50 rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 shadow-2xl overflow-hidden">
                <div className="w-full max-w-full overflow-hidden">
                  <SignIn
                    afterSignInUrl="/chatbot"
                    appearance={{
                      elements: {
                        rootBox: "mx-auto w-full max-w-full",
                        card: "bg-transparent shadow-none border-none w-full max-w-full rounded-none sm:rounded-2xl",
                        headerTitle: "text-white text-xl sm:text-2xl lg:text-3xl font-bold",
                        headerSubtitle: "text-gray-300 text-sm sm:text-base",
                        socialButtonsBlockButton: "bg-gray-800/80 border-gray-600 text-white hover:bg-gray-700/80 hover:border-orange-500/50 transition-all duration-300 rounded-lg sm:rounded-xl py-3 sm:py-4 font-medium text-sm sm:text-base w-full",
                        socialButtonsBlockButtonText: "text-white font-semibold text-sm sm:text-base",
                        dividerLine: "bg-gray-600",
                        dividerText: "text-gray-300 text-sm sm:text-base",
                        formFieldInput: "bg-gray-800/50 border-gray-600 text-white placeholder-gray-400 focus:border-orange-500 focus:ring-orange-500/30 focus:ring-2 sm:focus:ring-4 rounded-lg sm:rounded-xl py-3 sm:py-4 px-4 sm:px-6 text-sm sm:text-base transition-all duration-300 w-full",
                        formFieldLabel: "text-gray-200 font-semibold text-sm sm:text-base mb-2 sm:mb-3",
                        formButtonPrimary: "bg-gradient-to-r from-orange-600 via-orange-500 to-orange-400 hover:from-orange-700 hover:via-orange-600 hover:to-orange-500 text-white font-bold py-3 sm:py-4 px-6 sm:px-8 rounded-lg sm:rounded-xl transition-all duration-300 transform hover:scale-[1.02] shadow-xl hover:shadow-orange-500/30 text-sm sm:text-base w-full",
                        footerActionLink: "text-orange-400 hover:text-orange-300 font-semibold transition-colors duration-300 text-sm sm:text-base",
                        identityPreviewEditButton: "text-orange-400 hover:text-orange-300",
                        formFieldSuccessText: "text-green-400 text-xs sm:text-sm",
                        formFieldErrorText: "text-red-400 text-xs sm:text-sm",
                        alertClerkError: "text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg sm:rounded-xl p-3 sm:p-4 text-sm",
                        formHeaderTitle: "text-white text-lg sm:text-xl lg:text-2xl font-bold",
                        formHeaderSubtitle: "text-gray-300 text-sm sm:text-base",
                        main: "w-full max-w-full rounded-lg sm:rounded-xl",
                        formContainer: "w-full max-w-full",
                        form: "w-full max-w-full space-y-4 sm:space-y-6",
                        formField: "w-full max-w-full",
                        formFieldRow: "w-full max-w-full",
                        socialButtons: "w-full max-w-full space-y-3 sm:space-y-4",
                        socialButtonsProviderIcon: "w-4 h-4 sm:w-5 sm:h-5",
                        footer: "w-full max-w-full text-center",
                        footerAction: "w-full max-w-full text-center text-sm sm:text-base",
                        internal: "w-full max-w-full overflow-hidden rounded-lg sm:rounded-xl",
                        identityPreview: "rounded-lg sm:rounded-xl",
                        identityPreviewAvatarBox: "rounded-lg sm:rounded-xl",
                        alternativeMethods: "rounded-lg sm:rounded-xl",
                        alternativeMethodsBlockButton: "rounded-lg sm:rounded-xl"
                      },
                      variables: {
                        borderRadius: "0.5rem",
                        spacingUnit: "1rem"
                      }
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Footer */}
          <div className="text-center mt-8 sm:mt-12 animate-fade-in-up animation-delay-800">
            <div className="p-4 sm:p-6 bg-gray-900/30 rounded-2xl border border-gray-700/30 backdrop-blur-sm">
              <p className="text-gray-300 text-sm sm:text-base">
                New to our platform?{" "}
                <a
                  href="/sign-up"
                  className="text-orange-400 hover:text-orange-300 font-bold transition-colors duration-300 hover:underline decoration-orange-400"
                >
                  Create your account
                </a>
              </p>
              <p className="text-gray-500 text-xs sm:text-sm mt-2">Join thousands of users managing their expenses securely</p>
            </div>
          </div>
        </div>
      </div>

      {/* Enhanced Custom Styles */}
      <style jsx>{`
        @keyframes float-security {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1) rotate(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-20px) translateX(10px) scale(1.3) rotate(90deg);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-10px) translateX(-8px) scale(0.7) rotate(180deg);
            opacity: 0.6;
          }
          75% {
            transform: translateY(-25px) translateX(6px) scale(1.2) rotate(270deg);
            opacity: 0.9;
          }
        }

        @keyframes fade-in-up {
          from {
            opacity: 0;
            transform: translateY(40px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(100%);
          }
        }

        @keyframes grid-move {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(60px, 60px);
          }
        }

        .animate-float-security {
          animation: float-security 8s ease-in-out infinite;
        }

        .animate-fade-in-up {
          animation: fade-in-up 1s ease-out forwards;
        }

        .animate-shimmer {
          animation: shimmer 2s ease-in-out infinite;
        }

        .animate-reverse {
          animation-direction: reverse;
        }

        .animation-delay-300 {
          animation-delay: 0.3s;
          opacity: 0;
        }

        .animation-delay-600 {
          animation-delay: 0.6s;
          opacity: 0;
        }

        .animation-delay-800 {
          animation-delay: 0.8s;
          opacity: 0;
        }

        /* Enhanced scrollbar */
        ::-webkit-scrollbar {
          width: 10px;
        }

        ::-webkit-scrollbar-track {
          background: #111827;
          border-radius: 5px;
        }

        ::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f97316, #ea580c);
          border-radius: 5px;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.3);
        }

        ::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ea580c, #dc2626);
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.5);
        }

        /* Mobile-specific fixes with important declarations */
        @media (max-width: 640px) {
          .text-6xl {
            font-size: 2.5rem !important;
            line-height: 1.1 !important;
          }
          
          .text-4xl {
            font-size: 2rem !important;
            line-height: 1.2 !important;
          }
          
          /* Force rounded corners on all Clerk elements */
          [data-clerk-element],
          [data-clerk-element] > *,
          [data-clerk-element] input,
          [data-clerk-element] button,
          [data-clerk-element] .cl-internal-b3fm6y,
          [data-clerk-element] .cl-card,
          [data-clerk-element] .cl-main,
          [data-clerk-element] .cl-form,
          [data-clerk-element] .cl-formButtonPrimary,
          [data-clerk-element] .cl-formField,
          [data-clerk-element] .cl-formFieldInput,
          [data-clerk-element] .cl-socialButtonsBlockButton {
            border-radius: 0.75rem !important;
            overflow: hidden !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
          }
          
          /* Ensure form elements don't overflow */
          input[type="email"],
          input[type="password"],
          input[type="text"] {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 0.75rem !important;
            min-height: 44px !important;
          }
          
          button {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
            border-radius: 0.75rem !important;
            min-height: 44px !important;
          }

          /* Additional Clerk-specific overrides for mobile */
          .cl-internal-b3fm6y,
          .cl-card,
          .cl-main,
          .cl-form,
          .cl-formButtonPrimary,
          .cl-formField,
          .cl-formFieldInput,
          .cl-socialButtonsBlockButton,
          .cl-identityPreview,
          .cl-alternativeMethods,
          .cl-alternativeMethodsBlockButton {
            border-radius: 0.75rem !important;
          }
        }

        @media (max-width: 480px) {
          .p-4 {
            padding: 1rem !important;
          }
          
          .rounded-3xl {
            border-radius: 1rem !important;
          }
          
          .rounded-2xl {
            border-radius: 0.75rem !important;
          }
          
          /* Further mobile optimization */
          .text-4xl {
            font-size: 1.875rem !important;
          }
          
          .text-lg {
            font-size: 1rem !important;
          }

          /* Extra small screen overrides */
          [data-clerk-element],
          [data-clerk-element] > *,
          [data-clerk-element] input,
          [data-clerk-element] button,
          .cl-internal-b3fm6y,
          .cl-card,
          .cl-main,
          .cl-form,
          .cl-formButtonPrimary,
          .cl-formField,
          .cl-formFieldInput,
          .cl-socialButtonsBlockButton {
            border-radius: 0.5rem !important;
          }
        }

        /* Global Clerk overrides to ensure rounded corners */
        [data-clerk-element] {
          --cl-radius: 0.75rem;
        }

        .cl-internal-b3fm6y,
        .cl-card,
        .cl-main,
        .cl-form,
        .cl-formButtonPrimary,
        .cl-formField,
        .cl-formFieldInput,
        .cl-socialButtonsBlockButton,
        .cl-identityPreview,
        .cl-identityPreviewAvatarBox,
        .cl-alternativeMethods,
        .cl-alternativeMethodsBlockButton,
        .cl-alertClerkError {
          border-radius: 0.75rem !important;
        }

        @media (min-width: 640px) {
          .cl-internal-b3fm6y,
          .cl-card,
          .cl-main,
          .cl-form,
          .cl-formButtonPrimary,
          .cl-formField,
          .cl-formFieldInput,
          .cl-socialButtonsBlockButton,
          .cl-identityPreview,
          .cl-identityPreviewAvatarBox,
          .cl-alternativeMethods,
          .cl-alternativeMethodsBlockButton,
          .cl-alertClerkError {
            border-radius: 1rem !important;
          }
        }
      `}</style>
    </div>
  );
}