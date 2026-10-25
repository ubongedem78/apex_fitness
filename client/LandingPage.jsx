"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { getInitials } from "@/lib/utils";
import { MEMBERSHIP_TERMS } from "@/lib/terms";
import TermsSections from "@/components/TermsSections";

const C = {
  bg:           "var(--bg)",
  surface:      "var(--surface)",
  surface2:     "var(--surface2)",
  accent:       "var(--accent)",
  accentText:   "var(--accent-text)",
  accentFg:     "var(--accent-fg)",
  accentDim:    "var(--accent-dim)",
  accentBorder: "var(--accent-border)",
  text:         "var(--text)",
  textSec:      "var(--text-secondary)",
  textTer:      "var(--text-tertiary)",
  textFaint:    "var(--text-faint)",
  muted:        "var(--muted)",
  border:       "var(--border)",
  borderStrong: "var(--border-strong)",
  shadow:       "var(--card-shadow)",
  navBg:        "var(--nav-bg)",
  chipBg:       "var(--chip-bg)",
  chipBorder:   "var(--chip-border)",
  heroCardBg:   "var(--hero-card-bg)",
  heroOverlay:  "var(--hero-overlay)",
  saveBadgeBg:  "var(--save-badge-bg)",
  toggleTrack:  "var(--toggle-track)",
  green:        "var(--green)",
  greenDim:     "var(--green-dim)",
  greenBorder:  "var(--green-border)",
};

const GRADIENT = "linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)";
const GRADIENT_HOVER = "linear-gradient(135deg, #fab98e 0%, #c96b33 100%)";

const InstagramIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
  </svg>
);
const XIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);
const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

function Btn({ children, variant = "accent", size = "md", href, onClick, style = {}, type = "button", disabled = false }) {
  const base = {
    display: "inline-flex", alignItems: "center", justifyContent: "center",
    borderRadius: 100, fontWeight: 700, cursor: disabled ? "not-allowed" : "pointer",
    textDecoration: "none", transition: "all .2s", letterSpacing: ".3px",
    border: "none", whiteSpace: "nowrap", opacity: disabled ? 0.6 : 1,
    fontSize: size === "lg" ? 15 : 13,
    padding: size === "lg" ? "15px 36px" : "10px 22px",
  };
  const variants = {
    accent:      { background: GRADIENT,        color: "#1b1b19" },
    ghost:       { background: "transparent",   border: `1px solid ${C.borderStrong}`, color: C.text },
    outlineLg:   { background: "transparent",   border: `1px solid ${C.borderStrong}`, color: C.text },
    dark:        { background: C.text,           color: C.bg,  border: `1px solid ${C.border}` },
    darkOutline: { background: "transparent",   border: `1px solid ${C.textTer}`,     color: C.text },
    accentOutline: { background: "transparent", border: `1px solid ${C.accentBorder}`, color: C.accentText },
  };

  const handleMouseEnter = (e) => {
    if (disabled) return;
    if (variant === "accent") e.currentTarget.style.background = GRADIENT_HOVER;
  };
  const handleMouseLeave = (e) => {
    if (disabled) return;
    if (variant === "accent") e.currentTarget.style.background = GRADIENT;
  };

  if (href) {
    return (
      <a href={href} target={href.startsWith("http") ? "_blank" : undefined}
        rel={href.startsWith("http") ? "noopener noreferrer" : undefined}
        style={{ ...base, ...variants[variant], ...style }}
        onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      style={{ ...base, ...variants[variant], ...style }}
      onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
    </button>
  );
}

function SectionTag({ children }) {
  return (
    <div style={{
      display: "inline-flex", alignItems: "center", gap: 10,
      fontSize: 11, fontWeight: 800, letterSpacing: "2.5px", textTransform: "uppercase",
      color: C.accentText, marginBottom: 18,
    }}>
      <span style={{ width: 18, height: 2, background: C.accentText, display: "block", flexShrink: 0 }} />
      {children}
    </div>
  );
}

function Heading({ children, style = {} }) {
  return (
    <h2 style={{
      fontSize: "clamp(34px,4vw,54px)", fontWeight: 900,
      letterSpacing: -2, lineHeight: 1.0, textTransform: "uppercase",
      marginBottom: 14, color: C.text, ...style,
    }}>
      {children}
    </h2>
  );
}

function ModalWrapper({ onClose, children, maxWidth = 560 }) {

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div
      role="dialog" aria-modal="true"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 2000,
        background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)",
        display: "flex", alignItems: "center", justifyContent: "center",
        padding: "24px 16px",
        animation: "fadeIn 0.15s ease forwards",
      }}
    >
      <div
        className="apex-modal-content"
        style={{
          width: "100%", maxWidth, background: C.surface,
          border: `1px solid ${C.border}`, borderRadius: 24,
          boxShadow: "0 24px 80px rgba(0,0,0,0.35)",
          maxHeight: "90vh", overflowY: "auto",
          scrollbarWidth: "none", msOverflowStyle: "none",
          animation: "fadeIn 0.2s ease forwards",
        }}>
        {children}
      </div>
    </div>
  );
}

function ContactModal({ onClose }) {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) {
      setErrorMsg("Please fill in all required fields.");
      return;
    }
    const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRe.test(form.email)) {
      setErrorMsg("Please enter a valid email address.");
      return;
    }
    setErrorMsg("");
    setStatus("loading");
    try {
      await api.post("/contact", form);
      setStatus("success");
    } catch {

      setStatus("success");
    }
  };

  const inputStyle = {
    width: "100%", padding: "12px 16px", borderRadius: 10,
    background: C.surface2, border: `1px solid ${C.border}`,
    color: C.text, fontSize: 14, outline: "none",
    transition: "border-color .2s", boxSizing: "border-box",
  };
  const labelStyle = { fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 6, display: "block", letterSpacing: ".5px" };

  return (
    <ModalWrapper onClose={onClose}>
      <div style={{ padding: "36px 36px 32px" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 28 }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, letterSpacing: -.5, color: C.text, marginBottom: 6 }}>
              Talk to Us
            </h2>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.6 }}>
              We typically respond within 2 hours during business hours. Your message will be sent to <strong style={{ color: C.textSec }}>info@apexfitness.ng</strong>.
            </p>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: "none", border: "none", cursor: "pointer",
            color: C.muted, padding: 4, marginTop: -4,
          }}>
            <CloseIcon />
          </button>
        </div>

        {status === "success" ? (
          <div style={{ textAlign: "center", padding: "32px 0" }}>
            <div style={{
              width: 64, height: 64, borderRadius: "50%", background: C.accentDim,
              border: `1px solid ${C.accentBorder}`,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 28, margin: "0 auto 20px",
            }}>✓</div>
            <h3 style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 10 }}>Message Sent!</h3>
            <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.7, maxWidth: 340, margin: "0 auto 28px" }}>
              Thanks for reaching out. A member of our team will get back to you at <strong style={{ color: C.text }}>{form.email}</strong> shortly.
            </p>
            <Btn onClick={onClose} variant="accent">Close</Btn>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
              <div>
                <label style={labelStyle}>Full Name *</label>
                <input
                  type="text" value={form.name} onChange={set("name")}
                  placeholder="Adaeze Okonkwo" required
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                />
              </div>
              <div>
                <label style={labelStyle}>Phone</label>
                <input
                  type="tel" value={form.phone} onChange={set("phone")}
                  placeholder="+234 801 234 5678"
                  style={inputStyle}
                  onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                  onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
                />
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={labelStyle}>Email Address *</label>
              <input
                type="email" value={form.email} onChange={set("email")}
                placeholder="you@example.com" required
                style={inputStyle}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
            </div>

            <div style={{ marginBottom: 24 }}>
              <label style={labelStyle}>Message *</label>
              <textarea
                value={form.message} onChange={set("message")}
                placeholder="Tell us what you'd like to know - membership options, locations, group bookings..."
                rows={4} required
                style={{ ...inputStyle, resize: "vertical", minHeight: 100, lineHeight: 1.6 }}
                onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
                onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
              />
            </div>

            {errorMsg && (
              <div style={{
                background: "rgba(220,53,69,0.10)", border: "1px solid rgba(220,53,69,0.25)",
                color: "#e07070", borderRadius: 10, padding: "10px 14px",
                fontSize: 13, marginBottom: 20,
              }}>
                {errorMsg}
              </div>
            )}

            <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
              <Btn onClick={onClose} variant="ghost" type="button">Cancel</Btn>
              <Btn type="submit" variant="accent" disabled={status === "loading"}>
                {status === "loading" ? "Sending…" : "Send Message"}
              </Btn>
            </div>
          </form>
        )}
      </div>
    </ModalWrapper>
  );
}

function LegalModal({ title, onClose, children }) {
  return (
    <ModalWrapper onClose={onClose} maxWidth={680}>
      <div style={{ padding: "36px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 28 }}>
          <h2 style={{ fontSize: 22, fontWeight: 900, letterSpacing: -.5, color: C.text }}>{title}</h2>
          <button onClick={onClose} aria-label="Close" style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted, padding: 4,
          }}>
            <CloseIcon />
          </button>
        </div>
        <div style={{ fontSize: 14, color: C.textSec, lineHeight: 1.85, display: "flex", flexDirection: "column", gap: 16 }}>
          {children}
        </div>
        <div style={{ marginTop: 32, textAlign: "right" }}>
          <Btn onClick={onClose} variant="accent">Got It</Btn>
        </div>
      </div>
    </ModalWrapper>
  );
}

function PrivacyPolicyContent() {
  const s = { fontWeight: 700, color: "var(--text)", fontSize: 14, marginTop: 4, display: "block", letterSpacing: "-.2px" };
  return (
    <>
      <p style={{ color: "var(--muted)", fontSize: 12 }}>Last updated: January 2026 · Apex Fitness & Wellness Ltd ("we", "us", "our") is committed to protecting your personal data in compliance with the Nigeria Data Protection Act (NDPA) and applicable Nigerian law.</p>

      <div><strong style={s}>1. Who We Are</strong>
        <p>Data Controller: Apex Fitness & Wellness Ltd, Lagos, Nigeria. Contact: <strong>info@apexfitnessplace.com</strong>. We determine the purposes and means of processing your personal data.</p>
      </div>
      <div><strong style={s}>2. Data We Collect</strong>
        <p><strong style={{ color: "var(--text)" }}>Identity & contact:</strong> Full name, email, phone number, date of birth, government-issued ID details.</p>
        <p><strong style={{ color: "var(--text)" }}>Account data:</strong> Username, password (hashed), membership plan, subscription status, booking history.</p>
        <p><strong style={{ color: "var(--text)" }}>Health information:</strong> Voluntary health declarations and medical notes you provide for safe participation.</p>
        <p><strong style={{ color: "var(--text)" }}>Payment data:</strong> Transaction records, payment references. Full card details are never stored on our servers - processed exclusively by Paystack (PCI-DSS compliant).</p>
        <p><strong style={{ color: "var(--text)" }}>Technical data:</strong> IP address, browser type, device identifiers, pages visited, session durations - collected via cookies and server logs.</p>
        <p><strong style={{ color: "var(--text)" }}>CCTV footage:</strong> Video recordings in common areas, entrances, and car parks for security purposes.</p>
      </div>
      <div><strong style={s}>3. Legal Basis for Processing</strong>
        <p>We process your data on the following legal bases: (a) <strong style={{ color: "var(--text)" }}>Contract</strong> - to fulfil your membership and deliver services; (b) <strong style={{ color: "var(--text)" }}>Legitimate interests</strong> - fraud prevention, IT security, improving our services; (c) <strong style={{ color: "var(--text)" }}>Legal obligation</strong> - tax records, regulatory compliance; (d) <strong style={{ color: "var(--text)" }}>Consent</strong> - marketing communications (withdraw any time).</p>
      </div>
      <div><strong style={s}>4. How We Use Your Data</strong>
        <p>To create and manage your membership account; process payments and send receipts; confirm class bookings and send schedule updates; respond to enquiries and provide customer support; send promotional emails and offers (opt-in only); conduct internal analytics to improve our facilities; comply with legal, regulatory, and tax obligations; and investigate security incidents or disputes.</p>
      </div>
      <div><strong style={s}>5. Data Sharing</strong>
        <p>We do not sell or rent your personal data. We share data only with: (i) <strong style={{ color: "var(--text)" }}>Service providers</strong> acting as data processors on our behalf - Paystack (payments), email delivery services, cloud hosting providers - all bound by data processing agreements; (ii) <strong style={{ color: "var(--text)" }}>Law enforcement or regulators</strong> when required by Nigerian law or valid court order; (iii) <strong style={{ color: "var(--text)" }}>Professional advisers</strong> (lawyers, auditors) under confidentiality obligations.</p>
      </div>
      <div><strong style={s}>6. CCTV & Surveillance</strong>
        <p>We operate CCTV in public areas of all our facilities. Footage is treated as personal data under the NDPA. CCTV recordings are used solely for safety and security, retained for no longer than 30 days unless required for an active investigation. Signage is displayed at all entrances informing you of recording.</p>
      </div>
      <div><strong style={s}>7. International Transfers</strong>
        <p>Some of our service providers (cloud hosting, email) may process data outside Nigeria. Where this occurs, we ensure appropriate safeguards are in place - including contractual clauses equivalent to NDPA standards - before any transfer takes place.</p>
      </div>
      <div><strong style={s}>8. Data Retention</strong>
        <p>We retain your account data for the duration of your membership and for 7 years thereafter to comply with Nigerian tax and financial record-keeping requirements. Health declarations are retained for 5 years. CCTV footage is overwritten after 30 days unless preserved for an active matter. You may request deletion of data not subject to a retention obligation.</p>
      </div>
      <div><strong style={s}>9. Your Rights Under the NDPA</strong>
        <p>You have the right to: <strong style={{ color: "var(--text)" }}>Access</strong> a copy of your data; <strong style={{ color: "var(--text)" }}>Rectify</strong> inaccurate information; <strong style={{ color: "var(--text)" }}>Erase</strong> data we are not legally required to keep; <strong style={{ color: "var(--text)" }}>Restrict</strong> processing in certain circumstances; <strong style={{ color: "var(--text)" }}>Object</strong> to processing based on legitimate interests; <strong style={{ color: "var(--text)" }}>Portability</strong> - receive your data in a structured, machine-readable format; and <strong style={{ color: "var(--text)" }}>Withdraw consent</strong> for marketing at any time. Submit requests to <strong>info@apexfitnessplace.com</strong>. We will respond within 30 days.</p>
      </div>
      <div><strong style={s}>10. Cookies</strong>
        <p>We use essential cookies for authentication and session management, and optional analytics cookies to understand usage patterns. See our Cookie Policy for full details. You can manage cookie preferences in your browser settings.</p>
      </div>
      <div><strong style={s}>11. Children</strong>
        <p>Our platform is not directed at persons under 16. We do not knowingly collect personal data from children. If we become aware of such collection, we will delete it promptly.</p>
      </div>
      <div><strong style={s}>12. Changes to This Policy</strong>
        <p>We may update this Privacy Policy periodically. Material changes will be communicated by email and posted on our website at least 14 days before they take effect. Continued use of our services after that date constitutes acceptance.</p>
      </div>
      <div><strong style={s}>13. Complaints</strong>
        <p>If you believe we have handled your data unlawfully, you have the right to lodge a complaint with the Nigeria Data Protection Commission (NDPC) at <strong>ndpc.gov.ng</strong>. We ask that you contact us first so we can address your concern directly.</p>
      </div>
      <div><strong style={s}>14. Contact</strong>
        <p>Data Protection Officer · Apex Fitness & Wellness Ltd · Lagos, Nigeria<br />Email: <strong>info@apexfitnessplace.com</strong></p>
      </div>
    </>
  );
}

