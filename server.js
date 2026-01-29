const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Проста база даних у пам'яті (для Koder)
let scooters = [
    {
        id: '1',
        name: 'Xiaomi Mi Electric Scooter Pro 2',
        description: 'Потужний електричний скутер з запасом ходу 45 км',
        image: 'https://images.unsplash.com/photo-1579445710183-f9a816c80c8d?w=500',
        pricePerHour: 150,
        available: 5,
        maxSpeed: 80,
        range: 150,
        features: ['Підсвітка', 'GPS', 'Режим турбо']
    },
    {
        id: '2',
        name: 'Segway Ninebot MAX G30',
        description: 'Надійний скутер з великим запасом ходу',
        image: 'https://images.unsplash.com/photo-1561637271-93b12c38df4f?w-500',
        pricePerHour: 180,
        available: 3,
        maxSpeed: 85,
        range: 160,
        features: ['Водонепроникність', 'Двоїсті гальма', 'Мобільний додаток']
    }
];

let bookings = [];
let adminPassword = 'He3nX59jw1q92ws';

// Маршрути для скутерів
app.get('/api/scooters', (req, res) => {
    res.json(scooters);
});

app.post('/api/scooters', (req, res) => {
    const newScooter = {
        id: Date.now().toString(),
        ...req.body
    };
    scooters.push(newScooter);
    res.json(newScooter);
});

app.put('/api/scooters/:id', (req, res) => {
    const id = req.params.id;
    const index = scooters.findIndex(s => s.id === id);
    
    if (index !== -1) {
        scooters[index] = { ...scooters[index], ...req.body };
        res.json(scooters[index]);
    } else {
        res.status(404).json({ error: 'Скутер не знайдено' });
    }
});

app.delete('/api/scooters/:id', (req, res) => {
    scooters = scooters.filter(s => s.id !== req.params.id);
    res.json({ success: true });
});

// Маршрути для бронювань
app.get('/api/bookings', (req, res) => {
    res.json(bookings);
});

app.post('/api/bookings', (req, res) => {
    const booking = {
        id: Date.now().toString(),
        ...req.body,
        status: 'pending',
        createdAt: new Date()
    };
    bookings.push(booking);
    
    // Надсилання в Telegram (симуляція)
    console.log('Telegram notification:', {
        to: '7698760202',
        message: `Нове бронювання від ${booking.name}`
    });
    
    res.json(booking);
});

app.put('/api/bookings/:id', (req, res) => {
    const id = req.params.id;
    const index = bookings.findIndex(b => b.id === id);
    
    if (index !== -1) {
        bookings[index] = { ...bookings[index], ...req.body };
        res.json(bookings[index]);
    } else {
        res.status(404).json({ error: 'Бронювання не знайдено' });
    }
});

// Аутентифікація адміна
app.post('/api/admin/login', (req, res) => {
    const { password } = req.body;
    if (password === adminPassword) {
        res.json({ success: true, token: 'admin-token' });
    } else {
        res.status(401).json({ error: 'Невірний пароль' });
    }
});

// Статистика
app.get('/api/stats', (req, res) => {
    res.json({
        totalScooters: scooters.length,
        totalBookings: bookings.length,
        pendingBookings: bookings.filter(b => b.status === 'pending').length
    });
});

// Обслуговування HTML файлів
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`🚀 Сервер запущено на http://localhost:${PORT}`);
    console.log(`🔧 Адмін-панель: http://localhost:${PORT}/admin`);
    console.log(`🔑 Пароль адміна: He3nX59jw1q92ws`);
});
