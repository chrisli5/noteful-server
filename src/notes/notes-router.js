const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const NotesService = require('./notes-service');

const notesRouter = express.Router();
const bodyParser = express.json();

const serializeNote = note => ({
    id: note.id,
    name: xss(note.name),
    content: xss(note.content),
    modified: xss(note.modified),
    folderId: note.folderId,
})

notesRouter
    .route('/')

    .get((req, res, next) => {
        NotesService.getAllNotes(req.app.get('db'))
            .then(notes => {
                res.json(notes.map(serializeNote))
            })
            .catch(next)
    })

    .post(bodyParser, (req, res, next) => {
        const { name, content, folderId } = req.body;
        const newNote = { name, content, folderId };

        for (const field of ['name', 'content', 'folderId']) {
            if (!newNote[field]) {
                logger.error(`${field} is required.`)
                return res.status(404).send({
                    error: { message: `${field} is required.` }
                })
            }
        }

        NotesService.insertNote(
            req.app.get('db'),
            newNote
        )
            .then(note => {
                logger.info(`Note with id ${note.id} created.`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${note.id}`))
                    .json(serializeNote(note))
            })
            .catch(next)
    })

notesRouter
    .route('/:folderId')
    .all((req, res, next) => {
        const { folderId } = req.params
        NotesService.getById(req.app.get('db'), folderId)
            .then(folder => {
                if(!folder) {
                    logger.error(`Folder with id ${folderId} not found.`)
                    return res.status(404).json({
                        error: { message: `Folder not found.`}
                    })
                }

                res.folder = folder;
                next();
            })
            .catch(next)
    })

    .get((req, res) => {
        res.json(serializeNote(res.folder));
    })

    .delete((req, res, next) => {
        const { folderId } = req.params;
        NotesService.deleteFolder(req.app.get('db'), folderId)
            .then(numRowsAffected => {
                logger.info(`Folder with id ${folderId} deleted.`)
                res.status(204).end();
            })
            .catch(next)
    })

    .patch(bodyParser, (req, res, next) => {
        const { name } = req.body;
        if (!name) {
            logger.error('Invalid update without name field.')
            return res.status(400).json({
                error: {
                    message: `Request body must contain name`
                }
            })
        }

        NotesService.updateFolder(
            req.app.get('db'),
            req.params.folderId,
            { name }
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = notesRouter;