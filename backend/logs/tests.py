from django.test import SimpleTestCase

from services.eld_generator import generate_eld_log


class ELDGeneratorTests(SimpleTestCase):
    def test_generate_eld_log_adds_break_and_split_driving_segments(self):
        eld_log = generate_eld_log(
            {
                "day": 1,
                "distance": 660.0,
                "driving_hours": 11.0,
                "break_hours": 0.5,
                "on_duty_not_driving": 1.0,
                "off_duty_hours": 11.5,
                "cycle_hours_used": 44.5,
            }
        )

        segments = eld_log["segments"]
        driving_segments = [
            segment for segment in segments if segment["status"] == "driving"
        ]
        break_segments = [
            segment for segment in segments if segment["status"] == "break"
        ]

        self.assertEqual(len(driving_segments), 2)
        self.assertEqual(len(break_segments), 1)
        self.assertEqual(eld_log["shift"]["start"], 7.0)
        self.assertEqual(eld_log["shift"]["end"], 19.5)
