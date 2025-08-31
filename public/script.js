const signinBtn = document.getElementById("signinBtn");
const loginBtn = document.getElementById("loginBtn");
const signinForm = document.getElementById("signinForm");
const loginForm = document.getElementById("loginForm");

let signup = document.querySelector("#signup");
let login = document.querySelector("#login");

let newUsername = document.querySelector("#newUsername");
let newPassword = document.querySelector("#newPassword");
let newEmail = document.querySelector("#newEmail");
let checkbox = document.querySelector("#checkbox");

const otpInput = document.querySelector("#otpInput");
const otpLabel = document.querySelector("#otpLabel");
const otpError = document.querySelector("#otpError");

let email = document.querySelector("#email");
let password = document.querySelector("#password");

let usernameError = document.querySelector("#usernameError");
let emailError = document.querySelector("#emailError");
let passwordError = document.querySelector("#passwordError");

let loginEmailError = document.querySelector("#loginEmailError");
let loginPasswordError = document.querySelector("#loginPasswordError");

// Switch between Sign Up and Login
signinBtn.onclick = () => {
    signinForm.style.display = "block";
    loginForm.style.display = "none";
};

loginBtn.onclick = () => {
    loginForm.style.display = "block";
    signinForm.style.display = "none";
};

let generatedOtp = null;
let signupData = null;

signup.addEventListener("click", async function (e) {
    e.preventDefault();

    // Reset errors
    usernameError.innerText = "";
    emailError.innerText = "";
    passwordError.innerText = "";
    otpError.innerText = "";

    let newUsernameVal = newUsername.value.trim();
    let newEmailVal = newEmail.value.trim();
    let newPasswordVal = newPassword.value;
    let roleVal = checkbox.checked ? "admin" : "user";

    // Validation
    let hasError = false;
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!newUsernameVal) {
        usernameError.innerText = "Username is required!";
        hasError = true;
    }
    if (!newEmailVal) {
        emailError.innerText = "Email is required!";
        hasError = true;
    } else if (!emailPattern.test(newEmailVal)) {
        emailError.innerText = "Invalid email!";
        hasError = true;
    }
    if (!newPasswordVal.trim()) {
        passwordError.innerText = "Password is required!";
        hasError = true;
    }else if (newPasswordVal.length < 8) {
    passwordError.innerText = "Password must be at least 8 characters!";
    hasError = true;
    }

    if (hasError) return;

    // Generate OTP
    generatedOtp = Math.floor(100000 + Math.random() * 900000);
    signupData = {
        username: newUsernameVal,
        email: newEmailVal,
        password: newPasswordVal,
        role: roleVal
    };

    try {
        const res = await fetch("http://localhost:3000/send-otp", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email: newEmailVal, otp: generatedOtp })
        });

        const data = await res.json();
        if (data.success) {
            swal("Sent!", "OTP has been sent to your registered email!", "success");
            otpLabel.style.display = "block";
            otpInput.style.display = "block";

            otpInput.addEventListener("change", async () => {
                otpError.innerText = "";
                if (otpInput.value.trim() === generatedOtp.toString()) {
                    try {
                        const res = await fetch("http://localhost:3000/signup", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify(signupData)
                        });

                        const result = await res.json();
                        if (result.success) {
                            window.location.href = result.redirect;
                        } else {
                            emailError.innerText = result.message || "Signup failed";
                        }
                    } catch (err) {
                        otpError.innerText = "Error completing signup.";
                    }
                } else {
                    otpError.innerText = "Invalid OTP. Please try again.";
                }
            }, { once: true });
        } else {
            emailError.innerText = "Failed to send OTP. Try again.";
        }
    } catch (err) {
        emailError.innerText = "Error sending OTP.";
    }
});

// Login handler
login.addEventListener("click", async function (e) {
    e.preventDefault();

    loginEmailError.innerText = "";
    loginPasswordError.innerText = "";

    const emailVal = email.value.trim();
    const passwordVal = password.value;

    if (!emailVal) {
        loginEmailError.innerText = "Email is required!";
        return;
    }
    if (!passwordVal) {
        loginPasswordError.innerText = "Password is required!";
        return;
    }

    try {
        const res = await fetch("http://localhost:3000/login", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            credentials: "include",
            body: JSON.stringify({ email: emailVal, password: passwordVal })
        });

        const result = await res.json();
        if (result.success) {
            window.location.href = result.redirect;
        } else {
            loginEmailError.innerText = result.message || "Login failed";
        }
    } catch (err) {
        loginEmailError.innerText = "Login error. Check your server.";
    }
});
