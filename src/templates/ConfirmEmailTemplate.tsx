export const confirmEmailTemplate = (name: string, confirmationUrl: string) => `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background-color: #141414;
      margin: 0;
      padding: 0;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      padding: 40px 20px;
    }
    .card {
      background-color: #18181B;
      border: 1px solid #27272A;
      border-radius: 8px;
      padding: 32px;
    }
    .logo {
      color: #DC2626;
      font-size: 24px;
      font-weight: bold;
      text-align: center;
      margin-bottom: 24px;
    }
    .title {
      color: #FFFFFF;
      font-size: 20px;
      font-weight: bold;
      margin-bottom: 16px;
    }
    .text {
      color: #A1A1AA;
      font-size: 16px;
      line-height: 24px;
      margin-bottom: 24px;
    }
    .button {
      background-color: #DC2626;
      color: #FFFFFF;
      padding: 12px 24px;
      border-radius: 6px;
      text-decoration: none;
      display: inline-block;
      font-weight: 500;
    }
    .footer {
      text-align: center;
      color: #71717A;
      font-size: 14px;
      margin-top: 32px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">MovieZone</div>
      <div class="title">Confirm your email address</div>
      <div class="text">
        Hi ${name},<br><br>
        Thanks for signing up for MovieZone! Please confirm your email address by clicking the button below.
      </div>
      <a href="${confirmationUrl}" class="button">Confirm Email Address</a>
      <div class="text" style="margin-top: 24px;">
        If you didn't create an account with MovieZone, you can safely ignore this email.
      </div>
      <div class="footer">
        © ${new Date().getFullYear()} MovieZone. All rights reserved.
      </div>
    </div>
  </div>
</body>
</html>
`;
