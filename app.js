'use strict'

const express = require( 'express' );
const teacher = require('./src/teacher');
const app = express();

require('dotenv').config();

app.use(express.json());

let portNum = process.env.PORT || 8100;

var server = app.listen(portNum, _ => {
  console.log( 'Server started and listening to ' + portNum + '...' );
})

app.post('/api/register', async (req, res) => {
    try {
        var success = await teacher.register(req);

        if (success)
            res.status(204).json();
    } catch (error) {
        console.log(error);
        res.status(error.code).json({ message: error.message });
    }
});

app.get('/api/commonstudents', async (req, res) => {
    try {
        var arrCommonStudents = await teacher.commonstudents(req.query.teacher);

        res.status(200).json({ students: arrCommonStudents });
    } catch (error) {
        console.log(error);
        res.status(error.code).json({ message: error.message });
    }
});

app.post('/api/suspend', async (req, res) => {
    try {
        var success = await teacher.suspend(req);

        if (success)
            res.status(204).json();
    } catch (error) {
        console.log(error);
        res.status(error.code).json({ message: error.message });
    }
});

app.post('/api/retrievefornotifications', async (req, res) => {
    try {
        var recipients = await teacher.retrievefornotifications(req);

        res.status(200).json({ recipients: recipients });
    } catch (error) {
        console.log(error);
        res.status(error.code).json({ message: error.message });
    }
});

module.exports = app;