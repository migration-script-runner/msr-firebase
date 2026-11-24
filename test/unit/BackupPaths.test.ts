import { expect } from 'chai';
import { resolveBackupPaths } from '../../src/service/backupPaths';

describe('resolveBackupPaths', () => {
    it('keeps full database backups as the default', () => {
        expect(resolveBackupPaths(undefined, '/production')).to.be.undefined;
    });

    it('resolves selected paths under the configured shift', () => {
        expect(resolveBackupPaths(['users', 'settings/theme'], '/production/'))
            .to.deep.equal(['/production/users', '/production/settings/theme']);
    });

    it('resolves selected paths at the database root when shift is unset', () => {
        expect(resolveBackupPaths(['users'], undefined)).to.deep.equal(['/users']);
    });

    it('rejects non-array configuration', () => {
        expect(() => resolveBackupPaths('users', undefined))
            .to.throw(TypeError, 'backupPaths must be an array');
    });

    it('rejects an explicitly empty selection', () => {
        expect(() => resolveBackupPaths([], undefined))
            .to.throw(RangeError, 'omit it to back up the full database');
    });

    it('rejects empty, absolute, and malformed paths', () => {
        for (const path of ['', '/users', 'users/', 'users//posts']) {
            expect(() => resolveBackupPaths([path], undefined)).to.throw(RangeError);
        }
        expect(() => resolveBackupPaths([1], undefined)).to.throw(TypeError);
    });

    it('rejects Firebase-forbidden key characters', () => {
        expect(() => resolveBackupPaths(['users/profile.name'], undefined))
            .to.throw(RangeError, 'forbidden character');
    });

    it('rejects duplicate or overlapping paths', () => {
        for (const paths of [['users', 'users'], ['users', 'users/posts'], ['users/posts', 'users']]) {
            expect(() => resolveBackupPaths(paths, undefined)).to.throw(RangeError, 'overlap');
        }
    });
});
