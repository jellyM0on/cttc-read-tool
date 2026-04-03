import { createBrowserRouter } from "react-router-dom";
// import { LoginPage } from "../pages/auth/LoginPage";
// import { SignupPage } from "../pages/auth/SignupPage"
import { HomePage } from "../pages/home/HomePage";
// import { ReaderPage } from "../pages/reader/ReaderPage";

export const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  // {
  //   path: "/login",
  //   element: <LoginPage />,
  // },
  // {
  //   path: "/signup",
  //   element: <SignupPage />,
  // },
  // {
  //   path: "/reader/:id",
  //   element: <ReaderPage />,
  // },
]);