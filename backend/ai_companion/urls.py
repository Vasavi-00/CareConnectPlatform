from django.urls import path
from .views import (
    ChatView,
    TranscribeView,
    VoiceChatView,
    ConversationListView,
    RequestCallView,
    ConversationSummaryDraftView,
    ConversationSummaryShareView,
    ConversationSummaryListView,
    ConversationSummaryRevokeView,
)

urlpatterns = [
    path("chat/", ChatView.as_view(), name="ai-chat"),
    path("transcribe/", TranscribeView.as_view(), name="ai-transcribe"),
    path("voice-chat/", VoiceChatView.as_view(), name="ai-voice-chat"),
    path("conversations/", ConversationListView.as_view(), name="ai-conversations"),
    path("request-call/", RequestCallView.as_view(), name="ai-request-call"),
    path("conversations/<int:conversation_id>/summary/", ConversationSummaryDraftView.as_view(), name="ai-summary-draft"),
    path("summaries/", ConversationSummaryListView.as_view(), name="ai-summary-list"),
    path("summaries/<int:pk>/share/", ConversationSummaryShareView.as_view(), name="ai-summary-share"),
    path("summaries/<int:pk>/revoke/", ConversationSummaryRevokeView.as_view(), name="ai-summary-revoke"),
]
