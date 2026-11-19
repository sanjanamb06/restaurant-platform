"""
Read-only SQLAlchemy ORM models that mirror the existing Prisma schema.
These are NEVER used for writes — only for data extraction.
"""
from sqlalchemy import Column, DateTime, Float, Integer, String, Text
from sqlalchemy.orm import relationship
from database import Base


class Restaurant(Base):
    __tablename__ = "Restaurant"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False)

    menu_items = relationship("MenuItem", back_populates="restaurant")
    order_items = relationship("OrderItem", back_populates="restaurant")
    orders = relationship("Order", back_populates="restaurant")


class MenuItem(Base):
    __tablename__ = "MenuItem"

    id = Column(String, primary_key=True)
    restaurantId = Column(String, nullable=False)
    name = Column(String, nullable=False)
    categoryId = Column(String, nullable=False)

    restaurant = relationship("Restaurant", back_populates="menu_items")
    order_items = relationship("OrderItem", back_populates="menu_item")


class Order(Base):
    __tablename__ = "Order"

    id = Column(String, primary_key=True)
    restaurantId = Column(String, nullable=False)
    status = Column(String, nullable=False)
    createdAt = Column(DateTime, nullable=False)

    restaurant = relationship("Restaurant", back_populates="orders")
    items = relationship("OrderItem", back_populates="order")


class OrderItem(Base):
    __tablename__ = "OrderItem"

    id = Column(String, primary_key=True)
    restaurantId = Column(String, nullable=False)
    orderId = Column(String, nullable=False)
    menuItemId = Column(String, nullable=False)
    quantity = Column(Integer, nullable=False)
    priceAtOrder = Column(Float, nullable=False)

    restaurant = relationship("Restaurant", back_populates="order_items")
    order = relationship("Order", back_populates="items")
    menu_item = relationship("MenuItem", back_populates="order_items")
