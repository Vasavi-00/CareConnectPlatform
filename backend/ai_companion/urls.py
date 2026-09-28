from django.urls import path
from .views import ChatView, ConversationListView, RequestCallView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="ai_chat"),
    path("conversations/", ConversationListView.as_view(), name="ai_conversations"),
    path("request-call/", RequestCallView.as_view(), name="ai_request_call"),
]
