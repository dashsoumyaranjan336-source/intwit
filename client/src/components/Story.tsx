import React, { useEffect, useState, useRef } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import StorySkeleton from "./skeleton/StorySkeleton";
import imageCompression from "browser-image-compression";
import { FaPlus, FaVideo } from "react-icons/fa";
import { Link } from "react-router-dom"; // 🔥 Link for mentions

// 🔴 Tumhara LiveStream component import kar liya
import LiveStream from "./LiveStream"; 

interface IStory {
  _id: string;
  image: string;
  audioUrl?: string; 
  text?: string; // 🔥 Added text for caption/mentions
  user: {
    _id: string;
    avatar: string;
    username: string;
  };
}

// 🔥 Helper function for blue clickable mentions in story
const renderContentWithMentions = (text: string) => {
  if (!text) return "";
  return text.split(/(@[a-zA-Z0-9_.]+)/g).map((part, index) => {
    if (part.startsWith("@")) {
      return (
        <Link 
          key={index} 
          to={`/${part.substring(1)}`} 
          style={{ color: "#00d2ff", fontWeight: "bold", textDecoration: "none", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }}
          onClick={(e) => e.stopPropagation()} 
        >
          {part}
        </Link>
      );
    }
    return part;
  });
};

const Story: React.FC = () => {
  const { auth } = useSelector((state: RootState) => state);
  const [stories, setStories] = useState<IStory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedStory, setSelectedStory] = useState<IStory | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [selectedMusic, setSelectedMusic] = useState<{title: string, url: string} | null>(null);
  const [showMusicList, setShowMusicList] = useState<boolean>(false);
  
  const [searchMusicText, setSearchMusicText] = useState<string>("");
  const [apiSongs, setApiSongs] = useState<any[]>([]);
  const [loadingMusic, setLoadingMusic] = useState<boolean>(false);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  const [showLiveStream, setShowLiveStream] = useState<boolean>(false);

  // 🔥 STORY TEXT & MENTION STATES
  const [storyText, setStoryText] = useState<string>("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const textInputRef = useRef<HTMLInputElement>(null);

  // 🔥 Fetch followers for mentions
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

  const searchMusicFromAPI = async () => {
    if (!searchMusicText) return;
    setLoadingMusic(true);
    try {
        const res = await fetch(`https://itunes.apple.com/search?term=${searchMusicText}&entity=song&limit=6`);
        const data = await res.json();
        setApiSongs(data.results);
    } catch (error) {
        console.error("Error fetching music", error);
    }
    setLoadingMusic(false);
  };

  const playPreview = (url: string) => {
    if (playingAudio) {
        playingAudio.pause(); 
    }
    const audio = new Audio(url);
    audio.play().catch(e => console.log("Audio play error:", e));
    setPlayingAudio(audio);
  };

  const handleSelectMusic = (url: string, title: string) => {
    if (!playingAudio || (playingAudio && playingAudio.src !== url)) {
        if (playingAudio) playingAudio.pause();
        const newAudio = new Audio(url);
        newAudio.loop = true; 
        newAudio.play().catch(e => console.log("Audio play error:", e));
        setPlayingAudio(newAudio);
    } else {
        playingAudio.loop = true;
    }
    setSelectedMusic({ title, url });
    setShowMusicList(false); 
  };

  const closeEditor = () => {
    if (playingAudio) {
        playingAudio.pause();
        playingAudio.currentTime = 0;
    }
    setPlayingAudio(null);
    setPreviewFile(null);
    setPreviewUrl(null);
    setSelectedMusic(null);
    setShowMusicList(false);
    setApiSongs([]);
    setSearchMusicText("");
    setStoryText(""); // Clear text on close
  };

  useEffect(() => {
    const fetchStories = async () => {
      try {
        const res = await fetch("https://intwit-28qq.onrender.com/api/story", {
          headers: { Authorization: `Bearer ${auth.user?.token}` },
        });
        const data = await res.json();
        if (res.ok) setStories(data);
      } catch (error) {
        console.error("Story fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    if (auth.user?.token) fetchStories();
  }, [auth.user?.token]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let storyAudio: HTMLAudioElement | null = null; 

    if (selectedStory) {
      setIsLiked(false);
      if (selectedStory.audioUrl) {
        storyAudio = new Audio(selectedStory.audioUrl);
        storyAudio.play().catch(e => console.log("Audio play error:", e));
      }
      timer = setTimeout(() => {
        setSelectedStory(null);
      }, 5000);
    }

    return () => {
      clearTimeout(timer);
      if (storyAudio) {
        storyAudio.pause();
        storyAudio.currentTime = 0;
      }
    };
  }, [selectedStory]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file)); 
  };

  const handleUploadStory = async () => {
    if (!previewFile) return;
    try {
      setUploading(true); 
      if (playingAudio) {
          playingAudio.pause();
          setPlayingAudio(null);
      }

      const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
      const compressedFile = await imageCompression(previewFile, options);

      const formData = new FormData();
      formData.append("images", compressedFile);

      const uploadRes = await fetch("https://intwit-28qq.onrender.com/api/upload/post", {
        method: "POST",
        headers: { Authorization: `Bearer ${auth.user?.token}` },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.url || (uploadData[0] && uploadData[0].url);

      if (!imageUrl) throw new Error("Cloudinary upload failed!");

      const storyRes = await fetch("https://intwit-28qq.onrender.com/api/story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user?.token}`,
        },
        body: JSON.stringify({ 
          image: imageUrl,
          audioUrl: selectedMusic ? selectedMusic.url : "",
          text: storyText // 🔥 Send text to backend
        }), 
      });

      const storyData = await storyRes.json();
      if (storyRes.ok) {
        setStories([storyData.newStory, ...stories]);
        alert("🎉 Story Uploaded!");
        closeEditor(); 
      } else {
        alert(storyData.msg || "Error uploading story");
      }
    } catch (error) {
      console.error(error);
      alert("Kuch jhol ho gaya network mein! Backend check kar.");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStory = async () => {
    if (!selectedStory) return;
    
    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        const res = await fetch(`https://intwit-28qq.onrender.com/api/story/${selectedStory._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${auth.user?.token}` }
        });
        
        const data = await res.json();
        
        if (res.ok) {
          setStories(stories.filter(s => s._id !== selectedStory._id));
          setSelectedStory(null); 
          alert("Story Deleted Successfully!");
        } else {
          alert(data.msg || "Failed to delete story.");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Network error, try again later.");
      }
    }
  };

  // 🔥 MENTION HANDLERS FOR STORY EDITOR
  const handleTextChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setStoryText(value);

    const cursorPosition = e.target.selectionStart || 0;
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
    const cursorPosition = textInputRef.current?.selectionStart || 0;
    const textBeforeCursor = storyText.substring(0, cursorPosition);
    const textAfterCursor = storyText.substring(cursorPosition);
    
    const match = textBeforeCursor.match(/(?:\s|^)@([a-zA-Z0-9_.]*)$/);
    if (match) {
       const replaceLength = match[0].length;
       const newTextBefore = textBeforeCursor.substring(0, textBeforeCursor.length - replaceLength) + ` @${username} `;
       setStoryText(newTextBefore + textAfterCursor);
    }
    setShowMentionDropdown(false);
    textInputRef.current?.focus(); 
  };

  const filteredUsers = mentionUsers.filter(u => u?.username?.toLowerCase().includes(mentionQuery));
  const isMyStory = selectedStory?.user._id === auth.user?._id;

  return (
    <>
      <style>
        {`
          .stories-container::-webkit-scrollbar { display: none; }
          .story-gradient {
            background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
            padding: 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          }
          .story-img { width: 60px; height: 60px; border-radius: 50%; border: 2px solid white; object-fit: cover; }
          
          /* Live Button Gradient */
          .live-gradient {
            background: linear-gradient(45deg, #ff0000 0%, #ff007f 100%);
            padding: 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            animation: pulseLive 2s infinite;
          }
          @keyframes pulseLive {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(255, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
          }
          
          @keyframes storyProgress { from { width: 0%; } to { width: 100%; } }
          .progress-bar-fill { height: 100%; background-color: white; border-radius: 5px; animation: storyProgress 5s linear forwards; }
          .like-btn { font-size: 28px; cursor: pointer; transition: transform 0.2s; background: none; border: none; outline: none; }
          .like-btn:active { transform: scale(1.2); }
          .insta-action-btn { background: rgba(0,0,0,0.6); border: none; color: white; border-radius: 50%; width: 45px; height: 45px; font-size: 20px; cursor: pointer; display: flex; align-items: center; justify-content: center; transition: 0.2s; }
          .insta-action-btn:hover { background: rgba(255,255,255,0.2); }
          .share-bottom-btn { background: white; color: black; border: none; padding: 10px 15px; border-radius: 30px; font-weight: bold; cursor: pointer; font-size: 14px; display: flex; align-items: center; gap: 8px; }
          .music-search-input { width: 100%; padding: 8px 12px; border-radius: 8px; border: none; background: #333; color: white; outline: none; font-size: 14px; }
        `}
      </style>

      {/* HORIZONTAL STORY FEED */}
      <div className="stories-container bg-white" style={{ display: "flex", overflowX: "auto", padding: "15px 0", marginBottom: "20px", border: "1px solid #dbdbdb", borderRadius: "8px", gap: "15px", scrollbarWidth: "none", alignItems: "center" }}>
        
        {/* 1. Your Story Button */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", marginLeft: "15px", minWidth: "70px" }} onClick={() => fileInputRef.current?.click()}>
          <img src={auth.user?.avatar || "https://via.placeholder.com/150"} alt="Your Story" style={{ width: "66px", height: "66px", borderRadius: "50%", objectFit: "cover" }} />
          <div style={{ position: "absolute", bottom: "20px", right: "0", background: "#0095f6", color: "white", borderRadius: "50%", width: "22px", height: "22px", display: "flex", justifyContent: "center", alignItems: "center", border: "2px solid white", fontSize: "12px" }}>
            <FaPlus />
          </div>
          <span style={{ fontSize: "12px", marginTop: "5px", color: "#262626", fontWeight: "500" }}>Your Story</span>
        </div>
        <input type="file" ref={fileInputRef} style={{ display: "none" }} accept="image/*" onChange={handleFileSelect} />

        {/* 2. GO LIVE BUTTON 🔴🎥 */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", minWidth: "70px" }} onClick={() => setShowLiveStream(true)}>
          <div className="live-gradient">
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid white", backgroundColor: "#fff", display: "flex", justifyContent: "center", alignItems: "center", color: "#ff004f", fontSize: "24px" }}>
              <FaVideo />
            </div>
          </div>
          <span style={{ fontSize: "12px", marginTop: "5px", color: "#ff004f", fontWeight: "bold" }}>Go Live</span>
        </div>

        {/* 3. Fetched Stories */}
        {loading ? <StorySkeleton /> : stories.map((story) => (
          <div key={story._id} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", minWidth: "70px" }} onClick={() => setSelectedStory(story)}>
            <div className="story-gradient">
              <img src={story.user.avatar} alt={story.user.username} className="story-img" />
            </div>
            <span style={{ fontSize: "12px", marginTop: "5px", color: "#262626", fontWeight: "500" }}>
              {story.user.username.length > 10 ? story.user.username.substring(0, 10) + "..." : story.user.username}
            </span>
          </div>
        ))}
      </div>

      {/* 🔴 NAYA: LIVE STREAM MODAL */}
      {showLiveStream && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 999999, backgroundColor: "#000" }}>
          <button 
            onClick={() => setShowLiveStream(false)} 
            style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: "30px", cursor: "pointer", width: "45px", height: "45px", borderRadius: "50%", zIndex: 100 }}
          >
            &times;
          </button>
          <LiveStream />
        </div>
      )}

      {/* EDITOR PREVIEW MODAL */}
      {previewUrl && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "#111", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "absolute", top: "20px", width: "100%", padding: "0 20px", display: "flex", justifyContent: "space-between", zIndex: 10 }}>
            <button onClick={closeEditor} style={{ background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: "30px", cursor: "pointer", width: "45px", height: "45px", borderRadius: "50%" }}>&times;</button>
            <div style={{ display: "flex", gap: "15px" }}>
              <button className="insta-action-btn" title="Music" onClick={() => setShowMusicList(!showMusicList)}>🎵</button>
            </div>
          </div>

          {showMusicList && (
            <div style={{ position: "absolute", top: "80px", right: "20px", background: "rgba(0,0,0,0.9)", padding: "15px", borderRadius: "10px", color: "white", zIndex: 11, width: "320px", boxShadow: "0 4px 15px rgba(0,0,0,0.5)" }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '15px' }}>
                <input 
                  type="text" placeholder="Search Music (e.g. Arijit)..." className="music-search-input" style={{ margin: 0 }}
                  value={searchMusicText} onChange={(e) => setSearchMusicText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchMusicFromAPI()}
                />
                <button onClick={searchMusicFromAPI} style={{ padding: '8px 12px', background: '#0095f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
                  {loadingMusic ? "..." : "Find"}
                </button>
              </div>
              <div style={{ maxHeight: "250px", overflowY: "auto", paddingRight: "5px", display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {apiSongs.length > 0 ? (
                  apiSongs.map(song => (
                    <div key={song.trackId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#222', padding: '8px', borderRadius: '8px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', overflow: 'hidden' }}>
                        <img src={song.artworkUrl60} alt="cover" style={{ width: '35px', height: '35px', borderRadius: '4px' }} />
                        <div style={{ overflow: 'hidden' }}>
                          <p style={{ margin: 0, fontSize: '13px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100px' }}>{song.trackName}</p>
                          <p style={{ margin: 0, color: '#aaa', fontSize: '11px' }}>{song.artistName}</p>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '5px' }}>
                        <button onClick={() => playPreview(song.previewUrl)} style={{ padding: '5px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px' }}>▶️</button>
                        <button onClick={() => handleSelectMusic(song.previewUrl, song.trackName)} style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold', fontSize: '12px' }}>Select</button>
                      </div>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "#aaa", fontSize: "13px", textAlign: "center", marginTop: "10px" }}>{searchMusicText ? "Press Find to search" : "Search a song above"}</p>
                )}
              </div>
            </div>
          )}

          <div style={{ position: "relative", display: "flex", justifyContent: "center", alignItems: "center", height: "100%", width: "100%" }}>
             <img src={previewUrl} alt="Preview" style={{ maxHeight: "85vh", maxWidth: "100vw", borderRadius: "15px", objectFit: "contain" }} />
             
             {/* 🔥 STORY TEXT INPUT WITH MENTIONS IN EDITOR */}
             <div style={{ position: "absolute", top: "40%", width: "80%", maxWidth: "400px", zIndex: 5 }}>
                {showMentionDropdown && filteredUsers.length > 0 && (
                  <div className="mention-dropdown shadow" style={{ position: 'absolute', bottom: '100%', left: '0', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #555', borderRadius: '8px', zIndex: 10, width: '100%', maxHeight: '150px', overflowY: 'auto' }}>
                    {filteredUsers.map((u, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleMentionSelect(u.username)}
                        style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}
                      >
                        <img src={u.avatar || "https://via.placeholder.com/150"} alt="dp" style={{width: '25px', height: '25px', borderRadius: '50%'}} />
                        <strong style={{fontSize: '14px'}}>@{u.username}</strong>
                      </div>
                    ))}
                  </div>
                )}
                <input 
                  ref={textInputRef}
                  type="text" 
                  placeholder="Add a caption or @mention..." 
                  value={storyText}
                  onChange={handleTextChange}
                  style={{ 
                    width: "100%", padding: "12px", background: "rgba(0,0,0,0.6)", color: "white", 
                    border: "2px dashed #fff", borderRadius: "10px", fontSize: "16px", outline: "none", 
                    textAlign: "center", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" 
                  }} 
                />
             </div>

             {selectedMusic && (
                <div style={{ position: "absolute", top: "15%", left: "50%", transform: "translateX(-50%)", background: "rgba(255,255,255,0.9)", color: "black", padding: "8px 20px", borderRadius: "8px", fontSize: "14px", fontWeight: "bold", display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 4px 6px rgba(0,0,0,0.3)" }}>
                  🎵 {selectedMusic.title}
                </div>
             )}
          </div>

          <div style={{ position: "absolute", bottom: "20px", width: "100%", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div style={{ display: "flex", gap: "10px" }}>
              <button className="share-bottom-btn" onClick={handleUploadStory} disabled={uploading}>
                {uploading ? "Uploading..." : <><img src={auth.user?.avatar} alt="dp" style={{width: "24px", height: "24px", borderRadius: "50%"}} /> Your story</>}
              </button>
            </div>
            <button onClick={handleUploadStory} disabled={uploading} style={{ background: "white", border: "none", width: "45px", height: "45px", borderRadius: "50%", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
               &gt;
            </button>
          </div>
        </div>
      )}

      {/* STORY VIEWER MODAL */}
      {selectedStory && (
        <div className="story-viewer-modal" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "#111", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          
          <div style={{ position: "absolute", top: "10px", width: "95%", height: "3px", backgroundColor: "rgba(255,255,255,0.3)", borderRadius: "5px", overflow: "hidden" }}>
            <div key={selectedStory._id} className="progress-bar-fill"></div>
          </div>

          <div style={{ position: "absolute", top: "25px", left: "20px", display: "flex", alignItems: "center", gap: "10px", width: "100%", zIndex: 10 }}>
            <img src={selectedStory.user.avatar} alt="Avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid white", objectFit: "cover" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
               <span style={{ color: "white", fontWeight: "bold", fontSize: "14px" }}>
                  {selectedStory.user.username} <span style={{ color: "#aaa", fontSize: "12px", marginLeft: "5px" }}>2h</span>
               </span>
               <span style={{ color: "white", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  🎵 {selectedStory.user.username} · {selectedStory.audioUrl ? "Music playing..." : "Original Audio"}
               </span>
            </div>
          </div>

          <button onClick={() => setSelectedStory(null)} style={{ position: "absolute", top: "25px", right: "20px", background: "none", border: "none", color: "white", fontSize: "35px", cursor: "pointer", zIndex: 10 }}>&times;</button>
          
          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img src={selectedStory.image} alt="Story content" style={{ maxHeight: "75vh", maxWidth: "100vw", objectFit: "contain", marginTop: "20px" }} />
            
            {/* 🔥 STORY TEXT OVERLAY WITH BLUE HIGHLIGHT MENTIONS */}
            {selectedStory.text && (
              <div style={{ position: "absolute", top: "40%", width: "80%", maxWidth: "400px", textAlign: "center", background: "rgba(0,0,0,0.4)", padding: "10px", borderRadius: "10px" }}>
                <h3 style={{ color: "white", margin: 0, textShadow: "1px 1px 3px black" }}>
                  {renderContentWithMentions(selectedStory.text)}
                </h3>
              </div>
            )}
          </div>

          <div style={{ position: "absolute", bottom: "20px", width: "100%", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
             {!isMyStory ? (
               <>
                 <input type="text" placeholder={`Reply to ${selectedStory.user.username}...`} style={{ background: "transparent", border: "1px solid white", borderRadius: "30px", padding: "10px 20px", color: "white", width: "80%", outline: "none" }} />
                 <button className="like-btn" onClick={() => setIsLiked(!isLiked)}>{isLiked ? "❤️" : "🤍"}</button>
               </>
             ) : (
               <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px" }}>
                 <span style={{ color: "white", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                   👁️ 0 Views
                 </span>
                 <button 
                    onClick={handleDeleteStory}
                    style={{ background: "rgba(255, 0, 0, 0.7)", color: "white", border: "none", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", display: "flex", gap: "5px", alignItems: "center" }}
                  >
                    🗑️ Delete
                 </button>
               </div>
             )}
          </div>
        </div>
      )}
    </>
  );
};

export default Story;