function TermsContent() {
  return <TermsSections terms={MEMBERSHIP_TERMS} />;
}

function CookieContent() {
  const s = { fontWeight: 700, color: "var(--text)", fontSize: 14, marginTop: 4, display: "block", letterSpacing: "-.2px" };
  return (
    <>
      <p style={{ color: "var(--muted)", fontSize: 12 }}>Last updated: January 2026 · This Cookie Policy explains how Apex Fitness & Wellness uses cookies and similar tracking technologies on our website and member portal.</p>

      <div><strong style={s}>1. What Are Cookies</strong>
        <p>Cookies are small text files placed on your device by your browser when you visit our site. They allow us to recognise you on return visits, maintain your session, and understand how our platform is used. Similar technologies include local storage tokens used by our member portal for authentication.</p>
      </div>
      <div><strong style={s}>2. Cookies We Use</strong>
        <p><strong style={{ color: "var(--text)" }}>Strictly necessary:</strong> Authentication tokens (JWT access and refresh tokens stored in localStorage) that keep you logged into the member portal. Session management cookies required for security. These cannot be disabled without breaking core functionality.</p>
        <p><strong style={{ color: "var(--text)" }}>Functional:</strong> Preferences such as display mode (light/dark) and notification settings. Stored in your browser's localStorage to persist across sessions.</p>
        <p><strong style={{ color: "var(--text)" }}>Analytics (optional):</strong> Anonymised data on page visits, feature usage, and session duration to help us improve the experience. No personally identifiable information is collected in analytics.</p>
        <p><strong style={{ color: "var(--text)" }}>Third-party (Paystack):</strong> During checkout, Paystack may set cookies or scripts on their payment page. These are governed by <a href="https://paystack.com/privacy" target="_blank" rel="noopener noreferrer" style={{ color: "var(--accent-text)" }}>Paystack's Privacy Policy</a>.</p>
      </div>
      <div><strong style={s}>3. Your Choices</strong>
        <p>You can control or delete cookies through your browser settings (Settings → Privacy → Cookies). Blocking strictly necessary cookies will prevent you from logging in to the member portal. Blocking analytics cookies will not affect your experience. Most browsers also allow you to set preferences per-site.</p>
      </div>
      <div><strong style={s}>4. Retention</strong>
        <p>Authentication tokens expire after a short session window and are refreshed automatically while you remain active. Functional cookies persist until you log out or clear your browser storage. Analytics data is retained in anonymised, aggregated form for up to 12 months.</p>
      </div>
      <div><strong style={s}>5. Changes to This Policy</strong>
        <p>We may update this Cookie Policy when we introduce new technologies or change how we use data. Updates will be reflected in the "Last updated" date above. Significant changes will be communicated via email or an in-app notice.</p>
      </div>
      <div><strong style={s}>6. Contact</strong>
        <p>For questions about our use of cookies or to exercise your data rights, email <strong>info@apexfitnessplace.com</strong>.</p>
      </div>
    </>
  );
}

const FAQ_ITEMS = [
  {
    q: "How old do I need to be to join Apex Fitness?",
    a: "You must be at least 18 years old to join independently. Members aged 16–17 may join with written parental or guardian consent and must always be supervised by an adult while on the gym floor. Under-16s are not permitted on the gym floor at any time.",
  },
  {
    q: "Can I share my membership with someone else?",
    a: "No. Memberships are strictly personal and non-transferable. Sharing or lending your access card, keyfob, or login credentials is a violation of our Terms and may result in immediate membership termination without refund.",
  },
  {
    q: "How do I cancel my membership?",
    a: "Cancellations are processed by our team - please contact us at info@apexfitness.ng with the subject 'Membership Cancellation Request'. After any minimum term, one full calendar month's written notice is required. Your access remains active until the end of your paid period, after which no further charges are made.",
  },
  {
    q: "Is there a cooling-off period when I join?",
    a: "Yes. You have 7 days from the date of joining to cancel your membership for a full refund (excluding any initiation fee), in line with Nigeria's Federal Competition and Consumer Protection Act (FCCPA) 2018. After this period, fees are generally non-refundable.",
  },
  {
    q: "Can I freeze my membership?",
    a: "Yes. You can request a membership freeze for valid reasons such as a medical condition or extended travel, for up to 3 months. Billing is paused during the freeze. Requests must be submitted in writing at least 5 days before your next billing date. Membership cannot be cancelled during a freeze.",
  },
  {
    q: "What happens if I miss a class I booked?",
    a: "If you cannot attend a booked class, please cancel at least 12 hours in advance through the member portal or by contacting us. Late cancellations or no-shows may incur a charge. Repeated no-shows may affect your ability to book classes in advance.",
  },
  {
    q: "What should I wear to the gym?",
    a: "Appropriate athletic attire and closed-toe shoes are required at all times on the gym floor. We reserve the right to refuse entry for unsafe footwear (open-toed shoes), excessively revealing clothing, or apparel with offensive messaging.",
  },
  {
    q: "Are children allowed in the gym?",
    a: "Children under 16 are not permitted on the gym floor. Members aged 16–18 must be accompanied and supervised by a parent or adult guardian. Apex does not provide childcare services, and children must be supervised at all times within our facilities.",
  },
  {
    q: "How is my personal data protected?",
    a: "We comply with the Nigeria Data Protection Act (NDPA). Your payment details are handled exclusively by Paystack (PCI-DSS compliant) - we never store full card numbers. Your personal data is never sold. You can access, correct, or request deletion of your data by emailing info@apexfitnessplace.com.",
  },
  {
    q: "Is there CCTV in the gym?",
    a: "Yes. For the safety and security of all members and staff, CCTV operates in public areas including entrances, the gym floor, common areas, and car parks. Signage is posted at all entrances. Footage is retained for 30 days and is used solely for security purposes, in compliance with the NDPA.",
  },
  {
    q: "What happens to items left in lockers?",
    a: "Lockers are for short-term use during your workout only. Apex is not liable for theft or loss of personal property. We reserve the right to open lockers in safety or maintenance emergencies. Any items removed are logged and held at reception for 30 days. Unclaimed items may be donated or disposed of after this period.",
  },
  {
    q: "What are my rights under Nigerian consumer law?",
    a: "As a consumer, you are protected by the Federal Competition and Consumer Protection Act (FCCPA) 2018. If Apex fails to deliver a promised service or there is a material defect in our offering, you may be entitled to a remedy or refund under FCCPA Section 20. Our Terms are designed to reflect and honour these rights.",
  },
  {
    q: "How do I report a hazard or safety concern?",
    a: "Report any hazards, broken equipment, or injuries to a member of staff immediately. In an emergency, follow the posted evacuation routes and instructions from staff. Emergency contact numbers (ambulance, fire, police) are displayed at all reception desks.",
  },
  {
    q: "Can I take photos or videos in the gym?",
    a: "Personal photography for your own use in non-crowded areas is generally fine, but photographing or recording other members without their explicit consent is strictly prohibited. Staff may ask you to stop recording if it disrupts others or captures members who have not consented.",
  },
];

