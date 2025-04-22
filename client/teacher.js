document.getElementById('upload-homework').addEventListener('click', () => {
    const form = document.createElement('form');
    form.innerHTML = `
        <input type="file" name="homeworkFile" required>
        <button type="submit">Загрузить домашнее задание</button>
    `;
    document.body.appendChild(form);

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        const formData = new FormData(form);

        fetch('/api/upload-assignment', {
            method: 'POST',
            body: formData,
        })
        .then(response => response.json())
        .then(result => {
            alert(result.message);
            document.body.removeChild(form); // Удаляем форму
        })
        .catch(error => console.error('Ошибка:', error));
    });
});