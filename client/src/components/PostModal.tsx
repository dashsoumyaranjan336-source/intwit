import { useDispatch, useSelector } from "react-redux";
import {
  setCommentReply,
  setIsDeletePostGlobalState,
  setIsEditPostGlobalState,
  setIsPostGlobalState,
  setPostModalId,
} from "../redux/features/GlobalStateSlice";
import { AppDispatch, RootState } from "../redux/store";
import {
  CommentIcon,
  LikeIcon,
  SaveIcon,
  ShareIcon,
  UnlikeIcon,
  EmojiIcon,
  UpdateIcon,
  SaveActiveIcon,
} from "./Icons";

import React, { useState, useEffect, KeyboardEvent } from "react";
import { AiOutlineClose } from "react-icons/ai";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import { useFormik } from "formik";
import * as yup from "yup";

import { getAPost, likePost, unLikePost } from "../redux/features/postSlice";
import { createComment } from "../redux/features/commentSlice";
import Comment from "./postModal/Comment";
import {
  savePost,
  setFollowerUser,
  setUnFollowerUser,
  unSavePost,
} from "../redux/features/userSlice";
import { follow, unFollow } from "../redux/features/authSlice";
import {
  createNotification,
  deleteNotification,
} from "../redux/features/notificationSlice";
import {
  getTimesToWeekAgoAndGetTimesString,
  getTimesToWeekAgoString,
} from "../utils/Times";
import { Link } from "react-router-dom";

let schema = yup.object().shape({
  content: yup.string().required("Content is Required"),
});

