import { useEffect, useState } from "react";
import supabase from "./supabase";
import "./App.css";
import OrderTracker from "./OrderTracker";
import Cart from "./Cart";

const CATEGORIES = [
  { name: "Rice"},
  { name: "Kottu" },
  { name: "Pizza", },
  { name: "Burger" },
  { name: "Chicken"},
  { name: "Seafood"},
  { name: "Desserts"},
  { name: "Soft Drinks"}
];

export default function User() {
  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [view, setView] = useState(() => localStorage.getItem("current_view") || "menu");
  const [activeOrderId, setActiveOrderId] = useState(() => localStorage.getItem("active_order_id") || null);

  const [shopSettings, setShopSettings] = useState({
    shop_name: "Lumière & Co.",
    description: "FINE DINING",
    logo_url: "",
    banner_url: "",
    payment_flow: "before" 
  });

  useEffect(() => {
    fetchMenuItems();
    fetchShopSettings();

    const intervalId = setInterval(() => fetchMenuItems(), 5000);
    const settingsSub = supabase
      .channel('shop-settings-live')
      .on('postgres', { event: '*', schema: 'public', table: 'shop_settings' }, () => fetchShopSettings())
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
    } else if (newView === "menu" || newView === "cart") {
      setActiveOrderId(null);
      localStorage.removeItem("active_order_id");
    }
  }


  async function fetchShopSettings() {
    const { data } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
    if (data) {
      setShopSettings({
        shop_name: data.shop_name || "Lumière & Co.",
        description: data.description || "FINE DINING",
        logo_url: data.logo_url || "",
        banner_url: data.banner_url || "",
        payment_flow: data.payment_flow || "before" 
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

  function increaseQuantity(id) { setCart(cart.map((item) => item.id === id ? { ...item, quantity: item.quantity + 1 } : item)); }
  function decreaseQuantity(id) { setCart(cart.map((item) => item.id === id ? { ...item, quantity: item.quantity - 1 } : item).filter((item) => item.quantity > 0)); }
  
  const subtotal = cart.reduce((total, item) => total + Number(item.price) * item.quantity, 0);
  const tax = subtotal * 0.08;
  const totalPrice = subtotal + tax;

  async function placeOrder() {
  if (cart.length === 0) return alert("Cart is empty");
  if (!customerName || !tableNumber) return alert("Please enter customer name and table number");

  const { data, error } = await supabase.from("orders").insert([
    { 
      customer_name: customerName, 
      table_number: Number(tableNumber), 
      total_amount: totalPrice, 
      status: "Pending",
      payment_status: "Unpaid", // Ensure this exists
      items: cart // <--- THIS SAVES THE CART DATA TO THE NEW COLUMN
    },
  ]).select();

  if (error || !data) return alert("Failed to place order: " + error.message);

  changeView("tracker", data[0].id);
  setCart([]); setCustomerName(""); setTableNumber("");
}

  const filteredMenu = menuItems.filter((item) => {
    if (item.is_available === false) return false;
    const matchesCategory = activeCategory === "All" || item.category === activeCategory;
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch = item.name?.toLowerCase().includes(searchLower) || item.description?.toLowerCase().includes(searchLower);
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="app-container-mobile">
      
      { view === "tracker" ? (
        <OrderTracker orderId={activeOrderId} onBack={() => changeView("menu")} />
      ) : view === "cart" ? (
        <Cart 
          cart={cart} setCart={setCart} 
          increaseQuantity={increaseQuantity} decreaseQuantity={decreaseQuantity}
          customerName={customerName} setCustomerName={setCustomerName}
          tableNumber={tableNumber} setTableNumber={setTableNumber}
          placeOrder={placeOrder} subtotal={subtotal} tax={tax} totalPrice={totalPrice}
          changeView={changeView}
          paymentFlow={shopSettings.payment_flow}
        />
      ) : (
        <main className="menu-section">
          
          <header className="mobile-app-header">
            <div className="header-location">
              <span className="location-icon">📍</span>
              <span className="location-text">{shopSettings.shop_name}</span>
            </div>
            <button className="header-action-btn">♡</button>
          </header>

          <div className="search-container">
            <span className="search-icon">🔍</span>
            <input type="text" className="search-input" placeholder="Type to search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>

          <div className="categories-wrapper">
            <div className="categories">
              <button className={`category-btn ${activeCategory === "All" ? "active" : ""}`} onClick={() => setActiveCategory("All")}>🍽️ All</button>
              {CATEGORIES.map((cat) => (
                <button key={cat.name} className={`category-btn ${activeCategory === cat.name ? "active" : ""}`} onClick={() => setActiveCategory(cat.name)}>
                  {cat.icon} {cat.name}
                </button>
              ))}
            </div>
          </div>

          <div className="section-title-row">
            <h2>{searchQuery ? "Search Results" : "Popular Food"}</h2>
            <span className="see-all-btn">See All</span>
          </div>

          <div className="menu-grid">
            {filteredMenu.map((item) => (
              <div key={item.id} className="menu-card">
                <div className="image-container">
                  {item.image_url ? <img src={item.image_url} alt={item.name} /> : <div className="image-placeholder"></div>}
                  <div className="price-badge">${Number(item.price).toFixed(2)}</div>
                  <div className="favorite-badge">♡</div>
                </div>
                <div className="menu-info">
                  <div className="menu-text">
                    <h3>{item.name}</h3>
                    {item.badge && <span className="rating-badge">⭐ {item.badge}</span>}
                  </div>
                  <button className="add-to-cart-pill" onClick={() => addToCart(item)}>
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div style={{ height: "120px" }}></div>
        </main>
      )}

    <div className="glassy-bottom-nav">
        <button className={`nav-item ${view === "menu" ? "active" : ""}`} onClick={() => changeView("menu")}>
          {view === "menu" ? "Home" : "🏠"}
        </button>
        <button className={`nav-item ${view === "dashboard" ? "active" : ""}`} onClick={() => changeView("dashboard")}>
          {view === "dashboard" ? "Profile" : "👤"}
        </button>
        <button className={`nav-item ${view === "cart" ? "active" : ""}`} onClick={() => changeView("cart")} style={{ position: "relative" }}>
          {view === "cart" ? "Cart" : "🛒"}
          {cart.length > 0 && view !== "cart" && <span className="cart-badge">{cart.length}</span>}
        </button>
      </div>

    </div>
  );
}