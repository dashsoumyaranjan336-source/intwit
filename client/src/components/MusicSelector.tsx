import React, { useState } from 'react';

interface Props {
    onSelect: (url: string) => void;
}

const MusicSelector: React.FC<Props> = ({ onSelect }) => {
    const [songs, setSongs] = useState<any[]>([]);
    const [search, setSearch] = useState('');
    const [loading, setLoading] = useState(false);
    
    // Gaana play/pause karne ke liye state
    const [playingAudio, setPlayingAudio] = useState<HTMLAudioElement | null>(null);

    const searchMusic = async () => {
        if (!search) return;
        setLoading(true);
        try {
            // iTunes API - Best for free 30s music previews
            const res = await fetch(`https://itunes.apple.com/search?term=${search}&entity=song&limit=5`);
            const data = await res.json();
            setSongs(data.results);
        } catch (error) {
            console.error("Error fetching music", error);
        }
        setLoading(false);
    };

    const playPreview = (url: string) => {
        // Agar pehle se koi gaana chal raha hai, toh usko band karo
        if (playingAudio) {
            playingAudio.pause(); 
        }
        const audio = new Audio(url);
        audio.play();
        setPlayingAudio(audio);
    };

    const handleSelect = (url: string) => {
        // Select karte hi preview music band ho jana chahiye
        if (playingAudio) {
            playingAudio.pause(); 
        }
        onSelect(url);
        alert("Music Selected Successfully! 🎵");
    };

    return (
        <div className="music-selector">
            <div style={{ display: 'flex', gap: '5px' }}>
                <input 
                    type="text" 
                    value={search} 
                    onChange={e => setSearch(e.target.value)} 
                    placeholder="Search Music (e.g. Believer)..." 
                    style={{ padding: '8px', width: '70%', borderRadius: '4px', border: 'none', background: '#333', color: 'white' }}
                />
                <button 
                    onClick={searchMusic} 
                    type="button" 
                    style={{ padding: '8px 15px', borderRadius: '4px', border: 'none', cursor: 'pointer', background: '#1DA1F2', color: 'white', fontWeight: 'bold' }}
                >
                    {loading ? '...' : 'Find'}
                </button>
            </div>
            
            <div className="song-results" style={{ maxHeight: '200px', overflowY: 'auto', marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {songs.map((song: any) => (
                    <div key={song.trackId} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px', background: '#222', borderRadius: '8px' }}>
                        
                        {/* Song Art & Details */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={song.artworkUrl60} alt="cover" style={{ width: '40px', height: '40px', borderRadius: '4px' }} />
                            <div>
                                <p style={{ margin: 0, color: 'white', fontSize: '14px', width: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{song.trackName}</p>
                                <p style={{ margin: 0, color: '#aaa', fontSize: '12px' }}>{song.artistName}</p>
                            </div>
                        </div>
                        
                        {/* Play & Select Buttons */}
                        <div style={{ display: 'flex', gap: '5px' }}>
                            <button 
                                type="button" 
                                onClick={() => playPreview(song.previewUrl)} 
                                style={{ padding: '5px 10px', background: '#555', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                            >
                                ▶️
                            </button>
                            <button 
                                type="button" 
                                onClick={() => handleSelect(song.previewUrl)} 
                                style={{ padding: '5px 10px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
                            >
                                Select
                            </button>
                        </div>

                    </div>
                ))}
            </div>
        </div>
    );
};

export default MusicSelector;