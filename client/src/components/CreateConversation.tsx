import React, { useState, useEffect, useRef } from "react";
import { AppDispatch, RootState } from "../redux/store";
import { useDispatch, useSelector } from "react-redux";
import { AiOutlineClose } from "react-icons/ai";
import { setIsCreateConversationGlobalState } from "../redux/features/GlobalStateSlice";

import useDebounce from "../hooks/useDebounce";
import userService from "../services/userServices";
import { useNavigate } from "react-router-dom";
import { createConversation } from "../redux/features/conversationSlice";
import { IUserInfo } from "../utils/interface";

const CreateConversation: React.FC = () => {
  const dispatch: AppDispatch = useDispatch();
  const { globalState, auth, conversation } = useSelector((state: RootState) => state);

  const { isCreateConversationGlobalState } = globalState;
  const [searchValue, setSearchValue] = useState<string>("");
  const [searchResult, setSearchResult] = useState<IUserInfo[]>([]);
  const [resultValue, setResultValue] = useState<IUserInfo | null>(null);

  const [loading, setLoading] = useState<boolean>(false);
  const debouncedValue = useDebounce(searchValue, 500);

  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  // 🔴 1. SEARCH LOGIC WITH BLOCK FILTER
  useEffect(() => {
    if (!debouncedValue.trim()) {
      setSearchResult([]);
      return;
    }

    const fetchAPI = async () => {
      setLoading(true);
      try {
        const result = await userService.search(debouncedValue);
        
        // Fresh block list lo local storage se
        const localBlocked = JSON.parse(localStorage.getItem("myBlockedUsers") || "[]");
        
        // Filter: Khud ko aur blocked users ko search se hatao
        const filtered = result.users.filter((user: IUserInfo) => {
          return user._id !== auth.user?._id && !localBlocked.includes(user._id.toString());
        });
        
        setSearchResult(filtered);
      } catch (err) {
        console.error("Search fetch error:", err);
      }
      setLoading(false);
    };

    fetchAPI();
  }, [debouncedValue, auth.user?._id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (!value.startsWith(" ")) {
      setSearchValue(value);
    }
  };

  const handleCreateConversation = async () => {
    if (!resultValue) return;
    await dispatch(createConversation(resultValue._id)).then((response) => {
      navigate(`/direct/${response.payload._id}`);
    });
    dispatch(setIsCreateConversationGlobalState());
    setResultValue(null);
    setSearchValue("");
  };

  const handleClose = () => {
    dispatch(setIsCreateConversationGlobalState());
    setResultValue(null);
    setSearchValue("");
  };

  // 🔴 2. SUGGESTED LIST FILTER
  const localBlocked = JSON.parse(localStorage.getItem("myBlockedUsers") || "[]");

  return (
    <>
      {isCreateConversationGlobalState && (
        <div className="edit_profile absolute-center">
          <div className="conversation-wrapper">
            <div className="conversation-header d-flex">
              <button
                title="Close"
                className="conversation-header-close"
                onClick={handleClose}
              >
                <AiOutlineClose />
              </button>
              <div className="conversation-header-title absolute-center w-100">
                New message
              </div>
              {resultValue ? (
                <button
                  type="submit"
                  className="conversation-header-btn "
                  onClick={handleCreateConversation}
                >
                  Next
                </button>
              ) : (
                <div className="conversation-header-btn-disabled">Next</div>
              )}
            </div>
            
            <div className="conversation-search d-flex">
              <div className="conversation-header-title absolute-center ms-3">
                To:
              </div>
              {resultValue ? (
                <button className="absolute-center bg-white border-0">
                  <div className="conversation-result-value d-flex ">
                    <div className="conversation-result-value-username absolute-center">
                      {resultValue.username}
                    </div>
                    <div
                      className="conversation-result-value-close absolute-center"
                      onClick={() => setResultValue(null)}
                    >
                      <AiOutlineClose />
                    </div>
                  </div>
                </button>
              ) : (
                <div className="conversation-search-input w-100 absolute-center">
                  <input
                    ref={inputRef}
                    type="text"
                    autoComplete="off"
                    spellCheck={false}
                    placeholder="Search..."
                    value={searchValue}
                    onChange={handleChange}
                    autoFocus
                  />
                </div>
              )}
            </div>

            <div className="conversation-body">
              {searchValue ? (
                // SEARCH RESULTS
                searchResult.map((user) => (
                  <button
                    className="leftside-boxchat conversation-background "
                    key={user._id}
                    onClick={() => setResultValue(user)}
                  >
                    <div className="leftside-boxchat-avatar">
                      <img src={user.avatar} alt="avatar" />
                    </div>
                    <div className="flex-column">
                      <div className="leftside-boxchat-username absolute-start">
                        {user.username}
                      </div>
                      <div className="leftside-boxchat-online absolute-start">
                        {user.fullname}
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                // SUGGESTED LIST
                <>
                  <div className="conversation-body-suggestion">Suggested</div>
                  {conversation.data.map((obj) => (
                    <React.Fragment key={obj._id}>
                      {obj.recipients.map((user) => {
                        // 🔴 Blocked aur Khud ko suggestions se hatao
                        if (user._id === auth.user?._id) return null;
                        if (localBlocked.includes(user._id.toString())) return null;

                        return (
                          <button
                            className="leftside-boxchat conversation-background "
                            key={user._id}
                            onClick={() => setResultValue(user)}
                          >
                            <div className="leftside-boxchat-avatar">
                              <img src={user.avatar} alt="avatar" />
                            </div>
                            <div className="flex-column">
                              <div className="leftside-boxchat-username absolute-start">
                                {user.username}
                              </div>
                              <div className="leftside-boxchat-online absolute-start">
                                {user.fullname}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </React.Fragment>
                  ))}
                </>
              )}
              {searchValue && searchResult.length === 0 && !loading && (
                <div className="text-center mt-3 text-muted">No account found.</div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CreateConversation;