import { createBrowserRouter } from "react-router"
import RootLayout from './layouts/RootLayout'
import RequireAdmin from "./components/RequireAdmin"
import RequireAuth from "./components/RequireAuth"
import RequireGuest from "./components/RequireGuest"
import RouteError from "./components/RouteError"
import LandingPage from "./pages/LandingPage"
import About from "./pages/About"
import Contact from "./pages/Contact"
import Services from "./pages/Services"
import PlayerQueue from "./pages/PlayerQueue"
import NotFound from "./pages/NotFound"
import SignIn from "./pages/auth/SignIn"
import SignUp from "./pages/auth/SignUp"
import StudioShell from "./pages/studio/StudioShell"
import StudioHome from "./pages/studio/StudioHome"
import BookingPage from "./pages/studio/BookingPage"
import ProfilePage from "./pages/studio/ProfilePage"
import AdminShell from "./pages/admin/AdminShell"
import AdminOverview from "./pages/admin/AdminOverview"
import AdminBookings from "./pages/admin/AdminBookings"
import AdminNewBooking from "./pages/admin/AdminNewBooking"
import AdminMedia from "./pages/admin/AdminMedia"
import AdminMediaForm from "./pages/admin/AdminMediaForm"

export const router = createBrowserRouter([
    {
        // The four branches below are *siblings*, so an error thrown inside
        // one cannot bubble into another — without a shared parent each would
        // fall back to React Router's stock boundary. Wrapping them in one
        // pathless route gives them all a single place to bubble to.
        errorElement: <RouteError />,
        children: [
            {
                element: <RootLayout />,
                children: [
                    {
                        path: "/",
                        element: <LandingPage />,
                    },
                    {
                        path: "/about",
                        element: <About />,
                    },
                    {
                        path: "/contact",
                        element: <Contact />,
                    },
                    {
                        path: "/services",
                        element: <Services />,
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
                            { path: "player-queue", element: <PlayerQueue /> },
                            { path: "bookings", element: <BookingPage /> },
                        ],
                    },
                ]
            },
            {
                // ...and everything nested under RequireGuest must not have
                // one, so a signed-in user who lands here is sent back to the
                // studio rather than handed a login form they don't need.
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
                // The admin console: sessions with role === 'admin' only.
                // RequireAdmin is navigation UX — every endpoint the console
                // calls is gated by `requireAdmin` on the backend, which is
                // the real boundary.
                element: <RequireAdmin />,
                children: [
                    {
                        path: "/admin",
                        element: <AdminShell />,
                        children: [
                            { index: true, element: <AdminOverview /> },
                            { path: "bookings", element: <AdminBookings /> },
                            { path: "bookings/new", element: <AdminNewBooking /> },
                            { path: "media", element: <AdminMedia /> },
                            { path: "media/new", element: <AdminMediaForm /> },
                            { path: "media/:id", element: <AdminMediaForm /> },
                        ],
                    },
                ]
            },
            {
                path: "*",
                element: <NotFound />,
            },
        ]
    },
])
