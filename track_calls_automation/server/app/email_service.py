import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from app import config

def send_invite_email(to_email: str, org_name: str, invite_code: str):
    """
    Sends an onboarding email containing the unique invite code to the Super Admin.
    If SMTP credentials are not configured, prints a mock email log to console.
    """
    subject = f"LeadLens Onboarding - Invite Code for {org_name}"
    
    body_text = (
        f"Hello,\n\n"
        f"Your organization '{org_name}' has been successfully provisioned on the LeadLens platform!\n\n"
        f"Here is your unique Organization Invite Code:\n"
        f"----------------------------------------\n"
        f"Invite Code: {invite_code}\n"
        f"----------------------------------------\n\n"
        f"Please share this code with your Warriors, Admins, and Group Leaders so they can link their accounts to your organization when registering.\n\n"
        f"To get started, download the mobile app and register your account as a Super Admin using this email ({to_email}). Since your account was pre-provisioned by the platform owner, you will be auto-approved upon registration.\n\n"
        f"Best regards,\n"
        f"LeadLens Team"
    )

    body_html = (
        f"<html>"
        f"<body>"
        f"<h2>Welcome to LeadLens!</h2>"
        f"<p>Your organization <strong>{org_name}</strong> has been successfully provisioned on the LeadLens platform.</p>"
        f"<p>Here is your unique <strong>Organization Invite Code</strong>:</p>"
        f"<div style='padding: 15px; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; display: inline-block; font-family: monospace; font-size: 18px; font-weight: bold; color: #04693F; letter-spacing: 1px;'>"
        f"{invite_code}"
        f"</div>"
        f"<p>Please share this code with your Warriors, Admins, and Group Leaders so they can register and link their accounts to your organization.</p>"
        f"<p><strong>Next Steps:</strong> Register your account on the mobile app as a <strong>Super Admin</strong> using this email address: <code>{to_email}</code>. You will be automatically approved and ready to manage your team.</p>"
        f"<br/>"
        f"<p>Best regards,<br/><strong>LeadLens Team</strong></p>"
        f"</body>"
        f"</html>"
    )

    # If SMTP is not fully configured, run in mock mode
    if not config.SMTP_USERNAME or not config.SMTP_PASSWORD:
        print(f"\n[MOCK EMAIL SEND]")
        print(f"To: {to_email}")
        print(f"From: {config.SMTP_FROM_EMAIL or 'mock-sender@leadlens.com'}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body_text}")
        print(f"------------------\n")
        return

    try:
        # Build MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = config.SMTP_FROM_EMAIL
        msg["To"] = to_email

        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")
        msg.attach(part1)
        msg.attach(part2)

        # Connect and send
        print(f"INFO: Connecting to SMTP server {config.SMTP_HOST}:{config.SMTP_PORT}...")
        if config.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        server.sendmail(config.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"INFO: Successfully sent onboarding invite email to {to_email}")
    except Exception as e:
        print(f"❌ Error sending invite email to {to_email}: {e}")


def send_otp_email(to_email: str, otp: str):
    """
    Sends a 2FA OTP verification code email to the Platform Owner.
    If SMTP credentials are not configured, prints a mock email log to console.
    """
    subject = "LeadLens - Owner Portal 2FA Verification Code"
    body_text = (
        f"Hello,\n\n"
        f"You are attempting to access the Platform Owner Portal.\n\n"
        f"Here is your 6-digit 2FA Verification Code:\n"
        f"----------------------------------------\n"
        f"Verification Code: {otp}\n"
        f"----------------------------------------\n\n"
        f"This code will expire in 5 minutes. If you did not request this code, please secure your platform credentials immediately.\n\n"
        f"Best regards,\n"
        f"LeadLens Team"
    )

    body_html = (
        f"<html>"
        f"<body>"
        f"<h2>LeadLens Owner Authentication</h2>"
        f"<p>You are attempting to access the Platform Owner Portal. Please use the verification code below to complete authentication:</p>"
        f"<div style='padding: 15px; background-color: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 6px; display: inline-block; font-family: monospace; font-size: 24px; font-weight: bold; color: #04693F; letter-spacing: 2px;'>"
        f"{otp}"
        f"</div>"
        f"<p>This code will expire in 5 minutes. If you did not request this, please secure your credentials immediately.</p>"
        f"<br/>"
        f"<p>Best regards,<br/><strong>LeadLens Team</strong></p>"
        f"</body>"
        f"</html>"
    )

    # If SMTP is not fully configured, run in mock mode
    if not config.SMTP_USERNAME or not config.SMTP_PASSWORD:
        print(f"\n[MOCK OTP EMAIL SEND]")
        print(f"To: {to_email}")
        print(f"From: {config.SMTP_FROM_EMAIL or 'mock-sender@leadlens.com'}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body_text}")
        print(f"------------------\n")
        return

    try:
        # Build MIME message
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = config.SMTP_FROM_EMAIL
        msg["To"] = to_email

        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")
        msg.attach(part1)
        msg.attach(part2)

        # Connect and send
        print(f"INFO: Connecting to SMTP server {config.SMTP_HOST}:{config.SMTP_PORT} to send OTP...")
        if config.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        server.sendmail(config.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"INFO: Successfully sent 2FA OTP email to {to_email}")
    except Exception as e:
        print(f"❌ Error sending 2FA OTP email to {to_email}: {e}")

