import asyncio
from io import BytesIO
from unittest.mock import AsyncMock
from urllib.parse import urlencode

import pytest
from openpyxl import load_workbook

import server


class StudentCursor:
    def __init__(self, students):
        self.students = students

    def __aiter__(self):
        self.iterator = iter(self.students)
        return self

    async def __anext__(self):
        try:
            return next(self.iterator)
        except StopIteration:
            raise StopAsyncIteration


class Students:
    def __init__(self, students):
        self.students = students

    def find(self, query, projection):
        assert query["active"] == {"$ne": False}
        classes = query["class_name"]["$in"]
        return StudentCursor([
            student for student in self.students
            if student.get("active") is not False and student["class_name"] in classes
        ])


def request(params, user_type="admin"):
    async def execute():
        headers = []
        if user_type:
            token = server.create_jwt_token("test-user", user_type)
            headers.append((b"cookie", f"access_token={token}".encode()))
        scope = {
            "type": "http", "asgi": {"version": "3.0"}, "http_version": "1.1",
            "method": "GET", "scheme": "http", "path": "/api/admin/reports/fees",
            "raw_path": b"/api/admin/reports/fees", "query_string": urlencode(params, doseq=True).encode(),
            "headers": headers, "server": ("test", 80), "client": ("test", 1234),
            "root_path": "",
        }
        messages = []

        async def receive():
            return {"type": "http.request", "body": b"", "more_body": False}

        async def send(message):
            messages.append(message)

        await server.app(scope, receive, send)
        start = next(message for message in messages if message["type"] == "http.response.start")
        body = b"".join(message.get("body", b"") for message in messages if message["type"] == "http.response.body")
        return start["status"], dict(start["headers"]), body

    return asyncio.run(execute())


@pytest.fixture
def report_data(monkeypatch):
    students = [
        {"id": "1", "enrollment_number": "AV001", "name": "=Not a formula", "class_name": "Nursery"},
        {"id": "2", "enrollment_number": "AV002", "name": "Paid Student", "class_name": "1"},
        {"id": "3", "enrollment_number": "AV003", "name": "Other", "class_name": "2"},
        {"id": "4", "enrollment_number": "AV004", "name": "Inactive", "class_name": "1", "active": False},
    ]
    monkeypatch.setattr(server, "db", type("Database", (), {"students": Students(students)})())
    balances = {"1": 1250.5, "2": 0, "3": 0, "4": 0}
    monkeypatch.setattr(server, "build_fee_breakup", AsyncMock(side_effect=lambda student, student_id: {
        "total_fee": balances[student_id],
    }))
    summary = AsyncMock(return_value={"total_paid": 2400.0})
    monkeypatch.setattr(server, "build_paid_fee_summary", summary)
    return summary


@pytest.mark.parametrize(
    ("status", "expected"),
    [
        ("pending", [["Enrollment number", "Name", "Class", "Fee pending"], ["AV001", "=Not a formula", "Nursery", 1250.5]]),
        ("paid", [["Enrollment number", "Name", "Class", "Fee paid"], ["AV002", "Paid Student", "1", 2400]]),
    ],
)
def test_report_filters_and_workbook(report_data, status, expected):
    code, headers, body = request({"class_name": ["Nursery", "1"], "status": status})
    assert code == 200
    assert headers[b"content-type"].startswith(b"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    assert f"fee-{status}-report.xlsx".encode() in headers[b"content-disposition"]
    sheet = load_workbook(BytesIO(body)).active
    assert [list(row) for row in sheet.values] == expected
    if status == "pending":
        assert sheet["B2"].data_type == "s"
        report_data.assert_not_awaited()
    else:
        report_data.assert_awaited_once()


def test_empty_report_and_validation(report_data):
    code, _, body = request({"class_name": ["7"], "status": "paid"})
    assert code == 200
    assert list(load_workbook(BytesIO(body)).active.values) == [("Enrollment number", "Name", "Class", "Fee paid")]
    assert request({"class_name": [""], "status": "paid"})[0] == 400
    assert request({"status": "paid"})[0] == 400
    assert request({"class_name": ["1"], "status": "unknown"})[0] == 422


def test_report_requires_admin(report_data):
    params = {"class_name": ["1"], "status": "paid"}
    assert request(params, None)[0] == 401
    assert request(params, "student")[0] == 403
