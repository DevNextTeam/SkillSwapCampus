
import { useState } from "react";
import {
  ArrowRight,
  Mail,
  Lock,
  UserRound,
  BookOpen,
  Building2,
  Sparkles,
  Eye,
  EyeOff,
  CheckCircle2,
} from "lucide-react";
import { apiRequest } from "./api";
import "./Auth.css";

function Auth({ onLogin }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState({
    full_name: "",
    email: "",
    password: "",
    university: "",
    course: "",
    year_level: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const isRegister = mode === "register";

  function updateField(event) {
    setForm((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  }

  function switchMode(nextMode) {
    setError("");
    setSuccess("");
    setShowPassword(false);
    setMode(nextMode);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      if (isRegister) {
        await apiRequest("register.php", {
          method: "POST",
          body: JSON.stringify(form),
        });

        setSuccess("Your account has been created. You can now log in.");

        setForm((previous) => ({
          ...previous,
          password: "",
        }));

        setTimeout(() => {
          switchMode("login");
        }, 1200);
      } else {
        const result = await apiRequest("login.php", {
          method: "POST",
          body: JSON.stringify({
            email: form.email,
            password: form.password,
          }),
        });

        onLogin(result.user);
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-background-shape auth-shape-one" />
      <div className="auth-background-shape auth-shape-two" />

      <div className="auth-layout">
        {/* LEFT BRAND PANEL */}
        <section className="auth-brand-panel">
          <div className="auth-brand">
            <div className="auth-brand-mark">
              <img src="/icons/icon-192.png" alt="SkillSwap logo" />
            </div>

            <div>
              <h2>SkillSwap</h2>
              <span>CAMPUS COMMUNITY</span>
            </div>
          </div>

          <div className="auth-brand-content">
            <div className="auth-brand-tag">
              <Sparkles size={15} />
              YOUR CAMPUS. YOUR COMMUNITY.
            </div>

            <h1>
              Great things happen when
              <span> students share.</span>
            </h1>

            <p>
              Discover talents, exchange knowledge, and build
              connections that help you grow.
            </p>

            <div className="auth-feature-list">
              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <BookOpen size={19} />
                </div>
                <span>Learn something new</span>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <UserRound size={19} />
                </div>
                <span>Connect with students</span>
              </div>

              <div className="auth-feature">
                <div className="auth-feature-icon">
                  <Sparkles size={19} />
                </div>
                <span>Share what you know</span>
              </div>
            </div>
          </div>

          <div className="auth-brand-footer">
            Built for students, powered by sharing.
          </div>
        </section>

        {/* RIGHT FORM PANEL */}
        <section className="auth-form-panel">
          <div
            className={`auth-card ${
              isRegister ? "register-mode" : "login-mode"
            }`}
          >
            {/* MOBILE BRAND */}
            <div className="auth-mobile-brand">
              <div className="auth-brand-mark">
                <img src="/icons/icon-192.png" alt="SkillSwap logo" />
              </div>

              <strong>SkillSwap</strong>
            </div>

            <div key={mode} className="auth-form-content">
              <div className="auth-heading">
                <span className="auth-kicker">
                  {isRegister ? "JOIN THE COMMUNITY" : "WELCOME BACK"}
                </span>

                <h2>
                  {isRegister
                    ? "Create your account"
                    : "Let's get you in."}
                </h2>

                <p>
                  {isRegister
                    ? "Set up your student profile and start connecting."
                    : "Your campus community is waiting for you."}
                </p>
              </div>

              {/* LOGIN / REGISTER SWITCH */}
              <div className="auth-mode-switch">
                <button
                  type="button"
                  className={!isRegister ? "selected" : ""}
                  onClick={() => switchMode("login")}
                >
                  Log in
                </button>

                <button
                  type="button"
                  className={isRegister ? "selected" : ""}
                  onClick={() => switchMode("register")}
                >
                  Create account
                </button>
              </div>

              {/* ERROR MESSAGE */}
              {error && (
                <div className="auth-message-box auth-error">
                  {error}
                </div>
              )}

              {/* SUCCESS MESSAGE */}
              {success && (
                <div className="auth-message-box auth-success">
                  <CheckCircle2 size={17} />
                  {success}
                </div>
              )}

              {/* AUTHENTICATION FORM */}
              <form className="auth-form" onSubmit={handleSubmit}>
                {isRegister && (
                  <div className="auth-register-fields">
                    <div className="auth-section-label">
                      <span>01</span>
                      PERSONAL INFORMATION
                    </div>

                    <label className="auth-field">
                      <span>Full name</span>

                      <div className="auth-input-wrap">
                        <UserRound size={18} />

                        <input
                          name="full_name"
                          value={form.full_name}
                          onChange={updateField}
                          placeholder="Your full name"
                          autoComplete="name"
                          required
                        />
                      </div>
                    </label>

                    <label className="auth-field">
                      <span>University</span>

                      <div className="auth-input-wrap">
                        <Building2 size={18} />

                        <input
                          name="university"
                          value={form.university}
                          onChange={updateField}
                          placeholder="Your university"
                          autoComplete="organization"
                        />
                      </div>
                    </label>

                    <div className="auth-register-row">
                      <label className="auth-field">
                        <span>Course</span>

                        <div className="auth-input-wrap">
                          <BookOpen size={18} />

                          <input
                            name="course"
                            value={form.course}
                            onChange={updateField}
                            placeholder="Your course"
                          />
                        </div>
                      </label>

                      <label className="auth-field">
                        <span>Year level</span>

                        <div className="auth-input-wrap auth-select-wrap">
                          <select
                            name="year_level"
                            value={form.year_level}
                            onChange={updateField}
                          >
                            <option value="">Select year</option>
                            <option>1st Year</option>
                            <option>2nd Year</option>
                            <option>3rd Year</option>
                            <option>4th Year</option>
                            <option>5th Year</option>
                            <option>Graduate Student</option>
                          </select>
                        </div>
                      </label>
                    </div>

                    <div className="auth-section-label auth-account-label">
                      <span>02</span>
                      ACCOUNT DETAILS
                    </div>
                  </div>
                )}

                {/* EMAIL */}
                <label className="auth-field">
                  <span>Email address</span>

                  <div className="auth-input-wrap">
                    <Mail size={18} />

                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={updateField}
                      placeholder="you@example.com"
                      autoComplete="email"
                      required
                    />
                  </div>
                </label>

                {/* PASSWORD */}
                <label className="auth-field">
                  <span>Password</span>

                  <div className="auth-input-wrap">
                    <Lock size={18} />

                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={updateField}
                      placeholder={
                        isRegister
                          ? "At least 8 characters"
                          : "Enter your password"
                      }
                      autoComplete={
                        isRegister ? "new-password" : "current-password"
                      }
                      minLength={8}
                      required
                    />

                    <button
                      type="button"
                      className="auth-password-toggle"
                      onClick={() =>
                        setShowPassword((value) => !value)
                      }
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </label>

                {/* SUBMIT */}
                <button
                  className="auth-submit"
                  type="submit"
                  disabled={loading}
                >
                  <span>
                    {loading
                      ? "Please wait..."
                      : isRegister
                        ? "Create my account"
                        : "Log in"}
                  </span>

                  {!loading && <ArrowRight size={19} />}
                </button>
              </form>

              {/* BOTTOM LINK */}
              <div className="auth-bottom-note">
                {isRegister ? (
                  <>
                    Already have an account?

                    <button
                      type="button"
                      onClick={() => switchMode("login")}
                    >
                      Log in <ArrowRight size={14} />
                    </button>
                  </>
                ) : (
                  <>
                    New to SkillSwap?

                    <button
                      type="button"
                      onClick={() => switchMode("register")}
                    >
                      Join the community <ArrowRight size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

export default Auth;
