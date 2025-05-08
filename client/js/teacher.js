document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      window.location.href = 'index.html';
      return;
    }
    
    // Элементы интерфейса
    const logoutBtn = document.getElementById('logout-btn');
    const coursesList = document.getElementById('courses-list');
    const courseDetails = document.getElementById('course-details');
    const homeworkModal = document.getElementById('homework-modal');
    const testModal = document.getElementById('test-modal');
    const closeModalBtns = document.querySelectorAll('.close-modal');
    const uploadHomeworkForm = document.getElementById('upload-homework-form');
    const createTestForm = document.getElementById('create-test-form');
    const addQuestionBtn = document.getElementById('add-question-btn');
    const testQuestionsContainer = document.getElementById('test-questions-container');
    
    let currentCourseId = null;
    
    // Выход из системы
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      window.location.href = 'index.html';
    });
    
    // Закрытие модальных окон
    closeModalBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        homeworkModal.classList.add('hidden');
        testModal.classList.add('hidden');
      });
    });
    
    // Загрузка курсов преподавателя
    const loadTeacherCourses = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/teacher/courses?teacherId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки курсов');
        }
        
        const courses = await response.json();
        renderCoursesList(courses);
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось загрузить курсы');
      }
    };
    
    // Отображение списка курсов
    const renderCoursesList = (courses) => {
      coursesList.innerHTML = '';
      
      if (courses.length === 0) {
        coursesList.innerHTML = '<div class="list-item">Нет доступных курсов</div>';
        return;
      }
      
      courses.forEach(course => {
        const courseItem = document.createElement('div');
        courseItem.className = 'list-item';
        courseItem.textContent = course.name;
        courseItem.addEventListener('click', () => showCourseDetails(course));
        coursesList.appendChild(courseItem);
      });
    };
    
    // Показать детали курса
    const showCourseDetails = (course) => {
      currentCourseId = course.id;
      courseDetails.innerHTML = `
        <h3>${course.name}</h3>
        <p>Группа: ${course.groupName}</p>
        <div class="course-actions">
          <button id="upload-hw-btn" class="btn">Выложить домашнее задание</button>
          <button id="create-test-btn" class="btn">Создать тест</button>
        </div>
      `;
      
      courseDetails.classList.remove('hidden');
      
      document.getElementById('upload-hw-btn').addEventListener('click', () => {
        homeworkModal.classList.remove('hidden');
      });
      
      document.getElementById('create-test-btn').addEventListener('click', () => {
        testModal.classList.remove('hidden');
      });
    };
    
    // Загрузка домашнего задания
    uploadHomeworkForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const formData = new FormData();
      formData.append('title', document.getElementById('hw-title').value);
      formData.append('description', document.getElementById('hw-description').value);
      formData.append('file', document.getElementById('hw-file').files[0]);
      formData.append('courseId', currentCourseId);
      formData.append('teacherId', userId);
      
      try {
        const response = await fetch('http://localhost:5000/api/teacher/upload-homework', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки задания');
        }
        
        alert('Домашнее задание успешно загружено');
        homeworkModal.classList.add('hidden');
        uploadHomeworkForm.reset();
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось загрузить домашнее задание');
      }
    });
    
    // Добавление вопроса в тест
    addQuestionBtn.addEventListener('click', () => {
      const questionCount = document.querySelectorAll('.question-container').length + 1;
      const questionHtml = `
        <div class="question-container" data-question-id="${questionCount}">
          <div class="form-group">
            <label>Вопрос ${questionCount}:</label>
            <input type="text" class="question-text" required>
          </div>
          <div class="form-group">
            <label>Ответ 1:</label>
            <input type="text" class="answer-option" required>
          </div>
          <div class="form-group">
            <label>Ответ 2:</label>
            <input type="text" class="answer-option" required>
          </div>
          <div class="form-group">
            <label>Ответ 3:</label>
            <input type="text" class="answer-option" required>
          </div>
          <div class="form-group">
            <label>Ответ 4:</label>
            <input type="text" class="answer-option" required>
          </div>
          <div class="form-group">
            <label>Правильные ответы (через пробел):</label>
            <input type="text" class="correct-answers" required>
          </div>
          <button type="button" class="remove-question-btn btn">Удалить вопрос</button>
        </div>
      `;
      
      testQuestionsContainer.insertAdjacentHTML('beforeend', questionHtml);
      
      // Добавляем обработчик для новой кнопки удаления
      const newQuestion = testQuestionsContainer.lastElementChild;
      newQuestion.querySelector('.remove-question-btn').addEventListener('click', () => {
        newQuestion.remove();
        updateQuestionNumbers();
      });
    });
    
    // Обновление нумерации вопросов
    const updateQuestionNumbers = () => {
      const questions = document.querySelectorAll('.question-container');
      questions.forEach((question, index) => {
        question.dataset.questionId = index + 1;
        question.querySelector('label').textContent = `Вопрос ${index + 1}:`;
      });
    };
    
    // Создание теста
    createTestForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const title = document.getElementById('test-title').value;
      const description = document.getElementById('test-description').value;
      const questions = [];
      
      document.querySelectorAll('.question-container').forEach(questionEl => {
        const questionText = questionEl.querySelector('.question-text').value;
        const answers = [
          questionEl.querySelectorAll('.answer-option')[0].value,
          questionEl.querySelectorAll('.answer-option')[1].value,
          questionEl.querySelectorAll('.answer-option')[2].value,
          questionEl.querySelectorAll('.answer-option')[3].value
        ];
        const correctAnswers = questionEl.querySelector('.correct-answers').value;
        
        questions.push({
          questionText,
          answers,
          correctAnswers
        });
      });
      
      // Проверка количества вопросов
      if (questions.length < 15) {
        alert('Тест должен содержать не менее 15 вопросов');
        return;
      }
      
      // Проверка количества вопросов с несколькими ответами
      const multiAnswerQuestions = questions.filter(q => q.correctAnswers.split(' ').length > 1);
      if (multiAnswerQuestions.length < 3) {
        alert('Тест должен содержать не менее 3 вопросов с несколькими правильными ответами');
        return;
      }
      
      try {
        const response = await fetch('http://localhost:5000/api/teacher/create-test', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            title,
            description,
            courseId: currentCourseId,
            teacherId: userId,
            questions
          })
        });
        
        if (!response.ok) {
          throw new Error('Ошибка создания теста');
        }
        
        alert('Тест успешно создан');
        testModal.classList.add('hidden');
        createTestForm.reset();
        testQuestionsContainer.innerHTML = `
          <div class="question-container" data-question-id="1">
            <div class="form-group">
              <label>Вопрос 1:</label>
              <input type="text" class="question-text" required>
            </div>
            <div class="form-group">
              <label>Ответ 1:</label>
              <input type="text" class="answer-option" required>
            </div>
            <div class="form-group">
              <label>Ответ 2:</label>
              <input type="text" class="answer-option" required>
            </div>
            <div class="form-group">
              <label>Ответ 3:</label>
              <input type="text" class="answer-option" required>
            </div>
            <div class="form-group">
              <label>Ответ 4:</label>
              <input type="text" class="answer-option" required>
            </div>
            <div class="form-group">
              <label>Правильные ответы (через пробел):</label>
              <input type="text" class="correct-answers" required>
            </div>
          </div>
        `;
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось создать тест');
      }
    });
    
    // Инициализация страницы
    loadTeacherCourses();
  });