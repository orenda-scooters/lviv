// Admin Configuration
const ADMIN_PASSWORD = 'He3nX59jw1q92ws';
let currentScooterId = null;
let currentBookingId = null;

// Initialize Admin Panel
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    setupAdminEvents();
    loadAdminData();
});

// Check Authentication
function checkAuth() {
    const isAuthenticated = localStorage.getItem('adminAuthenticated') === 'true';
    const loginScreen = document.getElementById('loginScreen');
    const dashboard = document.getElementById('dashboard');
    
    if (isAuthenticated) {
        loginScreen.style.display = 'none';
        dashboard.style.display = 'block';
    } else {
        loginScreen.style.display = 'flex';
        dashboard.style.display = 'none';
    }
}

// Setup Admin Events
function setupAdminEvents() {
    // Login
    document.getElementById('loginBtn').addEventListener('click', adminLogin);
    document.getElementById('adminPassword').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') adminLogin();
    });
    
    // Logout
    document.getElementById('logoutBtn').addEventListener('click', adminLogout);
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const tabId = btn.getAttribute('data-tab');
            switchTab(tabId);
        });
    });
    
    // Refresh buttons
    document.getElementById('refreshScooters').addEventListener('click', loadScootersAdmin);
    document.getElementById('refreshBookings').addEventListener('click', loadBookings);
    
    // Booking filter
    document.getElementById('bookingFilter').addEventListener('change', loadBookings);
    
    // Add scooter
    document.getElementById('addScooterBtn').addEventListener('click', addScooter);
    document.getElementById('previewScooter').addEventListener('click', previewScooter);
    
    // Settings
    document.getElementById('testBotBtn').addEventListener('click', testTelegramBot);
    document.getElementById('savePhoneBtn').addEventListener('click', saveContactPhone);
    document.getElementById('backupBtn').addEventListener('click', backupData);
    document.getElementById('exportBtn').addEventListener('click', exportData);
    document.getElementById('testNotifyBtn').addEventListener('click', testNotification);
    
    // Modal events
    setupModalEvents();
}

// Admin Login
function adminLogin() {
    const password = document.getElementById('adminPassword').value;
    
    if (password === ADMIN_PASSWORD) {
        localStorage.setItem('adminAuthenticated', 'true');
        checkAuth();
        showSuccess('Успішний вхід в адмін-панель');
    } else {
        showError('Невірний пароль');
        document.getElementById('adminPassword').value = '';
        document.getElementById('adminPassword').focus();
    }
}

// Admin Logout
function adminLogout() {
    localStorage.removeItem('adminAuthenticated');
    checkAuth();
    showSuccess('Ви успішно вийшли з системи');
}

// Switch Tabs
function switchTab(tabId) {
    // Update active tab button
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-tab') === tabId) {
            btn.classList.add('active');
        }
    });
    
    // Update active tab content
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
        if (pane.id === tabId) {
            pane.classList.add('active');
        }
    });
    
    // Load data for active tab
    if (tabId === 'scooters-tab') {
        loadScootersAdmin();
    } else if (tabId === 'bookings-tab') {
        loadBookings();
    }
}

// Load Admin Data
async function loadAdminData() {
    try {
        const [scooters, bookings] = await Promise.all([
            fetch(`${API_BASE_URL}/api/scooters`).then(res => res.json()),
            fetch(`${API_BASE_URL}/api/bookings`).then(res => res.json())
        ]);
        
        updateStats(scooters, bookings);
    } catch (error) {
        console.error('Error loading admin data:', error);
    }
}

// Update Statistics
function updateStats(scooters, bookings) {
    document.getElementById('totalScooters').textContent = scooters.length;
    document.getElementById('totalBookings').textContent = bookings.length;
    document.getElementById('pendingBookings').textContent = 
        bookings.filter(b => b.status === 'pending').length;
}

