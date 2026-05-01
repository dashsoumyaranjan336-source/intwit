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
import axios from "axios";

let schema = yup.object().shape({
  content: yup.string(),
});

const CreatePost: React.FC = () => {
  const { auth, upload, socket, globalState } = useSelector((state: RootState) => state);
  const { isUploadGlobalState } = globalState;
  
  const dispatch: AppDispatch = useDispatch();
  const ref = createRef<HTMLInputElement>();
  const videoRef = useRef<HTMLVideoElement>(null);
  const refCanvas = useRef<HTMLCanvasElement>(null);
  
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);

  // 🔥 MUSIC API SEARCH STATES
  const [showMusicModal, setShowMusicModal] = useState(false);
  const [musicQuery, setMusicQuery] = useState("");
  const [musicResults, setMusicResults] = useState<any[]>([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [startTime, setStartTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);

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
  const [music, setMusic] = useState<any>(null); 
  const [emoji, setEmoji] = useState<boolean>(false);
  const [tracks, setTracks] = useState<MediaStreamTrack | null>(null);
  const [stream, setStream] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  // 🔥 MULTI-PHOTO UPLOAD FIX 🔥
  const uploadImages = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList: FileList | null = e.target.files;
    if (!fileList || fileList.length === 0) return;
    
    const filesArray: File[] = Array.from(fileList);
    setLoading(true);

    try {
      const response: any = await dispatch(uploadImgPost(filesArray));
      
      if (response.payload) {
        const uploadData = response.payload;
        let newUrls: string[] = [];

        // Universal URL Extractor
        if (Array.isArray(uploadData)) {
            newUrls = uploadData.map((img: any) => img.url || img.secure_url);
        } else if (uploadData?.images && Array.isArray(uploadData.images)) {
            newUrls = uploadData.images.map((img: any) => img.url || img.secure_url);
        } else if (uploadData?.data && Array.isArray(uploadData.data)) {
            newUrls = uploadData.data.map((img: any) => img.url || img.secure_url);
        }

        if (newUrls.length > 0) {
            setImages(prevImages => [...prevImages, ...newUrls]);
        }
      }
    } catch (error) {
      console.error("Image Upload Error:", error);
    } finally {
      setLoading(false);
      if (ref.current) ref.current.value = ""; 
    }
  };

  const searchMusic = async (e?: any) => {
    if (e) e.preventDefault(); 
    if (!musicQuery.trim()) return;
    setIsSearchingMusic(true);
    try {
      const res = await axios.get(`https://itunes.apple.com/search?term=${encodeURIComponent(musicQuery)}&entity=song&limit=10`);
      setMusicResults(res.data.results || []);
    } catch (error) {
      console.log("Music API Error:", error);
    }
    setIsSearchingMusic(false);
  };

  const formik = useFormik({
    initialValues: { content: "" },
    validationSchema: schema,
    onSubmit: (values) => {
      const rawMentions = values.content.match(/@([a-zA-Z0-9_.]+)/g) || [];
      const mentions = rawMentions.map(m => m.substring(1)); 

      const musicData = music ? JSON.stringify(music) : "";

      dispatch(createPost({ ...values, images, music: musicData, mentions })).then((response) => {
        const newPost = response.payload;
        if(newPost) {
          dispatch(setCreatePost(newPost._id));
          
          if(newPost.user.followers && newPost.user.followers.length > 0) {
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

          const mentionedUserIds = mentionUsers
            .filter((u) => mentions.includes(u.username)) 
            .map((u) => u._id); 

          if (mentionedUserIds.length > 0) {
            dispatch(
              createNotification({
                id: newPost._id,
                recipients: mentionedUserIds, 
                images: newPost.images[0] || "",
                url: `/${newPost.user.username}/${newPost._id}`,
                content: `mentioned you in a post`, 
                user: newPost.user._id,
              })
            ).then((res) => {
              socket.data!.emit("createNotify", res.payload);
            });
          }
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
            
            <div className="d-flex w-100 h-100" style={{ overflow: "hidden" }}>
              
              {/* 🔥 LEFT SIDE: PHOTO & SLIDER AREA (Strict 66%) 🔥 */}
              <div style={{ width: "66%", height: "100%", position: "relative", borderRight: "1px solid #dbdbdb", backgroundColor: "#f8f9fa", overflow: "hidden" }}>
                {images.length > 0 && stream === false ? (
                  <div className="h-100 w-100 d-flex flex-column position-relative">
                    
                    {/* ADD MORE PHOTOS BUTTON (Left Side) */}
                    <div style={{ position: "absolute", top: "15px", left: "15px", zIndex: 50 }}>
                       <button type="button" className="btn btn-sm shadow-sm" style={{ fontWeight: 'bold', borderRadius: '20px', backgroundColor: 'rgba(255,255,255,0.9)', border: '1px solid #ccc' }} onClick={handleClick} disabled={loading}>
                          {loading ? "Wait..." : "+ Add More"}
                       </button>
                    </div>

                    {/* UPLOADING SPINNER OVERLAY */}
                    {loading && (
                      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(255, 255, 255, 0.7)", zIndex: 100, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
                        <img src={Load} alt="Loading..." style={{ width: "40px", height: "40px" }} />
                        <span style={{ marginTop: "10px", fontWeight: "bold", color: "#333" }}>Uploading Photos...</span>
                      </div>
                    )}

                    {/* SWIPER SLIDER */}
                    <Swiper navigation={true} modules={[Navigation]} className="mySwiper" style={{ width: "100%", height: "100%" }}>
                      {images.map((image, index) => (
                        <SwiperSlide key={index} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%' }}>
                          
                          {/* DELETE/CLOSE BUTTON (Right Side) */}
                          <span style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 60 }}>
                            <button type="button" className="btn-close bg-white p-2 shadow-sm" aria-label="Close" style={{ borderRadius: '50%' }} onClick={() => handleDeleteImages(index)}></button>
                          </span>
                          
                          <img src={image} alt={`upload-${index}`} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                        </SwiperSlide>
                      ))}
                    </Swiper>
                    
                    {/* Hidden Input element */}
                    <input type="file" name="file" multiple accept="image/*" style={{ display: "none" }} ref={ref} onChange={uploadImages} />
                  </div>
                ) : (
                  <div className="flex-column change-avatar-btn absolute-center w-100 h-100">
                    <UploadImg />
                    {stream && (
                      <div className="stream position-relative" style={{ width: '100%', height: '100%' }}>
                        <span style={{ position: 'absolute', top: '15px', right: '15px', zIndex: 50 }}>
                          <button type="button" className="btn-close bg-white p-2 shadow-sm" aria-label="Close" style={{ borderRadius: '50%' }} onClick={handleStopStream}></button>
                        </span>
                        <video autoPlay muted ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
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
                    {loading ? <img src={Load} alt="Loading..." style={{ width: "1.2rem", height: "1.2rem", marginTop: "10px" }} /> : null}
                  </div>
                )}
              </div>

              {/* 🔥 RIGHT SIDE: CAPTION & DETAILS AREA (Strict 34%) 🔥 */}
              <div className="px-3 pt-3 flex-column" style={{ width: "34%", height: "100%", backgroundColor: "white", display: "flex", position: "relative", overflowY: "auto" }}>
                <div className="d-flex mb-3">
                  <div className="user-image-wrapper absolute-center icon" style={{ cursor: "pointer" }}>
                    <img src={auth.user?.avatar} alt={auth.user?.username} />
                  </div>
                  <span className="ms-3 mt-2" style={{ fontSize: "0.9rem", fontWeight: "600", lineHeight: "1.2rem", cursor: "pointer" }}>
                    {auth.user?.username}
                  </span>
                </div>
                
                {/* Mentions Dropdown */}
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

                {/* Search Music Modal */}
                {showMusicModal && (
                  <div className="music-search-dropdown shadow p-3" style={{ position: 'absolute', bottom: '80px', right: '10px', backgroundColor: '#fff', border: '1px solid #dbdbdb', borderRadius: '8px', zIndex: 9999, width: '95%' }}>
                    <div className="d-flex justify-content-between mb-2 align-items-center">
                      <strong style={{fontSize: '14px'}}>Search Music</strong>
                      <AiOutlineClose style={{cursor:'pointer'}} onClick={() => setShowMusicModal(false)} />
                    </div>
                    <div className="d-flex mb-2">
                      <input 
                        type="text" 
                        className="form-control form-control-sm me-2" 
                        placeholder="Search (e.g. lofi, beat)" 
                        value={musicQuery} 
                        onChange={e => setMusicQuery(e.target.value)} 
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            searchMusic();
                          }
                        }}
                      />
                      <button 
                        type="button" 
                        onClick={() => searchMusic()} 
                        className="btn btn-sm btn-primary" 
                        disabled={isSearchingMusic}
                      >
                        {isSearchingMusic ? "..." : "Find"}
                      </button>
                    </div>
                    <div style={{ maxHeight: '150px', overflowY: 'auto' }}>
                      {musicResults.map((track: any) => (
                        <div key={track.trackId} 
                             onClick={() => { 
                               setMusic({ name: track.trackName || "Audio Track", url: track.previewUrl }); 
                               setShowMusicModal(false); 
                             }}
                             style={{ padding: '8px', cursor: 'pointer', borderBottom: '1px solid #efefef', display: 'flex', alignItems: 'center' }}
                             onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = '#f0f2f5')}
                             onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'white')}>
                          <span style={{fontSize: '12px'}}>🎵 {track.trackName} - {track.artistName}</span>
                        </div>
                      ))}
                      {musicResults.length === 0 && !isSearchingMusic && <div style={{fontSize: '12px', color:'gray', textAlign: 'center'}}>No results found.</div>}
                    </div>
                  </div>
                )}

                {/* Caption Textarea */}
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

                {/* Music Slider */}
                <div className="mt-3 mb-3 border-top pt-3">
                  {!music ? (
                    <div className="d-flex align-items-center justify-content-between">
                      <span className="btn btn-sm" style={{ backgroundColor: '#f0f2f5', fontWeight: 'bold', cursor: 'pointer', borderRadius: '20px', padding: '6px 15px' }} onClick={() => setShowMusicModal(true)}>
                        🎵 Add Music
                      </span>
                    </div>
                  ) : (
                    <div className="mt-2 p-3" style={{ backgroundColor: '#f0f2f5', borderRadius: '10px', border: '1px solid #dbdbdb' }}>
                      <div className="d-flex justify-content-between align-items-center mb-2">
                        <span style={{ fontSize: '12px', fontWeight: 'bold' }}>🎵 {music.name.slice(0, 25)}...</span>
                        <button type="button" className="btn-close" style={{ fontSize: '10px' }} onClick={() => { setMusic(null); setStartTime(0); }}></button>
                      </div>
                      
                      <input 
                        type="range" 
                        min="0" 
                        max="29" 
                        step="1"
                        value={startTime} 
                        className="w-100"
                        style={{ cursor: 'pointer' }}
                        onChange={(e) => {
                          const time = Number(e.target.value);
                          setStartTime(time); 
                          if (audioRef.current) {
                            audioRef.current.currentTime = time; 
                          }
                        }}
                      />
                      <div className="text-center text-muted" style={{ fontSize: '10px' }}>
                        Start Time: 0:{startTime < 10 ? `0${startTime}` : startTime}
                      </div>

                      <audio 
                        ref={audioRef}
                        src={music.url} 
                        autoPlay 
                        hidden 
                        onEnded={() => {
                          if (audioRef.current) {
                            audioRef.current.currentTime = startTime; 
                            audioRef.current.play();
                          }
                        }}
                      />
                    </div>
                  )}
                </div>

                {/* Emoji Box */}
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