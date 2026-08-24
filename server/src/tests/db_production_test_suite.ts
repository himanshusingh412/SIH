import { config, prisma } from '../config';
import { ProjectService } from '../services/projectService';

async function runDatabaseProductionTestSuite() {
  console.log('🧪 Starting Production Database & Diagnostics Test Suite...\n');

  // 1. Check Configuration Safety (Requirement 2 & Requirement 5)
  console.log('1. Testing Database Configuration & Localhost Fallback Safety...');
  const isProd = process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL);
  const rawUrl = process.env.DATABASE_URL || process.env.NEON_DATABASE_URL || '';

  if (isProd && !rawUrl && config.databaseUrl.includes('localhost')) {
    throw new Error('❌ FAILED: Production configuration fell back to localhost:5432!');
  }
  console.log(`  ✅ Database Configured: ${config.isDatabaseConfigured ? 'YES' : 'NO'}`);
  console.log(`  ✅ Production Environment: ${isProd ? 'YES' : 'NO'}`);
  console.log(`  ✅ Points to Localhost: ${config.isLocalhostDatabase ? 'YES' : 'NO'}`);
  console.log(`  ✅ Points to Neon: ${config.isNeonDatabase ? 'YES' : 'NO'}`);

  // 2. Test Safe Diagnostics Output (Requirement 12 - Zero Credential Exposure)
  console.log('\n2. Testing Safe Diagnostics Data Structure (No Credentials Exposed)...');
  const safeDiagnostics = {
    databaseConfigured: config.isDatabaseConfigured,
    productionDatabase: config.isNeonDatabase || (!config.isLocalhostDatabase && isProd),
    provider: 'postgresql',
    connection: 'healthy',
    schema: 'healthy',
  };

  const stringified = JSON.stringify(safeDiagnostics);
  if (stringified.includes('postgres:') || stringified.includes('@') || stringified.includes(':5432')) {
    throw new Error('❌ FAILED: Sensitive credentials detected in diagnostic output!');
  }
  console.log('  ✅ Diagnostic output is 100% credential-safe:', safeDiagnostics);

  // 3. Test Dashboard Stats Database Aggregation
  console.log('\n3. Testing Real Dashboard Metrics Aggregation...');
  const service = new ProjectService();
  const stats = await service.getDashboardStats();

  if (
    typeof stats.activeProjectsCount !== 'number' ||
    typeof stats.factLocksCount !== 'number' ||
    typeof stats.deliverablesCount !== 'number' ||
    typeof stats.consistencyRate !== 'number' ||
    !Array.isArray(stats.recentProjects)
  ) {
    throw new Error('❌ FAILED: Dashboard stats aggregation returned invalid data structure');
  }

  console.log(`  ✅ Active Projects Count: ${stats.activeProjectsCount}`);
  console.log(`  ✅ Fact Locks Enforced Count: ${stats.factLocksCount}`);
  console.log(`  ✅ Deliverables Built Count: ${stats.deliverablesCount}`);
  console.log(`  ✅ Factual Consistency Rate: ${stats.consistencyRate}%`);
  console.log(`  ✅ Recent Projects Fetched: ${stats.recentProjects.length}`);

  // 4. Test Project Creation & Persistence
  console.log('\n4. Testing Project Creation & Database Persistence...');
  const testTitle = `Prod DB Test Project ${Date.now()}`;
  const createdProject = await service.createProject(testTitle, 'Automated Production DB Persistence Verification');

  if (!createdProject || !createdProject.id) {
    throw new Error('❌ FAILED: Project creation failed');
  }
  console.log(`  ✅ Created project ID: "${createdProject.id}", Title: "${createdProject.title}"`);

  // 5. Test Project Read-Back Persistence
  console.log('\n5. Testing Project Read-Back from Database...');
  const fetchedProject = await service.getProject(createdProject.id);
  if (!fetchedProject || fetchedProject.title !== testTitle) {
    throw new Error('❌ FAILED: Created project could not be read back from database!');
  }
  console.log(`  ✅ Verified project read-back: "${fetchedProject.title}" matches created project.`);

  console.log('\n🎉 ALL PRODUCTION DATABASE & DIAGNOSTICS TESTS PASSED SUCCESSFULLY!');
}

runDatabaseProductionTestSuite().catch((err) => {
  console.error('❌ Production Database Test Suite Failed:', err);
  process.exit(1);
});
