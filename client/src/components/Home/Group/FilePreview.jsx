import {
  Text,
  Image,
  Box,
  CloseButton,
  keyframes,
} from "@chakra-ui/react";
const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(10px); }
  to { opacity: 1; transform: translateY(0); }
`;
const FilePreview = ({ file, filePreview, clearFile }) =>
  file && (
    <Box
      display="flex"
      alignItems="center"
      borderRadius="md"
      p={2}
      border="1px solid #ccc"
      maxW="300px"
      animation={`${fadeIn} 0.3s ease-in-out`}
      boxShadow="lg"
      //   bg="white"
    >
      {filePreview ? (
        <Image
          src={filePreview}
          alt="File preview"
          maxW="50px"
          maxH="50px"
          borderRadius="md"
          mr={2}
        />
      ) : (
        <Text flex="1" isTruncated>
          {file.name}
        </Text>
      )}
      <CloseButton onClick={clearFile} />
    </Box>
  );

export default FilePreview;  
