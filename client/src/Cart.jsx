import React from "react";
import "./App.css";

export default function Cart({ 
  cart, 
  setCart, 
  increaseQuantity, 
  decreaseQuantity, 
  customerName, 
  setCustomerName, 
  tableNumber, 
  setTableNumber, 
  placeOrder, 
  subtotal, 
  tax, 
  totalPrice,
  changeView
}) {
  return (
    <div className="cart-page">
      <div className="cart-header-mobile">
        <h2>Your Cart</h2>
        {cart.length > 0 && (
          <button className="clear-btn" onClick={() => setCart([])}>🗑️ Clear</button>
        )}
      </div>
      
      <p className="item-count">{cart.length} ITEMS</p>
      
      {cart.length === 0 ? (
        <div className="empty-cart" style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ fontSize: "50px", marginBottom: "20px" }}>🛒</div>
          <h3>Your cart is empty</h3>
          <p style={{ color: "#777", marginBottom: "30px" }}>Looks like you haven't added any food yet.</p>
          <button className="action-btn" onClick={() => changeView("menu")} style={{ background: "#F4B400", color: "white", border: "none" }}>
            Browse Menu
          </button>
        </div>
      ) : (
        <>
          <div className="cart-items-mobile">
            {cart.map((item) => (
              <div key={item.id} className="cart-item-card">
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="cart-item-img" />
                )}
                <div className="cart-item-info">
                  <h4>{item.name}</h4>
                  <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                </div>
                <div className="quantity-controls">
                  <button onClick={() => decreaseQuantity(item.id)}>-</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQuantity(item.id)}>+</button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="checkout-panel-mobile">
            <div className="input-group">
              <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input type="number" placeholder="Table No." value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
            </div>
            
            <div className="order-summary">
              <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="summary-row total"><span>Total</span><span>${totalPrice.toFixed(2)}</span></div>
            </div>
            
            <button className="place-order-btn" onClick={placeOrder} disabled={cart.length === 0}>
              Place Order • ${totalPrice.toFixed(2)}
            </button>
          </div>
        </>
      )}
      
      {/* Adds padding at the bottom so the glassy nav doesn't cover the checkout button */}
      <div style={{ height: "100px" }}></div> 
    </div>
  );
}