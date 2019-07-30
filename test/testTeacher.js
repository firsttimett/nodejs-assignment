const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');

chai.use(chaiHttp)
const assert = chai.assert;

function IsEqualArray(arr1, arr2) {
    return arr1.length === arr2.length && arr1.every(function(value, index) { return value === arr2[index]});
}

describe('api', function() {
    describe('register', function() {
        it('when the email of a teacher (teacherken) and his students are provided, expect success with http status code 204', (done) => {
            let req_param = {
                teacher: "teacherken@example.com",
                students:   [
                                "studentjon@example.com",
                                "studenthon@example.com",
                                "student_only_under_teacher_ken@example.com"
                            ]
            };

            chai.request(app)
                .post('/api/register')
                .send(req_param)
                .end((err, res) => {
                    assert.equal(res.status, 204);
                    done();
                });
        });

        it('when the email of a teacher (teacherjoe) and his students are provided, expect success with http status code 204', (done) => {
            let req_param = {
                teacher: "teacherjoe@example.com",
                students:   [
                                "studentjon@example.com",
                                "studenthon@example.com"
                            ]
            };

            chai.request(app)
                .post('/api/register')
                .send(req_param)
                .end((err, res) => {
                    assert.equal(res.status, 204);
                    done();
                });
        });
    });

    describe('commonstudents', function() {
        it('when the email of a teacher is provided, expect success with http status code 200' +
            ' and students registered to the teacher', (done) => {
            let req_param = {
                teacher: "teacherken@example.com"
            };

            let expected = [
                "studentjon@example.com",
                "studenthon@example.com",
                "student_only_under_teacher_ken@example.com"
            ];

            chai.request(app)
                .get('/api/commonstudents')
                .query(req_param)
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isTrue(IsEqualArray(res.body.students, expected));
                    done();
                });
        });

        it('when the email of multiple teachers are provided, expect success with http status code 200' + 
            ' and common students registered to those teacher', (done) => {
            let req_param = {
                teacher: "teacherken@example.com",
                teacher: "teacherjoe@example.com"
            };

            let expected = [
                "studentjon@example.com",
                "studenthon@example.com"
            ];

            chai.request(app)
                .get('/api/commonstudents')
                .query(req_param)
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isTrue(IsEqualArray(res.body.students, expected));
                    done();
                });
        });
    });

    describe('suspend', function() {
        it('when the email of an active student is provided, expect success with http status code 204', (done) => {
            let req_param = {
                student: "studentjon@example.com"
            };

            chai.request(app)
                .post('/api/suspend')
                .send(req_param)
                .end((err, res) => {
                    assert.equal(res.status, 204);
                    done();
                });
        });
    });

    describe('retrievefornotifications', function() {
        it('when the email of a teacher (teacherjoe) is provided together with notification mentioned student(s)' + 
            ' not registered under the teacher, expect success with http status code 200 and students that are not' +
            ' suspended and is either registered under the teacher or has been mentioned', (done) => {
            let req_param = {
                teacher: "teacherjoe@example.com",
                notification: "Hello students! @studentagnes@example.com @student_only_under_teacher_ken@example.com"
            };

            let expected = [
                "studenthon@example.com",
                "student_only_under_teacher_ken@example.com"
            ];

            chai.request(app)
                .post('/api/retrievefornotifications')
                .send(req_param)
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isTrue(IsEqualArray(res.body.recipients, expected));
                    done();
                });
        });
    });

    describe('retrievefornotifications', function() {
        it('when the email of a teacher (teacherken) is provided together without mentioning anyone in notification' + 
            ', expect success with http status code 200 and students registered under the teacher that are not suspended', (done) => {
            let req_param = {
                teacher: "teacherken@example.com",
                notification: "Hey everybody"
            };

            let expected = [
                "studenthon@example.com",
                "student_only_under_teacher_ken@example.com"
            ];

            chai.request(app)
                .post('/api/retrievefornotifications')
                .send(req_param)
                .end((err, res) => {
                    assert.equal(res.status, 200);
                    assert.isTrue(IsEqualArray(res.body.recipients, expected));
                    done();
                });
        });
    });
});