import { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

export const AccountContext = createContext();

const UserContext = ({ children }) => {
  const [user, setUser] = useState({ loggedIn: null, username: null, userid: null });
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:4000/auth/login", {
      credentials: "include",
    })
      .then((r) => {
        if (!r.ok) {
          throw new Error("Failed to fetch user data");
        }
        return r.json();
      })
      .then((data) => {
        if (data?.loggedIn) {
          setUser({
            loggedIn: true,
            username: data.username || null,
            userid: data.userid || null,
          });
          navigate("/home");
        } else {
          setUser({ loggedIn: false, username: null, userid: null });
        }
      })
      .catch(() => {
        setUser({ loggedIn: false, username: null, userid: null });
      });
  }, [navigate]);

  return <AccountContext.Provider value={{ user, setUser }}>{children}</AccountContext.Provider>;
};

export default UserContext;
