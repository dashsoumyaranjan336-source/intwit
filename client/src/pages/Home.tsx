import React from "react";
import Helmet from "../components/Helmet";
import PostList from "../components/home/PostList";
import SuggestionUser from "../components/home/SuggestionUser";
import StoriesBar from "../components/Story"; 
import "./Home.css"; // 🚨 NAYA: Yahan humne apni CSS file link kar di

const Home: React.FC = () => {
  return (
    <Helmet title="Home | intwit">
      <div className="home-container">
        
        {/* Posts wala area */}
        <div className="posts-section">
          <StoriesBar />
          <PostList />
        </div>

        {/* Suggestion wala area */}
        <div className="suggestions-section">
           <div className="sticky-suggestion">
              <SuggestionUser />
           </div>
        </div>

      </div>
    </Helmet>
  );
};

export default Home;