import smtplib
from email.message import EmailMessage

SMTP_HOST = "smtp.gmail.com"
SMTP_PORT = 587
SMTP_USER = "preranagopal35@gmail.com"
SMTP_PASS = "relljdbozdsojpzp"  # replace with your actual App Password

msg = EmailMessage()
msg["From"] = SMTP_USER
msg["To"] = "preranaprerana57@gmail.com"  # replace with your test recipient
msg["Subject"] = "Test Email"
msg.set_content("This is a test email from Python.")

try:
    with smtplib.SMTP(SMTP_HOST, SMTP_PORT) as smtp:
        smtp.starttls()
        smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(msg)
    print("Email sent successfully")
except Exception as e:
    print("Email send failed:", e)