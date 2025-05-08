document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (!token || !userId) {
      window.location.href = 'index.html';
      return;
    }
    
    // Элементы интерфейса
    const logoutBtn = document.getElementById('logout-btn');
    const homeworkBtn = document.getElementById('homework-btn');
    const testsBtn = document.getElementById('tests-btn');
    const homeworkContent = document.getElementById('homework-content');
    const testsContent = document.getElementById('tests-content');
    const subjectsHwBtn = document.getElementById('subjects-hw-btn');
    const subjectsTestsBtn = document.getElementById('subjects-tests-btn');
    const subjectsHwList = document.getElementById('subjects-hw-list');
    const subjectsTestsList = document.getElementById('subjects-tests-list');
    const homeworksList = document.getElementById('homeworks-list');
    const testsList = document.getElementById('tests-list');
    
    let currentGroupId = null;
    let currentSubjectId = null;
    
    // Выход из системы
    logoutBtn.addEventListener('click', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userId');
      window.location.href = 'index.html';
    });
    
    // Переключение между разделами
    homeworkBtn.addEventListener('click', () => {
      homeworkContent.classList.remove('hidden');
      testsContent.classList.add('hidden');
      loadStudentGroup();
    });
    
    testsBtn.addEventListener('click', () => {
      testsContent.classList.remove('hidden');
      homeworkContent.classList.add('hidden');
      loadStudentGroup();
    });
    
    // Загрузка группы студента
    const loadStudentGroup = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/student/group?studentId=${userId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки группы');
        }
        
        const group = await response.json();
        currentGroupId = group.id;
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось загрузить информацию о группе');
      }
    };
    
    // Показать предметы для домашних заданий
    subjectsHwBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/student/subjects?groupId=${currentGroupId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки предметов');
        }
        
        const subjects = await response.json();
        renderSubjectsList(subjects, subjectsHwList, showHomeworksForSubject);
        subjectsHwList.classList.remove('hidden');
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось загрузить список предметов');
      }
    });
    
    // Показать предметы для тестов
    subjectsTestsBtn.addEventListener('click', async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/student/subjects?groupId=${currentGroupId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки предметов');
        }
        
        const subjects = await response.json();
        renderSubjectsList(subjects, subjectsTestsList, showTestsForSubject);
        subjectsTestsList.classList.remove('hidden');
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось загрузить список предметов');
      }
    });
    
    // Отображение списка предметов
    const renderSubjectsList = (subjects, container, clickHandler) => {
      container.innerHTML = '';
      
      if (subjects.length === 0) {
        container.innerHTML = '<div class="list-item">Нет доступных предметов</div>';
        return;
      }
      
      subjects.forEach(subject => {
        const subjectItem = document.createElement('div');
        subjectItem.className = 'list-item';
        subjectItem.textContent = subject.name;
        subjectItem.addEventListener('click', () => clickHandler(subject));
        container.appendChild(subjectItem);
      });
    };
    
    // Показать домашние задания по предмету
    const showHomeworksForSubject = async (subject) => {
      currentSubjectId = subject.id;
      homeworksList.innerHTML = '<h3>Загрузка заданий...</h3>';
      homeworksList.classList.remove('hidden');
      
      try {
        const response = await fetch(`http://localhost:5000/api/student/homeworks?subjectId=${subject.id}&groupId=${currentGroupId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки заданий');
        }
        
        const homeworks = await response.json();
        renderHomeworksList(homeworks);
      } catch (err) {
        console.error('Ошибка:', err);
        homeworksList.innerHTML = '<h3>Не удалось загрузить задания</h3>';
      }
    };
    
    // Отображение списка домашних заданий
    const renderHomeworksList = (homeworks) => {
      homeworksList.innerHTML = '';
      
      if (homeworks.length === 0) {
        homeworksList.innerHTML = '<div class="list-item">Нет доступных заданий</div>';
        return;
      }
      
      const hwTitle = document.createElement('h3');
      hwTitle.textContent = 'Домашние задания';
      homeworksList.appendChild(hwTitle);
      
      homeworks.forEach(hw => {
        const hwItem = document.createElement('div');
        hwItem.className = 'file-item';
        
        hwItem.innerHTML = `
          <div>
            <h4>${hw.title}</h4>
            <p>${hw.description || 'Без описания'}</p>
            <small>Дата: ${new Date(hw.uploadDate).toLocaleDateString()}</small>
          </div>
          <div class="file-actions">
            <button class="download-hw-btn btn" data-filepath="${hw.filePath}">Скачать</button>
          </div>
        `;
        
        homeworksList.appendChild(hwItem);
      });
      
      // Добавляем обработчики для кнопок скачивания
      document.querySelectorAll('.download-hw-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const filePath = e.target.dataset.filepath;
          downloadFile(filePath);
        });
      });
    };
    
    // Показать тесты по предмету
    const showTestsForSubject = async (subject) => {
      currentSubjectId = subject.id;
      testsList.innerHTML = '<h3>Загрузка тестов...</h3>';
      testsList.classList.remove('hidden');
      
      try {
        const response = await fetch(`http://localhost:5000/api/student/tests?subjectId=${subject.id}&groupId=${currentGroupId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки тестов');
        }
        
        const tests = await response.json();
        renderTestsList(tests);
      } catch (err) {
        console.error('Ошибка:', err);
        testsList.innerHTML = '<h3>Не удалось загрузить тесты</h3>';
      }
    };
    
    // Отображение списка тестов
    const renderTestsList = (tests) => {
      testsList.innerHTML = '';
      
      if (tests.length === 0) {
        testsList.innerHTML = '<div class="list-item">Нет доступных тестов</div>';
        return;
      }
      
      const testsTitle = document.createElement('h3');
      testsTitle.textContent = 'Тесты';
      testsList.appendChild(testsTitle);
      
      tests.forEach(test => {
        const testItem = document.createElement('div');
        testItem.className = 'test-item';
        
        testItem.innerHTML = `
          <div>
            <h4>${test.title}</h4>
            <p>${test.description || 'Без описания'}</p>
            <small>Дата: ${new Date(test.creationDate).toLocaleDateString()}</small>
          </div>
          <div class="test-actions">
            <button class="download-test-btn btn" data-testid="${test.id}">Скачать</button>
          </div>
        `;
        
        testsList.appendChild(testItem);
      });
      
      // Добавляем обработчики для кнопок скачивания
      document.querySelectorAll('.download-test-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const testId = e.target.dataset.testid;
          downloadTest(testId);
        });
      });
    };
    
    // Скачивание файла
    const downloadFile = (filePath) => {
      window.open(`http://localhost:5000/api/student/download?filePath=${encodeURIComponent(filePath)}`, '_blank');
    };
    
    // Скачивание теста
    const downloadTest = async (testId) => {
      try {
        const response = await fetch(`http://localhost:5000/api/student/download-test?testId=${testId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Ошибка загрузки теста');
        }
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `test_${testId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      } catch (err) {
        console.error('Ошибка:', err);
        alert('Не удалось скачать тест');
      }
    };
  });