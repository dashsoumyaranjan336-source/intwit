import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { follow, unFollow } from "../../redux/features/authSlice";
import {
  setFollowerUser,
  setUnFollowerUser,
} from "../../redux/features/userSlice";
import { AppDispatch, RootState } from "../../redux/store";
import {
  createNotification,
  deleteNotification,
} from "../../redux/features/notificationSlice";
import { User } from "../../utils/interface";

type FollowBtnProps = {
  user: User | null;
};

const FollowBtn: React.FC<FollowBtnProps> = ({ user }) => {
  const [followed, setFollowed] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false); // Spam clicks rokne ke liye

  const dispatch: AppDispatch = useDispatch();
  const { auth, socket } = useSelector((state: RootState) => state);

  // 🔥 FIX: Properly check karna ki user following list mein hai ya nahi
  useEffect(() => {
    if (auth.user?.following.find((obj) => obj._id === user?._id)) {
      setFollowed(true);
    } else {
      setFollowed(false);
    }
  }, [auth.user?.following, user?._id]);

  const handleFollow = async () => {
    if (!user || loading) return;
    const id = user._id;
    
    setLoading(true); // Button ko disable kar do jab tak API call chal rahi hai

    if (!followed) {
      setFollowed(true); // UI ko turant update karo
      
      dispatch(follow(id)).then((response: any) => {
        if (response.payload) {
          socket.data!.emit("followUser", {
            ...response.payload,
            to: id,
          });
          
          dispatch(
            setFollowerUser({
              ...response.payload,
            })
          );
        }
      });

      dispatch(
        createNotification({
          id: id,
          recipients: [id],
          images: "",
          url: "",
          content: `has started to follow you.`,
          user: auth.user!._id,
        })
      ).then((response: any) => {
        if (response.payload) {
           socket.data!.emit("createNotify", response.payload);
        }
      });

    } else {
      setFollowed(false); // UI ko turant update karo
      
      dispatch(unFollow(id)).then((response: any) => {
        if (response.payload) {
          socket.data!.emit("unFollowUser", {
            ...response.payload,
            to: id,
          });
          
          dispatch(
            setUnFollowerUser({
              ...response.payload,
            })
          );
        }
      });

      dispatch(deleteNotification(id)).then((response: any) => {
        if (response.payload) {
          socket.data!.emit("deleteNotify", response.payload);
        }
      });
    }
    
    setLoading(false); // Process complete
  };

  return (
    <>
      {followed ? (
        <button
          className="unfollow-btn ms-4 absolute-center"
          onClick={handleFollow}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          Unfollow
        </button>
      ) : (
        <button
          className="follow-btn ms-4 absolute-center"
          onClick={handleFollow}
          disabled={loading}
          style={{ opacity: loading ? 0.7 : 1, cursor: loading ? "not-allowed" : "pointer" }}
        >
          Follow
        </button>
      )}
    </>
  );
};

export default FollowBtn;