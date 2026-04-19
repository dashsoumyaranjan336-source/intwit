import React, { useState } from 'react';
import AgoraUIKit from 'agora-react-uikit';

const LiveStream: React.FC = () => {
  const [videoCall, setVideoCall] = useState<boolean>(false);

  const rtcProps: any = {
    appId: process.env.REACT_APP_AGORA_APP_ID || '1184f588ed7d413fbf827463844cb26e', 
    channel: 'intwit_live', 
    token: null, 
    role: 'host', 
    layout: 1 
  };

  const callbacks = {
    EndCall: () => setVideoCall(false),
  };

  return (
    // Parent container jisko fix height/width deni zaroori hai
    <div style={{ display: 'flex', width: '100vw', height: '100vh', flexDirection: 'column', backgroundColor: '#111' }}>
      
      {videoCall ? (
        // 🔴 MAGIC FIX: Yahan flex: 1 diya hai, aur styleProps ke andar UIKitContainer ko 100% kiya hai
        <div style={{ flex: 1, position: 'relative', width: '100%', height: '100%' }}>
          <AgoraUIKit 
            rtcProps={rtcProps} 
            callbacks={callbacks} 
            styleProps={{
                UIKitContainer: { height: '100%', width: '100%' }, // 🔴 NAYA: Agora ko full height lene par majboor kiya
                localBtnContainer: { backgroundColor: 'rgba(0,0,0,0.6)', paddingBottom: '30px' } 
            }} 
          />
        </div>
      ) : (
        // START LIVE SCREEN
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
          <h2 style={{ marginBottom: '30px', fontSize: '36px', fontWeight: 'bold', color: 'white' }}>Intwit Live 🔴</h2>
          
          <button 
            onClick={() => setVideoCall(true)}
            style={{ 
                padding: '15px 40px', 
                backgroundColor: '#e1306c', 
                color: 'white', 
                fontSize: '20px', 
                borderRadius: '30px', 
                border: 'none', 
                cursor: 'pointer', 
                fontWeight: 'bold',
                boxShadow: '0 4px 15px rgba(225, 48, 108, 0.4)'
            }}
          >
            🎥 Start Live Stream
          </button>
        </div>
      )}
    </div>
  );
};

export default LiveStream;