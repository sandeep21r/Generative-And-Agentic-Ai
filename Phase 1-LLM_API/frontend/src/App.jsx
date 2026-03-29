import Header from "./components/Header";
import ChatArea from "./components/ChatArea";
import ChatInput from "./components/ChatInput";
import { useState, useEffect } from "react";
import "./App.css";

const API_URL = "http://localhost:3001";

function App() {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [messages, setMessages] = useState([]);
  const [models, setModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchModels = async () => {
      try {
        const response = await fetch(`${API_URL}/api/models`);
        const data = await response.json();
        setModels(data.models || []);
        setSelectedModel(data.models?.[0] || "");
      } catch (error) {
        console.error("Failed to fetch models:", error);
      }
    };

    fetchModels();
  }, []);

  const handleClearChat = async () => {
    setMessages([]);
    try {
      await fetch(`${API_URL}/api/chat/clear`, {
        method: "POST",
      });
    } catch (error) {
      console.error("Failed to clear backend chat:", error);
    }
  };

  const handleToggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const handleModelChange = (model) => {
    setSelectedModel(model);
  };

  const handleSendMessage = async (inputText) => {
    if (!inputText.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputText,
    };

    const assistantPlaceholder = {
      role: "assistant",
      content: "",
    };

    const updatedMessages = [...messages, userMessage, assistantPlaceholder];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const response = await fetch(`${API_URL}/api/chat/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: inputText,
          model: selectedModel,
          history: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start stream");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder("utf-8");

      let done = false;
      let accumulatedText = "";

      while (!done) {
        const result = await reader.read();
        done = result.done;
        console.log(result)
        const chunk = decoder.decode(result.value || new Uint8Array(), {
          stream: !done,
        });
        console.log(chunk);
        
        
        const lines = chunk.split("\n\n");
        console.log(lines);
        
        for (const line of lines) {
          if (!line.startsWith("data:")) continue;

          const data = line.replace("data:", "").trim();

          if (data === "[DONE]") {
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.content) {
              accumulatedText += parsed.content;

              setMessages((prev) => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1] = {
                  role: "assistant",
                  content: accumulatedText,
                };
                return newMessages;
              });
            }

            if (parsed.error) {
              throw new Error(parsed.error);
            }
          } catch (err) {
            console.error("Error parsing stream chunk:", err);
          }
        }
      }
    } catch (error) {
      console.error("Streaming error:", error);

      setMessages((prev) => {
        const newMessages = [...prev];
        newMessages[newMessages.length - 1] = {
          role: "assistant",
          content: "Something went wrong while generating the response.",
        };
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className={isDarkMode ? "app dark" : "app light"}>
      <Header
        onClearChat={handleClearChat}
        isDarkMode={isDarkMode}
        onToggleTheme={handleToggleTheme}
        models={models}
        selectedModel={selectedModel}
        onModelChange={handleModelChange}
      />

      <ChatArea messages={messages} />

      <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
    </div>
  );
}

export default App;