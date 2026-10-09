import { createBrowserRouter } from "react-router"
import RootLayout from './layouts/RootLayout'
import RequireAuth from "./components/RequireAuth"
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
        // Everything nested under RequireAuth needs a live session.
        // Add future protected pages as siblings of /studio here.
        element: <RequireAuth />,
        children: [
            {
                path: "/studio",
                element: <Studio />,
            },
        ]
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
