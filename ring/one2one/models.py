
import smtplib
from email.mime.text import MIMEText
from email.utils import formatdate

from .mail import FROM_ADDRESS, MY_PASSWORD

BCC = FROM_ADDRESS
SUBJECT = "【Ringへのご招待】"
BODY = """
{}さんからRingへの招待が届きました。\n
ビデオチャットに参加するには下のリンクからRingのページへ移動してください。\n
{}
"""


def create_message(to_addr, myname, oid, myid):
    "メールのメッセージ文を作成する関数"
    # url = "https://ring.enfree-jp.com/one2one/created?myid={}&opponents_id={}".format(oid,myid) #cnameに変更する！
    url = f"127.0.0.1:8000/one2one/created?myid={oid}&opponents_id={myid}"
    msg = MIMEText(BODY.format(myname, url))
    msg['Subject'] = SUBJECT
    msg['From'] = FROM_ADDRESS
    msg['To'] = to_addr
    msg['Bcc'] = BCC
    msg['Date'] = formatdate()
    return msg


def send(msg, to_addrs):
    "メールを送信する関数"
    smtpobj = smtplib.SMTP('smtp.gmail.com', 587)
    smtpobj.ehlo()
    smtpobj.starttls()
    smtpobj.ehlo()
    smtpobj.login(FROM_ADDRESS, MY_PASSWORD)
    smtpobj.sendmail(FROM_ADDRESS, to_addrs, msg.as_string())
    smtpobj.close()
