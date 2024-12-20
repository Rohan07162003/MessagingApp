
import { useContext } from 'react'
import { Routes,Route } from 'react-router-dom'
import Login from './Login/Login'
import { AccountContext } from './AccountContext'
import SignUp from './Login/SignUp'
import { Text } from '@chakra-ui/react'
import PrivateRoutes from './PrivateRoutes'
import Home from './Home/HomePage'

const Views = () => {
  const { user } = useContext(AccountContext);
  return user.loggedIn === null ? (
    <Text>Loading...</Text>
  ) : (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/register" element={<SignUp />} />
      <Route element={<PrivateRoutes />}>
        <Route path="/home" element={<Home />} />
      </Route>
      <Route path="*" element={<Login />} />
    </Routes>
  );
};

export default Views