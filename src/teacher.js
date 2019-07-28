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
    
    studentsEmail.filter((el,i) => studentsEmail.indexOf(el) === i);

    // if email is not empty, add to array after escape
    if (teacherEmail && teacherEmail.length > 0)
        queryData.push([helper.Escape(teacherEmail), 1, 0]);
        
    studentsEmail.forEach((email) => {
        if (email && email.length > 0)
            queryData.push([helper.Escape(email), 0, 0]);
    });

    var sqlQuery = 'INSERT INTO `user` (email, isTeacher, suspended) VALUES ';

    queryData.forEach(function(el){
        sqlQuery += "(";
        sqlQuery += "\"" + el[0] + "\"," + el[1] + "," + el[2];
        sqlQuery += "), ";
    });

    sqlQuery = sqlQuery.slice(0, -2);

    sqlQuery += ' ON DUPLICATE KEY UPDATE suspended=suspended;';

    return new Promise((resolve, reject) => { 
        pool.query(sqlQuery, (err, results) => {
            if (!err) {
                if (results.affectedRows == 0)
                    helper.Reject(reject, 406, 'Neither teacher nor student email is given');
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
    var concatEmail = queryData.map((x) => { return '"' + x[0] + '"' }).join();
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
        sqlQuery += "(";
        sqlQuery += el[0] + "," + el[1];
        sqlQuery += "), ";
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

module.exports = {
    register: register
};