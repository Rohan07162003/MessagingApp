import { Grid, GridItem, Tabs } from "@chakra-ui/react";
import { createContext, useState } from "react";
import Chat from "./Chat";
import GroupChat from "./Group/GroupChat";
import Sidebar from "./Sidebar";
import useSocketSetup from "./UseSocketSetup";

export const FriendContext = createContext();
export const MessagesContext = createContext();
export const GroupContext = createContext();
export const GroupMessagesContext = createContext();

const Home = () => {
  const [friendList, setFriendList] = useState([]);
  const [groupList, setGroupList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [grpmessages,setGrpmessages] = useState([]);
  const [friendIndex, setFriendIndex] = useState(0);
  const [selectedChat, setSelectedChat] = useState(null); 
  const [chatType, setChatType] = useState("dm"); 
  useSocketSetup(setFriendList,setMessages,setGroupList,setGrpmessages);
  console.log(messages);
  console.log(grpmessages);
  return (
    <FriendContext.Provider value={{ friendList, setFriendList }}>
      <GroupContext.Provider value={{ groupList, setGroupList }}>
        <Grid templateColumns="repeat(10, 1fr)" h="100vh" as={Tabs} onChange={(index) => setFriendIndex(index)}>
          <GridItem colSpan="3" borderRight="1px solid gray">
            <Sidebar setSelectedChat={setSelectedChat} setChatType={setChatType} />
          </GridItem>
          <GridItem maxH="100vh" colSpan="7">
            <GroupMessagesContext.Provider value={{ grpmessages, setGrpmessages }}>
            <MessagesContext.Provider value={{ messages, setMessages }}>
            {selectedChat && chatType === "dm" && <Chat userid={selectedChat.userid} />}
            {selectedChat && chatType === "group" && <GroupChat groupId={selectedChat.groupId} />}
            </MessagesContext.Provider>
            </GroupMessagesContext.Provider>  
          </GridItem> 
        </Grid>
      </GroupContext.Provider>
    </FriendContext.Provider>
  );
};

export default Home;