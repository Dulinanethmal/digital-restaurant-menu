import { useEffect, useState } from "react";
import supabase from "./supabase";
import "./App.css";

// Import your custom components
import UserDashboard from "./UserDashboard"; 
import OrderTracker from "./OrderTracker";

// 1. YOUR CUSTOM PROMO BANNERS FROM SUPABASE
const PROMO_BANNERS = [
  "https://nbpdnshlcoicqwdbdkyj.supabase.co/storage/v1/object/public/food-images/banner1.png",
  "https://nbpdnshlcoicqwdbdkyj.supabase.co/storage/v1/object/public/food-images/banner2.png",
  "https://nbpdnshlcoicqwdbdkyj.supabase.co/storage/v1/object/public/food-images/banner3.png",
  "https://nbpdnshlcoicqwdbdkyj.supabase.co/storage/v1/object/public/food-images/banner4.png"
];

const CATEGORIES = [
  { name: "Burgers", icon: "🍔" },
  { name: "Pizza", icon: "🍕" },
  { name: "Drinks", icon: "🥤" }, 
  { name: "Desserts", icon: "🍰" },
  { name: "Pasta", icon: "🍝" }, 
  { name: "Salads", icon: "🥗" },
  { name: "Appetizers", icon: "🥟" },
  { name: "Rice Dishes", icon: "🍚" },
  { name: "Soups", icon: "🍲" }
];

