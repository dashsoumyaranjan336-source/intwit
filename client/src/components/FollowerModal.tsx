import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { AiOutlineClose } from "react-icons/ai";
import { setIsFollowerGlobalState } from "../redux/features/GlobalStateSlice";
// 🔥 Naya Action Import Kiya
import { removeFollowerLocally } from "../redux/features/authSlice"; 
import { Link, useLocation } from "react-router-dom";
import { IUser } from "../utils/interface";

const FollowerModal: React.FC = () => {
  const location = useLocation();
  const dispatch: AppDispatch = useDispatch();

  const { globalState, auth, user } = useSelector((state: RootState) => state);
  const { isFollowerGlobalState } = globalState;

  const [followersList, setFollowersList] = React.useState<IUser[]>([]);

  React.useEffect(() => {
    if (!auth?.user) return;

    if (location.pathname === `/${auth?.user?.username}`) {
      setFollowersList(auth?.user?.followers || []);
    } else if (user?.data) {
      setFollowersList(user?.data?.followers || []);
    }
  }, [auth, user, location.pathname]);

  const handleRemoveFollower = async (followerId: string) => {
    try {
      const token = (auth as any)?.token || (auth?.user as any)?.token; 

      const res = await fetch(`https://intwit-28qq.onrender.com/api/user/remove-follower/${followerId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
      });

      if (res.ok) {
        // 🔥 1. Redux state update karo (Turant follower ginti giregi)
        dispatch(removeFollowerLocally(followerId));

        // 🔥 2. Modal ki list se turant hatao
        setFollowersList((prev) => prev.filter((f) => f._id !== followerId));
        console.log("Follower Removed from Database!");

        // 3. Modal ko band karo bina page refresh kiye
        dispatch(setIsFollowerGlobalState()); 

      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.msg || "Failed to remove follower"}`);
      }
    } catch (error) {
      console.log(error);
      alert("Network Error!");
    }
  };

  if (!auth?.user) return null;

  return (
    <div>
      {isFollowerGlobalState && (
        <div className="edit_profile absolute-center">
          <div className="follower-modal-wrapper">
            <div className="follower-modal-header absolute-center">
              <span className="follower-modal-title">Followers</span>
              <button
                className="follower-modal-icon"
                onClick={() => dispatch(setIsFollowerGlobalState())}
              >
                <AiOutlineClose />
              </button>
            </div>
            
            <div className="follower-modal-body">
              {location.pathname === `/${auth?.user?.username}`
                ? followersList.map((follow: IUser) => (
                    <div 
                      className="follower-modal-user" 
                      key={follow?._id} 
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <Link
                        onClick={() => dispatch(setIsFollowerGlobalState())}
                        to={`/${follow?.username}`}
                        className="follower-modal-user-info"
                        style={{ flex: 1 }}
                      >
                        <div className="follower-modal-user-avatar">
                          <img src={follow?.avatar || "https://res.cloudinary.com/devatchannel/image/upload/v1609837149/avatar/avatar_cugq40.png"} alt="avatar" />
                        </div>
                        <div>
                          <div className="follower-modal-user-username">
                            {follow?.username}
                          </div>
                          <div className="follower-modal-user-fullname">
                            {follow?.fullname}
                          </div>
                        </div>
                      </Link>

                      <button 
                        onClick={() => handleRemoveFollower(follow._id)}
                        style={{
                          backgroundColor: "var(--card-bg)",
                          border: "1px solid var(--border-color)",
                          color: "var(--text-color)",
                          padding: "5px 12px",
                          borderRadius: "6px",
                          fontWeight: "600",
                          cursor: "pointer",
                          fontSize: "12px"
                        }}
                      >
                        Remove
                      </button>
                    </div>
                  ))
                : followersList.map((follow: IUser) => (
                    <div className="follower-modal-user" key={follow?._id}>
                      <Link
                        onClick={() => dispatch(setIsFollowerGlobalState())}
                        to={`/${follow?.username}`}
                        className="follower-modal-user-info"
                      >
                        <div className="follower-modal-user-avatar">
                          <img src={follow?.avatar || "https://res.cloudinary.com/devatchannel/image/upload/v1609837149/avatar/avatar_cugq40.png"} alt="avatar" />
                        </div>
                        <div>
                          <div className="follower-modal-user-username">
                            {follow?.username}
                          </div>
                          <div className="follower-modal-user-fullname">
                            {follow?.fullname}
                          </div>
                        </div>
                      </Link>
                    </div>
                  ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FollowerModal;