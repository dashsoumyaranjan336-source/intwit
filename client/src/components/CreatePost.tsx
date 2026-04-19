import { useState, useEffect, useRef, createRef } from "react";
import { AiOutlineCamera, AiOutlineClose } from "react-icons/ai";
import { useFormik } from "formik";
import * as yup from "yup";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper";
import "swiper/css";
import "swiper/css/navigation";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import { useDispatch, useSelector } from "react-redux";

import { AppDispatch, RootState } from "../redux/store";
import { setIsUploadGlobalState } from "../redux/features/GlobalStateSlice";
import { EmojiIcon, UploadImg } from "./Icons";
import { deleteImgPost, uploadImgPost } from "../redux/features/uploadImgSlice";
import { createPost } from "../redux/features/postSlice";
import { createNotification } from "../redux/features/notificationSlice";
import Load from "../images/loading.gif";
import { setCreatePost } from "../redux/features/authSlice";

let schema = yup.object().shape({
  content: yup.string(),
});

const CreatePost: React.FC = () => {
  const { auth, upload, socket, globalState } = useSelector((state: RootState) => state);
  const { message } = upload;
  const { isUploadGlobalState } = globalState;
  
  const dispatch: AppDispatch = useDispatch();
  const ref = createRef<HTMLInputElement>();
  const musicRef = createRef<HTMLInputElement>(); 
  const videoRef = useRef<HTMLVideoElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);

  // 🔥 TYPESCRIPT ERROR FIX (added any[])
  useEffect(() => {
    if (auth.user) {
      let combined: any[] = [...(auth.user.followers || []), ...(auth.user.following || [])];
      
      if (combined.length === 0) {
        combined = [{ username: "karan" }, { username: "rakesh" }, { username: "sourav" }];
      }
      
      const uniqueUsers = Array.from(new Set(combined.map(a => a.username)))
        .map(username => combined.find(a => a.username === username));
      
      setMentionUsers(uniqueUsers);
    }
  }, [auth.user]);

  const handleClick = () => ref.current?.click();

  const [images, setImages] = useState<string[]>([]);
  const [music, setMusic] = useState<File | null>(null); 
  const [emoji, setEmoji] = useState<boolean>(false);
  const [tracks, setTracks] = useState<MediaStreamTrack | null>(null);
  const [stream, setStream] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (message === "upload/upload-images-post pedding") setLoading(true);
  }, [message]);

  useEffect(() => {
    if (upload.images[0] !== undefined && message === "upload/upload-images-post success") {
      const urls = upload.images.map((image) => image.url);
      setImages(urls);
    }
  }, [upload.images, message]);

  const uploadImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList: FileList = e.target.files!;
    const filesArray: File[] = Array.from(fileList);
    dispatch(uploadImgPost(filesArray)).then((response) => {
      if (response.payload) setLoading(false);
    });
  };

  const handleMusicUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setMusic(e.target.files[0]);
    }
  };

  const formik = useFormik({
    initialValues: { content: "" },
    validationSchema: schema,
    onSubmit: (values) => {
      const rawMentions = values.content.match(/@([a-zA-Z0-9_.]+)/g) || [];
      const mentions = rawMentions.map(m => m.substring(1)); 

      dispatch(createPost({ ...values, images, music, mentions })).then((response) => {
        const newPost = response.payload;
        if(newPost) {
          dispatch(setCreatePost(newPost._id));
          dispatch(
            createNotification({
              id: newPost._id,
              recipients: [...newPost.user.followers],
              images: newPost.images[0] || "", 
              url: `/${newPost.user.username}/${newPost._id}`,
              content: `posted: "${newPost.content.slice(0, 20)}..."`,
              user: newPost.user._id,
            })
          ).then((response) => {
            socket.data!.emit("createNotify", response.payload);
          });
        }
      });

      if (stream) handleStopStream();
      dispatch(setIsUploadGlobalState());
      formik.resetForm();
      setImages([]);
      setMusic(null); 
    },
  });

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    formik.handleChange("content")(e);

    const cursorPosition = e.target.selectionStart;
    const textBeforeCursor = value.substring(0, cursorPosition);
    
    const match = textBeforeCursor.match(/(?:\s|^)@([a-zA-Z0-9_.]*)$/);

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
    
    const match = textBeforeCursor.match(/(?:\s|^)@([a-zA-Z0-9_.]*)$/);
    if (match) {
       const replaceLength = match[0].length;
       const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.length - replaceLength) + ` @${username} `;
       formik.setFieldValue("content", newTextBefore + textAfterCursor);
    }
    
    setShowMentionDropdown(false);
    textAreaRef.current?.focus(); 
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    formik.setFieldValue("content", formik.values.content + emojiData.emoji);
  };

  const handleStream = () => {
    setStream(true);
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ video: true })
        .then((mediaStream) => {
          videoRef.current!.srcObject = mediaStream;
          videoRef.current!.play();
          const track = mediaStream.getTracks();
          setTracks(track[0]);
        })
        .catch((err) => console.log(err));
    }
  };

  const handleCapture = () => {
    const width = videoRef.current!.clientWidth;
    const height = videoRef.current!.clientHeight;
    refCanvas.current!.setAttribute("width", String(width));
    refCanvas.current!.setAttribute("height", String(height));
    const ctx = refCanvas.current!.getContext("2d");
    if (videoRef.current) {
      ctx!.drawImage(videoRef.current, 0, 0, width, height);
      let URL = refCanvas.current!.toDataURL();
      setImages([...images, URL].map((item) => typeof item === "string" ? item : JSON.stringify(item)));
    }
  };

  const handleStopStream = () => {
    tracks!.stop();
    setStream(false);
  };

  const handleDeleteImages = (index: number) => {
    if (upload.images.length > 0) {
      dispatch(deleteImgPost(upload.images[index].public_id));
    }
    const newArr = [...images];
    newArr.splice(index, 1);
    setImages(newArr);
    if(newArr.length === 0) setMusic(null);
  };

  const handleCloseModal = () => {
    dispatch(setIsUploadGlobalState());
    if (stream) handleStopStream();
    formik.resetForm();
    setImages([]);
    setMusic(null);
  };

  const canSubmit = images.length > 0 || formik.values.content.trim().length > 0;
  
  const filteredUsers = mentionUsers.filter(u => u?.username?.toLowerCase().includes(mentionQuery));

  return (
    <>
      {isUploadGlobalState && (
        <div className="edit_profile">
          <button title="close" className="btn_close" onClick={handleCloseModal}>
            <AiOutlineClose style={{ width: "1.5rem", height: "1.5rem", fill: "white" }} />
          </button>

          <form
            onSubmit={formik.handleSubmit}
            className="flex-column"
            style={{
              maxWidth: "60%", maxHeight: "80%", height: "100%", width: "100%",
              backgroundColor: "white", paddingTop: "1rem", borderRadius: "5px", margin: "6rem auto",
            }}
          >
            <div className="absolute-center" style={{ padding: "0 1rem 0.5rem  1rem", borderBottom: "1px solid #dbdbdb" }}>
              <span className="absolute-center w-100" style={{ fontWeight: "600", lineHeight: "1.5px" }}>Create new post</span>
              <button type="submit" className={canSubmit ? "post-btn" : "post-btn-disabled"} disabled={!canSubmit}>
                Share
              </button>
            </div>
            
            <div className="d-flex w-100 h-100">
              <div style={{ width: "66%" }}>
                {images.length > 0 && stream === false ? (
                  <div className="h-100 position-relative d-flex flex-column">
                    <Swiper navigation={true} modules={[Navigation]} className="mySwiper absolute-center flex-grow-1" style={{ borderRight: "1px solid #dbdbdb" }}>
                      {images.map((image, index) => (
                        <SwiperSlide key={index} className="stream">
                          <span><button type="button" className="btn-close bg-white" aria-label="Close" onClick={() => handleDeleteImages(index)}></button></span>
                          <img src={image} alt={image} />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                  </div>
                ) : (
                  <div className="flex-column change-avatar-btn absolute-center w-100 h-100" style={{ borderRight: "1px solid #dbdbdb" }}>
                    <UploadImg />
                    {stream && (
                      <div className="stream position-relative">
                        <span><button type="button" className="btn-close bg-white" aria-label="Close" onClick={handleStopStream}></button></span>
                        <video autoPlay muted ref={videoRef} width="100%" height="100%" />
                        <canvas ref={refCanvas} style={{ display: "none" }} />
                      </div>
                    )}
                    <div className="input_images">
                      {stream ? (
                        <div style={{ position: "relative" }}>
                          <span className="number-img-stream">{images.length}</span>
                          <AiOutlineCamera className="mt-3" style={{ width: "2.5rem", height: "2.5rem", cursor: "pointer", color: "black" }} onClick={handleCapture} />
                        </div>
                      ) : (
                        <div style={{ position: "relative" }}>
                          <span className="number-img-stream">{images.length}</span>
                          <AiOutlineCamera className="mt-3 stream-btn" onClick={handleStream} />
                        </div>
                      )}
                    </div>
                    <p className="mt-3" style={{ color: "#8e8e8e" }}>Or</p>
                    <p role="button" className="btn btn-primary mt-3 px-3" onClick={handleClick}>Select from computer</p>
                    <input type="file" name="file" id="file_up" multiple accept="image/*" style={{ display: "none" }} ref={ref} onChange={uploadImages} />
                    {loading ? <img src={Load} alt="" style={{ width: "1.2rem", height: "1.2rem" }} /> : null}
                  </div>
                )}
              </div>

              <div className="px-3 pt-3 flex-column" style={{ width: "34%", backgroundColor: "white", display: "flex", flexDirection: "column", position: "relative" }}>
                <div className="d-flex mb-3">
                  <div className="user-image-wrapper absolute-center icon " style={{ cursor: "pointer" }}>
                    <img src={auth.user?.avatar} alt={auth.user?.username} />
                  </div>
                  <span className="ms-3 mt-2" style={{ fontSize: "0.9rem", fontWeight: "600", lineHeight: "1.2rem", cursor: "pointer" }}>
                    {auth.user?.username}
                  </span>
                </div>
                
                {showMentionDropdown && filteredUsers.length > 0 && (
                  <div className="mention-dropdown shadow" style={{ position: 'absolute', top: '60px', left: '10px', backgroundColor: '#fff', border: '1px solid #dbdbdb', borderRadius: '8px', zIndex: 9999, width: '90%', maxHeight: '200px', overflowY: 'auto' }}>
                    {filteredUsers.map((u, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleMentionSelect(u.username)}
                        style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #efefef', display: 'flex', alignItems: 'center', gap: '10px' }}
                        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f2f5')}
                        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}
                      >
                        <img src={u.avatar || "https://cdn-icons-png.flaticon.com/512/149/149071.png"} alt="dp" style={{width: '25px', height: '25px', borderRadius: '50%'}} />
                        <strong style={{fontSize: '14px'}}>@{u.username}</strong>
                      </div>
                    ))}
                  </div>
                )}

                <textarea
                  ref={textAreaRef}
                  maxLength={2200}
                  className="w-100 flex-grow-1"
                  name="content"
                  style={{ resize: "none", border: "none", outline: "none", minHeight: "150px" }}
                  placeholder="Write a caption... Type @ to mention someone"
                  value={formik.values.content}
                  onChange={handleContentChange} 
                />

                {images.length > 0 && (
                  <div className="mt-3 mb-3 border-top pt-3">
                    <input type="file" accept="audio/*" id="music_up" style={{ display: 'none' }} ref={musicRef} onChange={handleMusicUpload} />
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="btn btn-sm" style={{ backgroundColor: '#f0f2f5', fontWeight: 'bold', cursor: 'pointer', borderRadius: '20px' }} onClick={() => musicRef.current?.click()}>
                        🎵 {music ? music.name.slice(0, 15) + "..." : "Add Music"}
                      </span>
                      {music && <button type="button" className="btn-close" style={{fontSize: '10px'}} onClick={() => setMusic(null)}></button>}
                    </div>
                  </div>
                )}

                <div className="border-top pt-2 mt-auto" style={{ position: "relative" }}>
                  <span style={{ cursor: "pointer" }} onClick={() => setEmoji(!emoji)}><EmojiIcon className="mb-2" /></span>
                  {emoji ? <div style={{ position: "absolute", bottom: "40px", right: "0", zIndex: 50 }}><EmojiPicker onEmojiClick={handleEmojiClick} /></div> : null}
                  <span className="length-content float-end text-muted mt-1" style={{fontSize: '12px'}}>{formik.values.content.length}/2200</span>
                </div>
              </div>
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default CreatePost;