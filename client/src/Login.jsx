import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { UtensilsCrossed } from "lucide-react";
import supabase from "./supabase";
import "./Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const navigate = useNavigate();

  async function handleLogin(e) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    // 1. Log into Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      setErrorMsg(authError.message);
      setLoading(false);
      return;
    }

    // 2. Fetch the user's profile to get their specific shop_id
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("shop_id")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profileData?.shop_id) {
      setErrorMsg("No shop assigned to this user. Contact support.");
      await supabase.auth.signOut();
      setLoading(false);
      return;
    }

    // 3. Save the shop_id so the Admin panel knows which data to load
    const sessionData = {
      user_id: authData.user.id,
      shop_id: profileData.shop_id,
    };

    localStorage.setItem("custom_session", JSON.stringify(sessionData));

    // 4. Send them to the Role Selection page!
    navigate("/first");
  }

  return (
    <div className="login-container">
      {/* Ambient brand glow, matches the hero background on the landing page */}
      <div className="login-glow" aria-hidden="true" />

      <div className="login-wrap animate-up delay-1">
        <Link to="/" className="login-brand">
          <div className="login-brand-mark">
            <UtensilsCrossed size={18} />
          </div>
          <span className="login-brand-word">DineFlow</span>
        </Link>

        <form onSubmit={handleLogin} className="login-card">
          <h2 className="login-title">Admin Access</h2>
          <div className="login-subtitle">Sign in to manage your restaurant</div>

          {errorMsg && <div className="login-error">{errorMsg}</div>}

          <div className="login-field">
            <label className="login-label">Email</label>
            <input
              type="email"
              className="login-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@restaurant.com"
              autoComplete="email"
              required
            />
          </div>

          <div className="login-field">
            <label className="login-label">Password</label>
            <input
              type="password"
              className="login-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
            />
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? "Authenticating..." : "Sign In"}
          </button>

          <div className="login-footer-links">
            New to DineFlow? <Link to="/register">Create an account</Link>
          </div>
        </form>

        <Link to="/" className="login-back">← Back to DineFlow</Link>
      </div>
    </div>
  );
}