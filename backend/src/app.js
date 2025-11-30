require('dotenv').config();

const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const habitRoutes = require('./routes/habitRoutes');
const moodRoutes = require('./routes/moodRoutes');
const taskRoutes = require('./routes/taskRoutes');
const balanceRoutes = require('./routes/balanceRoutes');
const wellnessRoutes = require('./routes/wellnessRoutes');
const challengeRoutes = require('./routes/challengeRoutes');
const achievementRoutes = require('./routes/achievementRoutes');

const app = express();

app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/habits', habitRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/balance', balanceRoutes);
app.use('/api/wellness', wellnessRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/achievements', achievementRoutes);

app.get('/', (req, res) => {
    res.json({ message: 'MyBalance API funcionando correctamente' });
});

module.exports = app;
