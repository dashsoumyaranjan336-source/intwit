import React, { useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../redux/store';

interface IProps {
    postUrl: string;
    closeModal: () => void;
}

const ShareModal: React.FC<IProps> = ({ postUrl, closeModal }) => {
    const { auth } = useSelector((state: RootState) => state);
    const [search, setSearch] = useState("");

    // Following list filter kar rahe hain search ke hisaab se
    const friends = auth.user?.following.filter(u => 
        u.username.toLowerCase().includes(search.toLowerCase())
    ) || [];

    const handleSend = (username: string) => {
        // Yahan tera messaging logic aayega (Optional)
        alert(`✅ Post sent to @${username}`);
        // Agar Inbox feature hai toh yahan Socket emit kar sakte ho
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(postUrl);
        alert("🔗 Link Copied to clipboard!");
    };

    return (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 10000, display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={closeModal}>
            <div style={{ background: 'white', width: '400px', borderRadius: '15px', overflow: 'hidden' }} onClick={e => e.stopPropagation()}>
                <div style={{ padding: '15px', borderBottom: '1px solid #efefef', textAlign: 'center', position: 'relative' }}>
                    <strong style={{ fontSize: '16px' }}>Share</strong>
                    <span onClick={closeModal} style={{ position: 'absolute', right: '15px', cursor: 'pointer', fontSize: '20px' }}>&times;</span>
                </div>

                <div style={{ padding: '10px' }}>
                    <input 
                        type="text" 
                        placeholder="Search..." 
                        style={{ width: '100%', padding: '8px 12px', border: 'none', background: '#efefef', borderRadius: '8px', outline: 'none' }}
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                </div>

                <div style={{ maxHeight: '300px', overflowY: 'auto', padding: '10px' }}>
                    {friends.length > 0 ? friends.map(user => (
                        <div key={user._id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 0' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <img src={user.avatar} style={{ width: '45px', height: '45px', borderRadius: '50%', objectFit: 'cover' }} alt="" />
                                <div>
                                    <p style={{ margin: 0, fontWeight: 'bold', fontSize: '14px' }}>{user.username}</p>
                                    <p style={{ margin: 0, color: '#8e8e8e', fontSize: '13px' }}>{user.fullname}</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => handleSend(user.username)}
                                style={{ background: '#0095f6', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '8px', fontWeight: 'bold', fontSize: '13px' }}
                            >
                                Send
                            </button>
                        </div>
                    )) : <p style={{ textAlign: 'center', color: '#8e8e8e' }}>No friends found</p>}
                </div>

                <div style={{ padding: '15px', borderTop: '1px solid #efefef', display: 'flex', justifyContent: 'space-around' }}>
                    <button onClick={handleCopy} style={{ background: 'none', border: 'none', color: '#0095f6', fontWeight: 'bold', cursor: 'pointer' }}>🔗 Copy Link</button>
                </div>
            </div>
        </div>
    );
};

export default ShareModal;