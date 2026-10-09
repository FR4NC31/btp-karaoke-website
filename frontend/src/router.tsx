import { createBrowserRouter } from "react-router"
import RootLayout from './layouts/RootLayout'
import RequireAuth from "./components/RequireAuth"
import RequireGuest from "./components/RequireGuest"
import Home from "./pages/Home"
import About from "./pages/About"
import Contact from "./pages/Contact"
import NotFound from "./pages/NotFound"
import SignIn from "./pages/auth/SignIn"
import SignUp from "./pages/auth/SignUp"
import StudioShell from "./pages/studio/StudioShell"
import StudioHome from "./pages/studio/StudioHome"
import ProfilePage from "./pages/studio/ProfilePage"

export const router = createBrowserRouter([
    {
        element: <RootLayout />,
        children: [
            {
                path: "/",
                element: <Home />,
            },
            {
                path: "/about",
                element: <About />,
            },
            {
                path: "/contact",
                element: <Contact />,
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
            element: <StudioShell />,
            children: [
                { index: true, element: <StudioHome /> },
                { path: "profile", element: <ProfilePage /> },
            ],
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
