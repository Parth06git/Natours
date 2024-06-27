import "@babel/polyfill";
import { login, logout } from "./login";
import { displayMap } from "./mapbox";
import {
  updateData,
  updatePassword,
} from "./updatSettings";

// DOM elements
const mapBox = document.getElementById("map");
const loginForm = document.querySelector(".form--login");
const logoutBtn = document.querySelector(
  ".nav__el--logout"
);
const updateDataForm = document.querySelector(
  ".form-user-data"
);
const updatePasswordForm = document.querySelector(
  ".form-user-settings"
);

// Delegation
if (mapBox) {
  const locations = JSON.parse(mapBox.dataset.locations);
  displayMap(locations);
}

if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value;
    const password =
      document.getElementById("password").value;
    login(email, password);
  });
}

if (logoutBtn) {
  logoutBtn.addEventListener("click", logout);
}

if (updateDataForm) {
  updateDataForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const form = new FormData();
    form.append(
      "name",
      document.getElementById("name").value
    );
    form.append(
      "email",
      document.getElementById("email").value
    );
    form.append(
      "photo",
      document.getElementById("photo").files[0]
    );
    updateData(form);
  });
}

if (updatePasswordForm) {
  updatePasswordForm.addEventListener("submit", (e) => {
    e.preventDefault();

    document.querySelector(
      ".btn--password-save"
    ).textContent = "Updating...";

    const currentPassword = document.getElementById(
      "password-current"
    ).value;
    const newPassword =
      document.getElementById("password").value;
    const passwordConfirm = document.getElementById(
      "password-confirm"
    ).value;

    updatePassword(
      currentPassword,
      newPassword,
      passwordConfirm
    );

    document.querySelector(
      ".btn--password-save"
    ).textContent = "SAVE PASSWORD";
  });
}
