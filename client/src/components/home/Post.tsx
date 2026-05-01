import { useState, useEffect, KeyboardEvent } from "react";
import {
  CommentIcon,
  EmojiIcon,
  LikeCommentIcon,
  LikeIcon,
  SaveActiveIcon,
  SaveIcon,
  ShareIcon,
  UnlikeCommentIcon,
  UnlikeIcon,
  UpdateIcon,
} from "../Icons";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useFormik } from "formik";
import * as yup from "yup";
import { getPost, likePost, unLikePost } from "../../redux/features/postSlice";
import { AppDispatch, RootState } from "../../redux/store";
import { useDispatch, useSelector } from "react-redux";
import {
  createComment,
  getComments,
  likeComment,
  unLikeComment,
} from "../../redux/features/commentSlice";
import {
  setIsDeletePostGlobalState,
  setIsEditPostGlobalState,
  setIsPostGlobalState,
  setPostModalId,
} from "../../redux/features/GlobalStateSlice";
import { savePost, unSavePost } from "../../redux/features/userSlice";
import { follow, unFollow } from "../../redux/features/authSlice";
import { Link } from "react-router-dom";
import {
  createNotification,
  deleteNotification,
} from "../../redux/features/notificationSlice";
import { getTimesToWeekAgoString } from "../../utils/Times";
import { PostProps } from "../../utils/interface";

let schema = yup.object().shape({
  content: yup.string().required("Content is Required"),
});

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
        >
          {part}
        </Link>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

