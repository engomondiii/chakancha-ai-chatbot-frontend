"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Mail, CheckCircle } from "lucide-react";
import { useAuth } from "@/lib/hooks/useAuth";
import { LogoMark } from "@/components/common/Logo";
export default function SignupPage() {
  const router = useRouter();
  const { signup } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setLoading(true);
    setError("");

    const result = await signup(name.trim(), email.trim(), password);
    if (result?.success) {
      // Do NOT redirect to account — show "check your email" screen instead
      setSubmitted(true);
    } else {
      setError(result?.error || "Could not create account. Please try again.");
      setLoading(false);
    }
  };

  // ── Check your email screen ───────────────────────────────────────────────
  if (submitted) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "var(--spacing-lg)",
          backgroundColor: "var(--color-soft-white)",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 420,
            backgroundColor: "white",
            border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-xl)",
            padding: "var(--spacing-2xl)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "var(--spacing-lg)",
            textAlign: "center",
          }}
        >
          {/* Icon */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              backgroundColor: "var(--color-background-dark)",
              border: "2px solid var(--color-background-muted)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Mail size={32} color="var(--color-tea-dark)" />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--color-earth-brown)",
                margin: 0,
              }}
            >
              Check your email
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                color: "var(--color-text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              We sent a verification link to
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 15,
                fontWeight: 600,
                color: "var(--color-earth-brown)",
                margin: 0,
              }}
            >
              {email}
            </p>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--color-text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Click the link in the email to verify your account. The link
              expires in 24 hours.
            </p>
          </div>

          {/* Steps */}
          <div
            style={{
              width: "100%",
              backgroundColor: "var(--color-warm-cream)",
              border: "1px solid var(--color-border)",
              borderRadius: "var(--radius-lg)",
              padding: "var(--spacing-lg)",
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            {[
              "Open your email inbox",
              "Find the email from Chakancha",
              'Click "Verify my email"',
              "You'll be taken to your account",
            ].map((step, i) => (
              <div
                key={i}
                style={{ display: "flex", alignItems: "center", gap: 12 }}
              >
                <div
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    flexShrink: 0,
                    backgroundColor: "var(--color-background-dark)",

                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span
                    style={{
                      fontFamily: "var(--font-sans)",
                      fontSize: 11,
                      fontWeight: 700,
                      color: "white",
                    }}
                  >
                    {i + 1}
                  </span>
                </div>
                <p
                  style={{
                    fontFamily: "var(--font-sans)",
                    fontSize: 14,
                    color: "var(--color-text-primary)",
                    margin: 0,
                  }}
                >
                  {step}
                </p>
              </div>
            ))}
          </div>

          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: 13,
              color: "var(--color-text-secondary)",
              margin: 0,
            }}
          >
            Didn't receive it? Check your spam folder or{" "}
            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                setLoading(false);
              }}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 0,
                color: "var(--color-background-dark)",
                fontWeight: 500,
                fontFamily: "var(--font-sans)",
                fontSize: 13,
              }}
            >
              try again
            </button>
          </p>
        </div>
      </div>
    );
  }

  // ── Signup form ───────────────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "var(--spacing-lg)",
        backgroundColor: "var(--color-soft-white)",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 420,
          backgroundColor: "white",
          border: "1px solid var(--color-border)",
          borderRadius: "var(--radius-xl)",
          padding: "var(--spacing-2xl)",
          display: "flex",
          flexDirection: "column",
          gap: "var(--spacing-xl)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <div
            style={{
              width: 48,
              height: 48,
              borderRadius: "50%",
              backgroundColor: "var(--color-background-dark)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <LogoMark tone="white" size="sm" clickable={false} />
          </div>
          <div style={{ textAlign: "center" }}>
            <h1
              style={{
                fontFamily: "var(--font-display)",
                fontSize: 22,
                fontWeight: 600,
                color: "var(--color-earth-brown)",
                margin: "0 0 4px",
              }}
            >
              Create your account
            </h1>
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                color: "var(--color-text-secondary)",
                margin: 0,
              }}
            >
              Join Chakancha — tea with a conscience
            </p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "var(--spacing-md)",
          }}
        >
          {[
            {
              label: "Full name",
              value: name,
              setter: setName,
              type: "text",
              placeholder: "Jane Omondi",
              autoComplete: "name",
            },
            {
              label: "Email address",
              value: email,
              setter: setEmail,
              type: "email",
              placeholder: "you@example.com",
              autoComplete: "email",
            },
          ].map(({ label, value, setter, type, placeholder, autoComplete }) => (
            <div
              key={label}
              style={{ display: "flex", flexDirection: "column", gap: 6 }}
            >
              <label
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: 14,
                  fontWeight: 500,
                  color: "var(--color-text-primary)",
                }}
              >
                {label}
              </label>
              <input
                type={type}
                value={value}
                onChange={(e) => {
                  setter(e.target.value);
                  setError("");
                }}
                placeholder={placeholder}
                required
                autoComplete={autoComplete}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  color: "var(--color-text-primary)",
                  backgroundColor: "white",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  outline: "none",
                }}
              />
            </div>
          ))}

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 14,
                fontWeight: 500,
                color: "var(--color-text-primary)",
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPw ? "text" : "password"}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                placeholder="Min. 8 characters"
                required
                autoComplete="new-password"
                style={{
                  width: "100%",
                  padding: "12px 44px 12px 16px",
                  boxSizing: "border-box",
                  fontFamily: "var(--font-sans)",
                  fontSize: 15,
                  color: "var(--color-text-primary)",
                  backgroundColor: "white",
                  border: "1.5px solid var(--color-border)",
                  borderRadius: "var(--radius-md)",
                  outline: "none",
                }}
              />
              <button
                type="button"
                onClick={() => setShowPw((v) => !v)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: "var(--color-text-secondary)",
                  display: "flex",
                  padding: 2,
                }}
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              style={{
                fontFamily: "var(--font-sans)",
                fontSize: 13,
                color: "var(--color-error)",
                margin: 0,
              }}
            >
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              width: "100%",
              padding: "13px",
              backgroundColor: "var(--color-tea-green)",
              color: "white",
              border: "none",
              borderRadius: "var(--radius-md)",
              fontFamily: "var(--font-sans)",
              fontSize: 15,
              fontWeight: 600,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              marginTop: 4,
            }}
          >
            {loading ? (
              <>
                <Loader2
                  size={16}
                  style={{ animation: "spin 1s linear infinite" }}
                />{" "}
                Creating account…
              </>
            ) : (
              "Create account"
            )}
          </button>
        </form>

        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: 14,
            color: "var(--color-text-secondary)",
            textAlign: "center",
            margin: 0,
          }}
        >
          Already have an account?{" "}
          <a
            href="/login"
            style={{
              color: "var(--color-tea-green)",
              fontWeight: 500,
              textDecoration: "none",
            }}
          >
            Sign in
          </a>
        </p>
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
