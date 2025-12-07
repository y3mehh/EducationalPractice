$(document).ready(function() {
    $('#todo-form').on('submit', function(e) {
        e.preventDefault();
        var input = $(this).find('input[name="item"]');
        var itemText = input.val();
        if (!itemText) return;

        $.ajax({
            type: 'POST',
            url: '/todo',
            contentType: 'application/json',
            data: JSON.stringify({ item: itemText }),
            success: function(data) {
                $('#todo-table ul').append('<li>' + data.item + '</li>');
                input.val('');
            },
            error: function(err) { console.error(err); }
        });
    });

    $('#todo-table ul').on('click', 'li', function() {
        var li = $(this);
        var item = li.text().replace(/ /g, "-");

        $.ajax({
            type: 'DELETE',
            url: '/todo/' + encodeURIComponent(item),
            success: function(data) {
                if (data.affectedRows > 0) li.remove();
            },
            error: function(err) { console.error(err); }
        });
    });
});
