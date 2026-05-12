from __future__ import annotations

from typing import Any


BREAK_SPLIT_HOURS = 8.0
TARGET_PRETRIP_SLEEPER_HOURS = 7.0


def _round_hour(value: float) -> float:
    return round(value, 2)


def _format_hour(value: float) -> str:
    total_minutes = int(round(value * 60))
    hours, minutes = divmod(total_minutes, 60)
    return f"{hours:02d}:{minutes:02d}"


def _build_segment(
    *,
    status: str,
    row: str,
    label: str,
    start: float,
    end: float,
) -> dict[str, Any]:
    return {
        "status": status,
        "row": row,
        "label": label,
        "start": _round_hour(start),
        "end": _round_hour(end),
        "duration": _round_hour(end - start),
    }


def generate_eld_log(day_schedule: dict[str, Any]) -> dict[str, Any]:
    driving_hours = float(day_schedule["driving_hours"])
    break_hours = float(day_schedule["break_hours"])
    on_duty_hours = float(day_schedule["on_duty_not_driving"])
    off_duty_hours = float(day_schedule["off_duty_hours"])

    sleeper_berth_hours = _round_hour(
        min(TARGET_PRETRIP_SLEEPER_HOURS, off_duty_hours)
    )
    post_trip_off_duty_hours = _round_hour(
        max(off_duty_hours - sleeper_berth_hours, 0.0)
    )

    first_driving_segment = driving_hours
    second_driving_segment = 0.0

    if break_hours > 0:
        first_driving_segment = min(BREAK_SPLIT_HOURS, driving_hours)
        second_driving_segment = _round_hour(
            max(driving_hours - first_driving_segment, 0.0)
        )

    segments: list[dict[str, Any]] = []
    cursor = 0.0

    if sleeper_berth_hours > 0:
        segments.append(
            _build_segment(
                status="sleeper_berth",
                row="sleeper_berth",
                label="Sleeper Berth",
                start=cursor,
                end=cursor + sleeper_berth_hours,
            )
        )
        cursor += sleeper_berth_hours

    on_duty_start = cursor
    segments.append(
        _build_segment(
            status="on_duty",
            row="on_duty",
            label="On Duty (Not Driving)",
            start=cursor,
            end=cursor + on_duty_hours,
        )
    )
    cursor += on_duty_hours

    segments.append(
        _build_segment(
            status="driving",
            row="driving",
            label="Driving",
            start=cursor,
            end=cursor + first_driving_segment,
        )
    )
    cursor += first_driving_segment

    break_start = None
    break_end = None
    if break_hours > 0:
        break_start = cursor
        break_end = cursor + break_hours
        segments.append(
            _build_segment(
                status="break",
                row="off_duty",
                label="30-Min Break",
                start=break_start,
                end=break_end,
            )
        )
        cursor = break_end

    if second_driving_segment > 0:
        segments.append(
            _build_segment(
                status="driving",
                row="driving",
                label="Driving",
                start=cursor,
                end=cursor + second_driving_segment,
            )
        )
        cursor += second_driving_segment

    if post_trip_off_duty_hours > 0:
        segments.append(
            _build_segment(
                status="off_duty",
                row="off_duty",
                label="Off Duty",
                start=cursor,
                end=24.0,
            )
        )

    remarks = [
        (
            f"Pre-trip inspection and dispatch review logged from "
            f"{_format_hour(on_duty_start)} to {_format_hour(on_duty_start + on_duty_hours)}."
        ),
        (
            f"Shift window ran from {_format_hour(on_duty_start)} to "
            f"{_format_hour(24.0 - post_trip_off_duty_hours)}."
        ),
    ]

    if break_start is not None and break_end is not None:
        remarks.append(
            "Required 30-minute non-driving break completed from "
            f"{_format_hour(break_start)} to {_format_hour(break_end)}."
        )

    remarks.append(
        f'Cycle hours at end of day: {day_schedule["cycle_hours_used"]} / 70.'
    )

    return {
        "segments": segments,
        "remarks": remarks,
        "shift": {
            "start": _round_hour(on_duty_start),
            "end": _round_hour(24.0 - post_trip_off_duty_hours),
        },
        "totals": {
            "sleeper_berth_hours": sleeper_berth_hours,
            "post_trip_off_duty_hours": post_trip_off_duty_hours,
        },
    }


def attach_eld_logs(
    hos_schedule: list[dict[str, Any]],
) -> list[dict[str, Any]]:
    return [
        {
            **day_schedule,
            "eld_log": generate_eld_log(day_schedule),
        }
        for day_schedule in hos_schedule
    ]
