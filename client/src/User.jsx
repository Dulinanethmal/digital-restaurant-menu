import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import supabase from "./supabase";
import "./App.css";
import OrderTracker from "./OrderTracker";
import Cart from "./Cart";

// ✅ FIXED: Only ONE single import block for all icons!
import { 
  Home, 
  ShoppingCart, 
  Search, 
  Utensils,
  CookingPot, 
  Pizza, 
  Sandwich, 
  Drumstick, 
  Fish, 
  CakeSlice, 
  CupSoda,
  UtensilsCrossed
} from "lucide-react";

const CATEGORIES = [
  { name: "Rice", icon: <CookingPot size={16} /> },
  { name: "Kottu", icon: <UtensilsCrossed size={16} /> },
  { name: "Pizza", icon: <Pizza size={16} /> },
  { name: "Burger", icon: <Sandwich size={16} /> }, 
  { name: "Chicken", icon: <Drumstick size={16} /> },
  { name: "Seafood", icon: <Fish size={16} /> },
  { name: "Desserts", icon: <CakeSlice size={16} /> },
  { name: "Soft Drinks", icon: <CupSoda size={16} /> }
];

export default function User() {
  // 1. Grab the specific restaurant's ID from the URL (e.g. ?shop=123)
  const [searchParams] = useSearchParams();
  const shopId = searchParams.get("shop"); 

  const [menuItems, setMenuItems] = useState([]);
  const [cart, setCart] = useState([]);
  const [customerName, setCustomerName] = useState("");
  const [tableNumber, setTableNumber] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  
  const [view, setView] = useState(() => localStorage.getItem("current_view") || "menu");
  const [activeOrderId, setActiveOrderId] = useState(() => localStorage.getItem("active_order_id") || null);

  const [shopSettings, setShopSettings] = useState({
    shop_name: "Loading...",
    description: " ",
    logo_url: "",
    banner_url: "",
    payment_flow: "before" 
  });

  useEffect(() => {
    // If someone visits /user without a ?shop= parameter, stop them from loading everything
    if (!shopId) return;

    fetchMenuItems();
    fetchShopSettings();

    // 1. Listen for live updates to the SHOP SETTINGS
    const settingsSub = supabase
      .channel(`shop-${shopId}-live`)
      .on('postgres', { event: '*', schema: 'public', table: 'shops', filter: `id=eq.${shopId}` }, () => fetchShopSettings())
      .subscribe();

    // 2. Listen for live updates to the MENU ITEMS
    const menuSub = supabase
      .channel(`menu-${shopId}-live`)
      .on('postgres', { event: '*', schema: 'public', table: 'menu_items', filter: `shop_id=eq.${shopId}` }, () => fetchMenuItems())
      .subscribe();

    return () => {
      supabase.removeChannel(settingsSub);
      supabase.removeChannel(menuSub);
    };
  }, [shopId]);

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
    // 2. Only fetch the specific shop's details
    const { data } = await supabase.from("shops").select("*").eq("id", shopId).single();
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
    // 3. Only fetch menu items that belong to this shop
    const { data, error } = await supabase.from("menu_items").select("*").eq("shop_id", shopId);
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
    if (!shopId) return alert("Invalid shop context. Cannot place order.");

    // 4. Attach the shop_id to the order so it goes to the correct admin dashboard
    const { data, error } = await supabase.from("orders").insert([
      { 
        shop_id: shopId,
        customer_name: customerName, 
        table_number: Number(tableNumber), 
        total_amount: totalPrice, 
        status: "Pending",
        payment_status: "Unpaid",
        items: cart
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

  // 5. Block the UI if no shop ID is provided in the URL
  if (!shopId) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", background: "#050505", color: "white", textAlign: "center", padding: "20px" }}>
        <h2>Invalid Menu Link</h2>
        <p>Please scan a valid restaurant QR code to view their menu.</p>
      </div>
    );
  }

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
          
          <header 
            style={{
              position: "relative",
              padding: "40px 20px 20px 20px",
              marginBottom: "20px",
              borderRadius: "0 0 24px 24px",
              background: shopSettings.banner_url ? `url(${shopSettings.banner_url}) center/cover no-repeat` : "linear-gradient(135deg, #fdfbfb 0%, #ebedee 100%)",
              color: shopSettings.banner_url ? "#fff" : "#1a1a1a",
              boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
              overflow: "hidden"
            }}
          >
            {shopSettings.banner_url && (
              <div style={{ position: "absolute", inset: 0, backgroundColor: "rgba(0,0,0,0.5)", zIndex: 0 }} />
            )}
            
            <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: "16px" }}>
              
              {/* Dynamic Logo */}
              {shopSettings.logo_url ? (
                <img 
                  src={shopSettings.logo_url} 
                  alt="Shop Logo" 
                  style={{ width: "70px", height: "70px", borderRadius: "50%", objectFit: "cover", border: "3px solid white", boxShadow: "0 2px 8px rgba(0,0,0,0.2)" }} 
                />
              ) : (
                <div style={{ width: "70px", height: "70px", borderRadius: "50%", background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "28px", boxShadow: "0 2px 8px rgba(0,0,0,0.1)" }}>
                </div>
              )}
              
              {/* Name and Description */}
              <div>
                <h1 style={{ margin: 0, fontSize: "24px", fontWeight: "800", textShadow: shopSettings.banner_url ? "0 2px 4px rgba(0,0,0,0.8)" : "none", letterSpacing: "-0.5px" }}>
                  {shopSettings.shop_name}
                </h1>
                <p style={{ margin: "4px 0 0 0", fontSize: "14px", opacity: 0.9, textShadow: shopSettings.banner_url ? "0 1px 2px rgba(0,0,0,0.8)" : "none", fontWeight: "500" }}>
                  {shopSettings.description}
                </p>
              </div>
            </div>
          </header>

          <div className="search-container">
            <span className="search-icon" style={{ display: "flex", alignItems: "center", color: "#8e8e93" }}>
              <Search size={18} />
            </span>
            <input 
              type="text" 
              className="search-input" 
              placeholder="Type to search..." 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <div className="categories-wrapper">
            <div className="categories">
              <button 
                className={`category-btn ${activeCategory === "All" ? "active" : ""}`} 
                onClick={() => setActiveCategory("All")}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Utensils size={16} /> All
              </button>
              
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
        <button 
          className={`nav-item ${view === "menu" ? "active" : ""}`} 
          onClick={() => changeView("menu")}
        >
          <Home size={22} strokeWidth={view === "menu" ? 2.5 : 1.8} />
          <span>Home</span>
        </button>

        <button 
          className={`nav-item ${view === "cart" ? "active" : ""}`} 
          onClick={() => changeView("cart")} 
          style={{ position: "relative" }}
        >
          <ShoppingCart size={22} strokeWidth={view === "cart" ? 2.5 : 1.8} />
          <span>Cart</span>
          {cart.length > 0 && (
            <span className="cart-badge">{cart.length}</span>
          )}
        </button>
      </div>

    </div>
  );
}