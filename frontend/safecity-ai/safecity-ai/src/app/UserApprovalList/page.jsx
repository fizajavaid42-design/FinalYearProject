// "use client";
// import { useState, useEffect } from "react";
// import { useRouter, useSearchParams } from "next/navigation";
// import api from "@/utils/api";
// import "@/styles/UserApproval.css";

// export default function UserApprovalPage() {
//   const router = useRouter();
//   const searchParams = useSearchParams();
//   const [users, setUsers] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState("Pending"); // "All", "Pending", "Approved", "Rejected"

//   async function fetchUsers() {
//     setLoading(true);
//     try {
//       const res = await api.get("/admin/users/all");
//       // ✅ Ab sare users store karo
//       const allUsers = Array.isArray(res.data) ? res.data : [];
//       setUsers(allUsers);
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }

//   useEffect(() => { 
//     fetchUsers();
//   }, []);

//   useEffect(() => {
//     if (searchParams.get("refresh") === "true") {
//       fetchUsers();
//       router.replace("/UserApprovalList", { scroll: false });
//     }
//   }, [searchParams]);

//   // ✅ Filtered users according to selection
//   const filteredUsers = users.filter(user => {
//     if (filter === "All") return true;
//     return user.approval_status === filter;
//   });

//   const handleBack = () => {
//     router.push("/admin/dashboard");
//   };

//   return (
//     <div className="ua-container">
//       <div className="ua-header">
//         <div className="ua-header-content">
//           <button className="ua-back-btn" onClick={handleBack}>&#8592; Back</button>
//           <span className="ua-title">User Approval Requests</span>
          
//           {/* ✅ Filter Buttons */}
//           <div className="ua-filters">
//             <button 
//               className={`ua-filter-btn ${filter === "All" ? "active" : ""}`}
//               onClick={() => setFilter("All")}
//             >
//               All ({users.length})
//             </button>
//             <button 
//               className={`ua-filter-btn ${filter === "Pending" ? "active" : ""}`}
//               onClick={() => setFilter("Pending")}
//             >
//               Pending ({users.filter(u => u.approval_status === "Pending").length})
//             </button>
//             <button 
//               className={`ua-filter-btn ${filter === "Approved" ? "active" : ""}`}
//               onClick={() => setFilter("Approved")}
//             >
//               Approved ({users.filter(u => u.approval_status === "Approved").length})
//             </button>
//             <button 
//               className={`ua-filter-btn ${filter === "Rejected" ? "active" : ""}`}
//               onClick={() => setFilter("Rejected")}
//             >
//               Rejected ({users.filter(u => u.approval_status === "Rejected").length})
//             </button>
//           </div>
//         </div>
//       </div>

//       <div className="ua-body">
//         {loading ? (
//           <div className="ua-loader"><div className="ua-spinner" /></div>
//         ) : filteredUsers.length === 0 ? (
//           <div className="ua-empty">
//             <span className="ua-empty-icon">👥</span>
//             <p>No {filter !== "All" ? filter : ""} users found.</p>
//           </div>
//         ) : (
//           <div className="ua-grid">
//             {filteredUsers.map((user, i) => (
//               <div key={user.user_id ?? i} className="ua-card">
//                 <div className="ua-card-header">
//                   <div className="ua-user-profile">
//                     <div className="ua-avatar-box">
//                       {user.role === "police" ? "👮" : "👤"}
//                     </div>
//                     <div className="ua-user-meta">
//                       <span className="ua-name">{user.name}</span>
//                       <span className={`ua-role-tag ${user.role}`}>
//                         {user.role?.toUpperCase()}
//                       </span>
//                     </div>
//                   </div>
//                   {/* ✅ Status ke hisaab se different dot */}
//                   <div className={`ua-status-dot ${user.approval_status || 'Pending'}`}></div>
//                 </div>

//                 <div className="ua-card-body">
//                   <div className="ua-info-item">
//                     <span className="ua-icon">📧</span>
//                     <span className="ua-text">{user.email}</span>
//                   </div>
//                   <div className="ua-info-item">
//                     <span className="ua-icon">🕒</span>
//                     <span className="ua-text">
//                       Status: <strong className={`status-${user.approval_status || 'Pending'}`}>
//                         {user.approval_status ?? "Pending"}
//                       </strong>
//                     </span>
//                   </div>
//                 </div>

//                 {/* ✅ Approved/Rejected users ke liye view only button */}
//                 {user.approval_status === "Pending" ? (
//                   <button
//                     className="ua-view-btn"
//                     onClick={() => router.push(`/UserRequestDetail/${user.user_id}`)}
//                   >
//                     Review Details
//                   </button>
//                 ) : (
//                   <button
//                     className="ua-view-btn ua-view-only"
//                     disabled
//                   >
//                     {user.approval_status} ✓
//                   </button>
//                 )}
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }

"use client";
import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import api from "@/utils/api";
import "@/styles/UserApproval.css";

export default function UserApprovalPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  async function fetchUsers() {
    setLoading(true);
    try {
      const res = await api.get("/admin/users/all");
      // Sirf Pending status walay users filter karo
      const pendingUsers = Array.isArray(res.data) 
        ? res.data.filter(user => user.approval_status === "Pending" || !user.approval_status)
        : [];
      setUsers(pendingUsers);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { 
    fetchUsers();
  }, []);

  // ✅ Jab refresh=true aaye to list refresh karo
  useEffect(() => {
    if (searchParams.get("refresh") === "true") {
      fetchUsers();
      // URL clean karo without page reload
      router.replace("/UserApprovalList", { scroll: false });
    }
  }, [searchParams]);

  // ✅ Back button handler - Dashboard pe jaye
  const handleBack = () => {
    router.push("/adminDashboard"); // Apne dashboard ke route ke mutabiq change karein
  };

  return (
    <div className="ua-container">
      <div className="ua-header">
        <div className="ua-header-content">
          {/* ✅ Yahan Back button change kiya */}
          <button className="ua-back-btn" onClick={handleBack}>&#8592; Back</button>
          <span className="ua-title">User Approval Requests</span>
          <div style={{ width: '70px' }}></div>
        </div>
      </div>

      <div className="ua-body">
        {loading ? (
          <div className="ua-loader"><div className="ua-spinner" /></div>
        ) : users.length === 0 ? (
          <div className="ua-empty">
            <span className="ua-empty-icon">👥</span>
            <p>No pending user requests found.</p>
          </div>
        ) : (
          <div className="ua-grid">
            {users.map((user, i) => (
              <div key={user.user_id ?? i} className="ua-card">
                <div className="ua-card-header">
                  <div className="ua-user-profile">
                    <div className="ua-avatar-box">
                      {user.role === "police" ? "👮" : "👤"}
                    </div>
                    <div className="ua-user-meta">
                      <span className="ua-name">{user.name}</span>
                      <span className={`ua-role-tag ${user.role}`}>
                        {user.role?.toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <div className={`ua-status-dot ${user.approval_status || 'Pending'}`}></div>
                </div>

                <div className="ua-card-body">
                  <div className="ua-info-item">
                    <span className="ua-icon">📧</span>
                    <span className="ua-text">{user.email}</span>
                  </div>
                  <div className="ua-info-item">
                    <span className="ua-icon">🕒</span>
                    <span className="ua-text">
                      Status: <strong>{user.approval_status ?? "Pending"}</strong>
                    </span>
                  </div>
                </div>

                <button
                  className="ua-view-btn"
                  onClick={() => router.push(`/UserRequestDetail/${user.user_id}`)}
                >
                  Review Details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

