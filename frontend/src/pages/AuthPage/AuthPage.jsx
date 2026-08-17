import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowRight, FaEnvelope, FaHeart, FaLock, FaPhone, FaShieldHeart, FaUser, FaUsers } from "react-icons/fa6";

const blankSignup = { first_name: "", last_name: "", email: "", phone: "", password: "", role: "FAMILY" };

function AuthPage({ mode }) {
  const isLogin = mode === "login";
  const navigate = useNavigate();
  const [form, setForm] = useState(isLogin ? { email: "", password: "" } : blankSignup);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const update = (event) => setForm({ ...form, [event.target.name]: event.target.value });
  async function submit(event) {
    event.preventDefault(); setError(""); setSaving(true);
    try {
      const response = await fetch(`/api/auth/${isLogin ? "login" : "signup"}/`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await response.json();
      if (!response.ok) throw new Error(Object.values(data).flat().join(" ") || "Please check your details and try again.");
      if (!isLogin) { navigate("/login"); return; }
      localStorage.setItem("careconnect_user", JSON.stringify(data.user)); localStorage.setItem("careconnect_access", data.access); localStorage.setItem("careconnect_refresh", data.refresh);
      navigate(data.user.role === "ELDER" ? "/elder/dashboard" : "/dashboard/family");
    } catch (requestError) { setError(requestError.message === "Failed to fetch" ? "Cannot reach the CareConnect server. Start Django on port 8000." : requestError.message); }
    finally { setSaving(false); }
  }
  return <main className="auth-page"><div className="auth-shell"><aside className="auth-showcase"><Link className="auth-brand light-brand" to="/"><FaHeart /> Care<span>Connect</span></Link><div><p className="auth-kicker">Care, made closer</p><h1>Everyday care feels better when you feel connected.</h1><p>One thoughtful place for families and elders to stay in touch, informed, and supported.</p></div><div className="showcase-note"><FaShieldHeart /><span><strong>Private & secure</strong>Your care information stays protected.</span></div></aside><section className="auth-card"><Link className="auth-brand mobile-brand" to="/"><FaHeart /> Care<span>Connect</span></Link><p className="auth-kicker">{isLogin ? "Welcome back" : "Start your journey"}</p><h2>{isLogin ? "Sign in to CareConnect" : "Create your account"}</h2><p className="auth-description">{isLogin ? "Access your personal care dashboard." : "A few details and you are ready to connect."}</p>{error && <p className="auth-error" role="alert">{error}</p>}<form onSubmit={submit} className="auth-form">{!isLogin && <div className="auth-row"><label>First name<span className="input-wrap"><FaUser /><input name="first_name" placeholder="Jane" value={form.first_name} onChange={update} required /></span></label><label>Last name<span className="input-wrap"><FaUser /><input name="last_name" placeholder="Doe" value={form.last_name} onChange={update} required /></span></label></div>}{!isLogin && <fieldset className="role-picker"><legend>How will you use CareConnect?</legend><div><label className={form.role === "FAMILY" ? "role-option selected" : "role-option"}><input type="radio" name="role" value="FAMILY" checked={form.role === "FAMILY"} onChange={update} /><FaUsers /><span><strong>Family member</strong><small>Care for a loved one</small></span></label><label className={form.role === "ELDER" ? "role-option selected" : "role-option"}><input type="radio" name="role" value="ELDER" checked={form.role === "ELDER"} onChange={update} /><FaHeart /><span><strong>Elder</strong><small>Manage my own care</small></span></label></div></fieldset>}<label>Email address<span className="input-wrap"><FaEnvelope /><input type="email" name="email" placeholder="you@example.com" value={form.email} onChange={update} required /></span></label>{!isLogin && <label>Phone number <em>(optional)</em><span className="input-wrap"><FaPhone /><input type="tel" name="phone" placeholder="Your contact number" value={form.phone} onChange={update} /></span></label>}<label>Password<span className="input-wrap"><FaLock /><input type="password" name="password" placeholder={isLogin ? "Enter your password" : "At least 8 characters"} value={form.password} onChange={update} minLength={isLogin ? undefined : 8} required /></span></label><button className="auth-submit" disabled={saving}>{saving ? "Please wait..." : isLogin ? "Sign in securely" : "Create my account"}<FaArrowRight /></button></form><p className="auth-switch">{isLogin ? "New to CareConnect?" : "Already have an account?"} <Link to={isLogin ? "/signup" : "/login"}>{isLogin ? "Create an account" : "Sign in"}</Link></p></section></div></main>;
}
export default AuthPage;
