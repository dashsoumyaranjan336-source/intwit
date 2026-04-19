import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { AiOutlineClose } from "react-icons/ai";
import { setIsFollowingGlobalState } from "../redux/features/GlobalStateSlice";
// 🔥 Naya Action Import Kiya
import { removeFollowingLocally } from "../redux/features/authSlice"; 
import { Link, useLocation } from "react-router-dom";
import { IUser } from "../utils/interface";

const FollowingModal: React.FC = () => {
  const location = useLocation();
  const dispatch: AppDispatch = useDispatch();

  const { auth, user, globalState } = useSelector((state: RootState) => state);
  const { isFollowingGlobalState } = globalState;

  const [followingList, setFollowingList] = React.useState<IUser[]>([]);

  React.useEffect(() => {
    if (!auth || !auth.user) return;

    // Purane duplicates ko UI me dikhne se rokne ka filter
    const getUniqueUsers = (users: IUser[]) => {
      return users.filter((v, i, a) => a.findIndex((t) => t._id === v._id) === i);
    };

    if (location.pathname === `/${auth.user.username}`) {
      setFollowingList(getUniqueUsers(auth.user.following || []));
    } else if (user && user.data) {
      setFollowingList(getUniqueUsers(user.data.following || []));
    }
  }, [auth, user, location.pathname]);

  const handleUnfollow = async (unfollowId: string) => {
    try {
      const token = (auth as any)?.token || (auth?.user as any)?.token; 

      const res = await fetch(`https://intwit-28qq.onrender.com/api/user/unfollow/${unfollowId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`, 
        },
      });

      if (res.ok) {
        // 🔥 1. Redux state update karo (Turant number kam hoga profile page pe)
        dispatch(removeFollowingLocally(unfollowId));
        
        // 🔥 2. Modal ki local list se bhi turant hatao
        setFollowingList((prev) => prev.filter((f) => f._id !== unfollowId));
        
        // 3. Modal band karo bina kisi hard refresh ke
        dispatch(setIsFollowingGlobalState()); 
      } else {
        alert("Failed to unfollow");
      }
    } catch (error) {
      console.log(error);
      alert("Network Error!");
    }
  };

  if (!auth || !auth.user) return null;

  return (
    <div>
      {isFollowingGlobalState && (
        <div className="edit_profile absolute-center">
          <div className="follower-modal-wrapper">
            <div className="follower-modal-header absolute-center">
              <span className="follower-modal-title">Following</span>
              <button
                className="follower-modal-icon"
                onClick={() => dispatch(setIsFollowingGlobalState())}
              >
                <AiOutlineClose />
              </button>
            </div>
            <div className="follower-modal-body">
              {location.pathname === `/${auth.user.username}`
                ? followingList.map((follow: IUser) => (
                    <div 
                      className="follower-modal-user" 
                      key={follow._id}
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}
                    >
                      <Link
                        onClick={() => dispatch(setIsFollowingGlobalState())}
                        to={`/${follow.username}`}
                        className="follower-modal-user-info"
                        style={{ flex: 1 }}
                      >
                        <div className="follower-modal-user-avatar">
                          <img src={follow.avatar || "https://res.cloudinary.com/devatchannel/image/upload/v1609837149/avatar/avatar_cugq40.png"} alt="avatar" />
                        </div>
                        <div>
                          <div className="follower-modal-user-username">
                            {follow.username}
                          </div>
                          <div className="follower-modal-user-fullname">
                            {follow.fullname}
                          </div>
                        </div>
                      </Link>

                      <button 
                        onClick={() => handleUnfollow(follow._id)}
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
                        Unfollow
                      </button>
                    </div>
                  ))
                : followingList.map((follow: IUser) => (
                    <div className="follower-modal-user" key={follow._id}>
                      <Link
                        onClick={() => dispatch(setIsFollowingGlobalState())}
                        to={`/${follow.username}`}
                        className="follower-modal-user-info"
                      >
                        <div className="follower-modal-user-avatar">
                          <img src={follow.avatar || "https://res.cloudinary.com/devatchannel/image/upload/v1609837149/avatar/avatar_cugq40.png"} alt="avatar" />
                        </div>
                        <div>
                          <div className="follower-modal-user-username">
                            {follow.username}
                          </div>
                          <div className="follower-modal-user-fullname">
                            {follow.fullname}
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

export default FollowingModal;