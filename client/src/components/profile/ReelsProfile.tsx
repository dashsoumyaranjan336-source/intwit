import React, { useState, useEffect } from "react";
import { FaComment } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { BiMoviePlay } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { setIsPostGlobalState, setPostModalId } from "../../redux/features/GlobalStateSlice";
import { AppDispatch, RootState } from "../../redux/store";
import PostsProfileSkeleton from "../skeleton/PostsProfileSkeleton";

interface ReelsProfileProps {
  userId?: string;
}

const ReelsProfile: React.FC<ReelsProfileProps> = ({ userId }) => {
  const [userReels, setUserReels] = useState<any[]>([]);
  
  // 🔴 FIX 1: Loading tab tak start mat karo jab tak data fetch karna shuru na ho
  const [isLoading, setIsLoading] = useState<boolean>(false);
  
  const { auth } = useSelector((state: RootState) => state);
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    const fetchUserReels = async () => {
      if (!userId) return; // Agar profile ID nahi mili toh ruk jao
      
      setIsLoading(true); // Fetch shuru hone par loading ON
      try {
        const token = (auth as any)?.token || (auth as any)?.user?.token || localStorage.getItem("token");
        
        const res = await fetch('/api/reels', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await res.json();
        
        if (data.reels) {
          const filteredReels = data.reels.filter((reel: any) => 
            String(reel.user?._id) === String(userId) || String(reel.user) === String(userId)
          );
          setUserReels(filteredReels);
        } else {
          setUserReels([]);
        }
      } catch (err) {
        console.log("Fetch Error:", err);
      } finally {
        setIsLoading(false); // 🔴 FIX 2: Har haal mein loading OFF karo (Chahe success ho ya error)
      }
    };

    fetchUserReels();
  }, [userId, auth]);

  const handlePostModal = (id: string) => {
    dispatch(setIsPostGlobalState());
    dispatch(setPostModalId(id));
  };

  if (isLoading) {
    return <div className="posts-list-container"><PostsProfileSkeleton /></div>;
  }

  return (
    <div className="posts-list-container">
      {userReels.length > 0 ? (
        userReels.map((value) => (
          <div
            className="explore-post-container cur-point"
            key={value._id}
            onClick={() => handlePostModal(value._id)}
          >
            <div className="explore-post-image" style={{ position: "relative" }}>
              
              {/* 🔴 FIX 3: Tumhare Database Schema ke hisaab se 'videoUrl' use kiya hai */}
              <video 
                src={value.videoUrl} 
                style={{ width: "100%", height: "100%", objectFit: "cover" }} 
              />
              
              {/* Top right par mast sa Reel Icon */}
              <BiMoviePlay 
                style={{ 
                  position: "absolute", top: "10px", right: "10px", 
                  color: "white", fontSize: "24px", zIndex: 10 
                }} 
              />
            </div>
            
            {/* Hover UI for Likes and Comments */}
            <div className="like-comments-wrapper ">
              <div className="like-wrapper align-center">
                <div className="like-icon absolute-center">
                  <FiHeart style={{ width: "85%", height: "85%", fill: "white" }} />
                </div>
                <div className="like-counts">{value.likes?.length || 0}</div>
              </div>
              <div className="comments-wrapper align-center">
                <div className="comments-icon absolute-center ">
                  <FaComment style={{ width: "85%", height: "85%", fill: "white" }} />
                </div>
                <div className="commets-counts">{value.comments?.length || 0}</div>
              </div>
            </div>
          </div>
        ))
      ) : (
        <div className="text-uppercase fs-4 mt-3">No Reels Yet</div>
      )}
    </div>
  );
};

export default ReelsProfile;