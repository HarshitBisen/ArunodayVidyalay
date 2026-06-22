#!/usr/bin/env python3
# Command to execute script
# python3 scripts/generate_fee_import_query.py --fee-file Fee_Details_KM_2.xlsx --sheet-index 0 --start-enrollment 1
"""
Print MongoDB insert queries for importing students, concessions, and payments.

Schema matches:
  - students collection
  - payments collection (offline + razorpay stubs)
  - concessions collection
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import uuid
from datetime import datetime, timedelta, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Optional, Tuple
from xml.etree import ElementTree as ET
from zipfile import ZipFile

try:
    import bcrypt
except ImportError:
    bcrypt = None


MAIN_NS = "{http://schemas.openxmlformats.org/spreadsheetml/2006/main}"
PACKAGE_REL_NS = "{http://schemas.openxmlformats.org/package/2006/relationships}"
OFFICE_REL_NS = "{http://schemas.openxmlformats.org/officeDocument/2006/relationships}"

DEFAULT_FEE_FILE = Path("Fee_Details_KM_2.xlsx")
DEFAULT_ACADEMIC_YEAR = "2026-27"
DEFAULT_PASSWORD = "student123"

CLASS_ALIASES = {
    "NURSERY": "Nursery",
    "NUR": "Nursery",
    "NUR.": "Nursery",
    "JKG": "JKG",
    "SKG": "SKG",
    "I": "1",
    "IST": "1",
    "1ST": "1",
    "1": "1",
    "II": "2",
    "IIND": "2",
    "2ND": "2",
    "2": "2",
    "III": "3",
    "IIIRD": "3",
    "3RD": "3",
    "3": "3",
    "IV": "4",
    "IVTH": "4",
    "4TH": "4",
    "4": "4",
    "V": "5",
    "VTH": "5",
    "5TH": "5",
    "5": "5",
    "VI": "6",
    "VITH": "6",
    "6TH": "6",
    "6": "6",
    "VII": "7",
    "VIITH": "7",
    "7TH": "7",
    "7": "7",
}

CONCESSION_SHEETS = {
    "sibbling": ("sibling", 50),
    "sibling": ("sibling", 50),
    "staff": ("staff", 50),
    "sponsered": ("government sponsored", 50),
    "sponsored": ("government sponsored", 50),
}


def normalize_space(value: Any) -> str:
    return re.sub(r"\s+", " ", str(value or "").strip())


def normalize_key(value: Any) -> str:
    return re.sub(r"[^a-z0-9]+", "", normalize_space(value).lower())


def is_blank(value: Any) -> bool:
    return normalize_space(value) == ""


def to_number(value: Any) -> Optional[float]:
    text = normalize_space(value).replace(",", "")
    if not text:
        return None
    try:
        return float(text)
    except ValueError:
        return None


def col_to_index(cell_ref: str) -> int:
    match = re.match(r"([A-Z]+)", cell_ref or "A")
    letters = match.group(1) if match else "A"
    index = 0
    for char in letters:
        index = index * 26 + ord(char) - ord("A") + 1
    return index - 1


def excel_serial_to_date(value: Any) -> Optional[datetime]:
    number = to_number(value)
    if number is None or number < 30000:
        return None
    return datetime(1899, 12, 30, tzinfo=timezone.utc) + timedelta(days=int(number))


def parse_date(value: Any) -> Optional[datetime]:
    text = normalize_space(value)
    if not text:
        return None
    serial_date = excel_serial_to_date(text)
    if serial_date:
        return serial_date
    for fmt in ("%d.%m.%y", "%d.%m.%Y", "%d/%m/%y", "%d/%m/%Y", "%Y-%m-%d"):
        try:
            parsed = datetime.strptime(text, fmt)
            return parsed.replace(tzinfo=timezone.utc)
        except ValueError:
            continue
    return None


def read_xlsx(path: Path) -> "OrderedSheets":
    """Read all sheets, preserving workbook order. Returns an OrderedSheets
    object that behaves like a dict (name -> rows) but also exposes the
    original sheet order so callers can select sheets by index."""
    with ZipFile(path) as archive:
        shared_strings: List[str] = []
        if "xl/sharedStrings.xml" in archive.namelist():
            shared_root = ET.fromstring(archive.read("xl/sharedStrings.xml"))
            for item in shared_root.findall(f"{MAIN_NS}si"):
                shared_strings.append("".join(node.text or "" for node in item.iter(f"{MAIN_NS}t")))

        workbook_root = ET.fromstring(archive.read("xl/workbook.xml"))
        rels_root = ET.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
        rels = {
            rel.attrib["Id"]: rel.attrib["Target"]
            for rel in rels_root.findall(f"{PACKAGE_REL_NS}Relationship")
        }

        sheet_order: List[str] = []
        sheets: Dict[str, List[List[Any]]] = {}
        for sheet in workbook_root.find(f"{MAIN_NS}sheets").findall(f"{MAIN_NS}sheet"):
            name = sheet.attrib["name"]
            rel_id = sheet.attrib[f"{OFFICE_REL_NS}id"]
            target = rels[rel_id]
            sheet_path = f"xl/{target}" if not target.startswith("/") else target[1:]
            root = ET.fromstring(archive.read(sheet_path))
            rows: List[List[Any]] = []

            for row in root.findall(f".//{MAIN_NS}sheetData/{MAIN_NS}row"):
                values: List[Any] = []
                for cell in row.findall(f"{MAIN_NS}c"):
                    index = col_to_index(cell.attrib.get("r", "A1"))
                    while len(values) <= index:
                        values.append("")
                    cell_type = cell.attrib.get("t")
                    value_node = cell.find(f"{MAIN_NS}v")
                    value = "" if value_node is None or value_node.text is None else value_node.text
                    if cell_type == "s":
                        value = shared_strings[int(value)] if value else ""
                    elif cell_type == "inlineStr":
                        value = "".join(node.text or "" for node in cell.iter(f"{MAIN_NS}t"))
                    values[index] = value
                rows.append(values)

            sheet_order.append(name)
            sheets[name] = rows

        return OrderedSheets(sheet_order, sheets)


class OrderedSheets:
    """Dict-like wrapper over sheet name -> rows that also remembers the
    original sheet order, so sheets can be selected by 0-based index."""

    def __init__(self, order: List[str], sheets: Dict[str, List[List[Any]]]):
        self.order = order
        self.sheets = sheets

    def items(self):
        for name in self.order:
            yield name, self.sheets[name]

    def names(self) -> List[str]:
        return list(self.order)

    def by_index(self, index: int) -> Tuple[str, List[List[Any]]]:
        if index < 0 or index >= len(self.order):
            raise IndexError(
                f"Sheet index {index} out of range (workbook has {len(self.order)} sheets, "
                f"valid indices 0-{len(self.order) - 1})"
            )
        name = self.order[index]
        return name, self.sheets[name]

    def by_name(self, name: str) -> Tuple[str, List[List[Any]]]:
        # case-insensitive / whitespace-tolerant match
        target_key = normalize_key(name)
        for sheet_name in self.order:
            if normalize_key(sheet_name) == target_key:
                return sheet_name, self.sheets[sheet_name]
        raise KeyError(f"No sheet named '{name}' found. Available: {self.order}")

    def filtered(self, names: List[str]) -> "OrderedSheets":
        keep = {n for n in names}
        new_order = [n for n in self.order if n in keep]
        new_sheets = {n: self.sheets[n] for n in new_order}
        return OrderedSheets(new_order, new_sheets)


def js_json(value: Any) -> str:
    return json.dumps(value, ensure_ascii=False, indent=2)


def first_name_of(full_name: str) -> str:
    """Return the first whitespace-separated token of a name, stripped of
    punctuation. 'Krati Mishra' -> 'Krati', 'MOHD. AAYAN' -> 'MOHD'."""
    text = normalize_space(full_name)
    if not text:
        return ""
    token = text.split(" ")[0]
    return token.strip(".")


def student_email_for(full_name: str) -> Optional[str]:
    first = first_name_of(full_name)
    if not first:
        return None
    return f"{first.lower()}@gmail.com"


def student_password_for(full_name: str) -> Optional[str]:
    first = first_name_of(full_name)
    if not first:
        return None
    return f"{first}@123"


def make_password_hash(password: str) -> str:
    if bcrypt is None:
        raise RuntimeError(
            "The 'bcrypt' package is required to hash per-student passwords "
            "(install with: pip install bcrypt)"
        )
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def class_from_sheet_name(sheet_name: str) -> Optional[str]:
    text = normalize_space(sheet_name).upper()
    for token in re.split(r"[^A-Z0-9.]+", text):
        token = token.strip(".")
        if token in CLASS_ALIASES:
            return CLASS_ALIASES[token]
    return None


def class_from_value(value: Any) -> Optional[str]:
    text = normalize_space(value).upper().strip(".")
    return CLASS_ALIASES.get(text)


def find_section_boundaries(rows: List[List[Any]]) -> List[Tuple[int, str]]:
    """Scan the ENTIRE sheet (not just the top) for section title rows, e.g.
    'Ist (B) Academic Year 2026/2027' or 'Ist New (A)'. A sheet can contain
    more than one section stacked vertically, each introduced by its own
    title row (a row whose first cell has text matching '(<letter>)' and
    whose other cells are blank).

    Returns a list of (row_index, section_letter) sorted by row_index.
    Defaults to a single ('row 0', 'A') boundary if no section markers are
    found anywhere, so sheets without explicit sections still get 'A'.
    """
    boundaries: List[Tuple[int, str]] = []
    for index, row in enumerate(rows):
        title = normalize_space(row[0] if row else "")
        if not title:
            continue
        match = re.search(r"\(([A-Za-z])\)", title)
        if not match:
            continue
        # A genuine section title row has no other content alongside it
        # (distinguishes it from a coincidental '(B)' inside student data).
        rest_blank = all(normalize_space(v) == "" for v in row[1:])
        if not rest_blank:
            continue
        boundaries.append((index, match.group(1).upper()))

    if not boundaries:
        boundaries.append((0, "A"))

    boundaries.sort(key=lambda b: b[0])
    return boundaries


def section_for_row(boundaries: List[Tuple[int, str]], row_index: int) -> str:
    """Given section boundaries from find_section_boundaries, return which
    section a given row index belongs to (the latest boundary at or before
    that row)."""
    section = boundaries[0][1]
    for boundary_row, letter in boundaries:
        if boundary_row <= row_index:
            section = letter
        else:
            break
    return section


def extract_phone(rows: List[List[Any]], start: int, end: int) -> str:
    for row in rows[start:end]:
        for cell in row:
            match = re.search(r"(?:MO|MOB|MOBILE|PHONE)[\s.:-]*(\d{10})", normalize_space(cell), re.I)
            if match:
                return match.group(1)
            match = re.search(r"\b([6-9]\d{9})\b", normalize_space(cell))
            if match:
                return match.group(1)
    return ""


def extract_parent_name(rows: List[List[Any]], start: int, end: int) -> str:
    for row in rows[start:end]:
        for cell in row:
            text = normalize_space(cell)
            match = re.search(r"\b(?:S/O|D/O|C/O|F/O)\s+(.+)$", text, re.I)
            if match:
                return normalize_space(match.group(1))
    return ""


def extract_roll_number(rows: List[List[Any]]) -> str:
    """Extract numeric serial number from the first cell of the first row."""
    if rows:
        first = normalize_space(rows[0][0] if rows[0] else "")
        if re.fullmatch(r"\d+", first):
            return first
    return ""


# Maps inline concession labels found in the fee sheet to (reason, percent)
INLINE_CONCESSION_LABELS: Dict[str, Tuple[str, int]] = {
    "sibbling": ("sibling", 50),
    "sibblings": ("sibling", 50),
    "sibling": ("sibling", 50),
    "siblings": ("sibling", 50),
    "staff": ("staff", 50),
    "sponsered": ("government sponsored", 50),
    "sponsored": ("government sponsored", 50),
}


def extract_concession_from_block(block: List[List[Any]]) -> Optional[Tuple[str, int]]:
    """Return (reason, percent) if a concession label is found in col 1 of the block."""
    for row in block:
        label = normalize_key(row[1] if len(row) > 1 else "")
        if label in INLINE_CONCESSION_LABELS:
            return INLINE_CONCESSION_LABELS[label]
    return None


# Maps one-time fee labels (found in columns 2-3 of a student block) to the
# breakup field they belong to.
ONE_TIME_FEE_LABELS: Dict[str, str] = {
    "admfee": "admission_fee",
    "annualfee": "annual_fee",
    "annual": "annual_fee",
    "cautionmoney": "caution_money",
}


def extract_one_time_fees(block: List[List[Any]], header_row_limit: int = 4) -> Dict[str, float]:
    """Scan the top of a student block for flat one-time fee labels
    (Adm.Fee, Annual Fee, Caution Money) paired with an amount in the next
    column, e.g. ['Adm.Fee', '1000']. Returns a dict of breakup-field -> amount,
    skipping any non-numeric values like 'Pending'."""
    fees: Dict[str, float] = {}
    for row in block[:header_row_limit]:
        for col_index, cell in enumerate(row):
            label_key = normalize_key(cell)
            field = ONE_TIME_FEE_LABELS.get(label_key)
            if not field or col_index + 1 >= len(row):
                continue
            amount = to_number(row[col_index + 1])
            if amount is None or amount <= 0:
                continue
            fees[field] = amount
    return fees


def extract_student_blocks(rows: List[List[Any]]) -> List[Tuple[int, int, List[List[Any]]]]:
    starts: List[int] = []
    for index, row in enumerate(rows):
        first = normalize_space(row[0] if row else "")
        second = normalize_space(row[1] if len(row) > 1 else "")
        if re.fullmatch(r"\d+", first) and second and second.lower() != "student detail":
            starts.append(index)

    blocks: List[Tuple[int, int, List[List[Any]]]] = []
    for pos, start in enumerate(starts):
        end = starts[pos + 1] if pos + 1 < len(starts) else min(len(rows), start + 10)
        blocks.append((start, end, rows[start:end]))
    return blocks


def find_month_headers(rows: List[List[Any]], header_limit: int = 4) -> Dict[int, str]:
    months: Dict[int, str] = {}
    for row in rows[:header_limit]:
        for col, value in enumerate(row):
            date = excel_serial_to_date(value)
            if date:
                months[col] = f"{date.year:04d}-{date.month:02d}"
    return months


def nearest_month_for_col(months: Dict[int, str], col: int) -> Optional[str]:
    candidates = [(abs(month_col - col), month_col, month) for month_col, month in months.items()]
    if not candidates:
        return None
    _, _, month = min(candidates)
    return month


def find_payment_date(block: List[List[Any]], row_index: int, col_index: int) -> Optional[datetime]:
    for r in range(row_index, min(len(block), row_index + 3)):
        row = block[r]
        for c in (col_index, col_index + 1):
            if c < len(row):
                date = parse_date(row[c])
                if date:
                    return date
    return None


def find_receipt_number(block: List[List[Any]], row_index: int, col_index: int) -> str:
    for r in range(max(0, row_index - 1), min(len(block), row_index + 1)):
        row = block[r]
        for c in (col_index - 1, col_index, col_index + 1):
            if c < 0 or c >= len(row):
                continue
            text = normalize_space(row[c])
            if text.lower() == "r.no." and c + 1 < len(row):
                receipt = normalize_space(row[c + 1])
                if receipt:
                    return receipt
    return ""



# Row index (relative to block start) carrying the recurring bus fee
# "Rs." installments - consistent across every class sheet.
BUS_ROW_INDEX = 4


def block_has_bus_payment(block: List[List[Any]]) -> bool:
    """Return True if the student paid a bus fee in at least one month."""
    if len(block) <= BUS_ROW_INDEX:
        return False
    row = block[BUS_ROW_INDEX]
    for col_index, cell in enumerate(row):
        if normalize_space(cell).lower() != "rs.":
            continue
        if col_index + 1 >= len(row):
            continue
        amount = to_number(row[col_index + 1])
        if amount is not None and amount > 0:
            return True
    return False


def extract_payments_from_block(
    block: List[List[Any]],
    student_id: str,
    enrollment_number: str,
    months: Dict[int, str],
    created_at: str,
    warnings: List[str],
) -> List[Dict[str, Any]]:
    """Extract one payment record per billing cycle (month) for a student.

    Each block has two parallel rows of 'Rs.' installment entries that share
    the same column positions:
      - row index 1 (relative to block start): tuition fee installments
      - row index 4 (relative to block start): bus fee installments
    A given column may have only a tuition entry, only a bus entry, or both -
    either way, everything at that column is combined into a single payment
    row for that month (not split into separate tuition/bus rows).

    The one-time fees (admission/annual/caution money) found at the top of
    the block are folded into the *first* monthly payment row, rather than
    being recorded as a separate payment.
    """
    TUITION_ROW = 1
    BUS_ROW = BUS_ROW_INDEX

    # Collect (amount, receipt, date) per row at each column that has a
    # "Rs." entry, for the tuition and bus rows specifically.
    by_column: Dict[int, Dict[str, Tuple[float, str, Optional[datetime]]]] = {}

    for row_index in (TUITION_ROW, BUS_ROW):
        if row_index >= len(block):
            continue
        row = block[row_index]
        for col_index, cell in enumerate(row):
            if normalize_space(cell).lower() != "rs.":
                continue
            if col_index + 1 >= len(row):
                continue
            if col_index >= 28:
                continue
            amount = to_number(row[col_index + 1])
            if amount is None or amount <= 0:
                continue

            receipt = find_receipt_number(block, row_index, col_index)
            paid_at = find_payment_date(block, row_index, col_index)
            fee_field = "bus_fee" if row_index == BUS_ROW else "tuition_fee"

            by_column.setdefault(col_index, {})[fee_field] = (amount, receipt, paid_at)

    one_time_fees = extract_one_time_fees(block)

    payments: List[Dict[str, Any]] = []
    for col_index in sorted(by_column.keys()):
        entries = by_column[col_index]
        tuition = entries.get("tuition_fee")
        bus = entries.get("bus_fee")

        tuition_amount = tuition[0] if tuition else 0
        bus_amount = bus[0] if bus else 0

        # transaction_id: prefer the tuition fee receipt; fall back to bus
        # fee receipt if tuition has none.
        receipt = (tuition[1] if tuition and tuition[1] else "") or (bus[1] if bus and bus[1] else "")

        # paid_at: prefer the tuition fee date; fall back to bus fee date.
        paid_at = (tuition[2] if tuition else None) or (bus[2] if bus else None)

        # paid_for_month should come from the fee month column,
        # not from the date on which the payment was made.
        paid_for_month = nearest_month_for_col(months, col_index)

        if not paid_for_month:
            warnings.append(
                f"No paid_for_month found for {enrollment_number} payment in column {col_index}"
            )

        paid_at_value = paid_at or datetime.now(timezone.utc)
        transaction_id = receipt or f"offline-{enrollment_number}-{len(payments) + 1:02d}"

        # Fold one-time fees (admission/annual/caution) into the first
        # monthly row only.
        is_first_row = len(payments) == 0
        admission_fee = one_time_fees.get("admission_fee", 0) if is_first_row else 0
        annual_fee = one_time_fees.get("annual_fee", 0) if is_first_row else 0
        caution_money = one_time_fees.get("caution_money", 0) if is_first_row else 0

        total = tuition_amount + bus_amount + admission_fee + annual_fee + caution_money

        breakup = {
            "sum": {
                "admission_fee": admission_fee,
                "annual_fee": annual_fee,
                "tuition_fee": tuition_amount,
                "bus_fee": bus_amount,
                "late_fee": 0,
                "caution_money": caution_money,
            },
            "subs": {},
            "total": total,
            "meta": {
                "due_months": 1,
                "oldest_unpaid_month": paid_for_month,
            },
        }

        payments.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "amount": total,
                "payment_method": "Offline",
                "transaction_id": str(transaction_id),
                "status": "success",
                "paid_for_month": paid_for_month,
                "breakup": breakup,
                "paid_at": paid_at_value.isoformat(),
                "payment_gateway": "offline",
                "admin_marked_by": None,
                "note": "imported from fee register",
            }
        )

    # Edge case: a student has one-time fees but no monthly tuition/bus
    # entries at all yet. Don't drop the one-time fees silently - record
    # them as their own row dated at student creation.
    if not payments and one_time_fees:
        total = sum(one_time_fees.values())
        breakup = {
            "sum": {
                "admission_fee": one_time_fees.get("admission_fee", 0),
                "annual_fee": one_time_fees.get("annual_fee", 0),
                "tuition_fee": 0,
                "bus_fee": 0,
                "late_fee": 0,
                "caution_money": one_time_fees.get("caution_money", 0),
            },
            "subs": {},
            "total": total,
            "meta": {
                "due_months": 0,
                "oldest_unpaid_month": None,
            },
        }
        payments.append(
            {
                "id": str(uuid.uuid4()),
                "student_id": student_id,
                "amount": total,
                "payment_method": "Offline",
                "transaction_id": f"offline-{enrollment_number}-onetime",
                "status": "success",
                "paid_for_month": None,
                "breakup": breakup,
                "paid_at": created_at,
                "payment_gateway": "offline",
                "admin_marked_by": None,
                "note": "imported from fee register (one-time fees: admission/annual/caution)",
            }
        )

    return payments


def extract_students_and_payments(
    sheets: "OrderedSheets",
    academic_year: str,
    start_enrollment: int,
    warnings: List[str],
) -> Tuple[List[Dict[str, Any]], List[Dict[str, Any]], List[Dict[str, Any]]]:
    students: List[Dict[str, Any]] = []
    payments: List[Dict[str, Any]] = []
    concessions: List[Dict[str, Any]] = []
    enrollment = start_enrollment

    for sheet_name, rows in sheets.items():
        class_name = class_from_sheet_name(sheet_name)
        if not class_name:
            continue

        section_boundaries = find_section_boundaries(rows)
        months = find_month_headers(rows)
        for block_start, _end, block in extract_student_blocks(rows):
            first_row = block[0]
            raw_name = normalize_space(first_row[1] if len(first_row) > 1 else "")
            if not raw_name:
                continue

            section = section_for_row(section_boundaries, block_start)
            enrollment_number = f"AV{enrollment:03d}"
            roll_number = normalize_space(first_row[0] if first_row else "") or str(enrollment)
            enrollment += 1
            student_id = str(uuid.uuid4())
            phone = extract_phone(block, 0, len(block))
            parent_name = extract_parent_name(block, 0, len(block))
            
            now = datetime.now(timezone.utc).isoformat()

            student_payments = extract_payments_from_block(
                block,
                student_id,
                enrollment_number,
                months,
                now,
                warnings,
            )

            created_at = now
            for payment in student_payments:
                if payment["breakup"]["sum"]["tuition_fee"] > 0 and payment.get("paid_for_month"):
                    created_at = f'{payment["paid_for_month"]}-01T00:00:00+00:00'
                    break

            email = student_email_for(raw_name)
            plain_password = student_password_for(raw_name)
            if plain_password:
                password_hash = make_password_hash(plain_password)
            else:
                password_hash = None
                warnings.append(f"Could not derive email/password for student '{raw_name}' ({enrollment_number})")

            one_time_fees = extract_one_time_fees(block)
            paid_admission_fee = one_time_fees.get("admission_fee", 0) > 0

            # Student schema matches the provided example
            student = {
                "id": student_id,
                "enrollment_number": enrollment_number,
                "roll_number": roll_number,
                "name": raw_name,
                "email": email,
                "password_hash": password_hash,
                "class_name": class_name,
                "section": section,
                "phone": phone,
                "parent_name": parent_name,
                "parent_phone": phone,
                "address": "",
                "bus_opted": "yes" if block_has_bus_payment(block) else "no",
                "new_student": "yes" if paid_admission_fee else "no",
                "pickup_location": "",
                "distance_school": None,
                "created_at": created_at,
                "updated_at": now,
                "academic_year": academic_year,
                "active": True,
                "fee_status": "offline",
                "fee_cycle": "m",
            }
            students.append(student)

            payments.extend(student_payments)

            # Extract concession label written inline in the student block (col 1)
            concession_info = extract_concession_from_block(block)
            if concession_info:
                reason, percent = concession_info
                concessions.append(
                    {
                        "id": str(uuid.uuid4()),
                        "student_id": student_id,
                        "percent": percent,
                        "reason": reason,
                        "year": int(academic_year[:4]),
                        "created_at": created_at,
                        "updated_at": now,
                    }
                )

    return students, payments, concessions


def find_header_row(rows: List[List[Any]], required_headers: Iterable[str]) -> Optional[int]:
    required = {normalize_key(header) for header in required_headers}
    for index, row in enumerate(rows):
        keys = {normalize_key(cell) for cell in row}
        if required.issubset(keys):
            return index
    return None


def match_student_id(
    student_lookup: Dict[Tuple[str, str], str], student_name: str, class_name: str
) -> Optional[str]:
    name_key = normalize_key(student_name)
    if not name_key:
        return None

    exact = student_lookup.get((name_key, class_name)) or student_lookup.get((name_key, ""))
    if exact:
        return exact

    candidates: List[str] = []
    for (candidate_name, candidate_class), student_id in student_lookup.items():
        if candidate_class and class_name and candidate_class != class_name:
            continue
        if name_key in candidate_name or candidate_name in name_key:
            candidates.append(student_id)

    unique_candidates = list(dict.fromkeys(candidates))
    return unique_candidates[0] if len(unique_candidates) == 1 else None


def extract_concessions(
    concession_file: Path,
    student_lookup: Dict[Tuple[str, str], str],
    warnings: List[str],
) -> List[Dict[str, Any]]:
    sheets = read_xlsx(concession_file)
    concessions: List[Dict[str, Any]] = []
    now = datetime.now(timezone.utc)

    for sheet_name, rows in sheets.items():
        reason, percent = CONCESSION_SHEETS.get(normalize_key(sheet_name), (None, None))
        if not reason:
            continue
        header_row_index = find_header_row(rows, ["Student's Name", "Class"])
        if header_row_index is None:
            warnings.append(f"No concession header found in sheet {sheet_name}")
            continue

        headers = [normalize_key(cell) for cell in rows[header_row_index]]
        name_col = headers.index(normalize_key("Student's Name"))
        class_col = headers.index(normalize_key("Class"))

        for row in rows[header_row_index + 1:]:
            student_name = normalize_space(row[name_col] if len(row) > name_col else "")
            if not student_name:
                continue
            class_name = class_from_value(row[class_col] if len(row) > class_col else "") or ""
            student_id = match_student_id(student_lookup, student_name, class_name)
            if not student_id:
                warnings.append(
                    f"Could not match concession student: {student_name} ({class_name or 'unknown class'})"
                )
                continue

            concession_id = str(uuid.uuid4())
            now_iso = now.isoformat()

            # Concession schema matches the provided example
            concessions.append(
                {
                    "id": concession_id,
                    "student_id": student_id,
                    "percent": percent,
                    "reason": reason,
                    "year": now.year,
                    "created_at": now_iso,
                    "updated_at": now_iso,
                }
            )

    return concessions


def print_insert_query(
    students: List[Dict[str, Any]],
    concessions: List[Dict[str, Any]],
    payments: List[Dict[str, Any]],
    warnings: List[str],
    sheet_label: str = "",
    out=None,
) -> None:
    """Write the generated insert queries to `out` (defaults to stdout)."""
    if out is None:
        out = sys.stdout

    def p(*args: Any) -> None:
        print(*args, file=out)

    p("// Generated import query for MongoDB shell / mongosh")
    if sheet_label:
        p(f"// Sheet: {sheet_label}")
    p("// Review before running. Existing records are not deleted by this script.")
    p(f"// students: {len(students)}, concessions: {len(concessions)}, payments: {len(payments)}")
    for warning in warnings:
        p(f"// WARNING: {warning}")
    p()

    if students:
        p("db.students.insertMany(")
        p(js_json(students))
        p(");")
        p()
    else:
        p("// No students generated.")
        p()

    if concessions:
        p("db.concessions.insertMany(")
        p(js_json(concessions))
        p(");")
        p()
    else:
        p("// No concessions generated.")
        p()

    if payments:
        p("db.payments.insertMany(")
        p(js_json(payments))
        p(");")
    else:
        p("// No payments generated.")


def list_sheets(fee_file: Path) -> int:
    sheets = read_xlsx(fee_file)
    print(f"Sheets in {fee_file}:")
    for index, name in enumerate(sheets.names()):
        mapped_class = class_from_sheet_name(name)
        if mapped_class:
            _name, rows = sheets.by_index(index)
            boundaries = find_section_boundaries(rows)
            section_letters = ", ".join(letter for _row, letter in boundaries)
            tag = f"-> class '{mapped_class}', section(s): {section_letters}"
        else:
            tag = "-> (not a class sheet, skipped by default)"
        print(f"  [{index}] {name} {tag}")
    return 0


def slugify_for_filename(value: str) -> str:
    """Turn a class name into a safe filename, e.g. 'UKG' -> 'UKG', '1' -> '1'."""
    cleaned = re.sub(r"[^A-Za-z0-9]+", "_", value).strip("_")
    return cleaned or "sheet"


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description="Print MongoDB insert queries from fee Excel workbooks."
    )
    parser.add_argument("--fee-file", type=Path, default=DEFAULT_FEE_FILE)
    parser.add_argument("--concession-file", type=Path, default=None,
                        help="Optional sibling/concession xlsx file")
    parser.add_argument("--academic-year", default=DEFAULT_ACADEMIC_YEAR)
    parser.add_argument(
        "--start-enrollment",
        type=int,
        default=1,
        help="First AV sequence number, e.g. 1 -> AV001",
    )
    parser.add_argument(
        "--sheet-index",
        type=int,
        default=None,
        help="0-based index of a single sheet to process (see --list-sheets for indices). "
             "Mutually exclusive with --sheet-name.",
    )
    parser.add_argument(
        "--sheet-name",
        type=str,
        default=None,
        help="Exact (or close) name of a single sheet to process, e.g. 'Ist New Class'. "
             "Mutually exclusive with --sheet-index.",
    )
    parser.add_argument(
        "--list-sheets",
        action="store_true",
        help="List sheet names/indices in --fee-file and exit, without generating anything.",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=Path("."),
        help="Directory to save the generated .txt file in, when a single sheet is selected "
             "via --sheet-index/--sheet-name (default: current directory).",
    )
    parser.add_argument(
        "--stdout",
        action="store_true",
        help="Print to stdout instead of saving a file, even when a single sheet is selected.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    if not args.fee_file.exists():
        print(f"File not found: {args.fee_file}", file=sys.stderr)
        return 1

    if args.list_sheets:
        return list_sheets(args.fee_file)

    if args.sheet_index is not None and args.sheet_name is not None:
        print("Use only one of --sheet-index or --sheet-name, not both.", file=sys.stderr)
        return 1

    warnings: List[str] = []
    if bcrypt is None:
        print(
            "The 'bcrypt' package is required to hash per-student passwords. "
            "Install it with: pip install bcrypt",
            file=sys.stderr,
        )
        return 1

    all_sheets = read_xlsx(args.fee_file)

    sheet_label = ""
    class_name_for_file = None
    if args.sheet_index is not None:
        try:
            name, _rows = all_sheets.by_index(args.sheet_index)
        except IndexError as exc:
            print(str(exc), file=sys.stderr)
            return 1
        all_sheets = all_sheets.filtered([name])
        sheet_label = f"[{args.sheet_index}] {name}"
        class_name_for_file = class_from_sheet_name(name) or name
    elif args.sheet_name is not None:
        try:
            name, _rows = all_sheets.by_name(args.sheet_name)
        except KeyError as exc:
            print(str(exc), file=sys.stderr)
            return 1
        all_sheets = all_sheets.filtered([name])
        sheet_label = name
        class_name_for_file = class_from_sheet_name(name) or name

    students, payments, concessions = extract_students_and_payments(
        all_sheets,
        args.academic_year,
        args.start_enrollment,
        warnings,
    )

    if class_name_for_file is not None and not args.stdout:
        args.output_dir.mkdir(parents=True, exist_ok=True)
        out_path = args.output_dir / f"{slugify_for_filename(class_name_for_file)}.txt"
        with open(out_path, "w", encoding="utf-8") as fh:
            print_insert_query(students, concessions, payments, warnings, sheet_label=sheet_label, out=fh)
        print(f"Saved: {out_path}")
    else:
        print_insert_query(students, concessions, payments, warnings, sheet_label=sheet_label)

    return 0


if __name__ == "__main__":
    raise SystemExit(main())