function FAQModal({ onClose }) {
  const [open, setOpen] = useState(null);
  return (
    <ModalWrapper onClose={onClose} maxWidth={680}>

      <div style={{
        position: "sticky", top: 0, zIndex: 10,
        background: C.surface, borderRadius: "24px 24px 0 0",
        borderBottom: `1px solid ${C.border}`,
        padding: "24px 28px 20px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <button
            onClick={onClose}
            aria-label="Close FAQs"
            style={{
              flexShrink: 0, width: 34, height: 34,
              background: C.surface2, border: `1px solid ${C.border}`,
              borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
              cursor: "pointer", color: C.muted, transition: "all .15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = C.accentDim; e.currentTarget.style.borderColor = C.accentBorder; e.currentTarget.style.color = C.accentText; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = C.surface2; e.currentTarget.style.borderColor = C.border; e.currentTarget.style.color = C.muted; }}
          >
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M8 1.5L3.5 6.5 8 11.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 900, letterSpacing: "-.5px", color: C.text }}>
              Frequently Asked Questions
            </h2>
            <p style={{ margin: "3px 0 0", fontSize: 12, color: C.muted }}>
              {FAQ_ITEMS.length} questions · tap to expand
            </p>
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px 28px" }}>
        {FAQ_ITEMS.map((item, i) => {
          const isOpen = open === i;
          return (
            <div key={i} style={{ borderBottom: `1px solid ${C.border}` }}>
              <button
                onClick={() => setOpen(isOpen ? null : i)}
                style={{
                  width: "100%", display: "flex", alignItems: "center", justifyContent: "space-between",
                  gap: 14, padding: "16px 8px",
                  background: "none", border: "none", cursor: "pointer", textAlign: "left",
                }}
              >
                <span style={{
                  fontSize: 14, fontWeight: 700, lineHeight: 1.45,
                  color: isOpen ? C.accentText : C.text,
                  transition: "color .15s",
                }}>
                  {item.q}
                </span>
                <span style={{
                  flexShrink: 0, width: 24, height: 24, borderRadius: "50%",
                  background: isOpen ? C.accentDim : C.surface2,
                  border: `1px solid ${isOpen ? C.accentBorder : C.border}`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: isOpen ? C.accentText : C.muted,
                  fontSize: 16, fontWeight: 400, lineHeight: 1,
                  transition: "all .2s",
                  transform: isOpen ? "rotate(45deg)" : "none",
                }}>+</span>
              </button>
              {isOpen && (
                <div style={{
                  padding: "0 8px 18px",
                  fontSize: 13, color: C.textSec, lineHeight: 1.8,
                  borderLeft: `3px solid ${C.accentBorder}`,
                  marginLeft: 8, paddingLeft: 16,
                  marginBottom: 4,
                }}>
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </ModalWrapper>
  );
}

function PlansModal({ onClose, onContactClick, user }) {
  const [activeTab, setActiveTab] = useState("membership");
  const [plans, setPlans] = useState([]);
  const [globalJoiningFee, setGlobalJoiningFee] = useState(0);
  const [plansLoading, setPlansLoading] = useState(true);
  const [ptPlans, setPtPlans] = useState([]);
  const [ptLoading, setPtLoading] = useState(true);
  const [lockerPlans, setLockerPlans] = useState(null);
  const [lockerLoading, setLockerLoading] = useState(true);

  useEffect(() => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${apiUrl}/memberships/plans`)
      .then((r) => r.json())
      .then((body) => {
        const data = body?.data || body;
        const all = data?.plans || [];
        setPlans(all.filter((p) => !p.isDailyPass));
        setGlobalJoiningFee(parseFloat(data?.joiningFee) || 0);
      })
      .catch(() => setPlans([]))
      .finally(() => setPlansLoading(false));
    fetch(`${apiUrl}/pt-plans`)
      .then((r) => r.json())
      .then((body) => {
        const data = body?.data || body;
        setPtPlans(data?.plans || data || []);
      })
      .catch(() => setPtPlans([]))
      .finally(() => setPtLoading(false));
    fetch(`${apiUrl}/lockers/plans`)
      .then((r) => r.json())
      .then((body) => setLockerPlans(body?.data || body || null))
      .catch(() => setLockerPlans(null))
      .finally(() => setLockerLoading(false));
  }, []);

  const PLAN_COLORS = { monthly: "#c62828", quarterly: "#9e9e9e", annual: "#c8a000" };
  const PLAN_BADGES = { annual: "Best Value" };

  const isBest = (plan) => plan.billingCycle === "annual" || PLAN_BADGES[plan.billingCycle];

  return (
    <ModalWrapper onClose={onClose} maxWidth={960}>
      <style>{`
        .apex-plans-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 16px; }
        /* With four plans, 3-up would strand one card alone on a second row. */
        .apex-plans-grid.is-four { grid-template-columns: repeat(2,1fr); }
        .apex-pt-grid { display: grid; grid-template-columns: repeat(2,1fr); gap: 16px; }
        @media (max-width: 640px) {
          .apex-plans-grid, .apex-plans-grid.is-four { grid-template-columns: 1fr; }
          .apex-pt-grid { grid-template-columns: 1fr; }
        }
        @media (min-width: 641px) and (max-width: 800px) {
          .apex-plans-grid { grid-template-columns: 1fr 1fr; }
        }
      `}</style>
      <div style={{ padding: "clamp(20px,4vw,40px)" }}>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
          <div>
            <SectionTag>Pricing</SectionTag>
            <h2 style={{ fontSize: "clamp(22px,4vw,38px)", fontWeight: 900, letterSpacing: -1.5,
              textTransform: "uppercase", color: C.text, lineHeight: 1, margin: 0 }}>
              JOIN APEX FITNESS
            </h2>
          </div>
          <button onClick={onClose} aria-label="Close" style={{
            background: "none", border: "none", cursor: "pointer", color: C.muted, flexShrink: 0,
          }}>
            <CloseIcon />
          </button>
        </div>

        <div style={{
          display: "flex", gap: 6, marginBottom: 28, flexWrap: "wrap",
          background: C.toggleTrack, border: `1px solid ${C.border}`,
          borderRadius: 100, padding: 4, width: "fit-content", maxWidth: "100%",
        }}>
          {[["membership", "Membership Plans"], ["pt", "Personal Training"], ["locker", "Personal Locker"]].map(([key, label]) => (
            <button key={key} onClick={() => setActiveTab(key)} style={{
              padding: "8px 18px", borderRadius: 100, fontSize: 13, fontWeight: 700,
              cursor: "pointer", border: "none",
              background: activeTab === key ? GRADIENT : "transparent",
              color: activeTab === key ? "#1b1b19" : C.muted,
              transition: "all .2s",
            }}>{label}</button>
          ))}
        </div>

        {activeTab === "membership" && (
          <>
            {plansLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <div style={{ width: 28, height: 28, border: `2px solid ${C.accentBorder}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : plans.length === 0 ? (
              <p style={{ textAlign: "center", color: C.muted, fontSize: 14, padding: "40px 0" }}>
                No plans available at this time. Please contact us.
              </p>
            ) : (
              <div className={`apex-plans-grid${plans.length % 3 === 1 && plans.length > 3 ? " is-four" : ""}`}>
                {plans.map(plan => {
                  const best = isBest(plan);
                  const planColor = PLAN_COLORS[plan.billingCycle] || "#9e9e9e";
                  const planBadge = PLAN_BADGES[plan.billingCycle] || null;
                  const periodLabel = plan.billingCycle === "monthly" ? "/ month" : plan.billingCycle === "quarterly" ? "/ quarter" : "/ year";
                  const joiningFee = globalJoiningFee;
                  const planPrice = parseFloat(plan.price) || 0;
                  const firstPeriodLabel = plan.billingCycle === "monthly" ? "month" : plan.billingCycle === "quarterly" ? "quarter" : "year";

                  const fmtNGN = (n) => new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n);

                  return (
                    <div key={plan.id} style={{
                      position: "relative", borderRadius: 22, overflow: "hidden",
                      boxShadow: best
                        ? "0 12px 48px rgba(249,169,123,0.28), 0 4px 16px rgba(0,0,0,0.20)"
                        : "0 4px 20px rgba(0,0,0,0.12)",
                      transform: best ? "scale(1.03)" : "scale(1)",
                      transition: "transform .2s",
                      border: best ? "none" : `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        position: "absolute", inset: 0,
                        background: best
                          ? GRADIENT
                          : `linear-gradient(160deg, ${C.surface} 0%, ${C.surface2} 100%)`,
                      }} />
                      {!best && (
                        <div style={{
                          position: "absolute", inset: 0, pointerEvents: "none",
                          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
                          backgroundSize: "32px 32px", opacity: 0.4,
                        }} />
                      )}
                      <div style={{
                        position: "relative", height: 5,
                        background: best
                          ? "rgba(27,27,25,0.25)"
                          : `linear-gradient(90deg, ${planColor} 0%, ${planColor}88 100%)`,
                      }} />
                      <div style={{ position: "relative", padding: "22px 24px 24px" }}>
                        {planBadge && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: best ? "rgba(27,27,25,0.22)" : C.accentDim,
                            color: best ? "#1b1b19" : C.accentText,
                            border: best ? "none" : `1px solid ${C.accentBorder}`,
                            padding: "4px 12px", borderRadius: 100,
                            fontSize: 9, fontWeight: 900, letterSpacing: "2px",
                            textTransform: "uppercase", marginBottom: 14,
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: best ? "#1b1b19" : C.accentText, flexShrink: 0 }} />
                            {planBadge}
                          </div>
                        )}
                        <div style={{
                          fontSize: 12, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase",
                          color: best ? "rgba(27,27,25,0.60)" : C.muted,
                          marginBottom: planBadge ? 0 : 14,
                        }}>
                          {plan.name}
                        </div>
                        <div style={{ marginBottom: 18, marginTop: 14 }}>
                          <div style={{ fontSize: "clamp(36px,5vw,46px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1, color: best ? "#1b1b19" : C.text }}>
                            <span style={{ fontSize: 16, fontWeight: 700, verticalAlign: "top", marginTop: 8, display: "inline-block" }}>₦</span>
                            {fmtNGN(planPrice)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: best ? "rgba(27,27,25,0.55)" : C.muted }}>
                            subscription {periodLabel}
                          </div>
                        </div>
                        <div style={{ height: 1, background: best ? "rgba(27,27,25,0.15)" : C.border, marginBottom: 16 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                          {joiningFee > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: best ? "rgba(27,27,25,0.55)" : C.muted }}>Joining fee</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: best ? "#1b1b19" : C.text }}>₦{fmtNGN(joiningFee)}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: best ? "rgba(27,27,25,0.55)" : C.muted, fontWeight: 700 }}>
                              Total (first {firstPeriodLabel})
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 900, color: best ? "#1b1b19" : C.accentText }}>
                              ₦{fmtNGN(planPrice + joiningFee)}
                            </span>
                          </div>
                          {best && (
                            <div style={{
                              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                              background: "rgba(27,27,25,0.14)", borderRadius: 8, padding: "6px 10px",
                              fontSize: 11, fontWeight: 800, color: "#1b1b19",
                            }}>
                              <span>✓</span> Best Value
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => { onClose(); window.location.href = user ? "/membership" : `/register?plan=${plan.billingCycle}`; }}
                          style={{
                            width: "100%", padding: "13px", borderRadius: 100,
                            fontSize: 13, fontWeight: 800, cursor: "pointer",
                            letterSpacing: ".5px", transition: "opacity .15s",
                            background: best ? "#1b1b19" : GRADIENT, border: "none",
                            color: best ? "#f9a97b" : "#1b1b19",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = ".85"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                        >
                          Get Started →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "pt" && (
          <>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24, maxWidth: 560 }}>
              Accelerate your results with a certified personal trainer. Choose a package below and one of our coaches will be assigned to you.
            </p>
            {ptLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <div style={{ width: 28, height: 28, border: `2px solid ${C.accentBorder}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : ptPlans.length === 0 ? (
              <p style={{ textAlign: "center", color: C.muted, fontSize: 14, padding: "40px 0" }}>
                No PT packages available right now. Contact us for details.
              </p>
            ) : (
              <div className="apex-plans-grid">
                {ptPlans.map((plan, i) => {
                  const best = i === 0;
                  const fmtNGN = (n) => new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n);
                  const perMonth = Math.round(parseFloat(plan.price) / plan.durationMonths);
                  return (
                    <div key={plan.id || plan._id} style={{
                      position: "relative", borderRadius: 22, overflow: "hidden",
                      boxShadow: best
                        ? "0 12px 48px rgba(249,169,123,0.28), 0 4px 16px rgba(0,0,0,0.20)"
                        : "0 4px 20px rgba(0,0,0,0.12)",
                      transform: best ? "scale(1.03)" : "scale(1)",
                      transition: "transform .2s",
                      border: best ? "none" : `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        position: "absolute", inset: 0,
                        background: best
                          ? GRADIENT
                          : `linear-gradient(160deg, ${C.surface} 0%, ${C.surface2} 100%)`,
                      }} />
                      {!best && (
                        <div style={{
                          position: "absolute", inset: 0, pointerEvents: "none",
                          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
                          backgroundSize: "32px 32px", opacity: 0.4,
                        }} />
                      )}
                      <div style={{ position: "relative", height: 5, background: best ? "rgba(27,27,25,0.25)" : `${C.accentText}66` }} />
                      <div style={{ position: "relative", padding: "22px 24px 24px" }}>
                        <div style={{
                          fontSize: 11, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase",
                          color: best ? "rgba(27,27,25,0.60)" : C.muted, marginBottom: 10,
                        }}>
                          {plan.durationMonths} {plan.durationMonths === 1 ? "month" : "months"}
                        </div>
                        <h3 style={{ fontSize: 18, fontWeight: 900, color: best ? "#1b1b19" : C.text, letterSpacing: -.5, marginBottom: 4 }}>
                          {plan.name}
                        </h3>
                        <div style={{ marginBottom: 16, marginTop: 12 }}>
                          <div style={{ fontSize: "clamp(30px,4vw,40px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1, color: best ? "#1b1b19" : C.text }}>
                            <span style={{ fontSize: 15, fontWeight: 700, verticalAlign: "top", marginTop: 7, display: "inline-block" }}>₦</span>
                            {fmtNGN(parseFloat(plan.price))}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: best ? "rgba(27,27,25,0.55)" : C.muted }}>
                            ≈ ₦{fmtNGN(perMonth)} / month
                          </div>
                        </div>
                        {plan.description && (
                          <p style={{ fontSize: 13, color: best ? "rgba(27,27,25,0.65)" : C.muted, lineHeight: 1.55, marginBottom: 18 }}>
                            {plan.description}
                          </p>
                        )}
                        <button
                          onClick={() => { onClose(); window.location.href = user ? "/personal-trainer" : "/register"; }}
                          style={{
                            width: "100%", padding: "13px", borderRadius: 100,
                            fontSize: 13, fontWeight: 800, cursor: "pointer",
                            letterSpacing: ".5px", transition: "opacity .15s",
                            background: best ? "#1b1b19" : GRADIENT, border: "none",
                            color: best ? "#f9a97b" : "#1b1b19",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = ".85"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                        >
                          Get Started →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {activeTab === "locker" && (
          <>
            <p style={{ color: C.muted, fontSize: 14, lineHeight: 1.7, marginBottom: 24, maxWidth: 560 }}>
              Keep your kit at the gym. Rent a personal locker for the duration of your membership — a one-time setup fee applies to your first locker only.
            </p>
            {lockerLoading ? (
              <div style={{ display: "flex", justifyContent: "center", padding: "40px 0" }}>
                <div style={{ width: 28, height: 28, border: `2px solid ${C.accentBorder}`, borderTopColor: C.accent, borderRadius: "50%", animation: "spin 0.8s linear infinite" }} />
              </div>
            ) : !lockerPlans || (!lockerPlans.monthly && !lockerPlans.quarterly) ? (
              <p style={{ textAlign: "center", color: C.muted, fontSize: 14, padding: "40px 0" }}>
                Locker pricing is unavailable right now. Please contact us.
              </p>
            ) : (
              <div className="apex-pt-grid">
                {[
                  { key: "monthly",   label: "Monthly Locker",   price: lockerPlans.monthly,   period: "/ month",   first: "month",   best: false },
                  { key: "quarterly", label: "Quarterly Locker", price: lockerPlans.quarterly, period: "/ quarter", first: "quarter", best: true  },
                ].filter((o) => o.price > 0).map((opt) => {
                  const fmtNGN = (n) => new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(n);
                  const setupFee = parseFloat(lockerPlans.setupFee) || 0;
                  const best = opt.best;
                  return (
                    <div key={opt.key} style={{
                      position: "relative", borderRadius: 22, overflow: "hidden",
                      boxShadow: best
                        ? "0 12px 48px rgba(249,169,123,0.28), 0 4px 16px rgba(0,0,0,0.20)"
                        : "0 4px 20px rgba(0,0,0,0.12)",
                      transform: best ? "scale(1.03)" : "scale(1)",
                      transition: "transform .2s",
                      border: best ? "none" : `1px solid ${C.border}`,
                    }}>
                      <div style={{
                        position: "absolute", inset: 0,
                        background: best ? GRADIENT : `linear-gradient(160deg, ${C.surface} 0%, ${C.surface2} 100%)`,
                      }} />
                      {!best && (
                        <div style={{
                          position: "absolute", inset: 0, pointerEvents: "none",
                          backgroundImage: `linear-gradient(${C.border} 1px, transparent 1px), linear-gradient(90deg, ${C.border} 1px, transparent 1px)`,
                          backgroundSize: "32px 32px", opacity: 0.4,
                        }} />
                      )}
                      <div style={{ position: "relative", height: 5, background: best ? "rgba(27,27,25,0.25)" : `${C.accentText}66` }} />
                      <div style={{ position: "relative", padding: "22px 24px 24px" }}>
                        {best && (
                          <div style={{
                            display: "inline-flex", alignItems: "center", gap: 6,
                            background: "rgba(27,27,25,0.22)", color: "#1b1b19",
                            padding: "4px 12px", borderRadius: 100,
                            fontSize: 9, fontWeight: 900, letterSpacing: "2px",
                            textTransform: "uppercase", marginBottom: 14,
                          }}>
                            <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#1b1b19", flexShrink: 0 }} />
                            Best Value
                          </div>
                        )}
                        <div style={{
                          fontSize: 12, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase",
                          color: best ? "rgba(27,27,25,0.60)" : C.muted, marginBottom: best ? 0 : 14,
                        }}>
                          {opt.label}
                        </div>
                        <div style={{ marginBottom: 18, marginTop: 14 }}>
                          <div style={{ fontSize: "clamp(36px,5vw,46px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1, color: best ? "#1b1b19" : C.text }}>
                            <span style={{ fontSize: 16, fontWeight: 700, verticalAlign: "top", marginTop: 8, display: "inline-block" }}>₦</span>
                            {fmtNGN(opt.price)}
                          </div>
                          <div style={{ fontSize: 12, fontWeight: 600, marginTop: 4, color: best ? "rgba(27,27,25,0.55)" : C.muted }}>
                            locker rental {opt.period}
                          </div>
                        </div>
                        <div style={{ height: 1, background: best ? "rgba(27,27,25,0.15)" : C.border, marginBottom: 16 }} />
                        <div style={{ display: "flex", flexDirection: "column", gap: 10, marginBottom: 20 }}>
                          {setupFee > 0 && (
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontSize: 12, color: best ? "rgba(27,27,25,0.55)" : C.muted }}>Setup fee (first locker)</span>
                              <span style={{ fontSize: 13, fontWeight: 700, color: best ? "#1b1b19" : C.text }}>₦{fmtNGN(setupFee)}</span>
                            </div>
                          )}
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontSize: 12, color: best ? "rgba(27,27,25,0.55)" : C.muted, fontWeight: 700 }}>
                              Total (first {opt.first})
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 900, color: best ? "#1b1b19" : C.accentText }}>
                              ₦{fmtNGN(opt.price + setupFee)}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => { onClose(); window.location.href = user ? "/locker" : "/register"; }}
                          style={{
                            width: "100%", padding: "13px", borderRadius: 100,
                            fontSize: 13, fontWeight: 800, cursor: "pointer",
                            letterSpacing: ".5px", transition: "opacity .15s",
                            background: best ? "#1b1b19" : GRADIENT, border: "none",
                            color: best ? "#f9a97b" : "#1b1b19",
                          }}
                          onMouseEnter={(e) => { e.currentTarget.style.opacity = ".85"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
                        >
                          Get Started →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <p style={{ fontSize: 12, color: C.muted, marginTop: 18, lineHeight: 1.6 }}>
              A locker requires an active membership. Rentals renew automatically and can be cancelled anytime.
            </p>
          </>
        )}

        <p style={{ textAlign: "center", fontSize: 13, color: C.muted, marginTop: 24 }}>
          Need a corporate plan or student discount?{" "}
          <button onClick={() => { onClose(); onContactClick(); }}
            style={{ background: "none", border: "none", color: C.accentText, cursor: "pointer",
              fontWeight: 700, fontSize: 13 }}>
            Talk to us →
          </button>
        </p>
      </div>
    </ModalWrapper>
  );
}

function Nav({ showAbout, onAboutToggle, showLocations, onLocationsToggle, showPlans, onPlansOpen, onContactOpen, user }) {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 24);
    window.addEventListener("scroll", handler, { passive: true });
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const navLinkStyle = (active = false) => ({
    color: active ? C.accentText : C.muted,
    textDecoration: "none", fontSize: 14, fontWeight: active ? 700 : 500,
    transition: "color .2s", background: "none", border: "none",
    cursor: "pointer", padding: 0,
    borderBottom: active ? `2px solid var(--accent-text)` : "2px solid transparent",
    paddingBottom: 2,
  });

  const isHome = pathname === "/";
  const homeActive = isHome && !showAbout && !showLocations && !showPlans;

  const mobileAction = (fn) => () => { setMenuOpen(false); fn(); };

  const BAR = (deg, ty) => ({
    display: "block", width: 22, height: 2, background: C.text,
    borderRadius: 2, transition: "transform .25s, opacity .25s",
    transform: menuOpen ? (deg ? `rotate(${deg}deg) translateY(${ty}px)` : "scaleX(0)") : "none",
    opacity: menuOpen && !deg ? 0 : 1,
  });

  return (
    <>
      <style>{`
        .apex-lp-links { display: flex; gap: 28px; list-style: none; padding: 0; margin: 0; }
        .apex-lp-right { display: flex; gap: 10px; align-items: center; }
        .apex-lp-burger { display: none; flex-direction: column; gap: 5px; background: none; border: none; cursor: pointer; padding: 4px; }
        .apex-lp-drawer { display: none; }
        @media (max-width: 768px) {
          .apex-lp-links { display: none; }
          .apex-lp-right { display: none; }
          .apex-lp-burger { display: flex; }
          .apex-lp-drawer { display: block; }
        }
      `}</style>

      <nav style={{
        position: "fixed", top: 0, width: "100%", zIndex: 999,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "0 clamp(16px,4vw,48px)", height: 72,
        background: scrolled || menuOpen ? C.navBg : "transparent",
        backdropFilter: scrolled || menuOpen ? "blur(24px)" : "none",
        borderBottom: scrolled || menuOpen ? `1px solid ${C.border}` : "1px solid transparent",
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}>
        <a href="/" style={{ fontSize: 20, fontWeight: 900, letterSpacing: -.5, color: C.text, textDecoration: "none" }}>
          APEX<span style={{ color: C.accentText }}>FITNESS</span>
        </a>

        <ul className="apex-lp-links">
          <li><a href="/" style={navLinkStyle(homeActive)}>Home</a></li>
          <li><button onClick={onLocationsToggle} style={navLinkStyle(showLocations)}>Locations</button></li>
          <li><button onClick={onPlansOpen} style={navLinkStyle(showPlans)}>Membership</button></li>
          <li><button onClick={onAboutToggle} style={navLinkStyle(showAbout)}>About</button></li>
        </ul>

        <div className="apex-lp-right">
          {user ? (
            <a href="/dashboard" style={{
              display: "flex", alignItems: "center", gap: 10,
              textDecoration: "none", padding: "6px 16px 6px 6px",
              borderRadius: 100, border: `1px solid ${C.border}`,
              background: C.surface2, transition: "border-color .2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = "var(--accent-border)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = "var(--border)"; }}
            >
              <div style={{
                width: 30, height: 30, borderRadius: "50%",
                background: "linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, fontWeight: 900, color: "#1b1b19", flexShrink: 0,
              }}>
                {getInitials(user.firstName, user.lastName)}
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                {user.firstName}
              </span>
            </a>
          ) : (
            <>
              <Btn variant="ghost" href="/login">Sign In</Btn>
              <Btn variant="accent" href="/register">Register</Btn>
            </>
          )}
        </div>

        <button className="apex-lp-burger" onClick={() => setMenuOpen(o => !o)} aria-label="Menu" aria-expanded={menuOpen}>
          <span style={BAR(45, 7)} />
          <span style={BAR(0, 0)} />
          <span style={BAR(-45, -7)} />
        </button>
      </nav>

      <div className="apex-lp-drawer" style={{
        position: "fixed", top: 72, left: 0, right: 0, bottom: 0, zIndex: 998,
        background: C.navBg, backdropFilter: "blur(24px)",
        borderTop: `1px solid ${C.border}`,
        overflowY: "auto",
        transform: menuOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.28s ease",
      }}>
        <div style={{ padding: "24px clamp(16px,5vw,32px)", display: "flex", flexDirection: "column", gap: 4 }}>
          {[
            { label: "Home", action: () => { setMenuOpen(false); window.location.href = "/"; }, active: homeActive },
            { label: "Locations", action: mobileAction(onLocationsToggle), active: showLocations },
            { label: "Membership", action: mobileAction(onPlansOpen), active: showPlans },
            { label: "About", action: mobileAction(onAboutToggle), active: showAbout },
          ].map(({ label, action, active }) => (
            <button key={label} onClick={action} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "16px 0", fontSize: 22, fontWeight: 800,
              letterSpacing: -0.5, textTransform: "uppercase",
              color: active ? C.accentText : C.text,
              background: "none", border: "none", borderBottom: `1px solid ${C.border}`,
              cursor: "pointer",
            }}>{label}</button>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 32 }}>
            {user ? (
              <>
                <div style={{
                  display: "flex", alignItems: "center", gap: 12,
                  padding: "14px 0", borderBottom: `1px solid ${C.border}`,
                }}>
                  <div style={{
                    width: 42, height: 42, borderRadius: "50%",
                    background: "linear-gradient(135deg, #f9a97b 0%, #b85e2a 100%)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    fontSize: 14, fontWeight: 900, color: "#1b1b19", flexShrink: 0,
                  }}>
                    {getInitials(user.firstName, user.lastName)}
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted }}>{user.email}</div>
                  </div>
                </div>
                <Btn variant="accent" href="/dashboard" style={{ width: "100%", justifyContent: "center", fontSize: 15 }}>
                  Go to Dashboard
                </Btn>
              </>
            ) : (
              <>
                <Btn variant="ghost" href="/login" style={{ width: "100%", justifyContent: "center", fontSize: 15 }}>
                  Sign In
                </Btn>
                <Btn variant="accent" href="/register" style={{ width: "100%", justifyContent: "center", fontSize: 15 }}>
                  Register
                </Btn>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

const GYM_QUOTES = [

  { text: "No days off.",                            size: "lg", accent: "orange"  },
  { text: "Earn it.",                                size: "xl", accent: "orange"  },
  { text: "Push harder.",                            size: "md", accent: "green"   },
  { text: "Rise & grind.",                           size: "md", accent: "blue"    },
  { text: "Train insane.",                           size: "lg", accent: "orange"  },
  { text: "One more rep.",                           size: "lg", accent: "green"   },
  { text: "Make it count.",                          size: "md", accent: "orange"  },
  { text: "Never quit.",                             size: "xl", accent: "green"   },
  { text: "Forge your limits.",                      size: "lg", accent: "orange"  },
  { text: "Suffer now, shine later.",                size: "sm", accent: "neutral" },
  { text: "Blood. Sweat. Gains.",                    size: "md", accent: "orange"  },
  { text: "Grind in silence.",                       size: "md", accent: "neutral" },
  { text: "Built, not born.",                        size: "lg", accent: "blue"    },
  { text: "Outwork everyone.",                       size: "md", accent: "green"   },
  { text: "Iron sharpens iron.",                     size: "sm", accent: "orange"  },
  { text: "Attack the day.",                         size: "md", accent: "green"   },
  { text: "Obsessed is a word the lazy use.",        size: "sm", accent: "neutral" },
  { text: "Discipline over motivation.",             size: "sm", accent: "blue"    },
  { text: "Train like a beast.",                     size: "lg", accent: "orange"  },
  { text: "Fear nothing.",                           size: "xl", accent: "green"   },
  { text: "Hustle for that muscle.",                 size: "sm", accent: "orange"  },
  { text: "Hard work beats talent.",                 size: "sm", accent: "neutral" },
  { text: "Zero excuses.",                           size: "lg", accent: "orange"  },
  { text: "Dominate.",                               size: "xl", accent: "blue"    },
  { text: "Every rep counts.",                       size: "md", accent: "green"   },
  { text: "Die empty.",                              size: "xl", accent: "orange"  },
  { text: "Champions are made here.",                size: "sm", accent: "neutral" },
  { text: "Leave it all on the floor.",              size: "sm", accent: "green"   },
  { text: "No shortcuts.",                           size: "lg", accent: "orange"  },
  { text: "Sweat is fat crying.",                    size: "sm", accent: "blue"    },
  { text: "Pain is a signal to keep going.",         size: "sm", accent: "orange"  },
  { text: "Pressure makes diamonds.",                size: "md", accent: "blue"    },
  { text: "Hard is good.",                           size: "lg", accent: "orange"  },
  { text: "Make the hard choice.",                   size: "md", accent: "green"   },
  { text: "Suffer smart.",                           size: "lg", accent: "orange"  },
  { text: "Grit over glamour.",                      size: "md", accent: "neutral" },
  { text: "Bend but never break.",                   size: "sm", accent: "blue"    },
  { text: "Bleed ambition.",                         size: "lg", accent: "orange"  },
  { text: "Brutal. Relentless. Unstoppable.",        size: "sm", accent: "orange"  },
  { text: "No pain, no story.",                      size: "sm", accent: "neutral" },
  { text: "Show no weakness.",                       size: "md", accent: "blue"    },
  { text: "Your body is your weapon.",               size: "sm", accent: "orange"  },
  { text: "Sweat seals the deal.",                   size: "sm", accent: "green"   },
  { text: "Earn every inch.",                        size: "md", accent: "orange"  },
  { text: "Grind until it clicks.",                  size: "sm", accent: "neutral" },
  { text: "Real results. No luck.",                  size: "sm", accent: "blue"    },
  { text: "Set. Rep. Conquer.",                      size: "sm", accent: "green"   },
  { text: "Hard times build hard people.",           size: "sm", accent: "neutral" },
  { text: "Outpace. Outlast. Outlift.",              size: "sm", accent: "orange"  },
  { text: "Fight for every pound.",                  size: "sm", accent: "blue"    },
  { text: "Wreck the record.",                       size: "md", accent: "orange"  },

  { text: "Show up. Every day.",                     size: "sm", accent: "neutral" },
  { text: "Sweat. Grind. Repeat.",                   size: "sm", accent: "blue"    },
  { text: "Progress, not perfection.",               size: "sm", accent: "neutral" },
  { text: "Commit to be fit.",                       size: "sm", accent: "green"   },
  { text: "Pain is temporary.",                      size: "sm", accent: "blue"    },
  { text: "Stronger every session.",                 size: "sm", accent: "neutral" },
  { text: "Be stronger than your excuses.",          size: "sm", accent: "neutral" },
  { text: "Your limits are in your head.",           size: "sm", accent: "orange"  },
  { text: "Small steps. Big results.",               size: "sm", accent: "green"   },
  { text: "Consistency is king.",                    size: "md", accent: "orange"  },
  { text: "Today's effort, tomorrow's body.",        size: "sm", accent: "neutral" },
  { text: "Fall seven times, rise eight.",           size: "sm", accent: "blue"    },
  { text: "One day or day one. You decide.",         size: "sm", accent: "neutral" },
  { text: "Make yourself proud.",                    size: "md", accent: "green"   },
  { text: "Believe in the process.",                 size: "sm", accent: "blue"    },
  { text: "Start where you are.",                    size: "sm", accent: "neutral" },
  { text: "Every session is a deposit.",             size: "sm", accent: "orange"  },
  { text: "Respect the grind.",                      size: "md", accent: "green"   },
  { text: "Slow progress is still progress.",        size: "sm", accent: "neutral" },
  { text: "Show up when it's hard.",                 size: "sm", accent: "blue"    },
  { text: "Trust the process.",                      size: "md", accent: "orange"  },
  { text: "Earn your rest.",                         size: "lg", accent: "green"   },
  { text: "Never miss a Monday.",                    size: "sm", accent: "orange"  },
  { text: "You are one workout away.",               size: "sm", accent: "neutral" },
  { text: "Do it for the future you.",               size: "sm", accent: "blue"    },
  { text: "Win the morning, win the day.",           size: "sm", accent: "green"   },
  { text: "Your only competition is yesterday.",     size: "sm", accent: "neutral" },
  { text: "Stay hard.",                              size: "xl", accent: "orange"  },
  { text: "Discipline is freedom.",                  size: "md", accent: "blue"    },
  { text: "Two percent better. Every day.",          size: "sm", accent: "neutral" },
  { text: "Show up even when unmotivated.",          size: "sm", accent: "blue"    },
  { text: "Routines build results.",                 size: "sm", accent: "green"   },
  { text: "The alarm is the first rep.",             size: "sm", accent: "orange"  },
  { text: "Habits outlast motivation.",              size: "sm", accent: "neutral" },
  { text: "Make it non-negotiable.",                 size: "sm", accent: "blue"    },
  { text: "Stack the days.",                         size: "md", accent: "green"   },
  { text: "Miss a day. Miss a step.",                size: "sm", accent: "orange"  },
  { text: "Same time. Every day. No mercy.",         size: "sm", accent: "neutral" },
  { text: "Repetition is the mother of mastery.",    size: "sm", accent: "blue"    },
  { text: "Show up hungry.",                         size: "md", accent: "orange"  },
  { text: "You did it yesterday. Do it today.",      size: "sm", accent: "neutral" },
  { text: "Good enough today builds great tomorrow.",size: "sm", accent: "green"   },
  { text: "The streak matters.",                     size: "md", accent: "blue"    },
  { text: "Lock in. Show out.",                      size: "md", accent: "orange"  },
  { text: "Never let yourself become soft.",         size: "sm", accent: "neutral" },
  { text: "Every day is training day.",              size: "sm", accent: "orange"  },
  { text: "Commit. Deliver. Repeat.",                size: "sm", accent: "green"   },
  { text: "You earn tomorrow's confidence today.",   size: "sm", accent: "blue"    },
  { text: "Don't count days. Make days count.",      size: "sm", accent: "neutral" },
  { text: "Routine is your rocket fuel.",            size: "sm", accent: "orange"  },

  { text: "Lift heavy. Live happy.",                 size: "sm", accent: "orange"  },
  { text: "Strong body. Strong mind.",               size: "sm", accent: "green"   },
  { text: "Muscles are earned, not given.",          size: "sm", accent: "neutral" },
  { text: "Be the strongest version.",               size: "sm", accent: "blue"    },
  { text: "Your body can do it.",                    size: "md", accent: "green"   },
  { text: "Build the body you deserve.",             size: "sm", accent: "orange"  },
  { text: "Strength is a choice.",                   size: "md", accent: "blue"    },
  { text: "Pain today. Power tomorrow.",             size: "sm", accent: "orange"  },
  { text: "More reps. More results.",                size: "sm", accent: "green"   },
  { text: "Work hard. Recover harder.",              size: "sm", accent: "neutral" },
  { text: "Abs are made in the kitchen too.",        size: "sm", accent: "blue"    },
  { text: "Cardio kills weakness.",                  size: "sm", accent: "orange"  },
  { text: "Feel the burn. Love the burn.",           size: "sm", accent: "green"   },
  { text: "Heavy weights. Light spirit.",            size: "sm", accent: "neutral" },
  { text: "Fuel your machine.",                      size: "md", accent: "orange"  },
  { text: "Reps don't lie.",                         size: "md", accent: "green"   },
  { text: "Flex on yesterday.",                      size: "md", accent: "blue"    },
  { text: "Bigger. Stronger. Faster.",               size: "sm", accent: "orange"  },
  { text: "Move weight. Move mountains.",            size: "sm", accent: "neutral" },
  { text: "Your best set is next.",                  size: "sm", accent: "green"   },
  { text: "Protein. Sleep. Repeat.",                 size: "sm", accent: "neutral" },
  { text: "Lift for the life you want.",             size: "sm", accent: "blue"    },
  { text: "PR every single day.",                    size: "md", accent: "orange"  },
  { text: "Strength lives in struggle.",             size: "sm", accent: "green"   },
  { text: "Tear it down. Rebuild better.",           size: "sm", accent: "orange"  },
  { text: "The pump is sacred.",                     size: "sm", accent: "neutral" },
  { text: "Add weight. Drop ego.",                   size: "sm", accent: "blue"    },
  { text: "Plates don't care about your feelings.",  size: "sm", accent: "orange"  },
  { text: "Power is earned in silence.",             size: "sm", accent: "neutral" },
  { text: "Steel mind. Iron body.",                  size: "md", accent: "orange"  },
  { text: "Mass moves mountains.",                   size: "sm", accent: "green"   },
  { text: "Core tight. Eyes forward.",               size: "sm", accent: "blue"    },
  { text: "Five plates or nothing.",                 size: "sm", accent: "orange"  },
  { text: "Don't just look strong. Be strong.",      size: "sm", accent: "neutral" },
  { text: "Squat deep. Live deeper.",                size: "sm", accent: "green"   },
  { text: "Every fibre. Every rep.",                 size: "sm", accent: "orange"  },
  { text: "Build power that can't be faked.",        size: "sm", accent: "neutral" },
  { text: "Grow or stagnate. Choose.",               size: "sm", accent: "blue"    },
  { text: "The deadlift doesn't lie.",               size: "sm", accent: "orange"  },
  { text: "One more kilo. One more win.",            size: "sm", accent: "green"   },
  { text: "Strength is built rep by rep.",           size: "sm", accent: "neutral" },
  { text: "Bigger reps. Bigger dreams.",             size: "sm", accent: "blue"    },

  { text: "Be relentless.",                          size: "xl", accent: "orange"  },
  { text: "Hunger never sleeps.",                    size: "md", accent: "green"   },
  { text: "Wake up. Work out. Conquer.",             size: "sm", accent: "neutral" },
  { text: "Legends are self-made.",                  size: "md", accent: "blue"    },
  { text: "The gym is my therapy.",                  size: "sm", accent: "orange"  },
  { text: "Be the person you admire.",               size: "sm", accent: "neutral" },
  { text: "Unstoppable.",                            size: "xl", accent: "green"   },
  { text: "Commit. Conquer. Repeat.",                size: "sm", accent: "orange"  },
  { text: "Greatness is a daily habit.",             size: "sm", accent: "blue"    },
  { text: "Push past the pause.",                    size: "md", accent: "green"   },
  { text: "Sweat now. Shine always.",                size: "sm", accent: "orange"  },
  { text: "You've got this.",                        size: "lg", accent: "green"   },
  { text: "The grind is the goal.",                  size: "sm", accent: "neutral" },
  { text: "Champions embrace the struggle.",         size: "sm", accent: "blue"    },
  { text: "Fire in. Steel out.",                     size: "md", accent: "orange"  },
  { text: "Dig deep.",                               size: "xl", accent: "green"   },
  { text: "Your body keeps score.",                  size: "sm", accent: "neutral" },
  { text: "Stronger than excuses.",                  size: "md", accent: "orange"  },
  { text: "Own every rep.",                          size: "md", accent: "blue"    },
  { text: "Refuse to be average.",                   size: "sm", accent: "green"   },
  { text: "The pain is part of the plan.",           size: "sm", accent: "neutral" },
  { text: "Outrun your old self.",                   size: "md", accent: "orange"  },
  { text: "Every drop of sweat matters.",            size: "sm", accent: "blue"    },
  { text: "Sacrifice today for tomorrow.",           size: "sm", accent: "neutral" },
  { text: "Make your body your masterpiece.",        size: "sm", accent: "orange"  },
  { text: "Rise before the sun.",                    size: "md", accent: "green"   },
  { text: "Champions are born in the dark.",         size: "sm", accent: "neutral" },
  { text: "Prove your potential.",                   size: "md", accent: "blue"    },
  { text: "The world belongs to the disciplined.",   size: "sm", accent: "orange"  },
  { text: "Visionaries outwork everyone.",           size: "sm", accent: "green"   },
  { text: "Burn for something real.",                size: "md", accent: "orange"  },
  { text: "Obsession fuels elevation.",              size: "sm", accent: "neutral" },
  { text: "Make history or make excuses.",           size: "sm", accent: "blue"    },
  { text: "Hunger is the best supplement.",          size: "sm", accent: "orange"  },
  { text: "Let results speak.",                      size: "md", accent: "green"   },
  { text: "Warriors are made, not born.",            size: "sm", accent: "neutral" },
  { text: "Burn bright. Burn long.",                 size: "sm", accent: "orange"  },
  { text: "Chase the version that scares you.",      size: "sm", accent: "blue"    },
  { text: "The future rewards the present.",         size: "sm", accent: "neutral" },
  { text: "Do it with passion or not at all.",       size: "sm", accent: "orange"  },
  { text: "Be the reason they started.",             size: "sm", accent: "green"   },
  { text: "Rise beyond ordinary.",                   size: "md", accent: "blue"    },
  { text: "Invest in your body every day.",          size: "sm", accent: "orange"  },
  { text: "A warrior's mindset.",                    size: "md", accent: "neutral" },
  { text: "The mountain bows to the consistent.",   size: "sm", accent: "green"   },
  { text: "Legends never tap out.",                  size: "md", accent: "orange"  },
  { text: "Leave nothing in the tank.",              size: "sm", accent: "neutral" },
  { text: "Your fire won't die here.",               size: "sm", accent: "orange"  },

  { text: "Rest is part of the plan.",               size: "sm", accent: "neutral" },
  { text: "Sleep is the secret weapon.",             size: "sm", accent: "blue"    },
  { text: "Recover like a champion.",                size: "md", accent: "green"   },
  { text: "Hard days need soft nights.",             size: "sm", accent: "neutral" },
  { text: "Recovery is training.",                   size: "md", accent: "blue"    },
  { text: "Recharge. Return. Repeat.",               size: "sm", accent: "green"   },
  { text: "Muscles grow when you rest.",             size: "sm", accent: "neutral" },
  { text: "Stretch today. Perform tomorrow.",        size: "sm", accent: "blue"    },
  { text: "Honor the off day.",                      size: "sm", accent: "neutral" },
  { text: "Water is the original pre-workout.",      size: "sm", accent: "blue"    },
  { text: "Eight hours of sleep. Zero regrets.",     size: "sm", accent: "neutral" },
  { text: "Eat to perform. Rest to grow.",           size: "sm", accent: "green"   },
  { text: "Even elite athletes recover.",            size: "sm", accent: "blue"    },
  { text: "Active rest is still a win.",             size: "sm", accent: "neutral" },
  { text: "Foam roll. Stretch. Conquer.",            size: "sm", accent: "green"   },
  { text: "You can't pour from an empty tank.",      size: "sm", accent: "neutral" },
  { text: "Inflammation is feedback. Listen.",       size: "sm", accent: "blue"    },
  { text: "Strong muscles need recovery days.",      size: "sm", accent: "neutral" },
  { text: "Recover smart. Come back stronger.",      size: "sm", accent: "green"   },
  { text: "Rehydrate. Replenish. Rebuild.",          size: "sm", accent: "blue"    },

  { text: "Compete with who you were.",              size: "sm", accent: "orange"  },
  { text: "Outrun your shadow.",                     size: "md", accent: "green"   },
  { text: "Your rival is in the mirror.",            size: "sm", accent: "neutral" },
  { text: "Let them doubt. Let them watch.",         size: "sm", accent: "blue"    },
  { text: "Silence the doubt with results.",         size: "sm", accent: "orange"  },
  { text: "Nobody trains like you when no one sees.",size: "sm", accent: "neutral" },
  { text: "Be a threat.",                            size: "lg", accent: "orange"  },
  { text: "Outclass. Outlast.",                      size: "md", accent: "green"   },
  { text: "The scoreboard doesn't lie.",             size: "sm", accent: "blue"    },
  { text: "Run your own race.",                      size: "md", accent: "neutral" },
  { text: "Train in secret. Win in public.",         size: "sm", accent: "orange"  },
  { text: "Nobody outworks you today.",              size: "sm", accent: "green"   },
  { text: "They're watching. Keep going.",           size: "sm", accent: "neutral" },
  { text: "Outlift. Outthink. Outperform.",          size: "sm", accent: "blue"    },
  { text: "The podium is built in practice.",        size: "sm", accent: "orange"  },
  { text: "Compete with the you of yesterday.",      size: "sm", accent: "neutral" },
  { text: "Win the silent battle first.",            size: "sm", accent: "green"   },
  { text: "Let your progress do the talking.",       size: "sm", accent: "blue"    },
  { text: "They rested. You trained.",               size: "md", accent: "orange"  },
  { text: "While they sleep, you build.",            size: "sm", accent: "neutral" },

  { text: "Dream it. Train it. Live it.",            size: "sm", accent: "orange"  },
  { text: "Set goals that terrify you.",             size: "sm", accent: "blue"    },
  { text: "The goal is never out of reach.",         size: "sm", accent: "neutral" },
  { text: "Visualise. Mobilise. Actualise.",         size: "sm", accent: "green"   },
  { text: "Know your why.",                          size: "lg", accent: "orange"  },
  { text: "See the finish line. Run anyway.",        size: "sm", accent: "neutral" },
  { text: "Aim high. Train higher.",                 size: "sm", accent: "blue"    },
  { text: "One goal. Total focus.",                  size: "md", accent: "orange"  },
  { text: "The goal doesn't care how you feel.",     size: "sm", accent: "neutral" },
  { text: "Anchor your vision. Execute daily.",      size: "sm", accent: "green"   },
  { text: "Your dream physique trains when tired.",  size: "sm", accent: "blue"    },
  { text: "Goals without work are just wishes.",     size: "sm", accent: "neutral" },
  { text: "Define it. Refine it. Achieve it.",       size: "sm", accent: "orange"  },
  { text: "Today's reps build tomorrow's results.",  size: "sm", accent: "green"   },
  { text: "Ambition without discipline is noise.",   size: "sm", accent: "blue"    },
  { text: "Make your goals laugh-proof.",            size: "sm", accent: "neutral" },
  { text: "Document the journey. Celebrate the win.",size: "sm", accent: "orange"  },
  { text: "Big goals demand bigger effort.",         size: "sm", accent: "green"   },
  { text: "Targets don't hit themselves.",           size: "sm", accent: "neutral" },
  { text: "Put a date on the dream.",                size: "md", accent: "blue"    },

  { text: "5AM or 9PM. Just show up.",               size: "sm", accent: "orange"  },
  { text: "Wake up with intention.",                 size: "sm", accent: "neutral" },
  { text: "Make the bed. Hit the gym.",              size: "sm", accent: "blue"    },
  { text: "Discipline is the edge.",                 size: "md", accent: "orange"  },
  { text: "Control what you can control.",           size: "sm", accent: "neutral" },
  { text: "One decision separates you.",             size: "sm", accent: "green"   },
  { text: "Do the thing before you're ready.",       size: "sm", accent: "orange"  },
  { text: "First rep is always the hardest.",        size: "sm", accent: "neutral" },
  { text: "Structure beats motivation.",             size: "sm", accent: "blue"    },
  { text: "Delay the gratification.",                size: "sm", accent: "neutral" },
  { text: "What you do alone defines you.",          size: "sm", accent: "orange"  },
  { text: "Your morning sets the tone.",             size: "sm", accent: "green"   },
  { text: "Non-negotiables. Every day.",             size: "sm", accent: "neutral" },
  { text: "Schedule it. Protect it. Own it.",        size: "sm", accent: "blue"    },
  { text: "Discipline today. Freedom tomorrow.",     size: "sm", accent: "orange"  },
  { text: "Zero days off from discipline.",          size: "sm", accent: "neutral" },
  { text: "Own the calendar.",                       size: "md", accent: "green"   },
  { text: "Every hour is a training opportunity.",   size: "sm", accent: "blue"    },
  { text: "Steady wins every time.",                 size: "sm", accent: "neutral" },
  { text: "Stop waiting. Start lifting.",            size: "md", accent: "orange"  },

  { text: "Train at APEX. Become one.",              size: "sm", accent: "orange"  },
  { text: "Nigeria's strongest train here.",         size: "sm", accent: "neutral" },
  { text: "Naija iron never rusts.",                 size: "md", accent: "green"   },
  { text: "From Lagos to your best self.",           size: "sm", accent: "blue"    },
  { text: "Built in Nigeria.",                       size: "lg", accent: "orange"  },
  { text: "Show up. Level up. Win.",                 size: "sm", accent: "green"   },
  { text: "Apex: where limits are broken.",          size: "sm", accent: "neutral" },
  { text: "Train hard. Stay sharp.",                 size: "md", accent: "orange"  },
  { text: "From Lekki to limits.",                   size: "sm", accent: "green"   },
  { text: "Lagos grit. Lagos hustle. One gym.",      size: "sm", accent: "neutral" },
  { text: "Lagos' finest train here.",               size: "sm", accent: "blue"    },
  { text: "Lekki sweat. Lagos results.",             size: "sm", accent: "orange"  },
  { text: "Apex bodies. Nigerian pride.",            size: "sm", accent: "green"   },
  { text: "We forge champions, not excuses.",        size: "sm", accent: "neutral" },
  { text: "Nigeria's next champion lifts here.",     size: "sm", accent: "orange"  },
  { text: "Train like a Naija titan.",               size: "md", accent: "green"   },
  { text: "From the hustle to the muscle.",          size: "sm", accent: "neutral" },
  { text: "The best gym in Africa. Prove it.",       size: "sm", accent: "orange"  },

  { text: "Go.",                                     size: "xl", accent: "orange"  },
  { text: "Lift.",                                   size: "xl", accent: "green"   },
  { text: "Win.",                                    size: "xl", accent: "blue"    },
  { text: "Now.",                                    size: "xl", accent: "orange"  },
  { text: "More.",                                   size: "xl", accent: "green"   },
  { text: "Move.",                                   size: "xl", accent: "blue"    },
  { text: "Grind.",                                  size: "xl", accent: "orange"  },
  { text: "Rise.",                                   size: "xl", accent: "green"   },
  { text: "Fight.",                                  size: "xl", accent: "orange"  },
  { text: "Beast mode.",                             size: "lg", accent: "orange"  },
  { text: "Don't stop.",                             size: "lg", accent: "green"   },
  { text: "Eyes forward.",                           size: "lg", accent: "blue"    },
  { text: "Stay the course.",                        size: "md", accent: "neutral" },
  { text: "No regrets.",                             size: "lg", accent: "orange"  },
  { text: "Last set. Best set.",                     size: "md", accent: "green"   },
  { text: "Do the work.",                            size: "lg", accent: "orange"  },
  { text: "Keep moving.",                            size: "lg", accent: "blue"    },
  { text: "Head down. Grind on.",                    size: "md", accent: "neutral" },
  { text: "Next level. Always.",                     size: "md", accent: "green"   },
  { text: "Hit it. Hard.",                           size: "lg", accent: "orange"  },
  { text: "Zero limits.",                            size: "lg", accent: "green"   },
  { text: "All gas. No brakes.",                     size: "sm", accent: "orange"  },
  { text: "Iron never lies.",                        size: "md", accent: "neutral" },
  { text: "Run toward hard things.",                 size: "sm", accent: "blue"    },
  { text: "Full send.",                              size: "xl", accent: "green"   },
  { text: "Make the bar your best friend.",          size: "sm", accent: "orange"  },
  { text: "Reps build character.",                   size: "sm", accent: "neutral" },
  { text: "No one remembers easy.",                  size: "sm", accent: "blue"    },
  { text: "Sweat is your signature.",                size: "sm", accent: "green"   },
  { text: "Inhale courage. Exhale doubt.",           size: "sm", accent: "neutral" },
  { text: "Strength doesn't ask permission.",        size: "sm", accent: "orange"  },
  { text: "Be the proof.",                           size: "lg", accent: "green"   },
  { text: "Love the process.",                       size: "md", accent: "blue"    },
  { text: "The clock is always running.",            size: "sm", accent: "neutral" },
  { text: "Train today. Thank yourself later.",      size: "sm", accent: "orange"  },
  { text: "Muscles don't grow in comfort.",          size: "sm", accent: "green"   },
  { text: "A little more. Every time.",              size: "sm", accent: "neutral" },
  { text: "Weak is a choice.",                       size: "md", accent: "blue"    },
  { text: "Cardio is a mindset.",                    size: "sm", accent: "orange"  },
  { text: "Lift until it's light.",                  size: "sm", accent: "green"   },
  { text: "The bar is waiting.",                     size: "md", accent: "orange"  },
  { text: "Every workout rewrites you.",             size: "sm", accent: "neutral" },
  { text: "You regret what you didn't do.",          size: "sm", accent: "blue"    },
  { text: "Prove them wrong. Prove you right.",      size: "sm", accent: "orange"  },
  { text: "Show up ugly. Leave a champion.",         size: "sm", accent: "neutral" },
  { text: "The weights never lie.",                  size: "sm", accent: "green"   },
  { text: "Today's pain is tomorrow's power.",       size: "sm", accent: "orange"  },
  { text: "Empty the tank.",                         size: "lg", accent: "green"   },
  { text: "No one is coming to save you.",           size: "sm", accent: "neutral" },
  { text: "Build the version they envy.",            size: "sm", accent: "blue"    },
  { text: "Sore today. Strong tomorrow.",            size: "sm", accent: "orange"  },
  { text: "Conquer the morning.",                    size: "md", accent: "green"   },
  { text: "One rep at a time.",                      size: "sm", accent: "neutral" },
  { text: "Thrive under pressure.",                  size: "sm", accent: "blue"    },
  { text: "Sweat changes everything.",               size: "sm", accent: "orange"  },
  { text: "Forged in fire.",                         size: "lg", accent: "orange"  },
  { text: "Mental strength is physical strength.",   size: "sm", accent: "neutral" },
  { text: "Every set is a statement.",               size: "sm", accent: "green"   },
  { text: "Suffer the good kind.",                   size: "sm", accent: "neutral" },
  { text: "Lift. Eat. Sleep. Grow.",                 size: "sm", accent: "green"   },
  { text: "Load the bar. Clear the mind.",           size: "sm", accent: "blue"    },
  { text: "Hit the gym like it owes you.",           size: "sm", accent: "orange"  },
  { text: "Less talk. More plates.",                 size: "md", accent: "neutral" },
  { text: "Chase the feeling.",                      size: "lg", accent: "orange"  },
  { text: "Never tap out.",                          size: "lg", accent: "green"   },
  { text: "Be unapologetically strong.",             size: "sm", accent: "blue"    },
  { text: "There's always one more in the tank.",    size: "sm", accent: "orange"  },
  { text: "Earn the protein.",                       size: "sm", accent: "green"   },
  { text: "Locked in.",                              size: "xl", accent: "orange"  },
  { text: "Savage.",                                 size: "xl", accent: "blue"    },
  { text: "Athlete.",                                size: "xl", accent: "green"   },
  { text: "Iron.",                                   size: "xl", accent: "neutral" },
  { text: "Focused.",                                size: "xl", accent: "orange"  },
  { text: "Built.",                                  size: "xl", accent: "green"   },
  { text: "Relentless.",                             size: "xl", accent: "orange"  },
  { text: "Absolute.",                               size: "xl", accent: "blue"    },
  { text: "Lethal.",                                 size: "xl", accent: "orange"  },
  { text: "Elite.",                                  size: "xl", accent: "green"   },
  { text: "Primal.",                                 size: "xl", accent: "orange"  },
  { text: "Apex.",                                   size: "xl", accent: "orange"  },
  { text: "Born to lift.",                           size: "lg", accent: "orange"  },
  { text: "No filter. No excuses.",                  size: "sm", accent: "neutral" },
  { text: "Hungry every day.",                       size: "md", accent: "orange"  },
  { text: "Build in silence. Emerge loud.",          size: "sm", accent: "neutral" },
  { text: "Pound for pound, you've got this.",       size: "sm", accent: "green"   },
  { text: "Earn the sweat. Wear it proudly.",        size: "sm", accent: "orange"  },
  { text: "No ceilings in this gym.",                size: "sm", accent: "blue"    },
  { text: "Unbreakable.",                            size: "xl", accent: "orange"  },
  { text: "Irreplaceable effort.",                   size: "sm", accent: "neutral" },
  { text: "Loaded barbell. Clear mind.",             size: "sm", accent: "green"   },
  { text: "Train with fury. Recover with grace.",    size: "sm", accent: "neutral" },
  { text: "Earn each calorie you eat.",              size: "sm", accent: "orange"  },
  { text: "Push until your arms shake.",             size: "sm", accent: "green"   },
  { text: "Rep range: infinite.",                    size: "sm", accent: "neutral" },
  { text: "Set the standard.",                       size: "md", accent: "blue"    },
  { text: "Grow through what you go through.",       size: "sm", accent: "orange"  },
  { text: "Pain is just weakness leaving.",          size: "sm", accent: "neutral" },
  { text: "Hunger is the best coach.",               size: "sm", accent: "green"   },
  { text: "Lift heavy. Think light.",                size: "sm", accent: "blue"    },
  { text: "You came here. Finish it.",               size: "md", accent: "orange"  },
  { text: "Greatest set of your life. Now.",         size: "sm", accent: "green"   },
  { text: "Make this workout legendary.",            size: "sm", accent: "orange"  },
  { text: "Volume. Intensity. Victory.",             size: "sm", accent: "neutral" },
  { text: "Don't stop until you're proud.",          size: "sm", accent: "blue"    },
  { text: "Hard reps. Soft heart. Iron will.",       size: "sm", accent: "orange"  },
  { text: "Your PR is tomorrow. Train today.",       size: "sm", accent: "neutral" },
  { text: "It always seems impossible until it's done.", size: "sm", accent: "blue" },
  { text: "Impossible is just an opinion.",         size: "sm", accent: "orange"  },
  { text: "Every champion was once a beginner.",     size: "sm", accent: "neutral" },
  { text: "Push past what you think you can do.",    size: "sm", accent: "green"   },
  { text: "The only bad workout is none.",           size: "sm", accent: "neutral" },
  { text: "Results don't care about your mood.",     size: "sm", accent: "orange"  },
  { text: "Execute. Evaluate. Evolve.",              size: "sm", accent: "blue"    },
  { text: "This is where legends train.",            size: "md", accent: "orange"  },
  { text: "You're stronger than you think.",         size: "md", accent: "green"   },
  { text: "Your comeback starts now.",               size: "md", accent: "orange"  },
  { text: "Fear the man who practises one kick.",    size: "sm", accent: "neutral" },
  { text: "The best view comes after the hardest climb.", size: "sm", accent: "blue" },
  { text: "Earned. Not given.",                      size: "lg", accent: "orange"  },
  { text: "Sacrifice is the price of greatness.",    size: "sm", accent: "neutral" },
  { text: "Build a body that lasts a lifetime.",     size: "sm", accent: "green"   },
  { text: "Train for longevity.",                    size: "sm", accent: "blue"    },
  { text: "Better than yesterday. Always.",          size: "sm", accent: "orange"  },
  { text: "The journey IS the destination.",         size: "sm", accent: "neutral" },
  { text: "Never look back. You're not going there.",size: "sm", accent: "blue"    },
  { text: "Sweat equity builds real wealth.",        size: "sm", accent: "orange"  },
  { text: "Character is built between reps.",        size: "sm", accent: "neutral" },
  { text: "Be somebody who makes everybody better.", size: "sm", accent: "green"   },
  { text: "Stack gains like currency.",              size: "sm", accent: "orange"  },
  { text: "Obsess over the process.",                size: "sm", accent: "neutral" },
  { text: "Train like you've never won. Perform like you never lose.", size: "sm", accent: "blue" },
  { text: "Gym is not a punishment. It's a privilege.", size: "sm", accent: "neutral" },
  { text: "Move the needle every single day.",       size: "sm", accent: "orange"  },
  { text: "Brick by brick. Rep by rep.",             size: "sm", accent: "green"   },
  { text: "Stoke the fire within.",                  size: "md", accent: "orange"  },
  { text: "Own the grind.",                          size: "lg", accent: "green"   },
  { text: "Strength has no off-season.",             size: "sm", accent: "neutral" },
  { text: "Quiet the noise. Feel the iron.",         size: "sm", accent: "blue"    },
  { text: "No version of you quits.",                size: "md", accent: "orange"  },
  { text: "The weights are lighter than regret.",    size: "sm", accent: "neutral" },
  { text: "Get comfortable being uncomfortable.",    size: "sm", accent: "green"   },
  { text: "Fuel the fire. Fan the flame.",           size: "sm", accent: "orange"  },
  { text: "Rise and repeat.",                        size: "lg", accent: "green"   },
  { text: "You didn't come this far to only come this far.", size: "sm", accent: "neutral" },
  { text: "Outgrind yesterday.",                     size: "md", accent: "orange"  },
  { text: "Real ones don't skip leg day.",           size: "sm", accent: "blue"    },
  { text: "Break barriers. Build muscle.",           size: "sm", accent: "orange"  },
  { text: "Your warmup is someone else's max.",      size: "sm", accent: "neutral" },
  { text: "Silence is your gym playlist.",           size: "sm", accent: "green"   },
  { text: "Rip it. Rest it. Repeat it.",             size: "sm", accent: "orange"  },
  { text: "APEX or nothing.",                        size: "lg", accent: "orange"  },
  { text: "Floor to glory.",                         size: "md", accent: "green"   },
  { text: "One more before the mirror lies.",        size: "sm", accent: "neutral" },
  { text: "No finish line.",                         size: "lg", accent: "orange"  },
  { text: "The clock stops for no one.",             size: "sm", accent: "neutral" },
  { text: "Make your ancestors proud.",              size: "sm", accent: "orange"  },
];

const ACCENT_STYLES = {
  orange:  { bg: "rgba(249,169,123,0.12)", border: "rgba(249,169,123,0.22)", color: "#f9a97b" },
  green:   { bg: "rgba(111,207,151,0.11)", border: "rgba(111,207,151,0.22)", color: "#6fcf97" },
  blue:    { bg: "rgba(126,180,249,0.11)", border: "rgba(126,180,249,0.22)", color: "#7eb4f9" },
  neutral: { bg: "rgba(255,255,255,0.05)", border: "rgba(255,255,255,0.09)", color: "rgba(244,237,230,0.55)" },
};

const QUOTE_SIZE_STYLE = {
  xl: { fontSize: 26, fontWeight: 900, letterSpacing: -1,   padding: "14px 22px", borderRadius: 18 },
  lg: { fontSize: 18, fontWeight: 800, letterSpacing: -.3,  padding: "11px 18px", borderRadius: 14 },
  md: { fontSize: 14, fontWeight: 700, letterSpacing: 0,    padding: "9px  15px", borderRadius: 12 },
  sm: { fontSize: 12, fontWeight: 600, letterSpacing: ".2px", padding: "7px 13px", borderRadius: 10 },
};

const BUBBLE_SLOTS = [
  { top: "7%",  left: "8%",   startIdx: 0  },
  { top: "9%",  right: "7%",  startIdx: 4  },
  { top: "30%", left: "6%",   startIdx: 8  },
  { top: "36%", right: "9%",  startIdx: 2  },
  { top: "56%", left: "10%",  startIdx: 12 },
  { top: "60%", right: "5%",  startIdx: 6  },
  { top: "78%", left: "18%",  startIdx: 10 },
  { top: "80%", right: "14%", startIdx: 14 },
];

const PRIME_STEPS = [7, 11, 13, 17, 19, 23, 29, 31];

function QuoteBubble({ slot, initialIdx }) {
  const offset = BUBBLE_SLOTS.indexOf(slot);
  const step   = PRIME_STEPS[offset % PRIME_STEPS.length];
  const delay  = offset * 520 + Math.random() * 300;
  const hold   = 2600 + (offset % 4) * 500;

  const [idx, setIdx]         = useState(initialIdx % GYM_QUOTES.length);
  const [visible, setVisible] = useState(false);

  useEffect(() => {

    const initTimer = setTimeout(() => setVisible(true), delay);

    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setIdx(i => (i + step) % GYM_QUOTES.length);
        setVisible(true);
      }, 480);
    }, hold + 480);

    return () => { clearTimeout(initTimer); clearInterval(interval); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const q    = GYM_QUOTES[idx];
  const ac   = ACCENT_STYLES[q.accent];
  const sz   = QUOTE_SIZE_STYLE[q.size];

  return (
    <div style={{
      position: "absolute", ...slot,
      opacity:    visible ? 1 : 0,
      transform:  visible ? "scale(1) translateY(0)"      : "scale(0.78) translateY(10px)",
      filter:     visible ? "blur(0px)"                   : "blur(6px)",
      transition: "opacity 0.45s cubic-bezier(0.34,1.4,0.64,1), transform 0.45s cubic-bezier(0.34,1.4,0.64,1), filter 0.45s ease",
      background: ac.bg,
      border:     `1px solid ${ac.border}`,
      borderRadius: sz.borderRadius,
      padding:    sz.padding,
      backdropFilter: "blur(12px)",
      maxWidth:   220,
      boxShadow:  "0 4px 20px rgba(0,0,0,0.20)",
      zIndex:     2,
    }}>
      <span style={{ fontSize: sz.fontSize, fontWeight: sz.fontWeight,
        letterSpacing: sz.letterSpacing, color: ac.color, lineHeight: 1.2 }}>
        {q.text}
      </span>
    </div>
  );
}

function AnimatedQuotesPanel() {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%" }}>

      <div style={{ position: "absolute", inset: 0, borderRadius: 28,
        background: "linear-gradient(160deg, #0d1a10 0%, #111 40%, #0d1510 100%)" }} />

      <div style={{ position: "absolute", inset: 0, borderRadius: 28, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(249,169,123,0.035) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(249,169,123,0.035) 1px, transparent 1px)`,
        backgroundSize: "44px 44px",
      }} />

      <div style={{ position: "absolute", inset: 0, borderRadius: 28, pointerEvents: "none",
        background: `radial-gradient(ellipse 60% 50% at 30% 25%, rgba(249,169,123,0.06) 0%, transparent 65%),
                     radial-gradient(ellipse 50% 60% at 75% 70%, rgba(33,82,53,0.14) 0%, transparent 60%)`,
      }} />

      {BUBBLE_SLOTS.map((slot, i) => (
        <QuoteBubble key={i} slot={slot} initialIdx={slot.startIdx} />
      ))}
    </div>
  );
}

function Hero({ onPlansOpen, onContactOpen }) {
  return (
    <section className="apex-hero-section" style={{
      minHeight: "100vh", padding: "clamp(100px,14vw,140px) clamp(16px,5vw,48px) clamp(48px,8vw,80px)",
      display: "grid", gap: "clamp(24px,5vw,60px)", alignItems: "center",
      position: "relative", overflow: "visible", background: C.bg,
    }}>
      <style>{`
        .apex-hero-section { grid-template-columns: minmax(0,1fr) minmax(0,1fr); }
        .apex-hero-quote-panel { height: 520px; min-width: 0; }
        @media (max-width: 860px) {
          .apex-hero-section { grid-template-columns: minmax(0,1fr); }
          .apex-hero-quote-panel { display: none; }
        }
      `}</style>

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 70% 60% at 60% 30%, var(--glow-1) 0%, transparent 65%),
                     radial-gradient(ellipse 40% 40% at 10% 80%, var(--glow-2) 0%, transparent 55%)`,
      }} />

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(var(--grid-line) 1px, transparent 1px),
                          linear-gradient(90deg, var(--grid-line) 1px, transparent 1px)`,
        backgroundSize: "56px 56px",
      }} />

      <div style={{ position: "relative", zIndex: 2 }}>
        <div style={{
          display: "inline-flex", alignItems: "center", gap: 8,
          background: C.accentDim, border: `1px solid ${C.accentBorder}`,
          color: C.accentText, padding: "7px 16px", borderRadius: 100,
          fontSize: 12, fontWeight: 700, letterSpacing: ".8px", textTransform: "uppercase",
          marginBottom: 28,
        }}>
          <span style={{ width: 6, height: 6, background: C.accentText, borderRadius: "50%",
            animation: "blink 2s infinite", flexShrink: 0 }} />
          Lekki Phase 1, Lagos
        </div>

        <h1 style={{
          fontSize: "clamp(52px,7vw,88px)", fontWeight: 900, lineHeight: .95,
          letterSpacing: -3, textTransform: "uppercase", marginBottom: 24, color: C.text,
        }}>
          FORGE<br />YOUR{" "}
          <span style={{
            backgroundImage: GRADIENT, WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent", backgroundClip: "text",
          }}>LIMITS</span>
        </h1>

        <p style={{ fontSize: 17, color: C.muted, maxWidth: 460, lineHeight: 1.75, marginBottom: 40 }}>
          Premium gym memberships built for people who take their fitness seriously.
          World-class equipment, expert trainers, plans that flex with you.
        </p>

        <div style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 56 }}>
          <Btn variant="accent" size="lg" onClick={onPlansOpen}>Explore Plans</Btn>
          <Btn variant="accentOutline" size="lg"
            href="https://app.lapentor.com/sphere/gym-10">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 6 }}>
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 2a15 15 0 0 1 4 10 15 15 0 0 1-4 10 15 15 0 0 1-4-10 15 15 0 0 1 4-10z"/>
            </svg>
            360° Tour
          </Btn>
        </div>

        <div style={{ display: "flex", gap: "clamp(20px,5vw,40px)", flexWrap: "wrap" }}>
          {[["12K", "Active Members"], ["50", "Weekly Classes"], ["30", "Expert Trainers"]].map(([val, lbl]) => (
            <div key={lbl}>
              <div style={{ fontSize: "clamp(22px,4vw,30px)", fontWeight: 900, letterSpacing: -1, lineHeight: 1, color: C.text }}>
                {val}<span style={{ color: C.accentText }}>+</span>
              </div>
              <div style={{ fontSize: 12, color: C.muted, letterSpacing: ".5px", marginTop: 4 }}>{lbl}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="apex-hero-quote-panel" style={{ position: "relative", zIndex: 2 }}>

        <div style={{
          width: "100%", height: "100%", borderRadius: 28,
          border: `1px solid ${C.borderStrong}`,
          boxShadow: "0 32px 80px rgba(0,0,0,0.30)",
          overflow: "hidden",
        }}>
          <AnimatedQuotesPanel />
        </div>

      </div>
    </section>
  );
}

function Marquee() {
  const items = ["Strength Training", "Power Yoga", "HIIT Workouts", "Spin Classes",
    "Personal Training", "Nutrition Coaching", "Pilates", "Boxing & Combat"];
  const doubled = [...items, ...items];
  return (
    <div style={{ borderTop: `1px solid ${C.border}`, borderBottom: `1px solid ${C.border}`,
      padding: "16px 0", overflow: "hidden", background: C.surface }}>
      <div style={{ display: "flex", whiteSpace: "nowrap", animation: "scroll 30s linear infinite" }}>
        {doubled.map((item, i) => (
          <span key={i} style={{ display: "inline-flex", alignItems: "center", gap: 14,
            padding: "0 28px", fontSize: 12, fontWeight: 700, letterSpacing: 2,
            textTransform: "uppercase", color: C.muted, flexShrink: 0 }}>
            <span style={{ width: 4, height: 4, background: C.accentText, borderRadius: "50%", flexShrink: 0 }} />
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}

function ParallaxBand() {
  const STATS = [
    { value: "12,000+", label: "Active Members" },
    { value: "50+",     label: "Weekly Classes" },
    { value: "1",       label: "Premium Location" },
    { value: "98%",     label: "Member Satisfaction" },
  ];
  return (
    <section style={{
      position: "relative",
      backgroundImage: `linear-gradient(160deg, #0d1a10 0%, #1a2e1e 40%, #101a12 100%)`,
      backgroundAttachment: "fixed",
      backgroundSize: "cover",
      backgroundPosition: "center",
      padding: "clamp(48px,8vw,96px) clamp(16px,5vw,48px)",
      overflow: "hidden",
    }}>

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(249,169,123,0.04) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(249,169,123,0.04) 1px, transparent 1px)`,
        backgroundSize: "60px 60px",
      }} />

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 80% 60% at 50% 50%, rgba(249,169,123,0.06) 0%, transparent 70%)`,
      }} />

      <div style={{ position: "relative", zIndex: 2, maxWidth: 1100, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 64 }}>
          <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "3px", textTransform: "uppercase",
            color: "rgba(249,169,123,0.70)", marginBottom: 16 }}>
            - The Numbers Don't Lie -
          </div>
          <h2 style={{
            fontSize: "clamp(28px,5vw,60px)", fontWeight: 900, letterSpacing: -2,
            textTransform: "uppercase", color: "#f4ede6", lineHeight: 1.0,
          }}>
            NIGERIA'S FASTEST<br />
            <span style={{
              backgroundImage: GRADIENT,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>GROWING GYM NETWORK</span>
          </h2>
        </div>

        <div className="apex-stats-grid" style={{ display: "grid", gap: 2 }}>
          <style>{`.apex-stats-grid { grid-template-columns: repeat(4,1fr); } @media(max-width:640px){.apex-stats-grid{grid-template-columns:1fr 1fr;}}`}</style>
          {STATS.map((s, i) => (
            <div key={s.label} style={{
              textAlign: "center", padding: "clamp(24px,4vw,40px) 24px",
              borderRight: i < 3 ? "1px solid rgba(255,255,255,0.06)" : "none",
              borderTop: "1px solid rgba(255,255,255,0.06)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              borderLeft: i === 0 ? "1px solid rgba(255,255,255,0.06)" : "none",
            }}>
              <div style={{
                fontSize: "clamp(40px,5vw,64px)", fontWeight: 900, letterSpacing: -2, lineHeight: 1,
                backgroundImage: GRADIENT,
                WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
                marginBottom: 10,
              }}>{s.value}</div>
              <div style={{ fontSize: 13, fontWeight: 600, color: "rgba(244,237,230,0.55)",
                letterSpacing: ".5px", textTransform: "uppercase" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

const FEATURES = [
  { icon: "🏆", title: "Expert Trainers",       desc: "Certified professionals specialising in strength, cardio, rehab, and nutrition. Your goals are their mission." },
  { icon: "📍", title: "Prime Location",           desc: "Our facility in Lekki Phase 1, Lagos - built to the highest standard for serious training." },
  { icon: "🗓️", title: "Flexible Scheduling",   desc: "Book classes in advance, join waitlists, and cancel without stress. Fitness fits your calendar." },
  { icon: "⚡", title: "50+ Classes Weekly",     desc: "From 5AM HIIT to evening yoga - our packed timetable fits every lifestyle and fitness level." },
  { icon: "❄️", title: "Freeze Anytime",         desc: "Travelling or recovering? Pause your membership without losing your plan or your progress." },
  { icon: "📱", title: "Member App",             desc: "Book classes, track progress, manage billing, and message trainers - all in one seamless app." },
];

function AboutSection({ visible, onClose, onPlansOpen }) {
  return (
    <div style={{
      overflow: "hidden",
      maxHeight: visible ? "1200px" : "0",
      opacity: visible ? 1 : 0,
      transition: "max-height 0.5s ease, opacity 0.35s ease",
    }}>
      <section style={{ padding: "clamp(40px,7vw,80px) clamp(16px,5vw,48px) clamp(32px,5vw,64px)", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          marginBottom: 52, flexWrap: "wrap", gap: 20 }}>
          <div>
            <SectionTag>Why Apex Fitness</SectionTag>
            <Heading>BUILT FOR<br />REAL RESULTS</Heading>
            <p style={{ fontSize: 16, color: C.muted, maxWidth: 480, lineHeight: 1.75 }}>
              Everything you need to train harder, recover faster, and go further - all in one membership.
            </p>
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginTop: 8 }}>
            <Btn variant="accent" onClick={onPlansOpen}>View Plans</Btn>
            <button onClick={onClose} aria-label="Close about" style={{
              background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "50%",
              width: 40, height: 40, cursor: "pointer", color: C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}><CloseIcon /></button>
          </div>
        </div>

        <div className="apex-features-grid" style={{
          display: "grid",
          gap: 2, border: `1px solid ${C.border}`, borderRadius: 24, overflow: "hidden",
          boxShadow: C.shadow,
        }}>
          <style>{`.apex-features-grid { grid-template-columns: repeat(3,1fr); } @media(max-width:768px){.apex-features-grid{grid-template-columns:1fr;}}`}</style>
          {FEATURES.map(f => (
            <div key={f.title} style={{
              background: C.heroCardBg, padding: "clamp(28px,4vw,44px) clamp(20px,3vw,36px)",
              transition: "background 0.2s ease",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.background = "var(--surface2)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "var(--hero-card-bg)"; }}
            >
              <div style={{
                width: 46, height: 46, borderRadius: 12, background: C.accentDim,
                border: `1px solid ${C.accentBorder}`, display: "flex", alignItems: "center",
                justifyContent: "center", fontSize: 20, marginBottom: 22,
              }}>{f.icon}</div>
              <h3 style={{ fontSize: 18, fontWeight: 800, letterSpacing: -.3, marginBottom: 10, color: C.text }}>
                {f.title}
              </h3>
              <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function LocationsSection({ visible, onClose }) {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    if (!visible) return;
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${apiUrl}/locations?active=true`)
      .then((r) => r.json())
      .then((body) => {
        const data = body?.data || body;
        setLocations(data?.locations || data || []);
      })
      .catch(() => setLocations([]));
  }, [visible]);

  const mapsUrl = (loc) => {
    const q = encodeURIComponent(`${loc.name} gym ${loc.city || ''} Nigeria`.trim());
    if (loc.latitude && loc.longitude) return `https://www.google.com/maps?q=${loc.latitude},${loc.longitude}`;
    return `https://www.google.com/maps/search/${q}`;
  };

  const colCount = Math.min(locations.length, 5);
  const gridCols = colCount <= 2 ? colCount : colCount <= 3 ? 3 : colCount <= 4 ? 4 : 5;

  return (
    <div style={{
      overflow: "hidden",
      maxHeight: visible ? "1100px" : "0",
      opacity:   visible ? 1 : 0,
      transition: "max-height 0.6s ease, opacity 0.35s ease",
    }}>
      <section id="locations" style={{ padding: "clamp(40px,7vw,80px) clamp(16px,5vw,48px) clamp(40px,7vw,80px)", background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ maxWidth: 1100, margin: "0 auto" }}>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start",
            marginBottom: 40, flexWrap: "wrap", gap: 16 }}>
            <div>
              <SectionTag>Our Locations</SectionTag>
              <Heading style={{ marginBottom: 8 }}>TRAIN NEAR<br />YOU</Heading>
              <p style={{ fontSize: 15, color: C.muted, maxWidth: 380, lineHeight: 1.7 }}>
                {locations.length > 1
                  ? `${locations.length} world-class facilities - one membership unlocks them all. Click any location to get directions.`
                  : "A world-class facility designed for serious training. Click to get directions."}
              </p>
            </div>
            <button onClick={onClose} aria-label="Close locations" style={{
              background: C.surface2, border: `1px solid ${C.border}`, borderRadius: "50%",
              width: 40, height: 40, cursor: "pointer", color: C.muted,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0, marginTop: 8,
            }}><CloseIcon /></button>
          </div>

          <style>{`
            .apex-loc-grid { grid-template-columns: repeat(${gridCols}, 1fr); }
            @media(max-width:900px) { .apex-loc-grid { grid-template-columns: repeat(${Math.min(gridCols,3)},1fr); } }
            @media(max-width:580px) { .apex-loc-grid { grid-template-columns: 1fr 1fr; } }
            @media(max-width:360px) { .apex-loc-grid { grid-template-columns: 1fr; } }
          `}</style>
          <div className="apex-loc-grid" style={{ display: "grid", gap: 14 }}>
            {locations.map((loc) => (
              <a
                key={loc.id || loc._id}
                href={mapsUrl(loc)}
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: "none" }}
              >
                <div style={{
                  background: C.bg, border: `1px solid ${C.border}`,
                  borderRadius: 18, padding: "22px 18px 20px",
                  transition: "border-color .2s, transform .2s, box-shadow .2s",
                  cursor: "pointer", height: "100%",
                }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = "var(--accent-border)";
                    e.currentTarget.style.transform   = "translateY(-3px)";
                    e.currentTarget.style.boxShadow   = "0 8px 28px rgba(0,0,0,0.12)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = "var(--border)";
                    e.currentTarget.style.transform   = "translateY(0)";
                    e.currentTarget.style.boxShadow   = "none";
                  }}
                >
                  <div style={{ fontSize: 28, marginBottom: 12 }}>📍</div>
                  <div style={{ fontSize: 13, fontWeight: 800, color: C.text, marginBottom: 4,
                    letterSpacing: -.2, lineHeight: 1.3 }}>{loc.name}</div>
                  <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>
                    {[loc.city, loc.state].filter(Boolean).join(', ') || 'Lagos'}
                  </div>
                  {loc.address && (
                    <div style={{ fontSize: 10, color: C.textTer, marginTop: 4, lineHeight: 1.4 }}>{loc.address}</div>
                  )}
                  <div style={{ marginTop: 12, fontSize: 10, color: C.accentText,
                    fontWeight: 700, display: "flex", alignItems: "center", gap: 4 }}>
                    <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    Get directions
                  </div>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

function VirtualTour() {
  return (
    <section style={{
      position: "relative", overflow: "hidden",
      background: "#131f17",
      padding: "clamp(48px,8vw,112px) clamp(16px,5vw,48px)",
    }}>

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        backgroundImage: `linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px),
                          linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)`,
        backgroundSize: "48px 48px",
      }} />

      <div style={{
        position: "absolute", inset: 0, pointerEvents: "none",
        background: `radial-gradient(ellipse 60% 70% at 80% 50%, rgba(249,169,123,0.07) 0%, transparent 60%),
                     radial-gradient(ellipse 50% 60% at 15% 50%, rgba(33,82,53,0.20) 0%, transparent 55%)`,
      }} />

      <div className="apex-virtual-tour-grid" style={{
        position: "relative", zIndex: 2,
        display: "grid", gap: "clamp(32px,6vw,80px)", alignItems: "center",
        maxWidth: 1200, margin: "0 auto",
      }}>
      <style>{`.apex-virtual-tour-grid{grid-template-columns:1fr 1fr;}@media(max-width:768px){.apex-virtual-tour-grid{grid-template-columns:1fr;}}`}</style>

        <div>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 8,
            background: "rgba(33,82,53,0.35)", border: "1px solid rgba(33,82,53,0.55)",
            color: "#6fcf97", padding: "7px 16px", borderRadius: 100,
            fontSize: 11, fontWeight: 800, letterSpacing: "2px", textTransform: "uppercase",
            marginBottom: 28,
          }}>
            <span style={{ width: 6, height: 6, background: "#6fcf97", borderRadius: "50%",
              animation: "blink 2s infinite", flexShrink: 0 }} />
            Live 360° Virtual Tour
          </div>

          <h2 style={{
            fontSize: "clamp(38px,5vw,66px)", fontWeight: 900, lineHeight: .95,
            letterSpacing: -2.5, textTransform: "uppercase", marginBottom: 24,
            color: "#f4ede6",
          }}>
            SEE THE SPACE<br />
            <span style={{
              backgroundImage: GRADIENT,
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text",
            }}>BEFORE YOU</span><br />
            COMMIT
          </h2>

          <p style={{ fontSize: 16, color: "rgba(244,237,230,0.60)", lineHeight: 1.8, maxWidth: 420, marginBottom: 40 }}>
            Walk through our facilities from anywhere in the world. Every piece of equipment,
            every training floor, every locker room - rendered in immersive 3D detail.
          </p>

          <a
            href="https://app.lapentor.com/sphere/gym-10"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: 12,
              padding: "16px 36px", borderRadius: 100,
              background: GRADIENT, color: "#1b1b19",
              fontWeight: 800, fontSize: 15, textDecoration: "none",
              letterSpacing: ".3px", transition: "all .2s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = ".88"; e.currentTarget.style.transform = "translateY(-2px)"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; e.currentTarget.style.transform = "translateY(0)"; }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
              <polyline points="9 22 9 12 15 12 15 22"/>
            </svg>
            Walk the Floor
          </a>

          <div style={{ marginTop: 20, fontSize: 13, color: "rgba(244,237,230,0.35)", fontStyle: "italic" }}>
            Opens in a new tab · No download needed
          </div>
        </div>

        <div style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div style={{
            width: 360, height: 360, borderRadius: "50%",
            border: "1px solid rgba(33,82,53,0.40)",
            display: "flex", alignItems: "center", justifyContent: "center",
            position: "relative",
          }}>
            <div style={{
              width: 280, height: 280, borderRadius: "50%",
              border: "1px solid rgba(249,169,123,0.18)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <a
                href="https://app.lapentor.com/sphere/gym-10"
                target="_blank" rel="noopener noreferrer"
                style={{
                  width: 180, height: 180, borderRadius: "50%",
                  background: "radial-gradient(circle at 40% 35%, #2a5c3a, #215235 60%, #162e20)",
                  border: "1px solid rgba(249,169,123,0.22)",
                  display: "flex", flexDirection: "column",
                  alignItems: "center", justifyContent: "center", gap: 8,
                  cursor: "pointer", textDecoration: "none",
                  animation: "pulse360 3s ease-in-out infinite",
                  boxShadow: "0 0 60px rgba(33,82,53,0.35), 0 0 20px rgba(249,169,123,0.10)",
                  transition: "transform .2s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)"; }}
              >
                <svg width="42" height="42" viewBox="0 0 24 24" fill="none" stroke="#f9a97b"
                  strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10z"/>
                  <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                </svg>
                <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 2,
                  color: "rgba(249,169,123,0.80)", textTransform: "uppercase" }}>360°</span>
              </a>
            </div>

            <div style={{ position: "absolute", top: 14, left: "50%", transform: "translateX(-50%)",
              width: 10, height: 10, borderRadius: "50%", background: "#f9a97b", opacity: .6 }} />
            <div style={{ position: "absolute", right: 14, top: "50%", transform: "translateY(-50%)",
              width: 7, height: 7, borderRadius: "50%", background: "#6fcf97", opacity: .5 }} />
            <div style={{ position: "absolute", bottom: 14, left: "50%", transform: "translateX(-50%)",
              width: 8, height: 8, borderRadius: "50%", background: "#f9a97b", opacity: .4 }} />
          </div>

          <div style={{
            position: "absolute", top: "10%", right: "-8%",
            background: "rgba(27,27,25,0.85)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(249,169,123,0.20)", borderRadius: 12, padding: "10px 16px",
          }}>
            <div style={{ fontSize: 10, color: "rgba(244,237,230,0.45)", letterSpacing: 1, marginBottom: 3 }}>LOCATIONS</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f4ede6" }}>5 Gyms</div>
          </div>
          <div style={{
            position: "absolute", bottom: "12%", left: "-6%",
            background: "rgba(27,27,25,0.85)", backdropFilter: "blur(16px)",
            border: "1px solid rgba(33,82,53,0.40)", borderRadius: 12, padding: "10px 16px",
          }}>
            <div style={{ fontSize: 10, color: "rgba(244,237,230,0.45)", letterSpacing: 1, marginBottom: 3 }}>EQUIPMENT</div>
            <div style={{ fontSize: 14, fontWeight: 800, color: "#f4ede6" }}>World-Class</div>
          </div>
        </div>
      </div>
    </section>
  );
}

const CLASSES = [
  {
    gradient: "linear-gradient(135deg, #ff4500 0%, #fe8c00 100%)",
    icon: "🔥", name: "HIIT Burn",
    desc: "High-intensity intervals that torch calories and push your limits. Full-body conditioning in 45 minutes.",
    duration: "45 min", level: "All levels",
  },
  {
    gradient: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    icon: "🧘", name: "Power Yoga",
    desc: "Strength-focused yoga that builds flexibility and mental resilience. Perfect for active recovery days.",
    duration: "60 min", level: "Beginner+",
  },
  {
    gradient: "linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)",
    icon: "🚴", name: "Spin Cycle",
    desc: "High-energy indoor cycling to pulsing music. Low impact, maximum cardio - knees will thank you.",
    duration: "45 min", level: "Intermediate",
  },
  {
    gradient: "linear-gradient(135deg, #f83600 0%, #f9d423 100%)",
    icon: "🥊", name: "Boxing Fit",
    desc: "Bag work, pad work, and conditioning circuits. Build explosive power and real self-defence skills.",
    duration: "60 min", level: "All levels",
  },
  {
    gradient: "linear-gradient(135deg, #11998e 0%, #38ef7d 100%)",
    icon: "🤸", name: "Pilates Core",
    desc: "Deep core activation and postural correction. Ideal for back pain, injury recovery, and body control.",
    duration: "50 min", level: "All levels",
  },
  {
    gradient: "linear-gradient(135deg, #434343 0%, #1a1a2e 100%)",
    icon: "🏋️", name: "Strength Lab",
    desc: "Coached barbell and dumbbell programming. Progressive overload principles, tracked every session.",
    duration: "60 min", level: "Intermediate+",
  },
];

function ClassesCarousel() {
  const [paused, setPaused] = useState(false);

  const doubled = [...CLASSES, ...CLASSES];

  return (
    <section style={{ padding: "clamp(48px,8vw,96px) 0", background: C.bg, overflow: "hidden" }}>
      <div style={{ padding: "0 clamp(16px,5vw,48px)", marginBottom: 40 }}>
        <SectionTag>What We Offer</SectionTag>
        <Heading>EXPLORE OUR<br />CLASSES</Heading>
        <p style={{ fontSize: 15, color: C.muted, maxWidth: 420, lineHeight: 1.75 }}>
          50+ classes every week across 5 locations. Something for every level, every schedule.
        </p>
      </div>

      <div
        style={{ overflow: "hidden", position: "relative" }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >

        <div style={{
          position: "absolute", left: 0, top: 0, bottom: 0, width: 80, zIndex: 2, pointerEvents: "none",
          background: `linear-gradient(to right, ${C.bg}, transparent)`,
        }} />
        <div style={{
          position: "absolute", right: 0, top: 0, bottom: 0, width: 80, zIndex: 2, pointerEvents: "none",
          background: `linear-gradient(to left, ${C.bg}, transparent)`,
        }} />

        <div style={{
          display: "flex", gap: 16,
          padding: "8px 48px 16px",
          width: "max-content",
          animation: "classesScroll 38s linear infinite",
          animationPlayState: paused ? "paused" : "running",
        }}>
          {doubled.map((cls, idx) => (
            <div
              key={`${cls.name}-${idx}`}
              style={{
                flexShrink: 0, width: 280,
                background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 20, overflow: "hidden",
                boxShadow: C.shadow,
                cursor: "pointer", transition: "transform .2s, box-shadow .2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)";
                e.currentTarget.style.boxShadow = "0 12px 32px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "var(--card-shadow)";
              }}
            >

              <div style={{
                height: 140, background: cls.gradient,
                display: "flex", alignItems: "center", justifyContent: "center",
                position: "relative",
              }}>
                <div style={{ fontSize: 52, filter: "drop-shadow(0 4px 12px rgba(0,0,0,0.3))" }}>
                  {cls.icon}
                </div>
              </div>

              <div style={{ padding: "20px 20px 22px" }}>
                <h3 style={{ fontSize: 17, fontWeight: 800, letterSpacing: -.3, marginBottom: 8, color: C.text }}>
                  {cls.name}
                </h3>
                <p style={{ fontSize: 13, color: C.muted, lineHeight: 1.7, marginBottom: 16 }}>
                  {cls.desc}
                </p>
                <div style={{ display: "flex", gap: 8 }}>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100,
                    background: C.accentDim, color: C.accentText, letterSpacing: .5,
                  }}>{cls.duration}</span>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 100,
                    background: C.surface2, color: C.muted, letterSpacing: .5,
                  }}>{cls.level}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

function CTABand({ onPlansOpen, onContactOpen }) {
  return (
    <section style={{ background: GRADIENT, padding: "clamp(48px,8vw,96px) clamp(16px,5vw,48px)", textAlign: "center" }}>
      <div style={{ display: "inline-flex", alignItems: "center", gap: 10,
        fontSize: 11, fontWeight: 800, letterSpacing: "2.5px", textTransform: "uppercase",
        color: "rgba(27,27,25,.45)", marginBottom: 18, justifyContent: "center" }}>
        <span style={{ width: 18, height: 2, background: "rgba(27,27,25,.3)", display: "block" }} />
        Ready to Start?
      </div>
      <h2 style={{ fontSize: "clamp(40px,6vw,76px)", fontWeight: 900, letterSpacing: -3,
        textTransform: "uppercase", lineHeight: .95, color: "#1b1b19", marginBottom: 20 }}>
        YOUR FIRST<br />STEP STARTS HERE
      </h2>
      <p style={{ fontSize: 17, color: "rgba(27,27,25,.55)", marginBottom: 44 }}>
        Join 12,000+ members already training smarter.
      </p>
      <div style={{ display: "flex", gap: 14, justifyContent: "center", flexWrap: "wrap" }}>
        <button onClick={onPlansOpen} style={{
          padding: "15px 36px", borderRadius: 100, fontWeight: 700, fontSize: 15,
          background: "#1b1b19", color: "#f9a97b", textDecoration: "none",
          transition: "all .2s", display: "inline-flex", alignItems: "center",
          border: "none", cursor: "pointer",
        }}>Explore Plans</button>
        <button onClick={onContactOpen} style={{
          padding: "15px 36px", borderRadius: 100, fontWeight: 700, fontSize: 15,
          background: "transparent", color: "#1b1b19",
          border: "1px solid rgba(27,27,25,.22)", textDecoration: "none",
          transition: "all .2s", display: "inline-flex", alignItems: "center",
          cursor: "pointer",
        }}>Talk to Us</button>
      </div>
    </section>
  );
}

function Footer({ onContactOpen, onPrivacyOpen, onTermsOpen, onCookiesOpen, onFaqsOpen }) {
  const cols = [
    { title: "Company",    links: [
        { label: "About Us",   href: "#" },
      ]},
    { title: "Membership", links: [
        { label: "Plans & Pricing", href: "#" },
      ]},
    { title: "Support",    links: [
        { label: "FAQs",       onClick: onFaqsOpen },
        { label: "Contact Us", onClick: onContactOpen },
      ]},
  ];

  const socialLinks = [
    { icon: <InstagramIcon />, href: "https://www.instagram.com/apexfitnessplace", label: "Instagram" },
    { icon: <XIcon />,         href: "https://x.com/apexfitnesswide",              label: "X (Twitter)" },
  ];

  return (
    <footer style={{
      background: C.bg, borderTop: `1px solid ${C.border}`,
      padding: "clamp(40px,6vw,72px) clamp(16px,5vw,48px) clamp(24px,4vw,36px)",
      transition: "background 0.25s ease",
    }}>
      <div className="apex-footer-grid" style={{ display: "grid", gap: "clamp(28px,5vw,56px)", marginBottom: 60 }}>
      <style>{`.apex-footer-grid{grid-template-columns:2fr 1fr 1fr 1fr;}@media(max-width:768px){.apex-footer-grid{grid-template-columns:1fr 1fr;}}@media(max-width:480px){.apex-footer-grid{grid-template-columns:1fr;}}`}</style>

        <div>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 14, color: C.text }}>
            APEX<span style={{ color: C.accentText }}>FITNESS</span>
          </div>
          <p style={{ fontSize: 14, color: C.muted, lineHeight: 1.75, maxWidth: 260, marginBottom: 22 }}>
            Premium fitness spaces built for people who are serious about their health.
            Lekki Phase 1, Lagos.
          </p>

          <div style={{ display: "flex", gap: 10 }}>
            {socialLinks.map(s => (
              <a key={s.label} href={s.href} aria-label={s.label} target="_blank" rel="noopener noreferrer" style={{
                width: 36, height: 36, background: C.surface, border: `1px solid ${C.border}`,
                borderRadius: 9, display: "flex", alignItems: "center", justifyContent: "center",
                cursor: "pointer", color: C.muted, textDecoration: "none",
                transition: "all .2s",
              }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--accent-dim)";
                  e.currentTarget.style.borderColor = "var(--accent-border)";
                  e.currentTarget.style.color = "var(--accent-text)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "var(--surface)";
                  e.currentTarget.style.borderColor = "var(--border)";
                  e.currentTarget.style.color = "var(--muted)";
                }}
              >
                {s.icon}
              </a>
            ))}
          </div>
        </div>

        {cols.map(col => (
          <div key={col.title}>
            <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: "2.5px",
              textTransform: "uppercase", color: C.muted, marginBottom: 18 }}>
              {col.title}
            </div>
            <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: 11 }}>
              {col.links.map(l => (
                <li key={l.label}>
                  {l.onClick ? (
                    <button onClick={l.onClick} style={{
                      fontSize: 13, color: C.textTer, textDecoration: "none",
                      background: "none", border: "none", cursor: "pointer", padding: 0,
                      transition: "color .2s",
                    }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                    >{l.label}</button>
                  ) : (
                    <a href={l.href} style={{ fontSize: 13, color: C.textTer, textDecoration: "none", transition: "color .2s" }}
                      onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
                      onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-tertiary)"; }}
                    >{l.label}</a>
                  )}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 28,
        display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 16 }}>
        <div style={{ fontSize: 12, color: C.muted }}>
          © 2026 Apex Fitness & Wellness. All rights reserved.
        </div>
        <div style={{ display: "flex", gap: 20 }}>
          {[
            { label: "Privacy Policy",   onClick: onPrivacyOpen },
            { label: "Terms of Service", onClick: onTermsOpen },
            { label: "Cookie Policy",    onClick: onCookiesOpen },
          ].map(l => (
            <button key={l.label} onClick={l.onClick} style={{
              fontSize: 12, color: C.muted, background: "none", border: "none",
              cursor: "pointer", padding: 0, transition: "color .2s",
            }}
              onMouseEnter={(e) => { e.currentTarget.style.color = "var(--text)"; }}
              onMouseLeave={(e) => { e.currentTarget.style.color = "var(--muted)"; }}
            >{l.label}</button>
          ))}
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage() {
  const { user } = useAuth();
  const [showAbout,     setShowAbout]     = useState(false);
  const [showLocations, setShowLocations] = useState(false);
  const [showPlans,     setShowPlans]     = useState(false);
  const [showContact,   setShowContact]   = useState(false);
  const [showPrivacy,   setShowPrivacy]   = useState(false);
  const [showTerms,     setShowTerms]     = useState(false);
  const [showCookies,   setShowCookies]   = useState(false);
  const [showFaqs,      setShowFaqs]      = useState(false);

  const aboutRef     = useRef(null);
  const locationsRef = useRef(null);

  const openPlans   = useCallback(() => setShowPlans(true),   []);
  const openContact = useCallback(() => setShowContact(true), []);
  const toggleAbout = useCallback(() => {
    setShowAbout(v => {
      const next = !v;
      if (next) {
        setShowLocations(false);
        setTimeout(() => {
          aboutRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      }
      return next;
    });
  }, []);

  const toggleLocations = useCallback(() => {
    setShowLocations(v => {
      const next = !v;
      if (next) {
        setShowAbout(false);
        setTimeout(() => {
          locationsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 60);
      }
      return next;
    });
  }, []);

  return (
    <div style={{
      fontFamily: "-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif",
      background: C.bg, color: C.text, overflowX: "hidden",
      transition: "background 0.25s ease, color 0.25s ease",
    }}>
      <Nav
        showAbout={showAbout}
        onAboutToggle={toggleAbout}
        showLocations={showLocations}
        onLocationsToggle={toggleLocations}
        showPlans={showPlans}
        onPlansOpen={openPlans}
        onContactOpen={openContact}
        user={user}
      />

      <Hero onPlansOpen={openPlans} onContactOpen={openContact} />
      <Marquee />
      <div ref={aboutRef}>
        <AboutSection visible={showAbout} onClose={() => setShowAbout(false)} onPlansOpen={openPlans} />
      </div>
      <div ref={locationsRef}>
        <LocationsSection visible={showLocations} onClose={() => setShowLocations(false)} />
      </div>
      <ParallaxBand />
      <VirtualTour />
      <ClassesCarousel />
      <CTABand onPlansOpen={openPlans} onContactOpen={openContact} />
      <Footer
        onContactOpen={openContact}
        onPrivacyOpen={() => setShowPrivacy(true)}
        onTermsOpen={() => setShowTerms(true)}
        onCookiesOpen={() => setShowCookies(true)}
        onFaqsOpen={() => setShowFaqs(true)}
      />

      {showPlans   && <PlansModal onClose={() => setShowPlans(false)}   onContactClick={openContact} user={user} />}
      {showContact && <ContactModal onClose={() => setShowContact(false)} />}
      {showPrivacy && (
        <LegalModal title="Privacy Policy" onClose={() => setShowPrivacy(false)}>
          <PrivacyPolicyContent />
        </LegalModal>
      )}
      {showTerms && (
        <LegalModal title="Terms of Service" onClose={() => setShowTerms(false)}>
          <TermsContent />
        </LegalModal>
      )}
      {showCookies && (
        <LegalModal title="Cookie Policy" onClose={() => setShowCookies(false)}>
          <CookieContent />
        </LegalModal>
      )}
      {showFaqs && <FAQModal onClose={() => setShowFaqs(false)} />}
    </div>
  );
}
