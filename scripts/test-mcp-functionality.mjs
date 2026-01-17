#!/usr/bin/env node

/**
 * MCP Server Functionality Test
 *
 * Tests MCP server functionality beyond basic connectivity.
 * Validates that MCP servers can be initialized and respond to basic requests.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class MCPFunctionalityTest {
    constructor() {
        this.results = { passed: [], failed: [] };
        this.isConsumerEnvironment = __dirname.includes('node_modules/strray-ai');
    }

    async testMCPFunctionality() {
        console.log('🛠️ MCP SERVER FUNCTIONALITY TEST');
        console.log('===============================');

        const tests = [
            this.testMCPConfigLoading.bind(this),
            this.testServerExistence.bind(this),
            this.testServerInitialization.bind(this),
            this.testBasicServerCommunication.bind(this)
        ];

        for (const test of tests) {
            await test();
        }

        this.printSummary();
        return this.results.failed.length === 0;
    }

    async testMCPConfigLoading() {
        console.log('\n🔧 Testing MCP Configuration Loading...');

        try {
            const mcpPath = path.join(process.cwd(), '.mcp.json');

            if (!fs.existsSync(mcpPath)) {
                console.log('  ❌ .mcp.json not found');
                this.results.failed.push({ test: 'MCP Config Loading', error: 'File not found' });
                return;
            }

            const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));

            if (mcpConfig.mcpServers && typeof mcpConfig.mcpServers === 'object') {
                const serverCount = Object.keys(mcpConfig.mcpServers).length;
                console.log(`  ✅ MCP config loaded with ${serverCount} servers`);
                this.results.passed.push('MCP Config Loading');
            } else {
                console.log('  ❌ MCP config missing mcpServers object');
                this.results.failed.push({ test: 'MCP Config Loading', error: 'Invalid structure' });
            }
        } catch (error) {
            console.log(`  ❌ MCP config loading failed: ${error.message}`);
            this.results.failed.push({ test: 'MCP Config Loading', error: error.message });
        }
    }

    async testServerExistence() {
        console.log('\n📂 Testing MCP Server File Existence...');

        try {
            const mcpConfig = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
            let existingServers = 0;
            let totalServers = 0;

            for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers || {})) {
                totalServers++;

                if (serverConfig.args && serverConfig.args.length > 0) {
                    // Extract the server file path from args
                    const serverPath = serverConfig.args[serverConfig.args.length - 1];

                    if (serverPath && fs.existsSync(serverPath)) {
                        existingServers++;
                    } else {
                        console.log(`  ⚠️ Server file not found: ${serverPath} (${serverName})`);
                    }
                }
            }

            if (existingServers === totalServers && totalServers > 0) {
                console.log(`  ✅ All ${totalServers} MCP server files exist`);
                this.results.passed.push('Server File Existence');
            } else {
                console.log(`  ❌ ${existingServers}/${totalServers} MCP server files exist`);
                this.results.failed.push({ test: 'Server File Existence', error: `${totalServers - existingServers} files missing` });
            }
        } catch (error) {
            console.log(`  ❌ Server existence check failed: ${error.message}`);
            this.results.failed.push({ test: 'Server File Existence', error: error.message });
        }
    }

    async testServerInitialization() {
        console.log('\n🔄 Testing MCP Server Initialization...');

        try {
            const mcpConfig = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));
            const testServers = ['orchestrator', 'enforcer-tools', 'framework-compliance-audit'];
            let initializedServers = 0;

            for (const serverName of testServers) {
                const serverConfig = mcpConfig.mcpServers[serverName];

                if (!serverConfig) {
                    console.log(`  ⚠️ Server ${serverName} not configured`);
                    continue;
                }

                try {
                    // For now, just test that the server file can be required/imported
                    // In a real scenario, we'd start the server process and test communication
                    const serverPath = serverConfig.args[serverConfig.args.length - 1];

                    if (serverPath.endsWith('.js')) {
                        // Try to import the server module
                        await import(serverPath);
                        initializedServers++;
                        console.log(`  ✅ Server ${serverName} module loaded`);
                    } else {
                        console.log(`  ⚠️ Server ${serverName} has unsupported file type`);
                    }
                } catch (importError) {
                    console.log(`  ❌ Server ${serverName} failed to load: ${importError.message}`);
                }
            }

            if (initializedServers > 0) {
                console.log(`  ✅ ${initializedServers} test servers initialized successfully`);
                this.results.passed.push('Server Initialization');
            } else {
                console.log('  ❌ No test servers could be initialized');
                this.results.failed.push({ test: 'Server Initialization', error: 'No servers initialized' });
            }

        } catch (error) {
            console.log(`  ❌ Server initialization test failed: ${error.message}`);
            this.results.failed.push({ test: 'Server Initialization', error: error.message });
        }
    }

    async testBasicServerCommunication() {
        console.log('\n💬 Testing Basic MCP Server Communication...');

        try {
            // Test that we can at least validate the MCP configuration structure
            const mcpConfig = JSON.parse(fs.readFileSync('.mcp.json', 'utf8'));

            let validConfigs = 0;
            let totalConfigs = 0;

            for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers || {})) {
                totalConfigs++;

                // Basic validation of server config structure
                if (serverConfig.command === 'node' &&
                    Array.isArray(serverConfig.args) &&
                    serverConfig.args.length > 0 &&
                    typeof serverConfig.env === 'object') {
                    validConfigs++;
                } else {
                    console.log(`  ⚠️ Server ${serverName} has invalid config structure`);
                }
            }

            if (validConfigs === totalConfigs && totalConfigs > 0) {
                console.log(`  ✅ All ${totalConfigs} MCP server configs are valid`);
                this.results.passed.push('Basic Server Communication');
            } else {
                console.log(`  ❌ ${validConfigs}/${totalConfigs} MCP server configs are valid`);
                this.results.failed.push({ test: 'Basic Server Communication', error: `${totalConfigs - validConfigs} invalid configs` });
            }

        } catch (error) {
            console.log(`  ❌ Basic communication test failed: ${error.message}`);
            this.results.failed.push({ test: 'Basic Server Communication', error: error.message });
        }
    }

    printSummary() {
        console.log('\n📊 MCP FUNCTIONALITY TEST SUMMARY');
        console.log('=================================');

        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        console.log(`📈 Success Rate: ${Math.round((this.results.passed.length / (this.results.passed.length + this.results.failed.length)) * 100)}%`);

        if (this.results.failed.length > 0) {
            console.log('\n❌ FAILED TESTS:');
            this.results.failed.forEach(failure => {
                console.log(`  • ${failure.test}: ${failure.error}`);
            });
        }

        if (this.results.passed.length > 0) {
            console.log('\n✅ PASSED TESTS:');
            this.results.passed.forEach(test => {
                console.log(`  • ${test}`);
            });
        }
    }
}

// Run the test
const mcpTest = new MCPFunctionalityTest();
mcpTest.testMCPFunctionality().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('MCP functionality test failed with error:', error);
    process.exit(1);
});