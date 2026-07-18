from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import List, Optional
import sqlite3
import json
import razorpay

app = FastAPI(title="Caffe-30 Backend API")

# --- RAZORPAY CONFIGURATION ---
# Replace with your actual Test Keys from the Razorpay Dashboard
RZP_KEY_ID = "rzp_test_TEeLFQAYo8bpHT"
RZP_KEY_SECRET = "yPR82eTB5QPNNQGP5HmYR3n9"

# Initialize Razorpay Client
razorpay_client = razorpay.Client(auth=(RZP_KEY_ID, RZP_KEY_SECRET))

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], 
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- DATABASE SETUP ---
def init_db():
    conn = sqlite3.connect("caffe30.db")
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS orders (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            customer_name TEXT NOT NULL,
            customer_phone TEXT NOT NULL,
            table_number INTEGER NOT NULL,
            special_instructions TEXT,
            items TEXT NOT NULL, 
            total_amount REAL NOT NULL,
            status TEXT DEFAULT 'Preparing'
        )
    """)
    conn.commit()
    conn.close()

init_db()

# --- DATA MODELS ---
class CartItem(BaseModel):
    name: str
    price: float
    quantity: int

class CreatePaymentRequest(BaseModel):
    total_amount: float

class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    customer_name: str
    customer_phone: str
    table_number: int
    special_instructions: Optional[str] = None
    items: List[CartItem]
    total_amount: float

# --- API ENDPOINTS ---

@app.post("/api/create-payment")
async def create_payment(req: CreatePaymentRequest):
    try:
        # Razorpay accepts amounts in the smallest currency subunit (paise for INR)
        amount_in_paise = int(req.total_amount * 100)
        
        # Create an Order using the Razorpay Orders API
        data = {
            "amount": amount_in_paise,
            "currency": "INR",
            "payment_capture": "1" # Automatically capture the payment
        }
        payment_order = razorpay_client.order.create(data=data)
        
        return {
            "razorpay_order_id": payment_order['id'],
            "amount": amount_in_paise
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/verify-payment")
async def verify_payment(req: VerifyPaymentRequest):
    try:
        # Verify the cryptographic signature returned by the frontend
        razorpay_client.utility.verify_payment_signature({
            'razorpay_order_id': req.razorpay_order_id,
            'razorpay_payment_id': req.razorpay_payment_id,
            'razorpay_signature': req.razorpay_signature
        })
        
        # If signature is valid, write the order to the kitchen database
        conn = sqlite3.connect("caffe30.db")
        cursor = conn.cursor()
        
        items_json = json.dumps([item.dict() for item in req.items])
        
        cursor.execute(
            """INSERT INTO orders (customer_name, customer_phone, table_number, special_instructions, items, total_amount) 
               VALUES (?, ?, ?, ?, ?, ?)""",
            (req.customer_name, req.customer_phone, req.table_number, req.special_instructions, items_json, req.total_amount)
        )
        
        conn.commit()
        conn.close()
        
        return {"status": "success", "message": "Payment verified and order sent!"}
        
    except razorpay.errors.SignatureVerificationError:
        raise HTTPException(status_code=400, detail="Payment verification failed due to invalid signature.")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/orders/active")
async def get_active_orders():
    try:
        conn = sqlite3.connect("caffe30.db")
        conn.row_factory = sqlite3.Row 
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM orders WHERE status = 'Preparing' ORDER BY id ASC")
        rows = cursor.fetchall()
        
        orders = []
        for row in rows:
            orders.append({
                "id": row["id"],
                "customer_name": row["customer_name"],
                "customer_phone": row["customer_phone"],
                "table_number": row["table_number"],
                "special_instructions": row["special_instructions"],
                "items": json.loads(row["items"]),
                "total_amount": row["total_amount"]
            })
            
        conn.close()
        return {"active_orders": orders}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/order/{order_id}/complete")
async def complete_order(order_id: int):
    try:
        conn = sqlite3.connect("caffe30.db")
        cursor = conn.cursor()
        cursor.execute("UPDATE orders SET status = 'Completed' WHERE id = ?", (order_id,))
        conn.commit()
        conn.close()
        return {"status": "success"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

app.mount("/", StaticFiles(directory=".", html=True), name="static")