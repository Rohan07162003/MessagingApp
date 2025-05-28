import { useContext, useEffect } from "react";
import socket from "../../socket";
import { AccountContext } from "../AccountContext";

const useSocketSetup = (setFriendList,setMessages,setGroupList,setGrpmessages) => {
  const { setUser } = useContext(AccountContext);
  useEffect(() => {
    socket.connect();
    socket.on("friends", friendList => {
      setFriendList(friendList);
      console.log("Friend list:", friendList);
    });
    socket.on("groups",userGroups=>{
      setGroupList(userGroups);
      console.log("Group list:", userGroups);
    })
    socket.on("new_groups", (newGroup) => {
      setGroupList(prevGrps=>[newGroup,...prevGrps]);
    });
    socket.on("messages", messages => {
      setMessages(messages);
    });
    socket.on("groupMessage", (messages) => {
      // For example, append messages if loading history
      setGrpmessages(prev => [...messages, ...prev]);
    });
    socket.on("dm", message => {
      console.log("Received message:", message);
      setMessages(prevMsgs => [message, ...prevMsgs]);
    });
    socket.on("dmgrp", message => {
      console.log("Received message:", message);
      setGrpmessages(prevMsgs => [message, ...prevMsgs]);
    });
    socket.on("lastOnline",(timestamp,username)=>{
      console.log("Friend last online:", username, timestamp);
      setFriendList(prevFriends => {
        return [...prevFriends].map(friend => {
          if (friend.username === username) {
            friend.lastOnline = timestamp;
          }
          return friend;
        });
      });
    })
    socket.on("connected", (status,username) => {
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
      socket.off("lastOnline");
      socket.off("groups");
      socket.off("new_groups");
      socket.off("dm");
      socket.off("dmgrp");
      socket.off("groupMessage");
    };
  }, [setUser, setFriendList,setMessages,setGroupList,setGrpmessages]);
};

export default useSocketSetup;