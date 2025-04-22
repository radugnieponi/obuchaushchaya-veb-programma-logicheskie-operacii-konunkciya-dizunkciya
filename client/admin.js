document.getElementById('create-teacher').addEventListener('click', async () => {
    const username = prompt("Введите логин учителя:");
    const password = prompt("Введите пароль учителя:");
    const dob = prompt("Введите дату рождения учителя (YYYY-MM-DD):");

    try {
        const response = await fetch('/api/register', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ username, password, role: 'teacher', dob }),
        });

        const result = await response.json();
        if (result.success) {
            alert('Учитель создан успешно!');
        } else {
            alert(result.message);
        }
    } catch (error) {
        console.error('Ошибка:', error);
    }
});