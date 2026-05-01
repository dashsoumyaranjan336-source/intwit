import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../redux/store";
import { uploadImgPost } from "../redux/features/uploadImgSlice";
import StorySkeleton from "./skeleton/StorySkeleton";
import imageCompression from "browser-image-compression";
import { FaPlus, FaVideo, FaFont } from "react-icons/fa"; 
import { Link } from "react-router-dom"; 

import LiveStream from "./LiveStream"; 

interface IStory {
  _id: string;
  image: string;
  audioUrl?: string; 
  text?: string; 
  user: {
    _id: string;
    avatar: string;
    username: string;
  };
}

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
  const dispatch: AppDispatch = useDispatch();

  const [stories, setStories] = useState<IStory[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [uploading, setUploading] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 🔥 MULTI-STORY VIEWER STATES 🔥
  const [selectedGroup, setSelectedGroup] = useState<any>(null); 
  const [currentIndex, setCurrentIndex] = useState<number>(0);   
  
  const [isLiked, setIsLiked] = useState<boolean>(false);
  const [replyText, setReplyText] = useState<string>(""); // 🔥 NAYA: Reply ke liye state

  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  
  const [selectedMusic, setSelectedMusic] = useState<{title: string, url: string} | null>(null);
  const [showMusicList, setShowMusicList] = useState<boolean>(false);
  
  const [searchMusicText, setSearchMusicText] = useState<string>("");
  const [apiSongs, setApiSongs] = useState<any[]>([]);
  const [loadingMusic, setLoadingMusic] = useState<boolean>(false);
  const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

  const [showLiveStream, setShowLiveStream] = useState<boolean>(false);

  const [storyText, setStoryText] = useState<string>("");
  const [showMentionDropdown, setShowMentionDropdown] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionUsers, setMentionUsers] = useState<any[]>([]);
  const textInputRef = useRef<HTMLInputElement>(null);

  const [showTextMode, setShowTextMode] = useState<boolean>(false);
  const [textStoryContent, setTextStoryContent] = useState<string>("");
  const [bgIndex, setBgIndex] = useState<number>(0);

  const gradients = [
    ["#ff9a9e", "#fecfef"],     
    ["#a1c4fd", "#c2e9fb"],     
    ["#29323c", "#485563"],     
    ["#667eea", "#764ba2"],     
    ["#ff758c", "#ff7eb3"],     
    ["#f2709c", "#ff9472"]      
  ];

  const getFreshToken = () => {
    let t = (auth as any)?.user?.token || (auth as any)?.token || localStorage.getItem("token");
    if (t) t = t.replace(/['"]+/g, '');
    return t;
  };

  useEffect(() => {
    if (auth.user) {
      let combined: any[] = [...(auth.user.followers || []), ...(auth.user.following || [])];
      
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
    setStoryText(""); 
  };

  useEffect(() => {
    const fetchStories = async () => {
      const currentToken = getFreshToken();
      if(!currentToken) return;

      try {
        const res = await fetch("https://intwit-28qq.onrender.com/api/story", {
          headers: { Authorization: `Bearer ${currentToken}` },
        });
        const data = await res.json();
        if (res.ok) setStories(data);
      } catch (error) {
        console.error("Story fetch error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStories();
  }, [auth]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    let storyAudio: HTMLAudioElement | null = null; 

    if (selectedGroup && selectedGroup.items[currentIndex]) {
      const currentStory = selectedGroup.items[currentIndex];
      setIsLiked(false);
      setReplyText(""); // Jab nayi story aaye toh purana reply clear ho jaye
      
      if (currentStory.audioUrl) {
        storyAudio = new Audio(currentStory.audioUrl);
        storyAudio.play().catch(e => console.log("Audio play error:", e));
      }

      timer = setTimeout(() => {
        if (currentIndex < selectedGroup.items.length - 1) {
          setCurrentIndex(prev => prev + 1);
        } else {
          setSelectedGroup(null);
        }
      }, 15000);
    }

    return () => {
      clearTimeout(timer);
      if (storyAudio) {
        storyAudio.pause();
        storyAudio.currentTime = 0;
      }
    };
  }, [selectedGroup, currentIndex]);

  const handleNextStory = () => {
    if (selectedGroup && currentIndex < selectedGroup.items.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      setSelectedGroup(null);
    }
  };

  const handlePrevStory = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  // 🔥 NAYA: SEND REPLY FUNCTION 🔥
  const handleSendReply = () => {
    if (!replyText.trim()) return;
    
    // Future mein yahan aap apne ChatBox/Message ka API laga sakte hain
    alert(`Message Sent to @${currentStory.user.username}:\n"${replyText}"`);
    
    // Message bhejne ke baad input khali kar do
    setReplyText("");
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewFile(file);
    setPreviewUrl(URL.createObjectURL(file)); 
  };

  const handleTextStoryDone = () => {
    if(!textStoryContent.trim()) {
      setShowTextMode(false);
      return;
    }

    const canvas = document.createElement("canvas");
    canvas.width = 1080;
    canvas.height = 1920;
    const ctx = canvas.getContext("2d");
    if(!ctx) return;

    const grad = ctx.createLinearGradient(0, 0, 1080, 1920);
    grad.addColorStop(0, gradients[bgIndex][0]);
    grad.addColorStop(1, gradients[bgIndex][1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1080, 1920);

    ctx.fillStyle = "white";
    ctx.font = "bold 80px Arial";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";

    const words = textStoryContent.split(" ");
    let line = "";
    const lines = [];

    for(let n = 0; n < words.length; n++) {
      let testLine = line + words[n] + " ";
      let metrics = ctx.measureText(testLine);
      if (metrics.width > 900 && n > 0) {
        lines.push(line);
        line = words[n] + " ";
      } else {
        line = testLine;
      }
    }
    lines.push(line);

    let startY = (1920 / 2) - ((lines.length - 1) * 60);
    for(let i = 0; i < lines.length; i++) {
       ctx.fillText(lines[i], 1080 / 2, startY + (i * 120));
    }

    canvas.toBlob((blob) => {
      if(blob) {
          const file = new File([blob], "text-story.jpg", { type: "image/jpeg", lastModified: Date.now() });
          setPreviewFile(file);
          setPreviewUrl(URL.createObjectURL(file));
          setShowTextMode(false);
          setTextStoryContent("");
      }
    }, "image/jpeg", 0.9);
  };

  const handleUploadStory = async () => {
    if (!previewFile) return;

    try {
      setUploading(true); 
      if (playingAudio) {
          playingAudio.pause();
          setPlayingAudio(null);
      }

      let fileToUpload = previewFile;
      try {
        const options = { maxSizeMB: 1, maxWidthOrHeight: 1920, useWebWorker: true };
        const compressed = await imageCompression(previewFile, options);
        fileToUpload = new File([compressed], previewFile.name || "story.jpg", { type: compressed.type || "image/jpeg" });
      } catch (compressionErr) {
        console.log("Compression skipped", compressionErr);
      }

      const uploadRes: any = await dispatch(uploadImgPost([fileToUpload]));
      
      if (uploadRes.error) {
         throw new Error("Redux Rejected: " + JSON.stringify(uploadRes.payload || uploadRes.error.message));
      }

      const uploadData = uploadRes.payload;
      let imageUrl = "";

      if (Array.isArray(uploadData) && uploadData.length > 0) {
          imageUrl = uploadData[0].url || uploadData[0].secure_url;
      } else if (uploadData?.images && Array.isArray(uploadData.images)) {
          imageUrl = uploadData.images[0].url || uploadData.images[0].secure_url;
      } else if (uploadData?.url || uploadData?.secure_url) {
          imageUrl = uploadData.url || uploadData.secure_url;
      } else if (uploadData?.data && Array.isArray(uploadData.data)) {
          imageUrl = uploadData.data[0].url || uploadData.data[0].secure_url;
      }

      if (!imageUrl) {
          throw new Error("URL Missing in Response");
      }

      const currentToken = getFreshToken();

      const storyRes = await fetch("https://intwit-28qq.onrender.com/api/story", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${currentToken}`,
        },
        body: JSON.stringify({ 
          image: imageUrl,
          audioUrl: selectedMusic ? selectedMusic.url : "",
          text: storyText 
        }), 
      });

      const storyData = await storyRes.json();
      if (storyRes.ok) {
        setStories([...stories, storyData.newStory]); 
        alert("🎉 Story Uploaded Successfully!");
        closeEditor(); 
      } else {
        alert(storyData.msg || "Error uploading story to DB");
      }
    } catch (error: any) {
      console.error("Story Upload Catch Error:", error);
      alert("Upload Failed: " + (error.message || "Network Check Karo!"));
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteStory = async () => {
    const currentStory = selectedGroup?.items[currentIndex];
    if (!currentStory) return;
    
    const currentToken = getFreshToken();

    if (window.confirm("Are you sure you want to delete this story?")) {
      try {
        const res = await fetch(`https://intwit-28qq.onrender.com/api/story/${currentStory._id}`, {
          method: "DELETE",
          headers: { Authorization: `Bearer ${currentToken}` } 
        });
        
        if (res.ok) {
          setStories(stories.filter(s => s._id !== currentStory._id));
          setSelectedGroup(null); 
          alert("Story Deleted Successfully!");
        } else {
          const data = await res.json();
          alert(data.msg || "Failed to delete story.");
        }
      } catch (error) {
        console.error("Delete error:", error);
        alert("Network error, try again later.");
      }
    }
  };

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
  
  const groupedStories = Object.values(stories.reduce((acc: any, story) => {
    if (!acc[story.user._id]) {
      acc[story.user._id] = { user: story.user, items: [] };
    }
    acc[story.user._id].items.push(story);
    return acc;
  }, {}));

  const currentStory = selectedGroup?.items[currentIndex];
  const isMyStory = currentStory?.user._id === auth.user?._id;

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
          
          .live-gradient {
            background: linear-gradient(45deg, #ff0000 0%, #ff007f 100%);
            padding: 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
            animation: pulseLive 2s infinite;
          }
          
          .text-story-gradient {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 3px; border-radius: 50%; display: flex; align-items: center; justify-content: center;
          }

          @keyframes pulseLive {
            0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.4); }
            70% { box-shadow: 0 0 0 8px rgba(255, 0, 0, 0); }
            100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
          }
          
          @keyframes storyProgress { from { width: 0%; } to { width: 100%; } }
          .progress-bar-fill { height: 100%; background-color: white; border-radius: 5px; animation: storyProgress 15s linear forwards; }
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

        {/* 2. TEXT STORY BUTTON */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", minWidth: "70px" }} onClick={() => setShowTextMode(true)}>
          <div className="text-story-gradient">
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid white", backgroundColor: "#fff", display: "flex", justifyContent: "center", alignItems: "center", color: "#667eea", fontSize: "24px" }}>
              <FaFont />
            </div>
          </div>
          <span style={{ fontSize: "12px", marginTop: "5px", color: "#667eea", fontWeight: "bold" }}>Text Story</span>
        </div>

        {/* 3. GO LIVE BUTTON */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", minWidth: "70px" }} onClick={() => setShowLiveStream(true)}>
          <div className="live-gradient">
            <div style={{ width: "60px", height: "60px", borderRadius: "50%", border: "2px solid white", backgroundColor: "#fff", display: "flex", justifyContent: "center", alignItems: "center", color: "#ff004f", fontSize: "24px" }}>
              <FaVideo />
            </div>
          </div>
          <span style={{ fontSize: "12px", marginTop: "5px", color: "#ff004f", fontWeight: "bold" }}>Go Live</span>
        </div>

        {/* 4. Fetched Stories */}
        {loading ? <StorySkeleton /> : groupedStories.map((group: any) => (
          <div key={group.user._id} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", minWidth: "70px" }} onClick={() => { setSelectedGroup(group); setCurrentIndex(0); }}>
            <div className="story-gradient">
              <img src={group.user.avatar} alt={group.user.username} className="story-img" />
            </div>
            <span style={{ fontSize: "12px", marginTop: "5px", color: "#262626", fontWeight: "500" }}>
              {group.user.username.length > 10 ? group.user.username.substring(0, 10) + "..." : group.user.username}
            </span>
          </div>
        ))}
      </div>

      {/* TEXT STORY EDITOR MODAL */}
      {showTextMode && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: `linear-gradient(135deg, ${gradients[bgIndex][0]} 0%, ${gradients[bgIndex][1]} 100%)` }}>
          <button onClick={() => setShowTextMode(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: "30px", cursor: "pointer", width: "45px", height: "45px", borderRadius: "50%" }}>&times;</button>
          <button onClick={() => setBgIndex((prev) => (prev + 1) % gradients.length)} style={{ position: "absolute", top: "20px", left: "20px", background: "rgba(0,0,0,0.5)", border: "none", color: "white", padding: "10px 15px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold" }}>🎨 Change Color</button>
          <textarea autoFocus placeholder="Tap to type..." value={textStoryContent} onChange={(e) => setTextStoryContent(e.target.value)} style={{ background: "transparent", border: "none", color: "white", fontSize: "40px", fontWeight: "bold", textAlign: "center", width: "90%", height: "50%", resize: "none", outline: "none", textShadow: "2px 2px 5px rgba(0,0,0,0.3)" }} />
          <button onClick={handleTextStoryDone} style={{ position: "absolute", bottom: "40px", background: "white", color: "black", padding: "12px 30px", fontSize: "18px", fontWeight: "bold", borderRadius: "30px", border: "none", cursor: "pointer", boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}>Done</button>
        </div>
      )}

      {/* LIVE STREAM MODAL */}
      {showLiveStream && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 999999, backgroundColor: "#000" }}>
          <button onClick={() => setShowLiveStream(false)} style={{ position: "absolute", top: "20px", right: "20px", background: "rgba(0,0,0,0.5)", border: "none", color: "white", fontSize: "30px", cursor: "pointer", width: "45px", height: "45px", borderRadius: "50%", zIndex: 100 }}>&times;</button>
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
                <input type="text" placeholder="Search Music..." className="music-search-input" style={{ margin: 0 }} value={searchMusicText} onChange={(e) => setSearchMusicText(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && searchMusicFromAPI()} />
                <button onClick={searchMusicFromAPI} style={{ padding: '8px 12px', background: '#0095f6', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>{loadingMusic ? "..." : "Find"}</button>
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
             
             <div style={{ position: "absolute", top: "40%", width: "80%", maxWidth: "400px", zIndex: 5 }}>
                {showMentionDropdown && filteredUsers.length > 0 && (
                  <div className="mention-dropdown shadow" style={{ position: 'absolute', bottom: '100%', left: '0', backgroundColor: 'rgba(0,0,0,0.8)', border: '1px solid #555', borderRadius: '8px', zIndex: 10, width: '100%', maxHeight: '150px', overflowY: 'auto' }}>
                    {filteredUsers.map((u, idx) => (
                      <div key={idx} onClick={() => handleMentionSelect(u.username)} style={{ padding: '10px 15px', cursor: 'pointer', borderBottom: '1px solid #333', display: 'flex', alignItems: 'center', gap: '10px', color: 'white' }}>
                        <img src={u.avatar || "https://via.placeholder.com/150"} alt="dp" style={{width: '25px', height: '25px', borderRadius: '50%'}} />
                        <strong style={{fontSize: '14px'}}>@{u.username}</strong>
                      </div>
                    ))}
                  </div>
                )}
                <input ref={textInputRef} type="text" placeholder="Add a caption or @mention..." value={storyText} onChange={handleTextChange} style={{ width: "100%", padding: "12px", background: "rgba(0,0,0,0.6)", color: "white", border: "2px dashed #fff", borderRadius: "10px", fontSize: "16px", outline: "none", textAlign: "center", textShadow: "1px 1px 2px rgba(0,0,0,0.8)" }} />
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
            <button onClick={handleUploadStory} disabled={uploading} style={{ background: "white", border: "none", width: "45px", height: "45px", borderRadius: "50%", fontSize: "20px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>&gt;</button>
          </div>
        </div>
      )}

      {/* STORY VIEWER MODAL - MULTI STORY VIEWER */}
      {selectedGroup && currentStory && (
        <div className="story-viewer-modal" style={{ position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", backgroundColor: "#111", zIndex: 9999, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center" }}>
          
          <div style={{ position: "absolute", top: "10px", width: "95%", display: "flex", gap: "5px", zIndex: 10 }}>
             {selectedGroup.items.map((_: any, idx: number) => (
                <div key={idx} style={{ height: "3px", flex: 1, backgroundColor: idx < currentIndex ? "white" : "rgba(255,255,255,0.3)", borderRadius: "5px", overflow: "hidden" }}>
                   {idx === currentIndex && <div className="progress-bar-fill"></div>}
                </div>
             ))}
          </div>

          <div style={{ position: "absolute", top: "25px", left: "20px", display: "flex", alignItems: "center", gap: "10px", width: "100%", zIndex: 10 }}>
            <img src={currentStory.user.avatar} alt="Avatar" style={{ width: "40px", height: "40px", borderRadius: "50%", border: "2px solid white", objectFit: "cover" }} />
            <div style={{ display: "flex", flexDirection: "column" }}>
               <span style={{ color: "white", fontWeight: "bold", fontSize: "14px" }}>
                  {currentStory.user.username} <span style={{ color: "#aaa", fontSize: "12px", marginLeft: "5px" }}>2h</span>
               </span>
               <span style={{ color: "white", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}>
                  🎵 {currentStory.user.username} · {currentStory.audioUrl ? "Music playing..." : "Original Audio"}
               </span>
            </div>
          </div>

          <button onClick={() => setSelectedGroup(null)} style={{ position: "absolute", top: "25px", right: "20px", background: "none", border: "none", color: "white", fontSize: "35px", cursor: "pointer", zIndex: 15 }}>&times;</button>
          
          <div style={{ position: "absolute", top: "80px", bottom: "80px", left: 0, width: "50%", zIndex: 5 }} onClick={handlePrevStory}></div>
          <div style={{ position: "absolute", top: "80px", bottom: "80px", right: 0, width: "50%", zIndex: 5 }} onClick={handleNextStory}></div>

          <div style={{ position: "relative", width: "100%", height: "100%", display: "flex", justifyContent: "center", alignItems: "center" }}>
            <img key={currentStory._id} src={currentStory.image} alt="Story content" style={{ maxHeight: "75vh", maxWidth: "100vw", objectFit: "contain", marginTop: "20px" }} />
            
            {currentStory.text && (
              <div style={{ position: "absolute", top: "40%", width: "80%", maxWidth: "400px", textAlign: "center", background: "rgba(0,0,0,0.4)", padding: "10px", borderRadius: "10px", pointerEvents: "none" }}>
                <h3 style={{ color: "white", margin: 0, textShadow: "1px 1px 3px black" }}>
                  {renderContentWithMentions(currentStory.text)}
                </h3>
              </div>
            )}
          </div>

          {/* 🔥 UPDATE YAHAN HUA HAI (BOTTOM ACTION BAR) 🔥 */}
          <div style={{ position: "absolute", bottom: "20px", width: "100%", padding: "0 20px", display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 10 }}>
             {!isMyStory ? (
               <div style={{ display: "flex", alignItems: "center", width: "100%", gap: "15px" }}>
                 <div style={{ position: "relative", flex: 1 }}>
                   <input 
                     type="text" 
                     placeholder={`Reply to ${currentStory.user.username}...`} 
                     value={replyText}
                     onChange={(e) => setReplyText(e.target.value)}
                     onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                     style={{ background: "transparent", border: "1px solid white", borderRadius: "30px", padding: "10px 60px 10px 20px", color: "white", width: "100%", outline: "none" }} 
                   />
                   {replyText.trim().length > 0 && (
                     <button 
                       onClick={handleSendReply} 
                       style={{ position: "absolute", right: "15px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", color: "white", fontWeight: "bold", cursor: "pointer", fontSize: "14px", zIndex: 20 }}
                     >
                       Send
                     </button>
                   )}
                 </div>
                 <button className="like-btn" onClick={() => setIsLiked(!isLiked)}>{isLiked ? "❤️" : "🤍"}</button>
               </div>
             ) : (
               <div style={{ width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0 20px" }}>
                 <span style={{ color: "white", fontWeight: "bold", display: "flex", alignItems: "center", gap: "5px" }}>
                   👁️ 0 Views
                 </span>
                 <button 
                    onClick={handleDeleteStory}
                    style={{ background: "rgba(255, 0, 0, 0.7)", color: "white", border: "none", padding: "8px 15px", borderRadius: "20px", cursor: "pointer", fontWeight: "bold", display: "flex", gap: "5px", alignItems: "center", zIndex: 20 }}
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