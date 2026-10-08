import { createBrowserRouter } from "react-router"
import RootLayout from './layouts/RootLayout'
import Home from "./pages/Home"
import NotFound from "./pages/NotFound"
import SignIn from "./pages/auth/SignIn"
import SignUp from "./pages/auth/SignUp"
import Studio from "./pages/Studio"

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
        ]
    },
    {
        path: "/studio",
        element: <Studio />,
    },
    {
        path: "/signin",
        element: <SignIn />,
    },
    {
        path: "/signup",
        element: <SignUp />,
    },
    {
        path: "*",
        element: <NotFound />,
    }
])
