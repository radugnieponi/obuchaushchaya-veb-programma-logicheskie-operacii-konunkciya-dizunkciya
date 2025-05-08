// Функция для создания преподавателя
const createTeacher = async (teacherData) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/create-teacher', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(teacherData)
      });
      
      if (!response.ok) throw new Error('Ошибка создания преподавателя');
      
      const data = await response.json();
      alert(`Преподаватель создан с ID: ${data.id}`);
      document.getElementById('create-teacher-modal').classList.add('hidden');
      document.getElementById('teacher-form').reset();
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Не удалось создать преподавателя');
    }
  };
  
  // Функция для создания студента
  const createStudent = async (studentData) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/create-student', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(studentData)
      });
      
      if (!response.ok) throw new Error('Ошибка создания студента');
      
      const data = await response.json();
      alert(`Студент создан с ID: ${data.id}`);
      document.getElementById('create-student-modal').classList.add('hidden');
      document.getElementById('student-form').reset();
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Не удалось создать студента');
    }
  };
  
  // Функция для загрузки списка студентов
  const loadStudents = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/students', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) throw new Error('Ошибка загрузки студентов');
      
      return await response.json();
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Не удалось загрузить список студентов');
      return [];
    }
  };
  
  // Функция для создания группы
  const createGroup = async (studentIds) => {
    try {
      const response = await fetch('http://localhost:5000/api/admin/create-group', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ studentIds })
      });
      
      if (!response.ok) throw new Error('Ошибка создания группы');
      
      const data = await response.json();
      alert(`Группа создана с ID: ${data.id}`);
      document.getElementById('create-group-modal').classList.add('hidden');
    } catch (err) {
      console.error('Ошибка:', err);
      alert('Не удалось создать группу');
    }
  };
  
  // Обработчики форм
  document.getElementById('teacher-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const teacherData = {
      fullName: document.getElementById('teacher-fullname').value,
      birthDate: document.getElementById('teacher-birthdate').value,
      subject: document.getElementById('teacher-subject').value
    };
    createTeacher(teacherData);
  });
  
  document.getElementById('student-form').addEventListener('submit', (e) => {
    e.preventDefault();
    const studentData = {
      fullName: document.getElementById('student-fullname').value,
      birthDate: document.getElementById('student-birthdate').value
    };
    createStudent(studentData);
  });
  
  document.getElementById('group-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const selectedStudents = Array.from(document.querySelectorAll('.student-checkbox:checked'))
      .map(checkbox => parseInt(checkbox.value));
    
    if (selectedStudents.length === 0) {
      alert('Выберите хотя бы одного студента');
      return;
    }
    
    await createGroup(selectedStudents);
  });
  
  // Инициализация модальных окон
  document.getElementById('create-teacher-btn').addEventListener('click', () => {
    document.getElementById('create-teacher-modal').classList.remove('hidden');
  });
  
  document.getElementById('create-student-btn').addEventListener('click', () => {
    document.getElementById('create-student-modal').classList.remove('hidden');
  });
  
  document.getElementById('create-group-btn').addEventListener('click', async () => {
    const modal = document.getElementById('create-group-modal');
    modal.classList.remove('hidden');
    
    const students = await loadStudents();
    const studentsList = document.getElementById('students-list');
    studentsList.innerHTML = '';
    
    if (students.length === 0) {
      studentsList.innerHTML = '<div class="list-item">Нет доступных студентов</div>';
      return;
    }
    
    students.forEach(student => {
      const studentItem = document.createElement('div');
      studentItem.className = 'list-item';
      studentItem.innerHTML = `
        <label>
          <input type="checkbox" class="student-checkbox" value="${student.id}">
          ${student.fullName} (ID: ${student.id})
        </label>
      `;
      studentsList.appendChild(studentItem);
    });
  });