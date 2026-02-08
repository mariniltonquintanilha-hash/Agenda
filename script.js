// Variáveis globais
let currentDate = new Date();
let selectedDate = new Date();
let appointments = JSON.parse(localStorage.getItem('institutionalAgendaAppointments')) || {};
let darkMode = localStorage.getItem('darkMode') === 'true';
let editingAppointmentId = null;
let lastAddedAppointment = null;
let currentSharingAppointment = null;

// Inicializar tema
function initTheme() {
    if (darkMode) {
        document.body.classList.add('dark-mode');
    }
    updateCurrentDate();
    renderCalendar();
    renderAppointments();
}

// Atualizar data atual exibida
function updateCurrentDate() {
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    document.getElementById('currentDate').textContent = 
        selectedDate.toLocaleDateString('pt-BR', options);
}

// Renderizar calendário
function renderCalendar() {
    const calendarDays = document.getElementById('calendarDays');
    calendarDays.innerHTML = '';
    
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    // Atualizar mês/ano exibido
    const monthNames = [
        'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
        'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
    ];
    document.getElementById('monthYear').textContent = 
        `${monthNames[month]} ${year}`;
    
    // Primeiro dia do mês
    const firstDay = new Date(year, month, 1);
    // Último dia do mês
    const lastDay = new Date(year, month + 1, 0);
    // Dias no mês
    const daysInMonth = lastDay.getDate();
    // Dia da semana do primeiro dia (0 = domingo, 6 = sábado)
    const firstDayIndex = firstDay.getDay();
    
    // Dias do mês anterior
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    
    // Adicionar dias do mês anterior
    for (let i = firstDayIndex; i > 0; i--) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = prevMonthLastDay - i + 1;
        calendarDays.appendChild(day);
    }
    
    // Adicionar dias do mês atual
    const today = new Date();
    const isCurrentMonth = today.getMonth() === month && today.getFullYear() === year;
    
    for (let i = 1; i <= daysInMonth; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day';
        day.dataset.date = `${year}-${month + 1}-${i}`;
        
        const dayNumber = document.createElement('div');
        dayNumber.className = 'day-number';
        dayNumber.textContent = i;
        day.appendChild(dayNumber);
        
        // Verificar se é o dia atual
        if (isCurrentMonth && i === today.getDate()) {
            day.classList.add('current-day');
        }
        
        // Verificar se é o dia selecionado
        const isSelected = selectedDate.getDate() === i && 
                           selectedDate.getMonth() === month && 
                           selectedDate.getFullYear() === year;
        if (isSelected) {
            day.style.backgroundColor = 'var(--light-color)';
            day.style.borderColor = 'var(--secondary-color)';
        }
        
        // Verificar se há compromissos neste dia
        const dateKey = `${year}-${month + 1}-${i}`;
        if (appointments[dateKey] && appointments[dateKey].length > 0) {
            day.classList.add('has-appointment');
            
            // Mostrar quantos compromissos
            const appointmentCount = document.createElement('div');
            appointmentCount.style.fontSize = '0.7rem';
            appointmentCount.style.color = 'var(--accent-color)';
            appointmentCount.textContent = `${appointments[dateKey].length} compromisso(s)`;
            day.appendChild(appointmentCount);
        }
        
        // Adicionar evento de clique
        day.addEventListener('click', () => {
            selectedDate = new Date(year, month, i);
            updateCurrentDate();
            renderCalendar();
            renderAppointments();
            // Esconder botões de compartilhamento quando mudar de data
            document.getElementById('shareButtonsContainer').style.display = 'none';
        });
        
        calendarDays.appendChild(day);
    }
    
    // Adicionar dias do próximo mês para completar a grade
    const totalCells = 42; // 6 semanas * 7 dias
    const daysAdded = firstDayIndex + daysInMonth;
    const nextMonthDays = totalCells - daysAdded;
    
    for (let i = 1; i <= nextMonthDays; i++) {
        const day = document.createElement('div');
        day.className = 'calendar-day other-month';
        day.textContent = i;
        calendarDays.appendChild(day);
    }
}

