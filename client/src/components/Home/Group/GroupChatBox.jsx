import { Button, IconButton, Input, HStack, VStack, Text, Image, Box, CloseButton, keyframes } from "@chakra-ui/react";
import { AttachmentIcon } from "@chakra-ui/icons";
import { Field, Form, Formik } from "formik";
import { useContext, useState } from "react";
import * as Yup from "yup";
import axios from "axios";
import socket from "../../../socket.js";
import { GroupMessagesContext } from "../HomePage";
import FilePreview from "./FilePreview.jsx";

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;

const FileInput = ({ onFileChange }) => (
  <>
    <Input
      type="file"
      onChange={onFileChange}
      accept="image/*,video/*,application/pdf"
      hidden
      id="fileInput"
    />
    <IconButton
      as="label"
      htmlFor="fileInput"
      icon={<AttachmentIcon />}
      size="lg"
      variant="ghost"
      aria-label="Attach file"
      animation={`${fadeIn} 0.3s ease-in-out`}
      borderRadius="full"
      boxShadow="md"
      _hover={{ bg: "teal.500", transform: "scale(1.1)" }}
    />
  </>
);

const MessageInput = ({ isSubmitting }) => (
  <>
    <Input as={Field} name="message" placeholder="Type message here.." size="lg" autoComplete="off" />
    <Button type="submit" size="lg" colorScheme="teal" isLoading={isSubmitting} animation={`${fadeIn} 0.3s ease-in-out`}>
      Send
    </Button>
  </>
);

const GroupChatBox = ({ groupId }) => {
  const { setGrpmessages } = useContext(GroupMessagesContext);
  const [file, setFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);

  if (!groupId) {
    return <div>Select a group to start chatting.</div>;
  }

  const handleFileChange = (e) => {
    const uploadedFile = e.target.files[0];
    if (uploadedFile) {
      setFile(uploadedFile);
      setFilePreview(uploadedFile.type.startsWith("image") ? URL.createObjectURL(uploadedFile) : null);
      e.target.value = ""; // Reset file input value to allow selecting the same file again
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview(null);
  };

  return (
    <Formik
      initialValues={{ message: "" }}
      validationSchema={Yup.object({
        message: Yup.string().min(1).max(255).required("Message cannot be empty"),
      })}
      onSubmit={async (values, actions) => {
        try {
          const formData = new FormData();
          formData.append("groupId", groupId);
          formData.append("content", values.message);
          if (file) formData.append("file", file);

          const response = await axios.post("http://localhost:4000/groups/send-message", formData, {
            withCredentials: true,
          });

          const { message } = response.data;

          socket.emit("dmgrp", message);
          setGrpmessages((prevMessages) => [message, ...prevMessages]);
          clearFile();
        } catch (error) {
          console.error("Failed to send message:", error);
        }

        actions.resetForm();
      }}
    >
      {({ isSubmitting }) => (
        <VStack as={Form} w="100%" pb="1.4rem" px="1.4rem" spacing={4} animation={`${fadeIn} 0.3s ease-in-out`}>
          <HStack w="100%" align="center">
            <FileInput onFileChange={handleFileChange} />
            <MessageInput isSubmitting={isSubmitting} />
          </HStack>
          <FilePreview file={file} filePreview={filePreview} clearFile={clearFile} />
        </VStack>
      )}
    </Formik>
  );
};

export default GroupChatBox;
