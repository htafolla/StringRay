/**
 * StrRay Angular Integration v1.0.0
 *
 * Angular-specific integration providing services, directives, and utilities
 * for seamless StrRay Framework integration in Angular applications.
 *
 * @version 1.0.0
 * @since 2026-01-08
 */

import { Injectable, Injector, NgModule, Component, Directive, Input, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, of, throwError } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { StrRayIntegration, StrRayIntegrationConfig, FrameworkAdapter } from '../core';

// Angular Framework Adapter
class AngularFrameworkAdapter implements FrameworkAdapter {
  name = 'angular';
  version = '15+';

  mount(container: HTMLElement, component: any, props?: Record<string, any>): void {
    // Angular components are handled by Angular's component factory
    // This would typically be done through Angular's ViewContainerRef
  }

  unmount(container: HTMLElement): void {
    // Angular handles component destruction automatically
  }

  createElement(type: string, props?: Record<string, any>, ...children: any[]): any {
    // Angular template syntax is declarative
    return { type, props, children };
  }

  render(element: any, container: HTMLElement): void {
    // Angular rendering is handled by the framework
  }
}

// StrRay Angular Service
@Injectable({
  providedIn: 'root'
})
export class StrRayService {
  private integration: StrRayIntegration | null = null;
  private integrationSubject = new BehaviorSubject<StrRayIntegration | null>(null);
  private errorSubject = new BehaviorSubject<Error | null>(null);

  public integration$ = this.integrationSubject.asObservable();
  public error$ = this.errorSubject.asObservable();

  constructor(
    private http: HttpClient,
    private injector: Injector
  ) {}

  async initialize(config: StrRayIntegrationConfig): Promise<void> {
    try {
      this.integration = new StrRayIntegration({
        ...config,
        framework: 'angular'
      });

      // Override framework adapter with Angular-specific implementation
      (this.integration as any).context.framework = new AngularFrameworkAdapter();

      await this.integration.initialize();
      this.integrationSubject.next(this.integration);
    } catch (error) {
      this.errorSubject.next(error as Error);
      throw error;
    }
  }

  getIntegration(): StrRayIntegration | null {
    return this.integration;
  }

  async executeAgent(agentName: string, task: any): Promise<any> {
    if (!this.integration) {
      throw new Error('StrRay integration not initialized');
    }
    return await this.integration.executeAgent(agentName, task);
  }

  async validateCode(code: string): Promise<any> {
    if (!this.integration) {
      throw new Error('StrRay integration not initialized');
    }
    return await this.integration.validateCode(code, 'angular');
  }

  getCodexStats(): Observable<any> {
    if (!this.integration) {
      return throwError(() => new Error('StrRay integration not initialized'));
    }

    return of(null).pipe(
      switchMap(async () => {
        const statsHook = this.integration!.getHook('codex:stats');
        return statsHook ? await statsHook() : null;
      })
    );
  }

  injectCodex(code: string): Observable<any> {
    if (!this.integration) {
      return throwError(() => new Error('StrRay integration not initialized'));
    }

    return of(null).pipe(
      switchMap(async () => {
        const injectHook = this.integration!.getHook('codex:inject');
        return injectHook ? await injectHook(code) : null;
      })
    );
  }

  startMonitoring(): Observable<any> {
    if (!this.integration) {
      return throwError(() => new Error('StrRay integration not initialized'));
    }

    return of(null).pipe(
      switchMap(async () => {
        const monitorHook = this.integration!.getHook('monitor:performance');
        return monitorHook ? monitorHook() : null;
      })
    );
  }

  trackError(error: Error): Observable<any> {
    if (!this.integration) {
      return throwError(() => new Error('StrRay integration not initialized'));
    }

    return of(null).pipe(
      switchMap(async () => {
        const errorHook = this.integration!.getHook('monitor:errors');
        return errorHook ? errorHook(error) : null;
      })
    );
  }

  generatePrediction(data: any): Observable<any> {
    if (!this.integration) {
      return throwError(() => new Error('StrRay integration not initialized'));
    }

    return of(null).pipe(
      switchMap(async () => {
        const predictHook = this.integration!.getHook('analytics:predict');
        return predictHook ? await predictHook(data) : null;
      })
    );
  }

  optimizeAgentAssignment(task: any): Observable<any> {
    if (!this.integration) {
      return throwError(() => new Error('StrRay integration not initialized'));
    }

    return of(null).pipe(
      switchMap(async () => {
        const optimizeHook = this.integration!.getHook('analytics:optimize');
        return optimizeHook ? await optimizeHook(task) : null;
      })
    );
  }
}

// StrRay Angular Component
@Component({
  selector: 'strray-agent-response',
  template: `
    <div class="strray-response" *ngIf="result || loading || error">
      <div *ngIf="loading" class="strray-loading">
        Loading StrRay response...
      </div>
      <div *ngIf="error" class="strray-error">
        Error: {{ error.message }}
      </div>
      <pre *ngIf="result" class="strray-result">{{ result | json }}</pre>
    </div>
  `,
  styles: [`
    .strray-response { padding: 1rem; border: 1px solid #ccc; border-radius: 4px; }
    .strray-loading { color: #666; }
    .strray-error { color: #d32f2f; }
    .strray-result { background: #f5f5f5; padding: 0.5rem; border-radius: 4px; overflow-x: auto; }
  `]
})
export class StrRayAgentResponseComponent {
  @Input() agentName!: string;
  @Input() task: any;
  @Output() resultChange = new EventEmitter<any>();

  result: any = null;
  loading = false;
  error: Error | null = null;

  constructor(private strRayService: StrRayService) {}

  async ngOnInit() {
    if (this.task && this.agentName) {
      await this.executeTask();
    }
  }

  async ngOnChanges(changes: any) {
    if (changes.task && this.agentName) {
      await this.executeTask();
    }
  }

  private async executeTask() {
    this.loading = true;
    this.error = null;
    try {
      this.result = await this.strRayService.executeAgent(this.agentName, this.task);
      this.resultChange.emit(this.result);
    } catch (err) {
      this.error = err as Error;
    } finally {
      this.loading = false;
    }
  }
}

// StrRay Angular Directive
@Directive({
  selector: '[strrayValidate]'
})
export class StrRayValidateDirective {
  @Input('strrayValidate') code: string = '';
  @Output() validationResult = new EventEmitter<any>();

  constructor(private strRayService: StrRayService) {}

  async ngOnChanges(changes: any) {
    if (changes.code && this.code) {
      try {
        const result = await this.strRayService.validateCode(this.code);
        this.validationResult.emit(result);
      } catch (error) {
        this.validationResult.emit({ error });
      }
    }
  }
}

// StrRay Angular Module
@NgModule({
  declarations: [
    StrRayAgentResponseComponent,
    StrRayValidateDirective
  ],
  exports: [
    StrRayAgentResponseComponent,
    StrRayValidateDirective
  ],
  providers: [
    StrRayService
  ]
})
export class StrRayModule {
  static forRoot(config: StrRayIntegrationConfig): any {
    return {
      ngModule: StrRayModule,
      providers: [
        {
          provide: 'STRRAY_CONFIG',
          useValue: config
        },
        {
          provide: StrRayService,
          useFactory: (http: HttpClient, injector: Injector, config: StrRayIntegrationConfig) => {
            const service = new StrRayService(http, injector);
            service.initialize(config);
            return service;
          },
          deps: [HttpClient, Injector, 'STRRAY_CONFIG']
        }
      ]
    };
  }
}

// Export types
export type { StrRayIntegrationConfig, FrameworkAdapter };