// Renderizar compromissos do dia selecionado
function renderAppointments() {
    const appointmentsList = document.getElementById('appointmentsList');
    appointmentsList.innerHTML = '';
    
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    const dayAppointments = appointments[dateKey] || [];
    
    if (dayAppointments.length === 0) {
        const emptyMessage = document.createElement('div');
        emptyMessage.className = 'empty-appointments';
        emptyMessage.innerHTML = `
            <i class="far fa-calendar-times" style="font-size: 3rem; margin-bottom: 10px; opacity: 0.5;"></i>
            <p>Nenhum compromisso para esta data</p>
        `;
        appointmentsList.appendChild(emptyMessage);
        return;
    }
    
    // Ordenar compromissos por horário
    dayAppointments.sort((a, b) => {
        const timeA = a.time.split(':').map(Number);
        const timeB = b.time.split(':').map(Number);
        return timeA[0] - timeB[0] || timeA[1] - timeB[1];
    });
    
    // Adicionar cada compromisso
    dayAppointments.forEach((appointment, index) => {
        const appointmentItem = document.createElement('div');
        appointmentItem.className = 'appointment-item';
        appointmentItem.dataset.id = index;
        
        appointmentItem.innerHTML = `
            <div class="appointment-header">
                <div class="appointment-time">${appointment.time}</div>
                <div class="appointment-actions">
                    <button class="share-btn" data-datekey="${dateKey}" data-index="${index}">
                        <i class="fas fa-share-alt"></i>
                    </button>
                    <button class="edit-btn" data-id="${index}">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="delete-btn" data-id="${index}">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            <div class="appointment-title">${appointment.title}</div>
            <div class="appointment-description">${appointment.description}</div>
        `;
        
        appointmentsList.appendChild(appointmentItem);
    });
    
    // Adicionar eventos aos botões
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            deleteAppointment(id);
        });
    });
    
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.dataset.id);
            editAppointment(id);
        });
    });
    
    document.querySelectorAll('.share-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const dateKey = e.currentTarget.dataset.datekey;
            const index = parseInt(e.currentTarget.dataset.index);
            shareExistingAppointment(dateKey, index);
        });
    });
}

// Adicionar compromisso
function addAppointment() {
    const title = document.getElementById('appointmentTitle').value.trim();
    const time = document.getElementById('appointmentTime').value;
    const description = document.getElementById('appointmentDescription').value.trim();
    
    if (!title || !time) {
        alert('Por favor, preencha o título e o horário do compromisso.');
        return;
    }
    
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    
    if (!appointments[dateKey]) {
        appointments[dateKey] = [];
    }
    
    const newAppointment = {
        title,
        time,
        description,
        date: selectedDate.toLocaleDateString('pt-BR'),
        dateKey: dateKey
    };
    
    appointments[dateKey].push(newAppointment);
    
    // Salvar no localStorage
    localStorage.setItem('institutionalAgendaAppointments', JSON.stringify(appointments));
    
    // Salvar o último compromisso adicionado para compartilhamento
    lastAddedAppointment = newAppointment;
    lastAddedAppointment.index = appointments[dateKey].length - 1;
    currentSharingAppointment = lastAddedAppointment;
    
    // Mostrar botões de compartilhamento
    document.getElementById('shareButtonsContainer').style.display = 'block';
    
    // Limpar formulário
    document.getElementById('appointmentTitle').value = '';
    document.getElementById('appointmentTime').value = '';
    document.getElementById('appointmentDescription').value = '';
    
    // Atualizar exibição
    renderCalendar();
    renderAppointments();
    
    // Mostrar modal de compartilhamento
    showShareModal(newAppointment);
}

// Excluir compromisso
function deleteAppointment(id) {
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    
    if (confirm('Tem certeza que deseja excluir este compromisso?')) {
        appointments[dateKey].splice(id, 1);
        
        // Se não houver mais compromissos nesta data, remover a chave
        if (appointments[dateKey].length === 0) {
            delete appointments[dateKey];
        }
        
        // Salvar no localStorage
        localStorage.setItem('institutionalAgendaAppointments', JSON.stringify(appointments));
        
        // Atualizar exibição
        renderCalendar();
        renderAppointments();
    }
}

