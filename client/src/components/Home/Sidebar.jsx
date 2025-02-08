import { Button } from "@chakra-ui/button";
import { useState, useContext } from "react";
import { ChatIcon, AddIcon } from "@chakra-ui/icons";
import {
  Circle,
  Divider,
  Heading,
  HStack,
  Text,
  VStack,
} from "@chakra-ui/layout";
import { Tab, TabList } from "@chakra-ui/tabs";
import { formatDistanceToNow } from "date-fns"; 
import AddFriendModal from "./AddFriendModal";
import GroupCreationModal from "./GroupCreationModal";
import { FriendContext } from "./HomePage";

const Sidebar = () => {
  const { friendList } = useContext(FriendContext);

  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);

  return (
    <>
      <VStack py="1.4rem">
        <HStack justifyContent="center" alignItems="center" gap={5} w="100%" py={1}>
          <Heading size="sm">Add a friend</Heading>
          <Button onClick={() => setIsAddFriendOpen(true)}>
            <ChatIcon />
          </Button>
        </HStack>
        <Divider />

        <HStack gap={5} py={1}>
          <Heading size="sm" color="blue.500">
            Create Group Chat
          </Heading>
          <Button mt={2} onClick={() => setIsGroupModalOpen(true)} colorScheme="blue">
            <AddIcon />
          </Button>
        </HStack>
        <Divider />

        <VStack as={TabList} mt={2}>
          {friendList.map((friend) => (
            <HStack as={Tab} key={`friend:${friend.username}`}>
              <Circle
                bg={friend.connected === "false" ? "red.500" : "green.700"}
                w="20px"
                h="20px"
              />
              <Text>{friend.username}</Text>
              {friend.connected === "false" && (
                <Text fontSize="xs" color="gray.500">
                  Last online: {friend.lastOnline ? `${formatDistanceToNow(new Date(friend.lastOnline))} ago` : "N/A"}
                </Text>
              )}
            </HStack>
          ))}
        </VStack>
      </VStack>

      <GroupCreationModal
        key={isGroupModalOpen ? "group-open" : "group-closed"} 
        isOpengroup={isGroupModalOpen}
        onClosegroup={() => setIsGroupModalOpen(false)}
        onCreateGroup={(groupId, groupName) => {
          console.log("New Group Created:", groupId, groupName);
        }}
      />
      <AddFriendModal
        key={isAddFriendOpen ? "addfriend-open" : "addfriend-closed"}  
        isOpen={isAddFriendOpen}
        onClose={() => setIsAddFriendOpen(false)}
      />
    </>
  );
};

export default Sidebar;
