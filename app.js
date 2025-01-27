class TimetableApp {
  constructor() {
      this.subjects = JSON.parse(localStorage.getItem('subjects')) || [
          { id: 1, name: 'Math', color: '#ef4444' },
          { id: 2, name: 'Science', color: '#22c55e' },
          { id: 3, name: 'English', color: '#3b82f6' },
          { id: 4, name: 'History', color: '#f59e0b' },
      ];

      this.timetable = JSON.parse(localStorage.getItem('timetable')) || this.createEmptyTimetable();
      this.selectedCell = null;

      this.init();
  }

  init() {
      this.setupEventListeners();
      this.renderTimetable();
  }

  createEmptyTimetable() {
      const times = [];
      const start = moment('08:00', 'HH:mm');
      const end = moment('17:00', 'HH:mm');

      while (start.isBefore(end)) {
          times.push(start.format('HH:mm') + ' - ' + start.add(30, 'minutes').format('HH:mm'));
      }

      return times.map(time => ({
          time,
          monday: null,
          tuesday: null,
          wednesday: null,
          thursday: null,
          friday: null,
      }));
  }

  setupEventListeners() {
      document.getElementById('editSubjects').addEventListener('click', () => this.openSubjectEditor());
      document.getElementById('exportData').addEventListener('click', () => this.exportData());
      document.getElementById('importData').addEventListener('click', () => document.getElementById('importFile').click());
      document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));
      document.getElementById('addSubject').addEventListener('click', () => this.addSubject());
      document.getElementById('closeModal').addEventListener('click', () => this.closeSubjectEditor());
      document.getElementById('closePickerModal').addEventListener('click', () => this.closeSubjectPickerModal());
      document.getElementById('saveSubject').addEventListener('click', () => this.saveSubjectToCell());
  }

  renderTimetable() {
      const timetableBody = document.getElementById('timetableBody');
      timetableBody.innerHTML = '';

      this.timetable.forEach((row, rowIndex) => {
          const timeCell = document.createElement('div');
          timeCell.className = 'timetable-cell';
          timeCell.textContent = row.time;
          timetableBody.appendChild(timeCell);

          ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'].forEach(day => {
              const cell = document.createElement('div');
              cell.className = 'timetable-cell';

              if (row[day]) {
                  const subject = this.subjects.find(s => s.id === row[day]);
                  if (subject) {
                      const subjectEl = document.createElement('div');
                      subjectEl.className = 'subject';
                      subjectEl.textContent = subject.name;
                      subjectEl.style.backgroundColor = subject.color;
                      subjectEl.style.color = this.getContrastColor(subject.color);
                      cell.appendChild(subjectEl);
                  }
              }

              cell.addEventListener('click', () => this.openSubjectPickerModal(rowIndex, day));
              timetableBody.appendChild(cell);
          });
      });
  }

  openSubjectPickerModal(rowIndex, day) {
      this.selectedCell = { rowIndex, day };
      const subjectPicker = document.getElementById('subjectPicker');
      subjectPicker.innerHTML = '<option value="">None</option>';
      this.subjects.forEach(subject => {
          const option = document.createElement('option');
          option.value = subject.id;
          option.textContent = subject.name;
          subjectPicker.appendChild(option);
      });
      document.getElementById('subjectPickerModal').style.display = 'flex';
  }

  closeSubjectPickerModal() {
      this.selectedCell = null;
      document.getElementById('subjectPickerModal').style.display = 'none';
  }

  saveSubjectToCell() {
      const subjectId = parseInt(document.getElementById('subjectPicker').value) || null;
      const { rowIndex, day } = this.selectedCell;
      this.timetable[rowIndex][day] = subjectId;
      this.closeSubjectPickerModal();
      this.saveTimetable();
      this.renderTimetable();
  }

    handleCellClick(rowIndex, day) {
        const subject = prompt('Enter subject ID (or leave empty to clear):');
        if (subject === null) return;

        if (subject === '') {
            this.timetable[rowIndex][day] = null;
        } else {
            const subjectId = parseInt(subject);
            if (this.subjects.some(s => s.id === subjectId)) {
                this.timetable[rowIndex][day] = subjectId;
            } else {
                alert('Invalid subject ID');
            }
        }

        this.saveTimetable();
        this.renderTimetable();
    }

    openSubjectEditor() {
        document.getElementById('subjectModal').style.display = 'flex';
        this.renderSubjectList();
    }

    closeSubjectEditor() {
        document.getElementById('subjectModal').style.display = 'none';
    }

    renderSubjectList() {
        const subjectList = document.getElementById('subjectList');
        subjectList.innerHTML = '';

        this.subjects.forEach(subject => {
            const item = document.createElement('div');
            item.className = 'subject-item';
            
            const nameInput = document.createElement('input');
            nameInput.value = subject.name;
            nameInput.addEventListener('change', (e) => this.updateSubject(subject.id, 'name', e.target.value));

            const colorInput = document.createElement('input');
            colorInput.type = 'color';
            colorInput.value = subject.color;
            colorInput.addEventListener('change', (e) => this.updateSubject(subject.id, 'color', e.target.value));

            const deleteBtn = document.createElement('button');
            deleteBtn.textContent = 'Delete';
            deleteBtn.addEventListener('click', () => this.deleteSubject(subject.id));

            item.appendChild(nameInput);
            item.appendChild(colorInput);
            item.appendChild(deleteBtn);
            subjectList.appendChild(item);
        });
    }

    addSubject() {
        const newId = Math.max(...this.subjects.map(s => s.id), 0) + 1;
        this.subjects.push({
            id: newId,
            name: 'New Subject',
            color: '#' + Math.floor(Math.random()*16777215).toString(16)
        });
        this.saveSubjects();
        this.renderSubjectList();
    }

    updateSubject(id, field, value) {
        const subject = this.subjects.find(s => s.id === id);
        if (subject) {
            subject[field] = value;
            this.saveSubjects();
            this.renderTimetable();
        }
    }

    deleteSubject(id) {
        this.subjects = this.subjects.filter(s => s.id !== id);
        this.timetable.forEach(row => {
            Object.keys(row).forEach(day => {
                if (row[day] === id) row[day] = null;
            });
        });
        this.saveSubjects();
        this.saveTimetable();
        this.renderSubjectList();
        this.renderTimetable();
    }

    exportData() {
        const data = {
            subjects: this.subjects,
            timetable: this.timetable
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'timetable.json';
        a.click();
        URL.revokeObjectURL(url);
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                this.subjects = data.subjects;
                this.timetable = data.timetable;
                this.saveSubjects();
                this.saveTimetable();
                this.renderTimetable();
                alert('Data imported successfully!');
            } catch (error) {
                alert('Error importing data. Please check the file format.');
            }
        };
        reader.readAsText(file);
    }

    saveSubjects() {
        localStorage.setItem('subjects', JSON.stringify(this.subjects));
    }

    saveTimetable() {
        localStorage.setItem('timetable', JSON.stringify(this.timetable));
    }

    getContrastColor(hexcolor) {
        const r = parseInt(hexcolor.substr(1,2), 16);
        const g = parseInt(hexcolor.substr(3,2), 16);
        const b = parseInt(hexcolor.substr(5,2), 16);

        // Calculate the luminance
        const luminance = 0.2126 * r + 0.7152 * g + 0.0722 * b;

        // Return black for light colors, white for dark colors
        return luminance > 128 ? '#000000' : '#FFFFFF';
    }
}

// Initialize the timetable app
document.addEventListener('DOMContentLoaded', () => {
    new TimetableApp();
});