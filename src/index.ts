import * as imapSimple from "imap-simple";
import { parseEBon } from 'rewe-ebon-parser';
import logger from "./log";
import { validateConfig } from "./validateConfig";
import { TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions";
import { LogLevel } from "telegram/extensions/Logger";
import { writeFileSync } from "fs";

const EURO_FORMAT = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' });

async function handleMessage(imap: imapSimple.ImapSimple, message: imapSimple.Message, folder: string) {
    logger.info(`Searching eBon attachment in message received at ${message.attributes.date.toISOString()}.`);
    const attachmentPart = imapSimple.getParts(message.attributes.struct!)
        .filter((part) => part.disposition && part.disposition.type.toUpperCase() === 'ATTACHMENT')[0];

    logger.info(`Downloading eBon attachment.`);
    const data = await imap.getPartData(message, attachmentPart);

    logger.info(`Parsing eBon into object.`);
    const ebon = await parseEBon(data);

    logger.info(`Saving eBon to disk.`);
    const filename = ebon.date.toISOString().replace(/[:]/g, '-');

    writeFileSync(`${folder}/${filename}.pdf`, data);
    writeFileSync(`${folder}/${filename}.json`, Buffer.from(JSON.stringify(ebon, undefined, 4), 'utf-8'));

    return ebon;
}

async function handleMails(imap: imapSimple.ImapSimple, folder: string, notify: (title: string, message: string) => void) {
    logger.info(`Searching for unseen REWE eBon mail(s).`);

    const messages = await imap.search(['UNSEEN', ['FROM', 'ebon@mailing.rewe.de']], { struct: true, markSeen: true, bodies: ['HEADER'] });
    
    logger.info(`Found ${messages.length} unseen REWE eBon mail(s).`);
    
    try {
        const eBons = await Promise.all(messages.map(message => handleMessage(imap, message, folder)));
        logger.info(`Successfully handled ${eBons.length} found eBon mails.`);

        eBons.forEach(eBon => {
            const datum = eBon.date.toLocaleDateString('de-DE');
            const zeit = eBon.date.toLocaleTimeString('de-DE');

            const artikel = eBon.items
                .filter(item => item.subTotal > 0)
                .filter(item => !item.name.includes('PFAND'))
                .map(item => item.name)
                .join(', ');

            const notificationTitle = `Dein eBon für den Einkauf am ${datum} um ${zeit} (${EURO_FORMAT.format(eBon.total)})`;
            const notificationBody = [
                `Folgende Artikel hast du gekauft: ${artikel}`
            ];

            if (eBon.payback !== undefined) {
                const payback = eBon.payback.earnedPoints;
                const coupons = eBon.payback.usedCoupons.length;
                const formattedRevenue = EURO_FORMAT.format(eBon.payback.qualifiedRevenue)

                notificationBody.push('');
                notificationBody.push(`Du hast ${payback} PayBack Punkte auf einen Umsatz von ${formattedRevenue} erhalten und dabei ${coupons} Coupons eingelöst.`);

                if (eBon.payback.usedCoupons.length > 0) {
                    const couponInfo = eBon.payback.usedCoupons.map(coupon => `${coupon.name} (${coupon.points})`).join(', ');
                    notificationBody.push('');
                    notificationBody.push(`Eingelöste Coupons: ${couponInfo}`);
                }
            }

            notify(notificationTitle, notificationBody.join('\n'));
        });
    }
    catch (error: any) {
        logger.error(`At least one mail failed with error: ${error.message}`);
        notify('REWE eBon Bot', `At least one mail failed with error: ${error.message}`);
    }
};

async function main() {
    // Get config from environment
    const missingConfig = validateConfig(process.env);

    if (missingConfig.length !== 0) {
        logger.error(`Configuration is missing the following environment variables: ${missingConfig.join(', ')}`);
        process.exit(1);
    }
    
    const {
        EBB_IMAP_HOST,
        EBB_IMAP_USERNAME,
        EBB_IMAP_PASSWORD,
        EBB_IMAP_PORT,
        EBB_IMAP_BOX,
        EBB_TELEGRAM_BOT_TOKEN,
        EBB_TELEGRAM_API_ID,
        EBB_TELEGRAM_API_HASH,
        EBB_TELEGRAM_PEER,
        EBB_SAVE_DIRECTORY
    } = process.env;

    const imapConfig: imapSimple.ImapSimpleOptions = {
        imap: {
            user: EBB_IMAP_USERNAME!,
            password: EBB_IMAP_PASSWORD!,
            host: EBB_IMAP_HOST!,
            port: parseInt(EBB_IMAP_PORT!),
            tls: true,
            authTimeout: 3000
        }
    };
    
    const telegramConfig = {
        botToken: EBB_TELEGRAM_BOT_TOKEN!,
        apiId: parseInt(EBB_TELEGRAM_API_ID!),
        apiHash: EBB_TELEGRAM_API_HASH!,
        peer: EBB_TELEGRAM_PEER!
    }

    // Build connections
    logger.info(`Connecting to "${imapConfig.imap.host}" as "${imapConfig.imap.user}".`);
    const imap = await imapSimple.connect(imapConfig);

    const telegramClient = new TelegramClient(new StringSession(""), telegramConfig.apiId, telegramConfig.apiHash, { connectionRetries: 10 });
    telegramClient.setLogLevel(LogLevel.WARN);

    const notify = async (title: string, message: string) => {
        await telegramClient.start({ botAuthToken: telegramConfig.botToken });
        await telegramClient.sendMessage(telegramConfig.peer, {
            message: `**${title}**\n\n${message}`
        });
    };

    await imap.openBox(EBB_IMAP_BOX!);
    logger.info(`Opened mailbox "${EBB_IMAP_BOX}".`);

    // Register for incoming mail
    imap.on('mail', () => handleMails(imap, EBB_SAVE_DIRECTORY!, notify));

    // Run mail check once on startup
    handleMails(imap, EBB_SAVE_DIRECTORY!, notify);

    // Handle SIGINT to shutdown gracefully
    process.on('SIGINT', () => {
        logger.info('Received SIGINT, shutting down. Tot ziens!');

        imap.end();
        telegramClient.destroy();

        process.exit(0);
    });
}

main().catch(console.error);
