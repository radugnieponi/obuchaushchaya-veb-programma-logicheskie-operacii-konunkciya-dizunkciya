document.getElementById('view-homework').addEventListener('click', async () => {
    const response = await fetch('/api/get-assignments');
    const assignments = await response.json();
    
    // Обработка отображения заданий
    const list = assignments.map(a => `<li><a href="${a.filePath}">${a.title}</a></li>`).join('');
    document.getElementById('student-actions').innerHTML = `<ul>${list}</ul>`;
});

document.getElementById('take-tests').addEventListener('click', async () => {
    const response = await fetch('/api/get-tests');
    const tests = await response.json();

    // Отображение тестов
    const list = tests.map(test => `<li>${test.title} - <button onclick="startTest(${test.id})">Пройти тест</button></li>`).join('');
    document.getElementById('student-actions').innerHTML = `<ul>${list}</ul>`;
});

function startTest(testId) {
    // Логика для запуска теста
    fetch(`/api/start-test/${testId}`)
    .then(response => response.json())
    .then(test => {
        // Отображаем вопросы и варианты ответов
        const form = document.createElement('form');
        test.questions.forEach((q, index) => {
            form.innerHTML += `<label>${q.text}</label><br>`;
            q.answers.forEach((ans, aIndex) => {
                form.innerHTML += `<input type="checkbox" name="question${index}" value="${aIndex}"> ${ans}<br>`;
            });
        });
        form.innerHTML += `<button type="submit">Отправить тест</button>`;
        document.getElementById('student-actions').appendChild(form);

        form.addEventListener('submit', (event) => {
            event.preventDefault();
            const results = new FormData(form);
            fetch(`/api/submit-test/${testId}`, {
                method: 'POST',
                body: JSON.stringify(Object.fromEntries(results)),
                headers: { 'Content-Type': 'application/json' }
            })
            .then(response => response.json())
            .then(result => alert(result.message));
        });
    });
}