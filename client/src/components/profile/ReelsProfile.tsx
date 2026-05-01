import React from "react";
import { FaComment } from "react-icons/fa";
import { FiHeart } from "react-icons/fi";
import { BiMoviePlay } from "react-icons/bi";
import { useDispatch, useSelector } from "react-redux";
import { setIsPostGlobalState, setPostModalId } from "../../redux/features/GlobalStateSlice";
import { AppDispatch, RootState } from "../../redux/store";

const ReelsProfile: React.FC = () => {
  const { post } = useSelector((state: RootState) => state);
  const dispatch: AppDispatch = useDispatch();

  const p: any = post;
  const rawPosts = p.userPosts || p.posts || p.data || [];
  
  // 🔥 MAGIC FILTER: Yeh sirf un posts ko uthayega jo Videos (Reels) hain!
  const userReels = rawPosts.filter((val: any) => {
    if (!val.images || val.images.length === 0) return false;
    
    // Check karo kya file video hai?
    const url = val.images[0].toLowerCase();
    const isVideo = url.includes(".mp4") || url.includes(".webm") || url.includes("video/upload");
    
    return isVideo; // Agar video hai toh Reels tab mein dikhao
  });

  const handlePostModal = (id: string) => {
    dispatch(setIsPostGlobalState());
    dispatch(setPostModalId(id));
  };

  return (
    <div className="posts-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {userReels.length > 0 ? (
        <div className="profile-grid-system" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {userReels.map((value: any) => (
            <div
              className="explore-post-container cur-point"
              key={value._id}
              onClick={() => handlePostModal(value._id)}
              style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}
            >
              <div className="explore-post-image" style={{ width: '100%', height: '100%' }}>
                <video 
                  src={value.images[0]} 
                  style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                  autoPlay muted loop playsInline
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
          ))}
        </div>
      ) : (
        <div className="text-uppercase fs-4 mt-3">NO REELS YET</div>
      )}
    </div>
  );
};

export default ReelsProfile;