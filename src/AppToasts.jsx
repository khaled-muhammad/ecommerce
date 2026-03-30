import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./layouts/site-shell.css";
import "./app-toasts.css";

export default function AppToasts() {
  return (
    <ToastContainer
      position="bottom-right"
      theme="light"
      className="site-root-vars roxy-toast-host"
      newestOnTop
      limit={4}
      hideProgressBar={false}
      closeOnClick
      pauseOnHover
    />
  );
}
