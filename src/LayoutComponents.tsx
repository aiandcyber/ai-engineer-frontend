export function LeftSidebar() {
    return (
      <div style={{ width: "260px", backgroundColor: "#0f172a", color: "#94a3b8", display: "flex", flexDirection: "column", borderRight: "1px solid #1e293b", flexShrink: 0 }}>
        <div style={{ padding: "24px 20px", borderBottom: "1px solid #1e293b", display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "#6366f1" }} />
          <span style={{ color: "#ffffff", fontWeight: 700, fontSize: "16px", letterSpacing: "0.5px" }}>AI FOR ALL</span>
        </div>
        <div style={{ flex: 1, padding: "20px 10px", display: "flex", flexDirection: "column", gap: "8px" }}>
          <div style={{ padding: "10px 14px", backgroundColor: "#1e293b", color: "#ffffff", borderRadius: "8px", fontSize: "14px", fontWeight: 500 }}>
            💬 Building Plan Analysis
          </div>
          
          <div style={{ padding: "10px 14px", borderRadius: "8px", fontSize: "14px", color: "#475569" }}>
            📊 Personal Assitant
          </div>
          <div style={{ padding: "10px 14px", borderRadius: "8px", fontSize: "14px", color: "#475569" }}>
            ⚙️ Batch Processing
          </div>
          
        </div>
        <div style={{ padding: "20px", borderTop: "1px solid #1e293b", fontSize: "12px", color: "#64748b" }}>
          Version: Beta v0.1
        </div>
      </div>
    );
  }
  
  export function RightSidebar() {
    return (
      <div style={{ width: "280px", backgroundColor: "#ffffff", borderLeft: "1px solid #e2e8f0", padding: "24px", display: "flex", flexDirection: "column", gap: "24px", flexShrink: 0 }}>
        <div>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#0f172a", letterSpacing: "0.3px" }}>AI ENGINE DATA</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <div style={{ padding: "10px", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "12px" }}>
              <strong style={{ color: "#475569" }}>Execution Engine:</strong> <code style={{ color: "#6366f1" }}>gpt-4o</code>
            </div>
            <div style={{ padding: "10px", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "12px" }}>
              <strong style={{ color: "#475569" }}>System Latency:</strong> <code style={{ color: "#16a34a" }}>42ms</code>
            </div>
          </div>
        </div>
        <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "20px" }}>
          <h3 style={{ margin: "0 0 12px 0", fontSize: "14px", fontWeight: 600, color: "#0f172a" }}>SYSTEM INSIGHTS</h3>
          <p style={{ margin: 0, fontSize: "13px", color: "#64748b", lineHeight: "1.5" }}>
            The Strands Agent loop checks your base64 image strings natively via an async thread stream layout, ensuring zero browser frame locks.
          </p>
        </div>
      </div>
    );
  }
  