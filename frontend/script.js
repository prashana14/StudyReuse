// Wait until the DOM is fully loaded
document.addEventListener('DOMContentLoaded', function() {
    // Check if the button exists before attaching the event listener
    const loginButton = document.querySelector('.login-btn');
    if (loginButton) {
        loginButton.addEventListener('click', function() {
            alert("Login feature coming soon!");
        });
    } else {
        console.warn('Login button not found!');
    }
});
