import { useEffect, useState } from "react";
import supabase from "./supabase";

export default function PaymentSettings({ showToast }) {
  const [paymentFlow, setPaymentFlow] = useState("before");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  async function fetchSettings() {
    setLoading(true);

    const { data } = await supabase.from("shop_settings").select("*").limit(1).maybeSingle();
    
    if (data && data.payment_flow) {
      setPaymentFlow(data.payment_flow);
    }
    setLoading(false);
  }

  async function updatePaymentFlow(newFlow) {
    // Optimistic UI update
    setPaymentFlow(newFlow);

    // ✅ Now we target the row by checking the "description" instead of an "id"
    const { error } = await supabase
      .from("shop_settings")
      .update({ payment_flow: newFlow })
      .not("description", "is", null); 

    if (error) {
      console.error("Failed to save setting:", error);
      showToast("Failed to save payment setting. Check database connection.", true);
    } else {
      showToast(`Payment flow updated to: Pay ${newFlow === 'before' ? 'Before' : 'After'} Preparation`);
    }
  }

  if (loading) {
    return <div style={{ padding: "40px", color: "#777" }}>Loading payment settings...</div>;
  }

  return (
    <div style={{ maxWidth: "800px", animation: "fadeIn 0.3s ease" }}>
      <div className="section-card" style={{ padding: "30px" }}>
        
        <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: "24px", color: "#1a1a1a", marginBottom: "8px" }}>
          Payment Flow Options
        </h2>
        <p style={{ color: "#777", fontSize: "14px", marginBottom: "30px" }}>
          Choose when your customers are required to pay for their orders.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* OPTION 1: PAY BEFORE */}
          <div 
            onClick={() => updatePaymentFlow("before")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "20px",
              padding: "24px",
              borderRadius: "16px",
              border: `2px solid ${paymentFlow === "before" ? "#F4B400" : "#eaeaea"}`,
              backgroundColor: paymentFlow === "before" ? "rgba(244, 180, 0, 0.05)" : "#fff",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{
              width: "24px", height: "24px", borderRadius: "50%", border: `6px solid ${paymentFlow === "before" ? "#F4B400" : "#eaeaea"}`, flexShrink: 0, marginTop: "2px"
            }} />
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#1a1a1a", fontWeight: "600" }}>
                Pay Before Preparation
              </h3>
              <p style={{ margin: 0, color: "#777", fontSize: "13px", lineHeight: "1.5" }}>
                Customers must complete their payment before the kitchen receives and starts preparing the order. Best for quick-service and digital menus.
              </p>
            </div>
          </div>

          {/* OPTION 2: PAY AFTER */}
          <div 
            onClick={() => updatePaymentFlow("after")}
            style={{
              display: "flex",
              alignItems: "flex-start",
              gap: "20px",
              padding: "24px",
              borderRadius: "16px",
              border: `2px solid ${paymentFlow === "after" ? "#F4B400" : "#eaeaea"}`,
              backgroundColor: paymentFlow === "after" ? "rgba(244, 180, 0, 0.05)" : "#fff",
              cursor: "pointer",
              transition: "all 0.2s"
            }}
          >
            <div style={{
              width: "24px", height: "24px", borderRadius: "50%", border: `6px solid ${paymentFlow === "after" ? "#F4B400" : "#eaeaea"}`, flexShrink: 0, marginTop: "2px"
            }} />
            <div>
              <h3 style={{ margin: "0 0 8px 0", fontSize: "16px", color: "#1a1a1a", fontWeight: "600" }}>
                Pay After Preparation (Dine-in Style)
              </h3>
              <p style={{ margin: 0, color: "#777", fontSize: "13px", lineHeight: "1.5" }}>
                The order is sent immediately to the kitchen. Customers will eat first and pay their bill at the end of their meal.
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}