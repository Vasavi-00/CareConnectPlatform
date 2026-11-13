import React, { useEffect, useState } from "react";
import { FaRobot, FaComments, FaClock } from "react-icons/fa6";
import { getAISummaries } from "../../services/api/familyApi";
import "../../styles/family/AICompanionPage.css";

export default function AICompanionPage({ selectedElder }) {
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const elderId = selectedElder?.elder_id || selectedElder?.elder?.id;

  useEffect(() => {
    let active = true;
    if (!elderId) {
      setSummaries([]);
      setLoading(false);
      return () => { active = false; };
    }
    setLoading(true);
    setError("");
    getAISummaries(elderId)
      .then((rows) => { if (active) setSummaries(rows); })
      .catch((err) => { if (active) setError(err.message || "Unable to load shared updates."); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [elderId]);

  return (
    <div className="ai-companion-page">
      <section className="ai-hero">
        <div className="ai-hero-left">
          <div className="ai-hero-icon"><FaRobot /></div>
          <div>
            <h1>AI Companion Updates</h1>
            <p>Only summaries your parent chose to share with you appear here.</p>
          </div>
        </div>
        <div className="ai-hero-right"><span>Private by default</span><span>No chat transcripts</span></div>
      </section>

      <section className="ai-summary-grid">
        <div className="ai-summary-card blue-ai-card"><div className="ai-summary-icon"><FaComments /></div><div><span>Shared updates</span><strong>{loading ? "…" : summaries.length}</strong><small>available to you</small></div></div>
        <div className="ai-summary-card purple-ai-card"><div className="ai-summary-icon"><FaClock /></div><div><span>Latest shared</span><strong>{summaries[0]?.shared_at ? new Date(summaries[0].shared_at).toLocaleDateString() : loading ? "…" : "—"}</strong><small>{summaries[0]?.shared_at ? new Date(summaries[0].shared_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : "No shared update"}</small></div></div>
      </section>

      <section className="recent-conversations-card">
        <div className="ai-section-header"><div><h2><FaComments /> Updates shared with you</h2><p>These are reviewed summaries, not medical records or the full conversation.</p></div></div>
        {error && <div className="no-conversations" role="alert">{error}</div>}
        {loading ? <div className="no-conversations" role="status">Loading shared updates…</div> : summaries.length === 0 ? (
          <div className="no-conversations"><FaRobot /><h3>No shared updates yet</h3><p>Your parent’s conversations remain private unless they review and share a summary with selected family members.</p></div>
        ) : (
          <div className="conversation-list">
            {summaries.map((item) => (
              <article className="conversation-item" key={item.id}>
                <div className="conversation-content">
                  <div className="conversation-title-row"><h3>CareConnect update</h3><span className="conversation-mood">Shared</span></div>
                  <p>{item.summary}</p>
                  <small>Shared {item.shared_at ? new Date(item.shared_at).toLocaleString() : "date unavailable"}</small>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