// Editar compromisso
function editAppointment(id) {
    const dateKey = `${selectedDate.getFullYear()}-${selectedDate.getMonth() + 1}-${selectedDate.getDate()}`;
    const appointment = appointments[dateKey][id];
    
    // Preencher formulário de edição
    document.getElementById('editTitle').value = appointment.title;
    document.getElementById('editTime').value = appointment.time;
    document.getElementById('editDescription').value = appointment.description;
    
    // Mostrar modal
    document.getElementById('editModal').style.display = 'flex';
    
    // Salvar ID do compromisso sendo editado
    editingAppointmentId = { dateKey, id };
}

// Salvar edição do compromisso
function saveEdit() {
    if (!editingAppointmentId) return;
    
    const { dateKey, id } = editingAppointmentId;
    const title = document.getElementById('editTitle').value.trim();
    const time = document.getElementById('editTime').value;
    const description = document.getElementById('editDescription').value.trim();
    
    if (!title || !time) {
        alert('Por favor, preencha o título e o horário do compromisso.');
        return;
    }
    
    // Atualizar compromisso
    appointments[dateKey][id] = { title, time, description };
    
    // Salvar no localStorage
    localStorage.setItem('institutionalAgendaAppointments', JSON.stringify(appointments));
    
    // Fechar modal
    closeEditModal();
    
    // Atualizar exibição
    renderCalendar();
    renderAppointments();
}

// Fechar modal de edição
function closeEditModal() {
    document.getElementById('editModal').style.display = 'none';
    editingAppointmentId = null;
}

// Função para mostrar modal de compartilhamento
function showShareModal(appointment) {
    currentSharingAppointment = appointment;
    const modal = document.getElementById('shareModal');
    const preview = document.getElementById('sharePreview');
    
    // Formatar data
    const dateObj = selectedDate;
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    // Criar preview do compromisso
    preview.innerHTML = `
        <strong>Detalhes do Compromisso:</strong><br><br>
        <strong>📅 Data:</strong> ${formattedDate}<br>
        <strong>⏰ Horário:</strong> ${appointment.time}<br>
        <strong>📋 Título:</strong> ${appointment.title}<br>
        <strong>📝 Descrição:</strong> ${appointment.description || '(Sem descrição)'}
    `;
    
    // Mostrar modal
    modal.style.display = 'flex';
    document.getElementById('successMessage').style.display = 'none';
}

// Função para fechar modal de compartilhamento
function closeShareModal() {
    document.getElementById('shareModal').style.display = 'none';
    document.getElementById('successMessage').style.display = 'none';
}

// Função para compartilhar por e-mail
function shareByEmail(appointment) {
    const dateObj = selectedDate;
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const subject = `Compromisso: ${appointment.title} - ${formattedDate}`;
    const body = `Detalhes do Compromisso:

📅 Data: ${formattedDate}
⏰ Horário: ${appointment.time}
📋 Título: ${appointment.title}
📝 Descrição: ${appointment.description || '(Sem descrição)'}

---
Enviado via Agenda Institucional`;
    
    const mailtoLink = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoLink, '_blank');
    
    showSuccessMessage();
}

// Função para compartilhar por WhatsApp
function shareByWhatsApp(appointment) {
    const dateObj = selectedDate;
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const message = `*Compromisso Agendado*

📅 *Data:* ${formattedDate}
⏰ *Horário:* ${appointment.time}
📋 *Título:* ${appointment.title}
📝 *Descrição:* ${appointment.description || '(Sem descrição)'}

---
Enviado via Agenda Institucional`;
    
    const whatsappLink = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappLink, '_blank');
    
    showSuccessMessage();
}

