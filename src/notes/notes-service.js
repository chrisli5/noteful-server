const NotesService = {
    getAllNotes(knex) {
        return knex
            .select('*')
            .from('notes')
    },
    getById(knex, id) {
        return knex
            .select('*')
            .from('notes')
            .where('id', id)
            .first()
    },
    insertNote(knex, newNote) {
        return knex
            .insert(newNote)
            .into('notes')
            .returning('*')
            .then(rows => rows[0])
    },
    deleteNote(knex, id) {
        return knex
            .from('notes')
            .where('id', id)
            .delete()
    },
    updateNote(knex, id, noteFields) {
        return knex
            .from('notes')
            .where('id', id)
            .update(noteFields)
    },
}

module.exports = NotesService;