import { useEffect, useRef } from "react";
import Message from "./Message";
import "./ChatArea.css";

function ChatArea({ messages }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <main className="ChatAreaContainer">
      {messages.length === 0 ? (
        <div className="ChatAreaEmpty">
          <h1>How can I help you?</h1>
        </div>
      ) : (
        <div className="ChatMessages">
          {messages.map((message, index) => (
            <Message key={index} role={message.role} content={message.content} />
          ))}
          <div ref={bottomRef}></div>
        </div>
      )}
    </main>
  );
}

export default ChatArea;