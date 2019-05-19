import { deleteAllExpiredSessions } from '../helpers/dbQueries';
import { getConnection } from '../helpers/mysql';

/**
 * @function
 */
export default async function oldRefreshTokenRemoval() {
    const mysqlConnection = await getConnection();
    try {
        await deleteAllExpiredSessions(mysqlConnection);
    } finally {
        mysqlConnection.closeConnection();
    }
}