document.addEventListener('DOMContentLoaded', () => {
  const loginForm = document.getElementById('loginForm');
  const errorMessage = document.getElementById('errorMessage');

  // Проверяем, есть ли токен при загрузке страницы
  const token = localStorage.getItem('token');
  if (token) {
    redirectByRole();
  }

  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    try {
      const response = await fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          login: username,
          password: password
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Ошибка авторизации');
      }

      // Сохраняем данные в localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userId', data.id);

      // Перенаправляем пользователя
      redirectByRole();
    } catch (error) {
      errorMessage.textContent = error.message;
      errorMessage.style.display = 'block';
    }
  });

  function redirectByRole() {
    const role = localStorage.getItem('userRole');
    switch(role) {
      case 'Admin':
        window.location.href = 'admin.html';
        break;
      case 'Teacher':
        window.location.href = 'teacher.html';
        break;
      case 'Student':
        window.location.href = 'student.html';
        break;
      default:
        window.location.href = 'login.html';
    }
  }
});