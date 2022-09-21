export function validateConfig(config: Record<string, string|undefined>): string[] {
    return [
            'EBB_IMAP_HOST',
            'EBB_IMAP_USERNAME',
            'EBB_IMAP_PASSWORD',
            'EBB_IMAP_PORT',
            'EBB_IMAP_BOX',
            'EBB_NEXTCLOUD_SERVER_URL',
            'EBB_NEXTCLOUD_USERNAME',
            'EBB_NEXTCLOUD_PASSWORD',
            'EBB_NEXTCLOUD_DIRECTORY',
            'EBB_TELEGRAM_BOT_TOKEN',
            'EBB_TELEGRAM_API_ID',
            'EBB_TELEGRAM_API_HASH'
        ]
        .filter(envName => !process.env[envName])
}
