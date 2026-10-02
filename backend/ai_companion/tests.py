from django.test import SimpleTestCase

from .services.companion import _classify_message


class CompanionIntentTests(SimpleTestCase):
	def test_recognizes_emergency_phrasing(self):
		self.assertEqual(_classify_message("My chest feels tight"), "emergency")

	def test_recognizes_emotional_support_without_treating_it_as_emergency(self):
		self.assertEqual(_classify_message("I feel anxious about tomorrow"), "emotional_support")

	def test_uses_recent_message_for_short_medicine_follow_up(self):
		self.assertEqual(
			_classify_message("What time?", "Can you tell me my medicine schedule?"),
			"medicine",
		)

	def test_recognizes_capability_questions(self):
		self.assertEqual(_classify_message("What can you do?"), "capabilities")
