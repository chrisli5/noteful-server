const path = require('path');
const express = require('express');
const xss = require('xss');
const logger = require('../logger');
const FoldersService = require('./folders-service');

const foldersRouter = express.Router();
const bodyParser = express.json();

const serializeFolder = folder => ({
    id: folder.id,
    name: xss(folder.name),
})

foldersRouter
    .route('/')
    .get((req, res, next) => {
        FoldersService.getAllFolders(req.app.get('db'))
            .then(folders => {
                res.json(folders.map(serializeFolder))
            })
            .catch(next)
    })
    .post(bodyParser, (req, res, next) => {
        const { name } = req.body;
        const newFolder = { name };
        console.log(name);
        if(!name) {
            logger.error('folder name is required')
            return res.status(400).send({
                error: { message: 'folder name is required' }
            })
        }

        FoldersService.insertFolder(
            req.app.get('db'),
            newFolder
        )
            .then(folder => {
                logger.info(`Folder with id ${folder.id} created.`)
                res
                    .status(201)
                    .location(path.posix.join(req.originalUrl, `${folder.id}`))
                    .json(serializeFolder(folder))
            })
            .catch(next)
    })

foldersRouter
    .route('/:folderId')
    .all((req, res, next) => {
        const { folderId } = req.params
        FoldersService.getById(req.app.get('db'), folderId)
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
        res.json(serializeFolder(res.folder));
    })
    .delete((req, res, next) => {
        const { folderId } = req.params;
        FoldersService.deleteFolder(req.app.get('db'), folderId)
            .then(numRowsAffected => {
                logger.info(`Folder with id ${folderId} deleted.`)
                res.status(204).end();
            })
            .catch(next)
    })

module.exports = foldersRouter;