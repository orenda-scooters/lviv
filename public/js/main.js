// API Configuration
const API_BASE_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:3000' 
    : window.location.origin;

// Global State
let selectedScooter = null;
let currentBooking = {
    name: '',
    age: '',
    phone: '',
    rentalDate: '',
    rentalTime: '',
    duration: '1',
    scooterId: '',
    scooterName: ''
};

// Initialize Date Picker
document.addEventListener('DOMContentLoaded', () => {
    flatpickr('#rentalDate', {
        minDate: 'today',
        dateFormat: 'Y-m-d',
        locale: 'uk',
        disable: [
            function(date) {
                return date.getDay() === 0; // Disable Sundays
            }
        ]
    });
    
    loadScooters();
    setupBookingForm();
    setupScooterSelection();
});

// Load Scooters from API
async function loadScooters() {
    try {
        const response = await fetch(`${API_BASE_URL}/api/scooters`);
        const scooters = await response.json();
        displayScooters(scooters);
        populateScooterOptions(scooters);
    } catch (error) {
        console.error('Error loading scooters:', error);
        showError('Не вдалося завантажити список скутерів');
    }
}

// Display Scooters on Homepage
function displayScooters(scooters) {
    const container = document.getElementById('scootersContainer');
    if (!container) return;
    
    container.innerHTML = '';
    
    scooters.forEach(scooter => {
        const card = document.createElement('div');
        card.className = 'scooter-card';
        card.dataset.id = scooter.id;
        
        card.innerHTML = `
            <div class="scooter-image">
                <i class="fas fa-motorcycle"></i>
            </div>
            <div class="scooter-info">
                <h3 class="scooter-name">${scooter.name}</h3>
                <p class="scooter-description">${scooter.description}</p>
                
                <div class="scooter-features">
                    ${scooter.features.map(feature => 
                        `<span class="feature-tag">${feature}</span>`
                    ).join('')}
                </div>
                
                <div class="scooter-specs">
                    <div class="spec">
                        <i class="fas fa-tachometer-alt"></i>
                        <span class="spec-value">${scooter.maxSpeed} км/год</span>
                        <span class="spec-label">Швидкість</span>
                    </div>
                    <div class="spec">
                        <i class="fas fa-road"></i>
                        <span class="spec-value">${scooter.range} км</span>
                        <span class="spec-label">Запас ходу</span>
                    </div>
                </div>
                
                <div class="availability">
                    <div>
                        <div class="price">${scooter.pricePerHour} грн/год</div>
                        <div class="${scooter.available > 0 ? 'available' : 'unavailable'}">
                            ${scooter.available > 0 
                                ? `${scooter.available} доступно` 
                                : 'Немає в наявності'}
                        </div>
                    </div>
                    <button class="select-btn" 
                            ${scooter.available === 0 ? 'disabled' : ''}
                            onclick="selectScooter('${scooter.id}')">
                        ${scooter.available > 0 ? 'Обрати' : 'Немає'}
                    </button>
                </div>
            </div>
        `;
        
        container.appendChild(card);
    });
}

// Populate Scooter Options in Booking Form
function populateScooterOptions(scooters) {
    const container = document.getElementById('scooterOptions');
    if (!container) return;
    
    container.innerHTML = '';
    
    scooters.forEach(scooter => {
        const option = document.createElement('div');
        option.className = 'scooter-option';
        option.dataset.id = scooter.id;
        option.dataset.name = scooter.name;
        option.dataset.price = scooter.pricePerHour;
        option.dataset.available = scooter.available;
        
        option.innerHTML = `
            <div class="option-image">
                <i class="fas fa-motorcycle"></i>
            </div>
            <div class="option-info">
                <h4>${scooter.name}</h4>
                <p>${scooter.pricePerHour} грн/год • ${scooter.available} доступно</p>
            </div>
            <div class="option-select">
                <input type="radio" name="scooter" value="${scooter.id}">
            </div>
        `;
        
        option.addEventListener('click', () => {
            document.querySelectorAll('.scooter-option').forEach(opt => {
                opt.classList.remove('selected');
            });
            option.classList.add('selected');
            option.querySelector('input').checked = true;
            
            selectedScooter = {
                id: scooter.id,
                name: scooter.name,
                price: scooter.pricePerHour
            };
            
            updateBookingSummary();
        });
        
        container.appendChild(option);
    });
}