export default function App() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  // Routing States
  const [view, setView] = useState(() => {
    return localStorage.getItem("current_view") || "menu";
  }); 
  const [activeOrderId, setActiveOrderId] = useState(() => {
    return localStorage.getItem("active_order_id") || null;
  });

  // Shop Branding State
  const [shopSettings, setShopSettings] = useState({
    shop_name: "Lumière & Co.",
    description: "FINE DINING",
    logo_url: "",
    banner_url: ""
  });

  useEffect(() => {
    fetchMenuItems();
    fetchShopSettings(); 

    const intervalId = setInterval(() => {
      fetchMenuItems();
    }, 5000); 

    const settingsSub = supabase
      .channel('shop-settings-live')
      .on('postgres', { event: '*', schema: 'public', table: 'shop_settings' }, () => {
        fetchShopSettings();
      })
      .subscribe();

    return () => {
      clearInterval(intervalId);
      supabase.removeChannel(settingsSub);
    };
  }, []);

  function changeView(newView, orderId = null) {
    setView(newView);
    localStorage.setItem("current_view", newView);
    
    if (orderId) {
      setActiveOrderId(orderId);
      localStorage.setItem("active_order_id", orderId);
    } else if (newView === "menu") {
      setActiveOrderId(null);
      localStorage.removeItem("active_order_id");
    }
  }

  async function fetchShopSettings() {
    const { data, error } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
    
    if (data) {
      setShopSettings({
        shop_name: data.shop_name || "Lumière & Co.",
        description: data.description || "FINE DINING",
        logo_url: data.logo_url || "",
        banner_url: data.banner_url || ""
      });
    }
  }

  async function fetchMenuItems() {
    const { data, error } = await supabase.from("menu_items").select("*");
    if (!error) setMenuItems(data);
  }

  function addToCart(item) {
    const existing = cart.find((c) => c.id === item.id);
    if (existing) increaseQuantity(item.id);
    else setCart([...cart, { ...item, quantity: 1 }]);
  }

  function increaseQuantity(id) {
    setCart(cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item));
  }

  function decreaseQuantity(id) {
    setCart(cart.map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0));
  }

  function removeFromCart(id) { 
    setCart(cart.filter((item) => item.id !== id)); 
  }

  const subtotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.08; 
  const totalPrice = subtotal + tax;

  async function placeOrder() {
    if (cart.length === 0) return alert("Cart is empty");
    if (!customerName || !tableNumber) return alert("Please enter customer name and table number");

    const { data, error } = await supabase.from("orders").insert([
      { customer_name: customerName, table_number: Number(tableNumber), total_amount: totalPrice, status: "Pending" },
    ]).select();

    if (error || !data) return alert("Failed to place order");

    changeView("tracker", data[0].id);
    setCart([]); 
    setCustomerName(""); 
    setTableNumber("");
  }

  const filteredMenu = menuItems.filter((item) => {
    if (item.is_available === false) return false;
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.name?.toLowerCase().includes(searchLower) || item.description?.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  const headerStyles = shopSettings.banner_url ? {
    backgroundImage: `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.6)), url(${shopSettings.banner_url})`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    padding: "40px 30px",
    borderRadius: "16px",
    color: "white",
    marginBottom: "30px",
    boxShadow: "0 10px 30px rgba(0,0,0,0.15)"
  } : {};

  return (
    <div className="app-container" style={{ display: "flex", gap: "20px", width: "100%", minHeight: "100vh", padding: "20px", boxSizing: "border-box" }}>
      
      {/* ── NEW: LEFT SIDEBAR (VERTICAL PROMO BANNERS) ── */}
      {view === "menu" && (
        <aside className="promo-sidebar">
          <div className="promo-track">
            {/* Map twice to create an infinite seamless vertical loop */}
            {[...PROMO_BANNERS, ...PROMO_BANNERS].map((imgUrl, index) => (
              <img key={index} src={imgUrl} alt="Promo" className="promo-image" />
            ))}
          </div>
        </aside>
      )}

      {/* ── CENTER: MAIN CONTENT ── */}
      {view === "dashboard" ? (
        <UserDashboard onBack={() => changeView("menu")} />
      ) : view === "tracker" ? (
        <OrderTracker orderId={activeOrderId} onBack={() => changeView("menu")} />
      ) : (
        <main className="menu-section" style={{ flex: 1, minWidth: 0 }}>
          
          {/* DYNAMIC HEADER */}
          <header className="menu-header" style={headerStyles}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
              {shopSettings.logo_url && (
                <img 
                  src={shopSettings.logo_url} 
                  alt="Shop Logo" 
                  style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid rgba(255,255,255,0.8)", backgroundColor: "#fff" }} 
                />
              )}
              <div>
                <span className="subtitle" style={{ color: shopSettings.banner_url ? "rgba(255,255,255,0.8)" : "var(--text-muted)" }}>
                  {shopSettings.description}
                </span>
                <h1 className="title" style={{ marginTop: "2px", color: shopSettings.banner_url ? "#fff" : "var(--text-dark)" }}>
                  {shopSettings.shop_name}
                </h1>
              </div>
            </div>
            
            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              <div 
                className="table-badge" 
                style={{ cursor: "pointer", backgroundColor: "#fff", border: shopSettings.banner_url ? "none" : "1px solid #eaeaea", color: "var(--text-dark)", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }} 
                onClick={() => changeView("dashboard")}
              >
                👤 My Orders
              </div>
              <div className="table-badge" style={{ backgroundColor: "var(--primary-gold)", color: "#fff", border: "none", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                🍽️ Table 12
              </div>
            </div>
          </header>

          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              className="search-input"
              placeholder={`Search ${shopSettings.shop_name} menu...`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="categories">
            <button className={`category-btn ${activeCategory === "All" ? "active" : ""}`} onClick={() => setActiveCategory("All")}>🍽️ All</button>
            {CATEGORIES.map((cat) => (
              <button key={cat.name} className={`category-btn ${activeCategory === cat.name ? "active" : ""}`} onClick={() => setActiveCategory(cat.name)}>
                {cat.icon} {cat.name}
              </button>
            ))}
          </div>

          <div className="section-header">
            <h2>{searchQuery ? `Search Results for "${searchQuery}"` : "Popular Right Now"}</h2>
          </div>

          <div className="menu-grid">
            {filteredMenu.map((item) => (
              <div key={item.id} className="menu-card">
                <div className="image-container">
                  {item.image_url ? <img src={item.image_url} alt={item.name} className="menu-image" /> : <div className="image-placeholder"></div>}
                  {item.badge && <span className="badge">⭐ {item.badge}</span>}
                </div>
                <div className="menu-info">
                  <h3>{item.name}</h3>
                  <p className="description">{item.description}</p>
                  <div className="menu-bottom">
                    <span className="price">${Number(item.price).toFixed(2)}</span>
                    <button className="add-btn" onClick={() => addToCart(item)}>+</button>
                  </div>
                </div>
              </div>
            ))}
            {filteredMenu.length === 0 && menuItems.length > 0 && (
              <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "40px 20px", color: "var(--text-muted)" }}>
                <h3>No items found</h3>
                <p>Try searching for something else or changing the category.</p>
              </div>
            )}
          </div>
        </main>
      )}

      {/* ONLY SHOW CART IF WE ARE ON THE MENU PAGE */}
      {view === "menu" && (
        <aside className="cart-section" style={{ minWidth: "320px", maxWidth: "350px" }}>
          <div className="cart-header">
            <h2>Your Order</h2>
            {cart.length > 0 && <button className="clear-btn" onClick={() => setCart([])}>🗑️</button>}
          </div>
          <p className="item-count">{cart.length} ITEMS</p>
          {cart.length === 0 ? (
            <div className="empty-cart"><p>Your cart is looking a little empty.</p></div>
          ) : (
            <div className="cart-items">
              {cart.map((item) => (
                <div key={item.id} className="cart-item">
                  <div className="cart-item-details">
                    <h4>{item.name}</h4>
                    <span className="cart-item-price">${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                  <div className="quantity-controls">
                    <button onClick={() => decreaseQuantity(item.id)}>-</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => increaseQuantity(item.id)}>+</button>
                  </div>
                  <button className="remove-item" onClick={() => removeFromCart(item.id)}>✕</button>
                </div>
              ))}
            </div>
          )}
          <div className="checkout-panel">
            <div className="input-group">
              <input type="text" placeholder="Customer Name" value={customerName} onChange={(e) => setCustomerName(e.target.value)} />
              <input type="number" placeholder="Table No." value={tableNumber} onChange={(e) => setTableNumber(e.target.value)} />
            </div>
            <div className="order-summary">
              <h3>Order Summary</h3>
              <div className="summary-row"><span>Subtotal</span><span>${subtotal.toFixed(2)}</span></div>
              <div className="summary-row"><span>Tax (8%)</span><span>${tax.toFixed(2)}</span></div>
              <div className="summary-row total"><span>Total</span><span>${totalPrice.toFixed(2)}</span></div>
            </div>
            <button className="place-order-btn" onClick={placeOrder} disabled={cart.length === 0}>
              Place Order • ${totalPrice.toFixed(2)}
            </button>
          </div>
        </aside>
      )}
      
    </div>
  );
}