'use strict'
const helper = require('./helper');
var knex = require('./database');

async function register(req) {
    var emailList = await InsertUserAndGetEmailList(req);
    var userData = await GetUser(emailList);
    
    return InsertClass(userData);
}

async function InsertUserAndGetEmailList(req){
    var teacherEmail = req.body.teacher;
    var studentsEmail = req.body.students;
    var queryData = new Array();
    
    helper.FilterEmptyDistinct(studentsEmail);

    // if email is not empty, add to array after escape
    if (teacherEmail && teacherEmail.length > 0){
        queryData.push({ email: teacherEmail, isTeacher: 1, suspended: 0 });
    }
        
    studentsEmail.forEach((email) => {
        queryData.push({ email: email, isTeacher: 0, suspended: 0 });
    });

    return new Promise((resolve, reject) => {
        knex.raw(
            knex('user').insert(queryData).toQuery() + ' ON DUPLICATE KEY UPDATE suspended=suspended'
        )
        .then(function(results){
            if (results[0].affectedRows == 0)
                helper.Reject(reject, 406, 'neither teacher nor student email is given');
            else if (!teacherEmail)
                helper.Reject(reject, 406, 'teacher email is missing');
            else if (!studentsEmail)
                helper.Reject(reject, 406, 'students email is missing');
            else
                resolve(queryData);
        })
        .catch(function(err){
            helper.Reject(reject, 500, err);
        });
    });
}

function GetUser(queryData){
    var arrEmail = queryData.map((el) => el.email );

    return new Promise((resolve, reject) => {
        knex.select('uid', 'isTeacher').from('user').whereIn('email', arrEmail)
        .then(function(results){
            resolve(results);
        })
        .catch(function(err){
            helper.Reject(reject, 500, err);
        });
    });
}

function InsertClass(userData){
    userData = userData.sort(helper.CompareUser);
    var queryData = new Array();
    var teacherUid = userData[0].uid;
    userData.shift();

    userData.forEach((el) => {
        queryData.push({ teacher_uid: teacherUid, student_uid: el.uid });
    });

    return new Promise((resolve, reject) => {
        knex.raw(
            knex('class').insert(queryData).toQuery() + ' ON DUPLICATE KEY UPDATE teacher_uid=teacher_uid'
        )
        .then(function(){
            resolve(true);
        })
        .catch(function(err){
            helper.Reject(reject, 500, err);
        });
    });
}

async function commonstudents(args) {
    var arrTeacher = await new Promise((resolve, reject) => {
        if (args && args.length > 0) {
            var arr = new Array();

            if (args.constructor != Array)
                arr.push(args);
            else
                arr = args;

            resolve(helper.FilterEmptyDistinct(arr));
        }
        else
            helper.Reject(reject, 406, "teacher email is missing");
    });

    return new Promise((resolve, reject) => {
        knex.queryBuilder().select('studentEmail').from(function() {
            this.select('u.email AS teacherEmail', 'u2.email AS studentEmail')
            .from('class')
            .innerJoin('user as u', function(){
                this.on('class.teacher_uid', '=', 'u.uid')
                .onIn('u.email', arrTeacher);
            })
            .innerJoin('user as u2', function(){
                this.on('class.student_uid', '=', 'u2.uid')
                .on('u2.isTeacher', '=', 0);
            }).as('sub');
        })
        .groupBy('studentEmail')
        .havingRaw('COUNT(*) = ?', arrTeacher.length)
        .then(function(results){
            var arrStudents = results.map((el) => { return el.studentEmail });
            resolve(arrStudents);
        })
        .catch(function(err){
            helper.Reject(reject, 500, err);
        });
    });
}

async function suspend(req){
    var studentEmail = await new Promise((resolve, reject) => {
        if (req.body.student)
            resolve(req.body.student);
        else
            helper.Reject(reject, 406, "student email is missing");
    });

    return new Promise((resolve, reject) => {
        knex('user')
        .where({
            email: studentEmail,
            isTeacher: 0,
            suspended: 0
        })
        .update('suspended', 1)
        .then(function(updatedRows){
            if (updatedRows == 0)
                helper.Reject(reject, 406, "there is no such user or the user is a teacher or the user is already suspended");
            else
                resolve(true);
        })
        .catch(function(err){
            helper.Reject(reject, 500, err);
        });
    });
}

async function retrievefornotifications(req){
    var teacherEmail = await new Promise((resolve, reject) => {
        if (req.body.teacher)
            resolve(req.body.teacher);
        else
            helper.Reject(reject, 406, "teacher email is missing");
    });
    var arrEmailTag = await new Promise((resolve, reject) => {
        if (req.body.notification)
            resolve(helper.ExtractEmailTag(req.body.notification));
        else
            helper.Reject(reject, 406, "notification is missing");
    });
    var arrFormattedEmailTag = arrEmailTag 
                                ? arrEmailTag.map((el) => el.slice(1)) 
                                : new Array();

    var whereQuery = 'u.email = ?';
    var whereBinding = new Array(teacherEmail);

    if (arrFormattedEmailTag.length > 0){
        whereQuery += ' OR u2.email IN (';
        arrFormattedEmailTag.forEach((el) => {
            whereQuery += '?,'
            whereBinding.push(el);
        });
        whereQuery = whereQuery.slice(0, -1) + ')';
    }

    var recipients = await new Promise((resolve, reject) => {
        knex('class')
        .select('u2.email AS email')
        .innerJoin('user as u', function(){
            this.on('class.teacher_uid', '=', 'u.uid')
            .on('u.isTeacher', '=', 1);
        })
        .innerJoin('user as u2', function(){
            this.on('class.student_uid', '=', 'u2.uid')
            .on('u2.isTeacher', '=', 0)
            .on('u2.suspended', '=', 0);
        })
        .whereRaw(whereQuery, whereBinding)
        .then(function(results){
            var classStudents = results.map((el) => { return el.email });
            resolve(classStudents);
        })
        .catch(function(err){
            helper.Reject(reject, 500, err);
        });
    });
    
    return helper.FilterEmptyDistinct(recipients);
}

module.exports = {
    register,
    commonstudents,
    suspend,
    retrievefornotifications
};