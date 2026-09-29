import React, { useEffect, useMemo, useState } from "react";
import {
  FaRobot,
  FaComments,
  FaClock,
  FaHeart,
  FaMagnifyingGlass,
} from "react-icons/fa6";
import { getAIConversations } from "../../services/api/familyApi";
import "../../styles/family/AICompanionPage.css";

export default function AICompanionPage({ selectedElder }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;
    if (!elderId) {
      setConversations([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    getAIConversations(elderId)
      .then((rows) => { if (active) setConversations(rows); })
      .catch((err) => { if (active) setError(err.message || "Unable to load conversations."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [selectedElder]);

  const visibleConversations = useMemo(() => conversations.map((conversation) => {
    const messages = (conversation.messages || []).filter((message) => !message.is_private);
    const lastMessage = messages[messages.length - 1];
    const date = conversation.updated_at ? new Date(conversation.updated_at) : null;
    return {
      ...conversation,
      dateLabel: date ? date.toLocaleDateString() : "",
      timeLabel: date ? date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "",
      messageCount: messages.length,
      preview: lastMessage?.content || "No shared messages in this conversation.",
    };
  }), [conversations]);

  const filteredConversations = visibleConversations.filter((conversation) =>
    `${conversation.title || ""} ${conversation.preview}`.toLowerCase().includes(searchTerm.toLowerCase())
  );
  const latest = visibleConversations[0];

  return (
    <div className="ai-companion-page">
      <section className="ai-hero">
        <div className="ai-hero-left">
          <div className="ai-hero-icon"><FaRobot /></div>
          <div>
            <h1>AI Companion</h1>
            <p>Review shared conversation history for {selectedElder?.elder_name || "your connected elder"}.</p>
          </div>
        </div>
        <div className="ai-hero-right"><span>Conversation history</span><span>Shared messages only</span></div>
      </section>

      <section className="ai-summary-grid">
        <div className="ai-summary-card blue-ai-card"><div className="ai-summary-icon"><FaComments /></div><div><span>Conversations</span><strong>{loading ? "…" : conversations.length}</strong><small>available to family</small></div></div>
        <div className="ai-summary-card green-ai-card"><div className="ai-summary-icon"><FaComments /></div><div><span>Shared messages</span><strong>{loading ? "…" : visibleConversations.reduce((total, item) => total + item.messageCount, 0)}</strong><small>private messages hidden</small></div></div>
        <div className="ai-summary-card purple-ai-card"><div className="ai-summary-icon"><FaClock /></div><div><span>Latest activity</span><strong>{latest?.dateLabel || (loading ? "…" : "—")}</strong><small>{latest?.timeLabel || "No conversation yet"}</small></div></div>
      </section>

      <section className="recent-conversations-card">
        <div className="ai-section-header">
          <div><h2><FaComments /> Conversation History</h2><p>Messages marked private by the elder are not shown.</p></div>
          <div className="conversation-search"><FaMagnifyingGlass /><input type="search" placeholder="Search conversations..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} /></div>
        </div>
        {error && <p role="alert" className="no-conversations">{error}</p>}
        {loading ? <p className="no-conversations">Loading conversation history…</p> : !error && filteredConversations.length ? (
          <div className="conversation-list">
            {filteredConversations.map((conversation) => (
              <article className="conversation-item" key={conversation.id}>
                <div className="conversation-date"><strong>{conversation.dateLabel}</strong><span>{conversation.timeLabel}</span></div>
                <div className="conversation-avatar"><FaRobot /></div>
                <div className="conversation-content"><div className="conversation-title-row"><h3>{conversation.title || "Companion conversation"}</h3><span className="conversation-mood">{conversation.messageCount} shared messages</span></div><p>{conversation.preview}</p></div>
              </article>
            ))}
          </div>
        ) : !error ? <p className="no-conversations">{selectedElder ? "No conversation history is available yet." : "Connect an elder to view conversation history."}</p> : null}
      </section>

      <section className="family-concern-card">
        <div className="concern-icon"><FaHeart /></div>
        <div className="concern-content"><span className="concern-label">Privacy</span><h2>Respecting your parent’s privacy</h2><p>The companion service currently provides conversation history. It does not provide mood analysis or family insight summaries.</p></div>
      </section>
    </div>
  );
}

