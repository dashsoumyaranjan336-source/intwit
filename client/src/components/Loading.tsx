import React from "react";
import loading from "../images/loading.gif";
const Loading: React.FC = () => {
  return (
    <div
      className="position-fixed w-100 h-100"
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
      }}
    >
      <img src={loading} style={{ width: "5rem" }} alt="loading" />
    </div>
  );
};

export default Loading;
