import { Text, VStack, HStack, Box } from "@chakra-ui/layout";
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
            key={`friend:${friend.username}:${index}`}
            w="100%"
          >
            <div
              ref={(el) => (bottomRefs.current[friend.userid] = el)}
            />
            {messages
              .filter(
                (msg) => msg.from === friend.userid || msg.to === friend.userid
              )
              .map((message, ind) => (
                <Box
                  key={`msg:${friend.username}.${ind}`}
                  alignSelf={
                    message.to === friend.userid ? "flex-start" : "flex-end"
                  }
                  bg={message.to === friend.userid ? "blue.100" : "gray.100"}
                  borderRadius="10px"
                  p="0.7rem"
                  maxW="70%"
                  boxShadow="md"
                  position="relative"
                >
                  {/* Message Content */}
                  <Text fontSize="lg" color="gray.800">
                    {message.content}
                  </Text>

                  {/* Timestamp */}
                  <Text
                    fontSize="xs"
                    color="gray.500"
                    textAlign="right"
                    mt="0.2rem"
                  >
                    {new Date(+message.timestamp).toLocaleString()}
                  </Text>
                </Box>
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
        <Text>No friends :( Click add friend to start chatting</Text>
      </TabPanels>
    </VStack>
  );
};

export default Chat;
