import React, { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import ReelCard from '../components/ReelCard'; 

const Reels: React.FC = () => {
    const [reels, setReels] = useState([]);
    const [loading, setLoading] = useState(false);
    const { auth } = useSelector((state: any) => state);

    useEffect(() => {
        // 🚨 NAYA: SMART TOKEN LOGIC (Jaise CreateReel mein kiya tha)
        const token = auth?.token || auth?.user?.token || localStorage.getItem("token");

        const getReels = async () => {
            setLoading(true);
            try {
                const res = await fetch('/api/reels', {
                    headers: { 'Authorization': `Bearer ${token}` } // Naya solid token
                });
                
                const data = await res.json();
                console.log("🎬 BACKEND SE REELS AAYI:", data); // F12 Dabane par dikhega

                if (data.reels) {
                    // Privacy & Block Filter
                    const filtered = data.reels.filter((reel: any) => {
                        if (!reel.user) return false;
                        
                        const isBlocked = auth.user?.blocking?.includes(reel.user._id) || 
                                          (auth.user?.followers?.includes(reel.user._id) === false && reel.user.isPrivate);
                        
                        if (reel.user.isPrivate && reel.user._id !== auth.user?._id) {
                            return reel.user.followers?.includes(auth.user?._id);
                        }
                        return !auth.user?.blocking?.includes(reel.user._id);
                    });

                    setReels(filtered);
                } else {
                    setReels([]);
                }
            } catch (err) {
                console.log("Fetch Error:", err);
            }
            setLoading(false);
        };

        // Agar token hai, tabhi reels fetch karo
        if (token) {
            getReels();
        } else {
            console.log(" Token nahi mila, F12 check kar");
        }
    }, [auth]);

    return (
        <div style={{ marginLeft: '16vw', width: '84vw', height: '100vh', display: 'flex', justifyContent: 'center', background: '#fafafa' }}>
            
            <div className="reels_page" style={{ 
                width: '100%',
                maxWidth: '450px', 
                height: '100vh', 
                overflowY: 'scroll', 
                scrollSnapType: 'y mandatory',
                background: '#000',
                scrollbarWidth: 'none' 
            }}>
                <style>
                    {`
                    .reels_page::-webkit-scrollbar {
                        display: none; 
                    }
                    `}
                </style>
                
                {loading ? (
                    <div style={{color: 'white', textAlign: 'center', marginTop: '50px', fontSize: '18px', fontWeight: 'bold'}}>
                        Loading Reels... ⏳
                    </div>
                ) : (
                    reels.map((reel: any) => (
                        <div key={reel._id} style={{ scrollSnapAlign: 'start', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <ReelCard reel={reel} />
                        </div>
                    ))
                )}
                
                {reels.length === 0 && !loading && (
                    <div style={{color: 'white', textAlign: 'center', marginTop: '50px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%'}}>
                        <h2>No Reels Found 🎬</h2>
                        <p style={{color: '#aaa'}}>Ek nayi reel create karo ya kisi ko follow karo!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Reels;