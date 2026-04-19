import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../redux/store";
import { FaPlus } from "react-icons/fa";

const StoriesBar = () => {
  const { auth } = useSelector((state: RootState) => state);
  const currentUser = auth?.user;

  // Abhi ke liye dummy data taaki UI dikhe. Baad mein isko backend se connect karenge!
  const dummyStories = [
    { id: 1, username: "anshu", avatar: "https://i.pravatar.cc/150?img=3" },
    { id: 2, username: "joo", avatar: "https://i.pravatar.cc/150?img=4" },
    { id: 3, username: "rahul_dev", avatar: "https://i.pravatar.cc/150?img=11" },
    { id: 4, username: "neha.123", avatar: "https://i.pravatar.cc/150?img=5" },
    { id: 5, username: "vikas_coder", avatar: "https://i.pravatar.cc/150?img=8" },
    { id: 6, username: "pooja_sh", avatar: "https://i.pravatar.cc/150?img=9" },
    { id: 7, username: "rohan99", avatar: "https://i.pravatar.cc/150?img=12" },
  ];

  return (
    <div 
      className="stories-container bg-white" 
      style={{
        display: "flex",
        overflowX: "auto",
        padding: "15px 0",
        marginBottom: "20px",
        border: "1px solid #dbdbdb",
        borderRadius: "8px",
        gap: "15px",
        scrollbarWidth: "none", // Firefox me scrollbar chupane ke liye
      }}
    >
      <style>
        {`
          /* Chrome aur Safari me scrollbar chupane ke liye */
          .stories-container::-webkit-scrollbar {
            display: none; 
          }
          /* Instagram jaisi colorful ring */
          .story-gradient {
            background: linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%);
            padding: 3px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
          .story-img {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            border: 2px solid white;
            object-fit: cover;
          }
        `}
      </style>

      {/* 1. Tumhari khud ki story (Add Story / Live ka button) */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", position: "relative", marginLeft: "15px" }}>
        <img 
          src={currentUser?.avatar || "https://via.placeholder.com/150"} 
          alt="Your Story" 
          style={{ width: "66px", height: "66px", borderRadius: "50%", objectFit: "cover" }}
        />
        
        {/* Blue Plus Icon (+) */}
        <div style={{
          position: "absolute",
          bottom: "20px",
          right: "0",
          background: "#0095f6",
          color: "white",
          borderRadius: "50%",
          width: "22px",
          height: "22px",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          border: "2px solid white",
          fontSize: "12px"
        }}>
          <FaPlus />
        </div>
        <span style={{ fontSize: "12px", marginTop: "5px", color: "#262626" }}>Your Story</span>
      </div>

      {/* 2. Doston ki stories (Gradient border ke sath) */}
      {dummyStories.map((story) => (
        <div key={story.id} style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer" }}>
          <div className="story-gradient">
            <img src={story.avatar} alt={story.username} className="story-img" />
          </div>
          <span style={{ fontSize: "12px", marginTop: "5px", color: "#262626" }}>
            {story.username.length > 10 ? story.username.substring(0, 10) + "..." : story.username}
          </span>
        </div>
      ))}
    </div>
  );
};

export default StoriesBar;