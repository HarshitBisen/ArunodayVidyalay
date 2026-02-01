from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt

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
    roll_number: str
    name: str
    email: EmailStr
    password_hash: str
    class_name: str
    section: str
    phone: str
    parent_name: str
    parent_phone: str
    address: str
    fee_status: str = "pending"  # pending, paid
    fee_amount: float = 0.0
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class StudentCreate(BaseModel):
    roll_number: str
    name: str
    email: EmailStr
    password: str
    class_name: str
    section: str
    phone: str
    parent_name: str
    parent_phone: str
    address: str
    fee_amount: float

class StudentUpdate(BaseModel):
    roll_number: Optional[str] = None
    name: Optional[str] = None
    email: Optional[EmailStr] = None
    class_name: Optional[str] = None
    section: Optional[str] = None
    phone: Optional[str] = None
    parent_name: Optional[str] = None
    parent_phone: Optional[str] = None
    address: Optional[str] = None
    fee_amount: Optional[float] = None

class StudentResponse(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str
    roll_number: str
    name: str
    email: str
    class_name: str
    section: str
    phone: str
    parent_name: str
    parent_phone: str
    address: str
    fee_status: str
    fee_amount: float
    created_at: str
    updated_at: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class LoginResponse(BaseModel):
    token: str
    user_type: str
    user: dict

class PasswordChangeRequest(BaseModel):
    old_password: str
    new_password: str

class PasswordResetRequest(BaseModel):
    student_id: str
    new_password: str

class FeePayment(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    amount: float
    payment_method: str = "Bank of Baroda PayPoint"
    transaction_id: str
    status: str = "success"
    paid_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class FeePaymentCreate(BaseModel):
    amount: float
    transaction_id: str

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

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    return verify_jwt_token(token)

async def get_admin_user(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'admin':
        raise HTTPException(status_code=403, detail="Admin access required")
    return current_user

# Initialize admin user
@app.on_event("startup")
async def startup_event():
    admin_email = "admin@arunodayvidyalay.com"
    existing_admin = await db.admins.find_one({"email": admin_email}, {"_id": 0})
    if not existing_admin:
        admin_data = {
            "id": str(uuid.uuid4()),
            "email": admin_email,
            "password_hash": hash_password("admin123"),
            "name": "Admin",
            "created_at": datetime.now(timezone.utc).isoformat()
        }
        await db.admins.insert_one(admin_data)
        logger.info(f"Admin user created: {admin_email} / admin123")

# Routes
@api_router.post("/auth/login", response_model=LoginResponse)
async def login(request: LoginRequest):
    # Check if admin
    admin = await db.admins.find_one({"email": request.email}, {"_id": 0})
    if admin and verify_password(request.password, admin['password_hash']):
        token = create_jwt_token(admin['id'], 'admin')
        return LoginResponse(
            token=token,
            user_type='admin',
            user={'id': admin['id'], 'email': admin['email'], 'name': admin['name']}
        )
    
    # Check if student
    student = await db.students.find_one({"email": request.email}, {"_id": 0})
    if student and verify_password(request.password, student['password_hash']):
        token = create_jwt_token(student['id'], 'student')
        return LoginResponse(
            token=token,
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

# Admin routes
@api_router.get("/admin/students", response_model=List[StudentResponse])
async def get_all_students(current_user: dict = Depends(get_admin_user)):
    students = await db.students.find({}, {"_id": 0}).to_list(1000)
    for student in students:
        student['created_at'] = student['created_at'].isoformat() if isinstance(student['created_at'], datetime) else student['created_at']
        student['updated_at'] = student['updated_at'].isoformat() if isinstance(student['updated_at'], datetime) else student['updated_at']
    return students

@api_router.post("/admin/students", response_model=StudentResponse)
async def create_student(student_data: StudentCreate, current_user: dict = Depends(get_admin_user)):
    # Check if email or roll number already exists
    existing = await db.students.find_one(
        {"$or": [{"email": student_data.email}, {"roll_number": student_data.roll_number}]},
        {"_id": 0}
    )
    if existing:
        raise HTTPException(status_code=400, detail="Email or roll number already exists")
    
    student = Student(
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
        fee_amount=student_data.fee_amount
    )
    
    doc = student.model_dump()
    doc['created_at'] = doc['created_at'].isoformat()
    doc['updated_at'] = doc['updated_at'].isoformat()
    
    await db.students.insert_one(doc)
    return StudentResponse(**doc)

@api_router.put("/admin/students/{student_id}", response_model=StudentResponse)
async def update_student(student_id: str, student_data: StudentUpdate, current_user: dict = Depends(get_admin_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    update_data = student_data.model_dump(exclude_unset=True)
    if update_data:
        update_data['updated_at'] = datetime.now(timezone.utc).isoformat()
        await db.students.update_one({"id": student_id}, {"$set": update_data})
    
    updated_student = await db.students.find_one({"id": student_id}, {"_id": 0})
    return StudentResponse(**updated_student)

@api_router.delete("/admin/students/{student_id}")
async def delete_student(student_id: str, current_user: dict = Depends(get_admin_user)):
    result = await db.students.delete_one({"id": student_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Student not found")
    return {"message": "Student deleted successfully"}

@api_router.post("/admin/students/{student_id}/reset-password")
async def reset_student_password(student_id: str, request: PasswordResetRequest, current_user: dict = Depends(get_admin_user)):
    student = await db.students.find_one({"id": student_id}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    new_hash = hash_password(request.new_password)
    await db.students.update_one(
        {"id": student_id},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Password reset successfully"}

@api_router.get("/admin/payments", response_model=List[dict])
async def get_all_payments(current_user: dict = Depends(get_admin_user)):
    payments = await db.payments.find({}, {"_id": 0}).to_list(1000)
    for payment in payments:
        payment['paid_at'] = payment['paid_at'].isoformat() if isinstance(payment['paid_at'], datetime) else payment['paid_at']
    return payments

# Student routes
@api_router.get("/student/profile", response_model=StudentResponse)
async def get_student_profile(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    
    student = await db.students.find_one({"id": current_user['user_id']}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    student['created_at'] = student['created_at'].isoformat() if isinstance(student['created_at'], datetime) else student['created_at']
    student['updated_at'] = student['updated_at'].isoformat() if isinstance(student['updated_at'], datetime) else student['updated_at']
    return StudentResponse(**student)

@api_router.post("/student/change-password")
async def change_password(request: PasswordChangeRequest, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    
    student = await db.students.find_one({"id": current_user['user_id']}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if not verify_password(request.old_password, student['password_hash']):
        raise HTTPException(status_code=400, detail="Incorrect old password")
    
    new_hash = hash_password(request.new_password)
    await db.students.update_one(
        {"id": current_user['user_id']},
        {"$set": {"password_hash": new_hash, "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    return {"message": "Password changed successfully"}

@api_router.post("/student/pay-fee", response_model=dict)
async def pay_fee(payment_data: FeePaymentCreate, current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    
    student = await db.students.find_one({"id": current_user['user_id']}, {"_id": 0})
    if not student:
        raise HTTPException(status_code=404, detail="Student not found")
    
    if student['fee_status'] == 'paid':
        raise HTTPException(status_code=400, detail="Fee already paid")
    
    payment = FeePayment(
        student_id=current_user['user_id'],
        amount=payment_data.amount,
        transaction_id=payment_data.transaction_id
    )
    
    doc = payment.model_dump()
    doc['paid_at'] = doc['paid_at'].isoformat()
    
    await db.payments.insert_one(doc)
    await db.students.update_one(
        {"id": current_user['user_id']},
        {"$set": {"fee_status": "paid", "updated_at": datetime.now(timezone.utc).isoformat()}}
    )
    
    return {"message": "Fee payment successful", "payment_id": payment.id}

@api_router.get("/student/payments", response_model=List[dict])
async def get_student_payments(current_user: dict = Depends(get_current_user)):
    if current_user['user_type'] != 'student':
        raise HTTPException(status_code=403, detail="Student access required")
    
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

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
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