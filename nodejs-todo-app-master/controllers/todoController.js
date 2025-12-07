module.exports = function(app, conn) {
    app.get('/todo', async (req, res) => {
        if (!req.session.userId) return res.redirect('/');
        try {
            const [todos] = await conn.query(
                `SELECT * FROM todos WHERE user_id = ?`,
                [req.session.userId]
            );
            res.render('todo', { todos });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    });

    app.post('/todo', async (req, res) => {
        if (!req.session.userId) return res.status(401).send('Unauthorized');
        const { item } = req.body;
        if (!item) return res.status(400).send('Item is required');

        try {
            const [result] = await conn.query(
                `INSERT INTO todos (item, user_id) VALUES (?, ?)`,
                [item, req.session.userId]
            );
            res.json({ id_todo: result.insertId, item });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    });

    app.delete('/todo/:item', async (req, res) => {
        if (!req.session.userId) return res.status(401).send('Unauthorized');
        const itemText = req.params.item.replace(/-/g, " ");
        try {
            const [result] = await conn.query(
                `DELETE FROM todos WHERE item = ? AND user_id = ?`,
                [itemText, req.session.userId]
            );
            res.json({ affectedRows: result.affectedRows });
        } catch (err) {
            console.error(err);
            res.status(500).send('Server error');
        }
    });
};
