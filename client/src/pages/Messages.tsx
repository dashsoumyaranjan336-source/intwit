import React from "react";
import LeftSide from "../components/messages/LeftSide";
import BoxChat from "../components/messages/BoxChat";
import Helmet from "../components/Helmet";
import { useParams } from "react-router-dom";
import { useSelector } from "react-redux"; // 🔴 Import useSelector
import { RootState } from "../redux/store"; // 🔴 Import RootState

const Messages: React.FC = () => {
  const { id } = useParams() as {
    id: string;
  };

  const { conversation, auth } = useSelector((state: RootState) => state);

  // 🔴 1. Local Storage se block list nikalo
  const localBlocked = JSON.parse(localStorage.getItem("myBlockedUsers") || "[]");

  // 🔴 2. Check karo ki current chat wala banda blocked toh nahi hai
  const currentConv = conversation.data?.find((obj) => obj._id === id);
  const recipient = currentConv?.recipients.find((r: any) => r._id !== auth.user?._id);
  const isBlocked = recipient && localBlocked.includes(recipient._id.toString());

  return (
    <Helmet title="intwit • Direct">
      <div className="messages-wrapper">
        <div className="messages-container">
          <LeftSide />
          
          {/* 🔴 3. Agar blocked hai toh BoxChat ki jagah Blocked UI dikhao */}
          {isBlocked ? (
            <div className="absolute-center w-100 text-center p-5 bg-white">
               <div style={{ fontSize: "3rem" }}>🚫</div>
               <h4 className="fw-bold mt-3">You have blocked this account</h4>
               <p className="text-muted">
                 You can't message or see each other's updates until you unblock them.
               </p>
               {/* Optionally ek Unblock button yahan bhi de sakte ho */}
            </div>
          ) : (
            <BoxChat id={id} />
          )}
        </div>
      </div>
    </Helmet>
  );
};

export default Messages;