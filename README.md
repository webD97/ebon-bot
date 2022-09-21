# eBon Bot
Let's just call it _ebb_ - it's simpler. _ebb_ is a personal tool that connect to my mailbox, watches an inbox for REWE eBon mails, downloads the eBon PDF file from the attachment, parses it using [rewe-ebon-parser](https://github.com/webD97/rewe-ebon-parser), dumps the PDF file and the generated JSON file into my Nextcloud and sends me a summary of my purchase via a Telegram bot.

Does too many things in one package and is probably not useful for anyone else but it might still be interesting to the public. So here we go :)

## Usage
```sh
    EBB_IMAP_HOST="outlook.office365.com" \
    EBB_IMAP_USERNAME="someone@outlook.com" \
    EBB_IMAP_PASSWORD="secret" \
    EBB_IMAP_PORT="993" \
    EBB_IMAP_BOX="Inbox/REWE eBon" \
    EBB_NEXTCLOUD_SERVER_URL="https://mynextcloud.com" \
    EBB_NEXTCLOUD_USERNAME="Someone" \
    EBB_NEXTCLOUD_PASSWORD="secret" \
    EBB_NEXTCLOUD_DIRECTORY="/Documents/eBons" \
    EBB_TELEGRAM_BOT_TOKEN="token" \
    EBB_TELEGRAM_API_ID="123456" \
    EBB_TELEGRAM_API_HASH="abcdef" \
    EBB_TELEGRAM_PEER="someone" \
        ./ebb
```