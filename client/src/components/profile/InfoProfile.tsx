import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../redux/store";
import EditProfile from "./EditProfile";
import FollowBtn from "./FollowBtn";
import {
  setIsFollowerGlobalState,
  setIsFollowingGlobalState,
} from "../../redux/features/GlobalStateSlice";
import InfoProfileSkeleton from "../skeleton/InfoProfileSkeleton";
import { IInfoProfile } from "../../utils/interface";

const InfoProfile: React.FC<IInfoProfile> = ({ username }) => {
  const [onEdit, setOnEdit] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [reelsCount, setReelsCount] = useState<number>(0);

  const { auth, user, socket } = useSelector((state: RootState) => state);
  const dispatch: AppDispatch = useDispatch();

  const verifierUsername = username === auth?.user?.username;
  
  const openInNewTab = (url: string) => {
    if(!url) return;
    window.open(url, "_blank", "noreferrer");
  };

  // 🔴 MAGIC: Profile khulte hi check karega ki us user ki kitni Reels hain
  useEffect(() => {
    const fetchReelsCount = async () => {
      const profileId = verifierUsername ? auth?.user?._id : user?.data?._id;
      if (!profileId) return;

      const token = (auth as any)?.token || (auth as any)?.user?.token || localStorage.getItem("token");
      try {
        // 🔴 FIX 1: Pura localhost URL
        const res = await fetch('https://intwit.onrender.com/api/reels', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.reels) {
           // 🔴 FIX 2: String() me convert karke match kiya taaki fail na ho
           const myReels = data.reels.filter((r: any) => 
             String(r.user?._id) === String(profileId) || String(r.user) === String(profileId)
           );
           setReelsCount(myReels.length);
        }
      } catch (err) {
        console.log("Failed to count reels", err);
      }
    };
    fetchReelsCount();
  }, [auth, user, verifierUsername]);

  // Total Posts = Normal Posts + Reels Count
  const normalPostsCount = verifierUsername ? (auth?.user?.post?.length || 0) : (user?.data?.post?.length || 0);
  const totalPostsCount = normalPostsCount + reelsCount;

  return (
    <div className="profile-details-section">
      {isLoading ? (
        <InfoProfileSkeleton />
      ) : (
        <div className="profile-image-details-wrapper d-flex">
          <div className="profile-image-wrapper">
            <img
              src={verifierUsername ? auth?.user?.avatar : user?.data?.avatar}
              alt="user-profile"
            />
          </div>
          <div className="profile-details-wrapper">
            <div className="d-flex align-items-center">
              <div className="profile-username fs-5">
                {verifierUsername ? auth?.user?.username : user?.data?.username}
              </div>

              {verifierUsername ? (
                <div>
                  <button
                    type="button"
                    className="edit-profile-btn ms-3 absolute-center"
                    onClick={() => setOnEdit(true)}
                  >
                    Edit profile
                  </button>
                  {onEdit && <EditProfile setOnEdit={setOnEdit} />}
                </div>
              ) : (
                <div className="d-flex align-items-center">
                  {/* 🔥 Sirf Follow button rahega, Block button hata diya */}
                  {user?.data && <FollowBtn user={user.data} />}
                </div>
              )}
            </div>

            <div className="posts-followers-details-wrapper d-flex mt-3">
              <div className="total-posts-wrapper total-wrapper absolute-center">
                <span className="font-w-500 total-number">
                  {totalPostsCount}
                </span>
                Post
              </div>
              <button
                className="total-wrapper absolute-center profile-btn-active"
                onClick={() => dispatch(setIsFollowerGlobalState())}
              >
                <span className="font-w-500 total-number">
                  {verifierUsername ? auth?.user?.followers?.length || 0 : user?.data?.followers?.length || 0}
                </span>
                followers
              </button>
              <button
                className="total-wrapper absolute-center profile-btn-active"
                onClick={() => dispatch(setIsFollowingGlobalState())}
              >
                <span className="font-w-500 total-number">
                  {verifierUsername ? auth?.user?.following?.length || 0 : user?.data?.following?.length || 0}
                </span>
                following
              </button>
            </div>

            <div className="profile-fullname-wrapper mt-3 font-w-600">
              {verifierUsername ? auth?.user?.fullname : user?.data?.fullname}
            </div>
            <div className="profile-story">
              {verifierUsername ? auth?.user?.story : user?.data?.story}
            </div>
            
            {((verifierUsername ? auth?.user?.website : user?.data?.website)) && (
                <div className="mt-1">
                <button
                    className="profile-website-wrapper bg-white border-0 p-0 color-primary"
                    style={{ color: '#00376b', fontWeight: '600' }}
                    onClick={() => openInNewTab(verifierUsername ? auth?.user?.website! : user?.data?.website!)}
                >
                    {verifierUsername ? auth?.user?.website : user?.data?.website}
                </button>
                </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default InfoProfile;