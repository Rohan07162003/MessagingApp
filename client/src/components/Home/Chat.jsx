import { Text, VStack } from "@chakra-ui/layout";
import { TabPanel, TabPanels } from "@chakra-ui/tabs";
import { useContext, useRef, useState, useEffect } from "react";
import { FriendContext, MessagesContext } from "./HomePage";
import ChatBox from "./ChatBox";

const Chat = ({ userid }) => {
  const { friendList } = useContext(FriendContext);
  const { messages } = useContext(MessagesContext);
  const bottomRefs = useRef({});
  const [activeTab, setActiveTab] = useState(0); 

  useEffect(() => {
    const activeRef = bottomRefs.current[friendList[activeTab]?.userid];
    activeRef?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeTab, friendList]);

  return friendList.length > 0 ? (
    <VStack h="100%" justify="end">
      <TabPanels overflowY="scroll" onChange={(index) => setActiveTab(index)}>
        {friendList.map((friend, index) => (
          <VStack
            flexDir="column-reverse"
            as={TabPanel}
            key={`friend:${friend.username}`}
            w="100%"
          >
            <div
              ref={(el) => (bottomRefs.current[friend.userid] = el)}
            /> 
            {/* scroll to this */}
            {messages
              .filter(
                (msg) => msg.from === friend.userid || msg.to === friend.userid
              )
              .map((message, ind) => (
                <Text
                  maxW="50%"
                  m={
                    message.to === friend.userid
                      ? "0.1rem 0 0 auto !important"
                      : "0.1rem auto 0 0 !important"
                  }
                  key={`msg:${friend.username}.${ind}`}
                  fontSize="lg"
                  color="gray.800"
                  bg={message.to === friend.userid ? "blue.100" : "gray.100"}
                  p="0.4rem 1rem"
                  borderRadius="10px"
                >
                  {message.content}
                </Text>
              ))}
            
          </VStack>
        ))}
      </TabPanels>
      <ChatBox userid={userid} />
    </VStack>
  ) : (
    <VStack
      justify="center"
      pt="5rem"
      w="100%"
      textAlign="center"
      fontSize="lg"
    >
      <TabPanels>
        <Text>No friend :( Click add friend to start chatting</Text>
      </TabPanels>
    </VStack>
  );
};

export default Chat;
