import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Smartphone, Zap, Paintbrush, BarChart3, CheckCircle, ArrowRight } from 'lucide-react';
import './LandingPage.css';
import logoImage from './assets/logo.png'; 

export default function LandingPage() {
  
  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="landing-page">
      
      {/* FLOATING GLASS NAVBAR */}
      <div className="navbar-wrapper">
        <nav className="navbar">
          <div className="nav-brand">
            <img src={logoImage} alt="DineFlow Logo" className="nav-logo-img" />
            <span className="nav-tagline">Run Your Restaurant Smarter</span>
          </div>
          
          <div className="nav-links">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a>
          </div>

          <div className="nav-actions">
            <Link to="/login" className="btn-login">Login</Link>
            <Link to="/register" className="btn-primary btn-glow">Get Started</Link>
          </div>
        </nav>
      </div>

      {/* HERO SECTION WITH ENTRANCE ANIMATIONS */}
      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title animate-up delay-1">
            The Smartest QR Menu & Ordering System for <span className="text-gold">Modern Restaurants</span>
          </h1>
          <p className="hero-subtitle animate-up delay-2">
            Take orders, manage your kitchen, and customize your brand—all in one place. No hardware required. Setup in minutes.
          </p>
          <div className="hero-buttons animate-up delay-3">
            <Link to="/register" className="btn-primary btn-large btn-glow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Start Your Free Trial <ArrowRight size={20} />
            </Link>
          </div>
        </div>

        {/* UPGRADED 3D CSS MOCKUPS */}
        <div className="hero-visual animate-up delay-4">
          <div className="mockup-dashboard">
            <div style={{ width: '60px', background: '#111', borderRight: '1px solid #222' }}></div>
            <div style={{ flex: 1, padding: '24px', background: '#0a0a0a' }}>
              <div style={{ height: '24px', width: '180px', background: '#222', borderRadius: '6px', marginBottom: '24px' }}></div>
              <div style={{ display: 'flex', gap: '16px', marginBottom: '24px' }}>
                 <div style={{ flex: 1, height: '80px', background: 'rgba(238, 180, 0, 0.15)', borderRadius: '12px', border: '1px solid rgba(238, 180, 0, 0.5)' }}></div>
                 <div style={{ flex: 1, height: '80px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #222' }}></div>
                 <div style={{ flex: 1, height: '80px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #222' }}></div>
              </div>
              <div style={{ height: '120px', background: '#1a1a1a', borderRadius: '12px', border: '1px solid #222' }}></div>
            </div>
          </div>
          <div className="mockup-mobile">
            <div style={{ height: '120px', background: 'linear-gradient(135deg, #eeb400 0%, #b8860b 100%)', borderRadius: '24px 24px 0 0' }}></div>
            <div style={{ padding: '24px', background: '#111', height: '100%' }}>
              <div style={{ height: '16px', width: '70%', background: '#333', borderRadius: '8px', marginBottom: '24px' }}></div>
              <div style={{ height: '70px', background: '#1a1a1a', borderRadius: '16px', marginBottom: '16px', border: '1px solid #222' }}></div>
              <div style={{ height: '70px', background: '#1a1a1a', borderRadius: '16px', border: '1px solid #222' }}></div>
            </div>
          </div>
        </div>
      </header>

      {/* FEATURES SECTION */}
      <section id="features" className="section">
        <h2 className="section-title">Everything you need to scale</h2>
        <p className="section-subtitle">Powerful tools built specifically for restaurant owners.</p>
        
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Smartphone size={24} /></div>
            <h3 className="feature-title">Frictionless QR Ordering</h3>
            <p className="feature-desc">Customers scan and order instantly from their phones. No app downloads required.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Zap size={24} /></div>
            <h3 className="feature-title">Real-Time Live Kitchen</h3>
            <p className="feature-desc">Orders pop up on the dashboard instantly. Track status from "Pending" to "Served."</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper"><Paintbrush size={24} /></div>
            <h3 className="feature-title">Customizable Branding</h3>
            <p className="feature-desc">Upload your own logo, banner, and colors to make the menu feel like your own app.</p>
          </div>
          
          <div className="feature-card">
            <div className="feature-icon-wrapper"><BarChart3 size={24} /></div>
            <h3 className="feature-title">Analytics & Reports</h3>
            <p className="feature-desc">Built-in tracking so owners can instantly see revenue and identify popular items.</p>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section" style={{ background: '#0a0a0a', borderRadius: '32px' }}>
        <h2 className="section-title">Start taking orders today</h2>
        <p className="section-subtitle">Three simple steps to modernize your workflow.</p>
        
        <div className="steps-container">
          <div className="step-card">
            <div className="step-number">1</div>
            <h3 className="feature-title">Setup</h3>
            <p className="feature-desc">Create your shop profile, upload your branding, and quickly add your menu items.</p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h3 className="feature-title">Generate</h3>
            <p className="feature-desc">Print the automatically generated QR codes and place them on your tables.</p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h3 className="feature-title">Profit</h3>
            <p className="feature-desc">Watch live orders roll into your dashboard as customers order seamlessly.</p>
          </div>
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="section">
        <h2 className="section-title">Simple, transparent pricing</h2>
        <p className="section-subtitle">No hidden fees. Cancel anytime.</p>
        
        <div className="pricing-grid">
          {/* STARTER TIER */}
          <div className="pricing-card">
            <h3 className="tier-name">Starter</h3>
            <div className="tier-price">$29<span>/mo</span></div>
            <p style={{ color: '#888', marginBottom: '24px' }}>Great for small cafes and food trucks.</p>
            <ul className="pricing-features">
              <li><CheckCircle size={18} color="#eeb400" /> Up to 50 orders / day</li>
              <li><CheckCircle size={18} color="#eeb400" /> Basic Menu Management</li>
              <li><CheckCircle size={18} color="#eeb400" /> Standard QR Generation</li>
              <li><CheckCircle size={18} color="#eeb400" /> Email Support</li>
            </ul>
            <Link to="/register" className="btn-login" style={{ textAlign: 'center', padding: '12px', border: '1px solid #333', borderRadius: '8px' }}>Start Free Trial</Link>
          </div>

          {/* PRO TIER */}
          <div className="pricing-card pro">
            <div className="popular-badge">Most Popular</div>
            <h3 className="tier-name">Pro</h3>
            <div className="tier-price">$79<span>/mo</span></div>
            <p style={{ color: '#888', marginBottom: '24px' }}>Everything you need to scale your restaurant.</p>
            <ul className="pricing-features">
              <li><CheckCircle size={18} color="#eeb400" /> <b>Unlimited</b> orders</li>
              <li><CheckCircle size={18} color="#eeb400" /> Full Custom Branding (Logo & Banner)</li>
              <li><CheckCircle size={18} color="#eeb400" /> Advanced Analytics & Reports</li>
              <li><CheckCircle size={18} color="#eeb400" /> Table & Staff Management</li>
              <li><CheckCircle size={18} color="#eeb400" /> Priority 24/7 Support</li>
            </ul>
            <Link to="/register" className="btn-primary btn-glow" style={{ textAlign: 'center' }}>Get DineFlow Pro</Link>
          </div>
        </div>
      </section>

      {/* FINAL CTA & FOOTER */}
      <section className="final-cta">
        <h2 style={{ fontSize: '40px', marginBottom: '24px' }}>Ready to modernize your restaurant?</h2>
        <p style={{ color: '#a3a3a3', marginBottom: '40px', fontSize: '18px' }}>Join hundreds of restaurants running smarter with DineFlow.</p>
        <Link to="/register" className="btn-primary btn-large btn-glow">Start Your Free Trial</Link>
      </section>

      <footer className="footer">
        <div>© 2026 DineFlow. All rights reserved.</div>
        <div className="footer-links">
          <a href="#">Contact: hello@dineflow.com</a>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
      </footer>

    </div>
  );
}