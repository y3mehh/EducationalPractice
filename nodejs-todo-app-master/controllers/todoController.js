var bodyParser = require('body-parser');
var mongoose = require('mongoose');

mongoose.connect("mongodb://localhost:27017/todo");

var todoSchema = new mongoose.Schema({
    item: String
});

var Todo = mongoose.model('Todo', todoSchema);

var urlencodedParser = bodyParser.urlencoded({extended: false});

module.exports = function (app) {

    app.get('/todo', function (req, res) {

        // Получаем данные из БД и передаем их в качестве контекста в функцию render
        Todo.find({}, function (err, data) {
            if (err) throw err;
            res.render('todo', { todos: data });
        });

    });

    app.post('/todo', urlencodedParser, function (req, res) {

        // Получаем данные с формы и записываем их в БД
        var newTodo = new Todo(req.body);
        newTodo.save(function (err, data) {
            if (err) throw err;
            res.json(data);
        });

    });

    app.delete('/todo/:item', function (req, res) {

        // Удаляем соответствующую запись в mongoDB
        Todo.find({ item: req.params.item.replace(/\-/g, " ") }).remove(function (err, data) {
            if (err) throw err;
            res.json(data);
        });
    });

};