// 🔥 HELPER FUNCTION: MENTIONS KO BLUE AUR CLICKABLE BANANE KE LIYE
const formatMentions = (text: string) => {
  if (!text) return null;
  const parts = text.split(/(@[a-zA-Z0-9_.]+)/g);
  return parts.map((part, index) => {
    if (part.match(/^@[a-zA-Z0-9_.]+/)) {
      return (
        <Link 
          to={`/${part.substring(1)}`} 
          key={index} 
          style={{ color: "#00376b", fontWeight: "600", textDecoration: "none" }}
          onClick={(e) => e.stopPropagation()}
        >
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const PostModal: React.FC = () => {
  const [like, setLike] = useState<boolean>(false);
  const [reply, setReply] = useState<string>("");
  const [emoji, setEmoji] = useState<boolean>(false);
  const [savedPost, setSavedPost] = useState<boolean>(false);

  const { globalState, auth, user, socket, post, comment } = useSelector((state: RootState) => state);
  const { isPostGlobalState, postModalId, commentReply } = globalState;

  const dispatch: AppDispatch = useDispatch();

  const filteredPost = post.data.find((value) => value._id === postModalId);
  const filteredComments = comment.data.filter(
    (value) => value.postId === filteredPost?._id
  );

  const postId = filteredPost ? filteredPost._id : "";

  // Check if it's a text-only post
  const isTextOnly = !filteredPost?.images || filteredPost?.images.length === 0 || filteredPost?.images[0] === "";

  useEffect(() => {
    if (filteredPost?.likes.find((value) => value === auth.user?._id)) {
      setLike(true);
    }
    return () => setLike(false);
  }, [dispatch, auth.user?._id, filteredPost, postId]);

  useEffect(() => {
    if (user.data?.saved.includes(postId)) {
      setSavedPost(true);
    }
    return () => setSavedPost(false);
  }, [dispatch, postId, user.data?.saved]);

  const handleLike = (id: string) => {
    if (like === false) {
      dispatch(likePost(id));
      const newPost = {
        ...filteredPost,
        likes: [...filteredPost!.likes, auth.user!._id],
      };
      dispatch(
        createNotification({
          id: filteredPost!._id,
          recipients: [filteredPost!.user._id],
          images: filteredPost!.images[0] || "",
          content: `liked your post`,
          url: `/${filteredPost!.user.username}/${filteredPost!._id}`,
          user: filteredPost!.user._id,
        })
      ).then((response) => {
        socket.data!.emit("createNotify", response.payload);
      });
      socket.data!.emit("likePost", newPost);
    } else {
      const newPost = {
        ...filteredPost,
        likes: filteredPost!.likes.filter((like) => like !== auth.user!._id),
      };
      socket.data!.emit("unLikePost", newPost);
      dispatch(unLikePost(id));
    }
    setLike(!like);
  };

  // 🔥 NAYA ADVANCED SHARE FUNCTION (Native Share + Fallback) 🔥
  const handleShare = async () => {
    if (!filteredPost) return;
    const postUrl = `${window.location.origin}/${filteredPost.user.username}/${filteredPost._id}`;
    
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Check out ${filteredPost.user.username}'s post on Intwit`,
          url: postUrl
        });
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = postUrl;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        alert("🔗 Post Link Copied! Ab kahin bhi paste kar de.");
      }
    } catch (err) {
      console.error("Share cancel ho gaya ya fail hua: ", err);
    }
  };

  const formik = useFormik({
    initialValues: { content: "" },
    validationSchema: schema,
    onSubmit: async (values) => {
      formik.resetForm();
      const commentData = commentReply ? { ...values, postId, reply } : { ...values, postId };
      
      await dispatch(createComment(commentData)).then((response) => {
        const newComment = response.payload;
        dispatch(
          createNotification({
            id: newComment._id,
            recipients: [filteredPost!.user._id],
            images: filteredPost!.images[0] || "",
            url: `/${filteredPost!.user.username}/${filteredPost!._id}`,
            content: commentReply ? `mentioned you in a comment` : `has commented on your post`,
            user: filteredPost!.user._id,
          })
        ).then((res) => {
          socket.data!.emit("createNotify", res.payload);
        });
        socket.data!.emit("createComment", newComment);
      });
      if(commentReply) dispatch(setCommentReply(""));
      dispatch(getAPost(postId));
    },
  });

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    formik.setFieldValue("content", formik.values.content + emojiData.emoji);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      formik.handleSubmit();
    }
  };

  const handleDeletePostModal = (id: string) => {
    dispatch(setIsDeletePostGlobalState());
    dispatch(setPostModalId(id));
  };

  const handleCloseModal = () => {
    dispatch(setIsPostGlobalState());
  };

  const handleFollow = (id: string) => {
    dispatch(follow(id)).then((response) => {
      socket.data!.emit("followUser", { ...response.payload, to: id });
      if (id === user.data!._id) dispatch(setFollowerUser(response.payload));
    });
  };

  const handleUnFollow = (id: string) => {
    dispatch(unFollow(id)).then((response) => {
      socket.data!.emit("unFollowUser", { ...response.payload, to: id });
      if (id === user.data!._id) dispatch(setUnFollowerUser(response.payload));
    });
  };

  // 🔥 MAGIC FIX: Modal ke liye bhi Music ka Dabba yahan khulega!
  let parsedMusic: any = null;
  if (filteredPost && (filteredPost as any).music) {
    try {
      parsedMusic = typeof (filteredPost as any).music === "string" 
        ? JSON.parse((filteredPost as any).music) 
        : (filteredPost as any).music;
    } catch (error) {
      console.log("Modal mein Music dabba kholne mein dikkat:", error);
    }
  }

  return (
    <div>
      {isPostGlobalState && filteredPost && (
        <div className="edit_profile">
          <button title="close" className="btn_close" onClick={handleCloseModal}>
            <AiOutlineClose style={{ width: "1.5rem", height: "1.5rem", fill: "white" }} />
          </button>
          
          <div 
            className="d-flex post-modal" 
            style={{ 
              width: isTextOnly ? '450px' : 'auto', 
              maxWidth: '95vw',
              height: isTextOnly ? 'auto' : '90vh',
              minHeight: isTextOnly ? '500px' : 'auto',
              backgroundColor: 'white',
              borderRadius: '8px',
              overflow: 'hidden'
            }}
          >
            
            {!isTextOnly && (
              <div className="post-modal-images" style={{ width: '65%', backgroundColor: 'black' }}>
                <Swiper
                  style={{ height: "95%", marginTop: "1.5rem" }}
                  navigation={true}
                  modules={[Navigation]}
                  className="mySwiper absolute-center"
                >
                  {filteredPost!.images.map((image, index) => (
                    <SwiperSlide key={index}>
                      {/* 🔥 FIXED: Modal ke andar Video vs Image ka check 🔥 */}
                      {image.match(/\.(mp4|webm|ogg|mov)$/i) || image.includes("video/upload") ? (
                        <video 
                          src={image} 
                          controls
                          autoPlay
                          loop
                          style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                      ) : (
                        <img src={image} alt={image} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                      )}
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>
            )}

            <div
              className="mt-0 bg-white position-relative d-flex flex-column"
              style={{
                width: isTextOnly ? "100%" : "35%",
                minWidth: isTextOnly ? "100%" : "400px",
                borderLeft: isTextOnly ? 'none' : '1px solid #dbdbdb'
              }}
            >
              <div className="p-3 d-flex align-items-center justify-content-between" style={{ borderBottom: "1px solid #dbdbdb" }}>
                <div className="d-flex align-items-center">
                  <Link to={`/${filteredPost!.user.username}`} onClick={handleCloseModal}>
                    <img className="user-image-wrapper home-post-avatar" src={filteredPost!.user.avatar} alt="avatar" />
                  </Link>
                  <Link to={`/${filteredPost!.user.username}`} onClick={handleCloseModal} className="post-modal-username home-post-text ms-3 mt-0">
                    {filteredPost!.user.username}
                  </Link>
                </div>
                
                <div className="dropdown cur-point">
                  <span data-bs-toggle="dropdown" onClick={() => dispatch(setPostModalId(filteredPost._id))}>
                    <UpdateIcon className="home-post-icon-update" />
                  </span>
                  <ul className="dropdown-menu dropdown-menu-end">
                    {filteredPost.user.username === auth.user!.username ? (
                      <>
                        <li><div style={{ fontWeight: 700, color: "#ed4956" }} className="dropdown-item" onClick={() => handleDeletePostModal(filteredPost._id)}>Delete</div></li>
                        <li><div className="dropdown-item" onClick={() => dispatch(setIsEditPostGlobalState())}>Edit</div></li>
                      </>
                    ) : (
                      <li>
                        {auth.user!.following.some(f => f._id === filteredPost.user._id) ? 
                          <div className="dropdown-item" style={{ fontWeight: 700, color: "#ed4956" }} onClick={() => handleUnFollow(filteredPost.user._id)}>Unfollow</div> :
                          <div className="dropdown-item" onClick={() => handleFollow(filteredPost.user._id)}>Follow</div>
                        }
                      </li>
                    )}
                    <li><div className="dropdown-item">Cancel</div></li>
                  </ul>
                </div>
              </div>

              <div className="flex-grow-1 p-3 post-modal-post" style={{ overflowY: 'auto', maxHeight: isTextOnly ? '400px' : 'none' }}>
                <div className="d-flex mb-3">
                  <Link to={`/${filteredPost!.user.username}`} onClick={handleCloseModal}>
                    <img className="user-image-wrapper home-post-avatar" src={filteredPost!.user.avatar} alt="avatar" />
                  </Link>
                  <div className="ms-3 w-100">
                    <Link to={`/${filteredPost!.user.username}`} onClick={handleCloseModal} className="post-modal-username home-post-text">
                      {filteredPost!.user.username}
                    </Link>{" "}
                    
                    {/* 🔥 FIX: CAPTION MEIN BLUE MENTIONS YAHAN RENDER HONGE 🔥 */}
                    <span style={{ whiteSpace: 'pre-wrap' }}>
                      {formatMentions(filteredPost!.content)}
                    </span>

                    {/* 🔥 MAGIC FIX: Ab player Modal mein bhi bajeyga! 🔥 */}
                    {parsedMusic && parsedMusic.url && (
                      <div className="mt-3 mb-2 pe-3 w-100">
                        <audio controls src={parsedMusic.url} style={{ width: '100%', height: '35px', borderRadius: '20px' }} />
                        {parsedMusic.name && (
                          <div style={{ fontSize: '11px', color: 'gray', marginTop: '2px', fontWeight: 'bold' }}>
                            🎵 {parsedMusic.name}
                          </div>
                        )}
                      </div>
                    )}
                    
                    <div className="time mt-1">{getTimesToWeekAgoString(filteredPost!.createdAt)}</div>
                  </div>
                </div>
                {filteredComments!.map((comment) => (
                  <Comment cmt={comment} key={comment._id} />
                ))}
              </div>

              {/* Actions Footer */}
              <div className="p-3 bg-white" style={{ borderTop: "1px solid #dbdbdb" }}>
                <div className="d-flex align-items-center mb-2">
                  <span onClick={() => handleLike(filteredPost!._id)} className="cur-point">
                    {like ? <UnlikeIcon className="home-post-icon-unlike me-3" /> : <LikeIcon className="home-post-icon me-3" />}
                  </span>
                  <div onClick={handleCloseModal} className="cur-point">
                    <CommentIcon className="home-post-icon me-3" />
                  </div>
                  
                  {/* 🔥 ADVANCED SHARE BUTTON 🔥 */}
                  <div onClick={handleShare} className="cur-point" title="Share Post">
                    <ShareIcon className="home-post-icon me-3" />
                  </div>
                  
                  <div className="ms-auto">
                    {savedPost ? (
                      <div className="cur-point" onClick={() => dispatch(unSavePost(postId))}>
                        <SaveActiveIcon className="home-post-icon-unlike" />
                      </div>
                    ) : (
                      <div className="cur-point" onClick={() => dispatch(savePost(postId))}>
                        <SaveIcon className="home-post-icon" />
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="home-post-text mb-1" style={{ fontWeight: '600' }}>{filteredPost!.likes.length} likes</div>
                <div className="time">{getTimesToWeekAgoAndGetTimesString(filteredPost!.createdAt)}</div>
              </div>

              <form onKeyDown={handleKeyDown} onSubmit={formik.handleSubmit} className="p-3 d-flex align-items-center bg-white" style={{ borderTop: '1px solid #efefef' }}>
                <div onClick={() => setEmoji(!emoji)} style={{ cursor: "pointer", position: 'relative' }}>
                  {emoji && (
                    <div style={{ position: 'absolute', bottom: '40px', left: '0', zIndex: 100 }}>
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                  <EmojiIcon />
                </div>
                <textarea
                  className="form-control border-0 ms-2"
                  style={{ fontSize: "0.9rem", boxShadow: 'none', resize: 'none', height: '30px' }}
                  placeholder="Add a comment..."
                  value={formik.values.content}
                  onChange={formik.handleChange("content")}
                />
                <button type="submit" className={formik.values.content.length > 0 ? "post-modal-btn" : "post-modal-btn-disabled"} disabled={!formik.values.content}>
                  Post
                </button>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostModal;