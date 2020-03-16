-- ■メインテーブル
USE ring;
DROP TABLE IF EXISTS maintable;
CREATE TABLE maintable (
 id MEDIUMINT NOT NULL AUTO_INCREMENT
,mail VARCHAR(255) NOT NULL
,creater_id CHAR(18) NOT NULL
,created_id CHAR(18) NOT NULL
,age TINYINT NOT NULL
,gender VARCHAR(50) NOT NULL
,job VARCHAR(50) NOT NULL
,delete_frag TINYINT default 0 NOT NULL
,PRIMARY KEY(id)
) ENGINE = InnoDB
;
