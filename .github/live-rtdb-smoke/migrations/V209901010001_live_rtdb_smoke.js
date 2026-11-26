Object.defineProperty(exports, '__esModule', { value: true });

exports.default = class LiveRtdbSmoke {
    async up(db, info, handler) {
        await db.database.ref(handler.cfg.buildPath('live-smoke-marker')).set({
            runId: process.env.GITHUB_RUN_ID,
        });
        return 'Wrote the live RTDB smoke marker';
    }

    async down(db, info, handler) {
        await db.database.ref(handler.cfg.buildPath('live-smoke-marker')).remove();
        return 'Removed the live RTDB smoke marker';
    }
};
