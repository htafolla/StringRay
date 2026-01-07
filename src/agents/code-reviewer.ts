import { StrRayBaseAgent } from './base-agent';

export class StrRayCodeReviewer extends StrRayBaseAgent {
  constructor() {
    super('code-reviewer', ['review', 'quality', 'feedback']);
  }

  async execute(task: any): Promise<any> {
    return {
      success: true,
      result: `Reviewed: ${task.description || 'task'}`,
      agent: this.name
    };
  }
}
