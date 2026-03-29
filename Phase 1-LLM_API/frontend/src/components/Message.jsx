import ReactMarkdown from "react-markdown";
import "./Message.css";

function Message({ role, content }) {
  return (
    <div className={`MessageRow ${role === "user" ? "user" : "assistant"}`}>
      <div className={`MessageBubble ${role === "user" ? "user" : "assistant"}`}>
        {role === "assistant" ? (
          <ReactMarkdown>{content}</ReactMarkdown>
        ) : (
          <p>{content}</p>
        )}
      </div>
    </div>
  );
}

export default Message;