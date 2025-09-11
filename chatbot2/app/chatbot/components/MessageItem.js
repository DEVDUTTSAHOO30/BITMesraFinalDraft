export default function MessageItem({ msg, animationDelay }) {
    return (
        <div
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"
                } animate-message-in`}
            style={{ animationDelay }}
        >
            <div
                className={`max-w-[85%] md:max-w-4xl group ${msg.sender === "user" ? "ml-4 md:ml-16" : "mr-4 md:mr-16"
                    }`}
            >
                <div
                    className={`flex items-start space-x-3 md:space-x-4 ${msg.sender === "user" ? "flex-row-reverse space-x-reverse" : ""
                        }`}
                >
                    {/* Avatar */}
                    <div
                        className={`w-10 h-10 md:w-12 md:h-12 rounded-2xl flex items-center justify-center flex-shrink-0 relative ${msg.sender === "user"
                                ? "bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 shadow-xl shadow-orange-500/30"
                                : "bg-gradient-to-br from-gray-700 to-gray-800 border-2 border-gray-600 shadow-xl"
                            }`}
                    >
                        {msg.sender === "user" && (
                            <div className="absolute -inset-1 bg-gradient-to-r from-orange-500/50 to-orange-400/50 rounded-2xl blur-sm"></div>
                        )}
                        <span className="text-base md:text-lg relative z-10">
                            {msg.sender === "user" ? "👤" : "🤖"}
                        </span>
                    </div>

                    {/* Message Content */}
                    <div className="relative group-hover:scale-[1.02] transition-all duration-300">
                        <div
                            className={`relative px-4 md:px-8 py-4 md:py-6 rounded-3xl shadow-2xl backdrop-blur-sm border transition-all duration-300 ${msg.sender === "user"
                                    ? "bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 text-white shadow-orange-500/25 border-orange-400/20 group-hover:shadow-orange-500/40"
                                    : "bg-gradient-to-br from-gray-800/80 via-gray-800/60 to-gray-900/80 border-gray-600/40 text-gray-100 group-hover:border-orange-500/30 group-hover:bg-gray-800/90"
                                }`}
                        >
                            {/* Image */}
                            {msg.imageUrl && (
                                <div className="mb-3">
                                    <img
                                        src={msg.imageUrl}
                                        alt="Uploaded content"
                                        className="rounded-lg max-w-full h-auto max-h-64 object-contain"
                                        loading="lazy"
                                    />
                                </div>
                            )}

                            {/* Text */}
                            {msg.text && (
                                <p className="text-sm md:text-base leading-relaxed font-medium whitespace-pre-wrap">
                                    {msg.text}
                                </p>
                            )}

                            {/* Typing Indicator */}
                            {!msg.isComplete && (
                                <div className="flex items-center space-x-2 mt-3">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce delay-100"></div>
                                        <div className="w-2 h-2 bg-orange-400/60 rounded-full animate-bounce delay-200"></div>
                                    </div>
                                    <span className="text-xs text-gray-300">
                                        AI is thinking...
                                    </span>
                                </div>
                            )}

                            {/* Message Tail */}
                            <div
                                className={`absolute top-6 w-4 h-4 transform rotate-45 ${msg.sender === "user"
                                        ? "-right-2 bg-gradient-to-br from-orange-500 to-orange-600"
                                        : "-left-2 bg-gradient-to-br from-gray-800 to-gray-900 border-l-2 border-b-2 border-gray-600/40"
                                    }`}
                            ></div>
                        </div>

                        {/* Timestamp */}
                        <div
                            className={`mt-2 text-xs text-gray-400 font-medium ${msg.sender === "user" ? "text-right mr-4" : "ml-4"
                                }`}
                        >
                            <div className="flex items-center space-x-2">
                                {msg.sender === "user" ? (
                                    <>
                                        <span>
                                            {new Date().toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                        <div className="w-1.5 h-1.5 bg-green-400 rounded-full"></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1.5 h-1.5 bg-orange-400 rounded-full"></div>
                                        <span>
                                            {new Date().toLocaleTimeString([], {
                                                hour: "2-digit",
                                                minute: "2-digit",
                                            })}
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}