import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom"; 
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { getUser } from "../redux/features/userSlice";
import InfoProfile from "../components/profile/InfoProfile";
import Helmet from "../components/Helmet";
import { getSavePost, getUserPost } from "../redux/features/postSlice";
import { BiMoviePlay } from "react-icons/bi"; 

import {
  PostsFocusIcon,
  PostsIcon,
  SavedFocusIcon,
  SavedIcon,
} from "../components/Icons";
import PostsProfile from "../components/profile/PostsProfile";
import SavedPostsProfile from "../components/profile/SavedPostsProfile";
import ReelsProfile from "../components/profile/ReelsProfile"; 

const Profile: React.FC = () => {
  const params = useParams();
  const { username } = params as { username: string };

  const [isPosts, setIsPosts] = useState<boolean>(true);
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [isReels, setIsReels] = useState<boolean>(false); 
  const [isBlocked, setIsBlocked] = useState<boolean>(false);

  const { auth, user } = useSelector((state: RootState) => state);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (!auth.user) return;
    if (username !== auth.user.username) {
      dispatch(getUser(username));
    }
    isPosts && dispatch(getUserPost(username));
  }, [auth.user, dispatch, isPosts, username]);

  // 🔴 SYNC BLOCK STATUS WITH LOCAL STORAGE
  useEffect(() => {
    const localBlocked = JSON.parse(localStorage.getItem("myBlockedUsers") || "[]");
    const currentProfileId = (user.data as any)?._id?.toString();
    
    if (currentProfileId && localBlocked.includes(currentProfileId)) {
      setIsBlocked(true);
    } else {
      setIsBlocked(false);
    }
  }, [user.data]);

  const handleBlockUser = async () => {
    if (!user.data?._id) return;
    
    const targetUserId = user.data._id.toString();
    const token = (auth.user as any)?.token || (auth as any).token;

    try {
      const res = await fetch(`https://intwit-28qq.onrender.com/api/user/block/${targetUserId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok) {
        let localBlocked = JSON.parse(localStorage.getItem("myBlockedUsers") || "[]");
        
        if (localBlocked.includes(targetUserId)) {
          localBlocked = localBlocked.filter((id: string) => id !== targetUserId);
          setIsBlocked(false);
        } else {
          localBlocked.push(targetUserId);
          setIsBlocked(true);
        }
        
        localStorage.setItem("myBlockedUsers", JSON.stringify(localBlocked));
        alert(data.msg || (isBlocked ? "User Unblocked!" : "User Blocked!"));
        window.location.reload(); 
      } else {
        alert(data.msg);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing block request!");
    }
  };

  const handleChangeSaved = async () => {
    if (username) {
      await dispatch(
        getSavePost(
          auth.user!.username === username ? auth.user!._id : user.data!._id
        )
      );
      setIsSaved(true);
      setIsPosts(false);
      setIsReels(false); 
    }
  };

  const handleChangePosts = async () => {
    if (username) {
      await dispatch(getUserPost(username));
      setIsSaved(false);
      setIsReels(false); 
      setIsPosts(true);
    }
  };

  // 🚨 Reels Tab Switch karne ka logic
  const handleChangeReels = () => {
    setIsPosts(false);
    setIsSaved(false);
    setIsReels(true);
  };

  const isFollowing = (user.data as any)?.followers?.some(
    (f: any) => f._id === auth.user?._id || f === auth.user?._id
  );
  const isMyProfile = auth.user?.username === username;
  const hidePosts = (user.data as any)?.isPrivate && !isMyProfile && !isFollowing;

  return (
    <Helmet title={`(@${username}) • intwit photos and videos`}>
      <div className="profile-page-container">
        
        <div style={{ position: "relative" }}>
          {/* 🔴 SETTINGS / BLOCKED USERS BUTTON (Only on My Profile) */}
          {isMyProfile && (
            <div style={{ position: "absolute", top: "20px", right: "20px", zIndex: 10, display: "flex", gap: "10px" }}>
              <Link 
                to="/settings/blocked" 
                className="btn btn-outline-dark btn-sm fw-bold"
                style={{ borderRadius: "20px", padding: "5px 15px" }}
              >
                🚫 Blocked Users
              </Link>
            </div>
          )}

          {/* 🚫 Block/Unblock Button (On Other People's Profile) */}
          {!isMyProfile && user.data && (
            <button
              onClick={handleBlockUser}
              className={`btn ${isBlocked ? 'btn-danger' : 'btn-outline-danger'} btn-sm fw-bold`}
              style={{ 
                position: "absolute", 
                top: "20px", 
                right: "20px", 
                zIndex: 10, 
                borderRadius: "20px" 
              }}
            >
              {isBlocked ? "🚫 Unblock" : "🚫 Block User"}
            </button>
          )}

          <InfoProfile username={username} />
        </div>

        {isBlocked ? (
          <div className="text-center mt-5" style={{ padding: "50px 0", borderTop: "1px solid var(--border-color)" }}>
            <h2 className="fw-bold">🚫 You have blocked this user</h2>
            <p className="text-muted">Unblock to see their posts and profile details.</p>
          </div>
        ) : 
        hidePosts ? (
          <div className="text-center mt-5" style={{ padding: "50px 0", borderTop: "1px solid var(--border-color)" }}>
            <h2 className="fw-bold">🔒 This Account is Private</h2>
            <p className="text-muted">Follow this account to see their photos and videos.</p>
          </div>
        ) : (
          <div className="posts-list-section">
            <div className="d-flex justify-content-center mb-3" style={{ borderTop: "1px solid #dbdbdb", gap: "60px" }}>
              
              {/* Posts Tab */}
              <div className="cur-point">
                {isPosts ? (
                  <div className="posts-list-title-active">
                    <PostsFocusIcon />
                    <span className="post-list-title-span-active">POSTS</span>
                  </div>
                ) : (
                  <div className="posts-list-title" onClick={handleChangePosts}>
                    <PostsIcon />
                    <span className="post-list-title-span">POSTS</span>
                  </div>
                )}
              </div>

              {/* 🚨 Reels Tab */}
              <div className="cur-point">
                {isReels ? (
                  <div className="posts-list-title-active">
                    <BiMoviePlay style={{ fontSize: "20px", color: "black" }} />
                    <span className="post-list-title-span-active">REELS</span>
                  </div>
                ) : (
                  <div className="posts-list-title" onClick={handleChangeReels}>
                    <BiMoviePlay style={{ fontSize: "20px", color: "#8e8e8e" }} />
                    <span className="post-list-title-span">REELS</span>
                  </div>
                )}
              </div>
              
              {/* Saved Tab */}
              {isMyProfile && (
                <div className="cur-point">
                  {isSaved ? (
                    <div className="posts-list-title-active">
                      <SavedFocusIcon />
                      <span className="post-list-title-span-active">SAVED</span>
                    </div>
                  ) : (
                    <div className="posts-list-title" onClick={handleChangeSaved}>
                      <SavedIcon />
                      <span className="post-list-title-span">SAVED</span>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tabs Content Switching */}
            {isPosts && <PostsProfile />}
            
            {/* 🔥 Yahan changes kiye hain: userId pass kiya hai */}
            {isReels && <ReelsProfile userId={isMyProfile ? auth.user?._id : user.data?._id} />}
            
            {isSaved && <SavedPostsProfile />}
          </div>
        )}
        
      </div>
    </Helmet>
  );
};

export default Profile;