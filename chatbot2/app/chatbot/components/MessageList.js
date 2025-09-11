

import MessageItem from "./MessageItem";

export default function MessageList({ messages, messagesEndRef }) {
    return (
        <div className="relative z-10 flex-1 overflow-y-auto p-4 md:p-8 space-y-6 md:space-y-8 scrollbar-custom">
            {messages.map((msg, index) => (
                <MessageItem
                    key={index}
                    msg={msg}
                    animationDelay={`${index * 0.1}s`}
                />
            ))}
            <div ref={messagesEndRef} />
        </div>
    );
}