// Select Scooter Function
function selectScooter(scooterId) {
    const scooterOptions = document.querySelectorAll('.scooter-option');
    scooterOptions.forEach(option => {
        if (option.dataset.id === scooterId) {
            option.click();
            
            // Scroll to booking section
            document.getElementById('booking').scrollIntoView({ 
                behavior: 'smooth' 
            });
            
            // Switch to booking form
            document.getElementById('step1').classList.remove('active');
            document.getElementById('step2').classList.add('active');
        }
    });
}

// Setup Booking Form
function setupBookingForm() {
    // Form validation
    const bookingForm = document.querySelector('.booking-form');
    if (!bookingForm) return;
    
    // Name validation
    document.getElementById('name').addEventListener('input', function() {
        this.value = this.value.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄ\s]/g, '');
        currentBooking.name = this.value;
    });
    
    // Age validation
    document.getElementById('age').addEventListener('input', function() {
        const age = parseInt(this.value);
        if (age < 18) {
            this.setCustomValidity('Мінімальний вік для оренди - 18 років');
        } else if (age > 80) {
            this.setCustomValidity('Максимальний вік для оренди - 80 років');
        } else {
            this.setCustomValidity('');
        }
        currentBooking.age = this.value;
    });
    
    // Phone validation
    document.getElementById('phone').addEventListener('input', function() {
        this.value = this.value.replace(/[^0-9+]/g, '');
        currentBooking.phone = this.value;
    });
    
    // Date and time
    document.getElementById('rentalDate').addEventListener('change', function() {
        currentBooking.rentalDate = this.value;
        updateBookingSummary();
    });
    
    document.getElementById('rentalTime').addEventListener('change', function() {
        currentBooking.rentalTime = this.value;
        updateBookingSummary();
    });
    
    // Duration
    document.getElementById('duration').addEventListener('change', function() {
        currentBooking.duration = this.value;
        updateBookingSummary();
    });
    
    // Submit booking
    const submitBtn = document.querySelector('.submit-booking');
    if (submitBtn) {
        submitBtn.addEventListener('click', submitBooking);
    }
}

// Setup Scooter Selection
function setupScooterSelection() {
    const scooterOptions = document.querySelectorAll('.scooter-option');
    scooterOptions.forEach(option => {
        option.addEventListener('click', () => {
            scooterOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            
            selectedScooter = {
                id: option.dataset.id,
                name: option.dataset.name,
                price: parseInt(option.dataset.price)
            };
            
            currentBooking.scooterId = option.dataset.id;
            currentBooking.scooterName = option.dataset.name;
            
            updateBookingSummary();
        });
    });
}

// Update Booking Summary
function updateBookingSummary() {
    const scooterName = document.getElementById('selectedScooterName');
    const priceElement = document.getElementById('selectedPrice');
    const durationElement = document.getElementById('selectedDuration');
    const totalPriceElement = document.getElementById('totalPrice');
    
    if (selectedScooter) {
        scooterName.textContent = selectedScooter.name;
        priceElement.textContent = selectedScooter.price;
    }
    
    const duration = parseInt(document.getElementById('duration').value) || 1;
    durationElement.textContent = duration;
    
    if (selectedScooter) {
        const totalPrice = selectedScooter.price * duration;
        totalPriceElement.textContent = totalPrice;
    }
}

