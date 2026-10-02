#!/usr/bin/env python3
"""Send the outreach emails audit.py wrote, a few per day, from your own inbox.

Standard library only. Previews by default; nothing is sent without --send.

    export SMTP_USER="you@gmail.com"
    export SMTP_PASS="your-16-char-app-password"   # Gmail: myaccount.google.com/apppasswords
    python3 send.py reports --address "12 High St, Leeds LS1 1AA"            # preview
    python3 send.py reports --address "12 High St, Leeds LS1 1AA" --send     # send today's batch
    python3 send.py reports --address "..." --followups --send               # one gentle follow-up

Safety rails (keep them; they also protect your inbox's reputation):
  * --limit per run (default 20); 45-120s random pause between emails.
  * Every email ends with your postal address and an opt-out line (CAN-SPAM).
  * Addresses in do_not_contact.txt are never emailed. Add anyone who replies
    (yes or no) there so they don't get the follow-up.
  * Each business gets at most one first email and one follow-up, ever.
"""
import argparse
import csv
import datetime as dt
import os
import random
import smtplib
import ssl
import sys
import time
from email.message import EmailMessage

FOLLOWUP = """Subject: Re: {subject}

Hi again,

Just bumping this in case it got buried. The free report on {host} is attached again.

Happy to fix everything in it for a flat ${price}, and you only pay once it's done. A quick "yes" or "no thanks" is all I need.

Thanks,
{sender}
"""


def read_csv(path):
    if not os.path.exists(path):
        return []
    with open(path, newline="", encoding="utf-8") as f:
        return list(csv.DictReader(f))


def build(to, subject, body, attachment, sender_name, address, user):
    msg = EmailMessage()
    msg["From"] = f"{sender_name} <{user}>"
    msg["To"] = to
    msg["Subject"] = subject
    msg.set_content(f"{body.rstrip()}\n\n--\n{sender_name} · {address}\n"
                    "Not interested? Reply \"no thanks\" and you won't hear from me again.\n")
    if attachment and os.path.exists(attachment):
        with open(attachment, "rb") as f:
            msg.add_attachment(f.read(), maintype="text", subtype="html",
                               filename="website-health-report.html")
    return msg


def split_subject(text):
    first, _, rest = text.partition("\n")
    return first.removeprefix("Subject:").strip(), rest.strip()


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("reports", help="folder audit.py wrote (contains leads.csv)")
    ap.add_argument("--address", required=True, help="your postal address (legally required in the footer)")
    ap.add_argument("--sender", default=None, help="your name (defaults to SMTP_USER)")
    ap.add_argument("--price", type=int, default=199)
    ap.add_argument("--limit", type=int, default=20)
    ap.add_argument("--max-score", type=int, default=75, help="only pitch sites scoring at or below this")
    ap.add_argument("--followups", action="store_true", help="send follow-ups (4+ days after first email)")
    ap.add_argument("--send", action="store_true", help="actually send (otherwise preview only)")
    a = ap.parse_args()

    user, pw = os.environ.get("SMTP_USER", ""), os.environ.get("SMTP_PASS", "")
    host, port = os.environ.get("SMTP_HOST", "smtp.gmail.com"), int(os.environ.get("SMTP_PORT", "465"))
    if a.send and not (user and pw):
        sys.exit("Set SMTP_USER and SMTP_PASS first (see the top of this file).")
    sender = a.sender or user or "Your Name"

    log_path = os.path.join(a.reports, "sent.csv")
    sent = read_csv(log_path)
    dnc_path = os.path.join(a.reports, "do_not_contact.txt")
    dnc = set()
    if os.path.exists(dnc_path):
        dnc = {l.strip().lower() for l in open(dnc_path, encoding="utf-8") if l.strip()}
    contacted = {r["email"].lower() for r in sent}
    followed = {r["email"].lower() for r in sent if r["kind"] == "followup"}

    queue = []
    if a.followups:
        cutoff = dt.datetime.now() - dt.timedelta(days=4)
        for r in sent:
            e = r["email"].lower()
            if (r["kind"] == "first" and e not in followed and e not in dnc
                    and dt.datetime.fromisoformat(r["at"]) <= cutoff):
                subject, _ = split_subject(open(os.path.join(a.reports, r["email_file"]), encoding="utf-8").read())
                body = FOLLOWUP.format(subject=subject, host=r["url"], price=a.price, sender=sender)
                queue.append((r, "followup", body))
    else:
        for r in read_csv(os.path.join(a.reports, "leads.csv")):
            e = (r.get("email") or "").lower()
            if (not e or r.get("error") or not r.get("score") or int(r["score"]) > a.max_score
                    or e in contacted or e in dnc):
                continue
            r["email_file"] = r["report"].replace(".html", ".email.txt")
            body = open(os.path.join(a.reports, r["email_file"]), encoding="utf-8").read()
            queue.append((r, "first", body))
            contacted.add(e)

    queue = queue[:a.limit]
    if not queue:
        print("Nothing to send." + ("" if a.followups else " (Need leads with an email and score <= --max-score.)"))
        return

    smtp = None
    if a.send:
        if port == 465:
            smtp = smtplib.SMTP_SSL(host, port, context=ssl.create_default_context())
        else:
            smtp = smtplib.SMTP(host, port)
            smtp.ehlo()
            if smtp.has_extn("starttls"):
                smtp.starttls(context=ssl.create_default_context())
        smtp.login(user, pw)

    new_log = []
    for i, (r, kind, text) in enumerate(queue):
        subject, body = split_subject(text)
        msg = build(r["email"], subject, body, os.path.join(a.reports, r["report"]), sender, a.address, user)
        if not a.send:
            body_text = msg.get_body(("plain",)).get_content()
            print(f"--- PREVIEW {i + 1}/{len(queue)} -> {r['email']} ({kind}, report attached)\nSubject: {msg['Subject']}\n{body_text}")
            continue
        try:
            smtp.send_message(msg)
            print(f"sent {i + 1}/{len(queue)} -> {r['email']} ({kind})")
            new_log.append({"email": r["email"], "name": r["name"], "url": r["url"], "report": r["report"],
                            "email_file": r["email_file"], "kind": kind, "at": dt.datetime.now().isoformat()})
        except smtplib.SMTPException as e:
            print(f"FAILED -> {r['email']}: {e}", file=sys.stderr)
        if i < len(queue) - 1:
            time.sleep(random.uniform(45, 120))

    if smtp:
        smtp.quit()
    if new_log:
        fields = ["email", "name", "url", "report", "email_file", "kind", "at"]
        exists = os.path.exists(log_path)
        with open(log_path, "a", newline="", encoding="utf-8") as f:
            w = csv.DictWriter(f, fieldnames=fields)
            if not exists:
                w.writeheader()
            w.writerows(new_log)
    if not a.send:
        print(f"\nPreviewed {len(queue)} email(s). Add --send to send them.")


if __name__ == "__main__":
    main()
