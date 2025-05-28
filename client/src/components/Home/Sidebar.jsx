import { Button } from "@chakra-ui/button";
import { useState, useContext } from "react";
import { ChatIcon, AddIcon, RepeatIcon } from "@chakra-ui/icons";
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
import { FriendContext, GroupContext } from "./HomePage";

const Sidebar = ({ setSelectedChat, setChatType }) => {
  const { friendList } = useContext(FriendContext);
  const { groupList } = useContext(GroupContext);  

  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [showGroups, setShowGroups] = useState(false); // Toggle between DMs & Groups

  return (
    <>
      <VStack py="1.4rem" w="100%">
        {/* Toggle Between Friends & Groups */}
        <HStack justify="space-between" w="90%">
          <Heading size="md">{showGroups ? "Groups" : "Friends"}</Heading>
          <Button size="sm" onClick={() => setShowGroups(!showGroups)} colorScheme="purple">
            <RepeatIcon /> {/* Toggle Icon */}
          </Button>
        </HStack>
        <Divider />

        {/* Conditional Rendering for Friends or Groups */}
        {!showGroups ? (
          <>
            {/* Add Friend Section */}
            <HStack justifyContent="center" alignItems="center" gap={5} w="100%" py={1}>
              <Heading size="sm">Add a friend</Heading>
              <Button onClick={() => setIsAddFriendOpen(true)} size="sm">
                <ChatIcon />
              </Button>
            </HStack>
            <Divider />

            {/* Friends List */}
            <VStack as={TabList} mt={1} w="100%">
              {friendList.length > 0 ? (
                friendList.map((friend) => (
                  <Button
                    key={friend.userid}
                    w="90%"
                    as={Tab}
                    justifyContent="left"
                    leftIcon={<Circle bg={friend.connected === "false" ? "red.500" : "green.700"} w="10px" h="10px" />}
                    onClick={() => {
                      setSelectedChat(friend);
                      setChatType("dm");
                    }}
                  >
                    <HStack w="100%" justify="space-between">
                      <Text>{friend.username}</Text>
                      {friend.connected === "false" && (
                        <Text fontSize="xs" color="gray.500">
                          {friend.lastOnline ? `${formatDistanceToNow(new Date(friend.lastOnline))} ago` : "N/A"}
                        </Text>
                      )}
                    </HStack>
                  </Button>
                ))
              ) : (
                <Text>No friends yet.</Text>
              )}
            </VStack>
          </>
        ) : (
          <>
            {/* Create Group Section */}
            <HStack justify="center" gap={5} py={1}>
              <Heading size="xs" color="blue.500">Create Group</Heading>
              <Button size="sm" onClick={() => setIsGroupModalOpen(true)} colorScheme="blue">
                <AddIcon />
              </Button>
            </HStack>
            <Divider />

            {/* Groups List */}
            <VStack as={TabList} mt={1} w="100%">
              {groupList.length > 0 ? (
                groupList.map((group) => (
                  <Button
                    key={group.groupId}
                    w="90%"
                    as={Tab}
                    justifyContent="left"
                    leftIcon={<Circle bg="blue.500" w="10px" h="10px" />}
                    onClick={() => {
                      setSelectedChat(group);
                      setChatType("group");
                    }}
                  >
                    {group.groupName}
                  </Button>
                ))
              ) : (
                <Text>No groups yet.</Text>
              )}
            </VStack>
          </>
        )}
      </VStack>

      {/* Modals */}
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
