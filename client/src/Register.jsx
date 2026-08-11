import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import supabase from "./supabase";
import "./Register.css";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");

  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  async function handleRegister(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      // 1. Create the User Account in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (authError) throw authError;

      const userId = authData.user?.id;
      if (!userId) throw new Error("Failed to create user account.");

      // 2. Create the brand new Shop in the database
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .insert([{ shop_name: shopName }])
        .select()
        .single(); // Ask Supabase to return the newly created row

      if (shopError) throw shopError;
      const shopId = shopData.id;

      // 3. Link the User to the Shop in the 'profiles' table
      const { error: profileError } = await supabase
        .from("profiles")
        .upsert({
          id: userId,
          shop_id: shopId,
        });

      if (profileError) throw profileError;

      // 4. Save the session data so the Admin panel knows who they are
      const sessionData = {
        user_id: userId,
        shop_id: shopId,
      };
      localStorage.setItem("custom_session", JSON.stringify(sessionData));

      // 5. Redirect instantly to the Role Selection page!
      navigate("/first");
    } catch (error) {
      console.error(error);
      setErrorMsg(error.message || "An error occurred during registration.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="register-container">
      {/* Ambient brand glow, matches the hero background on the landing page */}
      <div className="register-glow" aria-hidden="true" />

      <div className="register-wrap animate-up delay-1">
        <Link to="/" className="register-brand">
          <div className="register-brand-mark">
            <UtensilsCrossed size={18} />
          </div>
          <span className="register-brand-word">DineFlow</span>
        </Link>

        <form onSubmit={handleRegister} className="register-card">
          <h2 className="register-title">Get Started</h2>
          <div className="register-subtitle">Set up your restaurant in seconds</div>

          {errorMsg && <div className="register-error">{errorMsg}</div>}

          {/* ACCOUNT DETAILS */}
          <div className="register-section-title">1. Account Details</div>

          <div className="register-field">
            <label className="register-label">Email Address</label>
            <input
              type="email"
              className="register-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@restaurant.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="register-field">
            <label className="register-label">Password</label>
            <input
              type="password"
              className="register-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a strong password"
              minLength={6}
              autoComplete="new-password"
              required
            />
          </div>

          {/* RESTAURANT DETAILS */}
          <div className="register-section-title">2. Restaurant Details</div>

          <div className="register-field">
            <label className="register-label">Restaurant Name</label>
            <input
              type="text"
              className="register-input"
              value={shopName}
              onChange={(e) => setShopName(e.target.value)}
              placeholder="e.g. Your Shop Name"
              autoComplete="organization"
              required
            />
          </div>

          <button type="submit" className="register-button" disabled={loading}>
            {loading ? "Creating your system..." : "Create Account & Shop"}
          </button>

          <div className="register-footer-links">
            Already have an account? <Link to="/login">Sign In</Link>
          </div>
        </form>

        <Link to="/" className="register-back">← Back to DineFlow</Link>
      </div>
    </div>
  );
}