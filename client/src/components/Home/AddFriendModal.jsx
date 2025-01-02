import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Heading,
    Button,
  } from "@chakra-ui/react";
  import * as Yup from "yup";
  import { Form, Formik } from "formik";
  import TextField from "../TextField";
  import socket from "../../socket";
import { useState,useCallback,useContext } from "react";
import { FriendContext } from "./HomePage";
  
  const AddFriendModal = ({ isOpen, onClose }) => {
    const [error, setError]= useState("");
    const closeModal = useCallback(
        ()=>{
            setError("");
            onClose();
        },
        [onClose],
    )
    const {setFriendList} = useContext(FriendContext);
    return (
      <>
        {isOpen && (
          <Modal isOpen={isOpen} onClose={closeModal}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Add a friend!</ModalHeader>
              <ModalCloseButton />
              <Formik
                initialValues={{ friendName: "" }}
                onSubmit={(values) => {
                  console.log("Submitted values:", values);
                  socket.emit("add_friend", values.friendName, ({errorMsg, done})=> {
                    if(done){
                      setFriendList(c=> [values.friendName,...c]);
                        closeModal(); 
                        return;
                    }
                    setError(errorMsg)
                  }
                );
                }}
                validationSchema={Yup.object({
                  friendName: Yup.string()
                    .required("Username required")
                    .min(4, "Invalid username!")
                    .max(28, "Invalid username!"),
                })}
              >
                {() => (
                  <Form>
                    <ModalBody>
                      <Heading as="p" fontSize="xl" color="red.500" textAlign="center">{error}</Heading>  
                      <TextField
                        label="Friend's name"
                        placeholder="Enter friend's username.."
                        autoComplete="off"
                        name="friendName"
                      />
                    </ModalBody>
                    <ModalFooter>
                      <Button colorScheme="blue" type="submit">
                        Submit
                      </Button>
                    </ModalFooter>
                  </Form>
                )}
              </Formik>
            </ModalContent>
          </Modal>
        )}
      </>
    );
  };
  
  export default AddFriendModal;
  