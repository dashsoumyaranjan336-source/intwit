import React from "react";
import Helmet from "../components/Helmet";
import PostList from "../components/home/PostList";
import SuggestionUser from "../components/home/SuggestionUser";
import StoriesBar from "../components/Story"; // 🚨 NAYA: StoriesBar import kiya

const Home: React.FC = () => {
  return (
    <Helmet title="Home | intwit">
      <div className="home-container" style={{ 
        display: "flex", 
        justifyContent: "space-between", 
        padding: "20px",
        maxWidth: "1100px",
        margin: "0 auto" 
      }}>
        
        {/* Posts wala area */}
        <div className="posts-section" style={{ flex: "1", maxWidth: "630px" }}>
          
          {/*  NEW INSTAGRAM STORIES BAR YAHAN DIKHEGA  */}
          <StoriesBar />
          
          <PostList />
        </div>

        {/* Suggestion wala area */}
        <div className="suggestions-section" style={{ width: "320px", marginLeft: "30px" }}>
           <div style={{ position: "sticky", top: "20px" }}>
              <SuggestionUser />
           </div>
        </div>

      </div>
    </Helmet>
  );
};

export default Home;