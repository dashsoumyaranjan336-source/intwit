import React, { useState, useRef, useEffect } from "react";
import { useFormik } from "formik";
import * as yup from "yup";
import { UploadImg } from "./Icons";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { uploadImgPost } from "../redux/features/uploadImgSlice";
import { createPost } from "../redux/features/postSlice";
import { createNotification } from "../redux/features/notificationSlice";
import Load from "../images/loading.gif";

let schema = yup.object().shape({
  content: yup.string(),
});

const CreateReel: React.FC = () => {
  const { auth, socket } = useSelector((state: RootState) => state);
  const dispatch: AppDispatch = useDispatch();

  // 🎥 Video States
  const [videoUrl, setVideoUrl] = useState<string | null>(null); // Cloudinary URL
  const [localVideoPreview, setLocalVideoPreview] = useState<string | null>(null); // Local preview
  const [isOriginalMuted, setIsOriginalMuted] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const videoRef = useRef<HTMLInputElement>(null);

  // 🎵 Music API States (Apple iTunes)
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [selectedMusic, setSelectedMusic] = useState<{title: string, artist: string, url: string, cover: string} | null>(null);
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  const handleVideoClick = () => videoRef.current?.click();

  // 🔥 1. Video Upload to Server (Cloudinary)
  // 🔥 1. Video Upload to Server (Cloudinary)
  const handleVideoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLocalVideoPreview(URL.createObjectURL(file)); // Fast local preview
      setIsOriginalMuted(false); 

      setLoading(true);
       // 👈 Yeh tracker lagaya hai
      
      // Uploading to backend just like CreatePost
      dispatch(uploadImgPost([file])).then((response) => {
         // 👈 Yeh tracker lagaya hai
        if (response.payload && response.payload[0]) {
          setVideoUrl(response.payload[0].url); // Save uploaded URL
        }
        setLoading(false);
      }).catch((error) => {
         // 👈 Yeh tracker lagaya hai
        setLoading(false);
      });
    }
  };
  

  // 🔥 2. Apple iTunes API Music Search
  const fetchMusicFromAPI = async (query: string) => {
    setIsSearching(true);
    try {
      const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`);
      const data = await res.json();
      const formattedSongs = data.results
        .filter((song: any) => song.previewUrl)
        .map((song: any) => ({
          id: song.trackId,
          title: song.trackName,
          artist: song.artistName,
          url: song.previewUrl,
          cover: song.artworkUrl100 
        }));
      setSearchResults(formattedSongs);
    } catch (error) {
      console.error("Music API error: ", error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearchMusic = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    searchTimeout.current = setTimeout(() => {
      fetchMusicFromAPI(query);
    }, 500);
  };

  const handleSelectMusic = (song: any) => {
    setSelectedMusic(song);
    setSearchQuery("");
    setSearchResults([]);
    setIsOriginalMuted(true); 
  };

  // 🔥 3. Save Reel to Database (MongoDB)
  const formik = useFormik({
    initialValues: { content: "" },
    validationSchema: schema,
    onSubmit: async (values) => {
      if (!videoUrl) return alert("Please wait for the video to finish uploading!");

      const rawMentions = values.content.match(/@([a-zA-Z0-9_.]+)/g) || [];
      const mentions = rawMentions.map(m => m.substring(1)); 
      
      // Formatting music to store in DB
      const musicData = selectedMusic ? JSON.stringify({
        name: selectedMusic.title,
        artist: selectedMusic.artist,
        url: selectedMusic.url
      }) : null;

      // Create Post API Call
      // Create Post API Call
      dispatch(createPost({ 
        content: values.content, 
        images: [videoUrl], // Assuming your DB saves video URLs in the images array
        music: musicData as any, 
        mentions, // 👈 FIX 1: Yahan comma (,) lagana zaroori hai!
        isReel: true 
      } as any)).then((response) => { // 👈 FIX 2: '} as any)' likhne se TypeScript error nahi dega
        const newPost = response.payload;
        if(newPost) {
          // Notification & Socket logic
          dispatch(
            createNotification({
              id: newPost._id,
              recipients: [...newPost.user.followers],
              images: newPost.images[0] || "", 
              url: `/${newPost.user.username}/${newPost._id}`,
              content: `posted a new Reel 🎬`,
              user: newPost.user._id,
            })
          ).then((res) => {
            socket.data!.emit("createNotify", res.payload);
          });
        }
      });

      alert("🎬 Reel Uploaded Successfully! Check your profile.");
      formik.resetForm();
      setVideoUrl(null);
      setLocalVideoPreview(null);
      setSelectedMusic(null);
    },
  });

  const handleDeleteVideo = () => {
    setVideoUrl(null);
    setLocalVideoPreview(null);
    setIsOriginalMuted(false);
  };

  const handleDeleteMusic = () => {
    setSelectedMusic(null);
    setIsOriginalMuted(false); 
  };

  const toggleOriginalAudio = () => {
    setIsOriginalMuted(!isOriginalMuted);
  };

  const isShareDisabled = !videoUrl || loading; // Button tabhi chalega jab video upload ho jaye

  return (
    <div style={{ width: "100%", height: "100vh", display: "flex", justifyContent: "center", alignItems: "center", backgroundColor: "#fafafa" }}>
      <form onSubmit={formik.handleSubmit} className="flex-column shadow" style={{ maxWidth: "800px", height: "550px", width: "100%", backgroundColor: "white", borderRadius: "10px", overflow: "hidden" }}>
        
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center px-3 py-2" style={{ borderBottom: "1px solid #dbdbdb" }}>
          <span style={{ fontWeight: "600", fontSize: "16px" }}>Create new Reel</span>
          <div className="d-flex align-items-center">
             {loading && <img src={Load} alt="loading" style={{ width: "1.2rem", height: "1.2rem", marginRight: "10px" }} />}
             <button type="submit" className={!isShareDisabled ? "btn text-primary fw-bold" : "btn text-muted fw-bold"} disabled={isShareDisabled}>
               Share
             </button>
          </div>
        </div>

        {/* Main Content */}
        <div className="d-flex w-100 h-100">
          
          {/* Left Side: Video Preview */}
          <div className="d-flex justify-content-center align-items-center" style={{ width: "55%", borderRight: "1px solid #dbdbdb", backgroundColor: "#262626", position: "relative" }}>
            {localVideoPreview ? (
              <>
                <video 
                  src={localVideoPreview} 
                  controls={false} 
                  autoPlay 
                  loop 
                  muted={isOriginalMuted} 
                  style={{ width: "100%", height: "100%", objectFit: "contain", opacity: loading ? 0.5 : 1 }} 
                />
                
                <button type="button" className="btn btn-danger btn-sm shadow" style={{ position: "absolute", top: "15px", left: "15px", borderRadius: "8px" }} onClick={handleDeleteVideo}>
                  &times; Remove
                </button>

                <button 
                  type="button" 
                  className="btn btn-sm shadow" 
                  style={{ 
                    position: "absolute", 
                    bottom: "20px", 
                    right: "20px", 
                    backgroundColor: "rgba(0,0,0,0.6)", 
                    color: "white", 
                    borderRadius: "20px",
                    fontWeight: "600"
                  }} 
                  onClick={toggleOriginalAudio}
                >
                  {isOriginalMuted ? "🔇 Audio Off" : "🔊 Audio On"}
                </button>
              </>
            ) : (
              <div className="text-center text-white">
                <UploadImg />
                <h5 className="mt-3">Drag video here</h5>
                <p className="text-muted text-sm">or</p>
                <button type="button" className="btn btn-primary" onClick={handleVideoClick}>Select from computer</button>
                <input type="file" accept="video/mp4,video/x-m4v,video/*" style={{ display: "none" }} ref={videoRef} onChange={handleVideoUpload} />
              </div>
            )}
          </div>

          {/* Right Side: Caption & Music API */}
          <div className="p-3" style={{ width: "45%", display: "flex", flexDirection: "column" }}>
            
            <div className="d-flex align-items-center mb-2">
              <span style={{ fontWeight: "600" }}>Write a caption</span>
            </div>
            <textarea
              maxLength={2200}
              className="w-100"
              name="content"
              style={{ resize: "none", border: "none", outline: "none", fontSize: "14px", height: "100px" }}
              placeholder="Write a caption for your reel..."
              value={formik.values.content}
              onChange={formik.handleChange("content")}
            />
            <div className="border-bottom pb-2 text-end text-muted" style={{ fontSize: "12px" }}>
              {formik.values.content.length}/2200
            </div>

            {/* MUSIC API SEARCH SECTION */}
            <div className="mt-3 flex-grow-1" style={{ position: "relative" }}>
              <span style={{ fontWeight: "600", display: "block", marginBottom: "8px" }}>Search Music 🎵</span>
              
              {!selectedMusic ? (
                <>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Search songs, artists (e.g. Arijit)..."
                    value={searchQuery}
                    onChange={handleSearchMusic}
                    style={{ fontSize: "14px", borderRadius: "8px" }}
                  />
                  
                  {searchQuery.length > 1 && (
                    <div className="shadow mt-1" style={{ position: "absolute", width: "100%", backgroundColor: "white", zIndex: 10, border: "1px solid #efefef", borderRadius: "8px", maxHeight: "250px", overflowY: "auto" }}>
                      {isSearching ? (
                        <div className="p-3 text-center text-muted" style={{ fontSize: "13px" }}>Searching Apple Music... 🔍</div>
                      ) : searchResults.length > 0 ? (
                        searchResults.map((song) => (
                          <div 
                            key={song.id} 
                            onClick={() => handleSelectMusic(song)}
                            className="p-2 border-bottom d-flex align-items-center"
                            style={{ cursor: "pointer", transition: "0.2s" }}
                            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#f8f9fa"}
                            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "transparent"}
                          >
                            <img src={song.cover} alt="cover" style={{ width: "40px", height: "40px", borderRadius: "5px", marginRight: "10px" }} />
                            <div>
                              <div style={{ fontWeight: "600", fontSize: "13px", color: "#262626" }}>{song.title}</div>
                              <div className="text-muted" style={{ fontSize: "11px" }}>{song.artist}</div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-3 text-center text-muted">No results found</div>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="d-flex justify-content-between align-items-center p-2 border rounded" style={{ backgroundColor: "#f8f9fa" }}>
                    <div className="d-flex align-items-center">
                        <img src={selectedMusic.cover} alt="cover" style={{ width: "40px", height: "40px", borderRadius: "5px", marginRight: "10px" }} />
                        <div>
                            <div style={{ fontWeight: "600", fontSize: "13px", color: "#262626" }}>{selectedMusic.title}</div>
                            <div className="text-muted" style={{ fontSize: "11px" }}>{selectedMusic.artist}</div>
                        </div>
                    </div>
                    <button type="button" className="btn btn-sm btn-outline-danger" onClick={handleDeleteMusic}>
                        &times;
                    </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};

export default CreateReel;