import { useContext, useEffect } from "react";
import socket from "../../socket";
import { AccountContext } from "../AccountContext";

const useSocketSetup = setFriendList => {
  const { setUser } = useContext(AccountContext);
  useEffect(() => {
    socket.connect();
    socket.on("friends", friendList => {
      console.log(friendList);
      setFriendList(friendList);
    } )
    socket.on("connect_error", () => {
      setUser({ loggedIn: false });
    });
    return () => {
      socket.off("connect_error");
    };
  }, [setUser]);
};

export default useSocketSetup;