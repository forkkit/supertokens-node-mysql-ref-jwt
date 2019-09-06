import { removeOldOrphanTokens } from "../helpers/dbQueries";

export default async function oldOrphanTokensRemoval() {
    let oneDay = 1000 * 60 * 60 * 24;
    let now = Date.now();
    let createdBefore = now - 7 * oneDay;
    await removeOldOrphanTokens(createdBefore);
}
