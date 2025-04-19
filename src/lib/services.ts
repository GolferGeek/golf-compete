import { ServiceManager } from '@/api/base';
// Remove service imports - they will be instantiated in routes
// import AuthService from '@/api/internal/database/AuthService';
// import DatabaseService from '@/api/internal/database/DatabaseService';
// import StorageService from '@/api/internal/database/StorageService';
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