const Post: React.FC<PostProps> = ({ post }) => {
  const [emoji, setEmoji] = useState<boolean>(false);
  const [like, setLike] = useState<boolean>(false);
  const [likeCmt, setLikeCmt] = useState<boolean>(false);
  const [savedPost, setSavedPost] = useState<boolean>(false);

  // 🔥 ADDED: Modal State
  const [showShareModal, setShowShareModal] = useState<boolean>(false);

  const [postId, setPostId] = useState<string>(post._id);

  const { auth } = useSelector((state: RootState) => state);
  const { socket } = useSelector((state: RootState) => state);
  const { user } = useSelector((state: RootState) => state);
  const { comment } = useSelector((state: RootState) => state);

  const dispatch: AppDispatch = useDispatch();
  const filteredComments = comment.data.filter(
    (value) => value.postId === post._id
  );
  const lastComment = filteredComments.filter((value) => !value.reply).pop();

  const formik = useFormik({
    initialValues: {
      content: "",
    },
    validationSchema: schema,
    onSubmit: async (values) => {
      formik.resetForm();
      await dispatch(createComment({ ...values, postId })).then((response) => {
        const newComment = response.payload;
        dispatch(
          createNotification({
            id: newComment._id,
            recipients: [post.user._id],
            images: post.images[0],
            url: `/${post.user.username}/${post._id}`,
            content: `has commented on your post`,
            user: post.user._id,
          })
        ).then((response) => {
          socket.data!.emit("createNotify", response.payload);
        });

        socket.data!.emit("createComment", newComment);
      });
    },
  });

  const handleEmojiClick = (emojiData: EmojiClickData, event: MouseEvent) => {
    formik.setFieldValue("content", formik.values.content + emojiData.emoji);
  };

  useEffect(() => {
    if (post.likes.find((_id) => _id === auth.user?._id)) {
      setLike(true);
    }
    return () => setLike(false);
  }, [dispatch, auth.user?._id, post.likes]);

  useEffect(() => {
    if (user.data?.saved.includes(post._id)) {
      setSavedPost(true);
    }
    return () => setSavedPost(false);
  }, [dispatch, post._id, user.data?.saved]);

  const handleLikeComment = (id: string) => {
    if (likeCmt === false) {
      dispatch(likeComment(id));
      dispatch(
        createNotification({
          id: lastComment!._id,
          recipients: [lastComment!.user._id],
          images: post.images[0],
          content: `liked your comment on the post`,
          url: `/${post.user!.username}/${post!._id}`,
          user: post.user!._id,
        })
      ).then((response) => {
        socket.data!.emit("createNotify", response.payload);
      });
    } else {
      dispatch(unLikeComment(id));
      dispatch(deleteNotification(lastComment!._id)).then((response) => {
        socket.data!.emit("deleteNotify", response.payload);
      });
    }
    setLikeCmt(!likeCmt);
  };

  const handleLike = () => {
    if (like === false) {
      dispatch(likePost(post._id));
      dispatch(
        createNotification({
          id: post._id,
          recipients: [post.user._id],
          images: post.images[0],
          url: `/${post.user.username}/${post._id}`,
          content: `liked your post`,
          user: post.user._id,
        })
      ).then((response) => {
        socket.data!.emit("createNotify", response.payload);
      });

      const newPost = { ...post, likes: [...post.likes, auth.user!._id] };
      socket.data!.emit("likePost", newPost);
    } else {
      dispatch(unLikePost(post._id));
      dispatch(deleteNotification(post._id)).then((response) => {
        socket.data!.emit("deleteNotify", response.payload);
      });
      const newPost = {
        ...post,
        likes: post.likes.filter((like) => like !== auth.user!._id),
      };
      socket.data!.emit("unLikePost", newPost);
    }
    setLike(!like);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLFormElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      formik.handleSubmit();
    }
  };

  const handlePostModal = (id: string) => {
    dispatch(setIsPostGlobalState());
    dispatch(setPostModalId(id));
    dispatch(getPost());
  };

  const handleDeletePostModal = (id: string) => {
    dispatch(setIsDeletePostGlobalState());
    dispatch(setPostModalId(id));
  };

  useEffect(() => {
    if (lastComment?.likes.find((_id: string) => _id === auth.user?._id)) {
      setLikeCmt(true);
    }
    return () => setLikeCmt(false);
  }, [auth.user?._id, lastComment]);

  const handleFollow = () => {
    const id = post.user._id;
    dispatch(follow(id)).then((response) => {
      socket.data!.emit("followUser", {
        _id: response.payload._id,
        username: response.payload.username,
        fullname: response.payload.fullname,
        avatar: response.payload.avatar,
        followers: response.payload.followers,
        following: response.payload.following,
        to: id,
      });
    });
    dispatch(
      createNotification({
        id: id,
        recipients: [id],
        images: "",
        content: `has started to follow you.`,
        url: "",
        user: auth.user!._id,
      })
    ).then((response) => {
      socket.data!.emit("createNotify", response.payload);
    });
  };

  const handleUnFollow = () => {
    const id = post.user._id;
    dispatch(unFollow(id)).then((response) => {
      socket.data!.emit("unFollowUser", {
        _id: response.payload._id,
        username: response.payload.username,
        fullname: response.payload.fullname,
        avatar: response.payload.avatar,
        followers: response.payload.followers,
        following: response.payload.following,
        to: id,
      });
    });
    dispatch(deleteNotification(id)).then((response) => {
      socket.data!.emit("deleteNotify", response.payload);
    });
  };

  const handleSendToUser = (username: string) => {
    alert(`✅ Sent to @${username}`);
    setShowShareModal(false);
  };

  // 🔥 MAGIC FIX: Music ka Dabba yahan khulega!
  let parsedMusic: any = null;
  if ((post as any).music) {
    try {
      parsedMusic = typeof (post as any).music === "string" 
        ? JSON.parse((post as any).music) 
        : (post as any).music;
    } catch (error) {
      console.log("Music dabba kholne mein dikkat:", error);
    }
  }

  return (
    <div className="mb-4" style={{ borderBottom: "1px solid #dbdbdb", position: "relative" }}>
      
      {/* 🔥 ADDED: INSTA SHARE MODAL 🔥 */}
      {showShareModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "rgba(0,0,0,0.6)", zIndex: 9999, display: "flex", justifyContent: "center", alignItems: "center" }} onClick={() => setShowShareModal(false)}>
          <div style={{ background: "white", width: "90%", maxWidth: "400px", borderRadius: "15px", padding: "20px" }} onClick={e => e.stopPropagation()}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "15px", borderBottom: "1px solid #eee", paddingBottom: "10px" }}>
              <h6 style={{ margin: 0, fontWeight: "bold" }}>Share</h6>
              <span onClick={() => setShowShareModal(false)} style={{ cursor: "pointer", fontSize: "20px" }}>&times;</span>
            </div>
            <div style={{ overflowY: "auto", maxHeight: "250px" }}>
              {auth.user?.following.map((f: any) => (
                <div key={f._id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <img src={f.avatar} style={{ width: "38px", height: "38px", borderRadius: "50%", objectFit: "cover" }} alt="dp" />
                    <span style={{ fontSize: "14px", fontWeight: "600" }}>{f.username}</span>
                  </div>
                  <button onClick={() => handleSendToUser(f.username)} style={{ background: "#0095f6", color: "white", border: "none", padding: "6px 15px", borderRadius: "6px", fontSize: "12px", fontWeight: "bold" }}>Send</button>
                </div>
              ))}
            </div>
            {/* 🔥 ADDED: REPOST BUTTON 🔥 */}
            <button 
              onClick={() => alert("Added to Story / Reposted! 🔄")}
              style={{ width: "100%", marginTop: "15px", padding: "12px", background: "#3a3a3a", color: "white", border: "none", borderRadius: "10px", fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}
            >
              🔄 Add to Story / Repost
            </button>
          </div>
        </div>
      )}

      <div className="d-flex mb-3 position-relative">
        <Link to={`/${post.user.username}`} className="d-flex">
          <div className="user-image-wrapper absolute-center home-post-avatar">
            <img src={post.user.avatar} alt={post.user.username} />
          </div>
          <span className="home-post-text post-modal-username absolute-center ms-3">
            {post.user.username}
          </span>
        </Link>
        <div className="d-flex absolute-center">
          <div className="ms-2 mb-1 me-2">•</div>
          <div className="time mb-1">
            {getTimesToWeekAgoString(post.createdAt)}
          </div>
        </div>
        <div
          className="dropdown cur-point position-absolute mt-1"
          style={{ right: 0 }}
        >
          <span
            data-bs-toggle="dropdown"
            aria-expanded="false"
            onClick={() => dispatch(setPostModalId(post._id))}
          >
            <UpdateIcon className="home-post-icon-update" />
          </span>

          <ul className="dropdown-menu " aria-labelledby="dropdownMenuLink">
            {post.user.username === auth.user!.username ? (
              <>
                <li>
                  <div
                    style={{ fontWeight: 700, color: "#ed4956" }}
                    className="dropdown-item"
                    onClick={() => handleDeletePostModal(post._id)}
                  >
                    Delete
                  </div>
                </li>
                <li>
                  <div
                    className="dropdown-item"
                    onClick={() => dispatch(setIsEditPostGlobalState())}
                  >
                    Edit
                  </div>
                </li>
              </>
            ) : (
              <>
                {auth.user!.following.find(
                  (obj) => obj._id === post.user._id
                ) ? (
                  <li>
                    <div
                      className="dropdown-item"
                      style={{ fontWeight: 700, color: "#ed4956" }}
                      onClick={() => handleUnFollow()}
                    >
                      Unfollow
                    </div>
                  </li>
                ) : (
                  <li>
                    <div
                      className="dropdown-item"
                      style={{ fontWeight: 700, color: "#ed4956" }}
                      onClick={() => handleFollow()}
                    >
                      Follow
                    </div>
                  </li>
                )}
              </>
            )}
            <li>
              <div className="dropdown-item">Cancel</div>
            </li>
          </ul>
        </div>
      </div>

      {/* 🔥 FIXED: Yahan Image aur Video dono ka support add kiya gaya hai */}
      {post.images && post.images.length > 0 && (
        <div>
          <Swiper
            navigation={true}
            modules={[Navigation]}
            className="mySwiper absolute-center"
            style={{ borderRight: "1px solid #dbdbdb", backgroundColor: "#000" }}
          >
            {post.images.map((url, index) => (
              <SwiperSlide key={index}>
                {/* Check kar rahe hain ki URL video hai ya image */}
                {url.match(/\.(mp4|webm|ogg|mov)$/i) || url.includes("video/upload") ? (
                  <video 
                    src={url} 
                    className="w-100 h-100" 
                    controls 
                    autoPlay 
                    loop
                    muted={false}
                    style={{ objectFit: "contain", maxHeight: "585px" }}
                  />
                ) : (
                  <img src={url} alt={`post-img-${index}`} style={{ objectFit: "contain" }} />
                )}
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      )}

      {/* 🔥 MAGIC FIX: Ab player directly 'url' bajayega */}
      {parsedMusic && parsedMusic.url && (
        <div className="mt-2 mb-2 px-3">
          <audio controls src={parsedMusic.url} className="w-100" style={{ height: '35px', borderRadius: '20px' }} />
          {/* Gaane ka naam bhi dikha dete hain */}
          {parsedMusic.name && (
            <div style={{ fontSize: '11px', color: 'gray', marginTop: '4px', marginLeft: '5px', fontWeight: 'bold' }}>
              🎵 {parsedMusic.name}
            </div>
          )}
        </div>
      )}

      <div className="d-flex position-relative mt-2">
        <span onClick={handleLike} className="cur-point">
          {like ? (
            <UnlikeIcon className="home-post-icon-unlike me-3" />
          ) : (
            <LikeIcon className="home-post-icon me-3" />
          )}
        </span>
        <div onClick={() => handlePostModal(post._id)} className="cur-point">
          <CommentIcon className="home-post-icon me-3" />
        </div>
        
        {/* 🔥 FIX: CLICK OPENS THE MODAL NOW */}
        <div onClick={() => setShowShareModal(true)} className="cur-point">
            <ShareIcon className="home-post-icon me-3" />
        </div>

        <div onClick={() => setSavedPost(!savedPost)} className="cur-point">
          {savedPost ? (
            <div onClick={() => dispatch(unSavePost(post._id))}>
              <SaveActiveIcon className="home-post-icon-unlike home-post-icon-save" />
            </div>
          ) : (
            <div onClick={() => dispatch(savePost(post._id))}>
              <SaveIcon className="home-post-icon home-post-icon-save" />
            </div>
          )}
        </div>
      </div>
      
      <div className="mt-3 home-post-text">{post.likes.length} likes</div>

      <div className="mt-2 text-break">
        <Link to={`/${post.user.username}`} className="home-post-text mt-2 me-1">
          {post.user.username}
        </Link>
        {formatMentions(post.content)}
      </div>

      {lastComment && (
        <div className="mt-2" key={lastComment._id}>
          {filteredComments.length > 1 ? (
            <div
              className="mb-1 home-post-quantity-comment"
              onClick={() => handlePostModal(post._id)}
            >
              View all <span>{filteredComments.length}</span> comments
            </div>
          ) : null}
          <div className="home-post-comment">
            <Link
              to={`/${lastComment.user.username}`}
              className="home-post-text mt-2 me-1"
            >
              {lastComment.user.username}
            </Link>
            {formatMentions(lastComment.content)}
            <span
              className="home-post-comment-icon"
              onClick={() => handleLikeComment(lastComment._id)}
            >
              {likeCmt ? (
                <UnlikeCommentIcon className="home-post-icon-unlike me-3" />
              ) : (
                <LikeCommentIcon className="home-post-icon me-3" />
              )}
            </span>
          </div>
        </div>
      )}

      <form onKeyDown={handleKeyDown} className="w-100 d-flex">
        <textarea
          className="mt-3 mb-3 w-100"
          style={{ fontSize: "0.9rem", lineHeight: "1.1rem" }}
          placeholder="Add a comment..."
          value={formik.values.content}
          onChange={formik.handleChange("content")}
        />

        <div style={{ position: "relative" }}>
          <span className="home-post-emoji" onClick={() => setEmoji(!emoji)}>
            <EmojiIcon />
            {emoji ? (
              <div className="home-post-emoji-table">
                <EmojiPicker onEmojiClick={handleEmojiClick} />
              </div>
            ) : null}
          </span>
        </div>
      </form>
    </div>
  );
};

export default Post;