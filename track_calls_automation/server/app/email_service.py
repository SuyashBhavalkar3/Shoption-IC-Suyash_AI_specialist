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


def send_demo_booking_admin_email(full_name: str, email: str, phone: str, org_name: str, pain_plan: str, description: str):
    """
    Sends an email notification to the LeadLens Admin informing them of a new demo request.
    """
    from datetime import datetime
    current_year = datetime.now().year
    
    subject = f"New Demo Request - {org_name} wants to connect"
    admin_email = config.ADMIN_EMAIL

    body_text = (
        f"New Connection Request Received\n\n"
        f"This new Organization wants to connect with you!\n\n"
        f"Organization Name: {org_name}\n"
        f"Interested Plan: {pain_plan}\n"
        f"Contact Person: {full_name}\n"
        f"Email Address: {email}\n"
        f"Phone Number: {phone}\n"
        f"Pain Points & Goals:\n{description}\n\n"
        f"Best regards,\n"
        f"LeadLens Team"
    )

    body_html = f"""<!DOCTYPE html>
<html>
<head>
  <style>
    body {{
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #050816;
      color: #F8FAFC;
      margin: 0;
      padding: 0;
    }}
    .email-container {{
      max-width: 600px;
      margin: 20px auto;
      background-color: #0E1528;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }}
    .email-header {{
      background: linear-gradient(135deg, #050816 0%, #0E1528 100%);
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }}
    .logo-img {{
      max-width: 150px;
      height: auto;
    }}
    .email-body {{
      padding: 40px 30px;
    }}
    .greeting {{
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 20px;
    }}
    .badge {{
      display: inline-block;
      padding: 6px 14px;
      background: linear-gradient(135deg, rgba(0, 118, 255, 0.15) 0%, rgba(0, 197, 131, 0.15) 100%);
      border: 1px solid rgba(0, 118, 255, 0.3);
      color: #00C583;
      font-size: 12px;
      font-weight: bold;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 25px;
    }}
    .lead-info-card {{
      background-color: #050816;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 30px;
    }}
    .info-row {{
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 12px;
    }}
    .info-row:last-child {{
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }}
    .info-label {{
      font-size: 11px;
      text-transform: uppercase;
      color: #94A3B8;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }}
    .info-value {{
      font-size: 15px;
      color: #F8FAFC;
      font-weight: 600;
    }}
    .info-value-plan {{
      font-size: 15px;
      font-weight: bold;
      color: #00C583;
      display: inline-block;
    }}
    .email-footer {{
      background-color: #050816;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://leadlens.in/logo_product_page.png" alt="LeadLens" class="logo-img">
    </div>
    <div class="email-body">
      <span class="badge">New Demo Request</span>
      <h2 class="greeting">This new Organization wants to connect with you</h2>
      <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        A new connection request has been submitted. Here are the details of the organization:
      </p>
      
      <div class="lead-info-card">
        <div class="info-row">
          <div class="info-label">Organization Name</div>
          <div class="info-value">{org_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Interested Plan</div>
          <div class="info-value-plan">{pain_plan}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Contact Person</div>
          <div class="info-value">{full_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email Address</div>
          <div class="info-value"><a href="mailto:{email}" style="color: #0076FF; text-decoration: none;">{email}</a></div>
        </div>
        <div class="info-row">
          <div class="info-label">Phone Number</div>
          <div class="info-value">{phone}</div>
        </div>
        <div class="info-row" style="border-bottom: none; padding-bottom: 0;">
          <div class="info-label">Pain Points & Goals</div>
          <div class="info-value" style="font-weight: normal; font-size: 14px; color: #cbd5e1; line-height: 1.5; margin-top: 5px; white-space: pre-line;">{description}</div>
        </div>
      </div>
    </div>
    <div class="email-footer">
      &copy; {current_year} LeadLens. All rights reserved.
    </div>
  </div>
</body>
</html>
"""

    if not config.SMTP_USERNAME or not config.SMTP_PASSWORD:
        print(f"\n[MOCK EMAIL SEND TO ADMIN]")
        print(f"To: {admin_email}")
        print(f"From: {config.SMTP_FROM_EMAIL or 'mock-sender@leadlens.com'}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body_text}")
        print(f"------------------\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = config.SMTP_FROM_EMAIL
        msg["To"] = admin_email

        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")
        msg.attach(part1)
        msg.attach(part2)

        if config.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        server.sendmail(config.SMTP_FROM_EMAIL, admin_email, msg.as_string())
        server.quit()
        print(f"INFO: Successfully sent admin demo booking notification email to {admin_email}")
    except Exception as e:
        print(f"❌ Error sending admin booking email: {e}")


def send_demo_booking_user_email(to_email: str, full_name: str, org_name: str, pain_plan: str, description: str):
    """
    Sends a confirmation email to the user who requested the demo booking.
    """
    from datetime import datetime
    current_year = datetime.now().year
    
    subject = "LeadLens Demo Request - Successfully Sent"

    body_text = (
        f"Hi {full_name},\n\n"
        f"Your request is successfully sent to LeadLens. We will connect with you soon.\n\n"
        f"Our team of product specialists is currently reviewing your goals and pain points. We will get in touch with you within the next 24 hours to schedule the demo.\n\n"
        f"Your Booking Summary:\n"
        f"----------------------------------------\n"
        f"Organization Name: {org_name}\n"
        f"Selected Plan: {pain_plan}\n"
        f"Pain Points & Goals Detailed:\n{description}\n"
        f"----------------------------------------\n\n"
        f"If you have any urgent questions, feel free to reply directly to this email or reach us at support@leadlens.in.\n\n"
        f"Best regards,\n"
        f"LeadLens Team"
    )

    body_html = f"""<!DOCTYPE html>
<html>
<head>
  <style>
    body {{
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #050816;
      color: #F8FAFC;
      margin: 0;
      padding: 0;
    }}
    .email-container {{
      max-width: 600px;
      margin: 20px auto;
      background-color: #0E1528;
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    }}
    .email-header {{
      background: linear-gradient(135deg, #050816 0%, #0E1528 100%);
      padding: 30px;
      text-align: center;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }}
    .logo-img {{
      max-width: 150px;
      height: auto;
    }}
    .email-body {{
      padding: 40px 30px;
    }}
    .greeting {{
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      margin-top: 0;
      margin-bottom: 20px;
    }}
    .badge {{
      display: inline-block;
      padding: 6px 14px;
      background: linear-gradient(135deg, rgba(0, 118, 255, 0.15) 0%, rgba(0, 197, 131, 0.15) 100%);
      border: 1px solid rgba(0, 118, 255, 0.3);
      color: #00C583;
      font-size: 12px;
      font-weight: bold;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin-bottom: 25px;
    }}
    .lead-info-card {{
      background-color: #050816;
      border: 1px solid rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 25px;
      margin-bottom: 30px;
    }}
    .info-row {{
      margin-bottom: 15px;
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      padding-bottom: 12px;
    }}
    .info-row:last-child {{
      margin-bottom: 0;
      border-bottom: none;
      padding-bottom: 0;
    }}
    .info-label {{
      font-size: 11px;
      text-transform: uppercase;
      color: #94A3B8;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
    }}
    .info-value {{
      font-size: 15px;
      color: #F8FAFC;
      font-weight: 600;
    }}
    .info-value-plan {{
      font-size: 15px;
      font-weight: bold;
      color: #00C583;
      display: inline-block;
    }}
    .email-footer {{
      background-color: #050816;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #64748B;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }}
  </style>
</head>
<body>
  <div class="email-container">
    <div class="email-header">
      <img src="https://leadlens.in/logo_product_page.png" alt="LeadLens" class="logo-img">
    </div>
    <div class="email-body">
      <span class="badge">Request Sent Successfully</span>
      <h2 class="greeting">Hi {full_name},</h2>
      <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-bottom: 20px;">
        Your request is successfully sent to LeadLens. We will connect with you soon.
      </p>
      <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 25px;">
        Our team of product specialists is currently reviewing your goals and pain points to prepare a customized demo.
      </p>
      
      <h3 style="color: #ffffff; font-size: 14px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; letter-spacing: 0.5px;">Your Booking Summary</h3>
      <div class="lead-info-card">
        <div class="info-row">
          <div class="info-label">Organization Name</div>
          <div class="info-value">{org_name}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Selected Interest Plan</div>
          <div class="info-value-plan">{pain_plan}</div>
        </div>
        <div class="info-row" style="border-bottom: none; padding-bottom: 0;">
          <div class="info-label">Pain Points & Goals Detailed</div>
          <div class="info-value" style="font-weight: normal; font-size: 14px; color: #cbd5e1; line-height: 1.5; margin-top: 5px; white-space: pre-line;">{description}</div>
        </div>
      </div>
      
      <p style="color: #94A3B8; font-size: 14px; line-height: 1.6; margin-bottom: 0;">
        If you have any urgent questions, feel free to reply directly to this email or reach us at <a href="mailto:support@leadlens.in" style="color: #0076FF; text-decoration: none;">support@leadlens.in</a>.
      </p>
    </div>
    <div class="email-footer">
      &copy; {current_year} LeadLens. All rights reserved.
    </div>
  </div>
</body>
</html>
"""

    if not config.SMTP_USERNAME or not config.SMTP_PASSWORD:
        print(f"\n[MOCK EMAIL SEND TO USER]")
        print(f"To: {to_email}")
        print(f"From: {config.SMTP_FROM_EMAIL or 'mock-sender@leadlens.com'}")
        print(f"Subject: {subject}")
        print(f"Body:\n{body_text}")
        print(f"------------------\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = config.SMTP_FROM_EMAIL
        msg["To"] = to_email

        part1 = MIMEText(body_text, "plain")
        part2 = MIMEText(body_html, "html")
        msg.attach(part1)
        msg.attach(part2)

        if config.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(config.SMTP_USERNAME, config.SMTP_PASSWORD)
        server.sendmail(config.SMTP_FROM_EMAIL, to_email, msg.as_string())
        server.quit()
        print(f"INFO: Successfully sent user demo booking confirmation email to {to_email}")
    except Exception as e:
        print(f"❌ Error sending user booking email: {e}")


