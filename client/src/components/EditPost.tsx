import React, { useEffect, useState, useRef } from "react";
import { AiOutlineClose } from "react-icons/ai";
import { useDispatch, useSelector } from "react-redux";
import { setIsEditPostGlobalState } from "../redux/features/GlobalStateSlice";
import { updatePost } from "../redux/features/postSlice";
import { AppDispatch, RootState } from "../redux/store";
import { EmojiIcon } from "./Icons";

import { useFormik } from "formik";
import * as yup from "yup";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

let schema = yup.object().shape({
  content: yup.string().required("Content is Required"),
});

const EditPost: React.FC = () => {
  const [emoji, setEmoji] = useState<boolean>(false);
  const [idP, setIdP] = useState<string>("");

  // Mentions States
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);

  const { auth, post, socket, globalState } = useSelector((state: RootState) => state);
  const dispatch: AppDispatch = useDispatch();
  const { isEditPostGlobalState, postModalId } = globalState;

  const filteredPost = post.data.find((value) => value._id === postModalId);

  // Users list for mentions (Followers + Following)
  useEffect(() => {
    if (auth.user) {
      const combined = [...(auth.user.followers || []), ...(auth.user.following || [])];
      const uniqueUsers = Array.from(new Set(combined.map(a => a.username)))
        .map(username => combined.find(a => a.username === username));
      setMentionUsers(uniqueUsers);
    }
  }, [auth.user]);

  const formik = useFormik({
    initialValues: { content: "" },
    validationSchema: schema,
    onSubmit: (values) => {
      const formData = { ...values, id: idP };
      dispatch(updatePost(formData)).then((response) => {
        const updatedData = response.payload;
        socket.data?.emit("updatePost", updatedData);
      });
      dispatch(setIsEditPostGlobalState());
    },
  });

  // Fix: Infinite loop prevention
  useEffect(() => {
    if (filteredPost && filteredPost._id !== idP) {
      formik.setFieldValue("content", filteredPost.content || "");
      setIdP(filteredPost._id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filteredPost?._id, filteredPost?.content]);

  // Fix: Regex updated to support mentions right after emojis
  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    formik.setFieldValue("content", value);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    
    // Naya Regex: Jo kisi bhi character (emoji included) ke baad @ detect karega
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_.]*)$/);

    if (match) {
      setShowMentionDropdown(true);
      setMentionQuery(match[1].toLowerCase());
    } else {
      setShowMentionDropdown(false);
    }
  };

  const handleMentionSelect = (username: string) => {
    const content = formik.values.content;
    const cursorPosition = textAreaRef.current?.selectionStart || 0;
    const textBeforeCursor = content.substring(0, cursorPosition);
    const textAfterCursor = content.substring(cursorPosition);
    
    const match = textBeforeCursor.match(/@([a-zA-Z0-9_.]*)$/);
    if (match) {
       const replaceLength = match[0].length;
       const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.length - replaceLength) + `@${username} `;
       formik.setFieldValue("content", newTextBefore + textAfterCursor);
    }
    setShowMentionDropdown(false);
    setTimeout(() => textAreaRef.current?.focus(), 0);
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    formik.setFieldValue("content", formik.values.content + emojiData.emoji);
  };

  const handleCloseModal = () => {
    dispatch(setIsEditPostGlobalState());
    formik.resetForm();
    setIdP("");
    setShowMentionDropdown(false);
  };

  const filteredUsersList = mentionUsers.filter(u => u?.username?.toLowerCase().includes(mentionQuery));

  return (
    <>
      {isEditPostGlobalState && filteredPost && (
        <div className="edit_profile absolute-center">
          <button title="close" className="btn_close" onClick={handleCloseModal}>
            <AiOutlineClose style={{ width: "1.5rem", height: "1.5rem", fill: "white" }} />
          </button>

          <form
            onSubmit={formik.handleSubmit}
            className="flex-column"
            style={{
              maxWidth: "60%", maxHeight: "80%", height: "100%", width: "100%",
              backgroundColor: "white", paddingTop: "1rem", borderRadius: "0.5rem", margin: "6rem auto",
            }}
          >
            <div className="absolute-center" style={{ padding: "0 1rem 0.5rem 1rem", borderBottom: "1px solid #dbdbdb" }}>
              <span className="post-modal-btn-cancel" onClick={handleCloseModal} style={{cursor: 'pointer'}}>Cancel</span>
              <span className="absolute-center w-100" style={{ fontWeight: "600" }}>Edit info</span>
              <button type="submit" className="post-btn">Done</button>
            </div>

            <div className="d-flex w-100 h-100 " style={{overflow: 'hidden'}}>
              <div style={{ width: "66%", backgroundColor: "#000" }} className="absolute-center">
                <Swiper navigation={true} modules={[Navigation]} className="mySwiper w-100">
                  {filteredPost.images.map((image, index) => (
                    <SwiperSlide key={index}>
                      <img src={image} alt="post" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                    </SwiperSlide>
                  ))}
                </Swiper>
              </div>

              <div className="px-3 pt-3 d-flex flex-column" style={{ width: "34%", backgroundColor: "white", position: "relative" }}>
                <div className="d-flex mb-3 align-items-center">
                  <div className="user-image-wrapper">
                    <img src={auth.user?.avatar} alt="user" style={{width: '32px', height: '32px', borderRadius: '50%'}} />
                  </div>
                  <span className="ms-2" style={{ fontSize: "0.9rem", fontWeight: "600" }}>
                    {auth.user?.username}
                  </span>
                </div>

                <div style={{ position: 'relative', flexGrow: 1 }}>
                  {/* Dropdown UI */}
                  {showMentionDropdown && filteredUsersList.length > 0 && (
                    <div className="mention-dropdown shadow" style={{ position: 'absolute', top: '0', left: '0', backgroundColor: '#fff', border: '1px solid #dbdbdb', borderRadius: '8px', zIndex: 1000, width: '100%', maxHeight: '150px', overflowY: 'auto' }}>
                      {filteredUsersList.map((u, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => handleMentionSelect(u.username)}
                          style={{ padding: '8px 12px', cursor: 'pointer', borderBottom: '1px solid #efefef' }}
                        >
                          <strong>@{u.username}</strong>
                        </div>
                      ))}
                    </div>
                  )}

                  <textarea
                    ref={textAreaRef}
                    maxLength={2200}
                    className="w-100 h-100"
                    name="content"
                    style={{ resize: "none", border: "none", outline: "none" }}
                    placeholder="Write a caption..."
                    value={formik.values.content}
                    onChange={handleContentChange} 
                  />
                </div>

                <div className="border-top pt-2 pb-2" style={{ position: "relative" }}>
                  <span style={{ cursor: "pointer" }} onClick={() => setEmoji(!emoji)}>
                    <EmojiIcon />
                  </span>
                  {emoji && (
                    <div style={{ position: "absolute", bottom: "40px", left: "0", zIndex: 50 }}>
                      <EmojiPicker onEmojiClick={handleEmojiClick} />
                    </div>
                  )}
                  <span className="float-end text-muted" style={{fontSize: '12px'}}>
                    {formik.values.content.length}/2200
                  </span>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default EditPost;