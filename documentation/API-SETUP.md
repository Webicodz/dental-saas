# API Setup & Cost Guide

Complete guide for setting up third-party APIs and understanding costs for the Dental Practice Management System.

---

## Overview

The system uses third-party AI and communication services to power features like:
- AI Chatbot (appointment booking, FAQs)
- AI Voice Agent (phone call handling)
- SMS Reminders
- Email Notifications

**Important:** You pay providers directly. No markup, no middleman.

---

## Required API Accounts

### 1. OpenAI (AI Chatbot) - REQUIRED

**What it does:** Powers the intelligent chatbot for answering questions and booking appointments.

**Setup Steps:**

1. Go to: https://platform.openai.com/signup
2. Create account with your clinic email
3. Add payment method (credit card)
4. Go to: https://platform.openai.com/api-keys
5. Click "Create new secret key"
6. Copy key (starts with `sk-proj-...`)
7. In your app: Settings → API Configuration → OpenAI
8. Paste key and save

**Costs:**

| Model | Input (per 1M tokens) | Output (per 1M tokens) | Typical Use |
|-------|----------------------|------------------------|-------------|
| GPT-4o | $5.00 | $15.00 | Best quality, recommended |
| GPT-4o-mini | $0.15 | $0.60 | Budget option |

**Example Costs:**
- 1,000 chat conversations: $10-15/month (GPT-4o)
- 5,000 chat conversations: $50-75/month (GPT-4o)
- 1,000 conversations: $2-3/month (GPT-4o-mini)

**Calculation:**
- Average conversation: 500 tokens (250 input + 250 output)
- 1,000 conversations = 500,000 tokens
- Cost = (250k × $5/1M) + (250k × $15/1M) = $1.25 + $3.75 = $5
- Plus overhead ≈ $10-15/month

**Tips to Reduce Costs:**
- Use GPT-4o-mini for simple queries
- Set max_tokens limit
- Cache common responses
- Monitor usage dashboard in app

---

### 2. Twilio (SMS & Voice) - REQUIRED

**What it does:** Sends SMS reminders and handles voice calls.

**Setup Steps:**

1. Go to: https://www.twilio.com/try-twilio
2. Sign up with clinic details
3. Verify your phone number
4. Add $20-50 to account (Console → Billing)
5. Get a phone number:
   - Console → Phone Numbers → Buy a number
   - Search for local number in your area
   - Select number with Voice + SMS capability
   - Purchase ($1.15/month + usage)
6. Get credentials:
   - Console → Account → Account Info
   - Copy Account SID
   - Copy Auth Token
7. In your app: Settings → API Configuration → Twilio
   - Paste Account SID
   - Paste Auth Token
   - Enter phone number

**Costs:**

| Service | Cost | Notes |
|---------|------|-------|
| Phone Number | $1.15/month | One-time rental |
| SMS (US) | $0.0079/message | Outgoing only |
| Voice (incoming) | $0.0085/minute | Patients calling in |
| Voice (outgoing) | $0.014/minute | AI calling patients |

**Example Monthly Costs:**

**Small Clinic (1-2 doctors):**
- Phone number: $1.15
- 300 SMS reminders: $2.37
- 50 voice calls × 3 min: $2.10
- **Total: ~$6/month**

**Medium Clinic (3-5 doctors):**
- Phone number: $1.15
- 800 SMS reminders: $6.32
- 150 voice calls × 3 min: $6.30
- **Total: ~$14/month**

**Large Clinic (6+ doctors):**
- Phone number: $1.15
- 1,500 SMS reminders: $11.85
- 300 voice calls × 3 min: $12.60
- **Total: ~$26/month**

**How to Reduce Costs:**
- Send reminders only to confirmed appointments
- Use email for non-urgent reminders (free)
- Adjust reminder timing (24h vs 48h vs 1 week)
- Batch SMS for efficiency

---

### 3. SendGrid (Email) - REQUIRED

