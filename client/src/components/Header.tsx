import React from "react";
import { Link } from "react-router-dom";

const Header: React.FC = () => {
  return (
    <div 
      className="main-header" 
      style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        padding: '15px 30px', 
        background: '#111', 
        color: 'white', 
        alignItems: 'center',
        borderBottom: '1px solid #333'
      }}
    >
      {/* Logo */}
      <div className="logo">
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '24px', fontWeight: 'bold' }}>
          Intwit
        </Link>
      </div>
      
      {/* Navigation Links */}
      <div className="nav-links" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <Link to="/" style={{ color: 'white', textDecoration: 'none', fontSize: '18px' }}>🏠 Home</Link>
        <Link to="/explore" style={{ color: 'white', textDecoration: 'none', fontSize: '18px' }}>🔍 Explore</Link>
        <Link to="/direct/inbox" style={{ color: 'white', textDecoration: 'none', fontSize: '18px' }}>💬 Messages</Link>
        
        {/* Tere Naye Features */}
        <Link 
          to="/create-reel" 
          style={{ color: '#1DA1F2', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold', padding: '5px 10px', border: '1px solid #1DA1F2', borderRadius: '5px' }}
        >
          🎬 Create Reel
        </Link>
        <Link 
          to="/live" 
          style={{ color: 'white', background: 'red', textDecoration: 'none', fontSize: '18px', fontWeight: 'bold', padding: '5px 10px', borderRadius: '5px' }}
        >
          🔴 Live
        </Link>
      </div>
    </div>
  );
};

export default Header;