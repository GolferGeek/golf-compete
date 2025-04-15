import { ServiceManager } from '@/services/base';
// Remove service imports - they will be instantiated in routes
// import AuthService from '@/services/internal/AuthService';
// import DatabaseService from '@/services/internal/DatabaseService';
// import StorageService from '@/services/internal/StorageService';
// Remove client import - it will be created in routes
// import { createClient } from '@/lib/supabase/server';

// Get the ServiceManager singleton instance
// It won't have any services registered by default now.
const serviceManager = ServiceManager.getInstance();

// --- REMOVE EAGER INITIALIZATION BLOCK ---
/*
if (serviceManager.getServiceNames().length === 0) {
  const supabaseServerClient = createClient(); 
  serviceManager.setClient(supabaseServerClient);
  serviceManager.registerService('auth', new AuthService());
  serviceManager.registerService('database', new DatabaseService());
  serviceManager.registerService('storage', new StorageService());
}
*/

export default serviceManager; // Export the manager instance (likely unused now)

// Remove typed getters - services will be instantiated directly in routes
/*
export const getAuthService = (): AuthService => { ... };
export const getDatabaseService = (): DatabaseService => { ... };
export const getStorageService = (): StorageService => { ... };
*/ 