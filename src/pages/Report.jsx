import { useState } from "react";
import { Navigate } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth";

export default function Report() {
  const { user, loading } = useAuth();
  const [form, setForm] = useState({
    reportedId: "",
    reason: "",
    proof: "",
    when: "",
    where: "",
  });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  if (loading) return <section className="wrap page">Loading…</section>;
  if (!user) return <Navigate to="/" replace />;

  function field(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.submitReport(form);
      setDone(true);
      setForm({ reportedId: "", reason: "", proof: "", when: "", where: "" });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="page-hero page-hero-red">
      <div className="wrap page">
        <h1>Report</h1>
        <p className="sub">Submit a player report. Staff will review it in the dashboard before it goes on the blacklist.</p>
        {done ? <p className="banner banner-ok">Report submitted. Staff will review it.</p> : null}
        {error ? <p className="banner banner-danger">{error}</p> : null}
        <form className="report-form" onSubmit={submit}>
          <label>
            Your Discord ID
            <input value={user.id} disabled />
          </label>
          <label>
            Reported Discord user ID
            <input
              required
              placeholder="Discord user ID of the person you are reporting"
              value={form.reportedId}
              onChange={(e) => field("reportedId", e.target.value)}
            />
          </label>
          <label>
            Why are you reporting them?
            <textarea
              required
              rows={3}
              placeholder="Cheating, toxicity, throw, etc."
              value={form.reason}
              onChange={(e) => field("reason", e.target.value)}
            />
          </label>
          <label>
            Proof
            <textarea
              required
              rows={3}
              placeholder="Links to clips, screenshots, Medal, Discord message links…"
              value={form.proof}
              onChange={(e) => field("proof", e.target.value)}
            />
          </label>
          <label>
            When did it happen?
            <input
              required
              placeholder="e.g. 13 Aug 2026, during ranked"
              value={form.when}
              onChange={(e) => field("when", e.target.value)}
            />
          </label>
          <label>
            Where did it happen?
            <input
              required
              placeholder="e.g. Clan League | Hub / ranked server / tryout VC"
              value={form.where}
              onChange={(e) => field("where", e.target.value)}
            />
          </label>
          <button className="btn" type="submit" disabled={busy}>
            {busy ? "Submitting…" : "Submit report"}
          </button>
        </form>
      </div>
    </section>
  );
}
