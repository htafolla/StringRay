#!/usr/bin/env node

/**
 * Configuration Validation Script
 *
 * Tests that all configuration files created by postinstall have correct
 * paths, settings, and are properly formatted for consumer environments.
 */

import fs from 'fs';
import path from 'path';

class ConfigurationValidator {
    constructor() {
        this.results = { passed: [], failed: [] };
    }

    async validateConfigurations() {
        console.log('⚙️ CONFIGURATION VALIDATION');
        console.log('===========================');

        const validations = [
            this.validateMCPConfigPaths.bind(this),
            this.validateOpencodeConfigPaths.bind(this),
            this.validateOhMyOpencodePluginPaths.bind(this),
            this.validateConfigurationIntegrity.bind(this)
        ];

        for (const validation of validations) {
            await validation();
        }

        this.printSummary();
        return this.results.failed.length === 0;
    }

    async validateMCPConfigPaths() {
        console.log('\n🔧 Validating MCP Configuration Paths...');

        try {
            const mcpPath = path.join(process.cwd(), '.mcp.json');

            if (!fs.existsSync(mcpPath)) {
                console.log('  ❌ .mcp.json not found');
                this.results.failed.push({ test: 'MCP Config Paths', error: 'File does not exist' });
                return;
            }

            const mcpConfig = JSON.parse(fs.readFileSync(mcpPath, 'utf8'));
            let validPaths = 0;
            let totalPaths = 0;

            for (const [serverName, serverConfig] of Object.entries(mcpConfig.mcpServers || {})) {
                if (serverConfig.args && Array.isArray(serverConfig.args)) {
                    for (const arg of serverConfig.args) {
                        if (typeof arg === 'string') {
                            totalPaths++;

                            // Check if path is consumer-relative (contains node_modules/strray-ai)
                            if (arg.includes('node_modules/strray-ai/dist/')) {
                                validPaths++;
                            }
                            // Check if path points to existing file
                            else if (arg.startsWith('node_modules/strray-ai/dist/')) {
                                const fullPath = path.join(process.cwd(), arg);
                                if (fs.existsSync(fullPath)) {
                                    validPaths++;
                                } else {
                                    console.log(`  ⚠️ MCP server ${serverName} path does not exist: ${arg}`);
                                }
                            }
                        }
                    }
                }
            }

            if (validPaths === totalPaths && totalPaths > 0) {
                console.log(`  ✅ All ${totalPaths} MCP server paths are valid consumer paths`);
                this.results.passed.push('MCP Config Paths');
            } else {
                console.log(`  ❌ ${validPaths}/${totalPaths} MCP server paths are valid`);
                this.results.failed.push({ test: 'MCP Config Paths', error: `${totalPaths - validPaths} invalid paths` });
            }

        } catch (error) {
            console.log(`  ❌ MCP config path validation failed: ${error.message}`);
            this.results.failed.push({ test: 'MCP Config Paths', error: error.message });
        }
    }

    async validateOpencodeConfigPaths() {
        console.log('\n📄 Validating OpenCode Configuration Paths...');

        try {
            const opencodePath = path.join(process.cwd(), 'opencode.json');

            if (!fs.existsSync(opencodePath)) {
                console.log('  ❌ opencode.json not found');
                this.results.failed.push({ test: 'OpenCode Config Paths', error: 'File does not exist' });
                return;
            }

            const opencodeConfig = JSON.parse(fs.readFileSync(opencodePath, 'utf8'));
            let issues = [];

            // Check MCP server paths in opencode.json
            if (opencodeConfig.mcpServers) {
                for (const [serverName, serverConfig] of Object.entries(opencodeConfig.mcpServers)) {
                    if (serverConfig.args && Array.isArray(serverConfig.args)) {
                        for (const arg of serverConfig.args) {
                            if (typeof arg === 'string' && arg.includes('dist/')) {
                                // Should be consumer-relative
                                if (!arg.includes('node_modules/strray-ai/')) {
                                    issues.push(`${serverName}: ${arg}`);
                                }
                            }
                        }
                    }
                }
            }

            if (issues.length === 0) {
                console.log('  ✅ All opencode.json paths are consumer-compatible');
                this.results.passed.push('OpenCode Config Paths');
            } else {
                console.log(`  ❌ ${issues.length} opencode.json paths need updating:`);
                issues.forEach(issue => console.log(`    - ${issue}`));
                this.results.failed.push({ test: 'OpenCode Config Paths', error: `${issues.length} paths need updating` });
            }

        } catch (error) {
            console.log(`  ❌ OpenCode config path validation failed: ${error.message}`);
            this.results.failed.push({ test: 'OpenCode Config Paths', error: error.message });
        }
    }