// Submit Booking
async function submitBooking() {
    // Validate form
    const name = document.getElementById('name').value.trim();
    const age = document.getElementById('age').value;
    const phone = document.getElementById('phone').value.trim();
    const date = document.getElementById('rentalDate').value;
    const time = document.getElementById('rentalTime').value;
    
    if (!name || !age || !phone || !date || !time) {
        showError('Будь ласка, заповніть всі обов\'язкові поля');
        return;
    }
    
    if (!selectedScooter) {
        showError('Будь ласка, оберіть скутер');
        return;
    }
    
    const bookingData = {
        name: name,
        age: parseInt(age),
        phone: phone,
        rentalDate: date,
        rentalTime: time,
        duration: parseInt(currentBooking.duration),
        scooterId: selectedScooter.id,
        scooterName: selectedScooter.name,
        totalPrice: selectedScooter.price * parseInt(currentBooking.duration)
    };
    
    try {
        const response = await fetch(`${API_BASE_URL}/api/bookings`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(bookingData)
        });
        
        if (response.ok) {
            const result = await response.json();
            showSuccessModal();
            sendTelegramNotification(bookingData);
            resetBookingForm();
        } else {
            throw new Error('Помилка при створенні бронювання');
        }
    } catch (error) {
        console.error('Error submitting booking:', error);
        showError('Не вдалося створити бронювання. Спробуйте ще раз.');
    }
}

// Send Telegram Notification
function sendTelegramNotification(bookingData) {
    const telegramData = {
        botToken: '8094288522:AAEFWlATuy283xt3Mrt5dMn9PXKD7McHE0I',
        chatId: '7698760202',
        message: `
🚀 НОВЕ БРОНЮВАННЯ

👤 Клієнт: ${bookingData.name}
📞 Телефон: ${bookingData.phone}
🎂 Вік: ${bookingData.age}

🛵 Скутер: ${bookingData.scooterName}
📅 Дата: ${bookingData.rentalDate}
⏰ Час: ${bookingData.rentalTime}
⏳ Тривалість: ${bookingData.duration} год
💰 Вартість: ${bookingData.totalPrice} грн

🔔 Терміново зв'язатися!
        `
    };
    
    // В реальному проекті це відправляється на сервер
    console.log('Telegram notification:', telegramData);
    
    // Симуляція відправки в Telegram
    fetch(`https://api.telegram.org/bot${telegramData.botToken}/sendMessage`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            chat_id: telegramData.chatId,
            text: telegramData.message,
            parse_mode: 'HTML'
        })
    }).catch(error => {
        console.error('Error sending Telegram notification:', error);
    });
}

// Reset Booking Form
function resetBookingForm() {
    document.getElementById('name').value = '';
    document.getElementById('age').value = '';
    document.getElementById('phone').value = '';
    document.getElementById('rentalDate').value = '';
    document.getElementById('rentalTime').value = '';
    document.getElementById('duration').value = '1';
    
    document.querySelectorAll('.scooter-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    
    selectedScooter = null;
    
    // Reset to first step
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    document.getElementById('step1').classList.add('active');
    
    updateBookingSummary();
}

// Show Success Modal
function showSuccessModal() {
    const modal = document.getElementById('successModal');
    modal.classList.add('active');
    
    document.getElementById('closeModal').addEventListener('click', () => {
        modal.classList.remove('active');
    });
    
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
        }
    });
}

// Show Error Message
function showError(message) {
    toastr.error(message, 'Помилка', {
        positionClass: 'toast-top-right',
        timeOut: 5000,
        closeButton: true,
        progressBar: true,
        newestOnTop: true
    });
}

// Show Success Message
function showSuccess(message) {
    toastr.success(message, 'Успіх', {
        positionClass: 'toast-top-right',
        timeOut: 3000,
        closeButton: true,
        progressBar: true,
        newestOnTop: true
    });
}

// Contact Phone Click
document.addEventListener('DOMContentLoaded', () => {
    const contactLinks = document.querySelectorAll('.contact-link');
    contactLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const phoneNumber = link.textContent.replace(/\s/g, '');
            
            // Copy to clipboard
            navigator.clipboard.writeText(phoneNumber).then(() => {
                showSuccess('Номер скопійовано в буфер обміну');
            });
        });
    });
});
