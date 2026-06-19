import { useEffect, useState } from "react";
import supabase from "./supabase";

// 1. IMPORT ALL 4 CRISP LOTTIE ANIMATIONS
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

  useEffect(() => {
    if (!orderId) return;

    async function checkOrderStatus() {
      const { data, error } = await supabase.from("orders").select("*").eq("id", orderId).single();
      if (data) setOrder(data);
      if (error) console.error("Error fetching order:", error);
    }
    
    checkOrderStatus();

    // Silently syncs with the database every 3 seconds
    const syncTimer = setInterval(() => {
      checkOrderStatus();
    }, 3000);

    return () => clearInterval(syncTimer);
  }, [orderId]);

  if (!order) {
    return <div style={{ flex: 1, display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>Loading your live tracking details...</div>;
  }

  const currentStepIndex = STATUS_STEPS.indexOf(order.status);
  const details = STATUS_DETAILS[order.status] || STATUS_DETAILS.Pending;

  // Helper function to pick the right animation file
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
    <div style={{ flex: 1, backgroundColor: "var(--surface-color)", borderRadius: "var(--border-radius-lg)", padding: "40px", boxShadow: "var(--shadow-sm)", textAlign: "center", position: "relative" }}>
      
      <div style={{ position: "absolute", top: "20px", right: "20px", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#16A34A", fontWeight: "bold" }}>
        <div style={{ width: "8px", height: "8px", borderRadius: "50%", backgroundColor: "#16A34A", animation: "pulse 2s infinite" }} />
        LIVE SYNCING
      </div>

      <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: "20px" }}>
        <button className="btn-ghost" onClick={onBack} style={{ display: "flex", alignItems: "center", gap: "8px", border: "none", background: "none", cursor: "pointer", fontWeight: "600" }}>
          <span>←</span> Back to Menu
        </button>
      </div>

      <h2 style={{ fontFamily: "Georgia, serif", fontSize: "2rem", color: "var(--text-dark)", marginBottom: "8px" }}>
        Order #{String(order.id).slice(0, 4).toUpperCase()}
      </h2>
      <p style={{ color: "var(--text-muted)", marginBottom: "40px" }}>Table {order.table_number} • {order.customer_name}</p>

      {/* 2. UNIFORM LARGE VECTOR ANIMATION CONTAINER */}
      <div 
        style={{ 
          width: "280px",   /* Extra large, perfectly square container */
          height: "280px",  
          margin: "0 auto 20px auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}
      >
        <Player
          autoplay
          loop
          src={getAnimationForStatus(order.status)}
          style={{ width: "100%", height: "100%" }}
        />
      </div>
      
      <h3 style={{ fontSize: "1.5rem", color: "var(--text-dark)", marginBottom: "8px" }}>{details.title}</h3>
      <p style={{ color: "var(--text-muted)", marginBottom: "50px", maxWidth: "400px", margin: "0 auto 50px auto" }}>
        {details.desc}
      </p>

      {/* PROGRESS BAR */}
      <div className="progress-container">
        {STATUS_STEPS.map((step, index) => {
          const isActive = index === currentStepIndex;
          const isCompleted = index <= currentStepIndex;
          
          return (
            <div key={step} className="progress-step-wrapper">
              <div className={`progress-dot ${isCompleted ? "completed" : ""} ${isActive ? "active" : ""}`}>
                {isCompleted ? "✓" : index + 1}
              </div>
              <div className={`progress-label ${isActive ? "active-label" : ""}`}>{step}</div>
              
              {index < STATUS_STEPS.length - 1 && (
                <div className={`progress-line ${index < currentStepIndex ? "completed-line" : ""}`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}