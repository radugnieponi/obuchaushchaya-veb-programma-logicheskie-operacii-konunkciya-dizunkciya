document.getElementById('login-form').addEventListener('submit', async function(event) {
    event.preventDefault();

    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password }),
        });

        const data = await response.json();
        if (data.success) {
            localStorage.setItem('token', data.token); // Сохранение токена
            window.location.href = `/${data.role}.html`; // Перенаправление по роли
        } else {
            document.getElementById('errorMessage').innerText = data.message;
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
});