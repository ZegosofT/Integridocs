import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/router";

type Step = "credentials" | "totp";

const LoginPage = () => {
  const router = useRouter();
  const [step, setStep] = useState<Step>("credentials");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  // Focus premier champ OTP à l'arrivée sur l'étape TOTP
  useEffect(() => {
    if (step === "totp") {
      setTimeout(() => inputsRef.current[0]?.focus(), 100);
    }
  }, [step]);

  // ── Étape 1 : email + mot de passe ───────────────────────────────
  const handleCredentials = async () => {
    if (!email.trim() || !password) {
      setError("Veuillez remplir tous les champs.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Identifiants incorrects");
      if (data.step === "totp") setStep("totp");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  // ── Étape 2 : code TOTP ───────────────────────────────────────────
  const handleOtpChange = (idx: number, val: string) => {
    const digit = val.replace(/\D/g, "").slice(-1);
    const next = [...otp];
    next[idx] = digit;
    setOtp(next);
    setError("");
    if (digit && idx < 5) inputsRef.current[idx + 1]?.focus();
    // Auto-submit quand les 6 chiffres sont saisis
    if (next.every((d) => d !== "") && digit) {
      verifyTotp(next.join(""));
    }
  };

  const handleOtpKeyDown = (idx: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[idx] && idx > 0) {
      const next = [...otp];
      next[idx - 1] = "";
      setOtp(next);
      inputsRef.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    const next = [...otp];
    pasted.split("").forEach((ch, i) => { next[i] = ch; });
    setOtp(next);
    if (pasted.length === 6) verifyTotp(pasted);
    else inputsRef.current[Math.min(pasted.length, 5)]?.focus();
  };

  const verifyTotp = async (code: string) => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/auth/verify-totp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Code incorrect");
      router.push("/");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Erreur réseau");
      setOtp(["", "", "", "", "", ""]);
      setTimeout(() => inputsRef.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyClick = () => {
    const code = otp.join("");
    if (code.length === 6) verifyTotp(code);
  };

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo / titre */}
        <div className="login-header">
          <div className="login-logo">🔐</div>
          <h1 className="login-titre">Integridocs</h1>
          <p className="login-sous-titre">
            {step === "credentials"
              ? "Connexion à l'espace d'administration"
              : "Vérification en deux étapes"}
          </p>
        </div>

        {/* Message d'erreur */}
        {error && <div className="alert alert-error">{error}</div>}

        {/* ── Étape 1 : identifiants ── */}
        {step === "credentials" && (
          <div className="login-form">
            <div className="login-field">
              <label className="login-label">Adresse e-mail</label>
              <input
                className="champ-input"
                type="email"
                placeholder="votre@email.fr"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleCredentials()}
                autoFocus
                autoComplete="username"
              />
            </div>
            <div className="login-field">
              <label className="login-label">Mot de passe</label>
              <input
                className="champ-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setError(""); }}
                onKeyDown={(e) => e.key === "Enter" && handleCredentials()}
                autoComplete="current-password"
              />
            </div>
            <button
              className="btn btn-enregistrer login-btn"
              onClick={handleCredentials}
              disabled={loading}
            >
              {loading ? "Vérification..." : "Continuer →"}
            </button>
          </div>
        )}

        {/* ── Étape 2 : TOTP ── */}
        {step === "totp" && (
          <div className="login-form">
            <p className="totp-info">
              Ouvrez votre application d'authentification et saisissez le code à 6 chiffres.
            </p>
            <div className="otp-wrap" onPaste={handleOtpPaste}>
              {otp.map((digit, idx) => (
                <input
                  key={idx}
                  ref={(el) => { inputsRef.current[idx] = el; }}
                  className={`otp-input${digit ? " otp-filled" : ""}${error ? " otp-error" : ""}`}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleOtpChange(idx, e.target.value)}
                  onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                  disabled={loading}
                />
              ))}
            </div>
            <button
              className="btn btn-enregistrer login-btn"
              onClick={handleVerifyClick}
              disabled={loading || otp.some((d) => !d)}
            >
              {loading ? "Vérification..." : "✅ Vérifier"}
            </button>
            <button
              className="btn btn-annuler login-btn-back"
              onClick={() => { setStep("credentials"); setOtp(["","","","","",""]); setError(""); }}
            >
              ← Retour
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default LoginPage;
