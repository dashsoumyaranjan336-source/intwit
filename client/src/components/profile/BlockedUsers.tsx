import React, { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { Link } from "react-router-dom";
import axios from "axios";

const BlockedUsers: React.FC = () => {
  const [blockedList, setBlockedList] = useState<any[]>([]);
  const { auth } = useSelector((state: RootState) => state);

  // 🔴 FIXED: Token extraction logic
  const token = (auth as any).token || (auth.user as any)?.token;

  // 🔴 1. Blocked users ki list fetch karo (useCallback for stability)
  const fetchBlocks = useCallback(async () => {
    if (!token) return;
    try {
      const res = await axios.get("https://intwit.onrender.com/api/user/blocked_list", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBlockedList(res.data);
    } catch (err: any) {
      console.error("Error fetching blocked users:", err.response?.data || err.message);
    }
  }, [token]);

  useEffect(() => {
    fetchBlocks();
  }, [fetchBlocks]);

  // 🔴 2. Unblock Handle karo
  const handleUnblock = async (userId: string) => {
    if (!token) return;
    try {
      const res = await axios.put(`https://intwit.onrender.com/api/user/block/${userId}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 200) {
        // UI se turant hatao
        setBlockedList(prev => prev.filter(user => user._id !== userId));
        
        // Local storage update karo (taki search/chat filters sync rahein)
        let localBlocked = JSON.parse(localStorage.getItem("myBlockedUsers") || "[]");
        localBlocked = localBlocked.filter((id: string) => id !== userId);
        localStorage.setItem("myBlockedUsers", JSON.stringify(localBlocked));
        
        alert("User Unblocked! 🔓");
      }
    } catch (err: any) {
      alert(err.response?.data?.msg || "Error unblocking user");
    }
  };

  return (
    <div className="container mt-4" style={{ maxWidth: "500px" }}>
      <h4 className="fw-bold mb-4 text-center">Blocked Accounts</h4>
      <div className="card shadow-sm p-3" style={{ borderRadius: "15px" }}>
        {blockedList.length === 0 ? (
          <p className="text-center text-muted my-4">No blocked users found.</p>
        ) : (
          blockedList.map((user) => (
            <div key={user._id} className="d-flex align-items-center justify-content-between mb-3 pb-2 border-bottom">
              <div className="d-flex align-items-center">
                <img 
                  src={user.avatar} 
                  alt="avatar" 
                  className="rounded-circle me-3" 
                  style={{ width: "45px", height: "45px", objectFit: "cover", border: "1px solid #dbdbdb" }} 
                />
                <div>
                  <Link to={`/${user.username}`} className="fw-bold text-decoration-none text-dark d-block">
                    {user.username}
                  </Link>
                  <div className="text-muted small">{user.fullname}</div>
                </div>
              </div>
              <button 
                onClick={() => handleUnblock(user._id)} 
                className="btn btn-primary btn-sm fw-bold px-3"
                style={{ borderRadius: "20px" }}
              >
                Unblock
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default BlockedUsers;