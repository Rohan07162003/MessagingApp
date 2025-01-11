import { Grid, GridItem, Tabs } from "@chakra-ui/react";
import { createContext, useState } from "react";
import Chat from "./Chat";
import Sidebar from "./Sidebar";
import useSocketSetup from "./UseSocketSetup";

export const FriendContext = createContext();
export const MessagesContext = createContext();

const Home = () => {
  const [friendList, setFriendList] = useState([]);
  const [messages, setMessages] = useState([]);
  const [friendIndex, setFriendIndex] = useState(0);
  useSocketSetup(setFriendList,setMessages);
  console.log(messages);
  return (
    <FriendContext.Provider value={{ friendList, setFriendList }}>
      <Grid templateColumns="repeat(10, 1fr)" h="100vh" as={Tabs} onChange={(index)=>setFriendIndex(index)}>
        <GridItem colSpan="3" borderRight="1px solid gray">
          <Sidebar />
        </GridItem>
        <GridItem maxH="100vh" colSpan="7">
          <MessagesContext.Provider value={{ messages, setMessages }}>
             <Chat userid={friendList[friendIndex]?.userid} />
          </MessagesContext.Provider>
        </GridItem>
      </Grid>
    </FriendContext.Provider>
  );
};

export default Home;