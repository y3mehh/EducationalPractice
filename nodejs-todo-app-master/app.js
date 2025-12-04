var express = require('express');
var todoController = require('./controllers/todoController');
var app = express();

app.set('view engine', 'ejs');

app.use(express.static('./public'));

// Подключаем контроллер
todoController(app);

app.listen(8080);
console.log('You are listening port', 8080);