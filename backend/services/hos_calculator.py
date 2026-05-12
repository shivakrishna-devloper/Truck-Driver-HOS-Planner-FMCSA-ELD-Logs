from __future__ import annotations


MAX_DRIVING_HOURS = 11.0
AVERAGE_SPEED_MPH = 60.0
BREAK_AFTER_HOURS = 8.0
BREAK_DURATION_HOURS = 0.5
ON_DUTY_NOT_DRIVING_HOURS = 1.0
MIN_OFF_DUTY_HOURS = 10.0
CYCLE_LIMIT_HOURS = 70.0
MAX_DISTANCE_PER_DAY_MILES = MAX_DRIVING_HOURS * AVERAGE_SPEED_MPH


def generate_hos_schedule(
    total_distance_miles: float,
    current_cycle_used: float = 0.0,
) -> list[dict[str, float | int | bool]]:
    """Generate a simplified multi-day FMCSA HOS schedule."""

    remaining_distance = max(float(total_distance_miles), 0.0)
    cycle_hours_used = max(float(current_cycle_used), 0.0)
    schedule: list[dict[str, float | int | bool]] = []
    day_number = 1

    while remaining_distance > 0:
        distance_today = round(
            min(remaining_distance, MAX_DISTANCE_PER_DAY_MILES),
            2,
        )
        driving_hours = round(distance_today / AVERAGE_SPEED_MPH, 2)
        break_required = driving_hours >= BREAK_AFTER_HOURS
        break_hours = BREAK_DURATION_HOURS if break_required else 0.0
        on_duty_not_driving = ON_DUTY_NOT_DRIVING_HOURS
        total_on_duty_hours = round(
            driving_hours + break_hours + on_duty_not_driving,
            2,
        )
        off_duty_hours = round(
            max(
                MIN_OFF_DUTY_HOURS,
                24.0 - total_on_duty_hours,
            ),
            2,
        )

        cycle_hours_used = round(cycle_hours_used + total_on_duty_hours, 2)

        day_data = {
            "day": day_number,
            "distance": distance_today,
            "driving_hours": driving_hours,
            "break_hours": break_hours,
            "break_required": break_required,
            "on_duty_not_driving": on_duty_not_driving,
            "off_duty_hours": off_duty_hours,
            "total_on_duty_hours": total_on_duty_hours,
            "cycle_hours_used": cycle_hours_used,
            "cycle_remaining_hours": round(
                max(CYCLE_LIMIT_HOURS - cycle_hours_used, 0.0),
                2,
            ),
            "average_speed_mph": AVERAGE_SPEED_MPH,
        }

        validation = validate_hos_schedule(day_data)

        day_data["hos_validation"] = validation

        schedule.append(day_data)
        remaining_distance = round(max(remaining_distance - distance_today, 0.0), 2)
        day_number += 1

    return schedule


def validate_hos_schedule(day):
    violations = []

    driving_hours = day.get("driving_hours", 0)
    on_duty = day.get("on_duty_not_driving", 0)
    break_hours = day.get("break_hours", 0)
    cycle_used = day.get("cycle_hours_used", 0)

    total_duty_window = driving_hours + on_duty + break_hours

    # 11-hour driving rule
    if driving_hours > 11:
        violations.append("11-hour driving limit exceeded")

    # 14-hour duty window
    if total_duty_window > 14:
        violations.append("14-hour duty window exceeded")

    # 30-minute break rule
    if driving_hours >= 8 and break_hours < 0.5:
        violations.append("Required 30-minute break missing")

    # 70-hour cycle rule
    if cycle_used > 70:
        violations.append("70-hour / 8-day cycle exceeded")

    return {
        "compliant": len(violations) == 0,
        "violations": violations,
    }
