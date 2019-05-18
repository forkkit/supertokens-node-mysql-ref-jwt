import { 
    randomBytes,
    pbkdf2,
    createCipheriv,
    createDecipheriv
} from "crypto";

/**
 * Encrypts text by given key
 * @param String text to encrypt
 * @param Buffer masterkey
 * @returns String encrypted text, base64 encoded
 */
export async function encrypt(text: string, masterkey: string): Promise<string>{
    // random initialization vector
    const iv = randomBytes(16);

    // random salt
    const salt = randomBytes(64);

    // derive encryption key: 32 byte key length
    // in assumption the masterkey is a cryptographic and NOT a password there is no need for
    // a large number of iterations. It may can replaced by HKDF
    // the value of 2145 is randomly chosen!
    const key = await new Promise<Buffer>((resolve, reject) => {
        pbkdf2(masterkey, salt, 100, 32, 'sha512', (err, i) => {
            if (err) {
                reject(err); return
            }
            resolve(i)
        });
    });

    // AES 256 GCM Mode
    const cipher = createCipheriv('aes-256-gcm', key, iv);

    // encrypt the given text
    const encrypted = Buffer.concat([cipher.update(text, 'utf8'), cipher.final()]);

    // extract the auth tag
    const tag = cipher.getAuthTag();

    // generate output
    return Buffer.concat([salt, iv, tag, encrypted]).toString('base64');
}
/**
 * Decrypts text by given key
 * @param String base64 encoded input data
 * @param Buffer masterkey
 * @returns String decrypted (original) text
 */
export async function decrypt(encdata: string, masterkey: string) {
    // base64 decoding
    const bData = Buffer.from(encdata, 'base64');

    // convert data to buffers
    const salt = bData.slice(0, 64);
    const iv = bData.slice(64, 80);
    const tag = bData.slice(80, 96);
    const text: any = bData.slice(96); // NOTE: any because there is something wrong with TS definition file

    // derive key using; 32 byte key length
    const key = await new Promise<Buffer>((resolve, reject) => {
        pbkdf2(masterkey, salt, 100, 32, 'sha512', (err, i) => {
            if (err) {
                reject(err);
                return
            }
            resolve(i)
        });
    });

    // AES 256 GCM Mode
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);

    // encrypt the given text
    const decrypted = decipher.update(text, 'binary', 'utf8') + decipher.final('utf8');

    return decrypted;
}
