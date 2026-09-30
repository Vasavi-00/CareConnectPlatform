from django.urls import path
from .views import ChatView, ConversationListView, RequestCallView

urlpatterns = [
    path("chat/", ChatView.as_view(), name="ai-chat"),
    path("conversations/", ConversationListView.as_view(), name="ai-conversations"),
    path("request-call/", RequestCallView.as_view(), name="ai-request-call"),
]