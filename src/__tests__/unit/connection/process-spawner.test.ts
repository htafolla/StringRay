import { describe, it, expect, vi, beforeEach } from 'vitest';
import { spawn, ChildProcess } from 'child_process';
import { ProcessSpawner } from '../../../mcps/connection/process-spawner.js';
import type { IServerConfig } from '../../../mcps/types/index.js';

// Mock child_process
vi.mock('child_process', () => ({
  spawn: vi.fn(),
}));

describe('ProcessSpawner', () => {
  let spawner: ProcessSpawner;
  let mockSpawn: ReturnType<typeof vi.fn>;

  const mockConfig: IServerConfig = {
    serverName: 'test-server',
    command: 'node',
    args: ['server.js'],
    timeout: 30000,
    env: { TEST_VAR: 'value' },
    basePath: '/test/path',
  };

  beforeEach(() => {
    spawner = new ProcessSpawner();
    mockSpawn = vi.mocked(spawn);
    mockSpawn.mockClear();
  });

  describe('spawn', () => {
    it('should spawn a process with correct configuration', () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stdin: { write: vi.fn() },
        stderr: { on: vi.fn() },
        kill: vi.fn(),
      } as unknown as ChildProcess;

      mockSpawn.mockReturnValue(mockProcess);

      const result = spawner.spawn(mockConfig);

      expect(mockSpawn).toHaveBeenCalledWith(
        'node',
        ['server.js'],
        {
          env: expect.objectContaining({
            ...process.env,
            TEST_VAR: 'value',
          }),
          cwd: '/test/path',
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      expect(result.process).toBe(mockProcess);
      expect(result.stdout).toBe(mockProcess.stdout);
      expect(result.stdin).toBe(mockProcess.stdin);
      expect(result.stderr).toBe(mockProcess.stderr);
    });

    it('should spawn without optional env and basePath', () => {
      const configWithoutOptional: IServerConfig = {
        serverName: 'test-server',
        command: 'python',
        args: ['script.py'],
        timeout: 30000,
      };

      const mockProcess = {
        stdout: { on: vi.fn() },
        stdin: { write: vi.fn() },
        stderr: { on: vi.fn() },
        kill: vi.fn(),
      } as unknown as ChildProcess;

      mockSpawn.mockReturnValue(mockProcess);

      const result = spawner.spawn(configWithoutOptional);

      expect(mockSpawn).toHaveBeenCalledWith(
        'python',
        ['script.py'],
        {
          env: expect.any(Object),
          cwd: undefined,
          stdio: ['pipe', 'pipe', 'pipe'],
        }
      );

      expect(result.process).toBe(mockProcess);
    });

    it('should merge environment variables correctly', () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stdin: { write: vi.fn() },
        stderr: { on: vi.fn() },
        kill: vi.fn(),
      } as unknown as ChildProcess;

      mockSpawn.mockReturnValue(mockProcess);

      const configWithEnv: IServerConfig = {
        serverName: 'test-server',
        command: 'node',
        args: ['app.js'],
        timeout: 30000,
        env: {
          CUSTOM_VAR: 'custom_value',
          PATH: '/custom/path',
        },
      };

      spawner.spawn(configWithEnv);

      const callArgs = mockSpawn.mock.calls[0][2];
      expect(callArgs.env).toMatchObject({
        CUSTOM_VAR: 'custom_value',
        PATH: '/custom/path',
      });
    });

    it('should handle empty args array', () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stdin: { write: vi.fn() },
        stderr: { on: vi.fn() },
        kill: vi.fn(),
      } as unknown as ChildProcess;

      mockSpawn.mockReturnValue(mockProcess);

      const configNoArgs: IServerConfig = {
        serverName: 'test-server',
        command: 'echo',
        args: [],
        timeout: 30000,
      };

      spawner.spawn(configNoArgs);

      expect(mockSpawn).toHaveBeenCalledWith(
        'echo',
        [],
        expect.any(Object)
      );
    });

    it('should handle complex command with multiple args', () => {
      const mockProcess = {
        stdout: { on: vi.fn() },
        stdin: { write: vi.fn() },
        stderr: { on: vi.fn() },
        kill: vi.fn(),
      } as unknown as ChildProcess;

      mockSpawn.mockReturnValue(mockProcess);

      const configComplex: IServerConfig = {
        serverName: 'test-server',
        command: 'npx',
        args: ['tsx', '--watch', 'server.ts', '--port', '8080'],
        timeout: 30000,
        env: { NODE_ENV: 'development' },
        basePath: '/project',
      };

      spawner.spawn(configComplex);

      expect(mockSpawn).toHaveBeenCalledWith(
        'npx',
        ['tsx', '--watch', 'server.ts', '--port', '8080'],
        expect.objectContaining({
          cwd: '/project',
        })
      );
    });
  });
});
