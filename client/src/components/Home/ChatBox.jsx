import { Button } from "@chakra-ui/button";
import { Input } from "@chakra-ui/input";
import { HStack } from "@chakra-ui/layout";
import { Field, Form, Formik } from "formik";
import { useContext } from "react";
import * as Yup from "yup";
import socket from "../../socket";
import { MessagesContext } from "./HomePage";

const ChatBox = ({ userid }) => {
  const { setMessages } = useContext(MessagesContext);
  if (!userid) {
    return <div>Select a user to start chatting.</div>;
  }
  return (
    <Formik
      initialValues={{ message: "" }}
      validationSchema={Yup.object({
        message: Yup.string().min(1).max(255),
      })}
      onSubmit={(values, actions) => {
        const timestamp = Date.now();
        const message = { to: userid, from: null, content: values.message };
        socket.emit("dm", message);
        const message2 = { 
          to: userid, 
          from: null, 
          content: values.message, 
          timestamp
        };
        setMessages(prevMessages => [message2,...prevMessages]);
        actions.resetForm();
      }}
    >
      <HStack as={Form} w="100%" pb="1.4rem" px="1.4rem">
        <Input
          as={Field}
          name="message"
          placeholder="Type message here.."
          size="lg"
          autoComplete="off"
        />
        <Button type="submit" size="lg" colorScheme="teal">
          Send
        </Button>
      </HStack>
    </Formik>
  );
};

export default ChatBox;