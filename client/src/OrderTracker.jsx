import { useEffect, useState } from "react";
import supabase from "./supabase";

// IMPORT ALL 4 CRISP LOTTIE ANIMATIONS
import { Player } from "@lottiefiles/react-lottie-player";
import pendingAnimation from "./assets/Success.json"; 
import preparingAnimation from "./assets/Preparing.json";
import readyAnimation from "./assets/Ready.json";
import servedAnimation from "./assets/Served.json"; 

const STATUS_STEPS = ["Pending", "Preparing", "Ready", "Served"];

const STATUS_DETAILS = {
  Pending: { title: "Order Received", desc: "We've got your order and are sending it to the kitchen!" },
  Preparing: { title: "Cooking in Progress", desc: "Our chefs are preparing your meal with care." },
  Ready: { title: "Order is Ready!", desc: "Your food is ready and on its way to your table." },
  Served: { title: "Enjoy Your Meal!", desc: "Bon appétit! Thank you for dining with us." },
};

export default function OrderTracker({ orderId, onBack }) {
  const [order, setOrder] = useState(null);
  const [shopSettings, setShopSettings] = useState(null);
  
  // ✅ NEW: States for the Pay-After bill flow
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [isProcessing, setIsProcessing] = useState(false);
  const [hasPaid, setHasPaid] = useState(false);

  useEffect(() => {
    if (!orderId) return;

    async function fetchData() {
      const { data: orderData, error: orderError } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (orderData) setOrder(orderData);
      if (orderError) console.error("Error fetching order:", orderError);

      const { data: settingsData } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
      if (settingsData) setShopSettings(settingsData);
    }
    
    fetchData();

    const syncTimer = setInterval(() => { fetchData(); }, 3000);
    return () => clearInterval(syncTimer);
  }, [orderId]);

  // ✅ NEW: Handle paying the bill at the end
  function handlePayBill() {
    setIsProcessing(true);
    
    // Simulate a quick 1.5 second payment process
    setTimeout(() => {
      setIsProcessing(false);
      setHasPaid(true);
    }, 1500);
  }

  if (!order || !shopSettings) {
    return (
      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "60vh", fontFamily: "'Poppins', sans-serif" }}>
        <div className="loading-spinner" style={{ width: "40px", height: "40px", border: "4px solid #eaeaea", borderTopColor: "#F25C05", borderRadius: "50%", animation: "spin 1s linear infinite", marginBottom: "15px" }} />
        <span style={{ color: "#777", fontWeight: "500" }}>Locating your order...</span>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const details = STATUS_DETAILS[order.status] || STATUS_DETAILS.Pending;
  const progressPercentage = (currentStepIndex / (STATUS_STEPS.length - 1)) * 100;
  
  const isPayBefore = shopSettings.payment_flow === "before"; 
  const isServed = order.status === "Served";

  const getAnimationForStatus = (status) => {
    switch (status) {
      case "Pending": return pendingAnimation;
      case "Preparing": return preparingAnimation;
      case "Ready": return readyAnimation;
      case "Served": return servedAnimation;
      default: return pendingAnimation;
    }
  };

  return (
    <div style={{ 
      flex: 1, 
      backgroundColor: "#ffffff", 
      borderRadius: "32px", 
      padding: "30px 20px", 
      boxShadow: "0 10px 40px rgba(0,0,0,0.04)", 
      textAlign: "center", 
      position: "relative",
      fontFamily: "'Poppins', sans-serif",
      maxWidth: "480px",
      margin: "0 auto",
      animation: "fadeUp 0.4s ease-out",
      paddingBottom: "100px" // Space for bottom nav
    }}>
      
      {/* OVERLAY FOR BILL PAYMENT */}
      {isProcessing && (
        <div className="payment-processing-overlay" style={{ borderRadius: "32px" }}>
          <div className="processing-card">
            <div className="processing-spinner"></div>
            <h3>Processing Payment...</h3>
            <p>Securely completing your transaction.</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes pulse-green { 0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.4); } 70% { box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); } 100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); } }
        .progress-dot { width: 32px; height: 32px; border-radius: 50%; background: white; border: 3px solid #eaeaea; display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 14px; color: #a0a0a0; z-index: 2; transition: all 0.4s ease; }
        .progress-dot.completed { background: #F25C05; border-color: #F25C05; color: white; }
        .progress-dot.active { border-color: #F25C05; color: #F25C05; box-shadow: 0 0 0 6px rgba(242, 92, 5, 0.15); }
      `}</style>

      {/* HEADER: BACK BUTTON & LIVE BADGE */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "30px" }}>
        <button onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "6px", border: "none", background: "rgba(0,0,0,0.04)", padding: "8px 16px", borderRadius: "20px", cursor: "pointer", fontWeight: "600", fontSize: "14px", color: "#1a1a1a" }}>
          <span style={{ fontSize: "18px", lineHeight: "1" }}>‹</span> Menu
        </button>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#15803d", fontWeight: "700", background: "#dcfce7", padding: "6px 12px", borderRadius: "20px" }}>
          <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#22c55e", animation: "pulse-green 2s infinite" }} />
          LIVE
        </div>
      </div>

      {/* ORDER INFO */}
      <div style={{ marginBottom: "20px" }}>
        <h2 style={{ fontSize: "24px", fontWeight: "800", color: "#1a1a1a", margin: "0 0 8px 0" }}>
          Order #{String(order.id).slice(0, 4).toUpperCase()}
        </h2>
        <div style={{ display: "flex", justifyContent: "center", gap: "8px", alignItems: "center" }}>
          <span style={{ background: "#f3f4f6", color: "#4b5563", padding: "4px 10px", borderRadius: "8px", fontSize: "13px", fontWeight: "600" }}>
            Table {order.table_number}
          </span>
          <span style={{ color: "#9ca3af", fontSize: "14px" }}>•</span>
          <span style={{ color: "#6b7280", fontSize: "14px", fontWeight: "500" }}>{order.customer_name}</span>
        </div>
      </div>

      {/* PAYMENT INSTRUCTION BANNER (Only shows during Pending) */}
      {order.status === "Pending" && (
        <div style={{
          background: isPayBefore ? "#fff7ed" : "#f0fdf4",
          border: `1px solid ${isPayBefore ? "#fed7aa" : "#bbf7d0"}`,
          padding: "16px", borderRadius: "16px", marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px", textAlign: "left"
        }}>
          <div style={{ fontSize: "24px", flexShrink: 0 }}>{isPayBefore ? "💳" : "🍽️"}</div>
          <div>
            <h4 style={{ margin: "0 0 4px 0", color: isPayBefore ? "#c2410c" : "#15803d", fontSize: "14px", fontWeight: "700" }}>
              {isPayBefore ? "Payment Required" : "Dine-in / Pay Later"}
            </h4>
            <p style={{ margin: 0, color: isPayBefore ? "#9a3412" : "#166534", fontSize: "12px", fontWeight: "500", lineHeight: "1.4" }}>
              {isPayBefore ? "Please head to the counter to complete your payment." : "Your order has been sent to the kitchen! You can pay your bill when you finish your meal."}
            </p>
          </div>
        </div>
      )}

      {/* LOTTIE ANIMATION */}
      <div style={{ width: "260px", height: "260px", margin: "0 auto 20px auto", display: "flex", alignItems: "center", justifyContent: "center", position: "relative" }}>
        <div style={{ position: "absolute", width: "180px", height: "180px", background: "radial-gradient(circle, rgba(242,92,5,0.1) 0%, rgba(255,255,255,0) 70%)", zIndex: 0 }} />
        <Player autoplay loop src={getAnimationForStatus(order.status)} style={{ width: "100%", height: "100%", zIndex: 1 }} />
      </div>
      
      {/* STATUS TEXT */}
      <h3 style={{ fontSize: "22px", fontWeight: "700", color: "#1a1a1a", margin: "0 0 10px 0" }}>{details.title}</h3>
      <p style={{ color: "#777", fontSize: "14px", margin: "0 auto 40px auto", maxWidth: "80%", lineHeight: "1.5" }}>{details.desc}</p>

      {/* CUSTOM PROGRESS BAR */}
      <div style={{ position: "relative", width: "100%", padding: "0 15px", boxSizing: "border-box", marginBottom: "30px" }}>
        <div style={{ position: "absolute", top: "14px", left: "30px", right: "30px", height: "4px", background: "#f3f4f6", borderRadius: "4px", zIndex: 1 }} />
        <div style={{ position: "absolute", top: "14px", left: "30px", right: "30px", height: "4px", zIndex: 1 }}>
          <div style={{ height: "100%", background: "#F25C05", borderRadius: "4px", width: `${progressPercentage}%`, transition: "width 0.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
          {STATUS_STEPS.map((step, index) => {
            const isActive = index === currentStepIndex;
            const isCompleted = index < currentStepIndex;
            return (
              <div key={step} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", width: "60px" }}>
                <div className={`progress-dot ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
                  {isCompleted ? "✓" : index + 1}
                </div>
                <span style={{ fontSize: "11px", fontWeight: isActive || isCompleted ? "700" : "500", color: isActive ? "#F25C05" : isCompleted ? "#1a1a1a" : "#a0a0a0" }}>
                  {step}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* ✅ NEW: SHOW THE BILL & PAYMENT ONLY IF "PAY AFTER", ORDER IS "SERVED", AND NOT YET PAID */}
      {(isServed && !isPayBefore && !hasPaid) && (
        <div style={{ background: "#FAFAFC", borderRadius: "24px", padding: "24px", textAlign: "left", animation: "fadeUp 0.5s ease", border: "1px solid #eaeaea", marginTop: "40px" }}>
          
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px dashed #eaeaea", paddingBottom: "15px", marginBottom: "20px" }}>
            <h3 style={{ margin: 0, fontSize: "18px", color: "#1a1a1a" }}>Your Bill</h3>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#F25C05" }}>
              ${Number(order.total_amount).toFixed(2)}
            </span>
          </div>

          <p style={{ margin: "0 0 15px 0", fontSize: "14px", fontWeight: "600", color: "#777" }}>Select Payment Method</p>
          
          <div className="payment-grid" style={{ marginBottom: "25px" }}>
            <div className={`payment-option ${paymentMethod === "card" ? "active" : ""}`} onClick={() => setPaymentMethod("card")}>
              <span className="pay-icon">💳</span><span className="pay-label">Card</span>
            </div>
            <div className={`payment-option ${paymentMethod === "apple" ? "active" : ""}`} onClick={() => setPaymentMethod("apple")}>
              <span className="pay-icon"></span><span className="pay-label">Apple Pay</span>
            </div>
            <div className={`payment-option ${paymentMethod === "google" ? "active" : ""}`} onClick={() => setPaymentMethod("google")}>
              <span className="pay-icon">G</span><span className="pay-label">Google Pay</span>
            </div>
            <div className={`payment-option ${paymentMethod === "cash" ? "active" : ""}`} onClick={() => setPaymentMethod("cash")}>
              <span className="pay-icon">💵</span><span className="pay-label">Cash</span>
            </div>
          </div>

          <button className="place-order-btn" onClick={handlePayBill} style={{ width: "100%", padding: "16px", borderRadius: "30px", background: "#1a1a1a", color: "white", border: "none", fontSize: "16px", fontWeight: "700", cursor: "pointer" }}>
            {paymentMethod === "cash" ? "Call Waiter to Pay Cash" : `Pay $${Number(order.total_amount).toFixed(2)}`}
          </button>
        </div>
      )}

      {/* ✅ NEW: SUCCESS MESSAGE AFTER PAYMENT */}
      {hasPaid && (
        <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "24px", padding: "24px", animation: "fadeUp 0.4s ease", marginTop: "40px" }}>
          <div style={{ fontSize: "40px", marginBottom: "10px" }}>🎉</div>
          <h3 style={{ margin: "0 0 8px 0", color: "#15803d", fontSize: "20px" }}>Payment Successful!</h3>
          <p style={{ margin: 0, color: "#166534", fontSize: "14px", lineHeight: "1.5" }}>
            Thank you so much for dining with us! Your bill has been settled. Have a wonderful day.
          </p>
        </div>
      )}

    </div>
  );
}