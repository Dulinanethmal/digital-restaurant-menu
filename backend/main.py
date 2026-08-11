from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List

# Import your database connection and models
from database import engine, get_db
import models

# This command ensures your tables exist in the database.
models.Base.metadata.create_all(bind=engine)

app = FastAPI(title="Restaurant Admin API")

# ==========================================
# CORS SETUP
# ==========================================
# This allows your React app to talk to this FastAPI server safely.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173", 
        "http://127.0.0.1:5173", 
        "http://localhost:3000",
        "http://127.0.0.1:3000"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ==========================================
# 1. SHOP ENDPOINTS
# ==========================================
@app.get("/api/shops/{shop_id}", response_model=models.ShopResponse)
def get_shop_settings(shop_id: str, db: Session = Depends(get_db)):
    shop = db.query(models.Shop).filter(models.Shop.id == shop_id).first()
    if not shop:
        raise HTTPException(status_code=404, detail="Shop not found")
    return shop

# ==========================================
# 2. MENU ITEM ENDPOINTS
# ==========================================
@app.get("/api/menu-items", response_model=List[models.MenuItemResponse])
def get_menu_items(shop_id: str, db: Session = Depends(get_db)):
    items = db.query(models.MenuItem).filter(models.MenuItem.shop_id == shop_id).all()
    return items

@app.post("/api/menu-items", response_model=models.MenuItemResponse)
def create_menu_item(item: models.MenuItemCreate, db: Session = Depends(get_db)):
    db_item = models.MenuItem(**item.model_dump())
    db.add(db_item)
    db.commit()
    db.refresh(db_item)
    return db_item

# FIXED: Changed item_id from int to str to support Supabase UUIDs
@app.put("/api/menu-items/{item_id}", response_model=models.MenuItemResponse)
def update_menu_item(item_id: str, item: models.MenuItemCreate, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    for key, value in item.model_dump().items():
        setattr(db_item, key, value)
        
    db.commit()
    db.refresh(db_item)
    return db_item

# FIXED: Changed item_id from int to str to support Supabase UUIDs
@app.delete("/api/menu-items/{item_id}")
def delete_menu_item(item_id: str, db: Session = Depends(get_db)):
    db_item = db.query(models.MenuItem).filter(models.MenuItem.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=404, detail="Item not found")
    
    db.delete(db_item)
    db.commit()
    return {"message": "Menu item deleted successfully"}

# ==========================================
# 3. ORDER ENDPOINTS
# ==========================================
@app.get("/api/orders", response_model=List[models.OrderResponse])
def get_orders(shop_id: str, db: Session = Depends(get_db)):
    orders = db.query(models.Order)\
        .filter(models.Order.shop_id == shop_id)\
        .order_by(models.Order.created_at.desc())\
        .all()
    return orders

# FIXED: Changed order_id from int to str to support Supabase UUIDs
@app.patch("/api/orders/{order_id}/status", response_model=models.OrderResponse)
def update_order_status(order_id: str, status_update: models.OrderStatusUpdate, db: Session = Depends(get_db)):
    order = db.query(models.Order).filter(models.Order.id == order_id).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    order.status = status_update.status
    db.commit()
    db.refresh(order)
    return order