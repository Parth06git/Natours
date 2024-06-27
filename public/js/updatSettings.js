import axios from "axios";
import { showAlert } from "./alert";

export const updateData = async (data) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "/api/v1/users/updateMe",
      data: data,
    });

    if (res.data.status === "success") {
      showAlert("success", "Update in Successfully");
      window.setTimeout(() => {
        location.assign("/me");
      }, 1500);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};

export const updatePassword = async (
  currentPassword,
  newPassword,
  passwordConfirm
) => {
  try {
    const res = await axios({
      method: "PATCH",
      url: "/api/v1/users/updateMyPassword",
      data: {
        currentPassword,
        newPassword,
        passwordConfirm,
      },
    });

    if (res.data.status === "success") {
      showAlert(
        "success",
        "Password is updated in Successfully"
      );
      window.setTimeout(() => {
        location.assign("/me");
      }, 1500);
    }
  } catch (error) {
    showAlert("error", error.response.data.message);
  }
};