    async validateOhMyOpencodePluginPaths() {
        console.log('\n🔌 Validating oh-my-opencode Plugin Paths...');

        try {
            const ohMyOpencodePath = path.join(process.cwd(), '.opencode', 'oh-my-opencode.json');

            if (!fs.existsSync(ohMyOpencodePath)) {
                console.log('  ❌ .opencode/oh-my-opencode.json not found');
                this.results.failed.push({ test: 'oh-my-opencode Plugin Paths', error: 'File does not exist' });
                return;
            }

            const ohMyOpencodeConfig = JSON.parse(fs.readFileSync(ohMyOpencodePath, 'utf8'));
            let validPlugins = 0;
            let totalPlugins = 0;

            // Check plugin paths
            if (ohMyOpencodeConfig.plugins && Array.isArray(ohMyOpencodeConfig.plugins)) {
                for (const plugin of ohMyOpencodeConfig.plugins) {
                    if (typeof plugin === 'string') {
                        totalPlugins++;
                        if (plugin.includes('../node_modules/strray-ai/') ||
                            plugin.includes('./dist/plugin/plugins/')) {
                            validPlugins++;
                        }
                    } else if (typeof plugin === 'object' && plugin.path) {
                        totalPlugins++;
                        if (plugin.path.includes('../node_modules/strray-ai/') ||
                            plugin.path.includes('./dist/plugin/plugins/')) {
                            validPlugins++;
                        }
                    }
                }
            }

            if (validPlugins === totalPlugins && totalPlugins > 0) {
                console.log(`  ✅ All ${totalPlugins} plugin paths are valid`);
                this.results.passed.push('oh-my-opencode Plugin Paths');
            } else if (totalPlugins === 0) {
                console.log('  ℹ️ No plugins configured');
                this.results.passed.push('oh-my-opencode Plugin Paths');
            } else {
                console.log(`  ❌ ${validPlugins}/${totalPlugins} plugin paths are valid`);
                this.results.failed.push({ test: 'oh-my-opencode Plugin Paths', error: `${totalPlugins - validPlugins} invalid paths` });
            }

        } catch (error) {
            console.log(`  ❌ oh-my-opencode plugin path validation failed: ${error.message}`);
            this.results.failed.push({ test: 'oh-my-opencode Plugin Paths', error: error.message });
        }
    }

    async validateConfigurationIntegrity() {
        console.log('\n🔍 Validating Configuration Integrity...');

        const configs = [
            { path: '.mcp.json', description: 'MCP configuration' },
            { path: 'opencode.json', description: 'OpenCode configuration' },
            { path: '.opencode/oh-my-opencode.json', description: 'oh-my-opencode configuration' },
            { path: '.opencode/package.json', description: 'oh-my-opencode package config' }
        ];

        for (const config of configs) {
            try {
                const configPath = path.join(process.cwd(), config.path);

                if (!fs.existsSync(configPath)) {
                    if (config.path.includes('logs')) continue; // Logs are optional
                    console.log(`  ❌ ${config.description} missing`);
                    this.results.failed.push({ test: `${config.description} Integrity`, error: 'File missing' });
                    continue;
                }

                // Try to parse as JSON
                const content = fs.readFileSync(configPath, 'utf8');
                JSON.parse(content);

                console.log(`  ✅ ${config.description} is valid JSON`);
                this.results.passed.push(`${config.description} Integrity`);

            } catch (error) {
                console.log(`  ❌ ${config.description} validation failed: ${error.message}`);
                this.results.failed.push({ test: `${config.description} Integrity`, error: error.message });
            }
        }
    }

    printSummary() {
        console.log('\n📊 CONFIGURATION VALIDATION SUMMARY');
        console.log('=====================================');

        console.log(`✅ Passed: ${this.results.passed.length}`);
        console.log(`❌ Failed: ${this.results.failed.length}`);
        console.log(`📈 Success Rate: ${Math.round((this.results.passed.length / (this.results.passed.length + this.results.failed.length)) * 100)}%`);

        if (this.results.failed.length > 0) {
            console.log('\n❌ FAILED VALIDATIONS:');
            this.results.failed.forEach(failure => {
                console.log(`  • ${failure.test}: ${failure.error}`);
            });
        }

        if (this.results.passed.length > 0) {
            console.log('\n✅ PASSED VALIDATIONS:');
            this.results.passed.forEach(test => {
                console.log(`  • ${test}`);
            });
        }
    }
}

// Run validation
const validator = new ConfigurationValidator();
validator.validateConfigurations().then(success => {
    process.exit(success ? 0 : 1);
}).catch(error => {
    console.error('Configuration validation failed with error:', error);
    process.exit(1);
});