const seriesRouter = require('express').Router();
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');
const issuesRouter = require('./issues');

seriesRouter.get('/', (req, res, next) => {
    db.all('SELECT * FROM Series', (error, rows) => {
        if (error) {
            next(error)
        } else {
            res.status(200).json({series: rows})
        }
    })
});

seriesRouter.param('seriesId', (req, res, next, id) => {
    db.get(`SELECT * FROM Series WHERE id = ${id}`, (err, row) => {
        if (err) {
            next(err)
        } else if (row) {
            req.series = row;
            next();
        } else {
            res.sendStatus(404)
        }
    });
});

seriesRouter.use('/:seriesId/issues', issuesRouter);

seriesRouter.get('/:seriesId', (req, res, next) => {
    res.status(200).json({series: req.series})
});

seriesRouter.post('/', (req, res, next) => {
    const newSeries = req.body.series;
    if (!newSeries.name || !newSeries.description) {
        return res.sendStatus(400)
    };
    db.run('INSERT INTO Series (name, description) VALUES ($name, $description)', {
        $name: newSeries.name,
        $description: newSeries.description
    }, function(err) {
        if(err) {
            next(err)
        } else {
            db.get(`SELECT * FROM Series WHERE id = ${this.lastID}`, (err, row) => {
                res.status(201).json({series: row})
            })
        }
    })
});

seriesRouter.put('/:seriesId', (req, res, next) => {
    const newSeries = req.body.series;
    if (!newSeries.name || !newSeries.description) {
        return res.sendStatus(400)
    };
    db.run('UPDATE Series SET name = $name, description = $desc WHERE id = $id', {
        $name: newSeries.name,
        $desc: newSeries.description,
        $id: req.series.id
    }, function(error) {
        if(error) {
            next(error)
        }
        db.get(`SELECT * FROM Series WHERE id = ${req.series.id}`, (err, row) => {
            res.status(200).json({series: row})
        })
    })
});

seriesRouter.delete('/:seriesId', (req, res, next) => {
    db.all("SELECT * FROM Issue WHERE series_id = $serId", {$serId: req.params.seriesId}, (err, rows) => {
        if (err) {
            next(err)
        }        
        else if (rows) {
            res.sendStatus(400)
        } else {
            db.run("DELETE FROM Series WHERE id = $serId", {$serId: req.params.seriesId}, (error) => {
                if (error) {
                    next(error)
                } else {
                    res.sendStatus(204)
                }
            })
        }
    })
})

module.exports = seriesRouter;