import React, { useEffect, useRef, useState } from "react";
import { AppDispatch, RootState } from "../redux/store";
import { setIsSearchGlobalState } from "../redux/features/GlobalStateSlice";
import userService from "../services/userServices";
import useDebounce from "../hooks/useDebounce";
import { useDispatch, useSelector } from "react-redux";
import { AiFillCloseCircle, AiOutlineLoading3Quarters } from "react-icons/ai";
import { useNavigate } from "react-router-dom";
import { IUserInfo } from "../utils/interface";

const SearchBox: React.FC = () => {
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchResult, setSearchResult] = useState<IUserInfo[]>([]);
  const [showResults, setShowResults] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);

  const debouncedValue = useDebounce(searchValue, 500);
  const inputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const { auth, globalState } = useSelector((state: RootState) => state);
  const { isSearchGlobalState } = globalState;
  const dispatch: AppDispatch = useDispatch();

  useEffect(() => {
    if (!debouncedValue.trim()) {
      setSearchResult([]);
      return;
    }

    const fetchAPI = async () => {
      // 🔴 Step 1: Check karo token hai ya nahi (Auth state se safely nikalna)
      const token = (auth as any).user?.token || auth.user?.token;
      if (!token) return;

      setLoading(true);
      try {
        // 🔴 Step 2: userService call
        const result = await userService.search(debouncedValue);
        
        // Local storage se blocked IDs ki list nikalo
        const localBlocked = JSON.parse(localStorage.getItem("myBlockedUsers") || "[]");
        
        // 🔴 Step 3: FILTER LOGIC (Ghost Mode logic)
        const filtered = result.users.filter((user: any) => {
          // 1. Khud ko result mein mat dikhao
          if (user._id === auth.user?._id) return false; 
          
          // 2. Woh log jinhe MAINE block kiya hai (Local Storage sync)
          const userIdString = user._id.toString();
          if (localBlocked.includes(userIdString)) return false; 

          // 3. JADU STEP: Woh log JINHONE MUJHE block kiya hai
          // (Backend se blockedUsers array populate ho kar aa rahi ho toh)
          if (user.blockedUsers?.includes(auth.user?._id)) return false;
          
          return true;
        });

        setSearchResult(filtered);
      } catch (err) {
        console.log("Search error:", err);
      }
      setLoading(false);
    };

    fetchAPI();
    // 🔴 Dependency array mein token sahi se handle kiya
  }, [debouncedValue, auth.user, (auth as any).user?.token]); 

  const handleClear = () => {
    setSearchValue("");
    setSearchResult([]);
    inputRef.current!.focus();
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.startsWith(" ")) {
      setSearchValue(value);
    } else {
      setSearchValue("");
    }
  };

  const handleRedirect = (username: string) => {
    navigate(`/${username}`);
    dispatch(setIsSearchGlobalState());
    setSearchValue("");
  };

  return (
    <div
      className="search-box-container"
      style={{
        transform: isSearchGlobalState ? "translateX(0px) " : "",
      }}
    >
      <div className="search-box-wrapper">
        <div className="search-title">Search</div>
        <div className="search-input ">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search"
            autoComplete="off"
            spellCheck={false}
            value={searchValue}
            onChange={handleChange}
            onFocus={() => setShowResults(true)}
          />
          {!!searchValue && !loading && (
            <button
              type="button"
              title="clear button"
              className="clear-btn cancel-btn cur-point"
              onClick={handleClear}
            >
              <AiFillCloseCircle style={{ color: "#c8c8c8" }} />
            </button>
          )}
          {loading && (
            <button className="loading-btn">
              <AiOutlineLoading3Quarters 
                className="loading-icon-animation" 
                style={{ color: "#c8c8c8" }} 
              />
            </button>
          )}
        </div>
        <div className="line-seperator"></div>

        <div className="search-results">
          {searchValue && searchResult.length > 0 ? (
            searchResult.map((user) => (
              <div
                className="search-userprofile-follow-wrapper cur-point"
                key={user._id}
                onClick={() => handleRedirect(user.username)}
              >
                <div className="userprofile-wrapper">
                  <div className="userprofile-image-wrapper">
                    <img 
                        src={user.avatar} 
                        alt="user-profile" 
                        className="rounded-circle"
                        onError={(e) => {
                            e.currentTarget.src = "https://res.cloudinary.com/devatchannel/image/upload/v1602752402/avatar/avatar_cugq40.png"
                        }} 
                    />
                  </div>
                  <div className="ms-2">
                    <div className="username-wrapper" style={{ fontSize: "0.9rem" }}>
                      {user.username}
                    </div>
                    <div className="fullname-wrapper">{user.fullname}</div>
                  </div>
                </div>
              </div>
            ))
          ) : searchValue && !loading ? (
             <div className="absolute-center w-100 mt-3 text-muted" style={{fontSize: '0.9rem'}}>
                No users found.
             </div>
          ) : (
            <div className="d-block w-100 h-80">
              <div className="result-title search-title">Recent</div>
              <div className="absolute-center w-100 h-100">
                No recent searches.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SearchBox;