**What it does:** Sends appointment confirmations, reminders, and notifications.

**Setup Steps:**

1. Go to: https://signup.sendgrid.com
2. Create free account
3. Verify email address
4. Complete sender verification:
   - Settings → Sender Authentication
   - Verify your clinic domain OR
   - Verify single sender email
5. Create API key:
   - Settings → API Keys → Create API Key
   - Name: "Dental App"
   - Full Access
   - Copy key (starts with `SG.`)
6. In your app: Settings → API Configuration → SendGrid
   - Paste API key
   - Enter from email (noreply@yourclinic.com)

**Costs:**

| Plan | Emails/Month | Price | Best For |
|------|-------------|-------|----------|
| Free | 100/day (3,000/month) | $0 | Small clinics |
| Essentials | 50,000/month | $19.95 | Medium clinics |
| Pro | 100,000/month | $89.95 | Large clinics |

**Example Costs:**
- Small clinic: FREE (under 100/day)
- Medium clinic: $19.95/month
- Large clinic: $89.95/month

**Tips:**
- Start with free tier
- Email is cheaper than SMS
- Use for non-urgent reminders
- Upgrade only when needed

---

### 4. Deepgram (Speech-to-Text) - OPTIONAL

**What it does:** Converts patient voice to text for voice agent.

**Setup Steps:**

1. Go to: https://console.deepgram.com/signup
2. Create account
3. Get $200 free credit
4. Console → API Keys → Create Key
5. In app: Settings → API Configuration → Deepgram

**Costs:**
- $0.0043/minute of audio
- 200 calls × 3 min = $2.58/month
- Very affordable!

**Note:** Only needed if using voice agent feature.

---

### 5. ElevenLabs (Text-to-Speech) - OPTIONAL

**What it does:** Converts AI responses to natural speech for voice calls.

**Setup Steps:**

1. Go to: https://elevenlabs.io
2. Create account
3. Profile → API Keys → Generate
4. Choose a voice (preview available)
5. In app: Settings → API Configuration → ElevenLabs

**Costs:**

| Plan | Characters/Month | Price |
|------|-----------------|-------|
| Free | 10,000 | $0 |
| Starter | 30,000 | $5 |
| Creator | 100,000 | $22 |

**Example:**
- 200 calls × 500 chars = 100,000 chars
- Cost: $22/month (Creator plan)

**Alternative:** Use Deepgram TTS (cheaper but less natural)

---

## Complete Monthly Cost Breakdown

### Small Clinic (1-2 doctors, ~50 patients/week)

| Service | Feature | Monthly Cost |
|---------|---------|--------------|
| OpenAI GPT-4o | AI Chatbot (1,000 chats) | $15 |
| Twilio SMS | Reminders (300 SMS) | $3 |
| Twilio Voice | Voice agent (50 calls) | $3 |
| SendGrid | Emails (2,000 emails) | FREE |
| Deepgram | Speech-to-text | $2 |
| **TOTAL** | | **$23/month** |

### Medium Clinic (3-5 doctors, ~150 patients/week)

| Service | Feature | Monthly Cost |
|---------|---------|--------------|
| OpenAI GPT-4o | AI Chatbot (3,000 chats) | $40 |
| Twilio SMS | Reminders (800 SMS) | $7 |
| Twilio Voice | Voice agent (150 calls) | $7 |
| SendGrid | Emails (5,000 emails) | $20 |
| Deepgram | Speech-to-text | $5 |
| ElevenLabs | Text-to-speech | $22 |
| **TOTAL** | | **$101/month** |

### Large Clinic (6+ doctors, ~300 patients/week)

| Service | Feature | Monthly Cost |
|---------|---------|--------------|
| OpenAI GPT-4o | AI Chatbot (5,000 chats) | $75 |
| Twilio SMS | Reminders (1,500 SMS) | $13 |
| Twilio Voice | Voice agent (300 calls) | $13 |
| SendGrid | Emails (10,000 emails) | $20 |
| Deepgram | Speech-to-text | $10 |
| ElevenLabs | Text-to-speech | $22 |
| **TOTAL** | | **$153/month** |

