const artistRouter = require('express').Router();
const sqlite3 = require('sqlite3');

const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

artistRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Artist WHERE Artist.is_currently_employed = 1;', (error, rows) => {
        if (error) {
            next(error);
        } else {
            res.status(200).json({artists: rows})
        }
    })
});

artistRouter.param('artistId', (req, res, next, id) => {
    db.get(`SELECT * FROM Artist WHERE id = ${id}`, (error, row) => {
        if (error) {
            next(error)
        }
        else if (row) {
            req.artist = row;
            next();
        } 
        else {
            res.sendStatus(404);
        }
    })
});

artistRouter.get('/:artistId', (req, res, next) => {
    res.status(200).json({ artist: req.artist});
})

artistRouter.post('/', (req, res, next) => {
    let artist = req.body.artist;
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        return res.sendStatus(400)
    }
    if (artist.isCurrentlyEmployed !== 0) {
        artist.isCurrentlyEmployed = 1;
    }
    db.run('INSERT INTO Artist (name, date_of_birth, biography, is_currently_employed)' +
    'VALUES ($name, $dateOfBirth, $biography, $isCurrentlyEmployed);', {
        $name: artist.name,
        $dateOfBirth: artist.dateOfBirth,
        $biography: artist.biography,
        $isCurrentlyEmployed: artist.isCurrentlyEmployed
    }, function(err) {
        db.get(`SELECT * FROM Artist WHERE id = ${this.lastID}`, 
        (err, row) => {
            res.status(201).json({ artist: row });
        })
    })
});

artistRouter.put('/:artistId', (req, res, next) => {
    let artist = req.body.artist;
    if (!artist.name || !artist.dateOfBirth || !artist.biography) {
        return res.sendStatus(400)
    };
    if (artist.isCurrentlyEmployed !== 0) {
        artist.isCurrentlyEmployed = 1;
    };
    db.run('UPDATE Artist SET name = $name, date_of_birth = $dateOfBirth, biography = $biography, is_currently_employed = $isCurrentlyEmployed WHERE id = $id', {
        $name: artist.name,
        $dateOfBirth: artist.dateOfBirth,
        $biography: artist.biography,
        $isCurrentlyEmployed: artist.isCurrentlyEmployed,
        $id: req.artist.id
    }, (error) => {
        if (error) {
            next(error);
        } else {
            db.get('SELECT * FROM Artist WHERE id = $id', {$id: req.artist.id}, (error, row) => {
                res.status(200).json({artist: row});
            })
        }
    })
});

artistRouter.delete('/:artistId', (req, res, next) => {
    db.run(`UPDATE Artist SET is_currently_employed = 0 WHERE id = $id;`, {$id: req.artist.id}, (error) => {
        db.get("SELECT * FROM Artist WHERE id = $id", {$id: req.artist.id}, (error, row) => {
            if (error) {
                next(error);
            } else {
                res.status(200).json({artist: row})
            }
        })
    })
})

module.exports = artistRouter;