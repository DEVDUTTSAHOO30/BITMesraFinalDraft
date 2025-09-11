// app/chatbot/page.js

"use client";

import { useState, useEffect, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import MessageList from "./components/MessageList";
import ChatHeader from "./components/ChatHeader";
import AnimatedBackground from "./components/AnimatedBackround";
import ChatInput1 from "./components/ChatInput1"; // Corrected import name

const BACKEND_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL || "http://127.0.0.1:8000";

export default function ChatbotPage() {
  const { user, isLoaded } = useUser();

  const [messages, setMessages] = useState([
    {
      sender: "assistant",
      text: "Hello! I'm your AI expense advisor. Select a model from the header and ask me anything about your finances or upload a receipt! 💰",
      isComplete: true,
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const [mounted, setMounted] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const fileInputRef = useRef(null);
  const [error, setError] = useState(null);
  const [salary, setSalary] = useState(null);


  // --- Voice Recognition State and Ref ---
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef(null);
  // --- MODIFICATION START ---
  // Add state to track the currently selected model ID. Default to 1 (Gemini Flash).
  const [selectedModelId, setSelectedModelId] = useState(1);
  // --- MODIFICATION END ---


  useEffect(() => {
    setMounted(true);

    // Setup Speech Recognition API
    if (typeof window !== 'undefined') {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        recognitionRef.current = new SpeechRecognition();
        const recognition = recognitionRef.current;
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          let interimTranscript = '';
          let finalTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            } else {
              interimTranscript += event.results[i][0].transcript;
            }
          }
          setInput(input + finalTranscript + interimTranscript);
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setError(`Voice recognition error: ${event.error}`);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };
      } else {
        console.warn('Speech Recognition API not supported in this browser.');
      }
    }
  }, []); // Dependency on 'input' allows appending transcripts correctly

  useEffect(() => {
    const fetchSalary = async () => {
      // We only run this fetch if the user is loaded and exists
      if (isLoaded && user) {
        try {
          const res = await fetch(`/api/profile?clerkId=${user.id}`);
          if (!res.ok) {
            console.error("Failed to fetch salary, proceeding without it.");
            return; // Exit gracefully if the request fails
          }
          const data = await res.json();
          // Your API correctly returns {} if no profile, so this check is safe
          if (data && data.monthly_salary) {
            setSalary(data.monthly_salary);
          }
        } catch (err) {
          console.error("Could not fetch user salary:", err);
        }
      }
    };

    fetchSalary(); // This is the function call
  }, [isLoaded, user]);

  const handleVoiceListening = () => {
    const recognition = recognitionRef.current;
    if (!recognition) return;

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const getUserId = () => {
    if (!isLoaded || !user) return "guest";
    return user.id;
  };

  useEffect(() => {
    const fetchHistory = async () => {
      if (!isLoaded || !user) return;
      try {
        const res = await fetch(`/api/chat-stream?clerkId=${user.id}`);
        if (!res.ok) throw new Error("Failed to fetch chat history");
        const history = await res.json();
        if (history && history.length > 0) {
          const initialMessages = history.map((m) => ({
            sender: m.role,
            text: m.content,
            imageUrl: m.imageUrl,
            isComplete: true,
          }));
          setMessages((prev) => [prev[0], ...initialMessages]);
        }
      } catch (err) {
        console.error("Failed to fetch chat history:", err);
        setError("Failed to load chat history");
      }
    };
    fetchHistory();
  }, [isLoaded, user]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Please select a valid image file");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB");
      return;
    }
    setImageFile(file);
    setError(null);
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const saveMessageToHistory = async (role, content, imageUrl = null) => {
    try {
      await fetch("/api/chat-stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerkId: getUserId(),
          role,
          content,
          imageUrl,
        }),
      });
    } catch (err) {
      console.error("Failed to save message:", err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !imageFile) || isLoading) return;

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    }

    setIsLoading(true);
    setError(null);
    const currentInput = input.trim();
    let cloudinaryImageUrl = null;
    const originalImageFile = imageFile;

    const userMessage = {
      sender: "user",
      text: currentInput,
      imageUrl: imagePreview,
      isComplete: true,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    clearImage();

    try {
      if (originalImageFile) {
        const formData = new FormData();
        formData.append("file", originalImageFile);
        const uploadRes = await fetch("/api/cloudinary/upload", {
          method: "POST",
          body: formData,
        });
        if (!uploadRes.ok) {
          const errorData = await uploadRes.json().catch(() => ({
            error: `Image upload failed with status: ${uploadRes.status}`,
          }));
          throw new Error(errorData.error || "Image upload failed");
        }
        const { url } = await uploadRes.json();
        cloudinaryImageUrl = url;
        setMessages((prev) =>
          prev.map((msg) =>
            msg === userMessage ? { ...msg, imageUrl: url } : msg
          )
        );
      }

      await saveMessageToHistory("user", currentInput, cloudinaryImageUrl);

      let backendEndpoint;
      let fetchOptions;

      if (originalImageFile) {
        // --- MODIFICATION: Add model_id to image upload form data ---
        backendEndpoint = `${BACKEND_URL}/upload-receipt`; // Assuming this endpoint handles images
        const backendFormData = new FormData();
        backendFormData.append("user_id", getUserId());
        backendFormData.append("file", originalImageFile);

        backendFormData.append("model_id", selectedModelId); // Send model ID with image
        if (salary) {
          backendFormData.append("salary", salary);
        }

        fetchOptions = {
          method: "POST",
          body: backendFormData,
        };
      } else {
        // --- MODIFICATION: Add model_id to standard chat payload ---
        // Align endpoint name with backend example provided previously (/invoke)
        backendEndpoint = `${BACKEND_URL}/chat-stream`;
        const backendPayload = {
          message: currentInput,
          user_id: getUserId(),
          model_id: selectedModelId, // Send selected model ID
          conversation_history: messages
            .slice(-4)
            .map((msg) => msg.text || "")
            .filter(Boolean),

          // Add all other state fields with default values to prevent KeyErrors
          last_intent: "",
          current_entities: {},
          response: {},
          user_question: "",
          query_plan: {},
          query_results: [],
          feedback_message: "",
          iteration_count: 0,
          critique_feedback: "",
          advice_iteration_count: 0,
        };
        if (salary) {
          backendPayload.salary = salary;
        }
        fetchOptions = {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(backendPayload),
        };
      }

      const res = await fetch(backendEndpoint, fetchOptions);
      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Backend request failed: ${res.status} - ${errorText}`);
      }

      // Check for streaming response (text/event-stream) first
      if (res.headers.get("content-type")?.includes("text/event-stream")) {
        if (!res.body) throw new Error("No response body from server");
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let assistantText = "";
        const streamMessage = {
          sender: "assistant",
          text: "",
          isComplete: false,
        };
        setMessages((prev) => [...prev, streamMessage]);
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });

          // Process Server-Sent Events (SSE) data format
          chunk.split("\n\n").forEach((line) => {
            if (line.startsWith("data: ")) {
              const jsonStr = line.replace("data: ", "").trim();
              if (jsonStr && jsonStr !== "[DONE]") {
                try {
                  const data = JSON.parse(jsonStr);
                  // Assuming backend streams: {"token": "hello"} or {"response": "full text"}
                  let contentChunk = "";
                  if (data.token) {
                    contentChunk = data.token;
                  } else if (data.response) {
                    // Handle non-streaming JSON inside a potential stream structure
                    contentChunk = data.response;
                  }

                  if (contentChunk) {
                    assistantText += contentChunk;
                    setMessages((prev) => {
                      const updated = [...prev];
                      const lastMessage = updated[updated.length - 1];
                      if (lastMessage?.sender === "assistant") {
                        lastMessage.text = assistantText;
                      }
                      return updated;
                    });
                  }
                } catch (e) {
                  console.error(
                    "Failed to parse JSON chunk:",
                    e,
                    "Chunk:",
                    jsonStr
                  );
                }
              }
            }
          });
        }
        setMessages((prev) => {
          const updated = [...prev];
          const lastMessage = updated[updated.length - 1];
          if (lastMessage?.sender === "assistant") {
            lastMessage.isComplete = true;
          }
          return updated;
        });
        await saveMessageToHistory("assistant", assistantText);
      } else {
        // Handle standard JSON response (for non-streaming or image uploads)
        const data = await res.json();
        const responseKey = data.reply || data.response; // Check for different possible response keys
        const assistantMessage = {
          sender: "assistant",
          text: responseKey || "Sorry, I couldn't process that.",
          isComplete: true,
        };
        setMessages((prev) => [...prev, assistantMessage]);
        await saveMessageToHistory("assistant", assistantMessage.text);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      setError(err.message || "Something went wrong. Please try again.");
      const errorMessage = {
        sender: "assistant",
        text: "⚠️ I'm having trouble processing your request. Please try again.",
        isComplete: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isLoaded || !mounted) {
    return (

      <div className="h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-orange-400/30 rounded-full blur-xl animate-pulse"></div>
          <div className="relative w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-black via-gray-950 to-black relative overflow-hidden">
      <AnimatedBackground />


      {/* --- MODIFICATION START --- */}
      {/* Pass state and setter function to ChatHeader */}
      <ChatHeader
        selectedModelId={selectedModelId}
        onModelChange={setSelectedModelId}
      />
      {/* --- MODIFICATION END --- */}

      {/* Error Banner */}

      {error && (
        <div className="relative z-10 mx-4 md:mx-8 mt-4 p-4 bg-red-500/20 border border-red-500/30 rounded-lg backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-red-400">⚠️</span>
              <span className="text-red-200 text-sm">{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Messages */}

      <MessageList messages={messages} messagesEndRef={messagesEndRef} />
      <ChatInput1
        input={input}
        setInput={setInput}
        handleSendMessage={handleSendMessage}
        isLoading={isLoading}
        imageFile={imageFile}
        imagePreview={imagePreview}
        clearImage={clearImage}
        handleImageChange={handleImageChange}
        fileInputRef={fileInputRef}
        isListening={isListening}
        handleVoiceListening={handleVoiceListening}
      />

      {/* Custom Styles... */}

      <style jsx>{`
        /* Keep existing styles */
        @keyframes float-particle {
          0%, 100% {
            transform: translateY(0px) translateX(0px) scale(1) rotate(0deg);
            opacity: 0.4;
          }
          25% {
            transform: translateY(-25px) translateX(15px) scale(1.4) rotate(90deg);
            opacity: 0.8;
          }
          50% {
            transform: translateY(-15px) translateX(-10px) scale(0.6) rotate(180deg);
            opacity: 0.5;
          }
          75% {
            transform: translateY(-30px) translateX(8px) scale(1.2) rotate(270deg);
            opacity: 0.9;
          }
        }
        @keyframes message-in {
          from {
            opacity: 0;
            transform: translateY(30px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes grid-drift {
          0% {
            transform: translate(0, 0);
          }
          100% {
            transform: translate(60px, 60px);
          }
        }
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-float-particle {
          animation: float-particle 10s ease-in-out infinite;
        }
        .animate-message-in {
          animation: message-in 0.6s ease-out forwards;
        }
        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
        .grid-pattern {
          background-image: linear-gradient(
              rgba(249, 115, 22, 0.2) 1px,
              transparent 1px
            ),
            linear-gradient(90deg, rgba(249, 115, 22, 0.2) 1px, transparent 1px);
          background-size: 60px 60px;
          animation: grid-drift 30s linear infinite;
        }
        .scrollbar-custom {
          scrollbar-width: thin;
          scrollbar-color: rgba(249, 115, 22, 0.6) rgba(17, 24, 39, 0.8);
        }
        .scrollbar-custom::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: rgba(17, 24, 39, 0.8);
          border-radius: 3px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: linear-gradient(to bottom, #f97316, #ea580c);
          border-radius: 3px;
          box-shadow: 0 0 10px rgba(249, 115, 22, 0.4);
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(to bottom, #ea580c, #dc2626);
          box-shadow: 0 0 15px rgba(249, 115, 22, 0.6);
        }

        @media (prefers-reduced-motion: reduce) {
          .animate-float-particle,
          .animate-pulse,
          .animate-bounce,
          .animate-spin {
            animation: none;
          }
          * {
            transition-duration: 0.01ms !important;
            animation-duration: 0.01ms !important;
          }
        }

        @media (prefers-contrast: high) {
          .bg-gradient-to-r,
          .bg-gradient-to-br,
          .bg-gradient-to-tr {
            background: #f97316;
          }
        }
      `}</style>
    </div>
  );
}