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
    },
    FilterEmptyDistinct: (arr) => {
        return arr.filter((el,i) => { 
            return el && el.length > 0 && arr.indexOf(el) === i;
        });
    },
    ExtractEmailTag: (str) => {
        return str.match(/(@[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9_-]+)/gi);
    }
}