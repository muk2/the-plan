import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme";
import * as api from "../api";

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [aiProvider, setAiProvider] = useState(user?.ai_provider || "openrouter");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState(user?.ai_model || "anthropic/claude-sonnet-4");
  const [aiBaseUrl, setAiBaseUrl] = useState(user?.ai_base_url || "https://openrouter.ai/api/v1");
  const [saved, setSaved] = useState("");

  const inputStyle = {
    width: "100%",
    padding: "10px 14px",
    background: COLORS.surface2,
    border: `1px solid ${COLORS.border}`,
    borderRadius: 6,
    color: COLORS.text,
    fontSize: 13,
    fontFamily: "inherit",
    outline: "none",
    boxSizing: "border-box",
  };

  const saveProfile = async () => {
    try {
      await api.auth.updateProfile({ display_name: displayName, bio });
      await refreshUser();
      setSaved("Profile saved!");
      setTimeout(() => setSaved(""), 2000);
    } catch (e) { alert(e.message); }
  };

  const saveAi = async () => {
    try {
      await api.auth.updateAiSettings({
        ai_provider: aiProvider,
        ai_api_key: aiApiKey || null,
        ai_model: aiModel,
        ai_base_url: aiBaseUrl,
      });
      await refreshUser();
      setSaved("AI settings saved!");
      setAiApiKey("");
      setTimeout(() => setSaved(""), 2000);
    } catch (e) { alert(e.message); }
  };

  const btnStyle = {
    padding: "10px 20px",
    background: COLORS.accent,
    color: COLORS.bg,
    border: "none",
    borderRadius: 6,
    fontSize: 13,
    fontWeight: 700,
    cursor: "pointer",
    fontFamily: "inherit",
  };

  return (
    <div style={{
      background: COLORS.bg,
      minHeight: "100vh",
      fontFamily: "'IBM Plex Sans', sans-serif",
      color: COLORS.text,
      padding: "24px 28px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16, marginBottom: 32 }}>
        <button onClick={() => navigate("/")} style={{ background: "none", border: "none", color: COLORS.accent, cursor: "pointer", fontSize: 14, fontFamily: "inherit" }}>
          &larr; Back
        </button>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>Profile Settings</h1>
        {saved && <span style={{ color: COLORS.golf, fontSize: 13 }}>{saved}</span>}
      </div>

      {/* Profile Section */}
      <div style={{ maxWidth: 500, marginBottom: 40 }}>
        <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Profile</div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Display Name</label>
          <input style={inputStyle} value={displayName} onChange={e => setDisplayName(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Bio</label>
          <textarea style={{ ...inputStyle, minHeight: 60, resize: "vertical" }} value={bio} onChange={e => setBio(e.target.value)} placeholder="Tell people about yourself..." />
        </div>
        <button onClick={saveProfile} style={btnStyle}>Save Profile</button>
      </div>

      {/* AI Settings Section */}
      <div style={{ maxWidth: 500 }}>
        <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>AI Settings</div>
        <div style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Configure your AI provider for schedule analysis. <strong style={{ color: COLORS.text }}>OpenRouter</strong> is recommended — it gives you access to Claude, GPT-4, Gemini, and many more models with a single API key.
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Provider</label>
          <select style={inputStyle} value={aiProvider} onChange={e => {
            setAiProvider(e.target.value);
            if (e.target.value === "openrouter") {
              setAiBaseUrl("https://openrouter.ai/api/v1");
              setAiModel("anthropic/claude-sonnet-4");
            } else if (e.target.value === "openai") {
              setAiBaseUrl("https://api.openai.com/v1");
              setAiModel("gpt-4o");
            } else if (e.target.value === "ollama") {
              setAiBaseUrl("http://localhost:11434/v1");
              setAiModel("llama3");
            }
          }}>
            <option value="openrouter">OpenRouter (Recommended)</option>
            <option value="openai">OpenAI Direct</option>
            <option value="ollama">Ollama (Local)</option>
            <option value="custom">Custom OpenAI-compatible</option>
          </select>
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>API Key {aiProvider === "ollama" && "(not needed for Ollama)"}</label>
          <input style={inputStyle} type="password" value={aiApiKey} onChange={e => setAiApiKey(e.target.value)} placeholder={user?.ai_provider ? "Key saved \u2022 enter new to replace" : "sk-or-..."} />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Model</label>
          <input style={inputStyle} value={aiModel} onChange={e => setAiModel(e.target.value)} placeholder="anthropic/claude-sonnet-4" />
          {aiProvider === "openrouter" && (
            <div style={{ color: COLORS.textFaint, fontSize: 11, marginTop: 4 }}>
              Popular: anthropic/claude-sonnet-4, openai/gpt-4o, google/gemini-2.5-flash
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Base URL</label>
          <input style={inputStyle} value={aiBaseUrl} onChange={e => setAiBaseUrl(e.target.value)} />
        </div>

        <button onClick={saveAi} style={btnStyle}>Save AI Settings</button>
      </div>
    </div>
  );
}
