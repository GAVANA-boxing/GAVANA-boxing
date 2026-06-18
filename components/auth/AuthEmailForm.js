"use client";

const S = {
  fieldGroup: { display: "grid", gap: 7 },
  label: {
    fontSize: 10,
    fontWeight: 900,
    color: "rgba(255,255,255,0.38)",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  inputBase: {
    width: "100%",
    boxSizing: "border-box",
    background: "rgba(255,255,255,0.05)",
    borderRadius: 12,
    padding: "13px 15px",
    color: "#fff",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
    border: "1px solid rgba(255,255,255,0.09)",
  },
  errorBox: {
    background: "rgba(255,59,48,0.11)",
    border: "1px solid rgba(255,59,48,0.32)",
    color: "#ff8b8b",
    padding: "11px 14px",
    borderRadius: 12,
    fontSize: 13,
    lineHeight: 1.4,
  },
  submitBtn: {
    width: "100%",
    padding: "15px",
    borderRadius: 14,
    border: "none",
    color: "#fff",
    fontSize: 14,
    fontWeight: 900,
    cursor: "pointer",
    transition: "opacity 0.2s, transform 0.15s, box-shadow 0.2s",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
};

function inputStyle(field, focusedField) {
  return {
    ...S.inputBase,
    borderColor: focusedField === field ? "rgba(255,59,48,0.7)" : "rgba(255,255,255,0.1)",
    boxShadow:
      focusedField === field
        ? "0 0 0 1px rgba(255,59,48,0.35), 0 0 20px rgba(255,59,48,0.15)"
        : "none",
  };
}

/**
 * Email/password form — handles both sign-in and sign-up field sets.
 *
 * @param {{
 *   isSignUp: boolean,
 *   loading: boolean,
 *   displayName: string, onDisplayNameChange: (v: string) => void,
 *   email: string, onEmailChange: (v: string) => void,
 *   password: string, onPasswordChange: (v: string) => void,
 *   confirmPassword: string, onConfirmPasswordChange: (v: string) => void,
 *   focusedField: string | null, onFocus: (field: string) => void, onBlur: () => void,
 *   error: string, errorCode: string,
 *   onSubmit: (e: React.FormEvent) => void,
 *   labels: { displayName: string, email: string, password: string, confirmPassword: string },
 *   placeholders: { displayName: string },
 *   submitLabel: string,
 *   loadingText: string,
 * }} props
 */
export default function AuthEmailForm({
  isSignUp,
  loading,
  displayName, onDisplayNameChange,
  email, onEmailChange,
  password, onPasswordChange,
  confirmPassword, onConfirmPasswordChange,
  focusedField, onFocus, onBlur,
  error, errorCode,
  onSubmit,
  labels,
  placeholders,
  submitLabel,
  loadingText,
}) {
  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 18 }}>
      {isSignUp && (
        <div style={S.fieldGroup}>
          <label style={S.label}>{labels.displayName}</label>
          <input
            className="combat-input"
            type="text"
            value={displayName}
            onChange={(e) => onDisplayNameChange(e.target.value)}
            onFocus={() => onFocus("name")}
            onBlur={onBlur}
            required={isSignUp}
            maxLength={40}
            style={inputStyle("name", focusedField)}
            placeholder={placeholders.displayName}
          />
        </div>
      )}

      <div style={S.fieldGroup}>
        <label style={S.label}>{labels.email}</label>
        <input
          className="combat-input"
          type="email"
          value={email}
          onChange={(e) => onEmailChange(e.target.value)}
          onFocus={() => onFocus("email")}
          onBlur={onBlur}
          required
          style={inputStyle("email", focusedField)}
          placeholder="your@email.com"
        />
      </div>

      <div style={S.fieldGroup}>
        <label style={S.label}>{labels.password}</label>
        <input
          className="combat-input"
          type="password"
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onFocus={() => onFocus("pass")}
          onBlur={onBlur}
          required
          minLength={isSignUp ? 6 : undefined}
          style={inputStyle("pass", focusedField)}
          placeholder="••••••••"
        />
      </div>

      {isSignUp && (
        <div style={S.fieldGroup}>
          <label style={S.label}>{labels.confirmPassword}</label>
          <input
            className="combat-input"
            type="password"
            value={confirmPassword}
            onChange={(e) => onConfirmPasswordChange(e.target.value)}
            onFocus={() => onFocus("confirm")}
            onBlur={onBlur}
            required={isSignUp}
            minLength={6}
            style={inputStyle("confirm", focusedField)}
            placeholder="••••••••"
          />
        </div>
      )}

      {error && (
        <div style={S.errorBox}>
          {error}
          {errorCode && (
            <div style={{ marginTop: 4, fontSize: 10, opacity: 0.55, fontFamily: "monospace" }}>
              {errorCode}
            </div>
          )}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        style={{
          ...S.submitBtn,
          background: loading ? "rgba(255,59,48,0.3)" : "#FF3B30",
          boxShadow: loading
            ? "none"
            : "0 12px 36px rgba(255,59,48,0.3), 0 0 0 1px rgba(255,59,48,0.2) inset",
        }}
      >
        {loading ? (
          <span style={{ opacity: 0.6 }}>{loadingText}</span>
        ) : (
          <span style={{ letterSpacing: 1.5, fontSize: 13 }}>{submitLabel} →</span>
        )}
      </button>
    </form>
  );
}
