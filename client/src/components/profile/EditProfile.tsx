import { useState, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { editUser } from "../../redux/features/authSlice";
import { AppDispatch, RootState } from "../../redux/store";
import { AiOutlineClose } from "react-icons/ai";
import { useFormik } from "formik";
import * as yup from "yup";
import { uploadImgAvatar } from "../../redux/features/uploadImgSlice";
import { getUser } from "../../redux/features/userSlice";

type EditProfileProps = {
  setOnEdit: (value: boolean) => void;
};

let schema = yup.object().shape({
  username: yup.string().required("Username is Required"),
  fullname: yup.string().required("Fullname is Required"),
  mobile: yup.string(),
  address: yup.string(),
  website: yup.string(),
  story: yup.string(),
  gender: yup.string().required("Gender is Required"),
});

const EditProfile: React.FC<EditProfileProps> = ({ setOnEdit }) => {
  const ref = useRef<HTMLInputElement>(null);
  const { auth, upload } = useSelector((state: RootState) => state);
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();

  const [avatar, setAvatar] = useState(
    auth.user?.avatar ||
      "https://res.cloudinary.com/tuananh-pham/image/upload/v1678058561/MERN-intwit-typescript/avatar/avatar-default_xkj2pq.jpg"
  );

  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [isPrivate, setIsPrivate] = useState<boolean>((auth.user as any)?.isPrivate || false);
  const [showBlockedUsers, setShowBlockedUsers] = useState<boolean>(false);

  const formik = useFormik({
    initialValues: {
      username: auth.user?.username || "",
      fullname: auth.user?.fullname || "",
      mobile: auth.user?.mobile || "",
      address: auth.user?.address || "",
      website: auth.user?.website || "",
      story: auth.user?.story || "",
      gender: auth.user?.gender || "",
    },
    validationSchema: schema,
    onSubmit: (values) => {
      dispatch(editUser({ ...values, avatar }));
      dispatch(getUser(values.username));

      navigate(`/${formik.values.username}`);
      setOnEdit(false);
    },
  });

  useEffect(() => {
    if (upload.images && upload.images.length > 0) {
      setAvatar(upload.images[0]?.url);
    }
  }, [upload.images]);

  const handleClick = () => {
    ref.current?.click();
  };

  const handleOnClose = () => {
    setOnEdit(false);
    setAvatar(auth.user!.avatar);
  };

  const changeAvatar = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files![0];
    if (!file) return;

    setIsUploading(true);
    const fileList = [file];
    await dispatch(uploadImgAvatar(fileList));
    setIsUploading(false);
  };

  const handleTogglePrivacy = async () => {
    try {
      const res = await fetch("https://intwit-28qq.onrender.com/api/user/toggle-privacy", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user?.token}`,
        },
      });
      const data = await res.json();
      
      if (res.ok) {
        setIsPrivate(data.isPrivate);
        alert(data.msg);
      } else {
        alert(data.msg || "Error updating privacy");
      }
    } catch (error) {
      console.error(error);
      alert("Network Error!");
    }
  };

  // 🔴 NAYA JADU: Yahan hum Blocked Users ko Unblock karne ka function likhenge
  const handleUnblock = async (blockedId: string) => {
    try {
      const res = await fetch(`https://intwit-28qq.onrender.com/api/user/block/${blockedId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${auth.user?.token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        alert("User Unblocked successfully!");
        window.location.reload(); // Refresh to update Redux state
      } else {
        alert(data.msg);
      }
    } catch (error) {
      console.log(error);
      alert("Network error");
    }
  };

  return (
    <div className="edit_profile">
      <button title="close" className="btn_close" onClick={handleOnClose}>
        <AiOutlineClose
          style={{ width: "1.5rem", height: "1.5rem", fill: "white" }}
        />
      </button>

      <form
        onSubmit={formik.handleSubmit}
        style={{
          maxWidth: "28rem",
          width: "100%",
          backgroundColor: "white",
          padding: "2rem",
          borderRadius: "5px",
          margin: "2rem auto",
          maxHeight: "90vh", // Height thodi fix ki taki scroll ho sake agar list lambi ho
          overflowY: "auto"
        }}
      >
        <div className="w-100 d-flex">
          <div className="info_avatar ms-1">
            <img src={avatar} alt="avatar" title="Change profile photo" style={{ borderRadius: "50%", width: "80px", height: "80px", objectFit: "cover" }} />
          </div>
          <div className="flex-column ms-3">
            <div className="w-500 fw-bold">{auth.user!.username}</div>
            <span className="change-avatar-btn">
              <p role="button" className="text-primary mt-2" style={{ cursor: "pointer", fontWeight: "500" }} onClick={handleClick}>
                Change profile photo
              </p>
              <input
                type="file"
                name="file"
                id="file_up"
                accept="image/*"
                style={{ display: "none" }}
                ref={ref}
                onChange={changeAvatar}
              />
            </span>
          </div>
        </div>
        
        <div className="form-group my-4 p-3 d-flex justify-content-between align-items-center" style={{ background: "#f8f9fa", borderRadius: "10px", border: "1px solid #ddd" }}>
          <div>
            <label className="mb-0 fw-bold" style={{ fontSize: "16px" }}>Private Account</label>
            <p className="mb-0 text-muted" style={{ fontSize: "12px", marginTop: "4px" }}>
              When your account is private, only people you approve can see your photos and videos.
            </p>
          </div>
          <div className="form-check form-switch">
            <input
              className="form-check-input"
              type="checkbox"
              role="switch"
              id="privacySwitch"
              style={{ cursor: "pointer", width: "40px", height: "20px" }}
              checked={isPrivate}
              onChange={handleTogglePrivacy}
            />
          </div>
        </div>

        {/* 🔴 NAYA SECTION: Blocked Users toggle karne ka button */}
        <div className="form-group my-3 p-3" style={{ background: "#fff5f5", border: "1px solid #ffcccc", borderRadius: "8px" }}>
          <div 
            className="d-flex justify-content-between align-items-center cur-point"
            onClick={() => setShowBlockedUsers(!showBlockedUsers)}
            style={{ cursor: "pointer" }}
          >
            <label className="mb-0 fw-bold text-danger cur-point">Blocked Users ({(auth.user as any)?.blockedUsers?.length || 0})</label>
            <span className="text-danger fw-bold">{showBlockedUsers ? "▲" : "▼"}</span>
          </div>

          {/* Blocked Users List Dropdown */}
          {showBlockedUsers && (
             <div className="mt-3">
               {((auth.user as any)?.blockedUsers?.length > 0) ? (
                 (auth.user as any).blockedUsers.map((blockedId: string) => (
                   <div key={blockedId} className="d-flex justify-content-between align-items-center mb-2 p-2 border rounded bg-white">
                      <span className="text-muted" style={{ fontSize: "14px" }}>User ID: {blockedId.substring(0, 8)}...</span>
                      <button 
                        type="button" 
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => handleUnblock(blockedId)}
                      >
                        Unblock
                      </button>
                   </div>
                 ))
               ) : (
                 <p className="text-muted text-center mt-2 mb-0" style={{ fontSize: "14px" }}>No blocked users.</p>
               )}
             </div>
          )}
        </div>

        <div className="form-group my-3">
          <label htmlFor="username">Username</label>
          <div className="position-relative">
            <input
              type="text"
              name="username"
              maxLength={25}
              className="form-control"
              onChange={formik.handleChange("username")}
              value={formik.values.username}
            />
            <small className="text-danger position-absolute" style={{ top: "50%", right: "10px", transform: "translateY(-50%)" }}>
              {formik.values.username.length}/25
            </small>
          </div>
        </div>

        <div className="form-group my-3">
          <label htmlFor="fullname">Full Name</label>
          <div className="position-relative">
            <input
              type="text"
              name="fullname"
              maxLength={25}
              className="form-control"
              onChange={formik.handleChange("fullname")}
              value={formik.values.fullname}
            />
            <small className="text-danger position-absolute" style={{ top: "50%", right: "10px", transform: "translateY(-50%)" }}>
              {formik.values.fullname.length}/25
            </small>
          </div>
        </div>

        <div className="form-group my-3">
          <label htmlFor="mobile">Mobile</label>
          <input
            type="text"
            name="mobile"
            className="form-control"
            onChange={formik.handleChange("mobile")}
            value={formik.values.mobile}
          />
        </div>

        <div className="form-group my-3">
          <label htmlFor="address">Address</label>
          <input
            type="text"
            name="address"
            className="form-control"
            onChange={formik.handleChange("address")}
            value={formik.values.address}
          />
        </div>

        <div className="form-group my-3">
          <label htmlFor="website">Website</label>
          <input
            type="text"
            name="website"
            className="form-control"
            onChange={formik.handleChange("website")}
            value={formik.values.website}
          />
        </div>

        <div className="form-group my-3">
          <label htmlFor="story">Bio (Story)</label>
          <textarea
            name="story"
            cols={30}
            rows={4}
            maxLength={200}
            className="form-control"
            onChange={formik.handleChange("story")}
            value={formik.values.story}
          />
          <small className="text-danger d-block text-end mt-1">
            {formik.values.story.length}/200
          </small>
        </div>

        <div className="form-group my-3">
          <label htmlFor="gender">Gender</label>
          <div className="px-0 mb-4">
            <select
              className="form-select"
              name="gender"
              id="gender"
              onChange={formik.handleChange("gender")}
              value={formik.values.gender}
            >
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <button 
          className="btn btn-primary w-100 py-2 fw-bold mb-3" 
          type="submit" 
          disabled={isUploading}
        >
          {isUploading ? "Uploading Photo (Please Wait)..." : "Submit"}
        </button>
      </form>
    </div>
  );
};

export default EditProfile;