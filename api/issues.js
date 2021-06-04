const issuesRouter = require('express').Router({mergeParams: true});
const sqlite3 = require('sqlite3');
const db = new sqlite3.Database(process.env.TEST_DATABASE || './database.sqlite');

issuesRouter.param('issueId', (req, res, next, id) => {
    db.get(`SELECT * FROM Issue WHERE id = ${id}`, (err, row) => {
        if (err) {
            next(err)
        }
        else if (row) {
            next();
        } else {
            return res.sendStatus(404)
        }
    });
});

issuesRouter.get('/', (req, res, next) => {
    db.all(`SELECT * FROM Issue WHERE series_id = $serId`, {$serId: req.series.id}, (err, rows) => {
        if (err) {
            next(err)
        } else {
            res.status(200).json({issues: rows})
        }
    })
});

issuesRouter.post('/', (req, res, next) => {
    const newIssue = req.body.issue;
    if (!newIssue.name || !newIssue.issueNumber || !newIssue.publicationDate || !newIssue.artistId) {
        res.sendStatus(400);
    }
    db.get('SELECT * FROM Artist WHERE id = $id', {$id: newIssue.artistId}, (err, artist) =>{
        if (err) {
            next(err)
        } else if (!artist) {
            res.sendStatus(400)
        } else {
            db.run('INSERT INTO Issue (name, issue_number, publication_date, artist_id, series_id) ' +
                   'VALUES ($name, $issueNum, $pubDate, $artId, $serId)', {
                       $name: newIssue.name,
                       $issueNum: newIssue.issueNumber,
                       $pubDate: newIssue.publicationDate,
                       $artId: newIssue.artistId,
                       $serId: req.series.id
                   },
            function(error) {
                db.get(`SELECT * FROM Issue WHERE id = ${this.lastID}`, (err, row) => {
                    res.status(201).json({issue: row})
                })
            }
        )};
    });
});

issuesRouter.put('/:issueId', (req, res, next) => {
    const issueBody = req.body.issue;
    const artist = db.get(`SELECT * FROM Artist WHERE id = ${issueBody.artistId}`);
    if (!issueBody.name || !issueBody.issueNumber || !issueBody.publicationDate || !artist) {
        res.sendStatus(400)
    } else {
        db.run(`UPDATE Issue SET name = $name, issue_number = $issueNumber, publication_date = $pubDate, artist_id = $artId, series_id = $serId`, {
            $name: issueBody.name,
            $issueNumber: issueBody.issueNumber,
            $pubDate: issueBody.publicationDate,
            $artId: issueBody.artistId,
            $serId: req.series.id
        }, (error) => {
            if (error) {
                next(error)
            } else {
                db.get(`SELECT * FROM Series WHERE id = ${req.params.seriesId}`, (err, row) => {
                    if (err) {
                        next(err)
                    } else {
                        res.status(200).json({series: row})
                    }
                })
            }
        })
    }
});

issuesRouter.delete('/:issueId', (req, res, next) => {
    db.run("DELETE FROM Issue WHERE id = $id", {$id: req.params.issueId}, (err) => {
        if (err) {
            next(err)
        } else {
            res.sendStatus(204)
        }
    })
});

module.exports = issuesRouter;