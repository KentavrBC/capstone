const bodyParser = require('body-parser');
const cors = require('cors');
const errorhandler = require('errorhandler');
const morgan = require('morgan');
const express = require('express');
const apiRouter = require('./api/api');

const app = express();
const port = process.env.PORT || 4000;

// Middleware libraryes

app.use(bodyParser.json());
app.use(cors());
app.use(morgan('dev'));

// Routers

app.use('/api', apiRouter);


app.use(errorhandler());

app.listen(port, () => {
    console.log('Server listening at port: ' + port)
})

module.exports = app;