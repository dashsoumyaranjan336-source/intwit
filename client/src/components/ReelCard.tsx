import React, { useRef, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom'; // 🔥 Mentions ko link banane ke liye

interface ReelCardProps {
    reel: any;
}

// 🔥 Helper function for Blue Clickable Mentions in Reel Caption
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

const ReelCard: React.FC<ReelCardProps> = ({ reel }) => {
    const { auth } = useSelector((state: any) => state);
    const videoRef = useRef<HTMLVideoElement>(null);
    const audioRef = useRef<HTMLAudioElement>(null); 
    
    const [playing, setPlaying] = useState(false);
    const [isLike, setIsLike] = useState(false);
    const [loadLike, setLoadLike] = useState(false);
    const [likesCount, setLikesCount] = useState(reel.likes?.length || 0);

    useEffect(() => {
        if (reel.likes?.includes(auth.user._id)) {
            setIsLike(true);
        }
    }, [reel.likes, auth.user._id]);

    const handleVideoClick = () => {
        if (playing) {
            videoRef.current?.pause();
            audioRef.current?.pause(); 
            setPlaying(false);
        } else {
            videoRef.current?.play();
            audioRef.current?.play();  
            setPlaying(true);
        }
    };

    const handleLike = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Taaki video play/pause na ho jaye
        if (loadLike) return; 
        setLoadLike(true);
        
        try {
            if (isLike) {
                setIsLike(false);
                setLikesCount(likesCount - 1); 
                await fetch(`/api/reel/${reel._id}/unlike`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${auth.token}` } 
                });
            } else {
                setIsLike(true);
                setLikesCount(likesCount + 1); 
                await fetch(`/api/reel/${reel._id}/like`, {
                    method: 'PATCH',
                    headers: { 'Authorization': `Bearer ${auth.token}` } 
                });
            }
        } catch (err) {
            console.error(err);
        }
        setLoadLike(false);
    };

    // 🔥 NAYA ADVANCED SHARE FUNCTION 🔥
    const handleShare = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Taaki click karne pe video pause na ho
        const reelUrl = `${window.location.origin}/reels/${reel._id}`; 
        
        try {
            if (navigator.share) {
                // Mobile native share menu
                await navigator.share({
                    title: `Check out ${reel.user?.username}'s reel on Intwit`,
                    url: reelUrl
                });
            } else {
                // PC fallback (Copy to clipboard)
                const textArea = document.createElement("textarea");
                textArea.value = reelUrl;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand("copy");
                document.body.removeChild(textArea);
                alert("🔗 Reel Link Copied! Ab doston ko bhej de.");
            }
        } catch (err) {
            console.error("Share cancel ho gaya ya fail hua: ", err);
        }
    };

    return (
        <div className="reel_card" style={{ 
            position: 'relative', 
            height: '100%', 
            width: '100%', 
            maxWidth: '500px', 
            margin: '0 auto', 
            background: '#000',
            borderBottom: '1px solid #333'
        }}>
            {/* 1. Video Player */}
            <video 
                ref={videoRef}
                src={reel.videoUrl} 
                className={reel.filterName} 
                onClick={handleVideoClick}
                style={{ width: '100%', height: '100%', objectFit: 'cover', cursor: 'pointer' }}
                loop
            />

            {/* 2. Hidden Audio Player */}
            {reel.audioUrl && (
                <audio ref={audioRef} src={reel.audioUrl} loop />
            )}
            
            {/* 3. User Info & Caption (Bottom Left) */}
            <div style={{ position: 'absolute', bottom: '30px', left: '15px', color: '#fff', textShadow: '1px 1px 5px rgba(0,0,0,0.8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <img 
                        src={reel.user?.avatar} 
                        alt="avatar" 
                        style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover' }} 
                    />
                    <h4 style={{ margin: 0 }}>@{reel.user?.username}</h4>
                </div>
                {/* 🔥 YAHAN MENTION FUNCTION APPLY KIYA HAI 🔥 */}
                <p style={{ fontSize: '15px', marginTop: '10px', maxWidth: '80%' }}>
                    {renderContentWithMentions(reel.caption)}
                </p>
            </div>

            {/* 4. Action Buttons - Like, View & Share (Right Side) */}
            <div style={{ position: 'absolute', right: '15px', bottom: '50px', display: 'flex', flexDirection: 'column', gap: '25px', alignItems: 'center' }}>
                
                {/* Like Button */}
                <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleLike}>
                    <span style={{ fontSize: '28px', color: isLike ? 'red' : 'white', transition: '0.2s' }}>
                        {isLike ? '❤️' : '🤍'}
                    </span>
                    <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>{likesCount}</p>
                </div>

                {/* View Count */}
                <div style={{ textAlign: 'center' }}>
                    <span style={{ fontSize: '28px', color: 'white' }}>👁️</span>
                    <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '14px', fontWeight: 'bold' }}>{reel.views || 0}</p>
                </div>

                {/* 🔥 SHARE BUTTON 🔥 */}
                <div style={{ textAlign: 'center', cursor: 'pointer' }} onClick={handleShare}>
                    <span style={{ fontSize: '28px', color: 'white', textShadow: '1px 1px 5px rgba(0,0,0,0.8)' }}>📤</span>
                    <p style={{ color: 'white', margin: '5px 0 0 0', fontSize: '12px', fontWeight: 'bold' }}>Share</p>
                </div>

            </div>

            {/* Play/Pause Indicator */}
            {!playing && (
                <div style={{ 
                    position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                    fontSize: '60px', color: 'rgba(255,255,255,0.7)', pointerEvents: 'none' 
                }}>
                    ▶️
                </div>
            )}
        </div>
    );
};

export default ReelCard;