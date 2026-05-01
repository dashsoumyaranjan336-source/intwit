import React, { useState, useEffect } from "react";
import { FaComment, FaRetweet } from "react-icons/fa"; 
import { FiHeart, FiShare } from "react-icons/fi"; 
import { useDispatch, useSelector } from "react-redux";
import { setIsPostGlobalState, setPostModalId } from "../../redux/features/GlobalStateSlice";
import { AppDispatch, RootState } from "../../redux/store";
import PostsProfileSkeleton from "../skeleton/PostsProfileSkeleton";
import { Link } from "react-router-dom"; 

// 🔥 Mentions ko Blue aur Clickable banane wala function
const renderContentWithMentions = (text: string) => {
  if (!text) return "";
  return text.split(/(@[a-zA-Z0-9_.]+)/g).map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <Link 
          key={index} 
          to={`/${part.substring(1)}`} 
          style={{ color: "#00376b", fontWeight: "600", textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()} 
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};

const PostsProfile = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const { post, auth } = useSelector((state: RootState) => state);
  const { message } = post;
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (message === "post/get-user-post success") {
      setIsLoading(false);
    }
  }, [message]);

  const handlePostModal = (id: string) => {
    dispatch(setIsPostGlobalState());
    dispatch(setPostModalId(id));
  };

  const p: any = post;
  const rawPosts = p.userPosts || p.posts || p.data || [];
  
  // 🔥 YEH HAI ASLI JADUU: Yahan filter lagaya hai taaki VIDEOS yahan na dikhein!
  const allPosts = rawPosts.filter((val: any) => {
    if (!val.images || val.images.length === 0) return true; // Text post pass
    
    // Check karo kya file video hai? (Bohot simple check)
    const url = val.images[0].toLowerCase();
    const isVideo = url.includes(".mp4") || url.includes(".webm") || url.includes("video/upload");
    
    return !isVideo; // Agar video hai toh isko POSTS tab se uda do! (sirf normal photos bachengi)
  });

  return (
    <div className="posts-list-container" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
      {isLoading ? (
        <PostsProfileSkeleton />
      ) : allPosts && allPosts.length > 0 ? (
        <div className="profile-grid-system" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
          {allPosts.map((value: any) => {
            const isTextPost = !value.images || value.images.length === 0 || value.images[0] === "";

            if (isTextPost) {
              /* --- 🔥 TWITTER STYLE TEXT POST --- */
              return (
                <div
                  key={value._id}
                  onClick={() => handlePostModal(value._id)}
                  className="twitter-style-post cur-point"
                  style={{
                    gridColumn: '1 / -1',
                    borderBottom: '1px solid #efefef',
                    padding: '15px',
                    display: 'flex',
                    gap: '12px',
                    backgroundColor: '#fff',
                    textAlign: 'left'
                  }}
                >
                  <img 
                    src={value.user?.avatar || auth.user?.avatar} 
                    alt="user" 
                    style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} 
                  />
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', gap: '5px', alignItems: 'center' }}>
                      <span style={{ fontWeight: 'bold', fontSize: '14px' }}>{value.user?.fullname || auth.user?.fullname}</span>
                      <span style={{ color: '#536471', fontSize: '13px' }}>@{value.user?.username || auth.user?.username}</span>
                    </div>
                    <p style={{ marginTop: '5px', fontSize: '15px', color: '#0f1419', whiteSpace: 'pre-wrap' }}>
                      {renderContentWithMentions(value.content)}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'space-between', maxWidth: '300px', marginTop: '10px', color: '#536471' }}>
                       <div className="d-flex align-items-center gap-1"><FaComment size={14} /> {value.comments?.length}</div>
                       <div className="d-flex align-items-center gap-1"><FaRetweet size={16} /> 0</div>
                       <div className="d-flex align-items-center gap-1"><FiHeart size={16} /> {value.likes?.length}</div>
                       <div className="d-flex align-items-center gap-1"><FiShare size={16} /></div>
                    </div>
                  </div>
                </div>
              );
            }

            /* --- 📸 INSTAGRAM STYLE IMAGE POST (Yahan se video hata diya gaya hai) --- */
            return (
              <div
                className="explore-post-container cur-point"
                key={value._id}
                onClick={() => handlePostModal(value._id)}
                style={{ position: 'relative', aspectRatio: '1/1', overflow: 'hidden' }}
              >
                <div className="explore-post-image" style={{ width: '100%', height: '100%' }}>
                  <img 
                    src={value.images[0]} 
                    alt="Post" 
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                  />
                  {/* Music Icon overlay agar post mein music hai */}
                  {value.music && (
                    <div style={{ position: 'absolute', top: '10px', right: '10px', background: 'rgba(0,0,0,0.5)', borderRadius: '50%', padding: '5px', color: 'white' }}>
                      🎵
                    </div>
                  )}
                </div>
                
                <div className="like-comments-wrapper">
                  <div className="like-wrapper align-center">
                    <div className="like-icon absolute-center">
                      <FiHeart style={{ width: "85%", height: "85%", fill: "white" }} />
                    </div>
                    <div className="like-counts">{value.likes.length}</div>
                  </div>
                  <div className="comments-wrapper align-center">
                    <div className="comments-icon absolute-center ">
                      <FaComment style={{ width: "85%", height: "85%", fill: "white" }} />
                    </div>
                    <div className="commets-counts">{value.comments?.length}</div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-uppercase fs-4 mt-3">No Posts Yet</div>
      )}
    </div>
  );
};

export default PostsProfile;