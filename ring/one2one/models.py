
import boto3
from botocore.exceptions import ClientError
import configparser
from .mail import FROM_ADDRESS

BCC = FROM_ADDRESS
SUBJECT = "【Ringへのご招待】"
ini = configparser.ConfigParser()
ini.read("/code/one2one/config.ini", "UTF-8")
SENDER = f"Ring <{FROM_ADDRESS}>"
RECIPIENT = "recipient@example.com"
AWS_REGION = "us-east-1"

BODY_TEXT = """{}さんからRingへの招待が届きました。\r\n
             This email was sent with Amazon SES using the
             AWS SDK for Python (Boto).\r\n"
             ビデオチャットに参加するにリンクからRingのページへ移動してください。\r\n"
             {}\r\n"
             """

BODY_HTML = """<html>
<head></head>
<body>
  <h1>{}さんからRingへの招待が届きました。</h1>
  <p>This email was sent with
    <a href='https://aws.amazon.com/ses/'>Amazon SES</a> using the
    <a href='https://aws.amazon.com/sdk-for-python/'>
      AWS SDK for Python (Boto)</a>.</p>
    <p>ビデオチャットに参加するにリンクからRingのページへ移動してください。</p>
    <p><a href='{}'>Ring招待ページへ</a></p>
</body>
</html>
"""

CHARSET = "UTF-8"

# Create a new SES resource and specify a region.
client = boto3.client(
    'ses',
    aws_access_key_id=ini["AWS_KEY"]["awsaccesskeyid"],
    aws_secret_access_key=ini["AWS_KEY"]["awssecretkey"],
    region_name=AWS_REGION)


def send(RECIPIENT, myname, oid, myid):
    url = f"https://ring.enfree-jp.com/one2one/created?myid={oid}&opponents_id={myid}"
    body_text = BODY_TEXT.format(myname, url)
    body_html = BODY_HTML.format(myname, url)

    try:
        response = client.send_email(
            Destination={
                'ToAddresses': [
                    RECIPIENT,
                ],
            },
            Message={
                'Body': {
                    'Html': {
                        'Charset': CHARSET,
                        'Data': body_html,
                    },
                    'Text': {
                        'Charset': CHARSET,
                        'Data': body_text,
                    },
                },
                'Subject': {
                    'Charset': CHARSET,
                    'Data': SUBJECT,
                },
            },
            Source=SENDER,
        )
    except ClientError as e:
        print(e.response['Error']['Message'])
        return False
    else:
        print("Email sent! Message ID:"),
        print(response['MessageId'])
        return True
