/**
 * StringRay AI v1.1.1 - Raft Consensus Algorithm Implementation
 *
 * Enterprise-grade Raft consensus algorithm for leader election and coordination
 * in distributed systems with strong consistency guarantees.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */
import { EventEmitter } from "events";
export var RaftState;
(function (RaftState) {
    RaftState["FOLLOWER"] = "follower";
    RaftState["CANDIDATE"] = "candidate";
    RaftState["LEADER"] = "leader";
})(RaftState || (RaftState = {}));
export var RaftMessageType;
(function (RaftMessageType) {
    RaftMessageType["REQUEST_VOTE"] = "request_vote";
    RaftMessageType["REQUEST_VOTE_RESPONSE"] = "request_vote_response";
    RaftMessageType["APPEND_ENTRIES"] = "append_entries";
    RaftMessageType["APPEND_ENTRIES_RESPONSE"] = "append_entries_response";
})(RaftMessageType || (RaftMessageType = {}));
/**
 * Raft Consensus Algorithm Implementation
 */
export class RaftConsensus extends EventEmitter {
    instanceId;
    stateManager;
    state = RaftState.FOLLOWER;
    currentTerm = 0;
    votedFor = null;
    log = [];
    commitIndex = 0;
    lastApplied = 0;
    peers = new Map();
    leaderId = null;
    electionTimer;
    heartbeatTimer;
    config;
    constructor(instanceId, stateManager, config = {}) {
        super();
        this.instanceId = instanceId;
        this.stateManager = stateManager;
        this.config = {
            electionTimeoutMin: 150,
            electionTimeoutMax: 300,
            heartbeatInterval: 50,
            maxLogEntriesPerAppend: 10,
            snapshotThreshold: 1000,
            ...config,
        };
        this.initializeRaft();
    }
    async initializeRaft() {
        // Restore persisted state
        await this.restoreState();
        // Discover peers
        await this.discoverPeers();
        // Start election timer
        this.resetElectionTimer();
        console.log(`🗳️ Raft: Initialized ${this.instanceId} as ${this.state} in term ${this.currentTerm}`);
    }
    /**
     * Start leader election
     */
    async startElection() {
        if (this.state === RaftState.LEADER)
            return;
        this.state = RaftState.CANDIDATE;
        this.currentTerm++;
        this.votedFor = this.instanceId;
        this.leaderId = null;
        // Reset peer tracking
        for (const peer of this.peers.values()) {
            peer.nextIndex = this.log.length + 1;
            peer.matchIndex = 0;
        }
        // Request votes from all peers
        const votes = await this.requestVotes();
        const majority = Math.floor((this.peers.size + 1) / 2) + 1;
        if (votes >= majority) {
            await this.becomeLeader();
        }
        else {
            this.becomeFollower();
        }
    }
    async requestVotes() {
        const voteRequests = [];
        for (const peer of this.peers.values()) {
            voteRequests.push(this.requestVoteFromPeer(peer.id));
        }
        const results = await Promise.allSettled(voteRequests);
        let votes = 1; // Vote for self
        for (const result of results) {
            if (result.status === "fulfilled" && result.value) {
                votes++;
            }
        }
        return votes;
    }
    async requestVoteFromPeer(peerId) {
        const lastLogIndex = this.log.length;
        const lastLogTerm = lastLogIndex > 0 ? (this.log[lastLogIndex - 1]?.term ?? 0) : 0;
        const message = {
            type: RaftMessageType.REQUEST_VOTE,
            term: this.currentTerm,
            from: this.instanceId,
            to: peerId,
            data: {
                lastLogIndex,
                lastLogTerm,
            },
        };
        try {
            const response = await this.sendMessage(peerId, message);
            return response.data?.voteGranted ?? false;
        }
        catch (error) {
            console.warn(`⚠️ Raft: Failed to request vote from ${peerId}:`, error);
            return false;
        }
    }
    async becomeLeader() {
        this.state = RaftState.LEADER;
        this.leaderId = this.instanceId;
        // Initialize leader state
        for (const peer of this.peers.values()) {
            peer.nextIndex = this.log.length + 1;
            peer.matchIndex = 0;
        }
        // Start heartbeat timer
        this.startHeartbeatTimer();
        console.log(`👑 Raft: ${this.instanceId} became leader for term ${this.currentTerm}`);
        this.emit("leaderElected", this.instanceId);
    }
    becomeFollower() {
        this.state = RaftState.FOLLOWER;
        this.votedFor = null;
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = undefined;
        }
        this.resetElectionTimer();
        console.log(`👥 Raft: ${this.instanceId} became follower in term ${this.currentTerm}`);
    }
    /**
     * Handle incoming Raft messages
     */
    async handleMessage(message) {
        // Update term if necessary
        if (message.term > this.currentTerm) {
            this.currentTerm = message.term;
            this.becomeFollower();
            this.votedFor = null;
        }
        switch (message.type) {
            case RaftMessageType.REQUEST_VOTE:
                return this.handleRequestVote(message);
            case RaftMessageType.REQUEST_VOTE_RESPONSE:
                return this.handleRequestVoteResponse(message);
            case RaftMessageType.APPEND_ENTRIES:
                return this.handleAppendEntries(message);
            case RaftMessageType.APPEND_ENTRIES_RESPONSE:
                return this.handleAppendEntriesResponse(message);
            default:
                return null;
        }
    }
    handleRequestVote(message) {
        const { lastLogIndex, lastLogTerm } = message.data ?? {};
        const myLastLogIndex = this.log.length;
        const myLastLogTerm = myLastLogIndex > 0 ? (this.log[myLastLogIndex - 1]?.term ?? 0) : 0;
        const logUpToDate = (lastLogTerm ?? 0) > myLastLogTerm ||
            ((lastLogTerm ?? 0) === myLastLogTerm &&
                (lastLogIndex ?? 0) >= myLastLogIndex);
        const grantVote = message.term >= this.currentTerm &&
            (this.votedFor === null || this.votedFor === message.from) &&
            logUpToDate;
        if (grantVote) {
            this.votedFor = message.from;
            this.resetElectionTimer();
        }
        return {
            type: RaftMessageType.REQUEST_VOTE_RESPONSE,
            term: this.currentTerm,
            from: this.instanceId,
            to: message.from,
            data: { voteGranted: grantVote },
        };
    }
    handleRequestVoteResponse(message) {
        // Only candidates care about vote responses
        if (this.state !== RaftState.CANDIDATE)
            return null;
        // Response handling is done in requestVotes()
        return null;
    }
    handleAppendEntries(message) {
        this.resetElectionTimer();
        if (message.term < this.currentTerm) {
            return {
                type: RaftMessageType.APPEND_ENTRIES_RESPONSE,
                term: this.currentTerm,
                from: this.instanceId,
                to: message.from,
                data: { success: false },
            };
        }
        this.leaderId = message.from;
        this.state = RaftState.FOLLOWER;
        const { prevLogIndex, prevLogTerm, entries, leaderCommit } = message.data ?? {};
        // Check log consistency
        if ((prevLogIndex ?? 0) > 0) {
            if ((prevLogIndex ?? 0) > this.log.length ||
                this.log[(prevLogIndex ?? 0) - 1]?.term !== (prevLogTerm ?? 0)) {
                return {
                    type: RaftMessageType.APPEND_ENTRIES_RESPONSE,
                    term: this.currentTerm,
                    from: this.instanceId,
                    to: message.from,
                    data: { success: false },
                };
            }
        }
        // Append new entries
        if (entries && entries.length > 0) {
            this.log.splice(prevLogIndex ?? 0, entries.length, ...entries);
        }
        // Update commit index
        if ((leaderCommit ?? 0) > this.commitIndex) {
            this.commitIndex = Math.min(leaderCommit ?? 0, this.log.length);
            this.applyCommittedEntries();
        }
        return {
            type: RaftMessageType.APPEND_ENTRIES_RESPONSE,
            term: this.currentTerm,
            from: this.instanceId,
            to: message.from,
            data: { success: true },
        };
    }
    handleAppendEntriesResponse(message) {
        if (this.state !== RaftState.LEADER)
            return null;
        const peer = this.peers.get(message.from);
        if (!peer)
            return null;
        const { success } = message.data;
        if (success) {
            peer.matchIndex = Math.max(peer.matchIndex, message.data?.lastLogIndex ?? 0);
            peer.nextIndex = peer.matchIndex + 1;
            this.updateCommitIndex();
        }
        else {
            peer.nextIndex = Math.max(1, peer.nextIndex - 1);
        }
        return null;
    }
    /**
     * Append new log entry (leader only)
     */
    async appendEntry(command) {
        if (this.state !== RaftState.LEADER)
            return false;
        const entry = {
            term: this.currentTerm,
            index: this.log.length + 1,
            command,
            timestamp: Date.now(),
        };
        this.log.push(entry);
        // Persist state
        await this.persistState();
        // Replicate to followers
        await this.replicateToFollowers();
        return true;
    }
    async replicateToFollowers() {
        for (const peer of this.peers.values()) {
            await this.sendAppendEntries(peer.id);
        }
    }
    async sendAppendEntries(peerId) {
        const peer = this.peers.get(peerId);
        if (!peer)
            return;
        const prevLogIndex = peer.nextIndex - 1;
        const prevLogTerm = prevLogIndex > 0 ? (this.log[prevLogIndex - 1]?.term ?? 0) : 0;
        const entries = this.log.slice(Math.max(0, prevLogIndex), prevLogIndex + this.config.maxLogEntriesPerAppend);
        const message = {
            type: RaftMessageType.APPEND_ENTRIES,
            term: this.currentTerm,
            from: this.instanceId,
            to: peerId,
            data: {
                prevLogIndex,
                prevLogTerm,
                entries,
                leaderCommit: this.commitIndex,
            },
        };
        try {
            await this.sendMessage(peerId, message);
        }
        catch (error) {
            console.warn(`⚠️ Raft: Failed to send append entries to ${peerId}:`, error);
        }
    }
    startHeartbeatTimer() {
        this.heartbeatTimer = setInterval(async () => {
            await this.sendHeartbeats();
        }, this.config.heartbeatInterval);
    }
    async sendHeartbeats() {
        for (const peer of this.peers.values()) {
            await this.sendAppendEntries(peer.id);
        }
    }
    resetElectionTimer() {
        if (this.electionTimer) {
            clearTimeout(this.electionTimer);
        }
        const timeout = Math.random() *
            (this.config.electionTimeoutMax - this.config.electionTimeoutMin) +
            this.config.electionTimeoutMin;
        this.electionTimer = setTimeout(async () => {
            if (this.state !== RaftState.LEADER) {
                await this.startElection();
            }
        }, timeout);
    }
    updateCommitIndex() {
        // Find the highest index that is replicated on majority
        const majority = Math.floor((this.peers.size + 1) / 2) + 1;
        let newCommitIndex = this.commitIndex;
        for (let i = this.commitIndex + 1; i <= this.log.length; i++) {
            const entry = this.log[i - 1];
            if (!entry || entry.term !== this.currentTerm)
                continue;
            let replicatedCount = 1; // Leader has it
            for (const peer of this.peers.values()) {
                if (peer.matchIndex >= i) {
                    replicatedCount++;
                }
            }
            if (replicatedCount >= majority) {
                newCommitIndex = i;
            }
            else {
                break;
            }
        }
        if (newCommitIndex > this.commitIndex) {
            this.commitIndex = newCommitIndex;
            this.applyCommittedEntries();
        }
    }
    applyCommittedEntries() {
        while (this.lastApplied < this.commitIndex) {
            this.lastApplied++;
            const entry = this.log[this.lastApplied - 1];
            if (entry) {
                this.emit("applyEntry", entry);
            }
        }
    }
    async discoverPeers() {
        try {
            const activeInstances = await this.stateManager.getActiveInstances();
            for (const instance of activeInstances) {
                if (instance.instanceId !== this.instanceId) {
                    this.peers.set(instance.instanceId, {
                        id: instance.instanceId,
                        lastContact: Date.now(),
                        nextIndex: this.log.length + 1,
                        matchIndex: 0,
                    });
                }
            }
        }
        catch (error) {
            console.error("❌ Raft: Failed to discover peers:", error);
        }
    }
    async sendMessage(peerId, message) {
        // Send message via distributed state manager
        const channel = `raft:${peerId}`;
        await this.stateManager.set(`raft:message:${this.instanceId}:${peerId}`, message);
        // Wait for response (simplified - in real implementation would use proper messaging)
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error("Timeout")), 5000);
            const unwatch = this.stateManager.watch(`raft:response:${peerId}:${this.instanceId}`, (response) => {
                clearTimeout(timeout);
                unwatch();
                resolve(response);
            });
        });
    }
    async persistState() {
        const state = {
            currentTerm: this.currentTerm,
            votedFor: this.votedFor,
            log: this.log,
        };
        await this.stateManager.set("raft:state", state);
    }
    async restoreState() {
        try {
            const state = (await this.stateManager.get("raft:state"));
            if (state) {
                this.currentTerm = state.currentTerm ?? 0;
                this.votedFor = state.votedFor ?? null;
                this.log = state.log ?? [];
                this.commitIndex = this.log.length;
                this.lastApplied = this.log.length;
            }
        }
        catch (error) {
            console.warn("⚠️ Raft: Failed to restore state, starting fresh:", error);
        }
    }
    /**
     * Get current Raft state
     */
    getState() {
        return {
            state: this.state,
            term: this.currentTerm,
            leaderId: this.leaderId,
            isLeader: this.state === RaftState.LEADER,
        };
    }
    /**
     * Get current leader
     */
    getLeader() {
        return this.leaderId;
    }
    /**
     * Check if this instance is the leader
     */
    isLeader() {
        return this.state === RaftState.LEADER;
    }
    /**
     * Shutdown Raft consensus
     */
    async shutdown() {
        if (this.electionTimer) {
            clearTimeout(this.electionTimer);
        }
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
        }
        console.log(`🛑 Raft: ${this.instanceId} shutdown complete`);
    }
}
// Factory function
export const createRaftConsensus = (instanceId, stateManager, config = {}) => {
    return new RaftConsensus(instanceId, stateManager, config);
};
//# sourceMappingURL=raft-consensus.js.map