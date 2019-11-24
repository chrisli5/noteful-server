const FoldersService = {
    getAllFolders(knex) {
        return knex.select('*').from('folders')
    },
    getById(knex, id) {
        return knex.select('*').from('folders').where('id', id).first()
    },
    insertFolder(knex, newFolder) {
        return knex
            .insert(newFolder)
            .into('folders')
            .returning('*')
            .then(rows => {
                return rows[0]
            })
    },
    deleteFolder(knex, id) {
        return knex
            .from('folders')
            .where('id', id)
            .delete()
    },
    updateFolder(knex, id, newFolderFields) {
        return knex
            .from('folders')
            .where('id', id)
            .update(newFolderFields)
    },
};

module.exports = FoldersService;