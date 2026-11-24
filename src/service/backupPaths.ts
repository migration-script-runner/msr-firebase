function hasInvalidFirebaseKeyCharacter(segment: string): boolean {
    for (const character of segment) {
        const code = character.charCodeAt(0);
        if ('.#$[]'.includes(character) || code <= 0x1f || code === 0x7f) {
            return true;
        }
    }
    return false;
}

/**
 * Validates configured relative Firebase paths and resolves them beneath the shift path.
 * Undefined keeps the adapter's existing full-database backup behavior.
 */
export function resolveBackupPaths(paths: unknown, shift: string | undefined): string[] | undefined {
    if (paths === undefined) {
        return undefined;
    }

    if (!Array.isArray(paths)) {
        throw new TypeError('backupPaths must be an array of relative Firebase database paths');
    }

    if (paths.length === 0) {
        throw new RangeError('backupPaths must contain at least one path; omit it to back up the full database');
    }

    const validatedPaths: string[] = [];

    for (const path of paths) {
        if (typeof path !== 'string') {
            throw new TypeError('Each backupPaths entry must be a string path');
        }
        if (path.length === 0) {
            throw new RangeError('Each backupPaths entry must be a non-empty relative Firebase database path');
        }

        const segments = path.split('/');
        if (path.startsWith('/') || path.endsWith('/') || segments.some(segment => segment.length === 0)) {
            throw new RangeError(`Invalid backup path '${path}': use a relative path without empty segments`);
        }

        if (segments.some(hasInvalidFirebaseKeyCharacter)) {
            throw new RangeError(`Invalid backup path '${path}': Firebase path segments contain a forbidden character`);
        }

        const overlap = validatedPaths.find(existingPath =>
            path === existingPath ||
            path.startsWith(`${existingPath}/`) ||
            existingPath.startsWith(`${path}/`)
        );
        if (overlap) {
            throw new RangeError(`Backup paths '${overlap}' and '${path}' overlap`);
        }

        validatedPaths.push(path);
    }

    const shiftPrefix = shift?.split('/').filter(Boolean).join('/');
    return validatedPaths.map(path => `/${[shiftPrefix, path].filter(Boolean).join('/')}`);
}
