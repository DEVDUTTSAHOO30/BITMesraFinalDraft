// app/chatbot/components/ChatHeader.js

// --- MODIFICATION START ---
// Accept props for model selection state management
export default function ChatHeader({ selectedModelId, onModelChange }) {
  // --- MODIFICATION END ---

  return (
    <div className="relative z-10 p-6 md:p-8 border-b border-gray-700/30 backdrop-blur-xl bg-gray-900/20">
      <div className="flex items-center justify-between space-x-4 max-w-screen-xl mx-auto">
        {/* Left Side: Title and Status */}
        <div className="flex items-center space-x-4">
          <div className="relative">
            <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/40 to-orange-400/40 rounded-2xl blur-md"></div>
            <div className="relative w-12 h-12 md:w-14 md:h-14 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 rounded-2xl flex items-center justify-center shadow-2xl shadow-orange-500/25">
              <span className="text-xl md:text-2xl">🤖</span>
            </div>
          </div>
          <div>
            <h1 className="text-lg md:text-2xl font-black bg-gradient-to-r from-white via-orange-200 to-orange-400 bg-clip-text text-transparent tracking-tight">
              AI Expense Advisor
            </h1>
            <div className="flex items-center space-x-2 mt-1">
              <div className="w-2.5 h-2.5 bg-green-400 rounded-full animate-pulse shadow-lg shadow-green-400/50"></div>
              <span className="text-gray-300 text-xs md:text-sm font-medium">
                Intelligence Active
              </span>
            </div>
          </div>
        </div>

        {/* --- MODIFICATION START --- */}
        {/* Right Side: Model Selection Dropdown */}
        <div>
          <select
            value={selectedModelId}
            onChange={(e) => onModelChange(Number(e.target.value))}
            className="text-sm md:text-base bg-gray-800 border border-gray-600 text-white rounded-lg focus:ring-orange-500 focus:border-orange-500 py-2 px-3 transition-colors duration-200 hover:bg-gray-700 appearance-none"
            aria-label="Select AI Model"
          >
            <option value={1}>Gemini 1.5 Flash (Fast)</option>
            {/* <option value={2}>Gemini 1.5 Pro (Smart)</option> */}
            <option value={3}>Qwen 7B (Alternate)</option>
            <option value={4}>Mistral 7B (Creative)</option>
          </select>
        </div>
        {/* --- MODIFICATION END --- */}
      </div>
    </div>
  );
}
