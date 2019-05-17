import { getConnection } from "../db/mysql";
import { deleteAllExpiredRefreshTokens } from "../db/tokens";

/**
 * @function
 */
export default async function oldRefreshTokenRemoval() {
    const mysqlConnection = await getConnection();
    try {
        await deleteAllExpiredRefreshTokens(mysqlConnection);
    } catch (err) {
        mysqlConnection.setDestroyConnection();
    } finally {
        mysqlConnection.closeConnection();
    }
}