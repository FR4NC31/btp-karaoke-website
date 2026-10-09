import { createBrowserRouter } from "react-router"
import RootLayout from './layouts/RootLayout'
import RequireAuth from "./components/RequireAuth"
import RequireGuest from "./components/RequireGuest"
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
        // ...and everything nested under RequireGuest must not have one, so
        // a signed-in user who lands here is sent back to the studio rather
        // than handed a login form they don't need.
        element: <RequireGuest />,
        children: [
            {
                path: "/signin",
                element: <SignIn />,
            },
            {
                path: "/signup",
                element: <SignUp />,
            },
        ]
    },
    {
        path: "*",
        element: <NotFound />,
    }
])
