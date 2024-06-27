import axios from "axios";
import { showAlert } from "./alert";

export const login = async (email, pass) => {
  try {
    const res = await axios({
      method: "POST",
      url: "/api/v1/users/login",
      data: {
        email: email,
        password: pass,
      },
    });
    // console.log(res);

    if (res.data.status === "success") {
      showAlert("success", "Logged in Successfully");
      window.setTimeout(() => {
        location.assign("/");
      }, 1500);
    }
  } catch (err) {
    showAlert("error", err.response.data.message);
  }
};

export const logout = async () => {
  try {
    const res = await axios({
      method: "GET",
      url: "/api/v1/users/logout",
    });

    if (res.data.status === "success")
      location.reload(true);
  } catch (error) {
    // console.log(error.response);
    showAlert("error", "Error Logging Out! Try again");
  }
};
