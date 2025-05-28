import { Text, VStack, Box } from "@chakra-ui/layout";
import { TabPanel, TabPanels } from "@chakra-ui/tabs";
import { useContext, useRef, useState, useEffect } from "react";
import { AccountContext } from "../../AccountContext";
import { GroupContext, GroupMessagesContext } from "../HomePage";
import GroupChatBox from "./GroupChatBox";
import axios from "axios";

const GroupChat = ({ groupId }) => {
  const { groupList } = useContext(GroupContext);
  const { grpmessages, setGrpmessages } = useContext(GroupMessagesContext);
  const { user } = useContext(AccountContext);

  const bottomRefs = useRef({});
  const [activeTab, setActiveTab] = useState(0);
  const [groupMembersMap, setGroupMembersMap] = useState({});

  // Scroll to the bottom whenever messages or active tab changes
  useEffect(() => {
    const activeGroupId = groupList[activeTab]?.groupId;
    bottomRefs.current[activeGroupId]?.scrollIntoView({ behavior: "smooth" });
  }, [grpmessages, activeTab, groupList]);
  const activeGroup = groupList[activeTab];
  useEffect(() => {
    if (!activeGroup) return;
    // if already fetched members for this group, skip fetching
    if (groupMembersMap[activeGroup.groupId]) return;
    axios
      .get(`http://localhost:4000/groups/get-members/${activeGroup.groupId}`)
      .then((res) =>
        setGroupMembersMap((prev) => ({
          ...prev,
          [activeGroup.groupId]: res.data,
        }))
      )
      .catch((err) => console.error("Failed to load members", err));
  }, [activeTab, groupList, activeGroup, groupMembersMap]);

  // Filter messages for the active group
  const getGroupMessages = (groupId) => {
    return grpmessages.filter((msg) => msg.groupId === groupId);
  };

  return groupList.length > 0 ? (
    <VStack h="100%" justify="end">
      <TabPanels overflowY="auto" onChange={(index) => setActiveTab(index)}>
        {groupList.map((group, index) => {
          const messages = getGroupMessages(group.groupId);

          return (
            <VStack
              key={group.groupId}
              as={TabPanel}
              w="100%"
              h="100%"
              spacing={0}
            >
              {/* Sticky Group Header */}
              <Box
                w="100%"
                px={4}
                py={2}
                bg="gray.800"
                color="white"
                position="sticky"
                top={0}
                zIndex={1}
                borderBottom="1px solid white" // subtle white divider
              >
                <Text fontWeight="bold" fontSize="lg">
                  {group.groupName}
                </Text>
                <Text fontSize="sm" color="gray.300">
                  {(groupMembersMap[group.groupId] || [])
                    .map((m) => m.username)
                    .join(", ")}
                </Text>
              </Box>

              {/* Scrollable Messages */}
              <Box
                flex="1"
                w="100%"
                overflowY="auto"
                display="flex"
                flexDir="column-reverse"
                px="1rem"
                pb="1rem"
              >
                <div ref={(el) => (bottomRefs.current[group.groupId] = el)} />
                {messages.map((message) => (
                  <Box
                    key={message.messageId}
                    alignSelf={
                      message.fromUserId === user.userid
                        ? "flex-end"
                        : "flex-start"
                    }
                    bg={
                      message.fromUserId === user.userid
                        ? "blue.100"
                        : "gray.100"
                    }
                    borderRadius="10px"
                    p="0.7rem"
                    my="0.3rem"
                    maxW="70%"
                    boxShadow="md"
                  >
                    {message.fromUserId !== user.userid && (
                      <Text
                        fontSize="sm"
                        fontWeight="bold"
                        color="gray.700"
                        mb="0.2rem"
                      >
                        {message.fromUsername}
                      </Text>
                    )}
                    <Text fontSize="lg" color="gray.800">
                      {message.content}
                    </Text>
                    <Text
                      fontSize="xs"
                      color="gray.500"
                      textAlign="right"
                      mt="0.2rem"
                    >
                      {new Date(+message.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Box>
                ))}
              </Box>
            </VStack>
          );
        })}
      </TabPanels>
      <GroupChatBox groupId={groupId} />
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
        <Text>No groups :(</Text>
      </TabPanels>
    </VStack>
  );
};

export default GroupChat;
