"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/utils/api";
import "@/styles/UserRequestDetail.css";

export default function UserDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    api.get("/admin/users/all")
      .then((res) => {
        const found = res.data.find((u) => String(u.user_id) === String(id));
        setUser(found ?? null);
      })
      .catch(() => setErrorMsg("Failed to load user details"))
      .finally(() => setLoading(false));
  }, [id]);

  async function updateStatus(status) {
    setSubmitting(true);
    setSuccessMsg(""); 
    setErrorMsg("");
    try {
      await api.patch(`/admin/users/${id}/approval`, { status });
      setSuccessMsg(`User ${status} successfully!`);
      
      // ✅ List page pe jao with refresh parameter
      setTimeout(() => {
        router.push("/UserApprovalList?refresh=true");
      }, 1500);
      
    } catch (err) {
      setErrorMsg(err.response?.data?.detail ?? "Something went wrong");
      setSubmitting(false);
    }
  }

  // Rest of your JSX remains EXACTLY the same
  if (loading) return <div className="urd-container"><div className="urd-loader"><div className="urd-spinner" /></div></div>;

  if (!user) return <div className="urd-container"><div className="urd-empty"><p>User not found.</p></div></div>;

  const docs = user.documents ?? [];

  return (
    <div className="urd-container">
      <div className="urd-header">
        <button className="urd-back-btn" onClick={() => router.back()}>&#8592; Back</button>
        <span className="urd-header-title">User Request Detail</span>
        <div style={{ width: '80px' }}></div>
      </div>

      <div className="urd-main-content">
        <div className="urd-profile-card">
          <div className="urd-avatar-large">
            {user.role === "police" ? "👮" : "👤"}
          </div>
          <div className="urd-profile-info">
            <h2>{user.name}</h2>
            <p className="urd-role-text">{user.role?.toUpperCase()} REQUEST</p>
            <div className={`urd-status-chip ${user.approval_status}`}>
              {user.approval_status || "Pending"}
            </div>
          </div>
        </div>

        <div className="urd-details-section">
          <h3 className="section-label">Information</h3>
          <div className="urd-info-grid">
            <UrdRow icon="📧" label="Email Address" value={user.email} />
            <UrdRow icon="📞" label="Phone Number" value={user.contact || "N/A"} />
            <UrdRow icon="🆔" label="User ID" value={user.user_id} />
            {user.designation && <UrdRow icon="🎖️" label="Designation" value={user.designation} />}
          </div>
        </div>

        <div className="urd-docs-section">
          <h3 className="section-label">Verification Documents</h3>
          {docs.length === 0 ? (
            <p className="urd-no-docs">No documents uploaded.</p>
          ) : (
            <div className="urd-docs-grid">
              {docs.map((doc, i) => (
                <div key={i} className="urd-doc-item">
                  <span className="doc-icon">{doc.document_type === "PDF" ? "📄" : "🖼️"}</span>
                  <div className="doc-meta">
                    <p className="doc-name">{doc.document_type}</p>
                    <button className="doc-view-link">View File</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {successMsg && <div className="urd-alert-success">{successMsg}</div>}
        {errorMsg && <div className="urd-alert-error">{errorMsg}</div>}

        <div className="urd-action-footer">
          <button 
            className="urd-reject-btn" 
            disabled={submitting} 
            onClick={() => updateStatus("Rejected")}
          >
            {submitting ? <div className="urd-btn-spinner" /> : "Reject Request"}
          </button>
          <button 
            className="urd-approve-btn" 
            disabled={submitting} 
            onClick={() => updateStatus("Approved")}
          >
            {submitting ? <div className="urd-btn-spinner" /> : "Approve Request"}
          </button>
        </div>
      </div>
    </div>
  );
}

function UrdRow({ icon, label, value }) {
  return (
    <div className="urd-detail-row">
      <div className="row-label-group">
        <span className="row-icon">{icon}</span>
        <span className="row-label">{label}</span>
      </div>
      <span className="row-value">{value}</span>
    </div>
  );
}