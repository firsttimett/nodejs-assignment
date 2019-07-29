'use strict'

const express = require( 'express' );
const helper = require('./src/helper');
const teacher = require('./src/teacher');
let app = express();

app.use(express.json());

let portNum = process.env.port || 8100;

var server = app.listen(portNum, _ => {
  console.log( 'Server started and listening to 8100...' );
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