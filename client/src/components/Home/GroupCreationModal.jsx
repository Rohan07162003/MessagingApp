import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Heading,
  Button,
  Checkbox,
  VStack,
} from "@chakra-ui/react";
import { useState, useCallback, useContext, useEffect } from "react";
import { Formik, Form } from "formik";
import * as Yup from "yup";
import TextField from "../TextField"; 
import { FriendContext } from "./HomePage";

const GroupCreationModal = ({ isOpengroup, onClosegroup, onCreateGroup }) => {
  const [error, setError] = useState("");
  const { friendList } = useContext(FriendContext);

  useEffect(() => {
    if (isOpengroup) setError(""); 
    console.log("GroupCreationModal isOpengroup:", isOpengroup);
  }, [isOpengroup]);

  const closeModal = useCallback(() => {
    setError("");
    onClosegroup(); 
  }, [onClosegroup]);

  return (
    <Modal isOpen={isOpengroup} onClose={closeModal}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>Create a New Group</ModalHeader>
        <ModalCloseButton />
        <Formik
          initialValues={{ groupName: "", selectedFriends: [] }}
          validationSchema={Yup.object({
            groupName: Yup.string()
              .required("Group name is required")
              .min(3, "Group name too short")
              .max(50, "Group name too long"),
            selectedFriends: Yup.array().min(1, "Select at least one friend"),
          })}
          onSubmit={async (values, { setSubmitting, resetForm }) => {
            try {
              const response = await fetch("/api/groups/create", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  groupName: values.groupName,
                  members: values.selectedFriends,
                }),
              });

              const data = await response.json();
              if (data.success) {
                onCreateGroup(data.groupId, values.groupName);
                resetForm();
                closeModal();
              } else {
                setError("Failed to create group.");
              }
            } catch (err) {
              console.error("Error creating group:", err);
              setError("Something went wrong. Try again.");
            } finally {
              setSubmitting(false);
            }
          }}
        >
          {({ values, isSubmitting, setFieldValue }) => (
            <Form>
              <ModalBody>
                {error && (
                  <Heading as="p" fontSize="md" color="red.500" textAlign="center" mb={2}>
                    {error}
                  </Heading>
                )}
                <TextField
                  label="Group Name"
                  placeholder="Enter group name"
                  autoComplete="off"
                  name="groupName"
                />

                <VStack align="start" mt={4}>
                  {friendList.map((friend) => (
                    <Checkbox
                      key={friend.userid}
                      isChecked={values.selectedFriends.includes(friend.userid)}
                      onChange={() =>
                        setFieldValue(
                          "selectedFriends",
                          values.selectedFriends.includes(friend.userid)
                            ? values.selectedFriends.filter((id) => id !== friend.userid)
                            : [...values.selectedFriends, friend.userid]
                        )
                      }
                    >
                      {friend.username}
                    </Checkbox>
                  ))}
                </VStack>
              </ModalBody>

              <ModalFooter>
                <Button onClick={closeModal} mr={2}>
                  Cancel
                </Button>
                <Button colorScheme="green" type="submit" isLoading={isSubmitting}>
                  Create Group
                </Button>
              </ModalFooter>
            </Form>
          )}
        </Formik>
      </ModalContent>
    </Modal>
  );
};

export default GroupCreationModal;