// Função para copiar detalhes
function copyToClipboard(appointment) {
    const dateObj = selectedDate;
    const formattedDate = dateObj.toLocaleDateString('pt-BR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    const text = `Compromisso Agendado

📅 Data: ${formattedDate}
⏰ Horário: ${appointment.time}
📋 Título: ${appointment.title}
📝 Descrição: ${appointment.description || '(Sem descrição)'}

---
Enviado via Agenda Institucional`;
    
    navigator.clipboard.writeText(text).then(() => {
        showSuccessMessage();
    }).catch(err => {
        console.error('Erro ao copiar: ', err);
        // Fallback para browsers mais antigos
        const textArea = document.createElement('textarea');
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        showSuccessMessage();
    });
}

// Função para mostrar mensagem de sucesso
function showSuccessMessage() {
    const successMessage = document.getElementById('successMessage');
    successMessage.style.display = 'block';
    
    // Esconder mensagem após 3 segundos
    setTimeout(() => {
        successMessage.style.display = 'none';
    }, 3000);
}

// Função para compartilhar compromisso existente
function shareExistingAppointment(dateKey, index) {
    const appointment = appointments[dateKey][index];
    appointment.dateKey = dateKey;
    appointment.index = index;
    showShareModal(appointment);
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Inicializar tema e calendário
    initTheme();
    
    // Toggle de tema
    document.getElementById('themeToggle').addEventListener('click', () => {
        darkMode = !darkMode;
        document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', darkMode);
    });
    
    // Navegação do calendário
    document.getElementById('prevMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() - 1);
        renderCalendar();
        document.getElementById('shareButtonsContainer').style.display = 'none';
    });
    
    document.getElementById('nextMonth').addEventListener('click', () => {
        currentDate.setMonth(currentDate.getMonth() + 1);
        renderCalendar();
        document.getElementById('shareButtonsContainer').style.display = 'none';
    });
    
    document.getElementById('todayBtn').addEventListener('click', () => {
        currentDate = new Date();
        selectedDate = new Date();
        updateCurrentDate();
        renderCalendar();
        renderAppointments();
        document.getElementById('shareButtonsContainer').style.display = 'none';
    });
    
    // Adicionar compromisso
    document.getElementById('addAppointment').addEventListener('click', addAppointment);
    
    // Permitir adicionar com Enter no campo de título
    document.getElementById('appointmentTitle').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            addAppointment();
        }
    });
    
    // Modal de edição
    document.getElementById('closeModal').addEventListener('click', closeEditModal);
    document.getElementById('cancelEdit').addEventListener('click', closeEditModal);
    document.getElementById('saveEdit').addEventListener('click', saveEdit);
    
    // Fechar modal ao clicar fora
    document.getElementById('editModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('editModal')) {
            closeEditModal();
        }
    });
    
    // Botões de compartilhamento no formulário
    document.getElementById('shareEmail').addEventListener('click', () => {
        if (lastAddedAppointment) {
            shareByEmail(lastAddedAppointment);
        }
    });
    
    document.getElementById('shareWhatsApp').addEventListener('click', () => {
        if (lastAddedAppointment) {
            shareByWhatsApp(lastAddedAppointment);
        }
    });
    
    document.getElementById('copyToClipboard').addEventListener('click', () => {
        if (lastAddedAppointment) {
            copyToClipboard(lastAddedAppointment);
        }
    });
    
    // Modal de compartilhamento
    document.getElementById('closeShareModal').addEventListener('click', closeShareModal);
    document.getElementById('modalShareEmail').addEventListener('click', () => {
        if (currentSharingAppointment) {
            shareByEmail(currentSharingAppointment);
        }
    });
    document.getElementById('modalShareWhatsApp').addEventListener('click', () => {
        if (currentSharingAppointment) {
            shareByWhatsApp(currentSharingAppointment);
        }
    });
    document.getElementById('modalCopyToClipboard').addEventListener('click', () => {
        if (currentSharingAppointment) {
            copyToClipboard(currentSharingAppointment);
        }
    });
    
    // Fechar modal de compartilhamento ao clicar fora
    document.getElementById('shareModal').addEventListener('click', (e) => {
        if (e.target === document.getElementById('shareModal')) {
            closeShareModal();
        }
    });
    
    // Definir horário padrão para o próximo intervalo de hora
    const now = new Date();
    const nextHour = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    document.getElementById('appointmentTime').value = nextHour;
    
    // Verificar se há compromissos para hoje e marcar no calendário
    const todayKey = `${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
    if (appointments[todayKey] && appointments[todayKey].length > 0) {
        // Já será marcado pelo renderCalendar
    }
});
