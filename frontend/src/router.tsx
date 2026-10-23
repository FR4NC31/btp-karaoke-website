import { createBrowserRouter } from "react-router"
import RootLayout from './layouts/RootLayout'
import DocumentTitle from "./components/DocumentTitle"
import RequireAdmin from "./components/RequireAdmin"
import RequireAuth from "./components/RequireAuth"
import RequireGuest from "./components/RequireGuest"
import RouteError from "./components/RouteError"
import LandingPage from "./pages/LandingPage"
import About from "./pages/About"
import Contact from "./pages/Contact"
import Services from "./pages/Services"
import NotFound from "./pages/NotFound"
import SignIn from "./pages/auth/SignIn"
import SignUp from "./pages/auth/SignUp"
import AuthError from "./pages/auth/AuthError"
import StudioShell from "./pages/studio/StudioShell"
import StudioHome from "./pages/studio/StudioHome"
import PlaylistsPage from "./pages/studio/PlaylistsPage"
import PlaylistDetailPage from "./pages/studio/PlaylistDetailPage"
import BookingPage from "./pages/studio/BookingPage"
import ProfilePage from "./pages/studio/ProfilePage"
import AdminShell from "./pages/admin/AdminShell"
import AdminOverview from "./pages/admin/AdminOverview"
import AdminBookings from "./pages/admin/AdminBookings"
import AdminMedia from "./pages/admin/AdminMedia"
import AdminMediaForm from "./pages/admin/AdminMediaForm"

export const router = createBrowserRouter([
    {
        element: <DocumentTitle />,
        errorElement: <RouteError />,
        children: [
            {
                element: <RootLayout />,
                children: [
                    {
                        path: "/",
                        handle: { title: 'Home' },
                        element: <LandingPage />,
                    },
                    {
                        path: "/about",
                        handle: { title: 'About' },
                        element: <About />,
                    },
                    {
                        path: "/contact",
                        handle: { title: 'Contact' },
                        element: <Contact />,
                    },
                    {
                        path: "/services",
                        handle: { title: 'Services' },
                        element: <Services />,
                    },
                ]
            },
            {
                element: <RequireAuth />,
                children: [
                    {
                        path: "/studio",
                        handle: { title: 'Studio' },
                        element: <StudioShell />,
                        children: [
                            { index: true, element: <StudioHome /> },
                            { path: "playlists", handle: { title: 'Playlists' }, element: <PlaylistsPage /> },
                            { path: "playlists/:playlistId", handle: { title: 'Playlist' }, element: <PlaylistDetailPage /> },
                            { path: "profile", handle: { title: 'My Account' }, element: <ProfilePage /> },
                            // The queue is a persistent shell surface, not a page. Keep the route
                            // so direct links and the browser back button still have a URL.
                            { path: "player-queue", element: <></> },
                            { path: "bookings", handle: { title: 'Booking Desk' }, element: <BookingPage /> },
                        ],
                    },
                ]
            },
            {
                element: <RequireGuest />,
                children: [
                    {
                        path: "/signin",
                        handle: { title: 'Sign In' },
                        element: <SignIn />,
                    },
                    {
                        path: "/signup",
                        handle: { title: 'Sign Up' },
                        element: <SignUp />,
                    },
                ]
            },
            {
                path: "/auth/error",
                handle: { title: 'Sign-In Error' },
                element: <AuthError />,
            },
            {
                element: <RequireAdmin />,
                children: [
                    {
                        path: "/admin",
                        handle: { title: 'Admin Overview' },
                        element: <AdminShell />,
                        children: [
                            { index: true, element: <AdminOverview /> },
                            { path: "bookings", handle: { title: 'Reservations' }, element: <AdminBookings /> },
                            { path: "media", handle: { title: 'Media Hub' }, element: <AdminMedia /> },
                            { path: "media/new", handle: { title: 'New Media' }, element: <AdminMediaForm /> },
                            { path: "media/:id", handle: { title: 'Edit Media' }, element: <AdminMediaForm /> },
                        ],
                    },
                ]
            },
            {
                path: "*",
                handle: { title: 'Page Not Found' },
                element: <NotFound />,
            },
        ]
    },
])
