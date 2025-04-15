import { SupabaseClient } from '@supabase/supabase-js';
import { ServiceConfig } from './types';
import { BaseService } from './BaseService';

/**
 * Service Manager that coordinates and provides access to all service instances
 */
class ServiceManager {
  private static instance: ServiceManager;
  private services: Map<string, BaseService> = new Map();
  private client: SupabaseClient | null = null;
  private config: ServiceConfig;

  private constructor(config: ServiceConfig = {}) {
    this.config = {
      debug: false,
      timeoutMs: 30000,
      maxRetries: 3,
      retryDelayMs: 500,
      ...config
    };
  }

  /**
   * Get the singleton instance of ServiceManager
   */
  public static getInstance(config?: ServiceConfig): ServiceManager {
    if (!ServiceManager.instance) {
      ServiceManager.instance = new ServiceManager(config);
    }
    return ServiceManager.instance;
  }

  /**
   * Set the Supabase client to be used by all services
   */
  public setClient(client: SupabaseClient): void {
    this.client = client;
  }

  /**
   * Get the current Supabase client
   */
  public getClient(): SupabaseClient | null {
    return this.client;
  }

  /**
   * Register a service instance
   */
  public registerService<T extends BaseService>(serviceName: string, serviceInstance: T): T {
    this.services.set(serviceName, serviceInstance);
    return serviceInstance;
  }

  /**
   * Get a service instance by name
   */
  public getService<T extends BaseService>(serviceName: string): T | null {
    const service = this.services.get(serviceName) as T | undefined;
    return service || null;
  }

  /**
   * Get configuration
   */
  public getConfig(): ServiceConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  public updateConfig(config: Partial<ServiceConfig>): void {
    this.config = {
      ...this.config,
      ...config
    };
  }

  /**
   * Clear all registered services
   */
  public clearServices(): void {
    this.services.clear();
  }

  /**
   * Get a list of all registered service names
   */
  public getServiceNames(): string[] {
    return Array.from(this.services.keys());
  }

  /**
   * Initialize all services with the current client
   */
  public initializeServices<T extends { new(client: SupabaseClient | null, config: ServiceConfig): BaseService }>(
    serviceClasses: Record<string, T>
  ): void {
    Object.entries(serviceClasses).forEach(([name, ServiceClass]) => {
      const instance = new ServiceClass(this.client, this.config);
      this.registerService(name, instance);
    });
  }
}

export default ServiceManager; 