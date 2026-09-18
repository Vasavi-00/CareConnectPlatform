import React, { useState } from "react";
import {
  FaRobot,
  FaFaceSmile,
  FaComments,
  FaTriangleExclamation,
  FaClock,
  FaArrowRight,
  FaHeart,
  FaCalendarDay,
  FaPhone,
  FaMessage,
  FaMagnifyingGlass,
} from "react-icons/fa6";

import "../../styles/family/AICompanionPage.css";

export default function AICompanionPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const conversations = [
    {
      id: 1,
      date: "Today",
      time: "10:30 AM",
      title: "Morning Conversation",
      message:
        "Had a lovely conversation about her garden and plans for the weekend.",
      mood: "Happy",
      moodClass: "happy",
    },
    {
      id: 2,
      date: "Yesterday",
      time: "7:45 PM",
      title: "Evening Conversation",
      message:
        "Talked about her family and mentioned that she enjoyed her evening walk.",
      mood: "Positive",
      moodClass: "positive",
    },
    {
      id: 3,
      date: "14 Sep",
      time: "11:20 AM",
      title: "Family Conversation",
      message:
        "Mentioned that she was looking forward to her daughter's Sunday call.",
      mood: "Calm",
      moodClass: "calm",
    },
    {
      id: 4,
      date: "13 Sep",
      time: "4:15 PM",
      title: "Afternoon Conversation",
      message:
        "Talked about her favorite recipes and memories from her childhood.",
      mood: "Happy",
      moodClass: "happy",
    },
  ];

  const filteredConversations = conversations.filter((conversation) => {
    const search = searchTerm.toLowerCase();

    return (
      conversation.title.toLowerCase().includes(search) ||
      conversation.message.toLowerCase().includes(search) ||
      conversation.mood.toLowerCase().includes(search)
    );
  });

  return (
    <div className="ai-companion-page">

      {/* =====================================================
          PAGE HEADING BANNER
      ===================================================== */}

      <section className="ai-hero">

        <div className="ai-hero-left">

          <div className="ai-hero-icon">
            <FaRobot />
          </div>

          <div>
            <h1>AI Companion</h1>

            <p>
              View your parent's AI conversations, mood and important insights.
            </p>
          </div>

        </div>

        <div className="ai-hero-right">

          <span>
            “A friendly conversation
          </span>

          <span>
            can brighten every day.”
          </span>

        </div>

      </section>


      {/* =====================================================
          SUMMARY CARDS
      ===================================================== */}

      <section className="ai-summary-grid">

        {/* Current Mood */}

        <div className="ai-summary-card green-ai-card">

          <div className="ai-summary-icon">
            <FaFaceSmile />
          </div>

          <div>
            <span>Current Mood</span>

            <strong>Positive</strong>

            <small>Feeling good today</small>
          </div>

        </div>


        {/* Conversations */}

        <div className="ai-summary-card blue-ai-card">

          <div className="ai-summary-icon">
            <FaComments />
          </div>

          <div>
            <span>Conversations</span>

            <strong>12</strong>

            <small>this week</small>
          </div>

        </div>


        {/* Important Concerns */}

        <div className="ai-summary-card orange-ai-card">

          <div className="ai-summary-icon">
            <FaTriangleExclamation />
          </div>

          <div>
            <span>Important Concerns</span>

            <strong>2</strong>

            <small>need attention</small>
          </div>

        </div>


        {/* Last Conversation */}

        <div className="ai-summary-card purple-ai-card">

          <div className="ai-summary-icon">
            <FaClock />
          </div>

          <div>
            <span>Last Conversation</span>

            <strong>Today</strong>

            <small>10:30 AM</small>
          </div>

        </div>

      </section>


      {/* =====================================================
          SUMMARY + INSIGHTS
      ===================================================== */}

      <section className="ai-main-grid">

        {/* CONVERSATION SUMMARY */}

        <div className="conversation-summary-card">

          <div className="ai-section-header">

            <div>
              <h2>
                <FaComments />
                Conversation Summary
              </h2>

              <p>
                A quick overview of recent conversations.
              </p>
            </div>

          </div>


          {/* Today's Highlight */}

          <div className="conversation-highlight">

            <div className="highlight-icon">
              <FaHeart />
            </div>

            <div>

              <span className="highlight-label">
                TODAY'S HIGHLIGHT
              </span>

              <h3>
                Your parent had a positive conversation.
              </h3>

              <p>
                The AI Companion noticed a cheerful mood while
                talking about gardening and weekend plans.
              </p>

            </div>

          </div>


          {/* Conversation Details */}

          <div className="conversation-details">

            <div className="conversation-detail-item">

              <div className="detail-icon">
                <FaFaceSmile />
              </div>

              <div>
                <span>Mood</span>

                <strong>
                  Happy & Positive
                </strong>
              </div>

            </div>


            <div className="conversation-detail-item">

              <div className="detail-icon">
                <FaComments />
              </div>

              <div>
                <span>Main Topic</span>

                <strong>
                  Garden & Weekend Plans
                </strong>
              </div>

            </div>


            <div className="conversation-detail-item">

              <div className="detail-icon">
                <FaCalendarDay />
              </div>

              <div>
                <span>Family Mention</span>

                <strong>
                  Sunday Call
                </strong>
              </div>

            </div>

          </div>

        </div>


        {/* AI INSIGHTS */}

        <div className="ai-insights-card">

          <div className="ai-section-header">

            <div>
              <h2>
                <FaRobot />
                AI Companion Insights
              </h2>

              <p>
                Important observations from recent conversations.
              </p>
            </div>

          </div>


          {/* Positive Mood */}

          <div className="insight-item green-insight">

            <div className="insight-icon">
              <FaFaceSmile />
            </div>

            <div>

              <strong>
                Positive Mood
              </strong>

              <p>
                Your parent has been in a positive mood
                during recent conversations.
              </p>

            </div>

          </div>


          {/* Family Connection */}

          <div className="insight-item blue-insight">

            <div className="insight-icon">
              <FaPhone />
            </div>

            <div>

              <strong>
                Family Connection
              </strong>

              <p>
                Family conversations appear to be an
                important source of happiness.
              </p>

            </div>

          </div>


          {/* Attention */}

          <div className="insight-item orange-insight">

            <div className="insight-icon">
              <FaTriangleExclamation />
            </div>

            <div>

              <strong>
                Needs Attention
              </strong>

              <p>
                Two conversation topics may need
                family attention.
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =====================================================
          CONVERSATION HISTORY
      ===================================================== */}

      <section className="recent-conversations-card">

        <div className="ai-section-header">

          <div>

            <h2>
              <FaMessage />
              Conversation History
            </h2>

            <p>
              Review recent conversations between your parent
              and the AI Companion.
            </p>

          </div>


          {/* Search */}

          <div className="conversation-search">

            <FaMagnifyingGlass />

            <input
              type="text"
              placeholder="Search conversations..."
              value={searchTerm}
              onChange={(e) =>
                setSearchTerm(e.target.value)
              }
            />

          </div>

        </div>


        {/* Conversation List */}

        <div className="conversation-list">

          {filteredConversations.length > 0 ? (

            filteredConversations.map((conversation) => (

              <div
                className="conversation-item"
                key={conversation.id}
              >

                {/* Date */}

                <div className="conversation-date">

                  <strong>
                    {conversation.date}
                  </strong>

                  <span>
                    {conversation.time}
                  </span>

                </div>


                {/* AI Icon */}

                <div className="conversation-avatar">
                  <FaRobot />
                </div>


                {/* Conversation */}

                <div className="conversation-content">

                  <div className="conversation-title-row">

                    <h3>
                      {conversation.title}
                    </h3>

                    <span
                      className={`conversation-mood ${conversation.moodClass}`}
                    >
                      <FaFaceSmile />

                      {conversation.mood}
                    </span>

                  </div>

                  <p>
                    {conversation.message}
                  </p>

                </div>


                {/* Arrow */}

                <button
                  className="conversation-arrow"
                  title="View conversation"
                >
                  <FaArrowRight />
                </button>

              </div>

            ))

          ) : (

            <div className="no-conversations">
              No conversations found.
            </div>

          )}

        </div>

      </section>


      {/* =====================================================
          FAMILY CONNECTION
      ===================================================== */}

      <section className="family-concern-card">

        <div className="concern-icon">
          <FaHeart />
        </div>

        <div className="concern-content">

          <span className="concern-label">
            FAMILY CONNECTION
          </span>

          <h2>
            Stay connected with your parent
          </h2>

          <p>
            Review your parent's conversations and AI-generated
            insights to understand their mood, interests and
            important concerns.
          </p>

        </div>

      </section>

    </div>
  );
}