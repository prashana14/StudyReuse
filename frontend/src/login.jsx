import React, { useState } from "react";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e) => {
    e.preventDefault();  // prevent page reload

    fetch("http://localhost:5000/api/users/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email,
        password: password
      })
    })
      .then(res => res.json())
      .then(data => {
        console.log(data);

        if (data.token) {
          alert("Login Successful!");
          localStorage.setItem("token", data.token);
        } else {
          alert(data.message || "Login Failed");
        }
      })
      .catch(err => console.error(err));
  };

  return (
    <form onSubmit={handleLogin}>
      <input 
        type="email" 
        placeholder="Enter email" 
        onChange={(e) => setEmail(e.target.value)} 
      />
      <input 
        type="password" 
        placeholder="Enter password" 
        onChange={(e) => setPassword(e.target.value)} 
      />
      <button type="submit">Login</button>
    </form>
  );
}

export default Login;
