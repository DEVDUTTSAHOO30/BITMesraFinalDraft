import { Mic, MicOff } from 'lucide-react';

export default function ChatInput({
  input,
  setInput,
  handleSendMessage,
  isLoading,
  imageFile,
  imagePreview,
  clearImage,
  handleImageChange,
  fileInputRef,
  isListening,
  handleVoiceListening,
}) {
  return (
    <div className="relative z-10 p-4 md:p-8 border-t border-gray-700/30 backdrop-blur-xl bg-gray-900/20">
      {imagePreview && (
        <div className="mb-4 relative inline-block">
          <img
            src={imagePreview}
            alt="Preview"
            className="rounded-lg max-h-24 object-cover border-2 border-orange-500/30"
          />
          <button
            onClick={clearImage}
            className="absolute -top-2 -right-2 bg-red-600 hover:bg-red-700 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold transition-colors"
          >
            ✕
          </button>
        </div>
      )}

      <form
        onSubmit={handleSendMessage}
        className="flex gap-2 md:gap-4 items-center"
      >
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          ref={fileInputRef}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isLoading}
          className="flex-shrink-0 w-12 h-12 md:w-14 md:h-14 bg-gray-700 hover:bg-orange-500 disabled:bg-gray-800 disabled:opacity-50 rounded-2xl transition-colors flex items-center justify-center"
          title="Upload image"
        >
          <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </button>

        <button
          type="button"
          onClick={handleVoiceListening}
          disabled={isLoading}
          className={`flex-shrink-0 w-12 h-12 md:w-14 md:h-14 rounded-2xl transition-colors flex items-center justify-center ${
            isListening 
              ? 'bg-red-600 hover:bg-red-700 animate-pulse' 
              : 'bg-gray-700 hover:bg-orange-500'
          } disabled:bg-gray-800 disabled:opacity-50`}
          title={isListening ? "Stop listening" : "Start listening"}
        >
          {isListening ? (
            <MicOff className="w-5 h-5 md:w-6 md:h-6 text-white" />
          ) : (
            <Mic className="w-5 h-5 md:w-6 md:h-6 text-white" />
          )}
        </button>

        <div className="flex-1 relative group min-w-0">
          <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/20 to-orange-400/20 rounded-2xl blur-md opacity-0 group-focus-within:opacity-100 transition-all duration-500"></div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question or describe the receipt..."
            className="relative w-full h-12 md:h-14 px-4 md:px-6 py-3 md:py-4 bg-gradient-to-r from-gray-800/60 to-gray-900/60 border-2 border-gray-600/40 rounded-2xl focus:outline-none focus:ring-4 focus:ring-orange-500/20 focus:border-orange-500/60 transition-all duration-300 text-white placeholder-gray-400 backdrop-blur-sm group-hover:border-gray-500/60 text-sm md:text-base font-medium resize-none overflow-hidden"
            disabled={isLoading}
            rows="1"
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
          />
        </div>

        <button
          type="submit"
          disabled={(!input.trim() && !imageFile) || isLoading}
          className="flex-shrink-0 group h-12 md:h-14 px-4 md:px-6 bg-gradient-to-r from-orange-500 via-orange-400 to-orange-600 text-white rounded-2xl font-bold hover:from-orange-600 hover:via-orange-500 hover:to-orange-700 disabled:from-gray-600 disabled:via-gray-700 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 shadow-2xl hover:shadow-orange-500/30 disabled:transform-none disabled:shadow-none flex items-center justify-center space-x-1 md:space-x-2 text-sm md:text-base relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            {isLoading ? (
              <>
                <div className="w-4 h-4 md:w-5 md:h-5 border-2 border-white/40 border-t-white rounded-full animate-spin"></div>
                <span className="relative z-10 hidden md:inline ml-2">Thinking</span>
              </>
            ) : (
              <>
                <span className="relative z-10">Send</span>
                <svg className="w-4 h-4 md:w-5 md:h-5 relative z-10 group-hover:translate-x-1 transition-transform duration-200" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </>
            )}
        </button>
      </form>

      {isLoading && (
        <div className="flex items-center justify-center mt-4 space-x-3 animate-fade-in">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-orange-400 rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse delay-200"></div>
            <div className="w-2 h-2 bg-orange-600 rounded-full animate-pulse delay-400"></div>
          </div>
          <span className="text-gray-300 text-sm font-medium">
            AI is analyzing your request...
          </span>
        </div>
      )}
    </div>
  );
}