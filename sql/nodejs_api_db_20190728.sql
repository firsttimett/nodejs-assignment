CREATE TABLE IF NOT EXISTS `user` (
  `uid` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `email` VARCHAR(150) NOT NULL,
  `isTeacher` TINYINT(2) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0 = student, 1 = teacher',
  `suspended` TINYINT(2) UNSIGNED NOT NULL DEFAULT 0 COMMENT '0 = not suspended, 1 = suspended',
  UNIQUE KEY `unique_email` (email)
);

CREATE TABLE IF NOT EXISTS `class` (
  `id` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  `teacher_uid` BIGINT UNSIGNED NOT NULL COMMENT 'uid of teacher',
  `student_uid` BIGINT UNSIGNED NOT NULL COMMENT 'uid of student',
  UNIQUE KEY `unique_teacher_student` (teacher_uid, student_uid)
);