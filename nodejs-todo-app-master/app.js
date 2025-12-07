const path = require('path');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcrypt');
const fs = require('fs');
const nodemailer = require('nodemailer');
const app = express();
const initDB = require('./db'); 

app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(session({
    secret: '860932',
    resave: false,
    saveUninitialized: false
}));

const transporter = nodemailer.createTransport({
    host: 'smtp.rambler.ru',
    port: 465,
    secure: true,
    auth: {
        user: 'EREEEEEA@rambler.ru',
        pass: 'C2g-CRu-VpR-RV8'
    }
});

function generateRandomPassword() {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+[]{}|';
    let password = '';
    for (let i = 0; i < 12; i++) password += charset.charAt(Math.floor(Math.random() * charset.length));
    return password;
}

(async () => {
    const conn = await initDB(); 

    app.get('/', (req, res) => {
        fs.readFile(path.join(__dirname, 'views', 'authorization.html'), 'utf8', (err, data) => {
            res.send(data.replace('{{message}}', ''));
        });
    });

    app.get('/register', (req, res) => {
        fs.readFile(path.join(__dirname, 'views', 'registration.html'), 'utf8', (err, data) => {
            res.send(data.replace('{{message}}', ''));
        });
    });

        app.get('/forgot-password', (req, res) => {
        fs.readFile(path.join(__dirname, 'views', 'forgotpass.html'), 'utf8', (err, data) => {
            res.send(data.replace('{{message}}', ''));
        });
    });

    app.post('/register', async (req, res) => {
        const { username, email, password } = req.body;
        const [exist] = await conn.query(`SELECT * FROM users WHERE login = ? OR email = ?`, [username, email]);
                
        if (exist.length > 0) {
            let message = '';
            const loginExists = exist.some(u => u.login === username);
            const emailExists = exist.some(u => u.email === email);

            if (loginExists && emailExists) message = 'Логин и Email уже заняты';
            else if (loginExists) message = 'Логин уже занят';
            else if (emailExists) message = 'Email уже занят';

            return fs.readFile(path.join(__dirname, 'views', 'registration.html'), 'utf8', (err, data) => {
                res.send(data.replace('{{message}}', `<p style="color:red; text-align:center;">${message}</p>`));
            });
        }

        const hash = await bcrypt.hash(password, 10);
        await conn.query(`INSERT INTO users (login, email, password) VALUES (?, ?, ?)`, [username, email, hash]);
        res.redirect('/');
    });

    app.post('/login', async (req, res) => {
        const { username, password } = req.body;
        const [rows] = await conn.query(`SELECT * FROM users WHERE login = ?`, [username]);

        if (rows.length === 0) {
            return fs.readFile(path.join(__dirname, 'views', 'authorization.html'), 'utf8', (err, data) => {
                res.send(data.replace('{{message}}', `<p style="color:red; text-align:center;">Неверный Логин</p>`));
            });
        }

        const user = rows[0];
        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return fs.readFile(path.join(__dirname, 'views', 'authorization.html'), 'utf8', (err, data) => {
                res.send(data.replace('{{message}}', `<p style="color:red; text-align:center;">Неверный пароль</p>`));
            });
        }

        req.session.userId = user.id_user;
        res.redirect('/todo');
    });

    app.get('/todo', async (req, res) => {
        if (!req.session.userId) return res.redirect('/');
        const [todos] = await conn.query(`SELECT * FROM todos WHERE user_id = ?`, [req.session.userId]);
        res.render('todo', { todos });
    });

    app.post('/todo', async (req, res) => {
        if (!req.session.userId) return res.status(401).send({ error: 'Не авторизован' });
        const { item } = req.body;
        if (!item) return res.status(400).send({ error: 'Пустая задача' });

        const [result] = await conn.query(`INSERT INTO todos (user_id, item) VALUES (?, ?)`, [req.session.userId, item]);
        res.send({ id: result.insertId, item });
    });

    app.delete('/todo/:item', async (req, res) => {
        if (!req.session.userId) return res.status(401).send({ error: 'Не авторизован' });
        const item = req.params.item.replace(/-/g, " ");
        const [result] = await conn.query(`DELETE FROM todos WHERE user_id = ? AND item = ?`, [req.session.userId, item]);
        res.send({ affectedRows: result.affectedRows });
    });

    app.post('/forgot-password', async (req, res) => {
        const { username, email } = req.body;
        const [rows] = await conn.query(`SELECT * FROM users WHERE login = ?`, [username]);

        if (rows.length === 0) {
            return fs.readFile(path.join(__dirname, 'views', 'forgotpass.html'), 'utf8', (err, data) => {
                res.send(data.replace('{{message}}', `<p style="color:red; text-align:center;">Пользователь с таким логином не найден</p>`));
            });
        }

        const user = rows[0];
        if (user.email !== email) {
            return fs.readFile(path.join(__dirname, 'views', 'forgotpass.html'), 'utf8', (err, data) => {
                res.send(data.replace('{{message}}', `<p style="color:red; text-align:center;">Email неверный</p>`));
            });
        }

        const newPassword = generateRandomPassword();
        const hash = await bcrypt.hash(newPassword, 10);
        await conn.query(`UPDATE users SET password = ? WHERE id_user = ?`, [hash, user.id_user]);

        const mailOptions = {
            from: 'EREEEEEA@rambler.ru',
            to: email,
            subject: 'Ваш новый пароль',
            text: `Ваш новый пароль: ${newPassword}`
        };

        transporter.sendMail(mailOptions, (err) => {
            const msg = err
                ? `<p style="color:red; text-align:center;">Ошибка отправки письма</p>`
                : `<p style="color:green; text-align:center;">Новый пароль отправлен на почту</p>`;
            fs.readFile(path.join(__dirname, 'views', 'forgotpass.html'), 'utf8', (err2, data) => {
                res.send(data.replace('{{message}}', msg));
            });
        });
    });

    app.post('/logout', (req, res) => {
        req.session.destroy(() => res.redirect('/'));
    });

    app.use((req, res) => res.status(404).send('Ты не пройдешь!'));

    app.listen(3000, () => console.log('Сервер запущен на порту 3000'));

})();
