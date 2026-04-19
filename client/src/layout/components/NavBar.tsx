import React, { useState, useEffect } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { RxDotFilled } from "react-icons/rx";
import { BiMoviePlay } from "react-icons/bi"; // 🚨 NAYA: Reels ke liye icon

import {
  CreateIcon,
  ExploreIcon,
  MessagesIcon,
  HomeIcon,
  SearchIcon,
  SettingsIcon,
  HomeActiveIcon,
  ExploreActiveIcon,
  MessagesActiveIcon,
  CreateActiveIcon,
  SettingsActiveIcon,
  SearchActiveIcon,
  LikeIcon,
  NotificationActiveIcon,
} from "../../components/Icons";

import { logout } from "../../redux/features/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import {
  setIsNotificationGlobalState,
  setIsSearchGlobalState,
  setIsUploadGlobalState,
} from "../../redux/features/GlobalStateSlice";
import { IConversation } from "../../utils/interface";

const NavBar: React.FC = () => {
  const [isMenuMore, setIsMenuMore] = useState<boolean>(false);
  // 🚨 NAYA: Create menu dropdown ka state
  const [isCreateDropdown, setIsCreateDropdown] = useState<boolean>(false); 
  
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const { globalState } = useSelector((state: RootState) => state);
  const { isSearchGlobalState, isNotificationGlobalState } = globalState;
  const { isUploadGlobalState } = globalState;

  const dispatch: AppDispatch = useDispatch();
  const navigate = useNavigate();

  const { auth } = useSelector((state: RootState) => state);
  const { notification } = useSelector((state: RootState) => state);
  const { conversation } = useSelector((state: RootState) => state);

  const location = useLocation();

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleSearch = () => {
    if (globalState.isNotificationGlobalState === true) {
      dispatch(setIsNotificationGlobalState());
    }
    dispatch(setIsSearchGlobalState());
  };
  const handleNotification = () => {
    if (globalState.isSearchGlobalState === true) {
      dispatch(setIsSearchGlobalState());
    }
    dispatch(setIsNotificationGlobalState());
  };

  const handleSearchAndNotif = () => {
    if (
      globalState.isSearchGlobalState === true ||
      globalState.isNotificationGlobalState === true
    ) {
      return true;
    }
    return false;
  };
  const handleCloseSearchAndNotif = () => {
    if (globalState.isNotificationGlobalState === true) {
      dispatch(setIsNotificationGlobalState());
    }
    if (globalState.isSearchGlobalState === true) {
      dispatch(setIsSearchGlobalState());
    }
  };
  
  const newMessage: IConversation[] = [];

  conversation.data!.map((data: IConversation) => {
    if (data.isRead === false && data.recipients[1]._id === auth.user!._id) {
      newMessage.push(data);
    }
  });

  // Create menu handlers
  const openCreatePost = () => {
    setIsCreateDropdown(false);
    dispatch(setIsUploadGlobalState());
  };

  const openCreateReel = () => {
    setIsCreateDropdown(false);
    navigate("/create-reel");
  };

  return (
    <div
      className="navbar-container"
      style={{
        width: handleSearchAndNotif() ? "5rem" : undefined,
      }}
    >
      <div className="navbar-wrapper">
        <Link
          to="/"
          style={{
            textAlign: handleSearchAndNotif() ? "center" : undefined,
            textDecoration: "none" 
          }}
          onClick={handleCloseSearchAndNotif}
        >
          <h1
            className="intwit-logo"
            style={{
              fontFamily: "'Grand Hotel', cursive",
              fontSize: handleSearchAndNotif() ? "2rem" : "2.5rem",
              color: "var(--text-color, #262626)",
              margin: handleSearchAndNotif() ? "10px 0" : "20px 0",
              fontWeight: "normal"
            }}
          >
            {handleSearchAndNotif() ? "i" : "intwit"}
          </h1>
        </Link>
        <div className="nav-menu-wrapper cur-point">
          
          {/* Home Menu */}
          <div className="menu-wrapper cur-point">
            <NavLink
              to="/"
              className={({ isActive }) =>
                isActive ? "active-link align-center w-100" : "align-center w-100"
              }
              onClick={handleCloseSearchAndNotif}
            >
              <div className="icon absolute-center"><HomeIcon /></div>
              <div className="icon-active top-intwit-logo"><HomeActiveIcon /></div>
              <div className={`menu-title text-dark ${handleSearchAndNotif() && "hide-content"}`}>Home</div>
            </NavLink>
          </div>
          
          {/* Search Menu */}
          <div className="menu-wrapper cur-point">
            <button
              className={isSearchGlobalState ? "active-link create-btn cur-point w-100" : "create-btn cur-point w-100"}
              onClick={() => handleSearch()}
            >
              <div className="icon absolute-center"><SearchIcon /></div>
              <div className="icon-active top-intwit-logo"><SearchActiveIcon /></div>
              <div className={`menu-title ${handleSearchAndNotif() && "hide-content"}`}>Search</div>
            </button>
          </div>

          {/* Explore Menu */}
          <div className="menu-wrapper cur-point">
            <NavLink
              to="/explore"
              className={({ isActive }) => isActive ? "active-link align-center w-100" : "align-center w-100"}
              onClick={handleCloseSearchAndNotif}
            >
              <div className="icon absolute-center"><ExploreIcon /></div>
              <div className="icon-active top-intwit-logo"><ExploreActiveIcon /></div>
              <div className={`menu-title text-dark ${handleSearchAndNotif() && "hide-content"}`}>Explore</div>
            </NavLink>
          </div>

          {/* 🚨 NAYA: Reels Menu */}
          <div className="menu-wrapper cur-point">
            <NavLink
              to="/reels"
              className={({ isActive }) => isActive ? "active-link align-center w-100" : "align-center w-100"}
              onClick={handleCloseSearchAndNotif}
            >
              <div className="icon absolute-center" style={{ fontSize: '24px' }}>
                <BiMoviePlay />
              </div>
              <div className="icon-active top-intwit-logo" style={{ fontSize: '24px' }}>
                <BiMoviePlay />
              </div>
              <div className={`menu-title text-dark ${handleSearchAndNotif() && "hide-content"}`}>Reels</div>
            </NavLink>
          </div>

          {/* Messages Menu */}
          <div className="menu-wrapper cur-point">
            <NavLink
              to="/direct/inbox/"
              className={location.pathname.startsWith("/direct/") ? "active-link align-center w-100" : "align-center w-100"}
              onClick={handleCloseSearchAndNotif}
            >
              <div className="icon absolute-center"><MessagesIcon /></div>
              <div className="icon-active top-intwit-logo"><MessagesActiveIcon /></div>
              <div className={`menu-title text-dark ${handleSearchAndNotif() && "hide-content"}`}>Messages</div>
            </NavLink>
          </div>

          {/* Notifications Menu */}
          <div className="menu-wrapper cur-point">
            <button
              className={isNotificationGlobalState ? "active-link create-btn cur-point w-100" : "create-btn cur-point w-100"}
              onClick={() => handleNotification()}
            >
              <div className="icon position-relative absolute-center">
                <LikeIcon />
                {notification.data.some((notify) => notify.isRead === false) && <RxDotFilled className="isread-notify" />}
              </div>
              <div className="icon-active position-relative top-intwit-logo absolute-center">
                <NotificationActiveIcon />
                {notification.data.some((notify) => notify.isRead === false) && <RxDotFilled className="isread-notify" />}
              </div>
              <div className={`menu-title ${handleSearchAndNotif() && "hide-content"}`}>Notifications</div>
            </button>
          </div>

          {/* 🚨 UPDATED: Create Menu with Dropdown */}
          <div className="menu-wrapper cur-point" style={{ position: "relative" }}>
            <button
              type="button"
              className={isCreateDropdown ? "active-link create-btn align-center w-100" : "align-center create-btn w-100"}
              onClick={() => setIsCreateDropdown(!isCreateDropdown)}
            >
              <div className="icon absolute-center"><CreateIcon /></div>
              <div className="icon-active top-intwit-logo"><CreateActiveIcon /></div>
              <div className={`menu-title text-dark ${handleSearchAndNotif() && "hide-content"}`}>Create</div>
            </button>

            {/* Create Dropdown Menu */}
            {isCreateDropdown && (
              <div style={{
                position: "absolute", bottom: "100%", left: "10px", width: "160px",
                background: "var(--card-bg, #fff)", border: "1px solid var(--border-color, #ccc)",
                borderRadius: "10px", padding: "10px", display: "flex", flexDirection: "column", gap: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.15)", zIndex: 100
              }}>
                <button 
                  onClick={openCreatePost} 
                  style={{ background: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontWeight: "bold", color: "var(--text-color, #000)", padding: "5px" }}
                >
                  📝 Create Post
                </button>
                <div style={{ height: "1px", background: "var(--border-color, #eee)" }}></div>
                <button 
                  onClick={openCreateReel} 
                  style={{ background: "transparent", border: "none", textAlign: "left", cursor: "pointer", fontWeight: "bold", color: "var(--text-color, #000)", padding: "5px" }}
                >
                  🎬 Create Reel
                </button>
              </div>
            )}
          </div>

          {/* Profile Menu */}
          <div className="menu-wrapper cur-point">
            <NavLink
              to={`/${auth.user?.username}`}
              className={({ isActive }) => isActive ? "active-link align-center w-100" : "align-center w-100"}
              onClick={handleCloseSearchAndNotif}
            >
              <div className="user-image-wrapper absolute-center icon">
                <img src={auth.user?.avatar} alt={auth.user?.username} />
              </div>
              <div className="images-active top-intwit-logo">
                <img src={auth.user?.avatar} alt={auth.user?.username} />
              </div>
              <div className={`menu-title text-dark ${handleSearchAndNotif() && "hide-content"}`}>Profile</div>
            </NavLink>
          </div>

          {/* More Menu (Settings) */}
          <div className="more-menu-wrapper menu-wrapper" style={{ position: "relative" }}>
            <button
              type="button"
              className={isMenuMore ? "active-link create-btn cur-point w-100" : "create-btn cur-point w-100"}
              onClick={() => setIsMenuMore(!isMenuMore)}
            >
              <div className="absolute-center icon"><SettingsIcon /></div>
              <div className="icon-active top-intwit-logo"><SettingsActiveIcon /></div>
              <div className={`menu-title ${handleSearchAndNotif() && "hide-content"}`}>More</div>
            </button>
            
            {/* More Options Popup */}
            <div
              className="more-menu-options-wrapper"
              style={{ 
                display: isMenuMore ? "flex" : "none", flexDirection: "column", gap: "10px", 
                padding: "10px", background: "var(--card-bg, white)", border: "1px solid var(--border-color, #ccc)",
                borderRadius: "10px", position: "absolute", bottom: "100%", left: "0", width: "200px", boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
              }}
            >
              <div className="theme-toggle-wrapper w-100">
                <button
                  type="button"
                  className="logout-btn cur-point w-100"
                  style={{ textAlign: "left", padding: "10px", background: "transparent", border: "none", fontWeight: "bold", color: "var(--text-color, black)" }}
                  onClick={toggleTheme}
                >
                  {theme === "light" ? "🌙 Dark Mode" : "☀️ Light Mode"}
                </button>
              </div>
              <div className="logout-wrapper w-100" style={{ borderTop: "1px solid var(--border-color, #eee)" }}>
                <button
                  type="button"
                  className="logout-btn cur-point w-100 text-danger"
                  style={{ textAlign: "left", padding: "10px", background: "transparent", border: "none", fontWeight: "bold" }}
                  onClick={() => dispatch(logout())}
                >
                  Logout
                </button>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};

export default NavBar;