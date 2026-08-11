from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime
import uuid

from database import Base

# ==========================================
# 1. SQLALCHEMY MODELS (Database Tables)
# ==========================================

class Shop(Base):
    __tablename__ = "shops"
    id = Column(String, primary_key=True, index=True)
    shop_name = Column(String, nullable=False)
    description = Column(String)
    logo_url = Column(String)

class Profile(Base):
    __tablename__ = "profiles"
    id = Column(String, primary_key=True, index=True)
    shop_id = Column(String, ForeignKey("shops.id"))
    full_name = Column(String)
    email = Column(String, unique=True, index=True)
    role = Column(String, default="cashier")
    phone_number = Column(String)
    status = Column(String, default="active")
    avatar_url = Column(String)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class MenuItem(Base):
    __tablename__ = "menu_items"
    
    # Changed ID to String to support Supabase UUIDs
    id = Column(String, primary_key=True, index=True, default=lambda: str(uuid.uuid4()))
    shop_id = Column(String, ForeignKey("shops.id"))
    
    name = Column(String, nullable=True)
    price = Column(Float, nullable=True)
    
    # Added all the fields seen in your FoodForm screenshot!
    category = Column(String, nullable=True)
    category_id = Column(String, nullable=True)
    description = Column(String, nullable=True)
    image_url = Column(String, nullable=True)
    badge = Column(String, nullable=True)

class Order(Base):
    __tablename__ = "orders"
    
    # Changed ID to String to support Supabase UUIDs
    id = Column(String, primary_key=True, index=True)
    shop_id = Column(String, ForeignKey("shops.id"))
    status = Column(String, default="Pending")
    total_amount = Column(Float, default=0.0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


# ==========================================
# 2. PYDANTIC SCHEMAS (API Data Validation)
# ==========================================

class ShopResponse(BaseModel):
    id: uuid.UUID | str
    shop_name: str
    description: Optional[str] = None
    logo_url: Optional[str] = None
    model_config = ConfigDict(from_attributes=True)

class MenuItemBase(BaseModel):
    name: Optional[str] = None
    price: Optional[float] = 0.0
    shop_id: uuid.UUID | str
    
    # Matching the new database fields
    category: Optional[str] = None
    category_id: Optional[uuid.UUID | str] = None
    description: Optional[str] = None
    image_url: Optional[str] = None
    badge: Optional[str] = None

class MenuItemCreate(MenuItemBase):
    pass 

class MenuItemResponse(MenuItemBase):
    id: uuid.UUID | str | int
    model_config = ConfigDict(from_attributes=True)

class OrderBase(BaseModel):
    shop_id: uuid.UUID | str
    total_amount: float
    status: str = "Pending"

class OrderCreate(OrderBase):
    pass

class OrderResponse(OrderBase):
    id: uuid.UUID | str | int
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)

class OrderStatusUpdate(BaseModel):
    status: str