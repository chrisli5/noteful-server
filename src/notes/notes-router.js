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
    folderId: note.folderid,
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
        const newNote = { name, content, folderid: folderId };

        for (const field of ['name', 'content', 'folderid']) {
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
    .route('/:noteId')
    .all((req, res, next) => {
        const { noteId } = req.params
        NotesService.getById(req.app.get('db'), noteId)
            .then(note => {
                if(!note) {
                    logger.error(`Note with id ${noteId} not found.`)
                    return res.status(404).json({
                        error: { message: `Note not found.`}
                    })
                }

                res.note = note;
                next();
            })
            .catch(next)
    })

    .get((req, res) => {
        res.json(serializeNote(res.note));
    })

    .delete((req, res, next) => {
        const { noteId } = req.params;
        NotesService.deleteNote(req.app.get('db'), noteId)
            .then(numRowsAffected => {
                logger.info(`Note with id ${noteId} deleted.`)
                res.status(204).end();
            })
            .catch(next)
    })

    .patch(bodyParser, (req, res, next) => {
        const { name, content, folderId } = req.body;
        if (!name || !content || !folderId) {
            logger.error('Invalid update without required fields.')
            return res.status(400).json({
                error: {
                    message: `Request body must contain name, content, folderId`
                }
            })
        }

        NotesService.updateNote(
            req.app.get('db'),
            req.params.noteId,
            { name, content, folderid: folderId }
        )
            .then(numRowsAffected => {
                res.status(204).end()
            })
            .catch(next)
    })

module.exports = notesRouter;