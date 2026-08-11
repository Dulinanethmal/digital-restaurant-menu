import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Smartphone, Zap, Paintbrush, BarChart3, CheckCircle, ArrowRight,
  Menu, X, UtensilsCrossed, Coffee, Pizza, Beef, Salad, IceCream, Wine,
  Star, Clock, Bell, ChefHat, Sun, Moon
} from 'lucide-react';
import './LandingPage.css';

/* ---------------------------------------------------------
   Scroll-reveal wrapper — same easing/motion as the hero's
   .animate-up, but triggered on scroll instead of on mount.
---------------------------------------------------------- */
function Reveal({ children, delay = 0, className = '', as: Tag = 'div' }) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${inView ? 'in-view' : ''} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </Tag>
  );
}

const THEME_KEY = 'dineflow_theme';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Default to dark (the brand's native look); respect a saved choice if present.
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') return 'dark';
    return localStorage.getItem(THEME_KEY) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = () => setTheme((t) => (t === 'dark' ? 'light' : 'dark'));

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = mobileMenuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileMenuOpen]);

  const scrollToSection = (id) => {
    setMobileMenuOpen(false);
    // rAF so the mobile menu has closed (and layout settled) before measuring
    requestAnimationFrame(() => {
      const el = document.getElementById(id);
      if (!el) return;
      const navOffset = 110; // clears the fixed pill navbar
      const top = el.getBoundingClientRect().top + window.scrollY - navOffset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  };

  const restaurantTypes = [
    { icon: Coffee, label: 'Cafés & Coffee Shops' },
    { icon: UtensilsCrossed, label: 'Fine Dining' },
    { icon: Pizza, label: 'Quick Service' },
    { icon: Wine, label: 'Bars & Pubs' },
    { icon: Salad, label: 'Casual Dining' },
    { icon: IceCream, label: 'Dessert Bars' },
  ];

  const testimonials = [
    { name: 'Maria Chen', role: 'Owner, Golden Wok', quote: 'DineFlow cut our wait times by 40%. Guests order the second they sit down.', avatar: 'MC' },
    { name: 'Daniel Silva', role: 'GM, Casa Nova', quote: 'The branded QR menu makes us look like a much bigger operation than we are.', avatar: 'DS' },
    { name: 'Priya Nair', role: 'Owner, Spice Route', quote: 'Setup took twenty minutes. We were taking live orders the same afternoon.', avatar: 'PN' },
  ];

  return (
    <div className={`landing-page ${theme === 'light' ? 'light' : ''}`}>

      {/* FLOATING GLASS NAVBAR */}
      <div className="navbar-wrapper">
        <nav className={`navbar ${scrolled ? 'navbar-scrolled' : ''}`}>
          <div className="nav-brand">
            <div className="nav-logo-mark">
              <UtensilsCrossed size={18} />
            </div>
            <span className="nav-word">DineFlow</span>
            <span className="nav-tagline">Run Your Restaurant Smarter</span>
          </div>

          <div className="nav-links">
            <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
            <a href="#types" onClick={(e) => { e.preventDefault(); scrollToSection('types'); }}>Restaurant Types</a>
            <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</a>
            <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a>
          </div>

          <div className="nav-actions">
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
              title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
            </button>
            <Link to="/login" className="btn-login nav-login-desktop">Login</Link>
            <Link to="/register" className="btn-primary btn-glow">Get Started</Link>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-label="Toggle menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </nav>

        {/* MOBILE MENU PANEL */}
        <div className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`}>
          <a href="#features" onClick={(e) => { e.preventDefault(); scrollToSection('features'); }}>Features</a>
          <a href="#types" onClick={(e) => { e.preventDefault(); scrollToSection('types'); }}>Restaurant Types</a>
          <a href="#how-it-works" onClick={(e) => { e.preventDefault(); scrollToSection('how-it-works'); }}>How It Works</a>
          <a href="#pricing" onClick={(e) => { e.preventDefault(); scrollToSection('pricing'); }}>Pricing</a>
          <div className="mobile-menu-theme-row">
            <span>Theme</span>
            <button
              className="theme-toggle-btn"
              onClick={toggleTheme}
              aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
            </button>
          </div>
          <div className="mobile-menu-actions">
            <Link to="/login" className="btn-login" onClick={() => setMobileMenuOpen(false)}>Login</Link>
            <Link to="/register" className="btn-primary btn-glow" onClick={() => setMobileMenuOpen(false)}>Get Started</Link>
          </div>
        </div>
      </div>

      {/* HERO SECTION WITH ENTRANCE ANIMATIONS */}
      <header className="hero">
        <div className="hero-content">
          <h1 className="hero-title animate-up delay-1">
            The Smartest QR Menu &amp; Ordering System for <span className="text-gold">Modern Restaurants</span>
          </h1>
          <p className="hero-subtitle animate-up delay-2">
            Take orders, manage your kitchen, and customize your brand—all in one place. No hardware required. Setup in minutes.
          </p>
          <div className="hero-buttons animate-up delay-3">
            <Link to="/register" className="btn-primary btn-large btn-glow" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              Start Your Free Trial <ArrowRight size={20} />
            </Link>
          </div>
          <div className="hero-types animate-up delay-3">
            <span className="hero-types-label">Built for every kind of kitchen</span>
            <div className="hero-types-icons">
              <Coffee size={16} /> <UtensilsCrossed size={16} /> <Pizza size={16} /> <Wine size={16} /> <Salad size={16} />
            </div>
          </div>
        </div>

        {/* RESTAURANT-THEMED 3D MOCKUPS */}
        <div className="hero-visual animate-up delay-4">
          {/* Kitchen / order dashboard mockup */}
          <div className="mockup-dashboard">
            <div className="dash-sidebar">
              <div className="dash-sidebar-icon active"><ChefHat size={16} /></div>
              <div className="dash-sidebar-icon"><BarChart3 size={16} /></div>
              <div className="dash-sidebar-icon"><Bell size={16} /></div>
            </div>
            <div className="dash-main">
              <div className="dash-header">
                <span className="dash-header-label">Today&rsquo;s Revenue</span>
                <span className="dash-header-value">$2,840</span>
              </div>
              <div className="dash-tickets">
                <div className="ticket ticket-preparing">
                  <div className="ticket-top"><span>Table 4</span><span className="ticket-time"><Clock size={11} /> 4m</span></div>
                  <div className="ticket-items">2× Margherita Pizza</div>
                  <span className="ticket-status">Preparing</span>
                </div>
                <div className="ticket ticket-new">
                  <div className="ticket-top"><span>Table 9</span><span className="ticket-time"><Clock size={11} /> 1m</span></div>
                  <div className="ticket-items">1× Grilled Salmon</div>
                  <span className="ticket-status">New Order</span>
                </div>
                <div className="ticket ticket-ready">
                  <div className="ticket-top"><span>Takeaway</span><span className="ticket-time"><Clock size={11} /> 8m</span></div>
                  <div className="ticket-items">1× Iced Latte</div>
                  <span className="ticket-status">Ready</span>
                </div>
              </div>
            </div>
          </div>

          {/* QR ordering menu mockup */}
          <div className="mockup-mobile">
            <div className="menu-banner">
              <span className="menu-banner-title">DineFlow Menu</span>
            </div>
            <div className="menu-body">
              <div className="menu-item">
                <div className="menu-item-icon"><Pizza size={18} /></div>
                <div className="menu-item-info">
                  <span className="menu-item-name">Margherita Pizza</span>
                  <span className="menu-item-price">$12.00</span>
                </div>
              </div>
              <div className="menu-item">
                <div className="menu-item-icon"><Salad size={18} /></div>
                <div className="menu-item-info">
                  <span className="menu-item-name">Garden Salad</span>
                  <span className="menu-item-price">$8.50</span>
                </div>
              </div>
              <div className="menu-item">
                <div className="menu-item-icon"><Coffee size={18} /></div>
                <div className="menu-item-info">
                  <span className="menu-item-name">Iced Latte</span>
                  <span className="menu-item-price">$5.00</span>
                </div>
              </div>
              <div className="menu-cta">View Cart · $25.50</div>
            </div>
          </div>
        </div>
      </header>

      {/* RESTAURANT TYPES SECTION */}
      <section id="types" className="section">
        <Reveal as="h2" className="section-title">Built for every kind of restaurant</Reveal>
        <Reveal as="p" className="section-subtitle" delay={80}>
          Whether it&rsquo;s three tables or thirty, DineFlow adapts to how you serve.
        </Reveal>
        <div className="types-grid">
          {restaurantTypes.map((type, i) => (
            <Reveal key={type.label} delay={i * 70} className="type-card-wrap">
              <div className="type-card">
                <div className="type-icon"><type.icon size={24} /></div>
                <span>{type.label}</span>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section id="features" className="section">
        <Reveal as="h2" className="section-title">Everything you need to scale</Reveal>
        <Reveal as="p" className="section-subtitle" delay={80}>
          Powerful tools built specifically for restaurant owners.
        </Reveal>

        <div className="features-grid">
          <Reveal delay={0} className="feature-card">
            <div className="feature-icon-wrapper"><Smartphone size={24} /></div>
            <h3 className="feature-title">Frictionless QR Ordering</h3>
            <p className="feature-desc">Customers scan and order instantly from their phones. No app downloads required.</p>
          </Reveal>

          <Reveal delay={100} className="feature-card">
            <div className="feature-icon-wrapper"><Zap size={24} /></div>
            <h3 className="feature-title">Real-Time Live Kitchen</h3>
            <p className="feature-desc">Orders pop up on the dashboard instantly. Track status from "Pending" to "Served."</p>
          </Reveal>

          <Reveal delay={200} className="feature-card">
            <div className="feature-icon-wrapper"><Paintbrush size={24} /></div>
            <h3 className="feature-title">Customizable Branding</h3>
            <p className="feature-desc">Upload your own logo, banner, and colors to make the menu feel like your own app.</p>
          </Reveal>

          <Reveal delay={300} className="feature-card">
            <div className="feature-icon-wrapper"><BarChart3 size={24} /></div>
            <h3 className="feature-title">Analytics &amp; Reports</h3>
            <p className="feature-desc">Built-in tracking so owners can instantly see revenue and identify popular items.</p>
          </Reveal>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how-it-works" className="section how-it-works-section">
        <Reveal as="h2" className="section-title">Start taking orders today</Reveal>
        <Reveal as="p" className="section-subtitle" delay={80}>
          Three simple steps to modernize your workflow.
        </Reveal>

        <div className="steps-container">
          <Reveal delay={0} className="step-card">
            <div className="step-number">1</div>
            <h3 className="feature-title">Setup</h3>
            <p className="feature-desc">Create your shop profile, upload your branding, and quickly add your menu items.</p>
          </Reveal>
          <Reveal delay={120} className="step-card">
            <div className="step-number">2</div>
            <h3 className="feature-title">Generate</h3>
            <p className="feature-desc">Print the automatically generated QR codes and place them on your tables.</p>
          </Reveal>
          <Reveal delay={240} className="step-card">
            <div className="step-number">3</div>
            <h3 className="feature-title">Profit</h3>
            <p className="feature-desc">Watch live orders roll into your dashboard as customers order seamlessly.</p>
          </Reveal>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section className="section">
        <Reveal as="h2" className="section-title">Loved by restaurant owners</Reveal>
        <Reveal as="p" className="section-subtitle" delay={80}>
          Real kitchens, real results.
        </Reveal>
        <div className="testimonial-grid">
          {testimonials.map((tm, i) => (
            <Reveal key={tm.name} delay={i * 100} className="testimonial-card">
              <div className="testimonial-stars">
                {Array.from({ length: 5 }).map((_, j) => <Star key={j} size={14} fill="#eeb400" color="#eeb400" />)}
              </div>
              <p className="testimonial-quote">&ldquo;{tm.quote}&rdquo;</p>
              <div className="testimonial-author">
                <div className="testimonial-avatar">{tm.avatar}</div>
                <div>
                  <div className="testimonial-name">{tm.name}</div>
                  <div className="testimonial-role">{tm.role}</div>
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PRICING SECTION */}
      <section id="pricing" className="section">
        <Reveal as="h2" className="section-title">Simple, transparent pricing</Reveal>
        <Reveal as="p" className="section-subtitle" delay={80}>
          No hidden fees. Cancel anytime.
        </Reveal>

        <div className="pricing-grid">
          {/* STARTER TIER */}
          <Reveal delay={0} className="pricing-card">
            <h3 className="tier-name">Starter</h3>
            <div className="tier-price">$29<span>/mo</span></div>
            <p style={{ color: 'var(--df-text-faint)', marginBottom: '24px' }}>Great for small cafes and food trucks.</p>
            <ul className="pricing-features">
              <li><CheckCircle size={18} color="#eeb400" /> Up to 50 orders / day</li>
              <li><CheckCircle size={18} color="#eeb400" /> Basic Menu Management</li>
              <li><CheckCircle size={18} color="#eeb400" /> Standard QR Generation</li>
              <li><CheckCircle size={18} color="#eeb400" /> Email Support</li>
            </ul>
            <Link to="/register" className="btn-login" style={{ textAlign: 'center', padding: '12px', border: '1px solid var(--df-border-strong)', borderRadius: '8px' }}>Start Free Trial</Link>
          </Reveal>

          {/* PRO TIER */}
          <Reveal delay={120} className="pricing-card pro">
            <div className="popular-badge">Most Popular</div>
            <h3 className="tier-name">Pro</h3>
            <div className="tier-price">$79<span>/mo</span></div>
            <p style={{ color: 'var(--df-text-faint)', marginBottom: '24px' }}>Everything you need to scale your restaurant.</p>
            <ul className="pricing-features">
              <li><CheckCircle size={18} color="#eeb400" /> <b>Unlimited</b> orders</li>
              <li><CheckCircle size={18} color="#eeb400" /> Full Custom Branding (Logo &amp; Banner)</li>
              <li><CheckCircle size={18} color="#eeb400" /> Advanced Analytics &amp; Reports</li>
              <li><CheckCircle size={18} color="#eeb400" /> Table &amp; Staff Management</li>
              <li><CheckCircle size={18} color="#eeb400" /> Priority 24/7 Support</li>
            </ul>
            <Link to="/register" className="btn-primary btn-glow" style={{ textAlign: 'center' }}>Get DineFlow Pro</Link>
          </Reveal>
        </div>
      </section>

      {/* FINAL CTA & FOOTER */}
      <Reveal as="section" className="final-cta">
        <h2 style={{ fontSize: '40px', marginBottom: '24px' }}>Ready to modernize your restaurant?</h2>
        <p style={{ color: 'var(--df-text-muted)', marginBottom: '40px', fontSize: '18px' }}>Join hundreds of restaurants running smarter with DineFlow.</p>
        <Link to="/register" className="btn-primary btn-large btn-glow">Start Your Free Trial</Link>
      </Reveal>

      <footer className="footer">
        <div>© 2026 DineFlow. All rights reserved.</div>
        <div className="footer-links">
          <a href="mailto:hello@dineflow.com">Contact: hello@dineflow.com</a>
          <a href="#">Terms of Service</a>
          <a href="#">Privacy Policy</a>
        </div>
      </footer>

    </div>
  );
}