document.addEventListener('DOMContentLoaded', () => {
    const loginForm = document.getElementById('login');
    const registerForm = document.getElementById('register');
    const loginContainer = document.getElementById('loginForm');
    const registerContainer = document.getElementById('registerForm');

    // Toggle between login and register forms
    document.getElementById('showRegister').addEventListener('click', (e) => {
        e.preventDefault();
        loginContainer.style.display = 'none';
        registerContainer.style.display = 'block';
    });

    document.getElementById('showLogin').addEventListener('click', (e) => {
        e.preventDefault();
        registerContainer.style.display = 'none';
        loginContainer.style.display = 'block';
    });

    // Handle registration
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('registerName').value;
        const email = document.getElementById('registerEmail').value;
        const password = document.getElementById('registerPassword').value;

        const isEmailValid = email.includes('@');
        if (!isEmailValid) {
            alert('Please enter a valid email address');
            return;
        }

        const isPasswordLongEnough = password.length >= 6;
        if (!isPasswordLongEnough) {
            alert('Password must be at least 6 characters long');
            return;
        }

        try {
            await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify({ name, email, password })
            });

            alert('Registration successful! Please login.');
            registerContainer.style.display = 'none';
            loginContainer.style.display = 'block';
            registerForm.reset();

        } catch (error) {
            handleApiError(error);
        }
    });

    // Handle login
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        try {
            const response = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify({ email, password })
            });

            setAuthToken(response.token);
            setUserInfo(response.user);

            const isAdmin = response.user.isAdmin === 1;
            const redirectPage = isAdmin ? '/admin.html' : '/home.html';

            window.location.href = redirectPage;

        } catch (error) {
            handleApiError(error);
        }
    });
});
