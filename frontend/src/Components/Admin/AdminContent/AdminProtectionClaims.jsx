"use client";

import { useCallback, useEffect, useState } from "react";
import api from "../../../utils/api";
import {
  Field,
  Modal,
  Notice,
  Pill,
  errMsg,
  formatDate,
  useNotice,
} from "./EngagementShared";

const STATUS_TONE = { SUBMITTED: "warning", APPROVED: "success", REJECTED: "danger" };
const STATUS_LABEL = { SUBMITTED: "Pending", APPROVED: "Approved", REJECTED: "Rejected" };

const money = (amount, currency) =>
  `${Number(amount || 0).toFixed(currency === "KWD" ? 3 : 2)} ${currency || ""}`.trim();

const routeOf = (booking) =>
  [booking?.pickupLocation, booking?.dropoffLocation].filter(Boolean).join(" to ") || "Booking";

function DecideModal({ item, onClose, onSaved, onError }) {
  const [decision, setDecision] = useState("APPROVED");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const refund =
    ((item.booking?.paymentAmount || 0) * (item.refundPercent || 0)) / 100;

  const submit = async () => {
    setSaving(true);
    try {
      const res = await api.put(`/engagement/trip-protection/${item._id}/claim/admin`, {
        decision,
        adminNote: note.trim(),
      });
      onSaved(res.data?.message || "Claim updated.");
    } catch (error) {
      onError(errMsg(error, "Could not save the decision."));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title="Review protection claim"
      onClose={onClose}
      footer={
        <>
          <button type="button" className="eng-btn ghost" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button type="button" className="eng-btn primary" onClick={submit} disabled={saving}>
            {saving ? "Saving..." : decision === "APPROVED" ? "Approve and refund" : "Reject claim"}
          </button>
        </>
      }
    >
      <p style={{ margin: "0 0 4px", fontWeight: 600 }}>{routeOf(item.booking)}</p>
      <p className="eng-muted" style={{ margin: "0 0 4px" }}>
        {item.user?.fullName || "Deleted user"} | {item.planName || item.plan} cover |{" "}
        {item.refundPercent}% refund
      </p>
      <p className="eng-muted" style={{ marginBottom: 16, whiteSpace: "pre-wrap" }}>
        Reason: {item.claim?.reason}
      </p>
      <div className="eng-form-grid">
        <Field label="Decision" full>
          <select className="eng-select" value={decision} onChange={(e) => setDecision(e.target.value)}>
            <option value="APPROVED">Approve</option>
            <option value="REJECTED">Reject</option>
          </select>
        </Field>
        {decision === "APPROVED" ? (
          <p className="eng-muted" style={{ gridColumn: "1 / -1", margin: 0 }}>
            {money(refund, item.currency)} will be added to the commuter&apos;s wallet.
          </p>
        ) : null}
        <Field label="Note to commuter" hint="Sent with the notification." full>
          <textarea
            className="eng-textarea"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            maxLength={1000}
          />
        </Field>
      </div>
    </Modal>
  );
}

function AdminProtectionClaims() {
  const [items, setItems] = useState([]);
  const [stats, setStats] = useState({ SUBMITTED: 0, APPROVED: 0, REJECTED: 0 });
  const [status, setStatus] = useState("SUBMITTED");
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(null);
  const [notice, showNotice] = useNotice();

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/engagement/trip-protection/claims/admin", {
        params: { status: status || undefined },
      });
      const data = res.data?.data || {};
      setItems(data.items || []);
      setStats(data.stats || { SUBMITTED: 0, APPROVED: 0, REJECTED: 0 });
    } catch (error) {
      showNotice("error", errMsg(error, "Could not load claims."));
    } finally {
      setLoading(false);
    }
  }, [status, showNotice]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="eng-wrap">
      <Notice notice={notice} />
      <div className="eng-stats">
        {Object.keys(STATUS_LABEL).map((key) => (
          <div className="eng-stat" key={key}>
            <b>{stats[key]}</b>
            <span>{STATUS_LABEL[key]}</span>
          </div>
        ))}
      </div>

      <div className="eng-toolbar">
        <select
          className="eng-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          aria-label="Filter by claim status"
        >
          <option value="">All claims</option>
          <option value="SUBMITTED">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
      </div>

      {loading && !items.length ? (
        <div className="eng-empty">Loading claims...</div>
      ) : !items.length ? (
        <div className="eng-empty">No claims here.</div>
      ) : (
        items.map((p) => (
          <div className="eng-feedback-card" key={p._id}>
            <div className="eng-feedback-head">
              <div>
                <b>{routeOf(p.booking)}</b>
                <div className="eng-muted" style={{ marginTop: 2 }}>
                  {p.user?.fullName || "Deleted user"}
                  {p.user?.email ? ` (${p.user.email})` : ""} | {p.planName || p.plan} |{" "}
                  {p.refundPercent}% of {money(p.booking?.paymentAmount, p.currency)} |{" "}
                  Submitted {formatDate(p.claim?.submittedAt)}
                </div>
              </div>
              <div className="eng-actions">
                <Pill tone={STATUS_TONE[p.claim?.status]}>
                  {STATUS_LABEL[p.claim?.status] || p.claim?.status}
                </Pill>
                {p.claim?.status === "SUBMITTED" ? (
                  <button type="button" className="eng-btn primary" onClick={() => setDeciding(p)}>
                    Review
                  </button>
                ) : null}
              </div>
            </div>
            <p className="eng-muted" style={{ margin: "8px 0 0", whiteSpace: "pre-wrap" }}>
              {p.claim?.reason}
            </p>
            {p.claim?.status === "APPROVED" ? (
              <p className="eng-muted" style={{ margin: "6px 0 0" }}>
                Refunded {money(p.claim.refundAmount, p.currency)} to wallet
                {p.claim.decidedAt ? ` on ${formatDate(p.claim.decidedAt)}` : ""}
              </p>
            ) : null}
            {p.claim?.adminNote ? (
              <p className="eng-muted" style={{ margin: "6px 0 0" }}>
                Note: {p.claim.adminNote}
              </p>
            ) : null}
          </div>
        ))
      )}

      {deciding ? (
        <DecideModal
          item={deciding}
          onClose={() => setDeciding(null)}
          onError={(msg) => showNotice("error", msg)}
          onSaved={(msg) => {
            setDeciding(null);
            showNotice("success", msg);
            load();
          }}
        />
      ) : null}
    </div>
  );
}

export default AdminProtectionClaims;
