from django.test import SimpleTestCase

from services.hos_calculator import MAX_DRIVING_HOURS, generate_hos_schedule


class HOSCalculatorTests(SimpleTestCase):
    def test_generate_hos_schedule_splits_long_trip_across_multiple_days(self):
        schedule = generate_hos_schedule(1500, current_cycle_used=32)

        self.assertEqual(len(schedule), 3)
        self.assertEqual(schedule[0]["distance"], 660.0)
        self.assertEqual(schedule[0]["driving_hours"], MAX_DRIVING_HOURS)
        self.assertEqual(schedule[0]["break_hours"], 0.5)
        self.assertEqual(schedule[0]["cycle_hours_used"], 44.5)
        self.assertEqual(schedule[-1]["distance"], 180.0)
        self.assertEqual(schedule[-1]["driving_hours"], 3.0)
        self.assertGreaterEqual(schedule[-1]["off_duty_hours"], 10.0)