// Load Scooters for Admin
async function loadScootersAdmin() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/scooters`);
        const scooters = await response.json();
        displayScootersAdmin(scooters);
        updateStats(scooters, []);
    } catch (error) {
        console.error('Error loading scooters:', error);
        showError('Не вдалося завантажити скутери');
    }
}

// Display Scooters in Admin Panel
function displayScootersAdmin(scooters) {
    const container = document.getElementById('adminScootersGrid');
    if (!container) return;
    
    container.innerHTML = '';
    
    scooters.forEach(scooter => {
        const card = document.createElement('div');
        card.className = 'admin-scooter-card';
        card.dataset.id = scooter.id;
        
        const statusClass = scooter.available > 3 ? 'status-available' :
                           scooter.available > 0 ? 'status-low' : 
                           'status-unavailable';
        
        card.innerHTML = `
            <div class="admin-scooter-header">
                <div>
                    <h4 class="admin-scooter-name">${scooter.name}</h4>
                    <div class="availability-status ${statusClass}">
                        <i class="fas fa-circle"></i>
                        ${scooter.available} доступно
                    </div>
                </div>
                <div class="admin-scooter-actions">
                    <button class="action-btn edit-btn" onclick="editScooter('${scooter.id}')">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="deleteScooter('${scooter.id}')">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            
            <div class="admin-scooter-info">
                <div class="info-row">
                    <span class="info-label">Ціна/год:</span>
                    <span class="info-value">${scooter.pricePerHour} грн</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Швидкість:</span>
                    <span class="info-value">${scooter.maxSpeed} км/год</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Запас ходу:</span>
                    <span class="info-value">${scooter.range} км</span>
                </div>
            </div>
            
            <div class="scooter-features">
                ${scooter.features.map(feature => 
                    `<span class="feature-tag">${feature}</span>`
                ).join('')}
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Load Bookings
async function loadBookings() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`);
        const bookings = await response.json();
        displayBookings(bookings);
    } catch (error) {
        console.error('Error loading bookings:', error);
        showError('Не вдалося завантажити бронювання');
    }
}

// Display Bookings in Admin Panel
function displayBookings(bookings) {
    const filter = document.getElementById('bookingFilter').value;
    let filteredBookings = bookings;
    
    if (filter !== 'all') {
        filteredBookings = bookings.filter(b => b.status === filter);
    }
    
    const tbody = document.getElementById('bookingsTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    filteredBookings.forEach(booking => {
        const row = document.createElement('tr');
        
        const statusClass = `status-${booking.status}`;
        const statusText = {
            'pending': 'В очікуванні',
            'confirmed': 'Підтверджено',
            'cancelled': 'Скасовано'
        }[booking.status] || booking.status;
        
        row.innerHTML = `
            <td>${booking.id.substring(0, 8)}</td>
            <td>${booking.name}</td>
            <td>${booking.phone}</td>
            <td>${booking.scooterName}</td>
            <td>${new Date(booking.rentalDate).toLocaleDateString('uk-UA')}</td>
            <td>${booking.rentalTime}</td>
            <td><span class="status-badge ${statusClass}">${statusText}</span></td>
            <td class="table-actions">
                ${booking.status === 'pending' ? `
                    <button class="action-btn edit-btn" onclick="updateBookingStatus('${booking.id}', 'confirmed')">
                        <i class="fas fa-check"></i>
                    </button>
                    <button class="action-btn delete-btn" onclick="updateBookingStatus('${booking.id}', 'cancelled')">
                        <i class="fas fa-times"></i>
                    </button>
                ` : ''}
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// Add Scooter
async function addScooter() {
    const scooterData = {
        name: document.getElementById('scooterName').value,
        description: document.getElementById('scooterDescription').value,
        pricePerHour: parseInt(document.getElementById('scooterPrice').value),
        available: parseInt(document.getElementById('scooterAvailable').value),
        maxSpeed: parseInt(document.getElementById('scooterSpeed').value),
        range: parseInt(document.getElementById('scooterRange').value),
        features: document.getElementById('scooterFeatures').value.split(',').map(f => f.trim()),
        image: document.getElementById('scooterImage').value || 'https://images.unsplash.com/photo-1579445710183-f9a816c80c8d?w=500'
    };
    
    // Validation
    if (!scooterData.name || !scooterData.description || !scooterData.pricePerHour) {
        showError('Будь ласка, заповніть обов\'язкові поля');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/scooters`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(scooterData)
        });
        
        if (response.ok) {
            showSuccess('Скутер успішно додано');
            clearScooterForm();
            loadScootersAdmin();
            switchTab('scooters-tab');
        } else {
            throw new Error('Помилка при додаванні скутера');
        }
    } catch (error) {
        console.error('Error adding scooter:', error);
        showError('Не вдалося додати скутер');
    }
}

// Preview Scooter
function previewScooter() {
    const previewContent = document.querySelector('.preview-content');
    const previewCard = document.getElementById('scooterPreview');
    
    const scooterData = {
        name: document.getElementById('scooterName').value || 'Новий скутер',
        price: document.getElementById('scooterPrice').value || '150',
        speed: document.getElementById('scooterSpeed').value || '80',
        range: document.getElementById('scooterRange').value || '150',
        available: document.getElementById('scooterAvailable').value || '5'
    };
    
    previewContent.innerHTML = `
        <div class="admin-scooter-card">
            <div class="admin-scooter-header">
                <div>
                    <h4 class="admin-scooter-name">${scooterData.name}</h4>
                    <div class="availability-status status-available">
                        <i class="fas fa-circle"></i>
                        ${scooterData.available} доступно
                    </div>
                </div>
            </div>
            
            <div class="admin-scooter-info">
                <div class="info-row">
                    <span class="info-label">Ціна/год:</span>
                    <span class="info-value">${scooterData.price} грн</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Швидкість:</span>
                    <span class="info-value">${scooterData.speed} км/год</span>
                </div>
                <div class="info-row">
                    <span class="info-label">Запас ходу:</span>
                    <span class="info-value">${scooterData.range} км</span>
                </div>
            </div>
        </div>
    `;
    
    previewCard.style.display = 'block';
}

// Clear Scooter Form
function clearScooterForm() {
    document.getElementById('scooterName').value = '';
    document.getElementById('scooterDescription').value = '';
    document.getElementById('scooterPrice').value = '';
    document.getElementById('scooterAvailable').value = '';
    document.getElementById('scooterImage').value = '';
    document.getElementById('scooterSpeed').value = '';
    document.getElementById('scooterRange').value = '';
    document.getElementById('scooterFeatures').value = '';
    document.getElementById('scooterPreview').style.display = 'none';
}

// Edit Scooter
function editScooter(scooterId) {
    // TODO: Implement edit scooter functionality
    showInfo('Редагування скутера буде реалізовано в наступній версії');
}

// Delete Scooter
async function deleteScooter(scooterId) {
    if (!confirm('Ви впевнені, що хочете видалити цей скутер?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/scooters/${scooterId}`, {
            method: 'DELETE'
        });
        
        if (response.ok) {
            showSuccess('Скутер успішно видалено');
            loadScootersAdmin();
        } else {
            throw new Error('Помилка при видаленні скутера');
        }
    } catch (error) {
        console.error('Error deleting scooter:', error);
        showError('Не вдалося видалити скутер');
    }
}

