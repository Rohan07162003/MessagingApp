import {
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalFooter,
    ModalHeader,
    ModalOverlay,
    Button,
  } from "@chakra-ui/react";
  import * as Yup from "yup";
  import { Form, Formik } from "formik";
  import TextField from "../TextField";
  
  const AddFriendModal = ({ isOpen, onClose }) => {
    return (
      <>
        {isOpen && (
          <Modal isOpen={isOpen} onClose={onClose}>
            <ModalOverlay />
            <ModalContent>
              <ModalHeader>Add a friend!</ModalHeader>
              <ModalCloseButton />
              <Formik
                initialValues={{ friendName: "" }}
                onSubmit={(values) => {
                  console.log("Submitted values:", values);
                  onClose();
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
  