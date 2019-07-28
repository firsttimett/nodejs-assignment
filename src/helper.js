module.exports = {
    Escape : (str) => {
        return str.replace(/[\\$'"]/g, "\\$&");
    },
    CompareUser: (a, b) => {
        let comparison = 0;

        if (a.isTeacher < b.isTeacher)
            comparison = 1;
        else if (a.isTeacher > b.isTeacher)
            comparison = -1;
            
        return comparison;
    },
    Reject: (reject, code, message) => {
        reject({
            code: code,
            message: message
        })
    }
}