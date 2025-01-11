import { useContext, useEffect } from "react";
import socket from "../../socket";
import { AccountContext } from "../AccountContext";

const useSocketSetup = (setFriendList,setMessages) => {
  const { setUser } = useContext(AccountContext);
  useEffect(() => {
    socket.connect();
    socket.on("friends", friendList => {
      setFriendList(friendList);
      console.log("Friend list:", friendList);
    });
    socket.on("messages", messages => {
      setMessages(messages);
    });
    socket.on("dm", message => {
      console.log("Received message:", message);
      setMessages(prevMsgs => [message, ...prevMsgs]);
    });
    socket.on("connected", (status, username) => {
      setFriendList(prevFriends => {
        return [...prevFriends].map(friend => {
          if (friend.username === username) {
            friend.connected = status;
          }
          return friend;
        });
      });
      console.log("Friend connected:", username, status);
    });
    socket.on("connect_error", () => {
      setUser({ loggedIn: false });
    });
    return () => {
      socket.off("connect_error");
      socket.off("friends");
      socket.off("connected");
      socket.off("messages");
      socket.off("dm");
    };
  }, [setUser, setFriendList,setMessages]);
};

export default useSocketSetup;