import React from 'react';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

const ReelBox: React.FC = () => {
    // Redux se saari fetched reels nikal rahe hain
    const { reels } = useSelector((state: any) => state.reels);

    return (
        <div className="reel-box-container" style={{
            display: 'flex',
            gap: '15px',
            overflowX: 'auto',
            padding: '15px 10px',
            background: '#000', // Dark theme ke liye
            borderBottom: '1px solid #333',
            marginBottom: '20px',
            scrollbarWidth: 'none', // Firefox se scrollbar hatane ke liye
        }}>
            {/* CSS to hide scrollbar in Chrome/Safari */}
            <style>
                {`
                .reel-box-container::-webkit-scrollbar {
                    display: none;
                }
                `}
            </style>

            {/* 1. Nayi Reel Banane ka Button (+) */}
            <Link to="/create-reel" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                <div style={{
                    width: '60px', height: '60px', borderRadius: '50%',
                    border: '2px dashed #1DA1F2', display: 'flex',
                    alignItems: 'center', justifyContent: 'center',
                    background: '#111', cursor: 'pointer'
                }}>
                    <span style={{ fontSize: '28px', color: '#1DA1F2', marginBottom: '4px' }}>+</span>
                </div>
                <small style={{ color: '#aaa', marginTop: '6px', fontSize: '12px', fontWeight: 'bold' }}>Add Reel</small>
            </Link>

            {/* 2. Database se aayi hui Reels ki list */}
            {reels && reels.map((reel: any, index: number) => (
                <Link key={reel._id || index} to="/reels" style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '70px' }}>
                    
                    {/* Instagram jaisa Gradient Border */}
                    <div style={{
                        width: '62px', height: '62px', borderRadius: '50%',
                        padding: '2px', 
                        background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                        cursor: 'pointer'
                    }}>
                        <img
                            src={reel.user?.avatar}
                            alt="avatar"
                            style={{
                                width: '100%', height: '100%', borderRadius: '50%',
                                border: '2px solid #000', objectFit: 'cover'
                            }}
                        />
                    </div>
                    
                    {/* User ka naam (Agar lamba hua toh '...' aayega) */}
                    <small style={{ 
                        color: 'white', marginTop: '6px', fontSize: '12px', 
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', 
                        width: '65px', textAlign: 'center' 
                    }}>
                        {reel.user?.username}
                    </small>
                </Link>
            ))}
        </div>
    );
};

export default ReelBox;