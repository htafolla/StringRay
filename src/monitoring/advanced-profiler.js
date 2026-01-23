import { EventEmitter } from "events";
import { performance } from "perf_hooks";
import { writeFileSync, existsSync, mkdirSync } from "fs";
import { join } from "path";
export class AdvancedProfiler extends EventEmitter {
    profiles = new Map();
    activeProfiles = new Map();
    profilingEnabled = true;
    profileStoragePath;
    constructor(storagePath = "./.strray/profiles") {
        super();
        this.profileStoragePath = storagePath;
        this.ensureStorageDirectory();
        this.setupPeriodicReporting();
    }
    ensureStorageDirectory() {
        if (!existsSync(this.profileStoragePath)) {
            mkdirSync(this.profileStoragePath, { recursive: true });
        }
    }
    setupPeriodicReporting() {
        setInterval(() => {
            this.generatePerformanceReport();
        }, 5 * 60 * 1000);
        setInterval(() => {
            this.cleanupOldProfiles();
        }, 24 * 60 * 60 * 1000);
    }
    startProfiling(operationId, agentName, operation, metadata = {}) {
        if (!this.profilingEnabled)
            return;
        const profileData = {
            agentName,
            operation,
            startTime: performance.now(),
            memoryUsage: {
                before: process.memoryUsage(),
            },
            success: false,
            metadata,
        };
        this.activeProfiles.set(operationId, profileData);
    }
    endProfiling(operationId, success = true, error) {
        const profileData = this.activeProfiles.get(operationId);
        if (!profileData)
            return;
        profileData.endTime = performance.now();
        profileData.duration = profileData.endTime - profileData.startTime;
        profileData.memoryUsage.after = process.memoryUsage();
        profileData.success = success;
        if (error) {
            profileData.error = error;
        }
        if (!this.profiles.has(profileData.agentName)) {
            this.profiles.set(profileData.agentName, []);
        }
        this.profiles.get(profileData.agentName).push(profileData);
        this.activeProfiles.delete(operationId);
        this.emit("profileCompleted", profileData);
        this.detectAnomalies(profileData);
    }
    detectAnomalies(profileData) {
        if (!profileData.duration)
            return;
        const agentProfiles = this.profiles.get(profileData.agentName) || [];
        if (agentProfiles.length < 10)
            return;
        const recentProfiles = agentProfiles.slice(-20);
        const avgDuration = recentProfiles.reduce((sum, p) => sum + (p.duration || 0), 0) /
            recentProfiles.length;
        if (profileData.duration > avgDuration * 2) {
            this.emit("performanceAnomaly", {
                agentName: profileData.agentName,
                operation: profileData.operation,
                duration: profileData.duration,
                averageDuration: avgDuration,
                deviation: profileData.duration / avgDuration,
            });
        }
        const memoryDelta = this.calculateMemoryDelta(profileData);
        if (memoryDelta > 50 * 1024 * 1024) {
            this.emit("memoryAnomaly", {
                agentName: profileData.agentName,
                operation: profileData.operation,
                memoryDelta,
                memoryBefore: profileData.memoryUsage.before,
                memoryAfter: profileData.memoryUsage.after,
            });
        }
    }
    calculateMemoryDelta(profileData) {
        if (!profileData.memoryUsage.after)
            return 0;
        const before = profileData.memoryUsage.before.heapUsed;
        const after = profileData.memoryUsage.after.heapUsed;
        return after - before;
    }
    getMetrics(agentName) {
        let profiles = [];
        if (agentName) {
            profiles = this.profiles.get(agentName) || [];
        }
        else {
            for (const agentProfiles of Array.from(this.profiles.values())) {
                profiles.push(...agentProfiles);
            }
        }
        if (profiles.length === 0) {
            return {
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                averageDuration: 0,
                memoryDelta: 0,
                slowestOperation: "",
                fastestOperation: "",
            };
        }
        const successfulProfiles = profiles.filter((p) => p.success);
        const totalDuration = profiles.reduce((sum, p) => sum + (p.duration || 0), 0);
        const memoryDeltas = profiles.map((p) => this.calculateMemoryDelta(p));
        if (profiles.length === 0) {
            return {
                totalOperations: 0,
                successfulOperations: 0,
                failedOperations: 0,
                averageDuration: 0,
                memoryDelta: 0,
                slowestOperation: "",
                fastestOperation: "",
            };
        }
        let slowestOp = profiles[0];
        let fastestOp = profiles[0];
        for (const profile of profiles) {
            if ((profile.duration || 0) > (slowestOp.duration || 0)) {
                slowestOp = profile;
            }
            if ((profile.duration || 0) < (fastestOp.duration || 0)) {
                fastestOp = profile;
            }
        }
        return {
            totalOperations: profiles.length,
            successfulOperations: successfulProfiles.length,
            failedOperations: profiles.length - successfulProfiles.length,
            averageDuration: totalDuration / profiles.length,
            memoryDelta: memoryDeltas.reduce((sum, delta) => sum + delta, 0) /
                memoryDeltas.length,
            slowestOperation: slowestOp.operation,
            fastestOperation: fastestOp.operation,
        };
    }
    generatePerformanceReport() {
        const report = {
            timestamp: new Date().toISOString(),
            agents: {},
            system: this.getMetrics(),
            recommendations: this.generateRecommendations(),
        };
        for (const agentName of Array.from(this.profiles.keys())) {
            report.agents[agentName] = this.getMetrics(agentName);
        }
        const reportPath = join(this.profileStoragePath, `performance-report-${Date.now()}.json`);
        writeFileSync(reportPath, JSON.stringify(report, null, 2));
        this.emit("reportGenerated", reportPath);
    }
    generateRecommendations() {
        const recommendations = [];
        const systemMetrics = this.getMetrics();
        if (systemMetrics.averageDuration > 5000) {
            recommendations.push("Consider optimizing slow operations - average duration exceeds 5 seconds");
        }
        if (systemMetrics.failedOperations > systemMetrics.totalOperations * 0.1) {
            recommendations.push("High failure rate detected - investigate error patterns");
        }
        if (systemMetrics.memoryDelta > 10 * 1024 * 1024) {
            recommendations.push("Memory usage increasing significantly - check for leaks");
        }
        for (const [agentName, metrics] of Object.entries(this.getMetrics())) {
            if (metrics.failedOperations > metrics.totalOperations * 0.2) {
                recommendations.push(`Agent ${agentName} has high failure rate - review implementation`);
            }
        }
        return recommendations;
    }
    cleanupOldProfiles() {
        const cutoffTime = Date.now() - 7 * 24 * 60 * 60 * 1000;
        for (const [agentName, profiles] of Array.from(this.profiles.entries())) {
            const recentProfiles = profiles.filter((p) => p.startTime > cutoffTime);
            if (recentProfiles.length !== profiles.length) {
                this.profiles.set(agentName, recentProfiles);
            }
        }
    }
    enableProfiling() {
        this.profilingEnabled = true;
    }
    disableProfiling() {
        this.profilingEnabled = false;
    }
    clearProfiles() {
        this.profiles.clear();
        this.activeProfiles.clear();
    }
    exportProfiles() {
        const exportData = {};
        for (const [agentName, profiles] of Array.from(this.profiles.entries())) {
            exportData[agentName] = [...profiles];
        }
        return exportData;
    }
}
export const advancedProfiler = new AdvancedProfiler();
//# sourceMappingURL=advanced-profiler.js.map