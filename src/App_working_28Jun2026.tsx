import { useState, useRef, useEffect } from "react";

interface Message {
  role: "user" | "assistant";
  content: string;
  imagePreview?: string;
}

export default function App() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Hello! Upload an image or file, and let's analyze it together." }
  ]);
  const [input, setInput] = useState("");
  const [base64Image, setBase64Image] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setBase64Image(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const clearAttachment = () => setBase64Image(null);

  const handleSend = async () => {
    if (!input.trim() && !base64Image) return;

    const userMessage: Message = { role: "user", content: input };
    if (base64Image) userMessage.imagePreview = base64Image;

    setMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }]);
    setInput("");
    setBase64Image(null);
    setIsStreaming(true);

    try {
      const response = await fetch("http://localhost:8000/api/chat/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: input,
          image_data: userMessage.imagePreview || null,
        }),
      });

      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      try {
        while (true) {
          const { value, done } = await reader.read();
          
          if (value) {
            const tokenChunk = decoder.decode(value, { stream: true });
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (lastIdx >= 0) {
                updated[lastIdx].content += tokenChunk;
              }
              return updated;
            });
          }
          
          if (done) break;
        }
      } catch (streamError) {
        console.log("Stream parsing loop finished.");
      }
    } catch (error) {
      console.error("Connection failed:", error);
    } finally {
      setIsStreaming(false);
    }
  };

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", fontFamily: "sans-serif", display: "flex", flexDirection: "column", height: "80vh", border: "1px solid #e4e4e7", borderRadius: "12px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", overflow: "hidden" }}>
      <div style={{ padding: "16px", borderBottom: "1px solid #e4e4e7", backgroundColor: "#fafafa", fontWeight: "bold" }}>
        Strands Agentic Multi-Modal Assistant
      </div>

      <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", backgroundColor: "#ffffff" }}>
        {messages.map((msg, idx) => (
          <div key={idx} style={{ alignSelf: msg.role === "user" ? "flex-end" : "flex-start", maxWidth: "80%" }}>
            <div style={{ padding: "10px 14px", borderRadius: "12px", fontSize: "14px", lineHeight: "1.5", backgroundColor: msg.role === "user" ? "#0070f3" : "#f4f4f5", color: msg.role === "user" ? "#ffffff" : "#000000" }}>
              {msg.imagePreview && (
                <img src={msg.imagePreview} alt="Attached context" style={{ maxWidth: "100%", maxHeight: "200px", borderRadius: "6px", marginBottom: "8px", display: "block" }} />
              )}
              <div style={{ whiteSpace: "pre-wrap" }}>{msg.content}</div>
            </div>
          </div>
        ))}
        <div ref={chatBottomRef} />
      </div>

      {base64Image && (
        <div style={{ padding: "8px 16px", backgroundColor: "#f0fdf4", borderTop: "1px solid #bbf7d0", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", color: "#16a34a" }}>
          <span>📎 Media layout attached and ready for LLM analysis</span>
          <button onClick={clearAttachment} style={{ border: "none", background: "none", cursor: "pointer", color: "#dc2626", fontWeight: "bold" }}>✕ Remove</button>
        </div>
      )}

      <div style={{ padding: "16px", borderTop: "1px solid #e4e4e7", display: "flex", alignItems: "center", gap: "10px", backgroundColor: "#fafafa" }}>
        <input type="file" id="file-upload" accept="image/*" onChange={handleFileChange} style={{ display: "none" }} />
        <label htmlFor="file-upload" style={{ width: "40px", height: "40px", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#e4e4e7", borderRadius: "50%", cursor: "pointer", fontSize: "20px", userSelect: "none" }}>
          +
        </label>

        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSend()} disabled={isStreaming} placeholder="Type a message or drop an image file..." style={{ flex: 1, height: "40px", padding: "0 14px", border: "1px solid #e4e4e7", borderRadius: "20px", outline: "none", fontSize: "14px" }} />
        <button onClick={handleSend} disabled={isStreaming} style={{ height: "40px", padding: "0 20px", border: "none", backgroundColor: "#0070f3", color: "#ffffff", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", fontSize: "14px" }}>
          {isStreaming ? "Thinking..." : "Send"}
        </button>
      </div>
    </div>
  );
}
