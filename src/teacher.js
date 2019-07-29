const helper = require('./helper');
var pool = require('./database');

async function register(req) {
    var emailList = await InsertUserAndGetEmailList(req);
    var userData = await GetUser(emailList);
    
    return await InsertClass(userData);
}

function InsertUserAndGetEmailList(req){
    var teacherEmail = req.body.teacher;
    var studentsEmail = req.body.students;
    var queryData = new Array();
    
    helper.FilterEmptyDistinct(studentsEmail);

    // if email is not empty, add to array after escape
    if (teacherEmail && teacherEmail.length > 0)
        queryData.push([helper.Escape(teacherEmail), 1, 0]);
        
    studentsEmail.forEach((email) => {
        queryData.push([helper.Escape(email), 0, 0]);
    });

    var sqlQuery = 'INSERT INTO `user` (email, isTeacher, suspended) VALUES ';

    queryData.forEach(function(el){
        sqlQuery += "(\"" + el[0] + "\"," + el[1] + "," + el[2] + "), ";
    });

    sqlQuery = sqlQuery.slice(0, -2);

    sqlQuery += ' ON DUPLICATE KEY UPDATE suspended=suspended;';

    return new Promise((resolve, reject) => { 
        pool.query(sqlQuery, (err, results) => {
            if (!err) {
                if (results.affectedRows == 0)
                    helper.Reject(reject, 406, 'neither teacher nor student email is given');
                else if (!teacherEmail)
                    helper.Reject(reject, 406, 'teacher email is missing');
                else if (!studentsEmail)
                    helper.Reject(reject, 406, 'students email is missing');
                else
                    resolve(queryData);
            }
            else
                helper.Reject(reject, 500, err.code + ": " + err.sqlMessage);
         })
    });
}

function GetUser(queryData){
    var concatEmail = queryData.map((el) => { return '"' + el[0] + '"' }).join();
    var sqlQuery = 'SELECT uid, isTeacher FROM `user` WHERE email IN (' + concatEmail + ');';

    return new Promise((resolve, reject) => {
        pool.query(sqlQuery, (err, results)=> {
            if (!err)
                resolve(results);
            else
                helper.Reject(reject, 500, err.code + ": " + err.sqlMessage);
        })
    });
}

function InsertClass(userData){
    userData = userData.sort(helper.CompareUser);
    var queryData = new Array();
    var teacherUid = userData[0].uid;
    userData.shift();

    userData.forEach((el) => {
        queryData.push([teacherUid, el.uid]);
    });

    var sqlQuery = 'INSERT INTO `class` (teacher_uid, student_uid) VALUES ';

    queryData.forEach(function(el){
        sqlQuery += "(" + el[0] + "," + el[1] + "), ";
    });

    sqlQuery = sqlQuery.slice(0, -2);

    sqlQuery += ' ON DUPLICATE KEY UPDATE teacher_uid=teacher_uid;';

    return new Promise((resolve, reject) => {
        pool.query(sqlQuery, (err, results) => {
            if (!err)
                resolve(true);
            else
                helper.Reject(reject, 500, err.code + ": " + err.sqlMessage);
        })
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

            resolve(arr);
        }
        else
            helper.Reject(reject, 406, "teacher email is missing");
    });

    var newArrTeacher = helper
                        .FilterEmptyDistinct(arrTeacher)
                        .map((el) => { return '"' + helper.Escape(el) + '"' });

    var sqlQuery = 
        'SELECT studentEmail FROM (\
            SELECT \
                u.email AS teacherEmail, u2.email AS studentEmail \
            FROM \
                class c \
            INNER JOIN \
                `user` u \
            ON \
                c.teacher_uid = u.uid AND u.isTeacher = 1 AND u.email IN (' + newArrTeacher.join() + ') \
            INNER JOIN \
                `user` u2 \
            ON c.student_uid = u2.uid AND u2.isTeacher = 0\
        ) AS sub \
        GROUP BY \
            studentEmail \
        HAVING \
            COUNT(*) = ' + newArrTeacher.length + ';';

    return new Promise((resolve, reject) => {
        pool.query(sqlQuery, (err, results) => {
            if (!err) {
                var arrStudents = results.map((el) => { return el.studentEmail });
                resolve(arrStudents);
            }
            else
                helper.Reject(reject, 500, err.code + ": " + err.sqlMessage);
        })
    });
}

async function suspend(req){
    var studentEmail = await new Promise((resolve, reject) => {
        if (req.body.student)
            resolve(req.body.student);
        else
            helper.Reject(reject, 406, "student email is missing");
    });

    var sqlQuery = 'UPDATE `user` SET suspended = 1 WHERE email = "' + helper.Escape(studentEmail) 
                    + '" AND isTeacher = 0 AND suspended = 0;';

    return new Promise((resolve, reject) => {
        pool.query(sqlQuery, (err, results) => {
            if (!err) {
                if (results.affectedRows == 0)
                    helper.Reject(reject, 406, "there is no such user or the user is a teacher or the user is already suspended");
                else
                    resolve(true);
            }
            else
                helper.Reject(reject, 500, err.code + ": " + err.sqlMessage);
        })
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
                                ? arrEmailTag.map((el) => { return helper.Escape(el.slice(1)) }) 
                                : new Array();

    var sqlQuery = 'SELECT \
                        u2.email AS email \
                    FROM \
                        class c \
                    INNER JOIN \
                        `user` u \
                    ON \
                        c.teacher_uid = u.uid AND u.isTeacher = 1 \
                    INNER JOIN \
                        `user` u2 \
                    ON \
                        c.student_uid = u2.uid AND u2.isTeacher = 0 \
                    WHERE \
                        u.email = "' + helper.Escape(teacherEmail) + '";';

    var recipients = await new Promise((resolve, reject) => {
        pool.query(sqlQuery, (err, results) => {
            if (!err) {
                var classStudents = results.map((el) => { return el.email });
                resolve(classStudents);
            }
            else
                helper.Reject(reject, 500, err.code + ": " + err.sqlMessage);
        })
    });

    return helper.FilterEmptyDistinct(recipients.concat(arrFormattedEmailTag));
}

module.exports = {
    register: register,
    commonstudents: commonstudents,
    suspend: suspend,
    retrievefornotifications: retrievefornotifications
};