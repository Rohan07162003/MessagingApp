import { AccountContext } from "./AccountContext";
import { useContext } from "react";

const {Outlet, Navigate} = require("react-router");
const useAuth = ()=> {
    const {user} = useContext(AccountContext)
    return user && user.loggedIn;
}

const PrivateRoutes = () => {
    const isAuth = useAuth();
    return isAuth? <Outlet/> : <Navigate to="/"/>
}
export default PrivateRoutes;