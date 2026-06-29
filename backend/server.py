from fastapi import FastAPI, APIRouter, HTTPException, Depends, Response, Request
from fastapi.security import HTTPBearer
from dotenv import load_dotenv
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import re
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr, model_validator
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from pymongo import ReturnDocument
import razorpay

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Secret
JWT_SECRET = os.environ.get('JWT_SECRET', 'arunoday-vidyalay-secret-key-2025')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24
ADMIN_EMAIL = os.environ.get("ADMIN_EMAIL")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD")
ADMIN_NAME = os.environ.get("ADMIN_NAME", "Admin")
RAZORPAY_KEY_ID = os.environ.get("RAZORPAY_KEY_ID")
RAZORPAY_KEY_SECRET = os.environ.get("RAZORPAY_KEY_SECRET")
razorpay_client = None
if RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET:
    razorpay_client = razorpay.Client(auth=(RAZORPAY_KEY_ID, RAZORPAY_KEY_SECRET))

# Security
security = HTTPBearer()

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Models
class Student(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    enrollment_number: str
    active: bool = True
    roll_number: str
    name: str
    email: Optional[EmailStr] = None
    password_hash: str
    class_name: str
    section: str
    phone: str
    parent_name: str
    parent_phone: str
    address: str
    bus_opted: str  # yes, no
    new_student: str
    pickup_location: str 
    distance_school: Optional[float] = Field(default=None, ge=0)
    fee_cycle: str = 'm'  # monthly
    academic_year: str
    fee_status: str = "pending"  # pending, paid
    fee_amount: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    enrollment_number: Optional[str] = None
    roll_number: str
    name: str
    email: Optional[EmailStr] = None
    password: str
    class_name: str
    section: str
    phone: str
    parent_name: str
    parent_phone: str
    address: str
    bus_opted: str  # yes, no
    new_student: str
    pickup_location: str 
    distance_school: Optional[float] = Field(default=None, ge=0)
    academic_year: str

    @model_validator(mode="after")
    def validate_bus_fields(self):
        bus_opted = str(self.bus_opted or "").strip().lower()
        pickup = str(self.pickup_location or "").strip()
        if bus_opted == "yes":
            if not pickup:
                raise ValueError("pickup_location is required when bus_opted is yes")
            if self.distance_school is None:
                raise ValueError("distance_school is required when bus_opted is yes")
        return self

class StudentUpdate(BaseModel):
    roll_number: Optional[str] = None
    email: Optional[EmailStr] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None
    bus_opted: Optional[str] = None
    pickup_location: Optional[str] = None
    distance_school: Optional[float] = Field(default=None, ge=0)
    academic_year: Optional[str] = None

class StudentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    enrollment_number: Optional[str] = None
    active: bool = True
    roll_number: str
    name: str
    email: Optional[EmailStr] = None
    class_name: str
    section: str
    phone: str
    parent_name: str
    parent_phone: str
    address: str
    bus_opted: Optional[str] = None  # yes, no
    new_student: Optional[str] = None
    pickup_location: Optional[str] = None
    distance_school: Optional[float] = None
    fee_status: Optional[str] = None
    fee_amount: Optional[float] = None
    academic_year: Optional[str] = None
    created_at: str
    updated_at: str

class ConcessionUpsertRequest(BaseModel):
    percent: int = Field(..., ge=0, le=100)
    reason: Optional[str] = None

class ConcessionStatusResponse(BaseModel):
    applied: bool
    percent: Optional[int] = None
    reason: Optional[str] = None
    applied_by: Optional[dict] = None
    applied_at: Optional[str] = None
    locked: bool = False
    year: Optional[int] = None

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: Optional[str] = None
    user_type: str
    user: dict

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    student_id: str
    new_password: str

class AdminCreateRequest(BaseModel):
    email: EmailStr
    name: str
    password: str = Field(..., min_length=6)

class AdminPasswordResetRequest(BaseModel):
    new_password: str = Field(..., min_length=6)

class AdminPublicResponse(BaseModel):
    id: str
    email: EmailStr
    name: Optional[str] = None
    is_super_admin: bool = False
    created_at: Optional[str] = None
    updated_at: Optional[str] = None

class FeePayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    amount: float
    payment_method: str = "Bank of Baroda Payment Gateway"
    transaction_id: str
    status: str = "success"
    paid_for_month: Optional[str] = None  # YYYY-MM
    breakup: Optional[dict] = None
    paid_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeePaymentCreate(BaseModel):
    amount: float
    transaction_id: str

class RazorpayOrderRequest(BaseModel):
    amount: float = Field(..., gt=0)
    currency: str = "INR"
    receipt: Optional[str] = None

class RazorpayPaymentVerificationRequest(BaseModel):
    razorpay_payment_id: str
    razorpay_order_id: str
    razorpay_signature: str
    amount: float

class OfflinePaymentRequest(BaseModel):
    receipt: str
    amount: Optional[float] = None
    paid_for_month: Optional[str] = None
    note: Optional[str] = None

class ContactForm(BaseModel):
    name: str
    email: EmailStr
    phone: str
    message: str

# Helper functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

ENROLLMENT_PREFIX = "AV"
ENROLLMENT_COUNTER_ID = "student_enrollment"

def active_student_query(extra: Optional[dict] = None) -> dict:
    query = {"active": {"$ne": False}}
    if extra:
        query.update(extra)
    return query

async def get_max_enrollment_sequence() -> int:
    students = await db.students.find(
        {"enrollment_number": {"$regex": rf"^{ENROLLMENT_PREFIX}\d+$"}},
        {"_id": 0, "enrollment_number": 1},
    ).to_list(10000)

    max_sequence = 0
    for student in students:
        enrollment_number = str(student.get("enrollment_number") or "").strip().upper()
        match = re.fullmatch(rf"{ENROLLMENT_PREFIX}(\d+)", enrollment_number)
        if match:
            max_sequence = max(max_sequence, int(match.group(1)))
    return max_sequence

async def generate_enrollment_number() -> str:
    max_existing_sequence = await get_max_enrollment_sequence()
    await db.counters.update_one(
        {"_id": ENROLLMENT_COUNTER_ID},
        {"$max": {"seq": max_existing_sequence}},
        upsert=True,
    )

    for _ in range(10):
        counter = await db.counters.find_one_and_update(
            {"_id": ENROLLMENT_COUNTER_ID},
            {"$inc": {"seq": 1}},
            return_document=ReturnDocument.AFTER,
        )
        sequence = int(counter.get("seq", 0))
        enrollment_number = f"{ENROLLMENT_PREFIX}{sequence:03d}"
        existing_student = await db.students.find_one(
            {"enrollment_number": enrollment_number},
            {"_id": 1},
        )
        if not existing_student:
            return enrollment_number

    raise HTTPException(status_code=500, detail="Failed to generate unique enrollment number")

def create_jwt_token(user_id: str, user_type: str) -> str:
    payload = {
        'user_id': user_id,
        'user_type': user_type,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

def verify_jwt_token(token: str) -> dict:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(request: Request):
    token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")
    return verify_jwt_token(token)

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

async def require_super_admin(current_user: dict = Depends(get_admin_user)):
    admin = await db.admins.find_one({"id": current_user["user_id"]}, {"_id": 0, "is_super_admin": 1})
    if not admin or not bool(admin.get("is_super_admin")):
        raise HTTPException(status_code=403, detail="Super admin access required")
    return current_user

def set_auth_cookie(response: Response, token: str) -> None:
    cookie_secure = os.environ.get("COOKIE_SECURE", "false").lower() == "true"
    cookie_samesite = os.environ.get("COOKIE_SAMESITE", "lax")
    response.set_cookie(
        key="access_token",
        value=token,
        httponly=True,
        secure=cookie_secure,
        samesite=cookie_samesite,
    )

# Initialize admin user
@app.on_event("startup")
async def startup_event():
    if not ADMIN_EMAIL or not ADMIN_PASSWORD:
        logger.warning("ADMIN_EMAIL or ADMIN_PASSWORD is missing; skipping bootstrap admin creation.")
    else:
        bootstrap_email_raw = str(ADMIN_EMAIL).strip()
        bootstrap_email = bootstrap_email_raw.lower()
        existing_admin = await db.admins.find_one(
            {"email": {"$regex": f"^{re.escape(bootstrap_email_raw)}$", "$options": "i"}},
            {"_id": 0},
        )
        if not existing_admin:
            admin_data = {
                "id": str(uuid.uuid4()),
                "email": bootstrap_email,
                "password_hash": hash_password(ADMIN_PASSWORD),
                "name": ADMIN_NAME,
                "is_super_admin": True,
                "created_at": datetime.now(timezone.utc).isoformat()
            }
            await db.admins.insert_one(admin_data)
            logger.info("Bootstrap admin user created from environment configuration.")
        else:
            # Ensure the bootstrap admin is always a super admin.
            update_fields = {}
            if existing_admin.get("email") != bootstrap_email:
                update_fields["email"] = bootstrap_email
            if not bool(existing_admin.get("is_super_admin")):
                update_fields["is_super_admin"] = True
            if update_fields:
                await db.admins.update_one(
                    {"id": existing_admin.get("id")},
                    {"$set": {**update_fields, "updated_at": datetime.now(timezone.utc).isoformat()}},
                )

    try:
        await db.students.create_index("enrollment_number", unique=True)
    except Exception as exc:
        logger.warning("Could not create unique index for enrollment_number: %s", exc)

    try:
        await db.students.create_index([("active", 1), ("id", 1)])
        await db.payments.create_index("student_id")
        await db.payments.create_index("paid_for_month")
        await db.payments.create_index("paid_at")
    except Exception as exc:
        logger.warning("Could not create one or more dashboard indexes: %s", exc)

    await db.students.update_many(
        {"active": {"$exists": False}},
        {"$set": {"active": True}},
    )

# Routes
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest, response: Response):
    # Check if admin
    email_in = str(request.email).strip()
    admin = await db.admins.find_one(
        {"email": {"$regex": f"^{re.escape(email_in)}$", "$options": "i"}},
        {"_id": 0},
    )
    if admin and verify_password(request.password, admin['password_hash']):
        token = create_jwt_token(admin['id'], 'admin')
        set_auth_cookie(response, token)

        return LoginResponse(
            user_type="admin",
            user={
                'id': admin['id'],
                'email': admin.get('email') or email_in,
                'name': admin.get('name'),
                'is_super_admin': bool(admin.get('is_super_admin')),
            }
        )

    
    # Check if student
    student = await db.students.find_one(
        active_student_query({"email": {"$regex": f"^{re.escape(email_in)}$", "$options": "i"}}),
        {"_id": 0},
    )
    if student and verify_password(request.password, student['password_hash']):
        token = create_jwt_token(student['id'], 'student')
        set_auth_cookie(response, token)
        return LoginResponse(
            user_type='student',
            user={
                'id': student['id'],
                'email': student['email'],
                'name': student['name'],
                'roll_number': student['roll_number'],
                'class_name': student['class_name']
            }
        )
    
    raise HTTPException(status_code=401, detail="Invalid credentials")


@api_router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie(
        key="access_token",
        httponly=True,
        secure=os.environ.get("COOKIE_SECURE", "false").lower() == "true",
        samesite=os.environ.get("COOKIE_SAMESITE", "lax"),
    )
    return {"message": "Logged out successfully"}

# Admin routes
@api_router.get("/admin/admins", response_model=List[AdminPublicResponse])
async def list_admins(current_user: dict = Depends(get_admin_user)):
    admins = await db.admins.find({}, {"_id": 0, "password_hash": 0}).to_list(1000)
    for a in admins:
        a["created_at"] = a["created_at"].isoformat() if isinstance(a.get("created_at"), datetime) else a.get("created_at")
        a["updated_at"] = a["updated_at"].isoformat() if isinstance(a.get("updated_at"), datetime) else a.get("updated_at")
    return admins

@api_router.post("/admin/admins", response_model=AdminPublicResponse)
async def create_admin(request: AdminCreateRequest, current_user: dict = Depends(require_super_admin)):
    email_norm = str(request.email).strip().lower()
    existing = await db.admins.find_one(
        {"email": {"$regex": f"^{re.escape(email_norm)}$", "$options": "i"}},
        {"_id": 0, "id": 1},
    )
    if existing:
        raise HTTPException(status_code=400, detail="Admin with this email already exists")

    now = datetime.now(timezone.utc).isoformat()
    admin_doc = {
        "id": str(uuid.uuid4()),
        "email": email_norm,
        "name": request.name,
        "is_super_admin": False,
        "password_hash": hash_password(request.password),
        "created_at": now,
        "updated_at": now,
    }
    await db.admins.insert_one(admin_doc)
    admin_doc.pop("password_hash", None)
    return admin_doc

@api_router.post("/admin/admins/{admin_id}/reset-password")
async def reset_admin_password(admin_id: str, request: AdminPasswordResetRequest, current_user: dict = Depends(require_super_admin)):
    admin = await db.admins.find_one({"id": admin_id}, {"_id": 0, "id": 1})
    if not admin:
        raise HTTPException(status_code=404, detail="Admin not found")

    await db.admins.update_one(
        {"id": admin_id},
        {"$set": {"password_hash": hash_password(request.new_password), "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    return {"message": "Admin password updated"}

@api_router.get("/admin/students", response_model=List[StudentResponse])
async def get_all_students(unpaid_fees: bool = False, class_name: Optional[str] = None, current_user: dict = Depends(get_admin_user)):
    current_month = month_key(datetime.now(timezone.utc))
    payments = await db.payments.find(
        payment_month_match_query(current_month),
        {"_id": 0, "student_id": 1},
    ).to_list(5000)
    paid_student_ids = {p.get("student_id") for p in payments if p.get("student_id")}

    query = active_student_query()
    # Support filtering by class name(s) passed as comma-separated values
    if class_name:
        classes = [c.strip() for c in str(class_name).split(",") if c.strip()]
        if classes:
            query["class_name"] = {"$in": classes}
    if unpaid_fees:
        if paid_student_ids:
            query["id"] = {"$nin": list(paid_student_ids)}

    students = await db.students.find(query, {"_id": 0}).to_list(1000)
    for student in students:
        student['created_at'] = student['created_at'].isoformat() if isinstance(student['created_at'], datetime) else student['created_at']
        student['updated_at'] = student['updated_at'].isoformat() if isinstance(student['updated_at'], datetime) else student['updated_at']
        if not student.get("academic_year"):
            try:
                created = student.get("created_at")
                if isinstance(created, datetime):
                    created_dt = created
                else:
                    iso_str = str(created).replace('Z', '+00:00')
                    created_dt = datetime.fromisoformat(iso_str)
            except Exception:
                created_dt = datetime.now(timezone.utc)
            student["academic_year"] = academic_year_for(created_dt)
        student["fee_status"] = "paid" if student.get("id") in paid_student_ids else "pending"
        # Populate fee_amount for dashboard: calculate only when pending to avoid overriding paid snapshots
        try:
            if student.get("fee_status") == "pending":
                fee_info = await build_fee_breakup(student, student.get("id"))
                student["fee_amount"] = float(fee_info.get("total_fee") or 0)
            else:
                student["fee_amount"] = 0.0
        except Exception:
            # On error, leave fee_amount as-is or set to 0
            student["fee_amount"] = float(student.get("fee_amount") or 0)
    return students


@api_router.get("/admin/overview", response_model=dict)
async def get_admin_overview(current_user: dict = Depends(get_admin_user)):
    current_month = month_key(datetime.now(timezone.utc))

    total_students = await db.students.count_documents(active_student_query())

    paid_ids = await db.payments.distinct("student_id", payment_month_match_query(current_month))
    paid_ids = [student_id for student_id in paid_ids if student_id]
    paid_students = 0
    if paid_ids:
        paid_students = await db.students.count_documents(active_student_query({"id": {"$in": paid_ids}}))

    pending_students = max(total_students - paid_students, 0)

    recent_pipeline = [
        {
            "$addFields": {
                "sort_paid_at": {
                    "$cond": [
                        {"$eq": [{"$type": "$paid_at"}, "date"]},
                        "$paid_at",
                        {
                            "$dateFromString": {
                                "dateString": "$paid_at",
                                "onError": datetime(1970, 1, 1, tzinfo=timezone.utc),
                                "onNull": datetime(1970, 1, 1, tzinfo=timezone.utc),
                            }
                        },
                    ]
                }
            }
        },
        {"$sort": {"sort_paid_at": -1}},
        {"$limit": 5},
        {
            "$project": {
                "_id": 0,
                "id": 1,
                "transaction_id": 1,
                "amount": 1,
                "status": 1,
                "paid_at": 1,
                "payment_method": 1,
            }
        },
    ]

    recent_payments = await db.payments.aggregate(recent_pipeline).to_list(5)
    for payment in recent_payments:
        paid_at = payment.get("paid_at")
        if isinstance(paid_at, datetime):
            payment["paid_at"] = paid_at.isoformat()

    return {
        "stats": {
            "total": total_students,
            "feePaid": paid_students,
            "feePending": pending_students,
        },
        "recentPayments": recent_payments,
    }

@api_router.post("/admin/students", response_model=StudentResponse)
async def create_student(student_data: StudentCreate, current_user: dict = Depends(get_admin_user)):

    conditions = []
    if not student_data.academic_year or not student_data.academic_year.strip():
        raise HTTPException(status_code=400, detail="Academic year is required")

    # check email only if provided
    if student_data.email not in [None, ""]:
        conditions.append({"email": student_data.email})

    # check roll number only if provided
    if student_data.roll_number not in [None, ""]:
        conditions.append({"roll_number": student_data.roll_number})

    # run query only if any field exists
    if conditions:
        existing = await db.students.find_one(
            active_student_query({"$or": conditions}),
            {"_id": 0}
        )

        if existing:
            raise HTTPException(
                status_code=400,
                detail="Email or roll number already exists"
            )

    enrollment_number = await generate_enrollment_number()
    
    student = Student(
        enrollment_number=enrollment_number,
        roll_number=student_data.roll_number,
        name=student_data.name,
        email=student_data.email,
        password_hash=hash_password(student_data.password),
        class_name=student_data.class_name,
        section=student_data.section,
        phone=student_data.phone,
        parent_name=student_data.parent_name,
        parent_phone=student_data.parent_phone,
        address=student_data.address,
        bus_opted=student_data.bus_opted,
        new_student=student_data.new_student,
        pickup_location=student_data.pickup_location,
        distance_school=student_data.distance_school,
        academic_year=(student_data.academic_year or academic_year_for(datetime.now(timezone.utc))),
    )
    
    doc = student.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.students.insert_one(doc)
    return StudentResponse(**doc)

@api_router.put("/admin/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student_data: StudentUpdate, current_user: dict = Depends(get_admin_user)):
    student = await db.students.find_one(active_student_query({"id": student_id}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_data.model_dump(exclude_unset=True)
    if "academic_year" in update_data:
        if not update_data["academic_year"] or not str(update_data["academic_year"]).strip():
            raise HTTPException(status_code=400, detail="Academic year is required")

    # If bus service is opted (either already or being updated to yes), pickup location and distance are mandatory.
    merged = {**student, **update_data}
    bus_opted = str(merged.get("bus_opted") or "").strip().lower()
    if bus_opted == "yes":
        pickup = str(merged.get("pickup_location") or "").strip()
        if not pickup:
            raise HTTPException(status_code=400, detail="Pickup location is required when bus service is opted")
        if merged.get("distance_school") is None:
            raise HTTPException(status_code=400, detail="Distance from school is required when bus service is opted")
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.students.update_one(active_student_query({"id": student_id}), {"$set": update_data})
    
    updated_student = await db.students.find_one(active_student_query({"id": student_id}), {"_id": 0})
    return StudentResponse(**updated_student)

@api_router.delete("/admin/students/{student_id}")
async def deactivate_student(student_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.students.update_one(
        active_student_query({"id": student_id}),
        {"$set": {"active": False, "updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    if result.matched_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deactivated successfully"}

@api_router.post("/admin/students/{student_id}/reset-password")
async def reset_student_password(student_id: str, request: PasswordResetRequest, current_user: dict = Depends(get_admin_user)):
    student = await db.students.find_one(active_student_query({"id": student_id}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    new_hash = hash_password(request.new_password)
    await db.students.update_one(
        active_student_query({"id": student_id}),
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Password reset successfully"}

@api_router.get("/admin/students/{student_id}/concession", response_model=ConcessionStatusResponse)
async def get_student_concession(student_id: str, current_user: dict = Depends(get_admin_user)):
    student = await db.students.find_one(active_student_query({"id": student_id}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    concession = await db.concessions.find_one({"student_id": student_id}, {"_id": 0})
    if not concession or concession.get("percent") is None:
        return ConcessionStatusResponse(applied=False)

    now_year = datetime.now(timezone.utc).year
    concession_year = concession.get("year")
    return ConcessionStatusResponse(
        applied=True,
        percent=int(concession["percent"]),
        reason=concession.get("reason"),
        applied_by=concession.get("applied_by"),
        applied_at=concession.get("applied_at"),
        locked=bool(concession_year == now_year),
        year=concession_year,
    )

@api_router.put("/admin/students/{student_id}/concession", response_model=ConcessionStatusResponse)
async def upsert_student_concession(
    student_id: str,
    payload: ConcessionUpsertRequest,
    current_user: dict = Depends(get_admin_user),
):
    student = await db.students.find_one(active_student_query({"id": student_id}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    if payload.percent not in (25, 50, 75, 100):
        raise HTTPException(status_code=400, detail="Concession percent must be 25, 50, 75, or 100")

    reason = payload.reason.strip().lower() if isinstance(payload.reason, str) else None
    if reason not in (None, "", "sibling", "staff", "government sponsored"):
        raise HTTPException(status_code=400, detail="Invalid concession reason")

    now_year = datetime.now(timezone.utc).year
    existing_concession = await db.concessions.find_one({"student_id": student_id}, {"_id": 0})
    if (
        existing_concession
        and existing_concession.get("percent") is not None
        and existing_concession.get("year") == now_year
    ):
        raise HTTPException(status_code=400, detail="Concession already applied for this year and cannot be changed")

    now = datetime.now(timezone.utc).isoformat()
    admin = await db.admins.find_one({"id": current_user["user_id"]}, {"_id": 0, "id": 1, "name": 1, "email": 1})
    applied_by = None
    if admin:
        applied_by = {"admin_id": admin.get("id"), "name": admin.get("name"), "email": admin.get("email")}

    await db.concessions.update_one(
        {"student_id": student_id},
        {
            "$set": {
                "student_id": student_id,
                "percent": int(payload.percent),
                "reason": (reason or None),
                "year": now_year,
                "applied_by": applied_by,
                "applied_at": now,
                "updated_at": now,
            },
            "$setOnInsert": {"id": str(uuid.uuid4()), "created_at": now},
        },
        upsert=True,
    )

    return ConcessionStatusResponse(
        applied=True,
        percent=int(payload.percent),
        reason=(reason or None),
        applied_by=applied_by,
        applied_at=now,
        locked=True,
        year=now_year,
    )

@api_router.delete("/admin/students/{student_id}/concession", response_model=ConcessionStatusResponse)
async def delete_student_concession(student_id: str, current_user: dict = Depends(get_admin_user)):
    student = await db.students.find_one(active_student_query({"id": student_id}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    now_year = datetime.now(timezone.utc).year
    existing_concession = await db.concessions.find_one({"student_id": student_id}, {"_id": 0})
    if existing_concession and existing_concession.get("percent") is not None and existing_concession.get("year") == now_year:
        raise HTTPException(status_code=400, detail="Concession already applied for this year and cannot be changed")

    await db.concessions.delete_one({"student_id": student_id})
    return ConcessionStatusResponse(applied=False)

@api_router.get("/admin/payments", response_model=List[dict])
async def get_all_payments(class_name: Optional[str] = None, month: Optional[str] = None, current_user: dict = Depends(get_admin_user)):
    # Build query parts
    query_parts = []

    # Month filter
    if month:
        months = []
        seen = set()
        for month_token in str(month).split(","):
            month_value = month_token.strip()
            if not month_value or month_value in seen:
                continue
            seen.add(month_value)
            months.append(month_value)

        if months:
            # payment_month_match_query returns an OR clause for each month
            month_or_clauses = []
            for month_value in months:
                month_query = payment_month_match_query(month_value)
                if isinstance(month_query, dict) and isinstance(month_query.get("$or"), list):
                    month_or_clauses.extend(month_query["$or"])
                else:
                    month_or_clauses.append(month_query)
            if month_or_clauses:
                query_parts.append({"$or": month_or_clauses})

    # Class filter: resolve student ids for the given class(es)
    if class_name:
        classes = [c.strip() for c in str(class_name).split(",") if c.strip()]
        if classes:
            students_cursor = await db.students.find({**active_student_query(), "class_name": {"$in": classes}}, {"_id": 0, "id": 1}).to_list(2000)
            student_ids = [s.get("id") for s in students_cursor if s.get("id")]
            if not student_ids:
                return []
            query_parts.append({"student_id": {"$in": student_ids}})

    # Combine query parts
    if len(query_parts) == 0:
        final_query = {}
    elif len(query_parts) == 1:
        final_query = query_parts[0]
    else:
        final_query = {"$and": query_parts}

    payments = await db.payments.find(final_query, {"_id": 0}).to_list(1000)
    for payment in payments:
        payment['paid_at'] = payment['paid_at'].isoformat() if isinstance(payment['paid_at'], datetime) else payment['paid_at']
    return payments


@api_router.post("/admin/students/{student_id}/mark-paid", response_model=dict)
async def mark_student_paid_offline(student_id: str, request: OfflinePaymentRequest, current_user: dict = Depends(get_admin_user)):
    # Admins can mark a student's fees as paid using an offline receipt number.
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    # Determine target month
    now = datetime.now(timezone.utc)
    target_month = request.paid_for_month or month_key(now)

    # Prevent duplicate payments for the same month
    existing_payment = await db.payments.find_one(
        {"student_id": student_id, **payment_month_match_query(target_month)},
        {"_id": 0, "id": 1},
    )
    if existing_payment:
        raise HTTPException(status_code=400, detail="Fee already paid for this month")

    # Build fee breakup and amount
    fee = await build_fee_breakup(student, student_id)
    payable = float(fee.get("total_fee") or 0)
    if payable <= 0:
        raise HTTPException(status_code=400, detail="Invalid payable amount")

    if request.amount is not None and abs(request.amount - payable) > 0.01:
        raise HTTPException(status_code=400, detail="Amount mismatch")

    # Record payment with offline mode
    payment = FeePayment(
        student_id=student_id,
        amount=payable,
        payment_method="Offline",
        transaction_id=request.receipt,
        paid_for_month=target_month,
        breakup=fee.get("breakup"),
        status="success",
    )

    doc = payment.model_dump()
    doc["paid_at"] = doc["paid_at"].isoformat()
    doc["payment_gateway"] = "offline"
    # Record admin who marked the payment
    admin = await db.admins.find_one({"id": current_user.get("user_id")}, {"_id": 0, "id": 1, "name": 1, "email": 1})
    admin_meta = None
    if admin:
        admin_meta = {"admin_id": admin.get("id"), "name": admin.get("name"), "email": admin.get("email")}
    else:
        admin_meta = {"admin_id": current_user.get("user_id")}
    doc["admin_marked_by"] = admin_meta
    if request.note:
        doc["note"] = request.note

    await db.payments.insert_one(doc)
    await db.students.update_one(
        {"id": student_id},
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"message": "Offline payment recorded", "payment_id": payment.id, "admin_marked_by": admin_meta}

# Student routes
@api_router.get("/student/profile", response_model=StudentResponse)
async def get_student_profile(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    
    student = await db.students.find_one(active_student_query({"id": current_user['user_id']}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student['created_at'] = student['created_at'].isoformat() if isinstance(student['created_at'], datetime) else student['created_at']
    student['updated_at'] = student['updated_at'].isoformat() if isinstance(student['updated_at'], datetime) else student['updated_at']
    if not student.get("academic_year"):
        try:
            created = student.get("created_at")
            if isinstance(created, datetime):
                created_dt = created
            else:
                iso_str = str(created).replace('Z', '+00:00')
                created_dt = datetime.fromisoformat(iso_str)
        except Exception:
            created_dt = datetime.now(timezone.utc)
        student["academic_year"] = academic_year_for(created_dt)

    # Month-based fee status: paid only if a payment exists for the current month.
    current_month = month_key(datetime.now(timezone.utc))
    payment = await db.payments.find_one(
        {"student_id": current_user['user_id'], **payment_month_match_query(current_month)},
        {"_id": 0, "id": 1},
    )
    student["fee_status"] = "paid" if payment else "pending"
    # Populate fee_amount for the profile view
    try:
        if student.get("fee_status") == "pending":
            fee_info = await build_fee_breakup(student, student.get("id"))
            student["fee_amount"] = float(fee_info.get("total_fee") or 0)
        else:
            student["fee_amount"] = 0.0
    except Exception:
        student["fee_amount"] = float(student.get("fee_amount") or 0)

    return StudentResponse(**student)

@api_router.post("/razorpay/create-order")
async def create_razorpay_order(order_request: RazorpayOrderRequest, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    if razorpay_client is None:
        raise HTTPException(status_code=500, detail="Razorpay not configured")

    student = await db.students.find_one(active_student_query({"id": current_user['user_id']}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    now = datetime.now(timezone.utc)
    current_month = month_key(now)
    existing_payment = await db.payments.find_one(
        {"student_id": current_user['user_id'], **payment_month_match_query(current_month)},
        {"_id": 0, "id": 1},
    )
    if existing_payment:
        raise HTTPException(status_code=400, detail="Fee already paid for this month")

    fee = await build_fee_breakup(student, current_user['user_id'])
    payable = float(fee.get("total_fee") or 0)
    if payable <= 0:
        raise HTTPException(status_code=400, detail="Invalid payable amount")
    if abs(order_request.amount - payable) > 0.01:
        raise HTTPException(status_code=400, detail="Amount mismatch")

    receipt = (order_request.receipt or f"fee_{current_user['user_id'][:8]}_{uuid.uuid4().hex[:8]}").strip()
    if len(receipt) > 40:
        receipt = receipt[:40]

    order_data = {
        "amount": int(round(payable * 100)),
        "currency": "INR",
        "receipt": receipt,
        "payment_capture": 1,
    }
    try:
        order = razorpay_client.order.create(order_data)
    except Exception as exc:
        logger.exception("Razorpay order creation failed for student %s", current_user['user_id'])
        raise HTTPException(status_code=500, detail=f"Razorpay order creation failed: {str(exc)}")

    return {
        "id": order["id"],
        "amount": order["amount"],
        "currency": order["currency"],
        "receipt": order["receipt"],
        "status": order["status"],
        "key_id": RAZORPAY_KEY_ID,
    }

@api_router.post("/razorpay/verify")
async def verify_razorpay_payment(request: RazorpayPaymentVerificationRequest, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    if razorpay_client is None:
        raise HTTPException(status_code=500, detail="Razorpay not configured")

    student = await db.students.find_one(active_student_query({"id": current_user['user_id']}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")

    now = datetime.now(timezone.utc)
    current_month = month_key(now)
    existing_payment = await db.payments.find_one(
        {"student_id": current_user['user_id'], **payment_month_match_query(current_month)},
        {"_id": 0, "id": 1},
    )
    if existing_payment:
        raise HTTPException(status_code=400, detail="Fee already paid for this month")

    try:
        razorpay_client.utility.verify_payment_signature({
            "razorpay_order_id": request.razorpay_order_id,
            "razorpay_payment_id": request.razorpay_payment_id,
            "razorpay_signature": request.razorpay_signature,
        })
    except Exception as exc:
        logger.exception("Razorpay signature verification failed for student %s", current_user['user_id'])
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    fee = await build_fee_breakup(student, current_user['user_id'])
    payable = float(fee.get("total_fee") or 0)
    if abs(request.amount - payable) > 0.01:
        raise HTTPException(status_code=400, detail="Amount mismatch")

    payment = FeePayment(
        student_id=current_user['user_id'],
        amount=payable,
        payment_method="Razorpay",
        transaction_id=request.razorpay_payment_id,
        paid_for_month=current_month,
        breakup=fee.get("breakup"),
    )
    doc = payment.model_dump()
    doc["payment_gateway"] = "Razorpay"
    doc["razorpay_order_id"] = request.razorpay_order_id
    doc["razorpay_signature"] = request.razorpay_signature
    doc["paid_at"] = doc["paid_at"].isoformat()

    await db.payments.insert_one(doc)
    await db.students.update_one(
        active_student_query({"id": current_user['user_id']}),
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )

    return {"message": "Fee payment successful", "payment_id": payment.id, "breakup": fee.get("breakup")}

@api_router.post("/student/change-password")
async def change_password(request: PasswordChangeRequest, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    
    student = await db.students.find_one(active_student_query({"id": current_user['user_id']}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if not verify_password(request.old_password, student['password_hash']):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    new_hash = hash_password(request.new_password)
    await db.students.update_one(
        active_student_query({"id": current_user['user_id']}),
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Password changed successfully"}

@api_router.post("/student/pay-fee", response_model=dict)
async def pay_fee(payment_data: FeePaymentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    
    student = await db.students.find_one(active_student_query({"id": current_user['user_id']}), {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    # Month-based payment: allow paying again in future months, but block duplicates in the same month.
    now = datetime.now(timezone.utc)
    current_month = month_key(now)
    existing_payment = await db.payments.find_one(
        {"student_id": current_user["user_id"], **payment_month_match_query(current_month)},
        {"_id": 0, "id": 1},
    )
    if existing_payment:
        raise HTTPException(status_code=400, detail="Fee already paid for this month")

    fee = await build_fee_breakup(student, current_user["user_id"])
    payable = float(fee.get("total_fee") or 0)
    requested = float(payment_data.amount or 0)
    if payable <= 0:
        raise HTTPException(status_code=400, detail="Invalid payable amount")
    if abs(requested - payable) > 0.01:
        raise HTTPException(status_code=400, detail="Amount mismatch")
    
    payment = FeePayment(
        student_id=current_user['user_id'],
        amount=payable,
        transaction_id=payment_data.transaction_id,
        paid_for_month=current_month,
        breakup=fee.get("breakup"),
    )
    
    doc = payment.model_dump()
    doc['paid_at'] = doc['paid_at'].isoformat()
    
    await db.payments.insert_one(doc)
    # Don't persist a sticky fee_status; fee status is month-based and computed from payments.
    await db.students.update_one(
        active_student_query({"id": current_user["user_id"]}),
        {"$set": {"updated_at": datetime.now(timezone.utc).isoformat()}},
    )
    
    return {"message": "Fee payment successful", "payment_id": payment.id, "breakup": fee.get("breakup")}

@api_router.get("/student/payments", response_model=List[dict])
async def get_student_payments(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")

    student = await db.students.find_one(active_student_query({"id": current_user['user_id']}), {"_id": 0, "id": 1})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    payments = await db.payments.find({"student_id": current_user['user_id']}, {"_id": 0}).to_list(100)
    for payment in payments:
        payment['paid_at'] = payment['paid_at'].isoformat() if isinstance(payment['paid_at'], datetime) else payment['paid_at']
    return payments

# Public routes
@api_router.post("/contact")
async def contact_form(form: ContactForm):
    doc = form.model_dump()
    doc['id'] = str(uuid.uuid4())
    doc['created_at'] = datetime.now(timezone.utc).isoformat()
    await db.contacts.insert_one(doc)
    return {"message": "Thank you for contacting us. We will get back to you soon."}

# Include the router in the main app
app.include_router(api_router)

origins = os.environ.get("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=[o.strip() for o in origins],
    allow_methods=["*"],
    allow_headers=["*"],
)


# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

def is_within_academic_year(date_to_check: datetime) -> bool:
    # Current academic year: April -> March.
    now = datetime.now(timezone.utc)
    start_year = now.year if now.month >= 4 else now.year - 1
    start = datetime(start_year, 4, 1, tzinfo=timezone.utc)
    end = datetime(start_year + 1, 3, 31, 23, 59, 59, tzinfo=timezone.utc)
    return start <= date_to_check <= end

def academic_year_for(date_to_check: datetime) -> str:
    # Indian academic year: April -> March.
    year = date_to_check.year
    if date_to_check.month >= 4:
        start_year = year
        end_year = year + 1
    else:
        start_year = year - 1
        end_year = year
    return f"{start_year}-{str(end_year)[-2:]}"

def academic_year_start(academic_year: Optional[str]) -> Optional[datetime]:
    if not academic_year:
        return None
    try:
        start_year = int(str(academic_year).split("-")[0])
    except Exception:
        return None
    return datetime(start_year, 4, 1, tzinfo=timezone.utc)

def month_start(dt: datetime) -> datetime:
    return datetime(dt.year, dt.month, 1, tzinfo=dt.tzinfo or timezone.utc)

def add_months(dt: datetime, months: int) -> datetime:
    total_months = (dt.year * 12 + (dt.month - 1)) + months
    year = total_months // 12
    month = (total_months % 12) + 1
    return datetime(year, month, 1, tzinfo=dt.tzinfo or timezone.utc)

def month_key(dt: datetime) -> str:
    return f"{dt.year:04d}-{dt.month:02d}"

def payment_month_match_query(month: str) -> dict:
    # Supports:
    # - New docs: explicit paid_for_month="YYYY-MM"
    # - Older docs: paid_at stored as an ISO string (prefix match)
    # - Some older docs: paid_at stored as a datetime (range match)
    start = end = None
    try:
        y, m = month.split("-", 1)
        year = int(y)
        mon = int(m)
        start = datetime(year, mon, 1, tzinfo=timezone.utc)
        end = datetime(year + (1 if mon == 12 else 0), 1 if mon == 12 else mon + 1, 1, tzinfo=timezone.utc)
    except Exception:
        pass

    ors = [
        {"paid_for_month": month},
        {"paid_for_month": {"$exists": False}, "paid_at": {"$regex": f"^{month}"}},
    ]
    if start and end:
        ors.append({"paid_for_month": {"$exists": False}, "paid_at": {"$gte": start, "$lt": end}})

    return {"$or": ors}

def months_between(a: datetime, b: datetime) -> int:
    # Number of whole month boundaries between a and b (both expected at month starts).
    return (b.year - a.year) * 12 + (b.month - a.month)

def payment_month_value(payment: dict) -> Optional[datetime]:
    paid_for_month = str(payment.get("paid_for_month") or "").strip()
    if re.fullmatch(r"\d{4}-\d{2}", paid_for_month):
        try:
            year, month = paid_for_month.split("-", 1)
            return datetime(int(year), int(month), 1, tzinfo=timezone.utc)
        except Exception:
            pass

    paid_at = payment.get("paid_at")
    try:
        if isinstance(paid_at, datetime):
            return month_start(paid_at)
        if isinstance(paid_at, str) and paid_at:
            # Handle ISO 8601 with Z suffix
            iso_str = paid_at.replace('Z', '+00:00')
            return month_start(datetime.fromisoformat(iso_str))
    except Exception:
        return None
    return None

def payment_breakup_sum(payment: dict) -> dict:
    breakup = payment.get("breakup") or {}
    sum_items = breakup.get("sum") or {}
    return sum_items if isinstance(sum_items, dict) else {}

def payment_breakup_subs(payment: dict) -> dict:
    breakup = payment.get("breakup") or {}
    subs_items = breakup.get("subs") or {}
    return subs_items if isinstance(subs_items, dict) else {}

def parse_bool(value) -> bool:
    if isinstance(value, bool):
        return value
    return str(value or "").strip().lower() in {"1", "true", "yes", "y", "on"}

async def build_paid_fee_summary(student: dict, student_id: str) -> dict:
    created_raw = student.get("created_at")
    try:
        if isinstance(created_raw, datetime):
            created_at = created_raw
        else:
            iso_str = str(created_raw).replace('Z', '+00:00')
            created_at = datetime.fromisoformat(iso_str)
    except Exception:
        created_at = datetime.now(timezone.utc)

    current_month = month_start(datetime.now(timezone.utc))
    join_month = month_start(created_at)
    academic_start = academic_year_start(student.get("academic_year"))
    base_due_month = academic_start or join_month
    if base_due_month < join_month:
        base_due_month = join_month

    payments = await db.payments.find(
        {"student_id": student_id},
        {"_id": 0, "paid_for_month": 1, "paid_at": 1, "status": 1, "amount": 1, "breakup": 1},
    ).to_list(1000)

    sum_items = {
        "admission_fee": 0.0,
        "annual_fee": 0.0,
        "tuition_fee": 0.0,
        "bus_fee": 0.0,
        "late_fee": 0.0,
        "caution_money": 0.0,
        "other_fee": 0.0,
    }
    subs_items = {
        "concession": 0.0,
    }

    for payment in payments:
        if str(payment.get("status") or "success").lower() != "success":
            continue

        payment_month = payment_month_value(payment)
        if payment_month is None or payment_month < base_due_month or payment_month > current_month:
            continue

        breakup_sum = payment_breakup_sum(payment)
        breakup_subs = payment_breakup_subs(payment)

        if breakup_sum:
            for key, raw_value in breakup_sum.items():
                try:
                    amount = float(raw_value or 0)
                except Exception:
                    amount = 0.0
                if key in sum_items:
                    sum_items[key] += amount
                else:
                    sum_items["other_fee"] += amount
        else:
            try:
                sum_items["other_fee"] += float(payment.get("amount") or 0)
            except Exception:
                pass

        for key, raw_value in breakup_subs.items():
            try:
                amount = float(raw_value or 0)
            except Exception:
                amount = 0.0
            if key in subs_items:
                subs_items[key] += amount

    sum_items = {key: round(value, 2) for key, value in sum_items.items()}
    subs_items = {key: round(value, 2) for key, value in subs_items.items()}
    total_paid = round(sum(sum_items.values()) - sum(subs_items.values()), 2)

    return {
        "total_paid": total_paid,
        "tuition_fee": sum_items["tuition_fee"],
        "bus_fee": sum_items["bus_fee"],
        "annual_fee": sum_items["annual_fee"],
        "admission_fee": sum_items["admission_fee"],
        "late_fee": sum_items["late_fee"],
        "caution_money": sum_items["caution_money"],
        "concession": subs_items["concession"],
        "concession_percent": None,
        "concession_reason": None,
        "breakup": {
            "sum": sum_items,
            "subs": subs_items,
            "total": total_paid,
            "meta": {
                "period": {
                    "from": month_key(base_due_month),
                    "to": month_key(current_month),
                },
            },
        },
    }

def calculate_late_fee(base_due_date: datetime, now: datetime) -> float:
    # Late fee is disabled for April, May, and June.
    # From July onwards the normal late fee rules apply.
    if now.month in (4, 5, 6):
        return 0.0

    # Rules:
    # - If not paid till 10th of the current month: +50.
    # - For each fully missed month before the current month: +100 per month.
    base_month = month_start(base_due_date)
    current_month = month_start(now)
    if current_month < base_month:
        return 0.0

    missed_full_months = max(0, months_between(base_month, current_month))
    late_fee = missed_full_months * 100.0
    if now.day > 10:
        late_fee += 50.0
    return late_fee

async def build_fee_breakup(student: dict, student_id: str) -> dict:
    admission = 0
    caution = 0

    created_raw = student.get("created_at")
    try:
        if isinstance(created_raw, datetime):
            created_at = created_raw
        else:
            # Handle ISO 8601 with Z suffix (replace Z with +00:00)
            iso_str = str(created_raw).replace('Z', '+00:00')
            created_at = datetime.fromisoformat(iso_str)
    except Exception:
        created_at = datetime.now(timezone.utc)

    total = 0.0
    now = datetime.now(timezone.utc)
    current_month = month_start(now)
    join_month = month_start(created_at)
    academic_start = academic_year_start(student.get("academic_year"))
    base_due_month = academic_start or join_month
    if base_due_month < join_month:
        base_due_month = join_month

    payments = await db.payments.find(
        {"student_id": student_id},
        {"_id": 0, "paid_for_month": 1, "paid_at": 1, "status": 1, "breakup": 1},
    ).to_list(1000)
    paid_months = {
        payment_month
        for payment in payments
        if (payment_month := payment_month_value(payment)) is not None
    }

    due_month_list = []
    cursor_month = base_due_month
    while cursor_month <= current_month:
        if cursor_month not in paid_months:
            due_month_list.append(cursor_month)
        cursor_month = add_months(cursor_month, 1)

    oldest_unpaid_month = due_month_list[0] if due_month_list else current_month
    due_months = len(due_month_list)

    if student.get("new_student") == 'yes' and is_within_academic_year(created_at):
        admission_paid = any(
            float(payment_breakup_sum(payment).get("admission_fee", 0) or 0) > 0
            for payment in payments
            if str(payment.get("status") or "success").lower() == "success"
        )
        if not admission_paid:
            admission = 1000
        total += admission

    annual_paid = False
    academic_year_end = add_months(base_due_month, 12) if base_due_month else None
    for payment in payments:
        if str(payment.get("status") or "success").lower() != "success":
            continue
        payment_month = payment_month_value(payment)
        if payment_month is None:
            continue
        if academic_year_end and not (base_due_month <= payment_month < academic_year_end):
            continue
        if float(payment_breakup_sum(payment).get("annual_fee", 0) or 0) > 0:
            annual_paid = True
            break

    annual = 0 if annual_paid else 1000
    total += annual

    class_name = student.get("class_name")
    if class_name == "Nursery":
        tuition = 800
    elif class_name == "LKG":
        tuition = 850
    elif class_name == "UKG":
        tuition = 900
    elif class_name == "1":
        tuition = 1000
    elif class_name == "2":
        tuition = 1100
    elif class_name == "3":
        tuition = 1200
    elif class_name == "4":
        tuition = 1300
    elif class_name == "5":
        tuition = 1400
    elif class_name == "6":
        tuition = 1500
    elif class_name == "7":
        tuition = 1600
    else:
        tuition = 0

    tuition_total = tuition * due_months
    total += tuition_total

    bus_opted = str(student.get("bus_opted") or "").strip().lower()
    distance = student.get("distance_school")
    try:
        distance = max(0.0, float(distance))
    except Exception:
        distance = 0.0

    # Bus fee applies only when the student has opted for bus service.
    # June is waived only for the June month, not for the entire pending range.
    if bus_opted != "yes" or distance <= 0:
        bus_fee_total = 0.0
    else:
        if distance < 2.5:
            bus_fee = 600
        elif distance < 5:
            bus_fee = 800
        elif distance < 7.5:
            bus_fee = 1000
        elif distance < 10:
            bus_fee = 1200
        else:
            bus_fee = 1400

        bus_fee_total = 0.0
        for due_month in due_month_list:
            if due_month.month != 6:
                bus_fee_total += bus_fee
        bus_fee_total = round(bus_fee_total, 2)

    total += bus_fee_total

    # Late fee: monthly fine based on current date when unpaid.
    late_fee = calculate_late_fee(oldest_unpaid_month, now) if due_months > 0 else 0.0
    total += late_fee

    try:
        if int(class_name) >= 6:
            caution = 1000
            total += caution
    except Exception:
        pass

    concession = await db.concessions.find_one({"student_id": student_id}, {"_id": 0})
    concession_amount = 0.0
    concession_percent = 0.0
    concession_meta = None
    if concession:
        if concession.get("percent") is not None:
            concession_percent = float(concession.get("percent") or 0)
            concession_base = tuition_total 
            concession_amount = round((concession_base * concession_percent) / 100.0, 2)
        else:
            concession_amount = float(concession.get("amount", 0) or 0)

    sum_items = {
        "admission_fee": float(admission),
        "annual_fee": float(annual),
        "tuition_fee": float(tuition_total),
        "bus_fee": float(bus_fee_total),
        "late_fee": float(late_fee),
        "caution_money": float(caution),
    }
    subs_items = {}
    if concession_amount:
        subs_items["concession"] = float(concession_amount)
        concession_meta = {
            "percent": float(concession_percent or 0),
            "reason": concession.get("reason") if concession else None,
            "applied_by": concession.get("applied_by") if concession else None,
            "applied_at": concession.get("applied_at") if concession else None,
        }

    total_fee = round(sum(sum_items.values()) - sum(subs_items.values()), 2)

    return {
        "total_fee": total_fee,
        "tuition_fee": tuition_total,
        "bus_fee": bus_fee_total,
        "annual_fee": annual,
        "admission_fee": admission,
        "late_fee": late_fee,
        "caution_money": caution,
        "concession": concession_amount,
        "concession_percent": concession_percent or None,
        "concession_reason": concession.get("reason") if concession else None,
        "breakup": {
            "sum": sum_items,
            "subs": subs_items,
            "total": total_fee,
            "meta": {
                **({"concession": concession_meta} if concession_meta else {}),
            },
        },
    }


@app.post("/api/fees/calculate")
async def calculate_fee(student: dict):

    student_id = student.get("id") or student.get("_id")
    if not student_id:
        raise HTTPException(status_code=400, detail="Missing student id")

    student_doc = await db.students.find_one(active_student_query({"id": student_id}), {"_id": 0})
    if not student_doc:
        raise HTTPException(status_code=404, detail="Student not found")

    include_paid_summary = parse_bool(student.get("include_paid_summary"))

    # -------- Check existing payment (current month) --------
    current_month = month_key(datetime.now(timezone.utc))
    payment = await db.payments.find_one(
        {"student_id": student_id, **payment_month_match_query(current_month)},
        {"_id": 0},
    )

    if payment:
        if isinstance(payment.get("paid_at"), datetime):
            payment["paid_at"] = payment["paid_at"].isoformat()

        breakup = payment.get("breakup") or {}
        sum_items = breakup.get("sum") or {}
        subs_items = breakup.get("subs") or {}
        meta = breakup.get("meta") or {}
        concession_meta = meta.get("concession") or {}

        response = {
            "message": "Payment already exists",
            "payment": payment,
            "total_fee": 0,
            "tuition_fee": float(sum_items.get("tuition_fee", 0)),
            "bus_fee": float(sum_items.get("bus_fee", 0)),
            "annual_fee": float(sum_items.get("annual_fee", 0)),
            "admission_fee": float(sum_items.get("admission_fee", 0)),
            "late_fee": float(sum_items.get("late_fee", 0)),
            "caution_money": float(sum_items.get("caution_money", 0)),
            "concession": float(subs_items.get("concession", 0)),
            "concession_percent": concession_meta.get("percent") if concession_meta else None,
            "concession_reason": concession_meta.get("reason") if concession_meta else None,
            "breakup": breakup,
        }
        if include_paid_summary:
            response["paid_summary"] = await build_paid_fee_summary(student_doc, student_id)
        return response
    fee_breakup = await build_fee_breakup(student_doc, student_id)
    if include_paid_summary:
        fee_breakup["paid_summary"] = await build_paid_fee_summary(student_doc, student_id)
    return fee_breakup
    
async def calculate_concession(student):
    # fetch data from concessions collection
    concession = 0
    concession_data = await db.concessions.find({'student_id':student.get('id')}).to_list(100)

    # apply discount in fees portion 


    return concession
