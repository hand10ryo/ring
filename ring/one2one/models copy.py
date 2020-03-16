from django.db import models
from mysql import connector as mc
import smtplib
from email.mime.text import MIMEText
from email.utils import formatdate

BCC = FROM_ADDRESS
SUBJECT = "【Ringへのご招待】"
BODY = """
{}さんからRingへの招待が届きました。\n
ビデオチャットに参加するには下のリンクからRingのページへ移動してください。\n
{}
"""


class dbconnecter:
    def __init__(self):
        self.conn = mc.connect(user='ring_user',
                               password='ring_password',
                               host='db',
                               database='ring',
                               use_pure=True
                               )
        self.cur = self.conn.cursor(dictionary=True)
        self.fetch_result = []

    def execute(self, SQL):
        self.cur.execute(SQL)

    def append_fetch_result(self):
        try:
            self.fetch_result.append(list(self.cur.fetchall()[0].values())[0])
        except:
            print("fetch error")

    def commit(self):
        try:
            self.conn.commit()
        except:
            print("connection is not open")

    def close(self):
        self.cur.close()
        self.conn.close()


def create_message(to_addr, myname, oid, myid):
    # url = "https://ring.enfree-jp.com/one2one/created?myid={}&opponents_id={}".format(oid,myid) #cnameに変更する！
    url = "127.0.0.1:8000/one2one/created?myid={}&opponents_id={}".format(
        oid, myid)
    msg = MIMEText(BODY.format(myname, url))
    msg['Subject'] = SUBJECT
    msg['From'] = FROM_ADDRESS
    msg['To'] = to_addr
    msg['Bcc'] = BCC
    msg['Date'] = formatdate()
    return msg


def send(msg, to_addrs):
    smtpobj = smtplib.SMTP('smtp.gmail.com', 587)
    smtpobj.ehlo()
    smtpobj.starttls()
    smtpobj.ehlo()
    smtpobj.login(FROM_ADDRESS, MY_PASSWORD)
    smtpobj.sendmail(FROM_ADDRESS, to_addrs, msg.as_string())
    smtpobj.close()


def id_check_create(myid, new_id, mail):

    dbcon = dbconnecter()

    # 作成しようとしているIDが偶然ほかに存在していないか確認
    sql = "select "
    sql += " \"{}\" in (select creater_id from maintable where delete_frag=0) ".format(new_id)
    sql += "or "
    sql += "\"{}\" in (select created_id from maintable  where delete_frag=0);".format(new_id)
    dbcon.execute(sql)
    dbcon.append_fetch_result()

    # 作成者IDから受信者アドレスにアクティブなIDを既に発行しているか確認
    sql = "select COUNT(creater_id) from maintable where creater_id = \"{}\" and mail = \"{}\" and delete_frag=0;".format(
        myid, mail)
    dbcon.execute(sql)
    dbcon.append_fetch_result()

    exist_id, exist_mail = dbcon.fetch_result[0], dbcon.fetch_result[1]
    dbcon.close()
    return exist_id, exist_mail


def insert(context):
    dbcon = dbconnecter()
    sql = "insert into maintable (creater_id,created_id,mail,age,gender,job,delete_frag) values "
    sql += "(\"{0[myid]}\",\"{0[opponents_id]}\",\"{0[mail]}\",{0[age]},\"{0[gender]}\",\"{0[job]}\",0)".format(context)
    dbcon.execute(sql)
    dbcon.commit()


def logical_delete(myid, mail):
    dbcon = dbconnecter()
    dbcon.execute(
        "UPDATE maintable SET delete_frag = 1 WHERE creater_id = \"{}\" and mail = \"{}\";".format(myid, mail))
    dbcon.commit()
    dbcon.close()


def id_check_access(new_id):
    dbcon = dbconnecter()
    dbcon.execute(
        "select COUNT(created_id) from maintable where created_id = \"{}\" and delete_frag = 0;".format(new_id))
    dbcon.append_fetch_result()
    dbcon.close()
    exist_id = dbcon.fetch_result[0]
    return exist_id == 0


# Create your models here.
