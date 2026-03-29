import { useState, useRef } from "react";
import "./ChatInput.css";

function ChatInput({ onSendMessage, isLoading }) {
  const [input, setInput] = useState("");
  const textareaRef = useRef(null);

  const adjustHeight = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";
    textarea.style.height = `${textarea.scrollHeight}px`;
  };

  const handleChange = (e) => {
    setInput(e.target.value);
    adjustHeight();
  };

  const handleSend = () => {
    if (!input.trim()) return;
    onSendMessage(input);
    setInput("");

    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = "auto";
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="ChatInputContainer">
      <textarea
        ref={textareaRef}
        className="ChatInputBox"
        placeholder="Type your message..."
        value={input}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        disabled={isLoading}
        rows={1}
      />
      <button className="ChatSendButton" onClick={handleSend} disabled={isLoading}>
        {isLoading ? "..." : ">"}
      </button>
    </div>
  );
}

export default ChatInput;