---

## Cost Optimization Strategies

### 1. Use Email First
- Email is free (up to 3,000/month)
- Reserve SMS for urgent reminders
- Most patients check email regularly

### 2. Adjust Reminder Timing
- Send 1 reminder instead of 2-3
- 24 hours before is sufficient
- Reduce no-shows without over-messaging

### 3. Use Mini Models
- Switch to GPT-4o-mini for simple queries
- 80% cost reduction
- Still very capable

### 4. Monitor Usage Dashboard
- Check daily/weekly usage in app
- Set budget alerts
- Identify cost spikes

### 5. Disable Unused Features
- Turn off voice agent if not needed
- Disable SMS for confirmed appointments
- Use features selectively

---

## Setting Up Cost Tracking

The app includes built-in cost monitoring:

**Dashboard → API Usage**
- Real-time cost tracking
- Daily/weekly/monthly breakdown
- Per-service analysis
- Budget alerts
- Usage trends

**Setup Alerts:**
1. Settings → Cost Alerts
2. Set monthly budget (e.g., $100)
3. Alert at 80% ($80)
4. Email notification to admin

---

## Troubleshooting

### OpenAI "Insufficient Quota" Error
**Solution:**
1. Add payment method to OpenAI account
2. Add at least $5 credit
3. Wait 5-10 minutes for activation

### Twilio SMS Not Sending
**Solution:**
1. Verify account (add credit card)
2. Verify "from" phone number
3. Check recipient number format (+1...)
4. Ensure number has SMS capability

### SendGrid Emails in Spam
**Solution:**
1. Verify sender domain
2. Set up SPF/DKIM records
3. Use clinic domain email
4. Avoid spam trigger words

### API Key Invalid
**Solution:**
1. Regenerate key from provider
2. Copy entire key (no spaces)
3. Save in app settings
4. Test connection

---

## Best Practices

### Security
- Never share API keys
- Regenerate if compromised
- Use separate keys for testing
- Rotate keys annually

### Cost Management
- Review usage weekly
- Set budget limits
- Monitor cost per patient
- Optimize based on data

### Patient Experience
- Don't over-message patients
- Respect opt-out preferences
- Use appropriate channels
- Maintain professional tone

---

## FAQ

**Q: Can I use my existing Twilio account?**  
A: Yes! Just enter your existing credentials.

**Q: What if I exceed my budget?**  
A: The app will alert you. You can disable features or add credits.

**Q: Are there any setup fees?**  
A: No. Only usage-based costs from providers.

**Q: Can I switch AI providers?**  
A: Yes. The app supports OpenAI and Anthropic Claude.

**Q: What happens if I run out of credits?**  
A: Features will stop until you add credits. The app will notify you.

**Q: Can I pause AI features temporarily?**  
A: Yes. Disable in Settings → Features.

---

## Support

**Need help with API setup?**

- Email: support@yourcompany.com
- Include: License key, error message
- Response: 24-48 hours

**Provider Support:**
- OpenAI: https://help.openai.com
- Twilio: https://support.twilio.com
- SendGrid: https://support.sendgrid.com

---

## Summary

**Minimum Required:**
- OpenAI: ~$15-40/month
- Twilio: ~$5-15/month
- SendGrid: Free-$20/month
- **Total: $20-75/month**

**Optional (Voice Agent):**
- Add $20-40/month

**Your patients get:**
- 24/7 AI assistant
- Instant appointment booking
- SMS/email reminders
- Professional voice agent

**ROI:**
- Reduced no-shows (20-30%)
- Less receptionist time
- Improved patient satisfaction
- More appointments booked

---

**Ready to set up?** Start with OpenAI and SendGrid (essential), then add Twilio and voice features as needed!