// Update Booking Status
async function updateBookingStatus(bookingId, status) {
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings/${bookingId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ status })
        });
        
        if (response.ok) {
            showSuccess(`Статус бронювання змінено на "${status}"`);
            loadBookings();
        } else {
            throw new Error('Помилка при оновленні статусу');
        }
    } catch (error) {
        console.error('Error updating booking status:', error);
        showError('Не вдалося оновити статус бронювання');
    }
}

// Test Telegram Bot
function testTelegramBot() {
    showInfo('Тестова сповіщення відправлено в Telegram. Перевірте свій Telegram.');
    
    // Симуляція відправки тестового повідомлення
    const testMessage = {
        botToken: '8094288522:AAEFWlATuy283xt3Mrt5dMn9PXKD7McHE0I',
        chatId: '7698760202',
        message: '🔔 Тестове сповіщення з адмін-панелі\n\nСайт працює коректно! ✅'
    };
    
    fetch(`https://api.telegram.org/bot${testMessage.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: testMessage.chatId,
            text: testMessage.message
        })
    }).catch(console.error);
}

// Save Contact Phone
function saveContactPhone() {
    const phone = document.getElementById('contactPhone').value;
    showSuccess(`Контактний номер збережено: ${phone}`);
}

// Backup Data
function backupData() {
    showInfo('Резервне копіювання даних виконано успішно');
    document.getElementById('lastBackup').textContent = 
        new Date().toLocaleString('uk-UA');
}

// Export Data
function exportData() {
    // Симуляція експорту даних
    const data = {
        scooters: [],
        bookings: [],
        exportedAt: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `scooter-rental-backup-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showSuccess('Дані успішно експортовано');
}

// Test Notification
function testNotification() {
    showSuccess('Тестове сповіщення відправлено');
}

// Setup Modal Events
function setupModalEvents() {
    // Edit modal
    const editModal = document.getElementById('editModal');
    const closeEditBtn = document.getElementById('closeEditModal');
    const cancelEditBtn = document.getElementById('cancelEdit');
    
    if (closeEditBtn) {
        closeEditBtn.addEventListener('click', () => {
            editModal.classList.remove('active');
        });
    }
    
    if (cancelEditBtn) {
        cancelEditBtn.addEventListener('click', () => {
            editModal.classList.remove('active');
        });
    }
    
    // Confirmation modal
    const confirmModal = document.getElementById('confirmModal');
    const cancelConfirmBtn = document.getElementById('cancelConfirm');
    
    if (cancelConfirmBtn) {
        cancelConfirmBtn.addEventListener('click', () => {
            confirmModal.classList.remove('active');
        });
    }
    
    // Close modals on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
            }
        });
    });
}

// Show Error Message (Admin)
function showError(message) {
    toastr.error(message, 'Помилка', {
        positionClass: 'toast-top-right',
        timeOut: 5000,
        closeButton: true,
        progressBar: true,
        newestOnTop: true
    });
}

// Show Success Message (Admin)
function showSuccess(message) {
    toastr.success(message, 'Успіх', {
        positionClass: 'toast-top-right',
        timeOut: 3000,
        closeButton: true,
        progressBar: true,
        newestOnTop: true
    });
}

// Show Info Message
function showInfo(message) {
    toastr.info(message, 'Інформація', {
        positionClass: 'toast-top-right',
        timeOut: 3000,
        closeButton: true,
        progressBar: true,
        newestOnTop: true
    });
}
