import React from "react";
import { Link } from "react-router-dom";

const Footer: React.FC = () => {
  return (
    <footer>
      <div className="container">
        <nav className="footer-nav">
          <ul>
            <li>
              <Link to="https://about.meta.com/">Meta</Link>
            </li>
            <li>
              <Link to="https://about.intwit.com/">About</Link>
            </li>
            <li>
              <Link to="https://about.intwit.com/blog">Blog</Link>
            </li>
            <li>
              <Link to="https://about.intwit.com/about-us/careers">
                Jobs
              </Link>
            </li>
            <li>
              <Link to="https://help.intwit.com/">Help</Link>
            </li>
            <li>
              <Link to="https://developers.facebook.com/docs/intwit">
                API
              </Link>
            </li>
            <li>
              <Link to="https://www.intwit.com/legal/privacy/">Privacy</Link>
            </li>
            <li>
              <Link to="https://help.intwit.com/581066165581870/">
                Terms
              </Link>
            </li>
            <li>
              <Link to="https://www.intwit.com/directory/profiles/">
                Top Accounts
              </Link>
            </li>
            <li>
              <Link to="https://www.intwit.com/explore/locations/">
                Locations
              </Link>
            </li>
            <li>
              <Link to="https://www.intwit.com/web/lite/">
                intwit Lite
              </Link>
            </li>
            <li>
              <Link to="https://l.intwit.com/?u=https%3A%2F%2Fwww.facebook.com%2Fhelp%2Fintwit%2F261704639352628&e=AT0-tbLn71QDjgpzXTsX8pib_PKaW5nJo2iXuSWWTMSgbTX76JqgXNtWHqnrEiTg5v0I1yN_nEr4hZnM5FGeSP2vOzUBdAtu53Dkl488gynmZ6arshiKBa4WTrj9ql61AAptdS0j3Q08hTEVtSWEgg">
                Contact Uploading & Non-Users
              </Link>
            </li>
            <li>
              <Link to="https://help.intwit.com/397451835844752">
                Digital Collectibles Privacy Notice
              </Link>
            </li>
          </ul>
        </nav>
        <div className="copyright-notice container-fluid">
          © 2023 intwit from
          <Link to="https://github.com/tuananhfr">
            &nbsp;https://github.com/tuananhfr
          </Link>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
