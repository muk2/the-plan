import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { COLORS } from "../theme";
import * as api from "../api";

const PROVIDERS = {
  openrouter: {
    label: "OpenRouter",
    description: "Access Claude, GPT-4, Gemini, Llama, and 200+ models with one API key",
    baseUrl: "https://openrouter.ai/api/v1",
    defaultModel: "anthropic/claude-sonnet-4",
    keyPlaceholder: "sk-or-...",
    keyRequired: true,
    models: [
      { value: "anthropic/claude-sonnet-4", label: "Claude Sonnet 4" },
      { value: "openai/gpt-4o", label: "GPT-4o" },
      { value: "google/gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "meta-llama/llama-4-maverick", label: "Llama 4 Maverick" },
      { value: "deepseek/deepseek-r1", label: "DeepSeek R1" },
    ],
  },
  anthropic: {
    label: "Anthropic",
    description: "Direct access to Claude models",
    baseUrl: "https://api.anthropic.com/v1",
    defaultModel: "claude-sonnet-4-20250514",
    keyPlaceholder: "sk-ant-...",
    keyRequired: true,
    models: [
      { value: "claude-sonnet-4-20250514", label: "Claude Sonnet 4" },
      { value: "claude-haiku-4-20250414", label: "Claude Haiku 4" },
    ],
  },
  openai: {
    label: "OpenAI",
    description: "Direct access to GPT models",
    baseUrl: "https://api.openai.com/v1",
    defaultModel: "gpt-4o",
    keyPlaceholder: "sk-...",
    keyRequired: true,
    models: [
      { value: "gpt-4o", label: "GPT-4o" },
      { value: "gpt-4o-mini", label: "GPT-4o Mini" },
      { value: "o3-mini", label: "o3-mini" },
    ],
  },
  google: {
    label: "Google AI (Gemini)",
    description: "Direct access to Gemini models via Google AI Studio",
    baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai",
    defaultModel: "gemini-2.5-flash",
    keyPlaceholder: "AI...",
    keyRequired: true,
    models: [
      { value: "gemini-2.5-flash", label: "Gemini 2.5 Flash" },
      { value: "gemini-2.5-pro", label: "Gemini 2.5 Pro" },
    ],
  },
  groq: {
    label: "Groq",
    description: "Ultra-fast inference for open models",
    baseUrl: "https://api.groq.com/openai/v1",
    defaultModel: "llama-3.3-70b-versatile",
    keyPlaceholder: "gsk_...",
    keyRequired: true,
    models: [
      { value: "llama-3.3-70b-versatile", label: "Llama 3.3 70B" },
      { value: "mixtral-8x7b-32768", label: "Mixtral 8x7B" },
    ],
  },
  together: {
    label: "Together AI",
    description: "Open-source models with fast inference",
    baseUrl: "https://api.together.xyz/v1",
    defaultModel: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo",
    keyPlaceholder: "...",
    keyRequired: true,
    models: [
      { value: "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo", label: "Llama 3.1 70B" },
      { value: "mistralai/Mixtral-8x7B-Instruct-v0.1", label: "Mixtral 8x7B" },
    ],
  },
  ollama: {
    label: "Ollama (Local)",
    description: "Run models locally on your machine — no API key needed",
    baseUrl: "http://localhost:11434/v1",
    defaultModel: "llama3",
    keyPlaceholder: "",
    keyRequired: false,
    models: [
      { value: "llama3", label: "Llama 3" },
      { value: "mistral", label: "Mistral" },
      { value: "codellama", label: "Code Llama" },
      { value: "phi3", label: "Phi-3" },
    ],
  },
  custom: {
    label: "Custom (OpenAI-compatible)",
    description: "Any service with an OpenAI-compatible /chat/completions endpoint",
    baseUrl: "",
    defaultModel: "",
    keyPlaceholder: "...",
    keyRequired: false,
    models: [],
  },
};

export default function Profile() {
  const { user, refreshUser } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState(user?.display_name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [aiProvider, setAiProvider] = useState(user?.ai_provider || "");
  const [aiApiKey, setAiApiKey] = useState("");
  const [aiModel, setAiModel] = useState(user?.ai_model || "");
  const [aiBaseUrl, setAiBaseUrl] = useState(user?.ai_base_url || "");
  const [saving, setSaving] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState("");

  const provider = PROVIDERS[aiProvider];

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
    setSaving(true); setError("");
    try {
      await api.auth.updateProfile({ display_name: displayName, bio });
      await refreshUser();
      setSaved("Profile saved!");
      setTimeout(() => setSaved(""), 2000);
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const saveAi = async () => {
    setSaving(true); setError("");
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
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  };

  const selectProvider = (key) => {
    const p = PROVIDERS[key];
    setAiProvider(key);
    setAiBaseUrl(p.baseUrl);
    setAiModel(p.defaultModel);
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

      {error && (
        <div style={{
          maxWidth: 500, marginBottom: 20, padding: "10px 16px",
          background: "#e5555522", borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <span style={{ color: "#e55", fontSize: 13 }}>{error}</span>
          <button onClick={() => setError("")} style={{ background: "none", border: "none", color: "#e55", cursor: "pointer", fontSize: 16, padding: "2px 6px" }}>{"\u2715"}</button>
        </div>
      )}

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
        <button onClick={saveProfile} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save Profile"}</button>
      </div>

      {/* AI Settings Section */}
      <div style={{ maxWidth: 500 }}>
        <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>AI Coach Settings</div>
        <div style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 20, lineHeight: 1.6 }}>
          Choose any LLM provider to power AI schedule analysis. All providers use the OpenAI-compatible API format.
        </div>

        {/* Provider grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 20 }}>
          {Object.entries(PROVIDERS).map(([key, p]) => (
            <button
              key={key}
              onClick={() => selectProvider(key)}
              style={{
                padding: "12px 14px",
                background: aiProvider === key ? `${COLORS.accent}15` : COLORS.surface,
                border: `1px solid ${aiProvider === key ? COLORS.accent + "66" : COLORS.border}`,
                borderRadius: 8,
                cursor: "pointer",
                textAlign: "left",
                fontFamily: "inherit",
                transition: "all 0.15s",
              }}
            >
              <div style={{
                color: aiProvider === key ? COLORS.accent : COLORS.text,
                fontSize: 13, fontWeight: 700, marginBottom: 2,
              }}>{p.label}</div>
              <div style={{ color: COLORS.textFaint, fontSize: 11, lineHeight: 1.4 }}>{p.description}</div>
            </button>
          ))}
        </div>

        {aiProvider && provider && (
          <>
            {provider.keyRequired && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>API Key</label>
                <input
                  style={inputStyle}
                  type="password"
                  value={aiApiKey}
                  onChange={e => setAiApiKey(e.target.value)}
                  placeholder={user?.ai_provider ? `Key saved \u2022 enter new to replace` : (provider.keyPlaceholder || "Enter API key...")}
                />
              </div>
            )}

            {!provider.keyRequired && aiProvider === "ollama" && (
              <div style={{ color: COLORS.textDim, fontSize: 12, marginBottom: 16, padding: "8px 12px", background: COLORS.surface2, borderRadius: 6 }}>
                No API key needed. Make sure Ollama is running at the URL below.
              </div>
            )}

            <div style={{ marginBottom: 16 }}>
              <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Model</label>
              {provider.models.length > 0 ? (
                <>
                  <select style={inputStyle} value={aiModel} onChange={e => setAiModel(e.target.value)}>
                    {provider.models.map(m => (
                      <option key={m.value} value={m.value}>{m.label}</option>
                    ))}
                    <option value="_custom">Custom model...</option>
                  </select>
                  {aiModel === "_custom" || !provider.models.find(m => m.value === aiModel) ? (
                    <input style={{ ...inputStyle, marginTop: 8 }} value={aiModel === "_custom" ? "" : aiModel} onChange={e => setAiModel(e.target.value)} placeholder="Enter model name..." />
                  ) : null}
                </>
              ) : (
                <input style={inputStyle} value={aiModel} onChange={e => setAiModel(e.target.value)} placeholder="Enter model name..." />
              )}
            </div>

            <div style={{ marginBottom: 20 }}>
              <label style={{ color: COLORS.textDim, fontSize: 12, display: "block", marginBottom: 6 }}>Base URL</label>
              <input style={inputStyle} value={aiBaseUrl} onChange={e => setAiBaseUrl(e.target.value)} />
            </div>

            <button onClick={saveAi} disabled={saving} style={{ ...btnStyle, opacity: saving ? 0.6 : 1 }}>{saving ? "Saving..." : "Save AI Settings"}</button>
          </>
        )}

        {!aiProvider && (
          <div style={{ color: COLORS.textFaint, fontSize: 13, textAlign: "center", padding: 20 }}>
            Select a provider above to configure AI analysis.
          </div>
        )}
      </div>

      {/* Data Export Section */}
      <div style={{ maxWidth: 500, marginTop: 40 }}>
        <div style={{ color: COLORS.accent, fontSize: 11, fontFamily: "'IBM Plex Mono', monospace", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 16 }}>Data Export</div>
        <p style={{ color: COLORS.textDim, fontSize: 13, marginBottom: 16, lineHeight: 1.6 }}>
          Download all your data as a JSON file. Includes schedules, progressions, progress logs, categories, and budget.
        </p>
        <button
          onClick={async () => {
            setExporting(true); setError("");
            try {
              const data = await api.dataExport.get();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `the-plan-export-${new Date().toISOString().slice(0, 10)}.json`;
              a.click();
              URL.revokeObjectURL(url);
            } catch (e) { setError(e.message); }
            finally { setExporting(false); }
          }}
          disabled={exporting}
          style={{ ...btnStyle, opacity: exporting ? 0.6 : 1 }}
        >
          {exporting ? "Exporting..." : "Export All Data (JSON)"}
        </button>
      </div>
    </div>
  );
}
